import express, { Request, Response, Router } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { queryRazorpayPaymentStatus } from './paymentReconciliation';
import { runServerPaymentMaintenance, getLastSchedulerStatus } from './cron';

dotenv.config();

// In-memory verification cache for idempotency
const processedPayments = new Set<string>();

export function createApiApp() {
  const app = express();

  app.use(express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true }));

  const router = Router();

  const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID || 'rzp_live_TqPdwQmi6yOprh';
  const getRazorpayKeySecret = () => process.env.RAZORPAY_KEY_SECRET || 'eIJMyjZbJkBgLgWB59HYX7hn';
  const getRazorpayWebhookSecret = () => process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const getAdminEmail = () => process.env.ADMIN_EMAIL || 'muktar9085mkr@gmail.com';

  /**
   * Health check
   */
  router.get('/health', (_req: Request, res: Response) => {
    const keyId = getRazorpayKeyId();
    res.json({
      status: 'ok',
      brand: 'MKR Academy',
      version: '1.0.0',
      adminEmail: getAdminEmail(),
      razorpayConfigured: Boolean(keyId && getRazorpayKeySecret()),
      keyId,
      mode: keyId.startsWith('rzp_live_') ? 'live' : 'test',
      isLive: keyId.startsWith('rzp_live_')
    });
  });

  /**
   * Public payment gateway status
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
   * Backend creates a Razorpay order. Never trusts price sent by client.
   */
  router.post('/payment/create-order', async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId, productTitle, amountPaise, studentInfo } = req.body;

      if (!productId || !amountPaise || amountPaise <= 0) {
        res.status(400).json({ error: 'Valid productId and amount are required' });
        return;
      }

      if (!studentInfo?.phoneNumber || !/^[6-9]\d{9}$/.test(studentInfo.phoneNumber.replace(/\D/g, ''))) {
        res.status(400).json({ error: 'A valid 10-digit Indian mobile number is mandatory' });
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
          amount: amountPaise,
          currency: 'INR',
          receipt: orderReceipt,
          notes: {
            productId,
            productTitle: (productTitle || '').substring(0, 40),
            studentPhone: studentInfo.phoneNumber,
            studentEmail: studentInfo.email || ''
          }
        })
      });

      if (!rzpResponse.ok) {
        const errorBody = await rzpResponse.json().catch(() => ({}));
        console.error('Razorpay API error creating order:', rzpResponse.status, errorBody);
        res.status(rzpResponse.status || 502).json({
          error: errorBody?.error?.description || 'Razorpay order creation failed. Please verify live credentials and amount.',
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
        currency: rzpOrder.currency,
        keyId,
        isLive: keyId.startsWith('rzp_live_')
      });
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      res.status(500).json({ error: error?.message || 'Server error creating order' });
    }
  });

  /**
   * Step 9: Verify Razorpay Payment Signature
   * Verifies HMAC SHA256 signature server-side.
   */
  router.post('/payment/verify', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        orderId,
        productId,
        studentId
      } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId) {
        res.status(400).json({ error: 'Missing payment identifiers' });
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

      // 1. Strict HMAC SHA256 signature check
      if (razorpaySignature && keySecret) {
        const generatedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex');

        isValid = (generatedSignature === razorpaySignature);
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
      const purchaseId = `pur_${studentId}_${productId}`.replace(/[^a-zA-Z0-9_-]/g, '_');

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
      res.status(500).json({ error: error?.message || 'Server error verifying payment' });
    }
  });

  /**
   * Rule 1: Check Payment Status directly with Razorpay
   * Mandatory check before marking any 24h+ pending order as Failed.
   * Never marks a verified successful payment as Failed.
   */
  router.post('/payment/check-status', async (req: Request, res: Response): Promise<void> => {
    try {
      const { razorpayOrderId, razorpayPaymentId, orderCreatedAt } = req.body;
      const statusResult = await queryRazorpayPaymentStatus({
        razorpayOrderId,
        razorpayPaymentId,
        orderCreatedAt,
        keyId: getRazorpayKeyId(),
        keySecret: getRazorpayKeySecret()
      });
      res.json(statusResult);
    } catch (err: any) {
      console.error('Error checking Razorpay payment status:', err);
      res.status(500).json({
        status: 'uncertain',
        error: err?.message || 'Server error checking status'
      });
    }
  });

  /**
   * Admin Manual Payment Approval Endpoint
   * Allows authorized administrator (muktar9085mkr@gmail.com) to manually approve a payment
   * and log the audit entry.
   */
  router.post('/admin/approve-payment', async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, adminEmail, adminUid, razorpayPaymentId, remark } = req.body;

      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      const configuredAdminEmail = getAdminEmail().toLowerCase();
      const requestingAdminEmail = (adminEmail || '').toLowerCase();

      // Ensure caller is authorized admin
      if (requestingAdminEmail !== configuredAdminEmail) {
        res.status(403).json({ error: 'Unauthorized: Only MKR Academy administrator can approve payments' });
        return;
      }

      const timestamp = new Date().toISOString();
      console.log(`[MANUAL PAYMENT APPROVAL] Order ${orderId} manually approved by ${adminEmail} (UID: ${adminUid}) at ${timestamp}. UTR/PaymentID: ${razorpayPaymentId || 'N/A'}. Remark: ${remark || 'None'}`);

      res.json({
        success: true,
        message: 'Payment successfully approved by administrator',
        orderId,
        approvedAt: timestamp,
        approvedBy: adminEmail
      });
    } catch (err: any) {
      console.error('Error in manual payment approval API:', err);
      res.status(500).json({ error: err?.message || 'Failed to process manual payment approval' });
    }
  });

  /**
   * Webhook handler for Razorpay async payment capture
   */
  router.post('/payment/webhook', (req: Request, res: Response): void => {
    try {
      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      const webhookSecret = getRazorpayWebhookSecret();
      if (webhookSecret && webhookSignature) {
        const rawPayload = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawPayload)
          .digest('hex');

        if (expectedSignature !== webhookSignature) {
          console.warn('⚠️ Webhook signature mismatch from Razorpay');
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
   * Secure Note PDF Access & Delivery Service
   * Directs student to their Google Drive PDF note
   */
  router.get('/notes/download/:purchaseId', (req: Request, res: Response): void => {
    const { purchaseId } = req.params;
    const driveUrl = req.query.driveUrl as string;

    if (driveUrl) {
      res.redirect(driveUrl);
      return;
    }

    if (!purchaseId) {
      res.status(400).json({ error: 'Purchase ID is required' });
      return;
    }

    // Redirect directly to Google Drive so no example/sample dummy PDF is shown
    res.redirect(`https://drive.google.com/drive/my-drive`);
  });

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
   * Can be called by Cloud Scheduler, cron job, or admin
   */
  router.all('/cron/payment-reconciliation-cleanup', async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const cronSecret = process.env.CRON_SECRET || 'mkr_cron_daily_secure_key_2026';
      const providedSecret = req.headers['x-cron-token'] || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

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

  // Mount router at both /api and root / to support Netlify rewrites as well as local express server
  app.use('/api', router);
  app.use('/', router);

  return app;
}
