/**
 * MKR Academy - Advanced User Management System Service
 * Searchable user directory, detailed profile drawer, status management (verify, suspend, block, restore)
 * and administrative audit tracking.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile, Order, Purchase } from '../types';
import { logAdminActivity } from './auditService';
import { getAllOrdersAdmin } from './orderService';

export interface UserManagementItem extends UserProfile {
  totalPurchasesCount: number;
  totalSpentRupees: number;
  successfulOrders: Order[];
  failedOrders: Order[];
  purchasedItems: Purchase[];
  accountStatus: 'active' | 'suspended' | 'blocked';
  isAccountVerified: boolean;
  registrationDateFormatted: string;
}

/**
 * Fetch all users and correlate with real purchase & order history
 */
export async function getAllUsersWithStatsAdmin(): Promise<UserManagementItem[]> {
  try {
    const [usersSnap, ordersSnap, purchasesSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(500))),
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'purchases'))
    ]);

    const allOrders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    const allPurchases = purchasesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Purchase));

    // Map orders by student UID
    const ordersByUid = new Map<string, Order[]>();
    for (const o of allOrders) {
      if (o.uid) {
        const list = ordersByUid.get(o.uid) || [];
        list.push(o);
        ordersByUid.set(o.uid, list);
      }
    }

    // Map purchases by student UID
    const purchasesByUid = new Map<string, Purchase[]>();
    for (const p of allPurchases) {
      if (p.uid) {
        const list = purchasesByUid.get(p.uid) || [];
        list.push(p);
        purchasesByUid.set(p.uid, list);
      }
    }

    const result: UserManagementItem[] = usersSnap.docs.map((docSnap) => {
      const user = docSnap.data() as UserProfile;
      const userOrders = ordersByUid.get(user.uid) || [];
      const userPurchases = purchasesByUid.get(user.uid) || [];

      const successfulOrders = userOrders.filter(
        (o) => o.status === 'paid' || o.status === 'manually_approved'
      );
      const failedOrders = userOrders.filter((o) => o.status === 'failed');

      const totalSpentPaise = successfulOrders.reduce(
        (sum, o) => sum + (o.amountPaise || 0),
        0
      );

      const regDate = user.createdAt ? new Date(user.createdAt) : new Date();
      const registrationDateFormatted = isNaN(regDate.getTime())
        ? 'N/A'
        : regDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });

      const accountStatus = user.status || 'active';
      const isAccountVerified = Boolean(user.isVerified || user.emailVerified);

      return {
        ...user,
        accountStatus,
        isAccountVerified,
        registrationDateFormatted,
        totalPurchasesCount: userPurchases.length || successfulOrders.length,
        totalSpentRupees: totalSpentPaise / 100,
        successfulOrders,
        failedOrders,
        purchasedItems: userPurchases
      };
    });

    return result;
  } catch (err) {
    console.error('Error in getAllUsersWithStatsAdmin:', err);
    return [];
  }
}

/**
 * Admin: Verify or Unverify a student account
 */
export async function toggleUserVerificationAdmin(
  uid: string,
  verified: boolean,
  adminEmail: string
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    isVerified: verified,
    emailVerified: verified,
    verifiedAt: verified ? new Date().toISOString() : null,
    verifiedBy: verified ? adminEmail : null,
    updatedAt: new Date().toISOString()
  });

  await logAdminActivity({
    action: 'TOGGLE_USER_VERIFICATION',
    targetId: uid,
    targetType: 'user',
    details: { verified, adminEmail }
  });
}

/**
 * Admin: Temporarily suspend a user
 */
export async function suspendUserAdmin(
  uid: string,
  reason: string,
  adminEmail: string
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const now = new Date().toISOString();
  await updateDoc(userRef, {
    status: 'suspended',
    suspendedAt: now,
    suspendedBy: adminEmail,
    suspendedReason: reason || 'Administrative temporary suspension',
    updatedAt: now
  });

  await logAdminActivity({
    action: 'SUSPEND_USER',
    targetId: uid,
    targetType: 'user',
    details: { reason, adminEmail }
  });
}

/**
 * Admin: Block a user
 */
export async function blockUserAdmin(
  uid: string,
  reason: string,
  adminEmail: string
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const now = new Date().toISOString();
  await updateDoc(userRef, {
    status: 'blocked',
    blockedAt: now,
    blockedBy: adminEmail,
    blockedReason: reason || 'Administrative block for security/policy violation',
    updatedAt: now
  });

  await logAdminActivity({
    action: 'BLOCK_USER',
    targetId: uid,
    targetType: 'user',
    details: { reason, adminEmail }
  });
}

/**
 * Admin: Restore a suspended or blocked user account
 */
export async function restoreUserAccountAdmin(
  uid: string,
  adminEmail: string
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const now = new Date().toISOString();
  await updateDoc(userRef, {
    status: 'active',
    restoredAt: now,
    restoredBy: adminEmail,
    suspendedReason: null,
    blockedReason: null,
    updatedAt: now
  });

  await logAdminActivity({
    action: 'RESTORE_USER_ACCOUNT',
    targetId: uid,
    targetType: 'user',
    details: { adminEmail }
  });
}
