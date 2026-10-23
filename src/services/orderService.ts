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
import { Order, Purchase, UserProfile } from '../types';

const ORDERS_COLLECTION = 'orders';
const PURCHASES_COLLECTION = 'purchases';
const USERS_COLLECTION = 'users';

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
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderData.id);
    const orderDoc: Order = {
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await setDoc(orderRef, orderDoc);
    return orderData.id;
  } catch (error) {
    console.warn('Error recording pending order in Firestore:', error);
    return orderData.id;
  }
}

/**
 * Complete order and create verified purchase entitlement
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

  try {
    // 1. Update order status to paid
    const orderRef = doc(db, ORDERS_COLLECTION, params.orderId);
    await updateDoc(orderRef, {
      status: 'paid',
      razorpayPaymentId: params.razorpayPaymentId,
      razorpayOrderId: params.razorpayOrderId || '',
      verifiedAt: now
    });
  } catch (err) {
    console.warn('Order status update in Firestore skipped/failed:', err);
  }

  try {
    // 2. Deterministic purchase ID prevents duplicate purchases
    const purchaseRef = doc(db, PURCHASES_COLLECTION, purchaseId);
    await setDoc(purchaseRef, purchaseData);
  } catch (err) {
    console.warn('Purchase write in Firestore skipped/failed:', err);
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
  * Updates immediately upon login or purchase completion without page refresh.
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
 * Admin: Fetch all orders across the platform
 */
export async function getAllOrdersAdmin(): Promise<Order[]> {
  try {
    const q = query(collection(db, ORDERS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      orders.push(docSnap.data() as Order);
    });
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Could not load admin orders from Firestore:', error);
    return [];
  }
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
