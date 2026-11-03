import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Order, Purchase, UserProfile, OrderStatus, ReconcileAndCleanupResult } from '../types';

export const ORDERS_COLLECTION = 'orders';
export const ARCHIVED_ORDERS_COLLECTION = 'archived_orders';
export const PURCHASES_COLLECTION = 'purchases';
export const USERS_COLLECTION = 'users';

/**
 * Step 6: Call backend to create Razorpay Order
 */
export async function createBackendPaymentOrder(params: {
  productId: string;
  productTitle: string;
  amountPaise: number;
  studentInfo: {
    name: string;
    email: string;
    phoneNumber: string;
  };
}) {
  const response = await fetch('/api/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to initialize order on server');
  }

  return response.json();
}

/**
 * Step 9: Call backend to verify Razorpay signature
 */
export async function verifyBackendPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  orderId: string;
  productId: string;
  studentId: string;
}) {
  const response = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Server signature verification failed');
  }

  return response.json();
}

/**
 * Record a pending order in Firestore
 */
export async function recordPendingOrder(orderData: Omit<Order, 'createdAt' | 'status'>): Promise<string> {
  const now = new Date().toISOString();
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderData.id);
    const orderDoc: Order = {
      ...orderData,
      status: 'pending',
      createdAt: now,
      updatedAt: (orderData as any).updatedAt || now
    };
    await setDoc(orderRef, orderDoc);
    return orderData.id;
  } catch (error) {
    console.warn('Error recording pending order in Firestore:', error);
    return orderData.id;
  }
}

/**
 * Record a failed/cancelled order in Firestore
 */
