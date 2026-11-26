/**
 * MKR Academy - Dedicated Server-Side Razorpay Signature Verification Logger
 *
 * Logs every Razorpay signature verification attempt (both successes and failures)
 * including:
 *   - rawInputString (`razorpay_order_id|razorpay_payment_id`)
 *   - generatedSignature (HMAC-SHA256 digest computed by server)
 *   - receivedSignature (signature received from Razorpay checkout)
 *
 * Persists immutable diagnostic documents to Cloud Firestore (`razorpay_verification_logs`)
 * using the Firestore REST API authenticated with the caller's verified Firebase ID token,
 * while maintaining a bounded in-memory buffer for immediate admin inspection.
 *
 * SECURITY: NEVER stores or logs RAZORPAY_KEY_SECRET or RAZORPAY_WEBHOOK_SECRET.
 */

import crypto from 'crypto';
import firebaseConfig from '../../firebase-applet-config.json';

export const RAZORPAY_VERIFICATION_LOGS_COLLECTION = 'razorpay_verification_logs';
const MAX_IN_MEMORY_LOGS = 200;
const FIRESTORE_REQUEST_TIMEOUT_MS = 5000;

export type VerificationAttemptType = 'checkout_verify' | 'webhook_verify';
export type VerificationAttemptStatus = 'verified' | 'failed';
export type RazorpayKeyMode = 'live' | 'test' | 'missing' | 'unknown';
export type PayloadFieldFormat = 'snake_case' | 'camelCase' | 'mixed' | 'missing';

export interface RazorpaySignatureVerificationAttemptInput {
  uid: string;
  userEmail?: string;
  attemptType?: VerificationAttemptType;
  status: VerificationAttemptStatus;
  failureCode?: string;
  failureReason?: string;
  orderId?: string;
  productId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  rawInputString: string;
  generatedSignature: string;
  receivedSignature: string;
  signaturesMatch: boolean;
  matchedWebhookSecretInstead?: boolean;
  keyIdPrefix?: string;
  keyMode?: RazorpayKeyMode;
  keySecretLength?: number;
  payloadFormat?: PayloadFieldFormat;
  alreadyProcessed?: boolean;
  /** Caller's verified Firebase ID token used solely for authenticated Firestore REST write (never persisted) */
  authToken?: string;
}

export interface RazorpayVerificationLogRecord {
  logId: string;
  uid: string;
  userEmail: string;
  attemptType: VerificationAttemptType;
  status: VerificationAttemptStatus;
  failureCode: string;
  failureReason: string;
  orderId: string;
  productId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  rawInputString: string;
  generatedSignature: string;
  receivedSignature: string;
  signaturesMatch: boolean;
  matchedWebhookSecretInstead: boolean;
  keyIdConfigured: boolean;
  keyIdPrefix: string;
  keyMode: RazorpayKeyMode;
  keySecretLength: number;
  payloadFormat: PayloadFieldFormat;
  alreadyProcessed: boolean;
  createdAt: string;
}

export interface RazorpaySignatureLogResult {
  loggedToFirestore: boolean;
  logId: string;
  record: RazorpayVerificationLogRecord;
  firestoreError?: string;
}

const recentSignatureVerificationLogs: RazorpayVerificationLogRecord[] = [];

function clampString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') {
    if (value === null || value === undefined) return '';
    return String(value).slice(0, maxLen);
  }
  return value.length > maxLen ? value.slice(0, maxLen) : value;
}

function getFirestoreDatabaseConfig(): { projectId: string; databaseId: string } {
  const projectId = (process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || '').trim();
  const databaseId = (
    process.env.VITE_FIREBASE_DATABASE_ID ||
    (firebaseConfig as any).firestoreDatabaseId ||
    '(default)'
  ).trim();
  return { projectId, databaseId };
}

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number };

function encodeFirestoreFields(record: RazorpayVerificationLogRecord): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, val] of Object.entries(record)) {
    if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'number') {
      fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    } else {
      fields[key] = { stringValue: String(val ?? '') };
    }
  }
  return fields;
}

