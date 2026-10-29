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

    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(Boolean(window.Razorpay)), 2500);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
    setTimeout(() => resolve(Boolean(window.Razorpay)), 3500);
  });
}

interface CheckoutModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: (purchase: Purchase) => void;
  onRequireAuth: () => void;
}

type CheckoutStep = 'review' | 'processing' | 'success' | 'failed';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  onClose,
  onSuccess,
  onRequireAuth
}) => {
  const { user, profile, updateProfileData } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('review');
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedPurchase, setCompletedPurchase] = useState<Purchase | null>(null);
  const [orderSummaryId, setOrderSummaryId] = useState<string>('');

  useEffect(() => {
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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">Student Sign In Required</h3>
            <p className="text-stone-600 text-sm mt-1">
              Please sign in or create an account to purchase and permanently keep your notes.
            </p>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-left text-xs space-y-1">
            <p className="font-semibold text-stone-900">{product.title}</p>
            <p className="text-stone-500">Price: ₹{product.sellingPricePaise / 100}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-stone-300 font-semibold text-stone-700 text-sm hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                onRequireAuth();
              }}
              className="py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 font-bold text-white text-sm shadow-md"
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
      await loadRazorpayScript();

      if (typeof window !== 'undefined' && window.Razorpay) {
        const options: any = {
          key: keyId,
          amount: product.sellingPricePaise,
          currency: 'INR',
          name: 'MKR Academy',
          description: product.title.substring(0, 40),
          image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=128&q=80',
          order_id: razorpayOrderId && razorpayOrderId.startsWith('order_') ? razorpayOrderId : undefined,
          prefill: {
            name: studentName,
            email: user.email || studentEmail,
            contact: `+91${cleanedPhone}`
          },
          theme: {
            color: '#b91c1c' // MKR Academy crimson red
          },
          handler: async function (response: any) {
            await handleVerificationAndCompletion({
              orderId,
              razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpaySignature: response.razorpay_signature || ''
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
          setErrorMessage(response.error?.description || 'Payment was unsuccessful or cancelled. You have not been charged.');
          setStep('failed');
          setIsSubmitting(false);
        });

        rzp.open();
      } else {
        // Fallback for sandbox dev test if script is blocked
        const simulatedPaymentId = `pay_sim_${Date.now()}`;
        await handleVerificationAndCompletion({
          orderId,
          razorpayOrderId,
          razorpayPaymentId: simulatedPaymentId,
          razorpaySignature: 'dev_sandbox_signature'
        });
      }
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 relative">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-base">
              {step === 'success' ? 'Order Confirmed!' : 'Secure Checkout — MKR Academy'}
            </h3>
          </div>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body content based on step */}
        {step === 'review' && (
          <div className="p-6 space-y-5">
            {/* Step 4: Order Summary Card */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    {product.classLevel}
                  </span>
                  <h4 className="font-bold text-stone-900 text-sm mt-1 leading-snug">
                    {product.title}
                  </h4>
                  <p className="text-stone-500 text-xs mt-0.5">{product.medium} • PDF Format</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-stone-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Original Price</span>
                  <span className="line-through">₹{originalPrice}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Special Educational Discount</span>
                    <span>- ₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-900 font-extrabold text-base pt-1 border-t border-stone-200">
                  <span>Total Payable Amount</span>
                  <span className="text-red-700">₹{sellingPrice}</span>
                </div>
              </div>
            </div>

            {/* Student Contact Verification (Step 3: Compulsory Phone & Name) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
                <UserIcon className="w-3.5 h-3.5 text-stone-500" />
                <span>Student Details & Receipt</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">
                    Student Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">
                    Mobile Number (Compulsory for download receipts) <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-400 font-mono font-medium text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="10-digit mobile number (e.g. 9864012345)"
                      maxLength={10}
                      className={`w-full bg-stone-50 border rounded-xl pl-12 pr-3.5 py-2.5 font-mono text-stone-900 focus:bg-white focus:outline-none ${
                        phoneError ? 'border-red-500 bg-red-50/50' : 'border-stone-300 focus:border-red-600'
                      }`}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{phoneError}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={user.email || studentEmail}
                    disabled
                    className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Security Guarantee Note */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Razorpay Live Gateway Secured</span>
                </span>
                <span className="text-[10px] font-mono bg-emerald-200/70 text-emerald-950 px-2 py-0.5 rounded-full font-bold">
                  256-Bit SSL
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-snug">
                Supports instant UPI (Google Pay, PhonePe, Paytm, BHIM), RuPay/Visa/Mastercard, and all Indian NetBanking banks.
              </p>
            </div>

            {/* Pay Now Button */}
            <button
              onClick={handlePayNow}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-stone-300 text-white font-bold text-sm shadow-lg shadow-red-800/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Proceed to Pay ₹{sellingPrice}</span>
              <ArrowRight className="w-4 h-4" />
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
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-stone-900">Payment Verified & Successful!</h3>
              <p className="text-stone-600 text-xs">
                Your notes entitlement has been activated and saved to your account.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left text-xs space-y-2">
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