export async function recordFailedOrder(orderId: string, reason?: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await setDoc(
      orderRef,
      {
        status: 'failed',
        failedAt: now,
        failureReason: reason || 'Payment cancelled or failed',
        refundStatus: reason || 'Payment cancelled or failed',
        updatedAt: now
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not record failed order status:', err);
  }
}

/**
 * Complete order and create verified purchase entitlement
 * Updates order to 'paid' and creates deterministic purchase record
 */
export async function fulfillVerifiedPurchase(params: {
  orderId: string;
  uid: string;
  productId: string;
  productTitle: string;
  coverImagePath: string;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  driveFileLink?: string;
  pdfStoragePath?: string;
}): Promise<Purchase> {
  const now = new Date().toISOString();
  const purchaseId = `pur_${params.uid}_${params.productId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const purchaseData: Purchase = {
    id: purchaseId,
    uid: params.uid,
    productId: params.productId,
    orderId: params.orderId,
    productTitle: params.productTitle,
    coverImagePath: params.coverImagePath,
    driveFileLink: params.driveFileLink || '',
    pdfStoragePath: params.pdfStoragePath || '',
    entitlementStatus: 'active',
    purchasedAt: now,
    createdAt: now
  };

  // 1. Update order status to 'paid' in Firestore (using setDoc with merge: true)
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, params.orderId);
    await setDoc(
      orderRef,
      {
        status: 'paid',
        razorpayPaymentId: params.razorpayPaymentId,
        razorpayOrderId: params.razorpayOrderId || '',
        verifiedAt: now,
        updatedAt: now
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Order status update in Firestore warning:', err);
  }

  // 2. Deterministic purchase ID prevents duplicate purchases for the same product
  try {
    const purchaseRef = doc(db, PURCHASES_COLLECTION, purchaseId);
    await setDoc(purchaseRef, purchaseData);
  } catch (err) {
    console.warn('Purchase write in Firestore warning:', err);
  }

  return purchaseData;
}

/**
 * Fetch student's purchased notes
 */
export async function getUserPurchases(uid: string): Promise<Purchase[]> {
  if (!uid) return [];
  try {
    const q = query(
      collection(db, PURCHASES_COLLECTION),
      where('uid', '==', uid)
    );
    const querySnapshot = await getDocs(q);
    const purchases: Purchase[] = [];
    querySnapshot.forEach((docSnap) => {
      purchases.push(docSnap.data() as Purchase);
    });
    return purchases.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
  } catch (error) {
    console.warn('Could not read user purchases from Firestore:', error);
    return [];
  }
}

/**
 * Real-time subscription to student's purchased notes.
 * Updates immediately upon purchase completion without page refresh.
 */
export function subscribeToUserPurchases(
  uid: string,
  callback: (purchases: Purchase[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!uid) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(
      collection(db, PURCHASES_COLLECTION),
      where('uid', '==', uid)
    );
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const purchases: Purchase[] = [];
        querySnapshot.forEach((docSnap) => {
          purchases.push(docSnap.data() as Purchase);
        });
        purchases.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
        callback(purchases);
      },
      (error) => {
        console.warn('Real-time purchases subscription warning:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to attach purchases listener:', err);
    callback([]);
    return () => {};
  }
}

/**
 * Fetch all orders for a specific user
 */
export async function getUserOrders(uid: string): Promise<Order[]> {
  if (!uid) return [];
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('uid', '==', uid)
    );
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      orders.push(docSnap.data() as Order);
    });
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Could not load user orders from Firestore:', error);
    return [];
  }
}

/**
 * Admin: Fetch all orders across the platform (one-time)
 */
export async function getAllOrdersAdmin(): Promise<Order[]> {
  try {
    const q = query(collection(db, ORDERS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) } as Order);
    });
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Could not load admin orders from Firestore:', error);
    return [];
  }
}

/**
 * Admin: Real-time subscription to all orders in Firestore
 * Updates instantly when a student completes payment or an order changes status
 */
export function subscribeToAllOrdersAdmin(
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const q = query(collection(db, ORDERS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const orders: Order[] = [];
        querySnapshot.forEach((docSnap) => {
          orders.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) } as Order);
        });
        orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callback(orders);
      },
      (error) => {
        console.warn('Real-time admin orders listener error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to attach admin orders listener:', err);
    return () => {};
  }
}

/**
 * Admin: Manually update an order's status (paid, refunded, failed, pending)
 */
export async function updateOrderStatusAdmin(
  orderId: string,
  status: OrderStatus,
  additionalFields?: Partial<Order>
): Promise<void> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const now = new Date().toISOString();
    await setDoc(
      orderRef,
      {
        status,
        ...additionalFields,
        updatedAt: now,
        ...(status === 'paid' ? { verifiedAt: now } : {})
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}

/**
 * Admin: Manually approve a pending or failed order.
 * - Creates/activates student purchase entitlement in 'purchases' collection with deterministic ID.
 * - Injects Google Drive file link and product cover.
 * - Updates the order status to 'manually_approved' with full audit trail.
 * - Calls server-side audit logging.
 */
export async function manualApproveOrderAdmin(params: {
  orderId: string;
  adminEmail: string;
  adminUid: string;
  razorpayPaymentId?: string;
  remark?: string;
}): Promise<Purchase> {
  const { orderId, adminEmail, adminUid, razorpayPaymentId, remark } = params;
  const now = new Date().toISOString();

  // 1. Fetch the order
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) {
    throw new Error(`Order ${orderId} does not exist`);
  }
  const order = orderSnap.data() as Order;

  // 2. Fetch the corresponding product details to get Drive links & cover
  let productDriveLink = '';
  let productCover = '';
  let productPdfPath = '';
  let productTitle = order.productTitleSnapshot || 'Educational Notes';

  try {
    const productRef = doc(db, 'products', order.productId);
    const prodSnap = await getDoc(productRef);
    if (prodSnap.exists()) {
      const prodData = prodSnap.data() as any;
      productDriveLink = prodData.driveFileLink || '';
      productCover = prodData.coverImagePath || '';
      productPdfPath = prodData.pdfStoragePath || '';
      productTitle = prodData.title || productTitle;
    }
  } catch (err) {
    console.warn('Could not fetch product details during manual approval, using order snapshot:', err);
  }

  // 3. Create or update deterministic purchase entitlement
  const purchaseId = `pur_${order.uid}_${order.productId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const purchaseRef = doc(db, PURCHASES_COLLECTION, purchaseId);

  const paymentIdentifier = razorpayPaymentId?.trim()
    || order.razorpayPaymentId
    || `MANUAL_${Date.now()}`;

  const purchaseData: Purchase = {
    id: purchaseId,
    uid: order.uid,
    productId: order.productId,
    orderId: order.id,
    productTitle,
    coverImagePath: productCover,
    driveFileLink: productDriveLink,
    pdfStoragePath: productPdfPath,
    entitlementStatus: 'active',
    purchasedAt: now,
    createdAt: now,
    approvalMethod: 'admin_manual',
    approvedByAdminEmail: adminEmail,
    approvedAt: now,
    approvalRemark: remark?.trim() || 'Manually approved by administrator'
  };

  await setDoc(purchaseRef, purchaseData, { merge: true });

  // 4. Update the order document
  const orderUpdate: Partial<Order> = {
    status: 'manually_approved',
    razorpayPaymentId: paymentIdentifier,
    verifiedAt: now,
    updatedAt: now,
    approvedAt: now,
    approvedByAdminEmail: adminEmail,
    approvedByAdminUid: adminUid,
    approvalRemark: remark?.trim() || 'Payment verified and approved manually',
    approvalMethod: 'admin_manual'
  };

  await setDoc(orderRef, orderUpdate, { merge: true });

  // 5. Fire background backend call for server-side audit logging
  try {
    fetch('/api/admin/approve-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        adminEmail,
        adminUid,
        razorpayPaymentId: paymentIdentifier,
        remark: remark?.trim() || ''
      })
    }).catch((apiErr) => console.warn('Backend approval logging notice:', apiErr));
  } catch (err) {
    // Non-blocking
  }

  return purchaseData;
}

