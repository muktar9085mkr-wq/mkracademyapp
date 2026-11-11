import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  BookOpen,
  Sparkles,
  GraduationCap,
  Lock,
  FileText,
  Scale,
  Receipt,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';
import { getUserOrders, subscribeToUserOrders } from '../../services/orderService';
import { PolicyType } from '../common/PolicyModal';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPurchases: () => void;
  onNavigate?: (view: string, filterParam?: any) => void;
  onOpenPolicy?: (type: PolicyType) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPurchases,
  onNavigate,
  onOpenPolicy
}) => {
  const { user, profile, updateProfileData } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'subjects' | 'policies'>('profile');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhoneNumber(profile.phoneNumber || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!isOpen || !user) return;

    setLoadingOrders(true);
    // Real-time synchronization of student orders
    const unsubscribe = subscribeToUserOrders(
      user.uid,
      (userOrders) => {
        setOrders(userOrders);
        setLoadingOrders(false);
      },
      (err) => {
        console.warn('Real-time student orders error:', err);
        setLoadingOrders(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setPhoneError(null);
    setSaving(true);
    setSuccessMessage(null);

    try {
      await updateProfileData({
        displayName: displayName.trim(),
        phoneNumber: cleaned
      });
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6 py-3 sm:py-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-lg sm:max-w-xl p-3.5 sm:p-6 shadow-2xl border border-stone-200 relative max-h-[calc(100dvh-24px)] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Compact Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Profile"
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Compact Header */}
        <div className="flex items-center space-x-2.5 pb-3 border-b border-stone-200 pr-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            {(profile?.displayName || user.email || 'S')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-stone-900 truncate">
              Student Profile & Account
            </h2>
            <p className="text-[11px] text-stone-500 truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Tab Selection Bar (Profile, Subjects, Policies) */}
        <div className="flex items-center space-x-1 border-b border-stone-200 mt-2.5 pb-1 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-red-700 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            My Details & Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-red-700 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Subjects & Exam
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'policies'
                ? 'bg-red-700 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Policies & About
          </button>
        </div>

        {/* TAB 1: PROFILE DETAILS & ORDER HISTORY */}
        {activeTab === 'profile' && (
          <>
            {/* Profile Form */}
            <form onSubmit={handleSave} className="mt-3.5 space-y-2.5 sm:space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                {/* Full Name */}
                <div>
                  <label className="block text-stone-700 font-semibold mb-1 text-[11px]">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg sm:rounded-xl pl-8 pr-2.5 py-1.5 sm:py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Indian Mobile Number */}
                <div>
                  <label className="block text-stone-700 font-semibold mb-1 text-[11px]">
                    Mobile Number <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-stone-400 font-mono text-xs">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg sm:rounded-xl pl-10 pr-2.5 py-1.5 sm:py-2 font-mono text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  {phoneError && <p className="text-[10px] text-red-600 mt-0.5">{phoneError}</p>}
                </div>

                {/* Email Address */}
                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-semibold mb-1 text-[11px]">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      disabled
                      value={user.email || ''}
                      className="w-full bg-stone-100 border border-stone-200 rounded-lg sm:rounded-xl pl-8 pr-2.5 py-1.5 sm:py-2 text-xs text-stone-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {successMessage && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Compact Save Button */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="submit"
                  disabled={saving}
                  className="py-1.5 sm:py-2 px-3.5 sm:px-4 rounded-lg bg-red-700 hover:bg-red-800 disabled:bg-stone-300 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>

            {/* Order History Section */}
            <div className="mt-4 pt-3 border-t border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>Order History & Invoices</span>
                </h3>

                <button
                  onClick={() => {
                    onClose();
                    onNavigateToPurchases();
                  }}
                  type="button"
                  className="text-[11px] font-bold text-red-700 hover:text-red-800 flex items-center space-x-1 cursor-pointer"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>All Notes →</span>
                </button>
              </div>

              {loadingOrders ? (
                <p className="text-[11px] text-stone-400 py-2 text-center">Loading orders...</p>
              ) : orders.length === 0 ? (
                <p className="text-[11px] text-stone-500 py-2 px-3 bg-stone-50 rounded-lg border border-stone-200 text-center">
                  No previous orders found for this account.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-44 sm:max-h-56 overflow-y-auto pr-0.5">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-stone-50 rounded-lg p-2 sm:p-2.5 border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <p className="font-bold text-stone-800 text-[11px] sm:text-xs truncate max-w-[190px] sm:max-w-xs">
                          {ord.productTitleSnapshot}
                        </p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          #{ord.id} • {new Date(ord.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-stone-900 text-xs">₹{ord.amountPaise / 100}</p>
                        {ord.status === 'manually_approved' ? (
                          <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase shadow-2xs">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Access Granted</span>
                          </span>
                        ) : ord.status === 'paid' ? (
                          <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Paid</span>
                          </span>
                        ) : ord.status === 'pending' ? (
                          <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                            Pending
                          </span>
                        ) : ord.status === 'refunded' ? (
                          <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
                            Refunded
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 uppercase">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: SUBJECTS & EXAM CLASSES (Moved from mobile footer) */}
        {activeTab === 'subjects' && (
          <div className="mt-3.5 space-y-4">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-l-2 border-red-600 pl-2">
                Subjects (বিষয়সমূহ)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {[
                  { name: 'General Science (বিজ্ঞান)', subject: 'General Science' },
                  { name: 'Mathematics (গণিত)', subject: 'Mathematics' },
                  { name: 'Social Science (সমাজ বিজ্ঞান)', subject: 'Social Science' },
                  { name: 'English (ইংৰাজী)', subject: 'English' },
                  { name: 'Assamese (অসমীয়া)', subject: 'Assamese' }
                ].map((sub) => (
                  <button
                    key={sub.subject}
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate?.('browse', { subject: sub.subject });
                    }}
                    className="p-2 rounded-xl bg-stone-50 hover:bg-red-50 hover:text-red-700 border border-stone-200/80 text-stone-700 flex items-center justify-between transition-colors text-left font-medium cursor-pointer"
                  >
                    <span>{sub.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-stone-200">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-l-2 border-red-600 pl-2">
                Classes & Target Exams
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate?.('browse', { classLevel: 'HSLC 2027' });
                  }}
                  className="p-2.5 rounded-xl bg-red-50/70 border border-red-200 text-red-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>HSLC 2027 Target</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate?.('browse', { classLevel: 'Class 10' });
                  }}
                  className="p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 font-medium flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Class 10 Notes</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate?.('browse', { classLevel: 'Class 9' });
                  }}
                  className="p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 font-medium flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Class 9 Notes</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate?.('free-pdfs');
                  }}
                  className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Free PDFs</span>
                  </span>
                  <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                    Free
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: POLICIES & ABOUT MKR ACADEMY (Moved from mobile footer) */}
        {activeTab === 'policies' && (
          <div className="mt-3.5 space-y-3 text-xs">
            {/* About MKR Academy Banner */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPolicy?.('about');
              }}
              className="w-full p-3 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 flex items-center justify-between transition-colors cursor-pointer shadow-sm text-left"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-700 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-xs">About MKR Academy</p>
                  <p className="text-[11px] text-stone-400">Mission, Educators & Academic Leadership</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            {/* Legal & Regulatory Compliance Links */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-l-2 border-red-600 pl-2">
                Legal & Statutory Compliance
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {[
                  { name: 'Privacy Policy (DPDP)', type: 'privacy' as PolicyType, icon: Lock },
                  { name: 'Terms & Conditions', type: 'terms' as PolicyType, icon: FileText },
                  { name: 'Refund Policy', type: 'refund' as PolicyType, icon: CheckCircle2 },
                  { name: 'Copyright & Anti-Piracy', type: 'copyright' as PolicyType, icon: FileText },
                  { name: 'Grievance Redressal', type: 'grievance' as PolicyType, icon: Scale },
                  { name: 'Tax & CERT-In Notice', type: 'tax-certin' as PolicyType, icon: Receipt },
                  { name: 'Contact & Student Support', type: 'contact' as PolicyType, icon: Phone }
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPolicy?.(item.type);
                    }}
                    className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-stone-700 flex items-center space-x-2 transition-colors text-left font-medium cursor-pointer"
                  >
                    <item.icon className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