function decodeFirestoreDocument(docJson: any): RazorpayVerificationLogRecord | null {
  const f = docJson?.fields;
  if (!f || typeof f !== 'object') return null;
  const str = (k: string, fallback = '') => (typeof f[k]?.stringValue === 'string' ? f[k].stringValue : fallback);
  const bool = (k: string, fallback = false) =>
    typeof f[k]?.booleanValue === 'boolean' ? f[k].booleanValue : fallback;
  const num = (k: string, fallback = 0) => {
    if (f[k]?.integerValue !== undefined) return Number(f[k].integerValue) || fallback;
    if (f[k]?.doubleValue !== undefined) return Number(f[k].doubleValue) || fallback;
    return fallback;
  };

  return {
    logId: str('logId'),
    uid: str('uid'),
    userEmail: str('userEmail'),
    attemptType: (str('attemptType', 'checkout_verify') as VerificationAttemptType),
    status: (str('status', 'failed') as VerificationAttemptStatus),
    failureCode: str('failureCode'),
    failureReason: str('failureReason'),
    orderId: str('orderId'),
    productId: str('productId'),
    razorpayOrderId: str('razorpayOrderId'),
    razorpayPaymentId: str('razorpayPaymentId'),
    rawInputString: str('rawInputString'),
    generatedSignature: str('generatedSignature'),
    receivedSignature: str('receivedSignature'),
    signaturesMatch: bool('signaturesMatch'),
    matchedWebhookSecretInstead: bool('matchedWebhookSecretInstead'),
    keyIdConfigured: bool('keyIdConfigured'),
    keyIdPrefix: str('keyIdPrefix'),
    keyMode: (str('keyMode', 'unknown') as RazorpayKeyMode),
    keySecretLength: num('keySecretLength'),
    payloadFormat: (str('payloadFormat', 'missing') as PayloadFieldFormat),
    alreadyProcessed: bool('alreadyProcessed'),
    createdAt: str('createdAt')
  };
}

/**
 * Builds the exact Razorpay signature verification input string: `order_id|payment_id`
 */
export function buildRawSignatureInputString(razorpayOrderId: string, razorpayPaymentId: string): string {
  return `${razorpayOrderId || ''}|${razorpayPaymentId || ''}`;
}

/**
 * Computes lowercase hexadecimal HMAC-SHA256 digest for the given raw input string and secret.
 * Returns empty string if keySecret is absent.
 */
export function computeRazorpayHmacSignature(rawInputString: string, keySecret: string): string {
  if (!keySecret) return '';
  return crypto.createHmac('sha256', keySecret).update(rawInputString).digest('hex');
}

/**
 * Detects whether the request payload passed Razorpay fields in snake_case, camelCase, mixed, or omitted them.
 */
export function detectRazorpayPayloadFormat(body: Record<string, any> | undefined): PayloadFieldFormat {
  if (!body || typeof body !== 'object') return 'missing';
  const hasSnake = Boolean(body.razorpay_order_id || body.razorpay_payment_id || body.razorpay_signature);
  const hasCamel = Boolean(body.razorpayOrderId || body.razorpayPaymentId || body.razorpaySignature);
  if (hasSnake && hasCamel) return 'mixed';
  if (hasSnake) return 'snake_case';
  if (hasCamel) return 'camelCase';
  return 'missing';
}

/**
 * Logs every Razorpay signature verification attempt to:
 * 1) Structured server console diagnostics
 * 2) In-memory ring buffer
 * 3) Cloud Firestore (`razorpay_verification_logs`) via authenticated REST API
 *
 * Non-blocking and fault-tolerant: logging failures never crash checkout verification.
 */
