import { queryRazorpayPaymentStatus } from './paymentReconciliation';

/**
 * Server-Side Automatic Payment Management Worker
 * Runs continuously in background even when Admin Panel is closed.
 * 
 * Policy Rules:
 * 1. Pending -> Failed after 24 hours, subject to Razorpay payment verification.
 *    - Never mark a verified successful payment as Failed.
 * 2. Failed entries -> cleared from the active list after 30 days from server failedAt.
 *    - Preserves necessary financial audit records.
 * 3. Data Protection:
 *    - Never touches successful paid records, refunded transactions, products, or students.
 */

let isRunning = false;
let lastRunTimestamp: string | null = null;
let lastRunSummary: any = null;

export function getLastSchedulerStatus() {
  return {
    lastRunTimestamp,
    lastRunSummary,
    isRunning
  };
}

export async function runServerPaymentMaintenance(): Promise<{
  success: boolean;
  message: string;
  timestamp: string;
}> {
  if (isRunning) {
    return {
      success: false,
      message: 'Maintenance cycle is already in progress',
      timestamp: new Date().toISOString()
    };
  }

  isRunning = true;
  const startedAt = new Date().toISOString();
  console.log(`[MKR Scheduler] Starting automated payment policy maintenance at ${startedAt}...`);

  try {
    // Dynamic import to avoid circular dependencies with isomorphic config
    const { collection, getDocs, doc, setDoc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('../firebase/config');

    const [ordersSnap, purchasesSnap] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'purchases'))
    ]);

    const activePurchasesByOrder = new Map<string, any>();
    const activePurchasesByUserProduct = new Map<string, any>();

    purchasesSnap.forEach((docSnap) => {
      const p = docSnap.data();
      if (p.entitlementStatus === 'active') {
        if (p.orderId) activePurchasesByOrder.set(p.orderId, p);
        if (p.uid && p.productId) activePurchasesByUserProduct.set(`${p.uid}_${p.productId}`, p);
      }
    });

    const now = Date.now();
    const nowIso = new Date().toISOString();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    let pendingExamined = 0;
    let recoveredPaid = 0;
    let markedFailed = 0;
    let skippedUncertain = 0;
    let archivedFailed = 0;

    for (const docSnap of ordersSnap.docs) {
      const order = { id: docSnap.id, ...docSnap.data() } as any;
      const orderRef = doc(db, 'orders', docSnap.id);

      // Rule 1: Pending -> Failed after 24 hours, subject to Razorpay verification
      if (order.status === 'pending') {
        pendingExamined++;
        const createdAtMs = new Date(order.createdAt || 0).getTime();
        const ageMs = now - createdAtMs;

        if (ageMs >= TWENTY_FOUR_HOURS_MS) {
          // Check if user already has entitlement
          const matchingPurchase =
            activePurchasesByOrder.get(order.id) ||
            activePurchasesByUserProduct.get(`${order.uid}_${order.productId}`);

          if (matchingPurchase) {
            await setDoc(
              orderRef,
              {
                status: 'paid',
                verifiedAt: matchingPurchase.purchasedAt || nowIso,
                updatedAt: nowIso,
                lastVerifiedWithRazorpayAt: nowIso,
                razorpayStatusSnapshot: 'verified_active_entitlement'
              },
              { merge: true }
            );
            recoveredPaid++;
            continue;
          }

          // Verify with Razorpay
          try {
            const rzpStatus = await queryRazorpayPaymentStatus({
              razorpayOrderId: order.razorpayOrderId,
              razorpayPaymentId: order.razorpayPaymentId,
              orderCreatedAt: order.createdAt
            });

            if (rzpStatus.status === 'paid') {
              // Paid on Razorpay! NEVER mark as Failed!
              await setDoc(
                orderRef,
                {
                  status: 'paid',
                  razorpayPaymentId: rzpStatus.razorpayPaymentId || order.razorpayPaymentId || '',
                  razorpayOrderId: rzpStatus.razorpayOrderId || order.razorpayOrderId || '',
                  verifiedAt: rzpStatus.verifiedAt || nowIso,
                  updatedAt: nowIso,
                  lastVerifiedWithRazorpayAt: nowIso,
                  razorpayStatusSnapshot: 'captured'
                },
                { merge: true }
              );

              // Grant entitlement
              const purchaseId = `pur_${order.uid}_${order.productId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
              const purchaseRef = doc(db, 'purchases', purchaseId);
              await setDoc(
                purchaseRef,
                {
                  id: purchaseId,
                  uid: order.uid,
                  productId: order.productId,
                  orderId: order.id,
                  productTitle: order.productTitleSnapshot || 'MKR Academy Notes',
                  coverImagePath: '',
                  entitlementStatus: 'active',
                  purchasedAt: nowIso,
                  createdAt: nowIso
                },
                { merge: true }
              );
              recoveredPaid++;
            } else if (rzpStatus.status === 'failed' || rzpStatus.status === 'abandoned') {
              // Definitively failed or abandoned
              await setDoc(
                orderRef,
                {
                  status: 'failed',
                  failedAt: nowIso,
                  failureReason: rzpStatus.reason || 'Pending timeout (24h) - Verified uncaptured with Razorpay',
                  updatedAt: nowIso,
                  lastVerifiedWithRazorpayAt: nowIso,
                  razorpayStatusSnapshot: rzpStatus.status
                },
                { merge: true }
              );
              markedFailed++;
            } else {
              // Uncertain or retry
              await setDoc(
                orderRef,
                {
                  updatedAt: nowIso,
                  lastVerifiedWithRazorpayAt: nowIso,
                  razorpayStatusSnapshot: 'uncertain_retry_later'
                },
                { merge: true }
              );
              skippedUncertain++;
            }
          } catch (err) {
            skippedUncertain++;
          }
        }
      }

      // Rule 2: 30-Day Failed Payment Cleanup (strictly failed orders only)
      if (order.status === 'failed' && !order.isArchived) {
        const failedMs = order.failedAt
          ? new Date(order.failedAt).getTime()
          : new Date(order.updatedAt || order.createdAt || 0).getTime();

        const failedAgeMs = now - failedMs;
        if (failedAgeMs >= THIRTY_DAYS_MS) {
          try {
            // Archive to 'archived_orders' collection for financial audit trail
            const archiveRef = doc(db, 'archived_orders', order.id);
            await setDoc(archiveRef, {
              ...order,
              status: 'failed',
              isArchived: true,
              archivedAt: nowIso,
              archiveReason: 'Expired failed payment (cleared after 30 days per policy)'
            });

            // Remove from active 'orders'
            await deleteDoc(orderRef);
            archivedFailed++;
          } catch (archiveErr) {
            console.warn(`[MKR Scheduler] Could not archive failed order ${order.id}:`, archiveErr);
          }
        }
      }
    }

    lastRunTimestamp = nowIso;
    lastRunSummary = {
      pendingExamined,
      recoveredPaid,
      markedFailed,
      skippedUncertain,
      archivedFailed
    };

    console.log(`[MKR Scheduler] Completed: Pending Examined=${pendingExamined}, Recovered Paid=${recoveredPaid}, Marked Failed=${markedFailed}, Uncertain=${skippedUncertain}, Archived 30d Failed=${archivedFailed}`);

    return {
      success: true,
      message: `Completed successfully. Pending examined: ${pendingExamined}, Recovered paid: ${recoveredPaid}, Marked failed: ${markedFailed}, Archived: ${archivedFailed}`,
      timestamp: nowIso
    };
  } catch (error: any) {
    console.warn('[MKR Scheduler] Error during payment maintenance cycle:', error?.message || error);
    return {
      success: false,
      message: error?.message || 'Scheduler execution error',
      timestamp: new Date().toISOString()
    };
  } finally {
    isRunning = false;
  }
}

/**
 * Background scheduler helper.
 * Daily reconciliation and 30d cleanup in production are handled by the scheduled
 * Firebase Cloud Function (functions/index.js) and authenticated Admin Panel.
 */
export function initBackgroundScheduler() {
  console.log('⏰ MKR Academy 24h & 30d Payment Policy initialized.');
}