/**
 * Real-time subscription to orders for a specific student.
 */
export function subscribeToUserOrders(
  uid: string,
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!uid) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('uid', '==', uid)
    );
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const orders: Order[] = [];
        querySnapshot.forEach((docSnap) => {
          orders.push(docSnap.data() as Order);
        });
        orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callback(orders);
      },
      (error) => {
        console.warn('Real-time student orders listener error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to attach student orders listener:', err);
    callback([]);
    return () => {};
  }
}

/**
 * Reconcile orphaned 'pending' orders with verified purchases
 * If a student has an active purchase record, the corresponding order is updated to 'paid'
 */
export async function reconcileOrdersWithPurchases(): Promise<{ reconciledCount: number }> {
  let reconciledCount = 0;
  try {
    const [ordersSnap, purchasesSnap] = await Promise.all([
      getDocs(collection(db, ORDERS_COLLECTION)),
      getDocs(collection(db, PURCHASES_COLLECTION))
    ]);

    const activePurchasesByOrder = new Map<string, Purchase>();
    const activePurchasesByUserProduct = new Map<string, Purchase>();

    purchasesSnap.forEach((docSnap) => {
      const p = docSnap.data() as Purchase;
      if (p.entitlementStatus === 'active') {
        if (p.orderId) activePurchasesByOrder.set(p.orderId, p);
        if (p.uid && p.productId) activePurchasesByUserProduct.set(`${p.uid}_${p.productId}`, p);
      }
    });

    for (const docSnap of ordersSnap.docs) {
      const order = docSnap.data() as Order;
      if (order.status === 'pending') {
        const matchingPurchase =
          activePurchasesByOrder.get(docSnap.id) ||
          activePurchasesByUserProduct.get(`${order.uid}_${order.productId}`);

        if (matchingPurchase) {
          const now = new Date().toISOString();
          await setDoc(
            doc(db, ORDERS_COLLECTION, docSnap.id),
            {
              status: 'paid',
              verifiedAt: matchingPurchase.purchasedAt || now,
              updatedAt: now
            },
            { merge: true }
          );
          reconciledCount++;
        }
      }
    }
  } catch (err) {
    console.warn('Reconcile orders error:', err);
  }
  return { reconciledCount };
}

/**
 * Admin: Fetch all registered student profiles
 */
export async function getAllStudentsAdmin(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const students: UserProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      students.push(docSnap.data() as UserProfile);
    });
    return students;
  } catch (error) {
    console.warn('Could not load admin students from Firestore:', error);
    return [];
  }
}

/**
 * Step 1 Helper: Call backend to verify status with Razorpay
 */
export async function checkPaymentStatusWithRazorpay(params: {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  orderCreatedAt?: string;
}): Promise<{
  status: 'paid' | 'failed' | 'abandoned' | 'pending' | 'uncertain';
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  amountPaise?: number;
  reason?: string;
  verifiedAt?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/payment/check-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      return { status: 'uncertain', error: `Server status error ${res.status}` };
    }
    return await res.json();
  } catch (err: any) {
    console.warn('checkPaymentStatusWithRazorpay fetch failed:', err);
    return { status: 'uncertain', error: err?.message || 'Network error verifying with server' };
  }
}

