import React, { useState, useEffect } from 'react';
import {
  X,
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
  ExternalLink
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

interface CheckoutModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: (purchase: Purchase) => void;
  onRequireAuth: () => void;
  onOpenPolicy?: (type: PolicyType) => void;
}

type CheckoutStep = 'review' | 'processing' | 'success' | 'failed';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  onClose,
  onSuccess,
  onRequireAuth,
  onOpenPolicy
}) => {
  const { user, profile, updateProfileData } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('review');
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [completedPurchase, setCompletedPurchase] = useState<Purchase | null>(null);
  const [orderSummaryId, setOrderSummaryId] = useState<string>('');

  useEffect(() => {
    loadRazorpayScript().catch(() => {});
    if (user) {
      setStudentName(profile?.displayName || user.displayName || '');
      setStudentEmail(profile?.email || user.email || '');
      setStudentPhone(profile?.phoneNumber || '');
    }
    // Generate temporary order identifier for checkout preview
    setOrderSummaryId(`MKR-${Math.floor(100000 + Math.random() * 900000)}`);
  }, [user, profile]);

  if (!product) return null;

  // Step 2: Require login if not authenticated
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-md p-4 sm:p-6 shadow-2xl border border-stone-200 text-center space-y-3.5 my-auto max-h-[calc(100dvh-24px)] overflow-y-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">Sign In Required</h3>
            <p className="text-stone-600 text-xs mt-0.5">
              Please sign in to purchase and access your notes.
            </p>
          </div>
          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-left text-xs space-y-0.5">
            <p className="font-semibold text-stone-900 line-clamp-1">{product.title}</p>
            <p className="text-stone-500 text-[11px]">Payable: ₹{product.sellingPricePaise / 100}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onClose}
              type="button"
              className="py-2 px-3 rounded-xl border border-stone-300 font-semibold text-stone-700 text-xs hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                onRequireAuth();
              }}
              type="button"
              className="py-2 px-3 rounded-xl bg-red-700 hover:bg-red-800 font-bold text-white text-xs shadow-md cursor-pointer"
            >
              Log In / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  const originalPrice = product.originalPricePaise / 100;
  const sellingPrice = product.sellingPricePaise / 100;
  const discountAmount = originalPrice > sellingPrice ? originalPrice - sellingPrice : 0;

  // Step 3: Validate Indian phone number (10-digits compulsory)
  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned) {
      setPhoneError('Compulsory mobile number is required for purchase receipts');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number (e.g. 9864012345)');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handlePhoneChange = (val: string) => {
    setStudentPhone(val);
    if (phoneError) validatePhoneNumber(val);
  };

  /**
   * Primary Checkout Execution Flow (Steps 5 to 11)
   */
  const handlePayNow = async () => {
    if (!validatePhoneNumber(studentPhone)) return;
    if (!studentName.trim()) {
      setErrorMessage('Please provide your name for the order record');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('Please accept the Terms & Conditions, Privacy Policy and Refund Policy (including parental/guardian consent if under 18) to proceed with payment.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStep('processing');

    const cleanedPhone = studentPhone.replace(/\D/g, '');

    // Save student phone to profile if updated
    if (profile && profile.phoneNumber !== cleanedPhone) {
      updateProfileData({ phoneNumber: cleanedPhone, displayName: studentName.trim() }).catch(() => {});
    }

    try {
      // Step 6: Backend creates Razorpay order using current product price from database
      const backendOrderResponse = await createBackendPaymentOrder({
        productId: product.id,
        productTitle: product.title,
        amountPaise: product.sellingPricePaise,
        studentInfo: {
          name: studentName.trim(),
          email: user.email || studentEmail,
          phoneNumber: cleanedPhone
        }
      });

      const orderId = backendOrderResponse.receipt || orderSummaryId;
      const razorpayOrderId = backendOrderResponse.orderId;
      const keyId = backendOrderResponse.keyId || 'rzp_test_MKRAcademy2027';

      // Record pending order in Firestore
      await recordPendingOrder({
        id: orderId,
        uid: user.uid,
        studentName: studentName.trim(),
        studentEmail: user.email || studentEmail,
        studentPhone: cleanedPhone,
        productId: product.id,
        productTitleSnapshot: product.title,
        amountPaise: product.sellingPricePaise,
        currency: 'INR',
        razorpayOrderId
      });

      // Step 7: Ensure Razorpay Checkout script is ready
      const scriptReady = await loadRazorpayScript();

      if (!scriptReady || typeof window === 'undefined' || !window.Razorpay) {
        setIsSubmitting(false);
        setStep('review');
        setErrorMessage('Razorpay payment gateway is still initializing. Please check your internet connection or click Pay Now again.');
        return;
      }

      const options: any = {
        key: keyId,
        amount: product.sellingPricePaise,
        currency: 'INR',
        name: 'MKR Academy',
        description: product.title.substring(0, 40),
        image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=128&q=80',
        order_id: razorpayOrderId,
        prefill: {
          name: studentName.trim(),
          email: user.email || studentEmail.trim(),
          contact: `+91${cleanedPhone}`
        },
        theme: {
          color: '#b91c1c' // MKR Academy crimson red
        },
        // CRITICAL FOR ANDROID APK / WEBVIEW:
        // Enables Razorpay UPI Intent flow (Google Pay, PhonePe, Paytm, BHIM)
        webview_intent: true,
        send_sms_hash: true,
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 900,
        handler: async function (response: any) {
          if (!response.razorpay_payment_id || !response.razorpay_signature) {
            console.error('Missing payment signature in Razorpay response:', response);
            setErrorMessage('Payment completion error: Missing signature from Razorpay. You have not been charged.');
            setStep('failed');
            setIsSubmitting(false);
            return;
          }
          await handleVerificationAndCompletion({
            orderId,
            razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          });
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setStep('review');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed:', response.error);
        recordFailedOrder(orderId, response.error?.description || 'Payment failed').catch(() => {});

        const isDomainError =
          response.error?.reason === 'payment_risk_check_failed' ||
          response.error?.description?.toLowerCase().includes('registered website') ||
          response.error?.description?.toLowerCase().includes('website does not match');

        const desc = isDomainError
          ? 'Razorpay Live Security Notice: Payment blocked as website domain does not match your registered website list in Razorpay Dashboard. Please whitelist this URL in Razorpay Dashboard -> Website and App Settings or contact +91 9864012345 for instant activation.'
          : (response.error?.description || 'Payment was unsuccessful or cancelled. You have not been charged.');

        setErrorMessage(desc);
        setStep('failed');
        setIsSubmitting(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Payment processing error. Please try again.');
      setStep('failed');
      setIsSubmitting(false);
    }
  };

  /**
   * Steps 8, 9, 10: Server-side signature verification & entitlement grant
   */
  const handleVerificationAndCompletion = async (params: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    try {
      // Step 8 & 9: Server-side verification
      const verifyRes = await verifyBackendPayment({
        orderId: params.orderId,
        razorpayOrderId: params.razorpayOrderId,
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.razorpaySignature,
        productId: product.id,
        studentId: user.uid
      });

      if (!verifyRes.verified) {
        throw new Error(verifyRes.error || 'Server signature verification failed');
      }

      // Step 10: Mark order paid & create persistent purchase entitlement in Firestore
      const purchaseRecord = await fulfillVerifiedPurchase({
        orderId: params.orderId,
        uid: user.uid,
        productId: product.id,
        productTitle: product.title,
        coverImagePath: product.coverImagePath,
        driveFileLink: product.driveFileLink || '',
        pdfStoragePath: product.pdfStoragePath || '',
        pdfList: product.pdfList || [],
        razorpayPaymentId: params.razorpayPaymentId,
        razorpayOrderId: params.razorpayOrderId
      });

      setCompletedPurchase(purchaseRecord);
      setStep('success');
      setIsSubmitting(false);

      // Step 11: Celebrate with confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      onSuccess(purchaseRecord);
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage('Payment verification could not be completed. Please contact support with Order ID ' + params.orderId);
      setStep('failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6 py-3 sm:py-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-md sm:max-w-lg overflow-hidden shadow-2xl border border-stone-200 relative my-auto max-h-[calc(100dvh-24px)] flex flex-col">
        
        {/* Compact Header */}
        <div className="bg-stone-900 text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-xs sm:text-sm">
              {step === 'success' ? 'Order Confirmed!' : 'Secure Checkout — MKR Academy'}
            </h3>
          </div>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              type="button"
              aria-label="Close Checkout"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Body content based on step */}
        {step === 'review' && (
          <div className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3.5 overflow-y-auto flex-1">
            {/* Step 4: Compact Order Summary Card */}
            <div className="bg-stone-50 rounded-xl p-2.5 sm:p-3 border border-stone-200 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-1.5 py-0.2 rounded shrink-0">
                      {product.classLevel}
                    </span>
                    <span className="text-[10px] text-stone-500 truncate">
                      {product.medium} • PDF
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 leading-snug line-clamp-1">
                    {product.title}
                  </h4>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-stone-200 pt-1.5 space-y-1 text-xs">
                <div className="flex justify-between text-[11px] text-stone-500">
                  <span>Original Price</span>
                  <span className="line-through">₹{originalPrice}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-700 font-semibold">
                    <span>Educational Discount</span>
                    <span>- ₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-stone-900 font-extrabold text-xs sm:text-sm pt-1 border-t border-stone-200">
                  <span>Total Payable</span>
                  <span className="text-red-700 text-sm sm:text-base font-black">₹{sellingPrice}</span>
                </div>
              </div>
            </div>

            {/* Student Contact Verification */}
            <div className="space-y-2">
              <h4 className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center space-x-1">
                <UserIcon className="w-3 h-3 text-stone-400" />
                <span>Student Details & Receipt</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-stone-600 font-medium mb-0.5 text-[11px]">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg sm:rounded-xl px-3 py-1.5 sm:py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-0.5 text-[11px]">
                    Mobile Number <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 sm:top-2 text-stone-400 font-mono text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={studentPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className={`w-full bg-stone-50 border rounded-lg sm:rounded-xl pl-10 pr-3 py-1.5 sm:py-2 font-mono text-xs text-stone-900 focus:bg-white focus:outline-none ${
                        phoneError ? 'border-red-500 bg-red-50/50' : 'border-stone-300 focus:border-red-600'
                      }`}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-[10px] text-red-600 mt-0.5 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{phoneError}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-0.5 text-[11px]">
                    Email Address <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={user.email || studentEmail}
                    disabled
                    className="w-full bg-stone-100 border border-stone-200 rounded-lg sm:rounded-xl px-3 py-1.5 sm:py-2 text-xs text-stone-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Compact Razorpay Security Indicator */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[11px] text-emerald-900">
              <span className="flex items-center space-x-1 font-medium truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Razorpay Live Secured (UPI, Cards, NetBanking)</span>
              </span>
              <span className="text-[9px] font-mono bg-emerald-200/70 text-emerald-950 px-1.5 py-0.2 rounded font-bold shrink-0 ml-1">
                256-Bit SSL
              </span>
            </div>

            {/* Statutory Consent Checkbox (DPDP Act 2023 & Consumer Protection E-Commerce Rules 2020) */}
            <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl">
              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="checkout-agree-terms"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    if (e.target.checked && errorMessage?.includes('Terms & Conditions')) {
                      setErrorMessage(null);
                    }
                  }}
                  className="mt-0.5 w-4 h-4 text-red-600 rounded border-stone-300 focus:ring-red-500 cursor-pointer shrink-0"
                />
                <span className="text-[11px] text-stone-700 leading-snug">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenPolicy?.('terms');
                    }}
                    className="text-red-700 hover:underline font-semibold"
                  >
                    Terms & Conditions
                  </button>
                  ,{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenPolicy?.('privacy');
                    }}
                    className="text-red-700 hover:underline font-semibold"
                  >
                    Privacy Policy
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenPolicy?.('refund');
                    }}
                    className="text-red-700 hover:underline font-semibold"
                  >
                    Refund Policy
                  </button>
                  . (If under 18 years, I confirm parental/guardian consent).
                </span>
              </label>
            </div>

            {/* Compact Pay Now Button */}
            <button
              onClick={handlePayNow}
              disabled={isSubmitting || !agreedToTerms}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Proceed to Pay ₹{sellingPrice}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Processing State */}
        {step === 'processing' && (
          <div className="p-10 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-red-700 animate-spin mx-auto" />
            <h4 className="text-lg font-bold text-stone-900">Initiating Payment Gateway</h4>
            <p className="text-stone-500 text-xs max-w-sm mx-auto leading-relaxed">
              Contacting Razorpay server and preparing verified payment session. Please do not close or refresh this tab.
            </p>
          </div>
        )}

        {/* Step 11: Success Confirmation */}
        {step === 'success' && (
          <div className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4 overflow-y-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-extrabold text-stone-900">Payment Verified & Successful!</h3>
              <p className="text-stone-600 text-[11px] sm:text-xs">
                Your notes entitlement has been activated and saved to your account.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-stone-50 p-3 sm:p-4 rounded-xl border border-stone-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-500">Order ID:</span>
                <span className="font-mono font-bold text-stone-800">{completedPurchase?.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Product:</span>
                <span className="font-semibold text-stone-800">{product.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Amount Paid:</span>
                <span className="font-bold text-emerald-700">₹{sellingPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Status:</span>
                <span className="font-bold text-emerald-700 uppercase">Paid & Verified</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {product.driveFileLink && (
                <a
                  href={product.driveFileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in Google Drive (Direct Access)</span>
                </a>
              )}

              <a
                href={`/api/notes/download/${completedPurchase?.id || 'sample'}`}
                download={`MKR_Academy_${product.slug}.pdf`}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-all ${
                  product.driveFileLink
                    ? 'bg-stone-800 hover:bg-stone-900 text-white'
                    : 'bg-red-700 hover:bg-red-800 text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Download Notes (PDF)</span>
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-300 font-semibold text-stone-700 text-xs hover:bg-stone-50 cursor-pointer"
              >
                Go to My Purchases
              </button>
            </div>
          </div>
        )}

        {/* Failed State */}
        {step === 'failed' && (
          <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-stone-900">Payment Could Not Be Completed</h3>
              <p className="text-stone-600 text-xs mt-1 leading-relaxed">
                {errorMessage || 'The transaction was cancelled or encountered an error. No payment was captured.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-stone-300 font-semibold text-stone-700 text-xs hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setStep('review');
                  setErrorMessage(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 font-bold text-white text-xs flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
