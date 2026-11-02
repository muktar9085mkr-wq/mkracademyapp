import crypto from 'crypto';

export interface RazorpayVerificationResult {
  status: 'paid' | 'failed' | 'abandoned' | 'pending' | 'uncertain';
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  amountPaise?: number;
  reason?: string;
  verifiedAt?: string;
  error?: string;
  rawDetails?: any;
}

/**
 * Server-side verification of payment status directly with Razorpay API.
 * Uses live basic auth credentials (Key ID and Key Secret).
 */
export async function queryRazorpayPaymentStatus(params: {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  orderCreatedAt?: string;
  keyId?: string;
  keySecret?: string;
}): Promise<RazorpayVerificationResult> {
  const keyId = params.keyId || process.env.RAZORPAY_KEY_ID || 'rzp_live_TqPdwQmi6yOprh';
  const keySecret = params.keySecret || process.env.RAZORPAY_KEY_SECRET || 'eIJMyjZbJkBgLgWB59HYX7hn';

  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authHeader
  };

  const { razorpayOrderId, razorpayPaymentId, orderCreatedAt } = params;

  // 1. If we have a Razorpay Payment ID, check it first
  if (razorpayPaymentId && razorpayPaymentId.startsWith('pay_')) {
    try {
      const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
        method: 'GET',
        headers
      });

      if (payRes.ok) {
        const payData = await payRes.json();
        if (payData.status === 'captured') {
          return {
            status: 'paid',
            razorpayPaymentId,
            razorpayOrderId: payData.order_id || razorpayOrderId,
            amountPaise: payData.amount,
            verifiedAt: new Date().toISOString(),
            reason: 'Payment captured and verified by Razorpay'
          };
        }
        if (payData.status === 'failed') {
          return {
            status: 'failed',
            razorpayPaymentId,
            reason: payData.error_description || payData.error_reason || 'Razorpay reported payment failed'
          };
        }
      }
    } catch (err: any) {
      console.warn('Network error checking payment with Razorpay:', err);
      return {
        status: 'uncertain',
        error: `Network error verifying payment: ${err?.message || err}`
      };
    }
  }

  // 2. If we have a Razorpay Order ID, check the order and all its payment attempts
  if (razorpayOrderId && razorpayOrderId.startsWith('order_')) {
    try {
      // Check order details
      const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
        method: 'GET',
        headers
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        // If order itself is paid
        if (orderData.status === 'paid' && (orderData.amount_paid > 0)) {
          // Find the captured payment ID
          let capturedPaymentId = razorpayPaymentId;
          try {
            const paymentsRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}/payments`, {
              method: 'GET',
              headers
            });
            if (paymentsRes.ok) {
              const paymentsData = await paymentsRes.json();
              const capturedItem = (paymentsData.items || []).find((p: any) => p.status === 'captured');
              if (capturedItem?.id) capturedPaymentId = capturedItem.id;
            }
          } catch {
            // Non-critical fallback
          }

          return {
            status: 'paid',
            razorpayOrderId,
            razorpayPaymentId: capturedPaymentId,
            amountPaise: orderData.amount_paid,
            verifiedAt: new Date().toISOString(),
            reason: 'Order status confirmed paid by Razorpay'
          };
        }

        // Check payments list under this order
        const paymentsRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}/payments`, {
          method: 'GET',
          headers
        });

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          const items: any[] = paymentsData.items || [];

          // Is there any captured payment?
          const capturedPayment = items.find((p) => p.status === 'captured');
          if (capturedPayment) {
            return {
              status: 'paid',
              razorpayOrderId,
              razorpayPaymentId: capturedPayment.id,
              amountPaise: capturedPayment.amount,
              verifiedAt: new Date().toISOString(),
              reason: 'Found captured payment in Razorpay order payments list'
            };
          }

          // If payment attempts exist and ALL are failed
          const failedPayments = items.filter((p) => p.status === 'failed');
          if (items.length > 0 && failedPayments.length === items.length) {
            const firstReason = failedPayments[0]?.error_description || failedPayments[0]?.error_reason || 'Payment failed on Razorpay';
            return {
              status: 'failed',
              razorpayOrderId,
              reason: `Razorpay payment attempts failed: ${firstReason}`
            };
          }

          // If no payment attempts made at all
          if (items.length === 0) {
            // Check order age
            const orderAgeHours = orderCreatedAt
              ? (Date.now() - new Date(orderCreatedAt).getTime()) / (1000 * 60 * 60)
              : 25; // default assume >24h if createdAt omitted

            if (orderAgeHours >= 24) {
              return {
                status: 'abandoned',
                razorpayOrderId,
                reason: 'No payment attempted on Razorpay within 24 hours'
              };
            } else {
              return {
                status: 'pending',
                razorpayOrderId,
                reason: 'Within 24-hour pending window; no captured payment yet'
              };
            }
          }
        }
      } else {
        const errorJson = await orderRes.json().catch(() => ({}));
        // If order doesn't exist on Razorpay (e.g. invalid test order ID)
        if (orderRes.status === 400 || orderRes.status === 404) {
          const orderAgeHours = orderCreatedAt
            ? (Date.now() - new Date(orderCreatedAt).getTime()) / (1000 * 60 * 60)
            : 25;
          if (orderAgeHours >= 24) {
            return {
              status: 'abandoned',
              razorpayOrderId,
              reason: `Razorpay order not found or expired (${errorJson?.error?.description || 'Not found'}) after 24h`
            };
          }
        }
        return {
          status: 'uncertain',
          error: `Razorpay API responded with status ${orderRes.status}: ${errorJson?.error?.description || ''}`
        };
      }
    } catch (err: any) {
      console.warn('Network error checking order with Razorpay:', err);
      return {
        status: 'uncertain',
        error: `Network error verifying order with Razorpay: ${err?.message || err}`
      };
    }
  }

  // 3. If order has neither real razorpayOrderId nor razorpayPaymentId (e.g. checkout window opened but student closed before Razorpay order was initiated)
  const orderAgeHours = orderCreatedAt
    ? (Date.now() - new Date(orderCreatedAt).getTime()) / (1000 * 60 * 60)
    : 25;

  if (orderAgeHours >= 24) {
    return {
      status: 'abandoned',
      reason: 'No Razorpay order created; student abandoned checkout >24 hours ago'
    };
  }

  return {
    status: 'pending',
    reason: 'Within 24-hour pending window'
  };
}