export async function logRazorpaySignatureVerificationAttempt(
  input: RazorpaySignatureVerificationAttemptInput
): Promise<RazorpaySignatureLogResult> {
  const logId = `rzp_sig_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const createdAt = new Date().toISOString();
  const keySecretLength = Math.min(512, Math.max(0, Number(input.keySecretLength) || 0));
  const keyIdPrefix = clampString(input.keyIdPrefix || '', 32);

  const record: RazorpayVerificationLogRecord = {
    logId,
    uid: clampString(input.uid || 'anonymous', 128),
    userEmail: clampString(input.userEmail || '', 150),
    attemptType: input.attemptType === 'webhook_verify' ? 'webhook_verify' : 'checkout_verify',
    status: input.status === 'verified' ? 'verified' : 'failed',
    failureCode: clampString(input.failureCode || (input.status === 'verified' ? 'NONE' : 'UNKNOWN'), 80),
    failureReason: clampString(input.failureReason || '', 500),
    orderId: clampString(input.orderId || '', 128),
    productId: clampString(input.productId || '', 128),
    razorpayOrderId: clampString(input.razorpayOrderId || '', 128),
    razorpayPaymentId: clampString(input.razorpayPaymentId || '', 128),
    rawInputString: clampString(input.rawInputString || '', 300),
    generatedSignature: clampString(input.generatedSignature || '', 256),
    receivedSignature: clampString(input.receivedSignature || '', 256),
    signaturesMatch: Boolean(input.signaturesMatch),
    matchedWebhookSecretInstead: Boolean(input.matchedWebhookSecretInstead),
    keyIdConfigured: Boolean(keyIdPrefix),
    keyIdPrefix,
    keyMode: input.keyMode || 'unknown',
    keySecretLength,
    payloadFormat: input.payloadFormat || 'missing',
    alreadyProcessed: Boolean(input.alreadyProcessed),
    createdAt
  };

  // Store in bounded memory ring buffer
  recentSignatureVerificationLogs.unshift(record);
  if (recentSignatureVerificationLogs.length > MAX_IN_MEMORY_LOGS) {
    recentSignatureVerificationLogs.length = MAX_IN_MEMORY_LOGS;
  }

  // Emit structured diagnostic log on backend
  console.log(
    `[RAZORPAY_SIG_AUDIT] logId=${record.logId} status=${record.status} code=${record.failureCode} ` +
      `uid=${record.uid} orderId=${record.orderId || 'N/A'} rawInput="${record.rawInputString}" ` +
      `generatedSig="${record.generatedSignature}" receivedSig="${record.receivedSignature}" ` +
      `match=${record.signaturesMatch} webhookSecretMatch=${record.matchedWebhookSecretInstead}`
  );

  const authToken = input.authToken?.trim();
  if (!authToken) {
    return {
      loggedToFirestore: false,
      logId,
      record,
      firestoreError: 'Skipped Firestore REST write: no Firebase caller authToken supplied'
    };
  }

  const { projectId, databaseId } = getFirestoreDatabaseConfig();
  if (!projectId) {
    return {
      loggedToFirestore: false,
      logId,
      record,
      firestoreError: 'Missing Firebase projectId configuration'
    };
  }

  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/${encodeURIComponent(databaseId)}/documents/${RAZORPAY_VERIFICATION_LOGS_COLLECTION}` +
    `?documentId=${encodeURIComponent(logId)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FIRESTORE_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fields: encodeFirestoreFields(record)
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      const errMsg = `Firestore REST write failed (HTTP ${response.status}): ${errBody.slice(0, 300)}`;
      console.warn(`[RAZORPAY_SIG_AUDIT_WARN] ${errMsg}`);
      return {
        loggedToFirestore: false,
        logId,
        record,
        firestoreError: errMsg
      };
    }

    return {
      loggedToFirestore: true,
      logId,
      record
    };
  } catch (err: any) {
    const errMsg = err?.message || 'Unknown Firestore REST write error';
    console.warn(`[RAZORPAY_SIG_AUDIT_WARN] Failed writing log ${logId} to Firestore:`, errMsg);
    return {
      loggedToFirestore: false,
      logId,
      record,
      firestoreError: errMsg
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Returns recent Razorpay signature verification logs from Firestore (when admin authToken is provided)
 * merged with the in-memory diagnostic buffer.
 */
export async function fetchRazorpaySignatureVerificationLogs(options?: {
  authToken?: string;
  limit?: number;
}): Promise<{ logs: RazorpayVerificationLogRecord[]; source: 'firestore_and_memory' | 'memory_only' }> {
  const maxItems = Math.min(100, Math.max(1, Number(options?.limit) || 50));
  const mergedMap = new Map<string, RazorpayVerificationLogRecord>();

  for (const item of recentSignatureVerificationLogs) {
    mergedMap.set(item.logId, item);
  }

  const authToken = options?.authToken?.trim();
  const { projectId, databaseId } = getFirestoreDatabaseConfig();
  let fetchedFromFirestore = false;

  if (authToken && projectId) {
    const url =
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
      `/databases/${encodeURIComponent(databaseId)}/documents/${RAZORPAY_VERIFICATION_LOGS_COLLECTION}` +
      `?pageSize=${maxItems}&orderBy=${encodeURIComponent('createdAt desc')}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FIRESTORE_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const docs = Array.isArray(data?.documents) ? data.documents : [];
        for (const docItem of docs) {
          const decoded = decodeFirestoreDocument(docItem);
          if (decoded && decoded.logId) {
            mergedMap.set(decoded.logId, decoded);
          }
        }
        fetchedFromFirestore = true;
      }
    } catch (err) {
      console.warn('[RAZORPAY_SIG_AUDIT_WARN] Could not query Firestore signature logs:', err);
    } finally {
      clearTimeout(timeout);
    }
  }

  const logs = Array.from(mergedMap.values())
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, maxItems);

  return {
    logs,
    source: fetchedFromFirestore ? 'firestore_and_memory' : 'memory_only'
  };
}
