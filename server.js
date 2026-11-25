var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// firebase-applet-config.json
var firebase_applet_config_default;
var init_firebase_applet_config = __esm({
  "firebase-applet-config.json"() {
    firebase_applet_config_default = {
      projectId: "admin-original-a0bcd",
      appId: "1:669869297609:web:61549703754dea9299e218",
      apiKey: "AIzaSyBDQcnYAXrf_HmmoTtP86ryW9KZlwawbRw",
      authDomain: "admin-original-a0bcd.firebaseapp.com",
      firestoreDatabaseId: "ai-studio-mkracademy-98c07c25-9c93-4a24-be5a-be33758d8335",
      storageBucket: "admin-original-a0bcd.firebasestorage.app",
      messagingSenderId: "669869297609",
      measurementId: "G-3N4SSN4JZ8",
      oAuthClientId: "669869297609-l4nf9edmcdjf88621bkhc6o3250oirdi.apps.googleusercontent.com",
      recaptchaSiteKey: ""
    };
  }
});

// src/firebase/config.ts
var config_exports = {};
__export(config_exports, {
  ADMIN_EMAIL: () => ADMIN_EMAIL,
  OperationType: () => OperationType,
  app: () => app,
  auth: () => auth,
  db: () => db,
  firestoreDatabaseId: () => firestoreDatabaseId,
  handleFirestoreError: () => handleFirestoreError,
  storage: () => storage,
  testConnection: () => testConnection
});
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";
function handleFirestoreError(error, operationType, path3) {
  const currentUser = auth.currentUser;
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path: path3,
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email
      })) || []
    }
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client is offline or initializing.");
    }
    return false;
  }
}
var getEnvVar, resolvedFirebaseConfig, firestoreDatabaseId, app, auth, db, storage, ADMIN_EMAIL, OperationType;
var init_config = __esm({
  "src/firebase/config.ts"() {
    init_firebase_applet_config();
    getEnvVar = (key) => {
      if (typeof import.meta !== "undefined" && import.meta.env) {
        return import.meta.env[key];
      }
      if (typeof process !== "undefined" && process.env) {
        return process.env[key];
      }
      return void 0;
    };
    resolvedFirebaseConfig = {
      apiKey: getEnvVar("VITE_FIREBASE_API_KEY") || firebase_applet_config_default.apiKey,
      authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN") || firebase_applet_config_default.authDomain,
      projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID") || firebase_applet_config_default.projectId,
      storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET") || firebase_applet_config_default.storageBucket,
      messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID") || firebase_applet_config_default.messagingSenderId,
      appId: getEnvVar("VITE_FIREBASE_APP_ID") || firebase_applet_config_default.appId,
      measurementId: getEnvVar("VITE_FIREBASE_MEASUREMENT_ID") || firebase_applet_config_default.measurementId
    };
    firestoreDatabaseId = getEnvVar("VITE_FIREBASE_DATABASE_ID") || firebase_applet_config_default.firestoreDatabaseId;
    app = getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApp();
    auth = getAuth(app);
    db = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
    storage = getStorage(app);
    try {
      setLogLevel("error");
    } catch {
    }
    ADMIN_EMAIL = "muktar9085mkr@gmail.com";
    OperationType = /* @__PURE__ */ ((OperationType2) => {
      OperationType2["CREATE"] = "create";
      OperationType2["UPDATE"] = "update";
      OperationType2["DELETE"] = "delete";
      OperationType2["LIST"] = "list";
      OperationType2["GET"] = "get";
      OperationType2["WRITE"] = "write";
      return OperationType2;
    })(OperationType || {});
  }
});

// server.ts
import express2 from "express";
import fs2 from "fs";
import path2 from "path";
import dotenv2 from "dotenv";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/server/api.ts
init_config();
import express, { Router } from "express";
import crypto from "crypto";
import dotenv from "dotenv";
import { doc as doc7, getDoc as getDoc5, collection as collection3, setDoc as setDoc4, getDocs as getDocs3, updateDoc as updateDoc2, query as query3, where as where2, orderBy as orderBy3, limit as limit2, increment } from "firebase/firestore";

// src/server/securityMonitor.ts
var recentAlerts = [];
function getRecentSecurityAlerts(limitCount = 50) {
  return recentAlerts.slice(0, limitCount);
}

// src/server/paymentReconciliation.ts
async function queryRazorpayPaymentStatus(params) {
  const keyId = params.keyId || process.env.RAZORPAY_KEY_ID || "rzp_live_TqPdwQmi6yOprh";
  const keySecret = params.keySecret || process.env.RAZORPAY_KEY_SECRET || "eIJMyjZbJkBgLgWB59HYX7hn";
  const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const headers = {
    "Content-Type": "application/json",
    "Authorization": authHeader
  };
  const { razorpayOrderId, razorpayPaymentId, orderCreatedAt } = params;
  if (razorpayPaymentId && razorpayPaymentId.startsWith("pay_")) {
    try {
      const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
        method: "GET",
        headers
      });
      if (payRes.ok) {
        const payData = await payRes.json();
        if (payData.status === "captured") {
          return {
            status: "paid",
            razorpayPaymentId,
            razorpayOrderId: payData.order_id || razorpayOrderId,
            amountPaise: payData.amount,
            verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
            reason: "Payment captured and verified by Razorpay"
          };
        }
        if (payData.status === "failed") {
          return {
            status: "failed",
            razorpayPaymentId,
            reason: payData.error_description || payData.error_reason || "Razorpay reported payment failed"
          };
        }
      }
    } catch (err) {
      console.warn("Network error checking payment with Razorpay:", err);
      return {
        status: "uncertain",
        error: `Network error verifying payment: ${err?.message || err}`
      };
    }
  }
  if (razorpayOrderId && razorpayOrderId.startsWith("order_")) {
    try {
      const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
        method: "GET",
        headers
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        if (orderData.status === "paid" && orderData.amount_paid > 0) {
          let capturedPaymentId = razorpayPaymentId;
          try {
            const paymentsRes2 = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}/payments`, {
              method: "GET",
              headers
            });
            if (paymentsRes2.ok) {
              const paymentsData = await paymentsRes2.json();
              const capturedItem = (paymentsData.items || []).find((p) => p.status === "captured");
              if (capturedItem?.id) capturedPaymentId = capturedItem.id;
            }
          } catch {
          }
          return {
            status: "paid",
            razorpayOrderId,
            razorpayPaymentId: capturedPaymentId,
            amountPaise: orderData.amount_paid,
            verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
            reason: "Order status confirmed paid by Razorpay"
          };
        }
        const paymentsRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}/payments`, {
          method: "GET",
          headers
        });
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          const items = paymentsData.items || [];
          const capturedPayment = items.find((p) => p.status === "captured");
          if (capturedPayment) {
            return {
              status: "paid",
              razorpayOrderId,
              razorpayPaymentId: capturedPayment.id,
              amountPaise: capturedPayment.amount,
              verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
              reason: "Found captured payment in Razorpay order payments list"
            };
          }
          const failedPayments = items.filter((p) => p.status === "failed");
          if (items.length > 0 && failedPayments.length === items.length) {
            const firstReason = failedPayments[0]?.error_description || failedPayments[0]?.error_reason || "Payment failed on Razorpay";
            return {
              status: "failed",
              razorpayOrderId,
              reason: `Razorpay payment attempts failed: ${firstReason}`
            };
          }
          if (items.length === 0) {
            const orderAgeHours2 = orderCreatedAt ? (Date.now() - new Date(orderCreatedAt).getTime()) / (1e3 * 60 * 60) : 25;
            if (orderAgeHours2 >= 24) {
              return {
                status: "abandoned",
                razorpayOrderId,
                reason: "No payment attempted on Razorpay within 24 hours"
              };
            } else {
              return {
                status: "pending",
                razorpayOrderId,
                reason: "Within 24-hour pending window; no captured payment yet"
              };
            }
          }
        }
      } else {
        const errorJson = await orderRes.json().catch(() => ({}));
        if (orderRes.status === 400 || orderRes.status === 404) {
          const orderAgeHours2 = orderCreatedAt ? (Date.now() - new Date(orderCreatedAt).getTime()) / (1e3 * 60 * 60) : 25;
          if (orderAgeHours2 >= 24) {
            return {
              status: "abandoned",
              razorpayOrderId,
              reason: `Razorpay order not found or expired (${errorJson?.error?.description || "Not found"}) after 24h`
            };
          }
        }
        return {
          status: "uncertain",
          error: `Razorpay API responded with status ${orderRes.status}: ${errorJson?.error?.description || ""}`
        };
      }
    } catch (err) {
      console.warn("Network error checking order with Razorpay:", err);
      return {
        status: "uncertain",
        error: `Network error verifying order with Razorpay: ${err?.message || err}`
      };
    }
  }
  const orderAgeHours = orderCreatedAt ? (Date.now() - new Date(orderCreatedAt).getTime()) / (1e3 * 60 * 60) : 25;
  if (orderAgeHours >= 24) {
    return {
      status: "abandoned",
      reason: "No Razorpay order created; student abandoned checkout >24 hours ago"
    };
  }
  return {
    status: "pending",
    reason: "Within 24-hour pending window"
  };
}

