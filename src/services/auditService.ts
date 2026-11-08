/**
 * MKR Academy - Admin Activity Logging Service (Improvement 12)
 * Maintains an immutable, append-only forensic audit trail of all administrative actions.
 */

import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export const AUDIT_LOGS_COLLECTION = 'admin_activity_logs';

export interface AdminActivityLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  targetId: string;
  targetType: 'product' | 'order' | 'settings' | 'banner' | 'user' | 'system';
  details?: Record<string, any>;
  timestamp: string;
  createdAt: string;
}

/**
 * Sanitizes log details to ensure passwords, secrets, and private payment data are NEVER logged
 */
function sanitizeAuditDetails(details?: Record<string, any>): Record<string, any> {
  if (!details || typeof details !== 'object') return {};

  const sanitized: Record<string, any> = {};
  const REDACTED_KEYS = [
    'password', 'pass', 'secret', 'keysecret', 'razorpaykeysecret',
    'token', 'refreshtoken', 'idtoken', 'credential', 'auth', 'card', 'cvv'
  ];

  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.some((k) => lowerKey.includes(k))) {
      sanitized[key] = '[REDACTED_SENSITIVE_DATA]';
    } else if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = value.substring(0, 500) + '...[TRUNCATED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Appends an authoritative administrative activity log entry to Firestore
 */
export async function logAdminActivity(params: {
  action: string;
  targetId?: string;
  targetType: 'product' | 'order' | 'settings' | 'banner' | 'user' | 'system';
  details?: Record<string, any>;
}): Promise<void> {
  const currentUser = auth.currentUser;
  const adminUid = currentUser?.uid || 'system_service';
  const adminEmail = currentUser?.email || 'muktar9085mkr@gmail.com';
  const now = new Date().toISOString();
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const logEntry: AdminActivityLog = {
    id: logId,
    adminUid,
    adminEmail,
    action: params.action,
    targetId: params.targetId || 'N/A',
    targetType: params.targetType,
    details: sanitizeAuditDetails(params.details),
    timestamp: now,
    createdAt: now
  };

  // 1. Commit to Firestore collection (append-only)
  try {
    const logRef = doc(db, AUDIT_LOGS_COLLECTION, logId);
    await setDoc(logRef, logEntry);
  } catch (err) {
    console.warn('Warning: Could not commit admin audit log to Firestore:', err);
  }

  // 2. Transmit to server audit endpoint for backend logging
  try {
    const token = currentUser ? await currentUser.getIdToken() : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/admin/audit-log', {
      method: 'POST',
      headers,
      body: JSON.stringify(logEntry)
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}

/**
 * Fetches recent admin activity logs for display in the Admin Dashboard
 */
export async function getRecentAdminActivityLogs(maxRecords = 50): Promise<AdminActivityLog[]> {
  try {
    const q = query(
      collection(db, AUDIT_LOGS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(maxRecords)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AdminActivityLog);
  } catch (err) {
    console.warn('Could not fetch recent admin activity logs:', err);
    return [];
  }
}