/**
 * Core Policy Engine:
 * 1. Pending -> Failed after 24 hours, subject to Razorpay payment verification.
 *    - Never mark a verified successful payment as Failed.
 *    - If uncertain or network error, leaves status as pending for retry.
 * 2. Failed entries -> cleared from the active list after 30 days from server failedAt.
 *    - Preserves necessary financial audit records in 'archived_orders' collection.
 *    - NEVER automatically deletes or touches paid records, refunded transactions,
 *      student accounts, products, or purchased notes.
 */
export async function processPendingTimeoutAndFailedCleanup(options?: {
  force24hAgeTest?: boolean;
  force30dAgeTest?: boolean;
}): Promise<ReconcileAndCleanupResult> {
  const result: ReconcileAndCleanupResult = {
    totalPendingExamined: 0,
    recoveredPaidCount: 0,
    markedFailedCount: 0,
    skippedUncertainCount: 0,
    archivedFailedCount: 0,
    details: []
  };

  const now = new Date();
  const nowIso = now.toISOString();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  try {
    const [ordersSnap, purchasesSnap] = await Promise.all([
      getDocs(collection(db, ORDERS_COLLECTION)),
      getDocs(collection(db, PURCHASES_COLLECTION))
    ]);

    const activePurchasesByOrder = new Map<string, Purchase>();
    const activePurchasesByUserProduct = new Map<string, Purchase>();

    purchasesSnap.forEach((docSnap) => {
      const p = docSnap.data() as Purchase;
      if (p.entitlementStatus === 'active') {
        if (p.orderId) activePurchasesByOrder.set(p.orderId, p);
        if (p.uid && p.productId) activePurchasesByUserProduct.set(`${p.uid}_${p.productId}`, p);
      }
    });

    for (const docSnap of ordersSnap.docs) {
      const order = { id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) } as Order;
      const orderRef = doc(db, ORDERS_COLLECTION, docSnap.id);

      // ========================================================
      // RULE 1: Pending to Failed after 24 hours (with Razorpay Verification)
      // ========================================================
      if (order.status === 'pending') {
        result.totalPendingExamined++;
        const createdAtTime = new Date(order.createdAt || 0).getTime();
        const ageMs = now.getTime() - createdAtTime;
        const isOlderThan24h = ageMs >= TWENTY_FOUR_HOURS_MS;

        if (isOlderThan24h || options?.force24hAgeTest) {
          // Check 1: Does this order or student already have an active purchase entitlement?
          const existingPurchase =
            activePurchasesByOrder.get(order.id) ||
            activePurchasesByUserProduct.get(`${order.uid}_${order.productId}`);

          if (existingPurchase) {
            // Already active in student account! Definitively PAID.
            await setDoc(
              orderRef,
              {
                status: 'paid',
                verifiedAt: existingPurchase.purchasedAt || nowIso,
                updatedAt: nowIso,
                lastVerifiedWithRazorpayAt: nowIso,
                razorpayStatusSnapshot: 'verified_active_entitlement'
              },
              { merge: true }
            );
            result.recoveredPaidCount++;
            result.details.push(`Order ${order.id}: Verified as PAID via active student entitlement.`);
            continue;
          }

          // Check 2: Verify live status directly with Razorpay API
          try {
            const razorpayStatus = await checkPaymentStatusWithRazorpay({
              razorpayOrderId: order.razorpayOrderId,
              razorpayPaymentId: order.razorpayPaymentId,
              orderCreatedAt: order.createdAt
            });

            if (razorpayStatus.status === 'paid') {
              // Razorpay confirmed payment was captured!
              // NEVER mark as Failed!
              await setDoc(
                orderRef,
                {
                  status: 'paid',
                  razorpayPaymentId: razorpayStatus.razorpayPaymentId || order.razorpayPaymentId || '',
                  razorpayOrderId: razorpayStatus.razorpayOrderId || order.razorpayOrderId || '',
                  verifiedAt: razorpayStatus.verifiedAt || nowIso,
                  updatedAt: nowIso,
                  lastVerifiedWithRazorpayAt: nowIso,
                  razorpayStatusSnapshot: 'captured'
                },
                { merge: true }
              );

              // Fulfill purchase entitlement so student can access notes
              const purchaseId = `pur_${order.uid}_${order.productId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
              const purchaseRef = doc(db, PURCHASES_COLLECTION, purchaseId);
              const purchaseDoc: Purchase = {
                id: purchaseId,
                uid: order.uid,
                productId: order.productId,
                orderId: order.id,
                productTitle: order.productTitleSnapshot || 'MKR Academy Notes',
                coverImagePath: '',
                entitlementStatus: 'active',
                purchasedAt: nowIso,
                createdAt: nowIso
              };
              await setDoc(purchaseRef, purchaseDoc, { merge: true });

              result.recoveredPaidCount++;
              result.details.push(`Order ${order.id}: Verified PAID with Razorpay (${razorpayStatus.razorpayPaymentId || 'captured'}). Entitlement granted.`);
            } else if (razorpayStatus.status === 'failed' || razorpayStatus.status === 'abandoned') {
              // Definitively verified that payment failed or was abandoned after 24h
              await setDoc(
                orderRef,
                {
                  status: 'failed',
                  failedAt: nowIso,
                  failureReason: razorpayStatus.reason || 'Pending timeout (24h) - Verified uncaptured with Razorpay',
                  updatedAt: nowIso,
                  lastVerifiedWithRazorpayAt: nowIso,
                  razorpayStatusSnapshot: razorpayStatus.status
                },
                { merge: true }
              );
              result.markedFailedCount++;
              result.details.push(`Order ${order.id}: Changed to FAILED after 24h timeout (Razorpay: ${razorpayStatus.status}).`);
            } else {
              // Uncertain, network error, or pending retry
              // NEVER mark as failed when uncertain!
              await setDoc(
                orderRef,
                {
                  updatedAt: nowIso,
                  lastVerifiedWithRazorpayAt: nowIso,
                  razorpayStatusSnapshot: 'uncertain_retry_later'
                },
                { merge: true }
              );
              result.skippedUncertainCount++;
              result.details.push(`Order ${order.id}: Verification uncertain (${razorpayStatus.error || 'pending'}). Preserved as pending.`);
            }
          } catch (verifyErr: any) {
            console.warn(`Error verifying order ${order.id} with Razorpay:`, verifyErr);
            result.skippedUncertainCount++;
            result.details.push(`Order ${order.id}: Network/API error. Preserved as pending.`);
          }
        }
      }

      // ========================================================
      // RULE 2: 30-Day Failed Payment Cleanup with Financial Audit Preservation
      // ========================================================
      if (order.status === 'failed' && !order.isArchived) {
        // STRICT DATA PROTECTION: Only orders with status === 'failed' can be archived
        // Never touch paid, refunded, products, or users!
        const failedTimestamp = order.failedAt
          ? new Date(order.failedAt).getTime()
          : new Date(order.updatedAt || order.createdAt || 0).getTime();

        const failedAgeMs = now.getTime() - failedTimestamp;
        const isOlderThan30d = failedAgeMs >= THIRTY_DAYS_MS;

        if (isOlderThan30d || options?.force30dAgeTest) {
          try {
            // 1. Archive to 'archived_orders' collection to preserve audit trail
            const archiveRef = doc(db, ARCHIVED_ORDERS_COLLECTION, order.id);
            await setDoc(archiveRef, {
              ...order,
              status: 'failed',
              isArchived: true,
              archivedAt: nowIso,
              archiveReason: 'Expired failed payment (cleared from active list after 30 days per policy)'
            });

            // 2. Remove from active 'orders' collection
            await deleteDoc(orderRef);

            result.archivedFailedCount++;
            result.details.push(`Order ${order.id}: Archived failed order (>30 days) to preserved audit archive.`);
          } catch (archiveErr) {
            console.warn(`Failed to archive order ${order.id}:`, archiveErr);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in processPendingTimeoutAndFailedCleanup:', error);
  }

  return result;
}

/**
 * Admin: Fetch all archived failed orders for audit review
 */
export async function getArchivedOrdersAdmin(): Promise<Order[]> {
  try {
    const q = query(collection(db, ARCHIVED_ORDERS_COLLECTION));
    const snap = await getDocs(q);
    const archived: Order[] = [];
    snap.forEach((docSnap) => {
      archived.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) } as Order);
    });
    return archived.sort((a, b) => new Date(b.archivedAt || b.createdAt || 0).getTime() - new Date(a.archivedAt || a.createdAt || 0).getTime());
  } catch (err) {
    console.warn('Could not read archived orders:', err);
    return [];
  }
}