// src/server/cron.ts
var isRunning = false;
var lastRunTimestamp = null;
var lastRunSummary = null;
function getLastSchedulerStatus() {
  return {
    lastRunTimestamp,
    lastRunSummary,
    isRunning
  };
}
async function runServerPaymentMaintenance() {
  if (isRunning) {
    return {
      success: false,
      message: "Maintenance cycle is already in progress",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  isRunning = true;
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  console.log(`[MKR Scheduler] Starting automated payment policy maintenance at ${startedAt}...`);
  try {
    const { collection: collection4, getDocs: getDocs4, doc: doc8, setDoc: setDoc5, deleteDoc: deleteDoc2 } = await import("firebase/firestore");
    const { db: db2 } = await Promise.resolve().then(() => (init_config(), config_exports));
    const [ordersSnap, purchasesSnap] = await Promise.all([
      getDocs4(collection4(db2, "orders")),
      getDocs4(collection4(db2, "purchases"))
    ]);
    const activePurchasesByOrder = /* @__PURE__ */ new Map();
    const activePurchasesByUserProduct = /* @__PURE__ */ new Map();
    purchasesSnap.forEach((docSnap) => {
      const p = docSnap.data();
      if (p.entitlementStatus === "active") {
        if (p.orderId) activePurchasesByOrder.set(p.orderId, p);
        if (p.uid && p.productId) activePurchasesByUserProduct.set(`${p.uid}_${p.productId}`, p);
      }
    });
    const now = Date.now();
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1e3;
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1e3;
    let pendingExamined = 0;
    let recoveredPaid = 0;
    let markedFailed = 0;
    let skippedUncertain = 0;
    let archivedFailed = 0;
    for (const docSnap of ordersSnap.docs) {
      const order = { id: docSnap.id, ...docSnap.data() };
      const orderRef = doc8(db2, "orders", docSnap.id);
      if (order.status === "pending") {
        pendingExamined++;
        const createdAtMs = new Date(order.createdAt || 0).getTime();
        const ageMs = now - createdAtMs;
        if (ageMs >= TWENTY_FOUR_HOURS_MS) {
          const matchingPurchase = activePurchasesByOrder.get(order.id) || activePurchasesByUserProduct.get(`${order.uid}_${order.productId}`);
          if (matchingPurchase) {
            await setDoc5(
              orderRef,
              {
                status: "paid",
                verifiedAt: matchingPurchase.purchasedAt || nowIso,
                updatedAt: nowIso,
                lastVerifiedWithRazorpayAt: nowIso,
                razorpayStatusSnapshot: "verified_active_entitlement"
              },
              { merge: true }
            );
            recoveredPaid++;
            continue;
          }
          try {
            const rzpStatus = await queryRazorpayPaymentStatus({
              razorpayOrderId: order.razorpayOrderId,
              razorpayPaymentId: order.razorpayPaymentId,
              orderCreatedAt: order.createdAt
            });
            if (rzpStatus.status === "paid") {
              await setDoc5(
                orderRef,
                {
                  status: "paid",
                  razorpayPaymentId: rzpStatus.razorpayPaymentId || order.razorpayPaymentId || "",
                  razorpayOrderId: rzpStatus.razorpayOrderId || order.razorpayOrderId || "",
                  verifiedAt: rzpStatus.verifiedAt || nowIso,
                  updatedAt: nowIso,
                  lastVerifiedWithRazorpayAt: nowIso,
                  razorpayStatusSnapshot: "captured"
                },
                { merge: true }
              );
              const purchaseId = `pur_${order.uid}_${order.productId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
              const purchaseRef = doc8(db2, "purchases", purchaseId);
              await setDoc5(
                purchaseRef,
                {
                  id: purchaseId,
                  uid: order.uid,
                  productId: order.productId,
                  orderId: order.id,
                  productTitle: order.productTitleSnapshot || "MKR Academy Notes",
                  coverImagePath: "",
                  entitlementStatus: "active",
                  purchasedAt: nowIso,
                  createdAt: nowIso
                },
                { merge: true }
              );
              recoveredPaid++;
            } else if (rzpStatus.status === "failed" || rzpStatus.status === "abandoned") {
              await setDoc5(
                orderRef,
                {
                  status: "failed",
                  failedAt: nowIso,
                  failureReason: rzpStatus.reason || "Pending timeout (24h) - Verified uncaptured with Razorpay",
                  updatedAt: nowIso,
                  lastVerifiedWithRazorpayAt: nowIso,
                  razorpayStatusSnapshot: rzpStatus.status
                },
                { merge: true }
              );
              markedFailed++;
            } else {
              await setDoc5(
                orderRef,
                {
                  updatedAt: nowIso,
                  lastVerifiedWithRazorpayAt: nowIso,
                  razorpayStatusSnapshot: "uncertain_retry_later"
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
      if (order.status === "failed" && !order.isArchived) {
        const failedMs = order.failedAt ? new Date(order.failedAt).getTime() : new Date(order.updatedAt || order.createdAt || 0).getTime();
        const failedAgeMs = now - failedMs;
        if (failedAgeMs >= THIRTY_DAYS_MS) {
          try {
            const archiveRef = doc8(db2, "archived_orders", order.id);
            await setDoc5(archiveRef, {
              ...order,
              status: "failed",
              isArchived: true,
              archivedAt: nowIso,
              archiveReason: "Expired failed payment (cleared after 30 days per policy)"
            });
            await deleteDoc2(orderRef);
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
  } catch (error) {
    console.warn("[MKR Scheduler] Error during payment maintenance cycle:", error?.message || error);
    return {
      success: false,
      message: error?.message || "Scheduler execution error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } finally {
    isRunning = false;
  }
}

// src/server/cors.ts
var ALLOWED_ORIGIN_PATTERNS = [
  // Production MKR Academy domains
  /^https?:\/\/(www\.)?mkracademy\.in$/,
  // Google AI Studio / Cloud Run preview domains
  /^https:\/\/[a-z0-9-]+\.run\.app$/,
  /^https:\/\/[a-z0-9-]+\.aistudio\.google\.com$/,
  /^https:\/\/aistudio\.google\.com$/,
  // Netlify, Firebase Hosting & Hostinger deployment domains
  /^https:\/\/[a-z0-9-]+\.netlify\.app$/,
  /^https:\/\/[a-z0-9-]+\.web\.app$/,
  /^https:\/\/[a-z0-9-]+\.firebaseapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.hostingersite\.com$/,
  /^https:\/\/[a-z0-9-]+\.hstgr\.io$/,
  // Local development hosts
  /^http:\/\/localhost(:[0-9]+)?$/,
  /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/,
  // Android WebView wrapper origins (e.g., custom capacitor/cordova or localhost)
  /^https?:\/\/localhost$/,
  /^null$/
  // Android WebView local assets origin
];
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) {
    next();
    return;
  }
  const isAllowed = ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-razorpay-signature, x-cron-token, X-Requested-With, Accept"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
  } else {
    if (req.method === "OPTIONS") {
      res.status(403).json({ error: "CORS policy violation: Origin not allowed" });
      return;
    }
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}

// src/server/securityHeaders.ts
function securityHeadersMiddleware(req, res, next) {
  const isProd = process.env.NODE_ENV === "production";
  const proto = req.headers["x-forwarded-proto"];
  if (isProd && proto && proto === "http") {
    const secureUrl = `https://${req.headers.host}${req.url}`;
    res.redirect(301, secureUrl);
    return;
  }
  if (isProd || proto === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", 'geolocation=(), microphone=(), camera=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")');
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://apis.google.com https://*.firebaseio.com https://*.firebaseapp.com https://www.gstatic.com https://www.google.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://api.razorpay.com https://lumberjack.razorpay.com https://identitytoolkit.googleapis.com wss://*.firebaseio.com",
    "img-src 'self' data: blob: https://* http://*",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com https://drive.google.com https://docs.google.com https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://*.firebaseapp.com https://*.run.app https://*.aistudio.google.com https://aistudio.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "media-src 'self' data: blob: https://*",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));
  next();
}

// src/server/botProtection.ts
function botProtectionMiddleware(options = {}) {
  const {
    minSubmissionTimeMs = 600
    // 600ms minimum threshold for human interaction
  } = options;
  return (req, res, next) => {
    const honeypot = req.body?._mkr_hp_trap || req.body?.website_hp || req.body?.fax_hp;
    if (honeypot && typeof honeypot === "string" && honeypot.trim().length > 0) {
      console.warn(`[BOT PROTECTION] Honeypot triggered by IP ${req.ip}. Trap value: "${honeypot}"`);
      res.status(400).json({
        error: "Automated form submission rejected.",
        code: "BOT_DETECTED"
      });
      return;
    }
    const clientTimestamp = Number(req.body?._mkr_form_ts);
    if (clientTimestamp && Number.isFinite(clientTimestamp)) {
      const durationMs = Date.now() - clientTimestamp;
      if (durationMs > 0 && durationMs < minSubmissionTimeMs) {
        console.warn(`[BOT PROTECTION] Submission velocity too fast (${durationMs}ms) from IP ${req.ip}`);
        res.status(400).json({
          error: "Form submitted unnaturally fast. Please review your input and try again.",
          code: "VELOCITY_REJECTED"
        });
        return;
      }
    }
    const captchaToken = req.body?.captchaToken || req.headers["x-captcha-token"];
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (recaptchaSecret && captchaToken && typeof captchaToken === "string") {
      verifyRecaptchaToken(captchaToken, recaptchaSecret).then((isValid) => {
        if (!isValid) {
          res.status(400).json({
            error: "CAPTCHA verification failed. Please try again.",
            code: "CAPTCHA_FAILED"
          });
          return;
        }
        next();
      }).catch((err) => {
        console.warn("reCAPTCHA verification error, failing open to avoid blocking student:", err);
        next();
      });
      return;
    }
    next();
  };
}
async function verifyRecaptchaToken(token, secret) {
  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: params
    });
    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data.success && (data.score === void 0 || data.score >= 0.5));
  } catch (err) {
    console.error("Error contacting reCAPTCHA API:", err);
    return false;
  }
}

// src/server/uploadValidation.ts
var UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
  // 5 MB
  MAX_PDF_SIZE_BYTES: 60 * 1024 * 1024,
  // 60 MB
  ALLOWED_IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
  ALLOWED_PDF_EXTENSIONS: [".pdf"],
  ALLOWED_IMAGE_MIMES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_PDF_MIMES: ["application/pdf"],
  BLOCKED_EXTENSIONS: [
    ".exe",
    ".bat",
    ".cmd",
    ".sh",
    ".bash",
    ".php",
    ".phtml",
    ".php5",
    ".js",
    ".mjs",
    ".cjs",
    ".html",
    ".htm",
    ".svg",
    ".jar",
    ".jsp",
    ".vbs",
    ".scr",
    ".msi",
    ".dll"
  ]
};
function validateFileMetadata(params) {
  const { fileName, fileSizeBytes, mimeType, expectedCategory } = params;
  if (!fileName || typeof fileName !== "string") {
    return { isValid: false, error: "File name is missing or invalid" };
  }
  const baseName = fileName.replace(/[/\\?%*:|"<>]/g, "_").trim();
  const lowerName = baseName.toLowerCase();
  const isBlocked = UPLOAD_LIMITS.BLOCKED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (isBlocked) {
    return {
      isValid: false,
      error: "Security alert: Executable or script files are strictly prohibited."
    };
  }
  if (expectedCategory === "pdf") {
    if (fileSizeBytes <= 0 || fileSizeBytes > UPLOAD_LIMITS.MAX_PDF_SIZE_BYTES) {
      return {
        isValid: false,
        error: `PDF file size must be between 1 KB and ${UPLOAD_LIMITS.MAX_PDF_SIZE_BYTES / (1024 * 1024)} MB.`
      };
    }
    const hasValidPdfExt = UPLOAD_LIMITS.ALLOWED_PDF_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidPdfExt) {
      return { isValid: false, error: "Only files with .pdf extension are permitted for notes." };
    }
    if (mimeType && mimeType !== "application/pdf") {
      return { isValid: false, error: `Invalid MIME type (${mimeType}) for PDF document.` };
    }
    return {
      isValid: true,
      sanitizedFileName: baseName,
      detectedType: "application/pdf"
    };
  }
  if (expectedCategory === "image") {
    if (fileSizeBytes <= 0 || fileSizeBytes > UPLOAD_LIMITS.MAX_IMAGE_SIZE_BYTES) {
      return {
        isValid: false,
        error: `Image file size must be between 1 KB and ${UPLOAD_LIMITS.MAX_IMAGE_SIZE_BYTES / (1024 * 1024)} MB.`
      };
    }
    const hasValidImgExt = UPLOAD_LIMITS.ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidImgExt) {
      return {
        isValid: false,
        error: "Only .jpg, .jpeg, .png, and .webp images are permitted for covers and banners."
      };
    }
    if (mimeType && !UPLOAD_LIMITS.ALLOWED_IMAGE_MIMES.includes(mimeType)) {
      return { isValid: false, error: `Invalid image MIME type: ${mimeType}` };
    }
    return {
      isValid: true,
      sanitizedFileName: baseName,
      detectedType: mimeType
    };
  }
  return { isValid: false, error: "Unknown file upload category" };
}

// src/server/rateLimiter.ts
function createRateLimiter(options) {
  const {
    windowMs,
    maxRequests,
    message = "Too many requests. Please wait a moment before trying again.",
    statusCode = 429
  } = options;
  const hits = /* @__PURE__ */ new Map();
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 6e4));
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
  return (req, res, next) => {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();
    let record = hits.get(clientIp);
    if (!record) {
      record = { timestamps: [] };
      hits.set(clientIp, record);
    }
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    const currentCount = record.timestamps.length;
    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - currentCount - 1).toString());
    const resetTimeSeconds = Math.ceil((windowMs - (now - (record.timestamps[0] || now))) / 1e3);
    res.setHeader("X-RateLimit-Reset", resetTimeSeconds.toString());
    if (currentCount >= maxRequests) {
      res.setHeader("Retry-After", resetTimeSeconds.toString());
      res.status(statusCode).json({
        error: message,
        retryAfterSeconds: resetTimeSeconds,
        statusCode: 429
      });
      return;
    }
    record.timestamps.push(now);
    next();
  };
}
var globalApiLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  // 1 minute
  maxRequests: 120,
  message: "General API request limit reached. Please try again shortly."
});
var createOrderLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  maxRequests: 10,
  message: "Payment order creation rate limit reached. Please wait a minute before creating a new order."
});
var verifyPaymentLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  maxRequests: 20,
  message: "Too many payment verification attempts. Please wait a minute."
});
var checkStatusLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  maxRequests: 25,
  message: "Status check rate limit exceeded. Please wait a moment."
});
var adminApproveLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  maxRequests: 15,
  message: "Too many administrative approval actions in a short period. Please wait."
});
var downloadNoteLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  maxRequests: 30,
  message: "Download request limit reached. Please wait a moment before downloading more notes."
});

// src/server/auth.ts
init_firebase_applet_config();
init_config();
import { doc as doc2, getDoc } from "firebase/firestore";
var tokenCache = /* @__PURE__ */ new Map();
async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") return null;
  const now = Date.now();
  const cached = tokenCache.get(idToken);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }
  const apiKey = process.env.VITE_FIREBASE_API_KEY || firebase_applet_config_default.apiKey;
  if (!apiKey) {
    console.error("Firebase API key missing on server for token verification");
    return null;
  }
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn("Firebase token verification rejected by Google API:", response.status, err?.error?.message);
      return null;
    }
    const data = await response.json();
    const account = data.users?.[0];
    if (!account || !account.localId) {
      return null;
    }
    const verifiedUser = {
      uid: account.localId,
      email: account.email ? account.email.toLowerCase() : void 0,
      emailVerified: Boolean(account.emailVerified),
      displayName: account.displayName
    };
    tokenCache.set(idToken, {
      user: verifiedUser,
      expiresAt: now + 5 * 60 * 1e3
    });
    return verifiedUser;
  } catch (error) {
    console.error("Network error during Firebase token verification:", error);
    return null;
  }
}
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication required. Missing or malformed authorization header.",
      code: "UNAUTHORIZED"
    });
    return;
  }
  const token = authHeader.substring(7).trim();
  const user = await verifyFirebaseIdToken(token);
  if (!user) {
    res.status(401).json({
      error: "Invalid, expired or revoked authentication token. Please sign in again.",
      code: "INVALID_TOKEN"
    });
    return;
  }
  req.user = user;
  next();
}
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Administrator authentication required.",
      code: "UNAUTHORIZED"
    });
    return;
  }
  const token = authHeader.substring(7).trim();
  const user = await verifyFirebaseIdToken(token);
  if (!user) {
    res.status(401).json({
      error: "Invalid or expired administrator token.",
      code: "INVALID_TOKEN"
    });
    return;
  }
  const isSuperadmin = user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (isSuperadmin) {
    req.user = user;
    next();
    return;
  }
  try {
    const adminDoc = await getDoc(doc2(db, "admins", user.uid));
    if (adminDoc.exists()) {
      req.user = user;
      next();
      return;
    }
  } catch (err) {
    console.warn("Error checking admin document in Firestore:", err);
  }
  res.status(403).json({
    error: "Access denied: Administrator privileges required.",
    code: "FORBIDDEN"
  });
}

