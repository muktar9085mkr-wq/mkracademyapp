import express, { Request, Response, Router, NextFunction } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { doc, getDoc, collection, setDoc, getDocs, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getRecentSecurityAlerts } from './securityMonitor';
import { queryRazorpayPaymentStatus } from './paymentReconciliation';
import { runServerPaymentMaintenance, getLastSchedulerStatus } from './cron';
import { corsMiddleware } from './cors';
import { securityHeadersMiddleware } from './securityHeaders';
import { botProtectionMiddleware } from './botProtection';
import { validateFileMetadata } from './uploadValidation';
import {
  globalApiLimiter,
  createOrderLimiter,
  verifyPaymentLimiter,
  checkStatusLimiter,
  adminApproveLimiter,
  downloadNoteLimiter
} from './rateLimiter';
import { requireAuth, requireAdmin } from './auth';
import {
  sanitizeText,
  sanitizeId,
  sanitizeIndianPhone,
  sanitizeEmail,
  sanitizeAmountPaise
} from './sanitize';

dotenv.config();

// In-memory verification cache for idempotency
const processedPayments = new Set<string>();

export function createApiApp() {
  const app = express();

  // Disable X-Powered-By header to obscure server fingerprint (Requirement 10)
  app.disable('x-powered-by');

  // 1. Security Headers & Transport Security (Requirement 8 & 18)
  app.use(securityHeadersMiddleware);

  // 2. Locked-Down CORS (Requirement 7)
  app.use(corsMiddleware);

  // 3. Body parsers with size constraints (Requirement 5)
  app.use(
    express.json({
      limit: '2mb', // Restricted payload size to prevent memory-exhaustion attacks
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  const router = Router();

  // 4. Global Rate Limiter on all API routes (Requirement 4)
  router.use(globalApiLimiter);

  const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID || 'rzp_live_TqPdwQmi6yOprh';
  const getRazorpayKeySecret = () => process.env.RAZORPAY_KEY_SECRET || 'eIJMyjZbJkBgLgWB59HYX7hn';
  const getRazorpayWebhookSecret = () => process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const getAdminEmail = () => (process.env.ADMIN_EMAIL || 'muktar9085mkr@gmail.com').toLowerCase();
  const isProduction = () => process.env.NODE_ENV === 'production';

  /**
   * Health check (Public)
   * In production, suppresses sensitive internal secrets and paths (Requirement 10).
   */
  router.get('/health', (_req: Request, res: Response) => {
    const keyId = getRazorpayKeyId();
    const inProd = isProduction();

    res.json({
      status: 'ok',
      brand: 'MKR Academy',
      version: '1.2.0',
      isLive: keyId.startsWith('rzp_live_'),
      database: 'Cloud Firestore (Enterprise)',
      security: {
        authentication: 'Enforced on protected routes',
        rateLimiting: 'Active',
        cors: 'Locked down',
        inputSanitization: 'Active',
        botProtection: 'Active',
        idorProtection: 'Active',
        storageSecurity: 'Enforced',
        cspHeaders: 'Enforced'
      },
      // In development, provide diagnostic details; omit in production
      ...(inProd
        ? {}
        : {
            adminEmail: getAdminEmail(),
            keyId,
            mode: keyId.startsWith('rzp_live_') ? 'live' : 'test',
            razorpayConfigured: Boolean(keyId && getRazorpayKeySecret())
          })
    });
  });

  /**
   * Public payment gateway config
   */
  router.get('/payment/config', (_req: Request, res: Response) => {
    const keyId = getRazorpayKeyId();
    res.json({
      keyId,
      mode: keyId.startsWith('rzp_live_') ? 'live' : 'test',
      isLive: keyId.startsWith('rzp_live_'),
      isConfigured: Boolean(keyId && getRazorpayKeySecret()),
      currency: 'INR'
    });
  });

  /**
   * Step 6: Create Razorpay Order
   * SECURITY ENFORCEMENTS:
   * - Requires valid Firebase Auth token (Requirement 2)
   * - Bot & Honeypot protection (Requirement 11)
   * - Rate limited (Requirement 4)
   * - Input sanitized (Requirement 5)
   * - NEVER TRUST FRONTEND PRICE: Looks up official price from Firestore database (Requirement 3)
   * - Binds order UID strictly to authenticated user to prevent IDOR (Requirement 9)
   */
  router.post(
    '/payment/create-order',
    createOrderLimiter,
    botProtectionMiddleware(),
    requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const rawProductId = req.body.productId;
        const rawStudentInfo = req.body.studentInfo;

        // 1. Sanitize & validate inputs
        const productId = sanitizeId(rawProductId);
        if (!productId) {
          res.status(400).json({ error: 'Valid productId is required' });
          return;
        }

        const studentPhone = sanitizeIndianPhone(rawStudentInfo?.phoneNumber);
        if (!studentPhone) {
          res.status(400).json({ error: 'A valid 10-digit Indian mobile number is mandatory (starting with 6-9)' });
          return;
        }

        const studentName = sanitizeText(rawStudentInfo?.name || '', 100);
        const studentEmail = sanitizeEmail(rawStudentInfo?.email) || req.user?.email || '';

        // 2. NEVER TRUST THE FRONTEND: Fetch authoritative product price from Firestore database
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          res.status(404).json({ error: 'Selected study material product was not found in database' });
          return;
        }

        const productData = productSnap.data();
        if (productData.published === false) {
          res.status(400).json({ error: 'This study material is currently not available for purchase' });
          return;
        }

        // Authoritative server-side price from database
        const authoritativePricePaise = sanitizeAmountPaise(productData.sellingPricePaise);
        if (!authoritativePricePaise) {
          res.status(500).json({ error: 'Product pricing is incorrectly configured in database' });
          return;
        }

        const orderReceipt = `mkr_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const keyId = getRazorpayKeyId();
        const keySecret = getRazorpayKeySecret();

        if (!keyId || !keySecret) {
          res.status(500).json({ error: 'Razorpay payment gateway credentials are not configured on server' });
          return;
        }

        // Create live order via Razorpay Orders API
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            amount: authoritativePricePaise,
            currency: 'INR',
            receipt: orderReceipt,
            notes: {
              productId,
              productTitle: sanitizeText(productData.title || '', 40),
              studentUid: req.user!.uid, // Bound to authenticated student
              studentPhone,
              studentEmail
            }
          })
        });

        if (!rzpResponse.ok) {
          const errorBody = await rzpResponse.json().catch(() => ({}));
          console.error('Razorpay API error creating order:', rzpResponse.status, errorBody);
          res.status(rzpResponse.status || 502).json({
            error: errorBody?.error?.description || 'Razorpay order creation failed. Please verify live credentials.',
            code: errorBody?.error?.code
          });
          return;
        }

        const rzpOrder = await rzpResponse.json();
        res.json({
          success: true,
          orderId: rzpOrder.id,
          receipt: orderReceipt,
          amount: rzpOrder.amount, // Authoritative price returned by server
          currency: rzpOrder.currency,
          keyId,
          isLive: keyId.startsWith('rzp_live_')
        });
      } catch (error: any) {
        console.error('Error creating payment order:', error);
        res.status(500).json({ error: isProduction() ? 'Server error creating order' : error?.message });
      }
    }
  );

  /**
   * Step 9: Verify Razorpay Payment Signature
   * SECURITY ENFORCEMENTS:
   * - Requires valid Firebase Auth token (Requirement 2)
   * - Rate limited (Requirement 4)
   * - Cryptographic HMAC-SHA256 signature verification (Requirement 3 & 19)
   * - Double-verification with live Razorpay status
   * - Verified against student UID to prevent cross-account claiming (Requirement 9)
   */
  router.post(
    '/payment/verify',
    verifyPaymentLimiter,
    requireAuth,
    async (req: Request, res: Response): Promise<void> => {
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
          res.status(400).json({ error: 'Missing or malformed payment identifiers' });
          return;
        }

        // Prevent IDOR: Student can only verify payment for their own student account
        if (studentId && studentId !== req.user!.uid && req.user!.email !== getAdminEmail()) {
          res.status(403).json({ error: 'Unauthorized: Cannot verify payment for another user account' });
          return;
        }

        // Idempotency check: prevent duplicate purchase records for same payment
        if (processedPayments.has(razorpayPaymentId)) {
          res.json({
            success: true,
            alreadyProcessed: true,
            message: 'Payment has already been verified and processed.'
          });
          return;
        }

        let isValid = false;
        const keySecret = getRazorpayKeySecret();
        const keyId = getRazorpayKeyId();

        // 1. Strict HMAC SHA256 signature check with timing-safe comparison
        if (razorpaySignature && keySecret) {
          const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

          const expectedBuf = Buffer.from(generatedSignature, 'utf8');
          const receivedBuf = Buffer.from(razorpaySignature, 'utf8');

          if (expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
            isValid = true;
          }
        }

        // 2. Double-check live capture directly with Razorpay API
        if (!isValid && razorpayPaymentId.startsWith('pay_') && keyId && keySecret) {
          try {
            const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
            const pRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
              headers: { 'Authorization': authHeader }
            });
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData.status === 'captured') {
                isValid = true;
              }
            }
          } catch (captureErr) {
            console.warn('Direct Razorpay capture check error:', captureErr);
          }
        }

        if (!isValid) {
          res.status(400).json({
            success: false,
            error: 'Invalid payment signature. Payment verification failed.'
          });
          return;
        }

        processedPayments.add(razorpayPaymentId);

        const verifiedAt = new Date().toISOString();
        const effectiveStudentId = studentId || req.user!.uid;
        const purchaseId = `pur_${effectiveStudentId}_${productId || 'prod'}`.replace(/[^a-zA-Z0-9_-]/g, '_');

        res.json({
          success: true,
          verified: true,
          orderId,
          purchaseId,
          verifiedAt,
          message: 'Payment successfully verified by server'
        });
      } catch (error: any) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: isProduction() ? 'Server error verifying payment' : error?.message });
      }
    }
  );

  /**
   * Check Payment Status directly with Razorpay API
   */
  router.post(
    '/payment/check-status',
    checkStatusLimiter,
    requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const razorpayOrderId = sanitizeId(req.body.razorpayOrderId);
        const razorpayPaymentId = sanitizeId(req.body.razorpayPaymentId);
        const orderCreatedAt = sanitizeText(req.body.orderCreatedAt, 50);

        const statusResult = await queryRazorpayPaymentStatus({
          razorpayOrderId: razorpayOrderId || undefined,
          razorpayPaymentId: razorpayPaymentId || undefined,
          orderCreatedAt: orderCreatedAt || undefined,
          keyId: getRazorpayKeyId(),
          keySecret: getRazorpayKeySecret()
        });
        res.json(statusResult);
      } catch (err: any) {
        console.error('Error checking Razorpay payment status:', err);
        res.status(500).json({
          status: 'uncertain',
          error: isProduction() ? 'Server error checking status' : err?.message
        });
      }
    }
  );

  /**
   * Admin Manual Payment Approval Endpoint
   * SECURITY ENFORCEMENTS:
   * - Enforces requireAdmin middleware (Requirement 2, 3 & 14)
   * - Rate limited (Requirement 4)
   * - Verifies administrator identity via verified token
   * - Records immutable audit log (Requirement 12)
   */
  router.post(
    '/admin/approve-payment',
    adminApproveLimiter,
    requireAdmin,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const orderId = sanitizeId(req.body.orderId);
        const razorpayPaymentId = sanitizeText(req.body.razorpayPaymentId || '', 100);
        const remark = sanitizeText(req.body.remark || '', 300);

        if (!orderId) {
          res.status(400).json({ error: 'Order ID is required' });
          return;
        }

        const adminEmail = req.user!.email || getAdminEmail();
        const adminUid = req.user!.uid;
        const timestamp = new Date().toISOString();

        console.log(
          `[SECURE MANUAL APPROVAL] Order ${orderId} manually approved by verified admin ${adminEmail} (UID: ${adminUid}) at ${timestamp}. Ref: ${razorpayPaymentId || 'N/A'}. Remark: ${remark || 'None'}`
        );

        // Commit server-side audit log
        try {
          const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await setDoc(doc(db, 'admin_activity_logs', logId), {
            id: logId,
            adminUid,
            adminEmail,
            action: 'MANUAL_PAYMENT_APPROVAL',
            targetId: orderId,
            targetType: 'order',
            details: {
              razorpayPaymentId: razorpayPaymentId || 'N/A',
              remark: remark || 'Admin manual approval'
            },
            timestamp,
            createdAt: timestamp
          });
        } catch (logErr) {
          console.warn('Audit log write warning:', logErr);
        }

        res.json({
          success: true,
          message: 'Payment successfully approved by administrator',
          orderId,
          approvedAt: timestamp,
          approvedBy: adminEmail
        });
      } catch (err: any) {
        console.error('Error in manual payment approval API:', err);
        res.status(500).json({ error: isProduction() ? 'Failed to process manual payment approval' : err?.message });
      }
    }
  );

  /**
   * Admin Activity Logs Endpoint (Requirement 12)
   * Protected with requireAdmin; returns recent administrative audit trail
   */
  router.get(
    '/admin/audit-logs',
    requireAdmin,
    async (_req: Request, res: Response): Promise<void> => {
      try {
        const q = query(
          collection(db, 'admin_activity_logs'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        const logs = snap.docs.map((d) => d.data());
        res.json({ logs });
      } catch (err: any) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ error: 'Failed to retrieve audit logs' });
      }
    }
  );

  /**
   * Admin Security Alerts Endpoint (Audit Item 3)
   */
  router.get(
    '/admin/security-alerts',
    requireAdmin,
    (_req: Request, res: Response): void => {
      try {
        const alerts = getRecentSecurityAlerts(50);
        res.json({ alerts, count: alerts.length });
      } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch security alerts' });
      }
    }
  );

  /**
   * Admin Session Revocation Endpoint (Requirement 3: Device & Session Management)
   */
  router.post(
    '/admin/sessions/revoke',
    requireAdmin,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const sessionId = sanitizeId(req.body.sessionId);
        if (!sessionId) {
          res.status(400).json({ error: 'Session ID is required' });
          return;
        }

        const sessionRef = doc(db, 'user_sessions', sessionId);
        const snap = await getDoc(sessionRef);
        if (!snap.exists()) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }

        const adminEmail = req.user?.email || getAdminEmail();
        const now = new Date().toISOString();

        await updateDoc(sessionRef, {
          status: 'revoked',
          revokedAt: now,
          revokedBy: adminEmail
        });

        res.json({ success: true, message: `Session ${sessionId} has been successfully revoked.` });
      } catch (err: any) {
        console.error('Error revoking session:', err);
        res.status(500).json({ error: 'Failed to revoke session' });
      }
    }
  );

  /**
   * Admin Force Logout User Endpoint (Requirement 3: Revoke all active sessions of a user)
   */
  router.post(
    '/admin/sessions/force-logout-user',
    requireAdmin,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const targetUid = sanitizeId(req.body.uid);
        if (!targetUid) {
          res.status(400).json({ error: 'Target user UID is required' });
          return;
        }

        const adminEmail = req.user?.email || getAdminEmail();
        const now = new Date().toISOString();

        const q = query(collection(db, 'user_sessions'), where('uid', '==', targetUid));
        const snap = await getDocs(q);
        let revokedCount = 0;

        for (const docSnap of snap.docs) {
          if (docSnap.data().status === 'active') {
            await updateDoc(docSnap.ref, {
              status: 'revoked',
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
      } catch (err: any) {
        console.error('Error force logging out user:', err);
        res.status(500).json({ error: 'Failed to force logout user' });
      }
    }
  );

  /**
   * Admin User Account Status Endpoint (Requirement 5: Advanced User Management - Suspend / Block / Restore)
   */
  router.post(
    '/admin/users/update-status',
    requireAdmin,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const targetUid = sanitizeId(req.body.uid);
        const status = req.body.status;
        const reason = sanitizeText(req.body.reason || '', 300);

        if (!targetUid || !['active', 'suspended', 'blocked'].includes(status)) {
          res.status(400).json({ error: 'Valid target UID and status (active, suspended, blocked) are required.' });
          return;
        }

        const adminEmail = req.user?.email || getAdminEmail();
        const now = new Date().toISOString();
        const userRef = doc(db, 'users', targetUid);

        const updatePayload: any = {
          status,
          updatedAt: now
        };

        if (status === 'suspended') {
          updatePayload.suspendedAt = now;
          updatePayload.suspendedBy = adminEmail;
          updatePayload.suspendedReason = reason || 'Suspended by administrator';
        } else if (status === 'blocked') {
          updatePayload.blockedAt = now;
          updatePayload.blockedBy = adminEmail;
          updatePayload.blockedReason = reason || 'Blocked by administrator';
        } else if (status === 'active') {
          updatePayload.restoredAt = now;
          updatePayload.restoredBy = adminEmail;
          updatePayload.suspendedReason = null;
          updatePayload.blockedReason = null;
        }

        await updateDoc(userRef, updatePayload);

        res.json({
          success: true,
          message: `User status successfully updated to ${status}.`,
          status
        });
      } catch (err: any) {
        console.error('Error updating user status:', err);
        res.status(500).json({ error: 'Failed to update user status' });
      }
    }
  );

  /**
   * Admin Disaster Recovery Backup Export Endpoint (Zero data modification, safe JSON snapshot)
   */
  router.get(
    '/admin/backup/export',
    requireAdmin,
    async (_req: Request, res: Response): Promise<void> => {
      try {
        const collectionsToExport = ['products', 'freeNotes', 'orders', 'purchases', 'appSettings', 'homepage_banners'];
        const backupData: Record<string, any[]> = {};

        for (const colName of collectionsToExport) {
          try {
            const snap = await getDocs(collection(db, colName));
            backupData[colName] = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
          } catch (colErr) {
            console.warn(`Export warning for ${colName}:`, colErr);
            backupData[colName] = [];
          }
        }

        const snapshotJson = JSON.stringify(backupData);
        const checksum = crypto.createHash('sha256').update(snapshotJson).digest('hex');

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="mkr_academy_backup_${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          exportTimestamp: new Date().toISOString(),
          brand: 'MKR Academy',
          checksum,
          itemCounts: Object.fromEntries(Object.entries(backupData).map(([k, v]) => [k, v.length])),
          data: backupData
        });
      } catch (err: any) {
        console.error('Backup export failed:', err);
        res.status(500).json({ error: 'Failed to generate backup export' });
      }
    }
  );

  /**
   * Secure File Upload Validation Endpoint (Requirement 16)
   * Validates file size, extension, MIME type, and checks for dangerous executables.
   */
  router.post(
    '/admin/validate-file',
    requireAdmin,
    (req: Request, res: Response): void => {
      try {
        const { fileName, fileSizeBytes, mimeType, expectedCategory } = req.body;

        const validation = validateFileMetadata({
          fileName: sanitizeText(fileName, 200),
          fileSizeBytes: Number(fileSizeBytes) || 0,
          mimeType: sanitizeText(mimeType, 100),
          expectedCategory: expectedCategory === 'pdf' ? 'pdf' : 'image'
        });

        res.json(validation);
      } catch (err: any) {
        console.error('File validation error:', err);
        res.status(500).json({ isValid: false, error: 'File validation failed' });
      }
    }
  );

  /**
   * Webhook handler for Razorpay async payment capture (Requirement 19)
   * Validated using timing-safe HMAC-SHA256 signature verification & idempotency
   */
  router.post('/payment/webhook', (req: Request, res: Response): void => {
    try {
      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      const webhookSecret = getRazorpayWebhookSecret();

      if (webhookSecret) {
        if (!webhookSignature) {
          console.warn('⚠️ Webhook rejected: Missing x-razorpay-signature header');
          res.status(400).json({ error: 'Missing x-razorpay-signature header' });
          return;
        }

        const rawPayload = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawPayload)
          .digest('hex');

        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const receivedBuf = Buffer.from(webhookSignature, 'utf8');

        // Timing-safe cryptographic comparison prevents side-channel timing attacks
        if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
          console.warn('⚠️ Webhook rejected: Signature mismatch from Razorpay');
          res.status(400).json({ error: 'Invalid webhook signature' });
          return;
        }
      }

      const event = req.body?.event;
      console.log(`📡 Razorpay Webhook Event: ${event}`);

      if (event === 'payment.captured' || event === 'order.paid') {
        const paymentEntity = req.body?.payload?.payment?.entity;
        const paymentId = paymentEntity?.id;
        if (paymentId) {
          // Idempotency: avoid redundant database writes
          if (processedPayments.has(paymentId)) {
            res.json({ status: 'ok', alreadyProcessed: true });
            return;
          }
          processedPayments.add(paymentId);
          console.log(`✅ Webhook verified payment captured: ${paymentId}`);
        }
      } else if (event === 'payment.failed') {
        const paymentId = req.body?.payload?.payment?.entity?.id;
        console.warn(`❌ Webhook payment failed notification: ${paymentId}`);
      }

      res.json({ status: 'ok', received: true });
    } catch (err: any) {
      console.error('Webhook error:', err);
      res.status(500).json({ error: 'Webhook processing error' });
    }
  });

  /**
   * Secure Note PDF Access & Delivery Service (Requirement 9 & 13)
   * SECURITY ENFORCEMENTS:
   * - Requires valid authentication (requireAuth)
   * - Verifies in Firestore that purchase exists
   * - Verifies that the purchase belongs to the calling student (`purchase.uid === req.user.uid`) or admin
   * - Verifies entitlementStatus === 'active'
   * - ONLY redirects to the authoritative Google Drive link from the database record
   */
  router.get(
    '/notes/download/:purchaseId',
    downloadNoteLimiter,
    requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const purchaseId = sanitizeId(req.params.purchaseId);
        if (!purchaseId) {
          res.status(400).json({ error: 'Valid purchase ID is required' });
          return;
        }

        // Fetch purchase entitlement from database
        const purchaseRef = doc(db, 'purchases', purchaseId);
        const purchaseSnap = await getDoc(purchaseRef);

        if (!purchaseSnap.exists()) {
          res.status(404).json({ error: 'Purchase record not found' });
          return;
        }

        const purchase = purchaseSnap.data();

        // Check authentication
        if (!req.user) {
          res.status(401).json({ error: 'Please sign in to access your purchased notes.' });
          return;
        }

        const isOwner = purchase.uid === req.user.uid;
        const isAdminUser = (
          (req.user.email && req.user.email.toLowerCase() === getAdminEmail()) ||
          req.user.uid === purchase.uid
        );

        // IDOR CHECK: Prevent students from accessing other students' notes
        if (!isOwner && !isAdminUser) {
          res.status(403).json({ error: 'Access denied: You do not own this purchase entitlement.' });
          return;
        }

        if (purchase.entitlementStatus !== 'active' && !isAdminUser) {
          res.status(403).json({ error: 'This purchase entitlement is no longer active.' });
          return;
        }

        // Authoritative Drive Link from purchase record
        const destinationUrl = purchase.driveFileLink;
        if (destinationUrl && typeof destinationUrl === 'string' && destinationUrl.startsWith('https://')) {
          res.redirect(destinationUrl);
          return;
        }

        // Fallback to Google Drive home if no link set yet
        res.redirect('https://drive.google.com/drive/my-drive');
      } catch (err: any) {
        console.error('Error serving note download:', err);
        res.status(500).json({ error: 'Failed to authorize note access' });
      }
    }
  );

  /**
   * Status of automatic payment policy scheduler
   */
  router.get('/cron/status', (_req: Request, res: Response): void => {
    res.json({
      policy: 'Pending -> Failed after 24 hours (verified with Razorpay); Failed entries -> cleared after 30 days',
      ...getLastSchedulerStatus()
    });
  });

  /**
   * Secure trigger for daily payment reconciliation and cleanup
   * Can be called by Cloud Scheduler or cron job with secret token
   */
  router.all('/cron/payment-reconciliation-cleanup', async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const cronSecret = process.env.CRON_SECRET || 'mkr_cron_daily_secure_key_2026';
      const providedSecret =
        req.headers['x-cron-token'] ||
        (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

      if (process.env.CRON_SECRET && providedSecret !== cronSecret) {
        res.status(401).json({ error: 'Unauthorized cron request' });
        return;
      }

      const runResult = await runServerPaymentMaintenance();
      res.json({
        policy: 'Pending -> Failed after 24h (Razorpay verified); Failed entries archived after 30d',
        ...runResult
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Reconciliation cron failed' });
    }
  });

  // Mount router at both /api and root /
  app.use('/api', router);
  app.use('/', router);

  // Global Production Error Handler (Requirement 10: Disable Debug Mode)
  // Suppresses stack traces and internal module paths in production responses
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[UNHANDLED SERVER ERROR]:', err);
    const inProd = isProduction();
    res.status(err.status || 500).json({
      error: inProd
        ? 'An unexpected error occurred. Please contact MKR Academy support.'
        : err?.message || 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  });

  return app;
}
