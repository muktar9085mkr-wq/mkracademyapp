/**
 * MKR Academy - Server-Side Verified Order & Purchase Persistence Service
 *
 * Persists verified Razorpay order status (`paid`) and student purchase entitlement
 * (`purchases/pur_{uid}_{productId}`) to Cloud Firestore right after HMAC-SHA256
 * signature verification succeeds on the backend.
 *
 * Uses the Firestore REST API authenticated with the caller's verified Firebase ID token,
 * enforcing the exact Firestore Security Rules and preventing duplicate purchases.
 */

import firebaseConfig from '../../firebase-applet-config.json';
import { Order, ProductPdfEntry, Purchase } from '../types';

const FIRESTORE_TIMEOUT_MS = 6000;

function getFirestoreDbTarget(): { projectId: string; databaseId: string } {
  const projectId = (process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || '').trim();
  const databaseId = (
    process.env.VITE_FIREBASE_DATABASE_ID ||
    (firebaseConfig as any).firestoreDatabaseId ||
    '(default)'
  ).trim();
  return { projectId, databaseId };
}

function encodeFsValue(val: unknown): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: val.length > 0 ? { values: val.map((item) => encodeFsValue(item)) } : {}
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        fields[k] = encodeFsValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function decodeFsValue(fsVal: any): any {
  if (!fsVal || typeof fsVal !== 'object') return undefined;
  if ('stringValue' in fsVal) return fsVal.stringValue;
  if ('booleanValue' in fsVal) return fsVal.booleanValue;
  if ('integerValue' in fsVal) return Number(fsVal.integerValue);
  if ('doubleValue' in fsVal) return Number(fsVal.doubleValue);
  if ('nullValue' in fsVal) return null;
  if ('arrayValue' in fsVal) {
    const arr = fsVal.arrayValue?.values;
    return Array.isArray(arr) ? arr.map(decodeFsValue) : [];
  }
  if ('mapValue' in fsVal) {
    const out: Record<string, any> = {};
    const fields = fsVal.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = decodeFsValue(v);
    }
    return out;
  }
  return undefined;
}

function decodeFsDoc(docJson: any): Record<string, any> | null {
  if (!docJson?.fields || typeof docJson.fields !== 'object') return null;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(docJson.fields)) {
    out[k] = decodeFsValue(v);
  }
  return out;
}

async function firestoreRestFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIRESTORE_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export interface PersistVerifiedPurchaseParams {
  authToken: string;
  orderId: string;
  uid: string;
  userEmail?: string;
  studentName?: string;
  productId: string;
  productTitle: string;
  coverImagePath: string;
  driveFileLink?: string;
  pdfStoragePath?: string;
  pdfList?: ProductPdfEntry[];
  amountPaise: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  verifiedAt: string;
}

export interface PersistVerifiedPurchaseResult {
  synced: boolean;
  alreadyPurchased: boolean;
  purchase: Purchase;
  error?: string;
}

/**
 * Ensures the verified Razorpay order is marked `paid` and creates a deterministic,
 * duplicate-free `purchases/{purchaseId}` record in Cloud Firestore.
 */