// src/server/sanitize.ts
function sanitizeText(input, maxLength = 250) {
  if (typeof input !== "string") {
    return "";
  }
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  cleaned = cleaned.replace(/<[^>]*>?/gm, "");
  cleaned = cleaned.trim();
  return cleaned.substring(0, maxLength);
}
function sanitizeId(input, maxLength = 128) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return null;
  }
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return null;
  }
  return trimmed;
}
function sanitizeIndianPhone(input) {
  if (typeof input !== "string") return null;
  const digits = input.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  return null;
}
function sanitizeEmail(input) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length > 150) return null;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  return trimmed;
}
function sanitizeAmountPaise(input) {
  const num = Number(input);
  if (!Number.isInteger(num) || num <= 0 || num > 1e7) {
    return null;
  }
  return num;
}

// src/server/youtubeMedia.ts
init_config();
import { doc as doc3, getDoc as getDoc2, setDoc } from "firebase/firestore";
var DEFAULT_CHANNEL_FALLBACK = "https://youtube.com/@mkracademy01";
var CACHE_TTL_MS = 15 * 60 * 1e3;
var FETCH_TIMEOUT_MS = 7e3;
var memoryCache = null;
function decodeXmlEntities(text) {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/").replace(/\s+/g, " ").trim();
}
function parseChannelInput(raw) {
  const cleaned = (raw || "").trim();
  if (!cleaned) {
    return { handle: "mkracademy01", original: DEFAULT_CHANNEL_FALLBACK };
  }
  const directUcMatch = cleaned.match(/^(UC[a-zA-Z0-9_-]{22})$/);
  if (directUcMatch) {
    return { channelId: directUcMatch[1], original: cleaned };
  }
  const urlUcMatch = cleaned.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
  if (urlUcMatch) {
    return { channelId: urlUcMatch[1], original: cleaned };
  }
  const urlHandleMatch = cleaned.match(/youtube\.com\/@([a-zA-Z0-9._-]+)/i);
  if (urlHandleMatch) {
    return { handle: urlHandleMatch[1], original: cleaned };
  }
  if (cleaned.startsWith("@")) {
    return { handle: cleaned.slice(1).trim(), original: cleaned };
  }
  if (/^[a-zA-Z0-9._-]{3,50}$/.test(cleaned)) {
    return { handle: cleaned, original: cleaned };
  }
  return { handle: "mkracademy01", original: cleaned };
}
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        ...options.headers || {}
      }
    });
  } finally {
    clearTimeout(timer);
  }
}
function parseRelativeTimeToIso(rawText, indexOffset = 0) {
  const nowMs = Date.now();
  const text = (rawText || "").toLowerCase().trim();
  const match = text.match(/(\d+)\s*(sec|second|min|minute|hr|hour|day|wk|week|mo|month|yr|year)/);
  if (match) {
    const val = Math.max(0, Number(match[1]) || 0);
    const unit = match[2];
    let deltaMs = 0;
    if (unit.startsWith("sec")) deltaMs = val * 1e3;
    else if (unit.startsWith("min")) deltaMs = val * 60 * 1e3;
    else if (unit.startsWith("h")) deltaMs = val * 3600 * 1e3;
    else if (unit.startsWith("day")) deltaMs = val * 24 * 3600 * 1e3;
    else if (unit.startsWith("w")) deltaMs = val * 7 * 24 * 3600 * 1e3;
    else if (unit.startsWith("mo")) deltaMs = val * 30 * 24 * 3600 * 1e3;
    else if (unit.startsWith("y")) deltaMs = val * 365 * 24 * 3600 * 1e3;
    return new Date(nowMs - deltaMs - indexOffset * 1e3).toISOString();
  }
  return new Date(nowMs - indexOffset * 1e3).toISOString();
}
function extractYtInitialData(html) {
  const match = html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}
