/**
 * MKR Academy — Production Firebase Cloud Functions
 * 
 * Scheduled Daily Maintenance:
 * 1. Pending -> Failed after 24 hours, subject to Razorpay payment verification.
 *    - Never mark a verified successful payment as Failed.
 * 2. Failed entries -> cleared from the active list after 30 days from server failedAt.
 *    - Preserves necessary financial audit records in 'archived_orders' collection.
 * 3. Data Protection:
 *    - Never deletes or touches paid records, refunded transactions, products, or students.
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Credentials (configured via environment variables or fallbacks)
const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID || 'rzp_live_TqPdwQmi6yOprh';
const getRazorpayKeySecret = () => process.env.RAZORPAY_KEY_SECRET || 'eIJMyjZbJkBgLgWB59HYX7hn';

/**
 * Verify order status directly with Razorpay API
 */
async function queryRazorpayStatus(order) {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const headers = { Authorization: authHeader, 'Content-Type': 'application/json' };

  if (order.razorpayPaymentId && order.razorpayPaymentId.startsWith('pay_')) {
    try {
      const res = await fetch(`https://api.razorpay.com/v1/payments/${order.razorpayPaymentId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'captured') {
          return { status: 'paid', paymentId: order.razorpayPaymentId, amount: data.amount };
        }
        if (data.status === 'failed') {
          return { status: 'failed', reason: data.error_description || 'Payment failed on Razorpay' };
        }
      }
    } catch (e) {
      return { status: 'uncertain', error: e.message };
    }
  }

  if (order.razorpayOrderId && order.razorpayOrderId.startsWith('order_')) {
    try {
      const res = await fetch(`https://api.razorpay.com/v1/orders/${order.razorpayOrderId}`, { headers });
      if (res.ok) {
        const orderData = await res.json();
        if (orderData.status === 'paid' && orderData.amount_paid > 0) {
          return { status: 'paid', amount: orderData.amount_paid };
        }

        const pRes = await fetch(`https://api.razorpay.com/v1/orders/${order.razorpayOrderId}/payments`, { headers });
        if (pRes.ok) {
          const pData = await pRes.json();
          const items = pData.items || [];
          const captured = items.find(p => p.status === 'captured');
          if (captured) {
            return { status: 'paid', paymentId: captured.id, amount: captured.amount };
          }
          const allFailed = items.length > 0 && items.every(p => p.status === 'failed');
          if (allFailed) {
            return { status: 'failed', reason: items[0]?.error_description || 'Payment attempts failed' };
          }
          if (items.length === 0) {
            return { status: 'abandoned', reason: 'No payment attempted within 24 hours' };
          }
        }
      }
    } catch (e) {
      return { status: 'uncertain', error: e.message };
    }
  }

  return { status: 'abandoned', reason: 'No Razorpay order created; checkout abandoned >24h' };
}

/**
 * Execute daily payment maintenance cycle
 */
async function executePaymentMaintenance() {
  const now = Date.now();
  const nowIso = new Date().toISOString();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  console.log(`[Cloud Function] Starting payment reconciliation and cleanup at ${nowIso}...`);

  const [ordersSnap, purchasesSnap] = await Promise.all([
    db.collection('orders').get(),
    db.collection('purchases').get()
  ]);

  const activePurchases = new Set();
  purchasesSnap.forEach(docSnap => {
    const p = docSnap.data();
    if (p.entitlementStatus === 'active') {
      if (p.orderId) activePurchases.add(p.orderId);
      if (p.uid && p.productId) activePurchases.add(`${p.uid}_${p.productId}`);
    }
  });

  let pendingExamined = 0;
  let recoveredPaid = 0;
  let markedFailed = 0;
  let skippedUncertain = 0;
  let archivedFailed = 0;

  for (const docSnap of ordersSnap.docs) {
    const order = { id: docSnap.id, ...docSnap.data() };
    const orderRef = db.collection('orders').doc(docSnap.id);

    // Rule 1: Pending -> Failed after 24 hours (with Razorpay Verification)
    if (order.status === 'pending') {
      pendingExamined++;
      const createdAtMs = new Date(order.createdAt || 0).getTime();
      const ageMs = now - createdAtMs;

      if (ageMs >= TWENTY_FOUR_HOURS_MS) {
        // If student already has active entitlement, definitely paid
        if (activePurchases.has(order.id) || activePurchases.has(`${order.uid}_${order.productId}`)) {
          await orderRef.update({
            status: 'paid',
            verifiedAt: order.verifiedAt || nowIso,
            updatedAt: nowIso,
            lastVerifiedWithRazorpayAt: nowIso,
            razorpayStatusSnapshot: 'verified_active_entitlement'
          });
          recoveredPaid++;
          continue;
        }

        // Verify status with Razorpay
        const rzpStatus = await queryRazorpayStatus(order);

        if (rzpStatus.status === 'paid') {
          // Never mark verified paid as failed!
          await orderRef.update({
            status: 'paid',
            razorpayPaymentId: rzpStatus.paymentId || order.razorpayPaymentId || '',
            verifiedAt: nowIso,
            updatedAt: nowIso,
            lastVerifiedWithRazorpayAt: nowIso,
            razorpayStatusSnapshot: 'captured'
          });

          // Grant entitlement
          const purchaseId = `pur_${order.uid}_${order.productId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
          await db.collection('purchases').doc(purchaseId).set({
            id: purchaseId,
            uid: order.uid,
            productId: order.productId,
            orderId: order.id,
            productTitle: order.productTitleSnapshot || 'MKR Academy Notes',
            coverImagePath: '',
            entitlementStatus: 'active',
            purchasedAt: nowIso,
            createdAt: nowIso
          }, { merge: true });

          recoveredPaid++;
        } else if (rzpStatus.status === 'failed' || rzpStatus.status === 'abandoned') {
          await orderRef.update({
            status: 'failed',
            failedAt: nowIso,
            failureReason: rzpStatus.reason || 'Pending timeout (24h) - Verified uncaptured with Razorpay',
            updatedAt: nowIso,
            lastVerifiedWithRazorpayAt: nowIso,
            razorpayStatusSnapshot: rzpStatus.status
          });
          markedFailed++;
        } else {
          // Uncertain: keep pending
          await orderRef.update({
            updatedAt: nowIso,
            lastVerifiedWithRazorpayAt: nowIso,
            razorpayStatusSnapshot: 'uncertain_retry_later'
          });
          skippedUncertain++;
        }
      }
    }

    // Rule 2: 30-Day Failed Payment Cleanup with Financial Audit Preservation
    if (order.status === 'failed' && !order.isArchived) {
      const failedMs = order.failedAt
        ? new Date(order.failedAt).getTime()
        : new Date(order.updatedAt || order.createdAt || 0).getTime();

      const failedAgeMs = now - failedMs;
      if (failedAgeMs >= THIRTY_DAYS_MS) {
        // Archive to preserved collection
        await db.collection('archived_orders').doc(order.id).set({
          ...order,
          status: 'failed',
          isArchived: true,
          archivedAt: nowIso,
          archiveReason: 'Expired failed payment (cleared after 30 days per policy)'
        });
        // Remove from active collection
        await orderRef.delete();
        archivedFailed++;
      }
    }
  }

  console.log(`[Cloud Function] Finished: Examined=${pendingExamined}, Paid=${recoveredPaid}, Failed=${markedFailed}, Uncertain=${skippedUncertain}, Archived=${archivedFailed}`);
  return { pendingExamined, recoveredPaid, markedFailed, skippedUncertain, archivedFailed };
}

/**
 * Scheduled Cloud Function running daily (every 24 hours)
 */
exports.dailyPaymentReconciliationAndCleanup = onSchedule('every 24 hours', async (event) => {
  return await executePaymentMaintenance();
});

/**
 * HTTPS trigger for manual/webhook execution
 */
exports.reconcilePaymentsHttp = onRequest(async (req, res) => {
  const result = await executePaymentMaintenance();
  res.json({ success: true, result });
});
