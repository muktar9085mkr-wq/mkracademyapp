import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Order, Purchase, UserProfile, OrderStatus } from '../types';

export const ORDERS_COLLECTION = 'orders';
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