async function fetchViaYouTubeChannelPages(channelId) {
  const seen = /* @__PURE__ */ new Set();
  const videos = [];
  let channelTitle = "MKR Academy";
  const videosPageUrl = `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/videos`;
  const videosRes = await fetchWithTimeout(videosPageUrl, {
    headers: { "Accept-Language": "en-US,en;q=0.9" }
  });
  if (!videosRes.ok) {
    throw new Error(`YouTube channel videos page unavailable (HTTP ${videosRes.status})`);
  }
  const videosHtml = await videosRes.text();
  const videosData = extractYtInitialData(videosHtml);
  channelTitle = videosData?.metadata?.channelMetadataRenderer?.title || videosData?.header?.pageHeaderRenderer?.pageTitle || channelTitle;
  const tabs = videosData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const selectedTab = tabs.find((tb) => tb?.tabRenderer?.selected) || tabs[1] || tabs[0];
  const gridItems = selectedTab?.tabRenderer?.content?.richGridRenderer?.contents || [];
  for (let i = 0; i < gridItems.length; i++) {
    const content = gridItems[i]?.richItemRenderer?.content;
    if (!content) continue;
    const lvm = content.lockupViewModel;
    if (lvm?.contentId) {
      const videoId = String(lvm.contentId).trim();
      if (!videoId || seen.has(videoId)) continue;
      seen.add(videoId);
      const metaVm = lvm.metadata?.lockupMetadataViewModel;
      const title = decodeXmlEntities(String(metaVm?.title?.content || "MKR Academy Video"));
      const metaRows = metaVm?.metadata?.contentMetadataViewModel?.metadataRows || [];
      let timeText = "";
      for (const row of metaRows) {
        for (const part of row?.metadataParts || []) {
          const candidate = part?.accessibilityLabel || part?.text?.content || "";
          if (/\bago\b/i.test(candidate)) {
            timeText = candidate;
          }
        }
      }
      videos.push({
        videoId,
        title,
        contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: parseRelativeTimeToIso(timeText, videos.length)
      });
      if (videos.length >= 10) break;
      continue;
    }
    const vr = content.videoRenderer;
    if (vr?.videoId) {
      const videoId = String(vr.videoId).trim();
      if (!videoId || seen.has(videoId)) continue;
      seen.add(videoId);
      const title = decodeXmlEntities(
        String(vr.title?.runs?.[0]?.text || vr.title?.simpleText || "MKR Academy Video")
      );
      const timeText = String(vr.publishedTimeText?.simpleText || "");
      videos.push({
        videoId,
        title,
        contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: parseRelativeTimeToIso(timeText, videos.length)
      });
      if (videos.length >= 10) break;
    }
  }
  if (videos.length < 10) {
    try {
      const shortsRes = await fetchWithTimeout(
        `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/shorts`,
        { headers: { "Accept-Language": "en-US,en;q=0.9" } }
      );
      if (shortsRes.ok) {
        const shortsHtml = await shortsRes.text();
        const shortsData = extractYtInitialData(shortsHtml);
        const sTabs = shortsData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        const sSelected = sTabs.find((tb) => tb?.tabRenderer?.selected);
        const sItems = sSelected?.tabRenderer?.content?.richGridRenderer?.contents || [];
        for (const item of sItems) {
          const slvm = item?.richItemRenderer?.content?.shortsLockupViewModel;
          const videoId = slvm?.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
          if (!videoId || seen.has(videoId)) continue;
          seen.add(videoId);
          const rawAccess = String(slvm?.accessibilityText || "MKR Academy Short");
          const cleanTitle = decodeXmlEntities(
            rawAccess.replace(/,\s*[\d,.KMB]+\s+views?\s*-\s*play Short$/i, "").trim()
          );
          videos.push({
            videoId,
            title: cleanTitle || "MKR Academy Video",
            contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            publishedAt: new Date(Date.now() - videos.length * 1e3).toISOString()
          });
          if (videos.length >= 10) break;
        }
      }
    } catch {
    }
  }
  if (videos.length === 0) {
    throw new Error("No public videos found on YouTube channel page");
  }
  return {
    videos: videos.slice(0, 10),
    channelId,
    channelTitle
  };
}
async function resolveConfiguredChannelInput(explicitOverride) {
  if (explicitOverride && explicitOverride.trim()) {
    return explicitOverride.trim();
  }
  if (process.env.YOUTUBE_CHANNEL_ID && process.env.YOUTUBE_CHANNEL_ID.trim()) {
    return process.env.YOUTUBE_CHANNEL_ID.trim();
  }
  try {
    const publicSettingsSnap = await getDoc2(doc3(db, "appSettings", "public"));
    if (publicSettingsSnap.exists()) {
      const data = publicSettingsSnap.data();
      if (data?.youtubeChannelId && String(data.youtubeChannelId).trim()) {
        return String(data.youtubeChannelId).trim();
      }
      if (data?.social?.youtube && String(data.social.youtube).trim()) {
        return String(data.social.youtube).trim();
      }
    }
  } catch {
  }
  return DEFAULT_CHANNEL_FALLBACK;
}
async function fetchViaYouTubeDataApiV3(channelInput, apiKey) {
  const parsed = parseChannelInput(channelInput);
  let channelId = parsed.channelId || "";
  let uploadsPlaylistId = channelId ? `UU${channelId.slice(2)}` : "";
  let channelTitle = "MKR Academy";
  const channelQueryParam = parsed.channelId ? `id=${encodeURIComponent(parsed.channelId)}` : `forHandle=${encodeURIComponent(parsed.handle || "mkracademy01")}`;
  const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&${channelQueryParam}&key=${encodeURIComponent(apiKey)}`;
  const chRes = await fetchWithTimeout(chUrl);
  if (!chRes.ok) {
    const errJson = await chRes.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `YouTube channels API error (${chRes.status})`);
  }
  const chData = await chRes.json();
  const channelItem = chData?.items?.[0];
  if (!channelItem) {
    throw new Error("YouTube channel not found for configured ID/handle");
  }
  channelId = channelItem.id || channelId;
  uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads || `UU${channelId.slice(2)}`;
  channelTitle = channelItem.snippet?.title || "MKR Academy";
  const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
    uploadsPlaylistId
  )}&maxResults=10&key=${encodeURIComponent(apiKey)}`;
  const plRes = await fetchWithTimeout(plUrl);
  if (!plRes.ok) {
    const errJson = await plRes.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `YouTube playlistItems API error (${plRes.status})`);
  }
  const plData = await plRes.json();
  const rawItems = Array.isArray(plData?.items) ? plData.items : [];
  const seen = /* @__PURE__ */ new Set();
  const videos = [];
  for (const item of rawItems) {
    const videoId = item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId || "";
    if (!videoId || seen.has(videoId)) continue;
    seen.add(videoId);
    const title = (item?.snippet?.title || "MKR Academy Video").trim();
    if (title === "Deleted video" || title === "Private video") continue;
    const publishedAt = item?.contentDetails?.videoPublishedAt || item?.snippet?.publishedAt || (/* @__PURE__ */ new Date()).toISOString();
    const thumbs = item?.snippet?.thumbnails || {};
    const thumbnailUrl = thumbs.high?.url || thumbs.medium?.url || thumbs.standard?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    videos.push({
      videoId,
      title,
      contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl,
      publishedAt
    });
  }
  videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return {
    videos: videos.slice(0, 10),
    channelId,
    channelTitle
  };
}
async function fetchViaYouTubeRssFeed(channelInput) {
  const parsed = parseChannelInput(channelInput);
  let channelId = parsed.channelId || "";
  if (!channelId) {
    const handle = parsed.handle || "mkracademy01";
    const pageUrl = `https://www.youtube.com/@${encodeURIComponent(handle)}`;
    const pageRes = await fetchWithTimeout(pageUrl, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (!pageRes.ok) {
      throw new Error(`Could not resolve YouTube handle @${handle} (HTTP ${pageRes.status})`);
    }
    const html = await pageRes.text();
    const idMatch = html.match(/"externalId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/) || html.match(/<meta\s+itemprop="identifier"\s+content="(UC[a-zA-Z0-9_-]{22})"/i) || html.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
    if (!idMatch) {
      throw new Error(`Could not extract Channel ID from YouTube handle @${handle}`);
    }
    channelId = idMatch[1];
  }
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const rssRes = await fetchWithTimeout(rssUrl);
    if (rssRes.ok) {
      const xml = await rssRes.text();
      const feedTitleMatch = xml.match(/<feed[^>]*>[\s\S]*?<title>([\s\S]*?)<\/title>/i);
      const channelTitle = feedTitleMatch ? decodeXmlEntities(feedTitleMatch[1]) : "MKR Academy";
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
      const seen = /* @__PURE__ */ new Set();
      const videos = [];
      let match;
      while ((match = entryRegex.exec(xml)) !== null) {
        const block = match[1];
        const vidMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i);
        const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
        const pubMatch = block.match(/<published>([^<]+)<\/published>/i);
        const videoId = vidMatch?.[1]?.trim();
        if (!videoId || seen.has(videoId)) continue;
        seen.add(videoId);
        const title = titleMatch ? decodeXmlEntities(titleMatch[1]) : "MKR Academy Video";
        const publishedAt = pubMatch?.[1]?.trim() || (/* @__PURE__ */ new Date()).toISOString();
        videos.push({
          videoId,
          title,
          contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt
        });
      }
      if (videos.length > 0) {
        videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        return {
          videos: videos.slice(0, 10),
          channelId,
          channelTitle,
          source: "youtube_rss_feed"
        };
      }
    }
  } catch {
  }
  const pageResult = await fetchViaYouTubeChannelPages(channelId);
  return {
    ...pageResult,
    source: "youtube_channel_feed"
  };
}
async function readFirestoreYouTubeCache() {
  try {
    const snap = await getDoc2(doc3(db, "youtube_feed_cache", "latest"));
    if (!snap.exists()) return null;
    const data = snap.data();
    const excludedVideoIds = Array.isArray(data?.excludedVideoIds) ? data.excludedVideoIds.filter((v) => typeof v === "string") : [];
    const excludedSet = new Set(excludedVideoIds);
    const videos = Array.isArray(data?.videos) ? data.videos.filter((v) => v?.videoId && !excludedSet.has(v.videoId)).slice(0, 10) : [];
    return {
      videos,
      excludedVideoIds,
      channelId: data.channelId || "",
      channelInput: data.channelId || DEFAULT_CHANNEL_FALLBACK,
      channelTitle: data.channelTitle || "MKR Academy",
      source: "firestore_cache",
      hasApiKey: Boolean(process.env.YOUTUBE_API_KEY),
      cached: true,
      syncedAt: data.syncedAt || (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch {
    return null;
  }
}
async function getExcludedVideoIds() {
  try {
    const snap = await getDoc2(doc3(db, "youtube_feed_cache", "latest"));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data?.excludedVideoIds) ? data.excludedVideoIds.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}
async function getLatestYouTubeFeed(options) {
  const forceRefresh = Boolean(options?.forceRefresh);
  const channelInput = await resolveConfiguredChannelInput(options?.channelInput);
  const apiKey = (process.env.YOUTUBE_API_KEY || "").trim();
  const hasApiKey = Boolean(apiKey);
  const now = Date.now();
  const excludedIds = await getExcludedVideoIds();
  const excludedSet = new Set(excludedIds);
  if (!forceRefresh && memoryCache && memoryCache.key === channelInput && memoryCache.expiresAt > now) {
    return {
      ...memoryCache.payload,
      videos: memoryCache.payload.videos.filter((v) => !excludedSet.has(v.videoId)),
      cached: true
    };
  }
  if (!forceRefresh) {
    const fsCache = await readFirestoreYouTubeCache();
    if (fsCache && fsCache.videos.length > 0) {
      const syncedMs = new Date(fsCache.syncedAt).getTime();
      const cacheMatchesInput = !options?.channelInput && (!channelInput.startsWith("UC") || fsCache.channelId === channelInput);
      if (cacheMatchesInput && Number.isFinite(syncedMs) && now - syncedMs < CACHE_TTL_MS) {
        memoryCache = {
          key: channelInput,
          payload: fsCache,
          expiresAt: now + CACHE_TTL_MS
        };
        return fsCache;
      }
    }
  }
  let liveError;
  if (apiKey) {
    try {
      const apiResult = await fetchViaYouTubeDataApiV3(channelInput, apiKey);
      const filteredVideos = apiResult.videos.filter((v) => !excludedSet.has(v.videoId));
      const payload = {
        videos: filteredVideos,
        channelId: apiResult.channelId,
        channelInput,
        channelTitle: apiResult.channelTitle,
        source: "youtube_api_v3",
        hasApiKey: true,
        cached: false,
        syncedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      memoryCache = { key: channelInput, payload, expiresAt: now + CACHE_TTL_MS };
      setDoc(
        doc3(db, "youtube_feed_cache", "latest"),
        {
          channelId: apiResult.channelId,
          channelTitle: apiResult.channelTitle,
          videos: filteredVideos,
          excludedVideoIds: excludedIds,
          source: "youtube_api_v3",
          syncedAt: payload.syncedAt
        },
        { merge: true }
      ).catch(() => {
      });
      return payload;
    } catch (err) {
      liveError = err?.message || "YouTube API v3 fetch failed";
      console.warn("[YouTube Sync] Data API v3 failed, attempting RSS fallback:", liveError);
    }
  }
  try {
    const rssResult = await fetchViaYouTubeRssFeed(channelInput);
    const filteredVideos = rssResult.videos.filter((v) => !excludedSet.has(v.videoId));
    const payload = {
      videos: filteredVideos,
      channelId: rssResult.channelId,
      channelInput,
      channelTitle: rssResult.channelTitle,
      source: rssResult.source,
      hasApiKey,
      cached: false,
      syncedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryCache = { key: channelInput, payload, expiresAt: now + CACHE_TTL_MS };
    setDoc(
      doc3(db, "youtube_feed_cache", "latest"),
      {
        channelId: rssResult.channelId,
        channelTitle: rssResult.channelTitle,
        videos: filteredVideos,
        excludedVideoIds: excludedIds,
        source: rssResult.source,
        syncedAt: payload.syncedAt
      },
      { merge: true }
    ).catch(() => {
    });
    return payload;
  } catch (rssErr) {
    liveError = liveError || rssErr?.message || "YouTube feed unreachable";
    console.warn("[YouTube Sync] Live RSS/channel fetch failed:", liveError);
  }
  if (memoryCache && memoryCache.payload.videos.length > 0) {
    return {
      ...memoryCache.payload,
      source: "memory_cache",
      cached: true,
      error: liveError
    };
  }
  const staleFsCache = await readFirestoreYouTubeCache();
  if (staleFsCache) {
    return {
      ...staleFsCache,
      error: liveError
    };
  }
  return {
    videos: [],
    channelId: parseChannelInput(channelInput).channelId || "",
    channelInput,
    channelTitle: "MKR Academy",
    source: "empty",
    hasApiKey,
    cached: false,
    syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
    error: liveError
  };
}

// src/server/ogMetadata.ts
init_config();
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { doc as doc6, getDoc as getDoc4 } from "firebase/firestore";

// src/services/productService.ts
init_config();
import {
  collection as collection2,
  doc as doc5,
  getDocs as getDocs2,
  getDoc as getDoc3,
  setDoc as setDoc3,
  deleteDoc,
  query as query2,
  onSnapshot
} from "firebase/firestore";

// src/services/auditService.ts
init_config();
import { collection, doc as doc4, setDoc as setDoc2, getDocs, query, orderBy, limit } from "firebase/firestore";

// src/services/productService.ts
var INITIAL_PRODUCTS = [
  {
    id: "prod_1792811094545_9xspg",
    title: "HSLC-2027 : COMPLETE ENGLISH",
    slug: "hslc-2027-complete-english",
    shortDescription: "Complete English study notes for HSLC 2027 Board Exam. Chapter-wise complete notes for easy learning.",
    description: "MKR ACADEMY | HSLC-2027 : COMPLETE ENGLISH NOTES\n\n\u2022 Chapter-wise complete notes for easy learning\n\u2022 Important Previous Year Questions (PYQs)\n\u2022 Grammar and textbook question solutions\n\u2022 Exam-oriented answers for quick revision\n\nPrice: Only \u20B999\nPrepare smarter with MKR Academy!",
    subject: "English",
    classLevel: "HSLC 2027",
    examTarget: "HSLC 2027",
    medium: "Both Mediums",
    category: "Premium",
    tags: ["Important Questions", "Chapter-wise Notes"],
    chapters: [],
    coverImagePath: "https://user46792.na.imgto.link/public/20261024/839e8e6d731a03d018e2758b-english-complete-notes-hslc-2027.avif",
    driveFileLink: "https://drive.google.com/file/d/1UZVuRJWyWeK5SHdPXx35PgVzJ0JPI__O/view?usp=drivesdk",
    fileType: "PDF Document",
    pdfFileName: "hslc-2027-complete-english.pdf",
    pdfStoragePath: "",
    pageCount: 100,
    originalPricePaise: 19900,
    sellingPricePaise: 9900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: "2026-10-24T03:04:54.545Z",
    updatedAt: "2026-10-24T03:09:51.959Z"
  },
  {
    id: "prod_1792640796523_mip06",
    title: "English Grammer HSLC-2027 ( COMPLETE )",
    slug: "english-grammer-hslc-2027-complete",
    shortDescription: "Complete English Grammar for HSLC-2027 preparation.",
    description: "Complete English Grammar for HSLC-2027 preparation.\n\n\u2022 Detailed rules and solved examples for Determiners, Tenses, Voice Change, Narration, Prepositions, and Vocabulary.\n\u2022 Previous board examination question solutions included.",
    subject: "English",
    classLevel: "HSLC 2027",
    examTarget: "HSLC 2027",
    medium: "Both Mediums",
    category: "Premium",
    tags: ["English Grammar"],
    chapters: [],
    coverImagePath: "https://user46792.na.imgto.link/public/20261022/6cbc6119234e32533fd182f1-engfhb.avif",
    driveFileLink: "https://drive.google.com/uc?export=download&id=1Fbk6fA8nFVF9aIHEcWoVwIydT8sZTf9y",
    fileType: "PDF Document",
    pdfFileName: "English Grammar",
    pdfStoragePath: "",
    pageCount: 90,
    originalPricePaise: 9900,
    sellingPricePaise: 4900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: "2026-10-22T03:46:36.523Z",
    updatedAt: "2026-10-22T03:46:36.523Z"
  },
  {
    id: "prod_1792637927619_1xxcz",
    title: "\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE \u09AC\u09CD\u09AF\u09BE\u0995\u09F0\u09A3 ( Complete ) PYQ",
    slug: "complete-pyq",
    shortDescription: "Complete Assamese Grammar (\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE \u09AC\u09CD\u09AF\u09BE\u0995\u09F0\u09A3) Previous Year Questions for HSLC 2027.",
    description: "Complete Assamese Grammar (\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE \u09AC\u09CD\u09AF\u09BE\u0995\u09F0\u09A3) Previous Year Questions for HSLC 2027 (ASSEB/SEBA). Includes sandhi, samas, prottoy, bakyo poriborton, and board exam previous years questions.",
    subject: "Assamese",
    classLevel: "HSLC 2027",
    examTarget: "HSLC 2027 (ASSEB/SEBA)",
    medium: "Assamese Medium",
    category: "Budget Friendly",
    tags: ["\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE \u09AC\u09CD\u09AF\u09BE\u0995\u09F0\u09A3 (PYQs)"],
    chapters: [],
    coverImagePath: "https://user46792.na.imgto.link/public/20261022/52ba502d0af0b8cd6dc5892b-assbbg.avif",
    driveFileLink: "https://drive.google.com/uc?export=download&id=1DV44yv11wuNuSke88tpKmD-SsS4zWQeZ",
    fileType: "PDF Document",
    pdfFileName: "\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE \u09AC\u09CD\u09AF\u09BE\u0995\u09F0\u09A3",
    pdfStoragePath: "",
    pageCount: 89,
    originalPricePaise: 9900,
    sellingPricePaise: 4900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: "2026-10-22T02:58:47.619Z",
    updatedAt: "2026-10-22T03:46:55.562Z"
  },
  {
    id: "prod_1792588389139_duc2u",
    title: "HSLC-2027: Assamese (\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE) Class 10",
    slug: "hslc-2027-assamese-class-10",
    shortDescription: "Complete Assamese (\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE) Class 10 notes for HSLC 2027 preparation.",
    description: "Complete Assamese (\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE) Class 10 notes for HSLC 2027 preparation.\n\n\u2022 Strictly according to ASSEB/SEBA latest curriculum\n\u2022 Chapter-wise grammar and literature explanations\n\u2022 Most probable exam questions and scoring tips",
    subject: "Assamese",
    classLevel: "HSLC 2027",
    examTarget: "HSLC 2027 ( ASSEB/SEBA)",
    medium: "Assamese Medium",
    category: "Premium",
    tags: ["Important Questions", "Chapter-wise Notes"],
    chapters: [],
    coverImagePath: "https://user46792.na.imgto.link/public/20261021/4cdf18f40b84ec2326f0e6dd-assameseww.avif",
    driveFileLink: "https://drive.google.com/uc?export=download&id=125jtbu28z9Mso6OZeW0saCsXqQ8jQnCv",
    fileType: "PDF Document",
    pdfFileName: "hslc-2027-assamese-class-10.pdf",
    pdfStoragePath: "",
    pageCount: 208,
    originalPricePaise: 19900,
    sellingPricePaise: 9900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: "2026-10-21T13:13:09.139Z",
    updatedAt: "2026-10-21T13:36:24.588Z"
  },
  {
    id: "prod_1792587796027_h9uus",
    title: "HSLC-2027: Social Science (\u09B8\u09AE\u09BE\u099C \u09AC\u09BF\u099C\u09CD\u099E\u09BE\u09A8)",
    slug: "hslc-2027-social-science",
    shortDescription: "MKR ACADEMY | SOCIAL SCIENCE NOTES \u2013 HSLC 2027. Chapter-wise complete notes for easy learning.",
    description: "MKR ACADEMY | SOCIAL SCIENCE NOTES \u2013 HSLC 2027\n\n1. Chapter-wise complete notes for easy learning.\n2. Important Previous Year Questions (PYQs).\n3. Most Important 1, 2, 3 & 5 Mark Questions.\n4. Exam-oriented answers for quick revision.\n5. Perfect for HSLC 2027 preparation and scoring better marks.\n\nPrice: Only \u20B999\n\nPrepare smarter with MKR Academy!",
    subject: "Social Science",
    classLevel: "HSLC 2027",
    examTarget: "HSLC 2027(ASSEB/SABA)",
    medium: "Assamese Medium",
    category: "Premium",
    tags: ["Important Questions", "Chapter-wise Notes"],
    chapters: [],
    coverImagePath: "https://user46792.na.imgto.link/public/20261021/31d28f4e794d9dd10411f5ee-socialvv.avif",
    driveFileLink: "https://drive.google.com/uc?export=download&id=1whbiH5gjDGHmuacCBaUJ3zW6B2zZAYqh",
    fileType: "PDF Document",
    pdfFileName: "hslc-2027-social-science.pdf",
    pdfStoragePath: "",
    pageCount: 209,
    originalPricePaise: 19900,
    sellingPricePaise: 9900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: "2026-10-21T13:03:16.027Z",
    updatedAt: "2026-10-21T13:07:19.943Z"
  }
];
var INITIAL_FREE_NOTES = [
  {
    id: "prod_1792589249434_kwfee",
    title: "Madam rides the bus",
    slug: "madam-rides-the-bus",
    shortDescription: "Madam rides the bus free chapter note and question answers.",
    description: "Madam rides the bus free chapter note and question answers for HSLC 2027 Board Exam.",
    subject: "English",
    classLevel: "HSLC 2027",
    examTarget: "HSLC 2027 Board Exam",
    medium: "English Medium",
    category: "Normal",
    tags: ["Important Questions", "Chapter-wise Notes", "Free PDF"],
    chapters: ["Madam rides the bus"],
    coverImagePath: "https://user46792.na.imgto.link/public/20261021/22ab0a34a0090b167878d87d-madam-reee.avif",
    driveFileLink: "https://drive.google.com/uc?export=download&id=1LuQDa9mQ6YtnkYl0eAgEJYAlFnvEiXOK",
    fileType: "PDF Document",
    pdfFileName: "madam-rides-the-bus.pdf",
    pdfStoragePath: "",
    pageCount: 3,
    originalPricePaise: 0,
    sellingPricePaise: 0,
    isFree: true,
    featured: false,
    published: true,
    createdAt: "2026-10-21T13:27:29.434Z",
    updatedAt: "2026-10-22T03:47:46.578Z"
  },
  {
    id: "prod_1792823094592_ririu",
    title: "\u0987\u09A3\u09CD\u099F\u09BE\u09F0\u09A8\u09C7\u099F\u09F0 \u09A4\u09BF\u09A4\u09BE-\u09AE\u09BF\u09A0\u09BE FREE",
    slug: "free",
    shortDescription: "\u0987\u09A3\u09CD\u099F\u09BE\u09F0\u09A8\u09C7\u099F\u09F0 \u09A4\u09BF\u09A4\u09BE-\u09AE\u09BF\u09A0\u09BE free chapter notes for HSLC 2027.",
    description: "\u0987\u09A3\u09CD\u099F\u09BE\u09F0\u09A8\u09C7\u099F\u09F0 \u09A4\u09BF\u09A4\u09BE-\u09AE\u09BF\u09A0\u09BE free chapter notes for HSLC 2027 Board Exam.",
    subject: "Assamese",
    classLevel: "HSLC 2027",
    examTarget: "HSLC 2027 Board Exam",
    medium: "Both Mediums",
    category: "Normal",
    tags: ["Important Questions", "Chapter-wise Notes", "Free PDF"],
    chapters: ["\u0987\u09A3\u09CD\u099F\u09BE\u09F0\u09A8\u09C7\u099F\u09F0 \u09A4\u09BF\u09A4\u09BE-\u09AE\u09BF\u09A0\u09BE"],
    coverImagePath: "https://user46792.na.imgto.link/public/20261024/7ef7a3af1129d3c1e32cf750-class-10-hslc-2027-pdf-lesson.avif",
    driveFileLink: "https://drive.google.com/file/d/1kGWb3fCYFMI7NC_1hHi8AsN32XaX_sXK/view?usp=drivesdk",
    fileType: "PDF Document",
    pdfFileName: "ASSAMESE",
    pdfStoragePath: "",
    pageCount: 2,
    originalPricePaise: 0,
    sellingPricePaise: 0,
    isFree: true,
    featured: false,
    published: true,
    createdAt: "2026-10-24T06:24:54.592Z",
    updatedAt: "2026-10-24T06:24:54.592Z"
  }
];

// src/server/ogMetadata.ts
var DEFAULT_SITE_NAME = "MKR Academy";
var DEFAULT_TITLE = "MKR Academy \u2014 Educational Notes & HSLC 2027 Preparation";
var DEFAULT_DESCRIPTION = "Quality educational notes, chapter-wise study materials, and HSLC 2027 preparation for Class 10 & 9 students in Assamese and English mediums.";
var FIRESTORE_FETCH_TIMEOUT_MS = 3500;
var cachedProdHtmlTemplate = null;
function escapeHtmlAttr(value) {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
}
function serializeSafeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
function resolvePublicOrigin(req) {
  const rawHost = req.headers["x-forwarded-host"]?.split(",")[0]?.trim() || req.headers.host?.trim() || "";
  const safeHostMatch = rawHost.match(/^[a-zA-Z0-9.-]+(?::[0-9]{1,5})?$/);
  if (safeHostMatch) {
    const host = safeHostMatch[0];
    const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("0.0.0.0");
    const forwardedProto = req.headers["x-forwarded-proto"]?.split(",")[0]?.trim();
    const protocol = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : isLocalHost ? "http" : "https";
    return `${protocol}://${host}`;
  }
  const envUrl = (process.env.URL || process.env.APP_URL || "").trim().replace(/\/+$/, "");
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    return envUrl;
  }
  return "https://mkracademy.in";
}
function resolveOgImageUrl(rawPath, origin) {
  const fallbackUrl = `${origin}/icon-512.png`;
  if (!rawPath || typeof rawPath !== "string") return fallbackUrl;
  const trimmed = rawPath.trim();
  if (!trimmed) return fallbackUrl;
  if (/^(data|blob|javascript|vbscript|file):/i.test(trimmed)) {
    return fallbackUrl;
  }
  if (trimmed.startsWith("/")) {
    return `${origin}${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return fallbackUrl;
    }
    return parsed.toString();
  } catch {
    return fallbackUrl;
  }
}
function formatProductDescription(product, sellingRupees, isFree) {
  const baselineMatch = [...INITIAL_PRODUCTS, ...INITIAL_FREE_NOTES].find((p) => p.id === product.id);
  const rawCandidate = product.shortDescription?.trim() || product.description?.trim() || baselineMatch?.shortDescription?.trim() || baselineMatch?.description?.trim() || "";
  const raw = rawCandidate ? rawCandidate.replace(/[•▪◦●]/g, " ").replace(/\r?\n+/g, " ").replace(/\s{2,}/g, " ").trim() : [
    product.title || DEFAULT_SITE_NAME,
    [product.subject, product.classLevel, product.medium].filter(Boolean).join(" \u2022 "),
    product.pageCount ? `${product.pageCount} Pages PDF Notes` : "Study Notes PDF",
    `on ${DEFAULT_SITE_NAME}`
  ].filter(Boolean).join(" \u2014 ");
  const priceTag = isFree ? "Free PDF" : `Price: \u20B9${sellingRupees}`;
  const hasPriceAlready = raw.includes("\u20B9") || /\bfree\b/i.test(raw);
  const suffixParts = [];
  if (!hasPriceAlready) suffixParts.push(priceTag);
  if (product.classLevel && !raw.toLowerCase().includes(product.classLevel.toLowerCase())) {
    suffixParts.push(product.classLevel);
  }
  if (product.subject && !raw.toLowerCase().includes(product.subject.toLowerCase())) {
    suffixParts.push(product.subject);
  }
  const suffix = suffixParts.length > 0 ? ` (${suffixParts.join(" \u2022 ")})` : "";
  const maxBaseLen = Math.max(80, 185 - suffix.length);
  const baseText = raw.length > maxBaseLen ? raw.slice(0, maxBaseLen - 1).trimEnd() + "\u2026" : raw;
  return `${baseText}${suffix}`.trim();
}
async function withTimeout(promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      })
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
async function fetchProductForOg(rawProductId) {
  const productId = sanitizeId(rawProductId);
  if (!productId) return null;
  const productSnap = await withTimeout(
    getDoc4(doc6(db, "products", productId)),
    FIRESTORE_FETCH_TIMEOUT_MS
  );
  if (productSnap && productSnap.exists()) {
    const data = productSnap.data();
    if (data.published === false) return null;
    return { ...data, id: productSnap.id };
  }
  const freeSnap = await withTimeout(
    getDoc4(doc6(db, "freeNotes", productId)),
    FIRESTORE_FETCH_TIMEOUT_MS
  );
  if (freeSnap && freeSnap.exists()) {
    const data = freeSnap.data();
    if (data.published === false) return null;
    return { ...data, id: freeSnap.id, isFree: true };
  }
  const baselinePool = [...INITIAL_PRODUCTS, ...INITIAL_FREE_NOTES];
  const matchedBaseline = baselinePool.find(
    (item) => (item.id === productId || item.slug === productId) && item.published !== false
  );
  return matchedBaseline || null;
}
function buildProductOgMeta(product, origin) {
  const sellingPaise = Number(product.sellingPricePaise ?? 0);
  const isFree = Boolean(product.isFree || sellingPaise <= 0);
  const sellingRupees = isFree ? 0 : Math.round(sellingPaise / 100);
  const priceAmount = isFree ? "0.00" : (sellingPaise / 100).toFixed(2);
  const title = (product.title || DEFAULT_SITE_NAME).trim();
  const pageTitle = `${title} \u2014 ${DEFAULT_SITE_NAME}`;
  const description = formatProductDescription(product, sellingRupees, isFree);
  const imageUrl = resolveOgImageUrl(product.coverImagePath, origin);
  const canonicalUrl = `${origin}/product/${encodeURIComponent(product.id)}`;
  return {
    id: product.id,
    title,
    pageTitle,
    description,
    imageUrl,
    imageAlt: `${title} \u2014 ${DEFAULT_SITE_NAME}`,
    url: canonicalUrl,
    siteName: DEFAULT_SITE_NAME,
    type: "product",
    priceAmount,
    currency: "INR",
    isFree,
    subject: product.subject,
    classLevel: product.classLevel,
    medium: product.medium
  };
}
function injectOgMetaIntoHtml(baseHtml, meta, origin, requestPath = "/") {
  const cleanedHtml = baseHtml.replace(/<title>[\s\S]*?<\/title>\s*/gi, "").replace(/<meta[^>]+name=["']description["'][^>]*\/?>\s*/gi, "").replace(/<meta[^>]+property=["'](?:og|product):[^"']*["'][^>]*\/?>\s*/gi, "").replace(/<meta[^>]+name=["']twitter:[^"']*["'][^>]*\/?>\s*/gi, "").replace(/<link[^>]+rel=["']canonical["'][^>]*\/?>\s*/gi, "").replace(/<script[^>]+id=["']mkr-product-jsonld["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");
  const fallbackUrl = `${origin}${requestPath.startsWith("/") ? requestPath : `/${requestPath}`}`;
  const fallbackImage = `${origin}/icon-512.png`;
  let headTags;
  if (meta) {
    const jsonLd = serializeSafeJsonLd({
      "@context": "https://schema.org",
      "@type": "Product",
      name: meta.title,
      description: meta.description,
      image: [meta.imageUrl],
      url: meta.url,
      brand: {
        "@type": "Organization",
        name: DEFAULT_SITE_NAME
      },
      offers: {
        "@type": "Offer",
        priceCurrency: meta.currency,
        price: meta.priceAmount,
        availability: "https://schema.org/InStock",
        url: meta.url,
        seller: {
          "@type": "Organization",
          name: DEFAULT_SITE_NAME
        }
      }
    });
    headTags = [
      `<title>${escapeHtmlAttr(meta.pageTitle)}</title>`,
      `<meta name="description" content="${escapeHtmlAttr(meta.description)}" />`,
      `<link rel="canonical" href="${escapeHtmlAttr(meta.url)}" />`,
      `<meta property="og:title" content="${escapeHtmlAttr(meta.title)}" />`,
      `<meta property="og:description" content="${escapeHtmlAttr(meta.description)}" />`,
      `<meta property="og:image" content="${escapeHtmlAttr(meta.imageUrl)}" />`,
      ...meta.imageUrl.startsWith("https://") ? [`<meta property="og:image:secure_url" content="${escapeHtmlAttr(meta.imageUrl)}" />`] : [],
      `<meta property="og:image:alt" content="${escapeHtmlAttr(meta.imageAlt)}" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      `<meta property="og:url" content="${escapeHtmlAttr(meta.url)}" />`,
      `<meta property="og:type" content="product" />`,
      `<meta property="og:site_name" content="${escapeHtmlAttr(meta.siteName)}" />`,
      `<meta property="og:locale" content="en_IN" />`,
      `<meta property="product:price:amount" content="${escapeHtmlAttr(meta.priceAmount)}" />`,
      `<meta property="product:price:currency" content="INR" />`,
      `<meta property="product:availability" content="in stock" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}" />`,
      `<meta name="twitter:description" content="${escapeHtmlAttr(meta.description)}" />`,
      `<meta name="twitter:image" content="${escapeHtmlAttr(meta.imageUrl)}" />`,
      `<meta name="twitter:image:alt" content="${escapeHtmlAttr(meta.imageAlt)}" />`,
      `<script id="mkr-product-jsonld" type="application/ld+json">${jsonLd}</script>`
    ].join("\n    ");
  } else {
    headTags = [
      `<title>${escapeHtmlAttr(DEFAULT_TITLE)}</title>`,
      `<meta name="description" content="${escapeHtmlAttr(DEFAULT_DESCRIPTION)}" />`,
      `<link rel="canonical" href="${escapeHtmlAttr(fallbackUrl)}" />`,
      `<meta property="og:title" content="${escapeHtmlAttr(DEFAULT_TITLE)}" />`,
      `<meta property="og:description" content="${escapeHtmlAttr(DEFAULT_DESCRIPTION)}" />`,
      `<meta property="og:image" content="${escapeHtmlAttr(fallbackImage)}" />`,
      `<meta property="og:url" content="${escapeHtmlAttr(fallbackUrl)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="${escapeHtmlAttr(DEFAULT_SITE_NAME)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtmlAttr(DEFAULT_TITLE)}" />`,
      `<meta name="twitter:description" content="${escapeHtmlAttr(DEFAULT_DESCRIPTION)}" />`,
      `<meta name="twitter:image" content="${escapeHtmlAttr(fallbackImage)}" />`
    ].join("\n    ");
  }
  const viewportRegex = /(<meta[^>]+name=["']viewport["'][^>]*\/?>)/i;
  if (viewportRegex.test(cleanedHtml)) {
    return cleanedHtml.replace(viewportRegex, `$1
    ${headTags}`);
  }
  return cleanedHtml.replace(/<\/head>/i, `    ${headTags}
  </head>`);
}
async function loadProductionHtmlTemplate(origin) {
  if (cachedProdHtmlTemplate) return cachedProdHtmlTemplate;
  const moduleDir = (() => {
    try {
      if (typeof __dirname !== "undefined") return __dirname;
    } catch {
    }
    try {
      if (import.meta?.url) return path.dirname(fileURLToPath(import.meta.url));
    } catch {
    }
    return process.cwd();
  })();
  const candidatePaths = [
    path.resolve(process.cwd(), "dist", "index.html"),
    path.resolve(moduleDir, "..", "..", "dist", "index.html"),
    path.resolve(moduleDir, "..", "dist", "index.html")
  ];
  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, "utf-8");
        if (content && content.includes('id="root"')) {
          cachedProdHtmlTemplate = content;
          return content;
        }
      }
    } catch {
    }
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${origin}/index.html`, {
      signal: controller.signal,
      headers: { Accept: "text/html" }
    });
    clearTimeout(timer);
    if (res.ok) {
      const text = await res.text();
      if (text && text.includes('id="root"')) {
        cachedProdHtmlTemplate = text;
        return text;
      }
    }
  } catch {
  }
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${DEFAULT_TITLE}</title>
  </head>
  <body class="bg-stone-50 text-stone-900 antialiased">
    <div id="root"></div>
    <script>window.location.replace(window.location.pathname + window.location.search);</script>
  </body>
</html>`;
}
async function renderProductPageHtml(rawProductId, req, baseHtmlOverride) {
  const origin = resolvePublicOrigin(req);
  const productId = sanitizeId(rawProductId);
  const [product, baseHtml] = await Promise.all([
    productId ? fetchProductForOg(productId) : Promise.resolve(null),
    baseHtmlOverride ? Promise.resolve(baseHtmlOverride) : loadProductionHtmlTemplate(origin)
  ]);
  const meta = product ? buildProductOgMeta(product, origin) : null;
  const fallbackPath = productId ? `/product/${encodeURIComponent(productId)}` : "/";
  return injectOgMetaIntoHtml(baseHtml, meta, origin, fallbackPath);
}

// src/server/api.ts
dotenv.config();
var processedPayments = /* @__PURE__ */ new Set();
var serverRecordedDownloads = /* @__PURE__ */ new Map();
function createApiApp() {
  const app3 = express();
  app3.disable("x-powered-by");
  app3.use(securityHeadersMiddleware);
  app3.use(corsMiddleware);
  app3.use(
    express.json({
      limit: "2mb",
      // Restricted payload size to prevent memory-exhaustion attacks
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app3.use(express.urlencoded({ extended: true, limit: "2mb" }));
  const router = Router();
  router.use(globalApiLimiter);
  const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID || "rzp_live_TqPdwQmi6yOprh";
  const getRazorpayKeySecret = () => process.env.RAZORPAY_KEY_SECRET || "eIJMyjZbJkBgLgWB59HYX7hn";
  const getRazorpayWebhookSecret = () => process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const getAdminEmail = () => (process.env.ADMIN_EMAIL || "muktar9085mkr@gmail.com").toLowerCase();
  const isProduction = () => process.env.NODE_ENV === "production";
  router.get("/health", (_req, res) => {
    const keyId = getRazorpayKeyId();
    const inProd = isProduction();
    res.json({
      status: "ok",
      brand: "MKR Academy",
      version: "1.2.0",
      isLive: keyId.startsWith("rzp_live_"),
      database: "Cloud Firestore (Enterprise)",
      security: {
        authentication: "Enforced on protected routes",
        rateLimiting: "Active",
        cors: "Locked down",
        inputSanitization: "Active",
        botProtection: "Active",
        idorProtection: "Active",
        storageSecurity: "Enforced",
        cspHeaders: "Enforced"
      },
      // In development, provide diagnostic details; omit in production
      ...inProd ? {} : {
        adminEmail: getAdminEmail(),
        keyId,
        mode: keyId.startsWith("rzp_live_") ? "live" : "test",
        razorpayConfigured: Boolean(keyId && getRazorpayKeySecret())
      }
    });
  });
  router.get("/payment/config", (_req, res) => {
    const keyId = getRazorpayKeyId();
    res.json({
      keyId,
      mode: keyId.startsWith("rzp_live_") ? "live" : "test",
      isLive: keyId.startsWith("rzp_live_"),
      isConfigured: Boolean(keyId && getRazorpayKeySecret()),
      currency: "INR"
    });
  });
  router.post(
    "/payment/create-order",
    createOrderLimiter,
    botProtectionMiddleware(),
    requireAuth,
    async (req, res) => {
      try {
        const rawProductId = req.body.productId;
        const rawStudentInfo = req.body.studentInfo;
        const productId = sanitizeId(rawProductId);
        if (!productId) {
          res.status(400).json({ error: "Valid productId is required" });
          return;
        }
        const studentPhone = sanitizeIndianPhone(rawStudentInfo?.phoneNumber);
        if (!studentPhone) {
          res.status(400).json({ error: "A valid 10-digit Indian mobile number is mandatory (starting with 6-9)" });
          return;
        }
        const studentName = sanitizeText(rawStudentInfo?.name || "", 100);
        const studentEmail = sanitizeEmail(rawStudentInfo?.email) || req.user?.email || "";
        const productRef = doc7(db, "products", productId);
        const productSnap = await getDoc5(productRef);
        if (!productSnap.exists()) {
          res.status(404).json({ error: "Selected study material product was not found in database" });
          return;
        }
        const productData = productSnap.data();
        if (productData.published === false) {
          res.status(400).json({ error: "This study material is currently not available for purchase" });
          return;
        }
        const authoritativePricePaise = sanitizeAmountPaise(productData.sellingPricePaise);
        if (!authoritativePricePaise) {
          res.status(500).json({ error: "Product pricing is incorrectly configured in database" });
          return;
        }
        const orderReceipt = `mkr_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const keyId = getRazorpayKeyId();
        const keySecret = getRazorpayKeySecret();
        if (!keyId || !keySecret) {
          res.status(500).json({ error: "Razorpay payment gateway credentials are not configured on server" });
          return;
        }
        const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader
          },
          body: JSON.stringify({
            amount: authoritativePricePaise,
            currency: "INR",
            receipt: orderReceipt,
            notes: {
              productId,
              productTitle: sanitizeText(productData.title || "", 40),
              studentUid: req.user.uid,
              // Bound to authenticated student
              studentPhone,
              studentEmail
            }
          })
        });
        if (!rzpResponse.ok) {
          const errorBody = await rzpResponse.json().catch(() => ({}));
          console.error("Razorpay API error creating order:", rzpResponse.status, errorBody);
          res.status(rzpResponse.status || 502).json({
            error: errorBody?.error?.description || "Razorpay order creation failed. Please verify live credentials.",
            code: errorBody?.error?.code
          });
          return;
        }
        const rzpOrder = await rzpResponse.json();
        res.json({
          success: true,
          orderId: rzpOrder.id,
          receipt: orderReceipt,
          amount: rzpOrder.amount,
          // Authoritative price returned by server
          currency: rzpOrder.currency,
          keyId,
          isLive: keyId.startsWith("rzp_live_")
        });
      } catch (error) {
        console.error("Error creating payment order:", error);
        res.status(500).json({ error: isProduction() ? "Server error creating order" : error?.message });
      }
    }
  );
  router.post(
    "/payment/verify",
    verifyPaymentLimiter,
    requireAuth,
    async (req, res) => {
      try {
        const rawRazorpayOrderId = req.body.razorpayOrderId;
        const rawRazorpayPaymentId = req.body.razorpayPaymentId;
        const rawRazorpaySignature = req.body.razorpaySignature;
        const rawOrderId = req.body.orderId;
        const rawProductId = req.body.productId;
        const rawStudentId = req.body.studentId;
        const razorpayOrderId = sanitizeId(rawRazorpayOrderId);
        const razorpayPaymentId = sanitizeId(rawRazorpayPaymentId);
        const razorpaySignature = sanitizeText(rawRazorpaySignature, 128);
        const orderId = sanitizeId(rawOrderId);
        const productId = sanitizeId(rawProductId);
        const studentId = sanitizeId(rawStudentId);
        if (!razorpayOrderId || !razorpayPaymentId) {
          res.status(400).json({ error: "Missing or malformed payment identifiers" });
          return;
        }
        if (studentId && studentId !== req.user.uid && req.user.email !== getAdminEmail()) {
          res.status(403).json({ error: "Unauthorized: Cannot verify payment for another user account" });
          return;
        }
        if (processedPayments.has(razorpayPaymentId)) {
          res.json({
            success: true,
            alreadyProcessed: true,
            message: "Payment has already been verified and processed."
          });
          return;
        }
        let isValid = false;
        const keySecret = getRazorpayKeySecret();
        const keyId = getRazorpayKeyId();
        if (razorpaySignature && keySecret) {
          const generatedSignature = crypto.createHmac("sha256", keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
          const expectedBuf = Buffer.from(generatedSignature, "utf8");
          const receivedBuf = Buffer.from(razorpaySignature, "utf8");
          if (expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
            isValid = true;
          }
        }
        if (!isValid && razorpayPaymentId.startsWith("pay_") && keyId && keySecret) {
          try {
            const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
            const pRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
              headers: { "Authorization": authHeader }
            });
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData.status === "captured") {
                isValid = true;
              }
            }
          } catch (captureErr) {
            console.warn("Direct Razorpay capture check error:", captureErr);
          }
        }
        if (!isValid) {
          res.status(400).json({
            success: false,
            error: "Invalid payment signature. Payment verification failed."
          });
          return;
        }
        processedPayments.add(razorpayPaymentId);
        const verifiedAt = (/* @__PURE__ */ new Date()).toISOString();
        const effectiveStudentId = studentId || req.user.uid;
        const purchaseId = `pur_${effectiveStudentId}_${productId || "prod"}`.replace(/[^a-zA-Z0-9_-]/g, "_");
        res.json({
          success: true,
          verified: true,
          orderId,
          purchaseId,
          verifiedAt,
          message: "Payment successfully verified by server"
        });
      } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: isProduction() ? "Server error verifying payment" : error?.message });
      }
    }
  );
  router.post(
    "/payment/check-status",
    checkStatusLimiter,
    requireAuth,
    async (req, res) => {
      try {
        const razorpayOrderId = sanitizeId(req.body.razorpayOrderId);
        const razorpayPaymentId = sanitizeId(req.body.razorpayPaymentId);
        const orderCreatedAt = sanitizeText(req.body.orderCreatedAt, 50);
        const statusResult = await queryRazorpayPaymentStatus({
          razorpayOrderId: razorpayOrderId || void 0,
          razorpayPaymentId: razorpayPaymentId || void 0,
          orderCreatedAt: orderCreatedAt || void 0,
          keyId: getRazorpayKeyId(),
          keySecret: getRazorpayKeySecret()
        });
        res.json(statusResult);
      } catch (err) {
        console.error("Error checking Razorpay payment status:", err);
        res.status(500).json({
          status: "uncertain",
          error: isProduction() ? "Server error checking status" : err?.message
        });
      }
    }
  );
  router.post(
    "/admin/approve-payment",
    adminApproveLimiter,
    requireAdmin,
    async (req, res) => {
      try {
        const orderId = sanitizeId(req.body.orderId);
        const razorpayPaymentId = sanitizeText(req.body.razorpayPaymentId || "", 100);
        const remark = sanitizeText(req.body.remark || "", 300);
        if (!orderId) {
          res.status(400).json({ error: "Order ID is required" });
          return;
        }
        const adminEmail = req.user.email || getAdminEmail();
        const adminUid = req.user.uid;
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        console.log(
          `[SECURE MANUAL APPROVAL] Order ${orderId} manually approved by verified admin ${adminEmail} (UID: ${adminUid}) at ${timestamp}. Ref: ${razorpayPaymentId || "N/A"}. Remark: ${remark || "None"}`
        );
        try {
          const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await setDoc4(doc7(db, "admin_activity_logs", logId), {
            id: logId,
            adminUid,
            adminEmail,
            action: "MANUAL_PAYMENT_APPROVAL",
            targetId: orderId,
            targetType: "order",
            details: {
              razorpayPaymentId: razorpayPaymentId || "N/A",
              remark: remark || "Admin manual approval"
            },
            timestamp,
            createdAt: timestamp
          });
        } catch (logErr) {
          console.warn("Audit log write warning:", logErr);
        }
        res.json({
          success: true,
          message: "Payment successfully approved by administrator",
          orderId,
          approvedAt: timestamp,
          approvedBy: adminEmail
        });
      } catch (err) {
        console.error("Error in manual payment approval API:", err);
        res.status(500).json({ error: isProduction() ? "Failed to process manual payment approval" : err?.message });
      }
    }
  );
  router.get(
    "/admin/audit-logs",
    requireAdmin,
    async (_req, res) => {
      try {
        const q = query3(
          collection3(db, "admin_activity_logs"),
          orderBy3("createdAt", "desc"),
          limit2(50)
        );
        const snap = await getDocs3(q);
        const logs = snap.docs.map((d) => d.data());
        res.json({ logs });
      } catch (err) {
        console.error("Error fetching audit logs:", err);
        res.status(500).json({ error: "Failed to retrieve audit logs" });
      }
    }
  );
  router.get(
    "/admin/security-alerts",
    requireAdmin,
    (_req, res) => {
      try {
        const alerts = getRecentSecurityAlerts(50);
        res.json({ alerts, count: alerts.length });
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch security alerts" });
      }
    }
  );
  router.post(
    "/admin/sessions/revoke",
    requireAdmin,
    async (req, res) => {
      try {
        const sessionId = sanitizeId(req.body.sessionId);
        if (!sessionId) {
          res.status(400).json({ error: "Session ID is required" });
          return;
        }
        const sessionRef = doc7(db, "user_sessions", sessionId);
        const snap = await getDoc5(sessionRef);
        if (!snap.exists()) {
          res.status(404).json({ error: "Session not found" });
          return;
        }
        const adminEmail = req.user?.email || getAdminEmail();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await updateDoc2(sessionRef, {
          status: "revoked",
          revokedAt: now,
          revokedBy: adminEmail
        });
        res.json({ success: true, message: `Session ${sessionId} has been successfully revoked.` });
      } catch (err) {
        console.error("Error revoking session:", err);
        res.status(500).json({ error: "Failed to revoke session" });
      }
    }
  );
  router.post(
    "/admin/sessions/force-logout-user",
    requireAdmin,
    async (req, res) => {
      try {
        const targetUid = sanitizeId(req.body.uid);
        if (!targetUid) {
          res.status(400).json({ error: "Target user UID is required" });
          return;
        }
        const adminEmail = req.user?.email || getAdminEmail();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const q = query3(collection3(db, "user_sessions"), where2("uid", "==", targetUid));
        const snap = await getDocs3(q);
        let revokedCount = 0;
        for (const docSnap of snap.docs) {
          if (docSnap.data().status === "active") {
            await updateDoc2(docSnap.ref, {
              status: "revoked",
              revokedAt: now,
              revokedBy: adminEmail
            });
            revokedCount++;
          }
        }
        res.json({
          success: true,
          message: `Successfully terminated ${revokedCount} active session(s) for user.`,
          revokedCount
        });
      } catch (err) {
        console.error("Error force logging out user:", err);
        res.status(500).json({ error: "Failed to force logout user" });
      }
    }
  );
  router.post(
    "/admin/users/update-status",
    requireAdmin,
    async (req, res) => {
      try {
        const targetUid = sanitizeId(req.body.uid);
        const status = req.body.status;
        const reason = sanitizeText(req.body.reason || "", 300);
        if (!targetUid || !["active", "suspended", "blocked"].includes(status)) {
          res.status(400).json({ error: "Valid target UID and status (active, suspended, blocked) are required." });
          return;
        }
        const adminEmail = req.user?.email || getAdminEmail();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const userRef = doc7(db, "users", targetUid);
        const updatePayload = {
          status,
          updatedAt: now
        };
        if (status === "suspended") {
          updatePayload.suspendedAt = now;
          updatePayload.suspendedBy = adminEmail;
          updatePayload.suspendedReason = reason || "Suspended by administrator";
        } else if (status === "blocked") {
          updatePayload.blockedAt = now;
          updatePayload.blockedBy = adminEmail;
          updatePayload.blockedReason = reason || "Blocked by administrator";
        } else if (status === "active") {
          updatePayload.restoredAt = now;
          updatePayload.restoredBy = adminEmail;
          updatePayload.suspendedReason = null;
          updatePayload.blockedReason = null;
        }
        await updateDoc2(userRef, updatePayload);
        res.json({
          success: true,
          message: `User status successfully updated to ${status}.`,
          status
        });
      } catch (err) {
        console.error("Error updating user status:", err);
        res.status(500).json({ error: "Failed to update user status" });
      }
    }
  );
  router.get(
    "/admin/backup/export",
    requireAdmin,
    async (_req, res) => {
      try {
        const collectionsToExport = ["products", "freeNotes", "orders", "purchases", "appSettings", "homepage_banners", "homepage_media"];
        const backupData = {};
        for (const colName of collectionsToExport) {
          try {
            const snap = await getDocs3(collection3(db, colName));
            backupData[colName] = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
          } catch (colErr) {
            console.warn(`Export warning for ${colName}:`, colErr);
            backupData[colName] = [];
          }
        }
        const snapshotJson = JSON.stringify(backupData);
        const checksum = crypto.createHash("sha256").update(snapshotJson).digest("hex");
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="mkr_academy_backup_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`);
        res.json({
          exportTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
          brand: "MKR Academy",
          checksum,
          itemCounts: Object.fromEntries(Object.entries(backupData).map(([k, v]) => [k, v.length])),
          data: backupData
        });
      } catch (err) {
        console.error("Backup export failed:", err);
        res.status(500).json({ error: "Failed to generate backup export" });
      }
    }
  );
  router.post(
    "/admin/validate-file",
    requireAdmin,
    (req, res) => {
      try {
        const { fileName, fileSizeBytes, mimeType, expectedCategory } = req.body;
        const validation = validateFileMetadata({
          fileName: sanitizeText(fileName, 200),
          fileSizeBytes: Number(fileSizeBytes) || 0,
          mimeType: sanitizeText(mimeType, 100),
          expectedCategory: expectedCategory === "pdf" ? "pdf" : "image"
        });
        res.json(validation);
      } catch (err) {
        console.error("File validation error:", err);
        res.status(500).json({ isValid: false, error: "File validation failed" });
      }
    }
  );
  router.post("/payment/webhook", (req, res) => {
    try {
      const webhookSignature = req.headers["x-razorpay-signature"];
      const webhookSecret = getRazorpayWebhookSecret();
      if (webhookSecret) {
        if (!webhookSignature) {
          console.warn("\u26A0\uFE0F Webhook rejected: Missing x-razorpay-signature header");
          res.status(400).json({ error: "Missing x-razorpay-signature header" });
          return;
        }
        const rawPayload = req.rawBody || Buffer.from(JSON.stringify(req.body));
        const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawPayload).digest("hex");
        const expectedBuf = Buffer.from(expectedSignature, "utf8");
        const receivedBuf = Buffer.from(webhookSignature, "utf8");
        if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
          console.warn("\u26A0\uFE0F Webhook rejected: Signature mismatch from Razorpay");
          res.status(400).json({ error: "Invalid webhook signature" });
          return;
        }
      }
      const event = req.body?.event;
      console.log(`\u{1F4E1} Razorpay Webhook Event: ${event}`);
      if (event === "payment.captured" || event === "order.paid") {
        const paymentEntity = req.body?.payload?.payment?.entity;
        const paymentId = paymentEntity?.id;
        if (paymentId) {
          if (processedPayments.has(paymentId)) {
            res.json({ status: "ok", alreadyProcessed: true });
            return;
          }
          processedPayments.add(paymentId);
          console.log(`\u2705 Webhook verified payment captured: ${paymentId}`);
        }
      } else if (event === "payment.failed") {
        const paymentId = req.body?.payload?.payment?.entity?.id;
        console.warn(`\u274C Webhook payment failed notification: ${paymentId}`);
      }
      res.json({ status: "ok", received: true });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).json({ error: "Webhook processing error" });
    }
  });
  router.get(
    "/notes/download/:purchaseId",
    downloadNoteLimiter,
    requireAuth,
    async (req, res) => {
      try {
        const purchaseId = sanitizeId(req.params.purchaseId);
        if (!purchaseId) {
          res.status(400).json({ error: "Valid purchase ID is required" });
          return;
        }
        const purchaseRef = doc7(db, "purchases", purchaseId);
        const purchaseSnap = await getDoc5(purchaseRef);
        if (!purchaseSnap.exists()) {
          res.status(404).json({ error: "Purchase record not found" });
          return;
        }
        const purchase = purchaseSnap.data();
        if (!req.user) {
          res.status(401).json({ error: "Please sign in to access your purchased notes." });
          return;
        }
        const isOwner = purchase.uid === req.user.uid;
        const isAdminUser = Boolean(
          req.user.email && req.user.email.toLowerCase() === getAdminEmail()
        );
        if (!isOwner && !isAdminUser) {
          res.status(403).json({ error: "Access denied: You do not own this purchase entitlement." });
          return;
        }
        if (purchase.entitlementStatus !== "active" && !isAdminUser) {
          res.status(403).json({ error: "This purchase entitlement is no longer active." });
          return;
        }
        const destinationUrl = purchase.driveFileLink;
        if (destinationUrl && typeof destinationUrl === "string" && destinationUrl.startsWith("https://")) {
          res.redirect(destinationUrl);
          return;
        }
        res.redirect("https://drive.google.com/drive/my-drive");
      } catch (err) {
        console.error("Error serving note download:", err);
        res.status(500).json({ error: "Failed to authorize note access" });
      }
    }
  );
  router.get("/cron/status", (_req, res) => {
    res.json({
      policy: "Pending -> Failed after 24 hours (verified with Razorpay); Failed entries -> cleared after 30 days",
      ...getLastSchedulerStatus()
    });
  });
  router.all("/cron/payment-reconciliation-cleanup", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const cronSecret = process.env.CRON_SECRET || "mkr_cron_daily_secure_key_2026";
      const providedSecret = req.headers["x-cron-token"] || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);
      if (process.env.CRON_SECRET && providedSecret !== cronSecret) {
        res.status(401).json({ error: "Unauthorized cron request" });
        return;
      }
      const runResult = await runServerPaymentMaintenance();
      res.json({
        policy: "Pending -> Failed after 24h (Razorpay verified); Failed entries archived after 30d",
        ...runResult
      });
    } catch (err) {
      res.status(500).json({ error: err?.message || "Reconciliation cron failed" });
    }
  });
  router.post("/downloads/record", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.uid) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      const { eventId, productId, pdfId, pdfName, isFree, device } = req.body;
      const sanitizedEventId = sanitizeId(eventId || "");
      const sanitizedProductId = sanitizeId(productId || "");
      if (!sanitizedEventId || !sanitizedProductId) {
        res.status(400).json({ error: "Missing required eventId or productId" });
        return;
      }
      if (serverRecordedDownloads.has(sanitizedEventId)) {
        res.json({ success: true, idempotent: true, message: "Download already recorded" });
        return;
      }
      const prodRef = doc7(db, "products", sanitizedProductId);
      const freeNoteRef = doc7(db, "freeNotes", sanitizedProductId);
      let existingDocRef = null;
      let prodData = null;
      if (sanitizedProductId.startsWith("freenote_")) {
        const freeSnap = await getDoc5(freeNoteRef).catch(() => null);
        if (freeSnap && freeSnap.exists()) {
          existingDocRef = freeNoteRef;
          prodData = { ...freeSnap.data(), isFree: true, sellingPricePaise: 0 };
        }
      }
      if (!prodData) {
        const prodSnap = await getDoc5(prodRef).catch(() => null);
        if (prodSnap && prodSnap.exists()) {
          existingDocRef = prodRef;
          prodData = prodSnap.data();
        }
      }
      if (!prodData && !sanitizedProductId.startsWith("freenote_")) {
        const freeSnap = await getDoc5(freeNoteRef).catch(() => null);
        if (freeSnap && freeSnap.exists()) {
          existingDocRef = freeNoteRef;
          prodData = { ...freeSnap.data(), isFree: true, sellingPricePaise: 0 };
        }
      }
      if (!prodData) {
        if (Boolean(isFree)) {
          prodData = {
            title: sanitizeText(pdfName || "Free Study Note"),
            isFree: true,
            sellingPricePaise: 0
          };
        } else {
          res.status(404).json({ error: "Product not found" });
          return;
        }
      }
      const isPaid = !isFree && !prodData.isFree && Number(prodData.sellingPricePaise || 0) > 0;
      if (isPaid) {
        const isAdminUser = user.email?.toLowerCase() === getAdminEmail();
        if (!isAdminUser) {
          try {
            const purchasesQuery = query3(
              collection3(db, "purchases"),
              where2("uid", "==", user.uid),
              where2("productId", "==", sanitizedProductId),
              where2("entitlementStatus", "==", "active")
            );
            const purchaseSnap = await getDocs3(purchasesQuery);
            if (purchaseSnap.empty) {
              res.status(403).json({ error: "Active purchase required to download this material" });
              return;
            }
          } catch {
          }
        }
      }
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const sanitizedDevice = sanitizeText(device || "Web");
      const sanitizedPdfName = sanitizeText(pdfName || prodData?.title || "Educational Note");
      const sanitizedPdfId = sanitizeId(pdfId || "default");
      const eventData = {
        eventId: sanitizedEventId,
        productId: sanitizedProductId,
        productTitle: prodData?.title || "Educational Note",
        pdfId: sanitizedPdfId,
        pdfName: sanitizedPdfName,
        userId: user.uid,
        userEmail: user.email || "student@mkracademy.in",
        userName: user.displayName || "Student",
        isFree: !isPaid,
        downloadedAt: timestamp,
        device: sanitizedDevice
      };
      serverRecordedDownloads.set(sanitizedEventId, eventData);
      try {
        const eventDocRef = doc7(db, "download_events", sanitizedEventId);
        await setDoc4(eventDocRef, eventData);
      } catch {
      }
      if (existingDocRef) {
        try {
          await updateDoc2(existingDocRef, {
            downloadCount: increment(1),
            lastDownloadedAt: timestamp
          });
        } catch {
        }
      }
      res.json({
        success: true,
        recordedAt: timestamp,
        eventId: sanitizedEventId
      });
    } catch (err) {
      console.error("Failed to record download event:", err);
      res.status(500).json({ error: "Failed to record download" });
    }
  });
  router.get("/admin/download-analytics", requireAdmin, async (_req, res) => {
    try {
      const [prodSnap, freeSnap] = await Promise.all([
        getDocs3(collection3(db, "products")).catch(() => ({ forEach: () => {
        } })),
        getDocs3(collection3(db, "freeNotes")).catch(() => ({ forEach: () => {
        } }))
      ]);
      const productsMap = /* @__PURE__ */ new Map();
      prodSnap.forEach((d) => productsMap.set(d.id, { id: d.id, ...d.data() }));
      freeSnap.forEach((d) => productsMap.set(d.id, { id: d.id, ...d.data(), isFree: true, sellingPricePaise: 0 }));
      const usersSnap = await getDocs3(collection3(db, "users")).catch(() => ({ size: 0 }));
      const totalRegisteredStudents = usersSnap?.size || 0;
      const eventsSnap = await getDocs3(collection3(db, "download_events")).catch(() => ({ size: 0, forEach: () => {
      } }));
      const eventsMap = /* @__PURE__ */ new Map();
      eventsSnap.forEach((docSnap) => {
        eventsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
      serverRecordedDownloads.forEach((ev, id) => {
        if (!eventsMap.has(id)) {
          eventsMap.set(id, { id, ...ev });
        }
      });
      const events = [];
      const uniqueUserSet = /* @__PURE__ */ new Set();
      let freeDownloads = 0;
      let paidDownloads = 0;
      const productCountMap = /* @__PURE__ */ new Map();
      productsMap.forEach((p, pId) => {
        const isFree = Number(p.sellingPricePaise || 0) === 0;
        productCountMap.set(pId, {
          productId: pId,
          productTitle: p.title || "Untitled Material",
          isFree,
          freeCount: 0,
          paidCount: 0,
          totalCount: 0,
          lastDownloadedAt: p.lastDownloadedAt || "",
          pdfBreakdown: {}
        });
      });
      eventsMap.forEach((ev) => {
        events.push(ev);
        if (ev.userId) uniqueUserSet.add(ev.userId);
        if (ev.isFree) {
          freeDownloads++;
        } else {
          paidDownloads++;
        }
        const pId = ev.productId;
        let pStats = productCountMap.get(pId);
        if (!pStats) {
          pStats = {
            productId: pId,
            productTitle: ev.productTitle || "Unknown Product",
            isFree: Boolean(ev.isFree),
            freeCount: 0,
            paidCount: 0,
            totalCount: 0,
            lastDownloadedAt: ev.downloadedAt || "",
            pdfBreakdown: {}
          };
          productCountMap.set(pId, pStats);
        }
        if (ev.isFree) {
          pStats.freeCount++;
        } else {
          pStats.paidCount++;
        }
        pStats.totalCount++;
        if (ev.downloadedAt && (!pStats.lastDownloadedAt || ev.downloadedAt > pStats.lastDownloadedAt)) {
          pStats.lastDownloadedAt = ev.downloadedAt;
        }
        const pdfKey = ev.pdfId || ev.pdfName || "default";
        if (!pStats.pdfBreakdown[pdfKey]) {
          pStats.pdfBreakdown[pdfKey] = {
            pdfName: ev.pdfName || "Main PDF",
            count: 0
          };
        }
        pStats.pdfBreakdown[pdfKey].count++;
      });
      const totalDownloads = events.length;
      const productBreakdown = Array.from(productCountMap.values());
      productBreakdown.sort((a, b) => b.totalCount - a.totalCount);
      const mostDownloaded = productBreakdown.length > 0 && productBreakdown[0].totalCount > 0 ? { title: productBreakdown[0].productTitle, count: productBreakdown[0].totalCount } : null;
      const leastDownloaded = productBreakdown.length > 0 ? { title: productBreakdown[productBreakdown.length - 1].productTitle, count: productBreakdown[productBreakdown.length - 1].totalCount } : null;
      res.json({
        success: true,
        summary: {
          totalDownloads,
          freeDownloads,
          paidDownloads,
          totalRegisteredStudents,
          uniqueDownloaders: uniqueUserSet.size,
          mostDownloaded,
          leastDownloaded
        },
        productBreakdown: productBreakdown.map((p) => ({
          ...p,
          pdfList: Object.entries(p.pdfBreakdown).map(([k, v]) => ({
            id: k,
            name: v.pdfName,
            count: v.count
          }))
        })),
        recentEvents: events.slice(-50).reverse()
      });
    } catch (err) {
      console.error("Failed to compute download analytics:", err);
      res.status(500).json({ error: "Failed to retrieve download analytics" });
    }
  });
  router.get("/media/youtube", async (_req, res) => {
    try {
      const feed = await getLatestYouTubeFeed({ forceRefresh: false });
      res.json({
        success: true,
        ...feed
      });
    } catch (err) {
      console.error("Error serving YouTube carousel feed:", err);
      res.status(500).json({
        success: false,
        videos: [],
        error: "Failed to load YouTube videos"
      });
    }
  });
  router.post("/admin/media/sync-youtube", requireAdmin, async (req, res) => {
    try {
      const channelInput = sanitizeText(req.body?.channelInput || "", 200);
      const feed = await getLatestYouTubeFeed({
        forceRefresh: true,
        channelInput: channelInput || void 0
      });
      res.json({
        success: true,
        ...feed
      });
    } catch (err) {
      console.error("Admin YouTube sync error:", err);
      res.status(500).json({
        success: false,
        error: isProduction() ? "Failed to sync YouTube channel" : err?.message
      });
    }
  });
  const handleProductOgPage = async (req, res) => {
    try {
      const rawId = req.params.id || (typeof req.query.product === "string" ? req.query.product : "") || (typeof req.query.id === "string" ? req.query.id : "");
      const html = await renderProductPageHtml(rawId, req);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      res.status(200).send(html);
    } catch (err) {
      console.error("Error rendering product OG HTML:", err);
      res.status(500).send("Unable to render product page");
    }
  };
  router.get("/og/product/:id", handleProductOgPage);
  router.get("/og/product", handleProductOgPage);
  app3.use("/api", router);
  app3.use("/.netlify/functions/api", router);
  app3.use("/", router);
  app3.use((err, _req, res, _next) => {
    console.error("[UNHANDLED SERVER ERROR]:", err);
    const inProd = isProduction();
    res.status(err.status || 500).json({
      error: inProd ? "An unexpected error occurred. Please contact MKR Academy support." : err?.message || "Internal server error",
      code: "INTERNAL_SERVER_ERROR"
    });
  });
  return app3;
}

// server.ts
dotenv2.config();
var __filename = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename);
var app2 = createApiApp();
var PORT = parseInt(process.env.PORT || "3000", 10);
app2.use(express2.static(path2.join(__dirname2, "public"), { dotfiles: "allow" }));
function extractQueryProductId(req) {
  const raw = req.query.product || req.query.id;
  return typeof raw === "string" ? raw : "";
}
async function startServer() {
  const distHtmlPath = path2.join(__dirname2, "dist", "index.html");
  const isRunningTsSource = process.argv.some((arg) => arg.endsWith("server.ts"));
  const isProdRuntime = process.env.NODE_ENV === "production" || !isRunningTsSource && fs2.existsSync(distHtmlPath);
  if (isProdRuntime) {
    const getProdTemplate = () => fs2.existsSync(distHtmlPath) ? fs2.readFileSync(distHtmlPath, "utf-8") : void 0;
    app2.get(["/product/:id", "/"], async (req, res, next) => {
      const productId = req.params.id || extractQueryProductId(req);
      if (!productId) {
        next();
        return;
      }
      try {
        const html = await renderProductPageHtml(productId, req, getProdTemplate());
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
        res.status(200).send(html);
      } catch (err) {
        console.error("Production SSR OG error:", err);
        next();
      }
    });
    app2.use(express2.static(path2.join(__dirname2, "dist")));
    app2.get("*", (_req, res) => {
      res.sendFile(distHtmlPath);
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.get(["/product/:id", "/"], async (req, res, next) => {
      const productId = req.params.id || extractQueryProductId(req);
      if (!productId) {
        next();
        return;
      }
      try {
        const rawTemplate = fs2.readFileSync(path2.join(__dirname2, "index.html"), "utf-8");
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
        const html = await renderProductPageHtml(productId, req, transformed);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.status(200).send(html);
      } catch (err) {
        console.error("Dev SSR OG error:", err);
        next();
      }
    });
    app2.use(vite.middlewares);
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} MKR Academy server running at http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
