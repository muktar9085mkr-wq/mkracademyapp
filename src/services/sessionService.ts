/**
 * MKR Academy - Active Sessions & Device Management Service
 * Tracks user sessions, devices, operating systems, and allows administrative revocation.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { logAdminActivity } from './auditService';

export interface UserSession {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  deviceType: 'Android' | 'iOS' | 'Desktop' | 'Tablet' | 'Unknown';
  browser: string;
  os: string;
  ipAddress?: string;
  loginAt: string;
  lastActiveAt: string;
  status: 'active' | 'revoked' | 'expired';
  userAgent?: string;
}

/**
 * Detect client device, browser, and OS safely from navigator.userAgent
 */
export function detectDeviceInfo(): {
  deviceType: 'Android' | 'iOS' | 'Desktop' | 'Tablet' | 'Unknown';
  browser: string;
  os: string;
} {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { deviceType: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  }

  const ua = navigator.userAgent;

  // OS Detection
  let os = 'Unknown OS';
  if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'Chrome OS';

  // Device Type
  let deviceType: 'Android' | 'iOS' | 'Desktop' | 'Tablet' | 'Unknown' = 'Desktop';
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/Android.*Mobile|Mobile|iPhone|iPod/i.test(ua)) {
    if (/iPhone|iPod/i.test(ua)) deviceType = 'iOS';
    else deviceType = 'Android';
  } else {
    deviceType = 'Desktop';
  }

  // Browser Detection
  let browser = 'Unknown Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Chromium|Edg/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera';

  return { deviceType, browser, os };
}

/**
 * Record or heartbeat the current student's session upon login or page activity
 */
export async function recordUserSession(user: { uid: string; displayName?: string | null; email?: string | null }): Promise<string | null> {
  if (!user || !user.uid) return null;

  try {
    const sessionKey = `mkr_sess_id_${user.uid}`;
    let existingSessionId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(sessionKey) : null;

    const { deviceType, browser, os } = detectDeviceInfo();
    const now = new Date().toISOString();

    if (!existingSessionId) {
      existingSessionId = `sess_${user.uid}_${Date.now()}`;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(sessionKey, existingSessionId);
      }
    }

    const sessionRef = doc(db, 'user_sessions', existingSessionId);
    await setDoc(
      sessionRef,
      {
        id: existingSessionId,
        uid: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Student',
        userEmail: user.email || '',
        deviceType,
        browser,
        os,
        loginAt: now,
        lastActiveAt: now,
        status: 'active',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 200) : ''
      },
      { merge: true }
    );

    return existingSessionId;
  } catch (err) {
    console.warn('Could not record user session (non-blocking):', err);
    return null;
  }
}

/**
 * Check if the current user's session has been revoked by an administrator
 */
export async function isCurrentSessionRevoked(uid: string): Promise<boolean> {
  try {
    const sessionKey = `mkr_sess_id_${uid}`;
    const sessionId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(sessionKey) : null;
    if (!sessionId) return false;

    const snap = await getDoc(doc(db, 'user_sessions', sessionId));
    if (snap.exists()) {
      const data = snap.data();
      return data.status === 'revoked';
    }
  } catch {
    // Non-blocking on network failure
  }
  return false;
}

/**
 * Admin: Get all active & recent sessions
 */
export async function getAllSessionsAdmin(): Promise<UserSession[]> {
  try {
    const q = query(
      collection(db, 'user_sessions'),
      orderBy('lastActiveAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserSession);
  } catch (err) {
    console.warn('Error fetching all sessions:', err);
    return [];
  }
}

/**
 * Admin: Subscribe to active user sessions in real-time
 */
export function subscribeToSessionsAdmin(onUpdate: (sessions: UserSession[]) => void): () => void {
  try {
    const q = query(
      collection(db, 'user_sessions'),
      orderBy('lastActiveAt', 'desc'),
      limit(100)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as UserSession);
        onUpdate(list);
      },
      (error) => {
        console.warn('Session listener warning:', error);
      }
    );
  } catch (err) {
    console.warn('Could not attach session listener:', err);
    return () => {};
  }
}

/**
 * Admin: Revoke a specific session
 */
export async function revokeSessionAdmin(sessionId: string, adminEmail: string): Promise<void> {
  const sessionRef = doc(db, 'user_sessions', sessionId);
  const snap = await getDoc(sessionRef);
  const sessionData = snap.data() as UserSession | undefined;

  await updateDoc(sessionRef, {
    status: 'revoked',
    revokedAt: new Date().toISOString(),
    revokedBy: adminEmail
  });

  // Log in admin activity logs
  await logAdminActivity({
    action: 'REVOKE_USER_SESSION',
    targetId: sessionId,
    targetType: 'system',
    details: {
      targetUser: sessionData?.userEmail || sessionData?.uid || 'Unknown',
      deviceType: sessionData?.deviceType,
      browser: sessionData?.browser,
      os: sessionData?.os
    }
  });
}

/**
 * Admin: Force logout / revoke ALL active sessions for a specific user
 */
export async function revokeAllUserSessionsAdmin(uid: string, adminEmail: string): Promise<number> {
  const q = query(collection(db, 'user_sessions'), where('uid', '==', uid));
  const snap = await getDocs(q);
  let count = 0;

  for (const docSnap of snap.docs) {
    if (docSnap.data().status === 'active') {
      await updateDoc(docSnap.ref, {
        status: 'revoked',
        revokedAt: new Date().toISOString(),
        revokedBy: adminEmail
      });
      count++;
    }
  }

  await logAdminActivity({
    action: 'FORCE_LOGOUT_USER',
    targetId: uid,
    targetType: 'user',
    details: { revokedSessionCount: count }
  });

  return count;
}