export async function persistVerifiedOrderAndPurchase(
  params: PersistVerifiedPurchaseParams
): Promise<PersistVerifiedPurchaseResult> {
  const purchaseId = `pur_${params.uid}_${params.productId}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  const fallbackPurchase: Purchase = {
    id: purchaseId,
    uid: params.uid,
    productId: params.productId,
    orderId: params.orderId,
    razorpayOrderId: params.razorpayOrderId,
    razorpayPaymentId: params.razorpayPaymentId,
    paymentStatus: 'PAID',
    productTitle: params.productTitle,
    coverImagePath: params.coverImagePath,
    driveFileLink: params.driveFileLink || '',
    pdfStoragePath: params.pdfStoragePath || '',
    pdfList: Array.isArray(params.pdfList) ? params.pdfList : [],
    entitlementStatus: 'active',
    approvalMethod: 'razorpay_automatic',
    purchasedAt: params.verifiedAt,
    createdAt: params.verifiedAt
  };

  const token = (params.authToken || '').trim();
  const { projectId, databaseId } = getFirestoreDbTarget();
  if (!token || !projectId) {
    return {
      synced: false,
      alreadyPurchased: false,
      purchase: fallbackPurchase,
      error: 'Missing Firebase auth token or project ID for server-side Firestore sync'
    };
  }

  const baseDocUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(databaseId)}/documents`;

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  try {
    // 1. Check if purchase entitlement already exists (idempotency / duplicate prevention)
    const getPurchaseRes = await firestoreRestFetch(
      `${baseDocUrl}/purchases/${encodeURIComponent(purchaseId)}`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
    );

    if (getPurchaseRes.ok) {
      const existingPurchaseDoc = decodeFsDoc(await getPurchaseRes.json());
      if (existingPurchaseDoc && existingPurchaseDoc.entitlementStatus === 'active') {
        // Best-effort ensure order is marked paid too
        const patchOrderParams = [
          'status',
          'razorpayPaymentId',
          'razorpayOrderId',
          'razorpaySignature',
          'verifiedAt',
          'updatedAt',
          'approvalMethod'
        ]
          .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
          .join('&');

        await firestoreRestFetch(
          `${baseDocUrl}/orders/${encodeURIComponent(params.orderId)}?${patchOrderParams}`,
          {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({
              fields: encodeFsValue({
                status: 'paid',
                razorpayPaymentId: params.razorpayPaymentId,
                razorpayOrderId: params.razorpayOrderId,
                razorpaySignature: params.razorpaySignature,
                verifiedAt: params.verifiedAt,
                updatedAt: params.verifiedAt,
                approvalMethod: 'razorpay_automatic'
              }).mapValue.fields
            })
          }
        ).catch(() => {});

        return {
          synced: true,
          alreadyPurchased: true,
          purchase: existingPurchaseDoc as Purchase
        };
      }
    }

    // 2. Ensure orders/{orderId} exists before transitioning it to paid
    const getOrderRes = await firestoreRestFetch(
      `${baseDocUrl}/orders/${encodeURIComponent(params.orderId)}`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
    );

    if (getOrderRes.status === 404) {
      const pendingOrderDoc: Order = {
        id: params.orderId,
        uid: params.uid,
        studentName: params.studentName || 'MKR Student',
        studentEmail: params.userEmail || '',
        studentPhone: '0000000000',
        productId: params.productId,
        productTitleSnapshot: params.productTitle,
        amountPaise: Math.max(100, Number(params.amountPaise) || 100),
        currency: 'INR',
        razorpayOrderId: params.razorpayOrderId,
        status: 'pending',
        createdAt: params.verifiedAt,
        updatedAt: params.verifiedAt
      };
      const createOrderRes = await firestoreRestFetch(
        `${baseDocUrl}/orders?documentId=${encodeURIComponent(params.orderId)}`,
        {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            fields: encodeFsValue(pendingOrderDoc).mapValue.fields
          })
        }
      );
      if (!createOrderRes.ok) {
        const errText = await createOrderRes.text().catch(() => '');
        return {
          synced: false,
          alreadyPurchased: false,
          purchase: fallbackPurchase,
          error: `Order creation failed (HTTP ${createOrderRes.status}): ${errText.slice(0, 250)}`
        };
      }
    } else if (!getOrderRes.ok) {
      const errText = await getOrderRes.text().catch(() => '');
      return {
        synced: false,
        alreadyPurchased: false,
        purchase: fallbackPurchase,
        error: `Order lookup failed (HTTP ${getOrderRes.status}): ${errText.slice(0, 250)}`
      };
    }

    // 3. Update orders/{orderId} to status: 'paid' with verified Razorpay fields
    const orderUpdateMask = [
      'status',
      'razorpayPaymentId',
      'razorpayOrderId',
      'razorpaySignature',
      'verifiedAt',
      'updatedAt',
      'approvalMethod'
    ]
      .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
      .join('&');

    const patchOrderRes = await firestoreRestFetch(
      `${baseDocUrl}/orders/${encodeURIComponent(params.orderId)}?${orderUpdateMask}`,
      {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          fields: encodeFsValue({
            status: 'paid',
            razorpayPaymentId: params.razorpayPaymentId,
            razorpayOrderId: params.razorpayOrderId,
            razorpaySignature: params.razorpaySignature,
            verifiedAt: params.verifiedAt,
            updatedAt: params.verifiedAt,
            approvalMethod: 'razorpay_automatic'
          }).mapValue.fields
        })
      }
    );

    if (!patchOrderRes.ok) {
      const errText = await patchOrderRes.text().catch(() => '');
      return {
        synced: false,
        alreadyPurchased: false,
        purchase: fallbackPurchase,
        error: `Order update to paid failed (HTTP ${patchOrderRes.status}): ${errText.slice(0, 250)}`
      };
    }

    // 4. Create deterministic purchases/{purchaseId} record (duplicate-safe via POST ?documentId=...)
    const createPurchaseRes = await firestoreRestFetch(
      `${baseDocUrl}/purchases?documentId=${encodeURIComponent(purchaseId)}`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          fields: encodeFsValue(fallbackPurchase).mapValue.fields
        })
      }
    );

    if (createPurchaseRes.status === 409) {
      // Already exists (race retry); fetch authoritative existing doc
      const retryGet = await firestoreRestFetch(
        `${baseDocUrl}/purchases/${encodeURIComponent(purchaseId)}`,
        { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
      );
      if (retryGet.ok) {
        const existingDoc = decodeFsDoc(await retryGet.json());
        if (existingDoc) {
          return {
            synced: true,
            alreadyPurchased: true,
            purchase: existingDoc as Purchase
          };
        }
      }
    }

    if (!createPurchaseRes.ok) {
      const errText = await createPurchaseRes.text().catch(() => '');
      return {
        synced: false,
        alreadyPurchased: false,
        purchase: fallbackPurchase,
        error: `Purchase creation failed (HTTP ${createPurchaseRes.status}): ${errText.slice(0, 250)}`
      };
    }

    return {
      synced: true,
      alreadyPurchased: false,
      purchase: fallbackPurchase
    };
  } catch (err: any) {
    return {
      synced: false,
      alreadyPurchased: false,
      purchase: fallbackPurchase,
      error: err?.message || 'Unexpected Firestore REST persistence error'
    };
  }
}
