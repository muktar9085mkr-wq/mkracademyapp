import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Phone,
  User as UserIcon,
  Mail,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  BookOpen,
  FileText,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, Order, Purchase } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PolicyType } from '../common/PolicyModal';
import {
  createBackendPaymentOrder,
  verifyBackendPayment,
  recordPendingOrder,
  recordFailedOrder,
  fulfillVerifiedPurchase
} from '../../services/orderService';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const checkInterval = setInterval(() => {
      if (window.Razorpay) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 150);

    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        clearInterval(checkInterval);
        resolve(Boolean(window.Razorpay));
      };
      script.onerror = () => {
        clearInterval(checkInterval);
        resolve(false);
      };
      document.body.appendChild(script);
    }

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(Boolean(window.Razorpay));
    }, 5000);
  });
}

interface CheckoutViewProps {
  product: Product | null;
  onBack: () => void;
  onSuccess: (purchase: Purchase) => void;
  onRequireAuth: () => void;
  onOpenPolicy?: (type: PolicyType) => void;
  onNavigateToPurchases?: () => void;
}

type CheckoutStep = 'review' | 'processing' | 'success' | 'failed';

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  product,
  onBack,
  onSuccess,
  onRequireAuth,
  onOpenPolicy,
  onNavigateToPurchases
}) => {
  const { user, profile } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('review');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [completedPurchase, setCompletedPurchase] = useState<Purchase | null>(null);
  const [lastPaymentId, setLastPaymentId] = useState<string>('');
  const [isDomainMismatch, setIsDomainMismatch] = useState<boolean>(false);
  const [failedOrderId, setFailedOrderId] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Pre-fill user information if authenticated
  useEffect(() => {
    if (user) {
      setCustomerEmail(user.email || '');
      setCustomerName(profile?.displayName || user.displayName || '');
      if (profile?.phoneNumber) {
        setPhoneNumber(profile.phoneNumber.replace('+91', '').trim());
      }
    }
  }, [user, profile]);

  if (!product) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">No product selected for checkout</h2>
        <p className="text-stone-500 text-sm">
          Please select a study material from the notes catalog before proceeding to checkout.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Browse Educational Notes
        </button>
      </div>
    );
  }

  const sellingPrice = product.sellingPricePaise / 100;
  const originalPrice = product.originalPricePaise / 100;

  const validatePhone = (p: string) => {
    const cleaned = p.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number (e.g. 9864012345)');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!user) {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    if (!validatePhone(phoneNumber)) {
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setGeneralError('Could not load the Razorpay payment gateway. Please check your internet connection.');
      return;
    }

    setStep('processing');

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    const orderSummaryId = `ORD-${Date.now().toString().slice(-8)}`;

    try {
      // 1. Create order on secure backend
      const backendOrderResponse = await createBackendPaymentOrder({
        productId: product.id,
        productTitle: product.title,
        amountPaise: product.sellingPricePaise,
        studentInfo: {
          name: (customerName || user.displayName || 'MKR Student').trim(),
          email: user.email || customerEmail || '',
          phoneNumber: cleanedPhone
        }
      });

      const orderId = backendOrderResponse.receipt || orderSummaryId;
      const razorpayOrderId = backendOrderResponse.orderId;
      const keyId = backendOrderResponse.keyId || 'rzp_test_MKRAcademy2027';

      // 2. Record pending order locally
      await recordPendingOrder({
        id: orderId,
        uid: user.uid,
        studentName: (customerName || user.displayName || 'MKR Student').trim(),
        studentEmail: user.email || customerEmail || '',
        studentPhone: cleanedPhone,
        productId: product.id,
        productTitleSnapshot: product.title,
        amountPaise: product.sellingPricePaise,
        currency: 'INR',
        razorpayOrderId
      });

      // 3. Initialize Razorpay Checkout
      const options: any = {
        key: keyId,
        amount: product.sellingPricePaise,
        currency: 'INR',
        name: 'MKR Academy',
        description: `Access to ${product.title}`.substring(0, 40),
        order_id: razorpayOrderId,
        prefill: {
          name: (customerName || user.displayName || '').trim(),
          email: user.email || customerEmail || '',
          contact: `+91${cleanedPhone}`
        },
        theme: {
          color: '#b91c1c'
        },
        webview_intent: true,
        modal: {
          ondismiss: () => {
            setStep('review');
          }
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setStep('processing');

            // 4. Verify payment signature on backend
            const verifyResult = await verifyBackendPayment({
              orderId,
              razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              productId: product.id,
              studentId: user.uid
            });

            if (verifyResult.verified) {
              // 5. Fulfill purchase in Firestore
              const purchase = await fulfillVerifiedPurchase({
                orderId,
                uid: user.uid,
                productId: product.id,
                productTitle: product.title,
                coverImagePath: product.coverImagePath,
                driveFileLink: product.driveFileLink || '',
                pdfStoragePath: product.pdfStoragePath || '',
                pdfList: product.pdfList || [],
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id || razorpayOrderId
              });

              setLastPaymentId(response.razorpay_payment_id);
              setCompletedPurchase(purchase);
              setStep('success');
              onSuccess(purchase);

              try {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 }
                });
              } catch {
                // Ignore canvas error
              }
            } else {
              throw new Error(verifyResult.error || 'Payment signature verification failed.');
            }
          } catch (err: any) {
            console.error('Payment verification failed:', err);
            await recordFailedOrder(orderId, err.message);
            setGeneralError(err.message || 'Payment verification failed. If your money was deducted, our team will assist you immediately.');
            setStep('failed');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (resp: any) => {
        console.error('Razorpay payment failed:', resp.error);
        await recordFailedOrder(orderId, resp.error?.description || 'Payment failed');

        const isDomainError =
          resp.error?.reason === 'payment_risk_check_failed' ||
          resp.error?.description?.toLowerCase().includes('registered website') ||
          resp.error?.description?.toLowerCase().includes('website does not match');

        setIsDomainMismatch(Boolean(isDomainError));
        setFailedOrderId(orderId);
        setGeneralError(
          isDomainError
            ? 'Razorpay Live Risk Check: Payment blocked as website domain does not match your registered website(s) in Razorpay Dashboard.'
            : (resp.error?.description || 'Transaction declined by bank or card issuer.')
        );
        setStep('failed');
      });
      rzp.open();
    } catch (err: any) {
      console.error('Checkout initiation failed:', err);
      setGeneralError(err.message || 'Could not initialize payment session.');
      setStep('review');
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] bg-stone-50 py-6 sm:py-10 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Bar / Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-stone-600 hover:text-stone-900 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500" />
            <span>Back to Note Details</span>
          </button>

          <div className="flex items-center space-x-2 text-xs font-semibold text-stone-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit Secure Checkout</span>
          </div>
        </div>

        {/* STEP: PROCESSING */}
        {step === 'processing' && (
          <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-stone-200 shadow-sm">
            <Loader2 className="w-12 h-12 text-red-700 animate-spin mx-auto" />
            <h3 className="text-xl font-extrabold text-stone-900">Verifying Payment with Bank...</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Please do not close or refresh this page. We are securely validating your order with the Razorpay payment gateway.
            </p>
          </div>
        )}

        {/* STEP: SUCCESS FULL-PAGE */}
        {step === 'success' && completedPurchase && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-200 text-center space-y-6 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Payment Successful
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-sans">
                Access Granted to Your Notes!
              </h2>
              <p className="text-stone-600 text-sm max-w-md mx-auto">
                Thank you for your purchase. <strong>{product.title}</strong> has been permanently linked to your student account.
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 sm:p-6 border border-stone-200 max-w-md mx-auto text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500">Order ID:</span>
                <span className="font-bold text-stone-800">{completedPurchase.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment ID:</span>
                <span className="font-bold text-stone-800">{lastPaymentId || completedPurchase.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Amount Paid:</span>
                <span className="font-bold text-emerald-700 font-sans text-sm">₹{product.sellingPricePaise / 100}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Licensed User:</span>
                <span className="font-bold text-stone-800 truncate max-w-[200px]">{user?.email}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
              {completedPurchase.driveFileLink && (
                <a
                  href={completedPurchase.driveFileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Notes Now</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToPurchases) {
                    onNavigateToPurchases();
                  } else {
                    onBack();
                  }
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Go to My Purchases</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP: FAILED FULL-PAGE */}
        {step === 'failed' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 space-y-6 shadow-sm">
            {isDomainMismatch ? (
              /* Specific Domain Mismatch Guidance */
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Razorpay Live Security Notice
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 pt-1 font-sans">
                      Website Domain Whitelist Required
                    </h2>
                    <p className="text-stone-600 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                      Your Razorpay Live account blocked this checkout attempt because this website URL is not yet added to your allowed website list in the Razorpay Dashboard.
                    </p>
                  </div>
                </div>

                {/* Option A: Quick 1-Minute Fix for Store Admin */}
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs text-stone-700">
                  <div className="flex items-center space-x-2 font-bold text-stone-900 text-sm">
                    <span className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>For Store Admin (Muktar Ali): How to Whitelist</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed text-[11px] sm:text-xs">
                    To accept live card and UPI payments directly on this domain, add the following URL to your Razorpay account:
                  </p>
                  <div className="p-2.5 bg-white rounded-xl border border-stone-300 font-mono text-xs text-stone-900 flex items-center justify-between gap-2 overflow-x-auto">
                    <span className="truncate">{typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-...run.app'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard?.writeText(window.location.origin);
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }
                      }}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 cursor-pointer"
                    >
                      {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-stone-600 text-[11px] leading-relaxed">
                    <li>Log in to <a href="https://dashboard.razorpay.com/" target="_blank" rel="noopener noreferrer" className="text-red-700 font-bold underline">dashboard.razorpay.com</a></li>
                    <li>Go to <strong>Account & Settings</strong> → <strong>Website and app settings</strong></li>
                    <li>Add the URL above to your registered websites list (or raise a 1-minute ticket to whitelist it)</li>
                  </ol>
                </div>

                {/* Option B: Direct UPI & WhatsApp Instant Activation (Zero Waiting) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3.5 text-xs text-emerald-950">
                  <div className="flex items-center space-x-2 font-bold text-emerald-900 text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Instant Student Option: Direct UPI & WhatsApp Activation</span>
                  </div>
                  <p className="text-emerald-800 text-[11px] sm:text-xs leading-relaxed">
                    Students can pay directly using any UPI app (PhonePe, Google Pay, Paytm, BHIM) and get access activated in seconds via our Admin Approval system:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-stone-500">Official UPI / Mobile Number</span>
                      <p className="font-mono font-extrabold text-sm text-stone-900">919864012345</p>
                      <p className="text-[10px] text-stone-500">Muktar Ali (MKR Academy)</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-stone-500">Amount & Reference</span>
                      <p className="font-extrabold text-sm text-emerald-800 font-mono">₹{product.sellingPricePaise / 100}</p>
                      <p className="text-[10px] text-stone-500 font-mono truncate">Ref: {failedOrderId || 'Pending'}</p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <a
                      href={`https://wa.me/919864012345?text=${encodeURIComponent(
                        `Hello MKR Academy, I would like to get "${product.title}" (Amount: ₹${product.sellingPricePaise / 100}). My Order ID is ${failedOrderId || 'MKR-' + product.id.slice(0, 8)}. Please assist with activation.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat on WhatsApp (+91 9864012345) to Activate Access</span>
                    </a>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('review')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Online Payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                  >
                    Return to Note Details
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Payment Failed */
              <div className="text-center space-y-6 py-4">
                <div className="w-20 h-20 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-stone-900">Payment Unsuccessful</h2>
                  <p className="text-red-700 font-semibold text-sm max-w-md mx-auto">
                    {generalError || 'The transaction could not be completed.'}
                  </p>
                  <p className="text-stone-500 text-xs max-w-md mx-auto">
                    If money was deducted from your bank or UPI app, it will be refunded automatically by your bank within 24-48 hours. You can also contact our student support.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('review')}
                    className="px-6 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                  >
                    Return to Note Details
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP: REVIEW FULL-PAGE (Default Checkout Screen) */}
        {step === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Note Details & Order Summary */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-stone-900 font-sans">
                  Order Summary
                </h2>
                <p className="text-stone-500 text-xs mt-0.5">
                  Review the study material and chapter access included with this purchase.
                </p>
              </div>

              {/* Product Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <img
                  src={product.coverImagePath}
                  alt={product.title}
                  className="w-20 h-24 object-cover rounded-xl shadow-xs shrink-0"
                />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {product.classLevel}
                    </span>
                    <span className="bg-stone-200 text-stone-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {product.medium}
                    </span>
                    <span className="bg-stone-200 text-stone-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {product.subject}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-stone-900 leading-snug">
                    {product.title}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2">
                    {product.shortDescription}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 pt-2 border-t border-stone-200 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Original Price</span>
                  <span className="line-through">₹{originalPrice}</span>
                </div>
                {originalPrice > sellingPrice && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>MKR Student Discount</span>
                    <span>-₹{originalPrice - sellingPrice}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Format & Delivery</span>
                  <span className="text-stone-800 font-semibold">Printable PDF (Instant Access)</span>
                </div>
                <div className="flex justify-between text-base font-black text-stone-900 pt-3 border-t border-stone-200">
                  <span>Total Amount to Pay</span>
                  <span className="text-red-700 font-sans text-xl">₹{sellingPrice}</span>
                </div>
              </div>

              {/* Trust Features */}
              <div className="pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>One-time payment • Lifetime access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Works on Mobile, Tablet & PC</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Official Assam curriculum notes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Permanent link to your student account</span>
                </div>
              </div>
            </div>

            {/* Right Column: Student Details & Payment Form */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">
                  Student Verification
                </h3>
                <p className="text-stone-500 text-xs mt-0.5">
                  Confirm your details for order invoice and download link delivery.
                </p>
              </div>

              {generalError && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-start space-x-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{generalError}</span>
                </div>
              )}

              <form onSubmit={handleInitiatePayment} className="space-y-4">
                {/* Mobile Number (Compulsory) */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Mobile Number <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-400 font-mono text-xs">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (phoneError) validatePhone(e.target.value);
                      }}
                      placeholder="10-digit mobile number"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-3 py-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-[10px] text-red-600 mt-1">{phoneError}</p>
                  ) : (
                    <p className="text-[10px] text-stone-400 mt-1">Used for payment receipt and access verification.</p>
                  )}
                </div>

                {/* Student Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Student Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      disabled={Boolean(user)}
                      value={user?.email || customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full bg-stone-100 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Pay Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 px-6 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-extrabold text-sm shadow-lg shadow-red-900/20 flex items-center justify-center space-x-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{sellingPrice} via Razorpay</span>
                  </button>
                </div>

                <div className="text-center pt-1">
                  <p className="text-[10px] text-stone-400">
                    By completing this payment, you agree to MKR Academy's{' '}
                    <button
                      type="button"
                      onClick={() => onOpenPolicy?.('terms')}
                      className="underline hover:text-stone-700 cursor-pointer"
                    >
                      Terms of Use
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => onOpenPolicy?.('refund')}
                      className="underline hover:text-stone-700 cursor-pointer"
                    >
                      Refund Policy
                    </button>.
                  </p>
                </div>
              </form>

              {/* Payment Methods Info */}
              <div className="pt-4 border-t border-stone-200 text-center space-y-2">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Accepted Payment Methods
                </span>
                <p className="text-xs text-stone-600 font-medium">
                  UPI (GPay, PhonePe, Paytm), Credit / Debit Cards, NetBanking
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
