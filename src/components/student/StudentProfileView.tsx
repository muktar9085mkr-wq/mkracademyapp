import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
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
  ArrowRight,
  LogOut,
  ShieldCheck,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';
import { getUserOrders, subscribeToUserOrders } from '../../services/orderService';
import { PolicyType } from '../common/PolicyModal';

interface StudentProfileViewProps {
  onBack: () => void;
  onNavigateToPurchases: () => void;
  onNavigate?: (view: string, filterParam?: any) => void;
  onOpenPolicy?: (type: PolicyType) => void;
  onOpenAuth?: (initialMode?: 'login' | 'register') => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  onBack,
  onNavigateToPurchases,
  onNavigate,
  onOpenPolicy,
  onOpenAuth
}) => {
  const { user, profile, updateProfileData, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'purchases' | 'subjects' | 'policies'>('profile');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(profile?.displayName || user.displayName || '');
      setPhoneNumber(profile?.phoneNumber ? profile.phoneNumber.replace('+91', '').trim() : '');
    }
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    setLoadingOrders(true);

    const unsubscribe = subscribeToUserOrders(
      user.uid,
      (userOrders) => {
        setOrders(userOrders);
        setLoadingOrders(false);
      },
      (err) => {
        console.warn('Orders subscription issue, falling back to fetch:', err);
        getUserOrders(user.uid).then((o) => {
          setOrders(o);
          setLoadingOrders(false);
        });
      }
    );

    return () => unsubscribe();
  }, [user]);

  const validatePhone = (p: string) => {
    const cleaned = p.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setSuccessMessage(null);

    if (!validatePhone(phoneNumber)) {
      return;
    }

    setSaving(true);
    try {
      await updateProfileData({
        displayName: displayName.trim(),
        phoneNumber: `+91${phoneNumber.replace(/\D/g, '')}`
      });
      setSuccessMessage('Profile information updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // If visitor is not logged in, prompt to log in or create an account
  if (!user) {
    return (
      <div className="w-full min-h-[calc(100vh-140px)] bg-stone-50 py-10 animate-in fade-in duration-200">
        <div className="w-full max-w-xl mx-auto px-4 sm:px-6 space-y-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-stone-600 hover:text-stone-900 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500" />
            <span>Back to Notes</span>
          </button>

          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto shadow-sm">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-stone-900 font-sans">
                Student Profile & Account
              </h1>
              <p className="text-stone-600 text-sm max-w-sm mx-auto">
                Sign in to manage your student profile, view order histories, and download purchased notes anytime.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth ? onOpenAuth('login') : onNavigate?.('auth')}
                className="py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth ? onOpenAuth('register') : onNavigate?.('auth')}
                className="py-3 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-140px)] bg-stone-50 py-6 sm:py-10 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Bar / Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-stone-600 hover:text-stone-900 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500" />
            <span>Back to Previous Page</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-stone-500">
            <span>Student Account</span>
            <span className="text-stone-400">•</span>
            <span className="font-semibold text-stone-800 truncate max-w-[150px]">{user.email}</span>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-red-700 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-md shrink-0">
              {(profile?.displayName || user.displayName || user.email || 'S')[0]}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 truncate">
                {profile?.displayName || user.displayName || 'Student Account'}
              </h1>
              <p className="text-xs text-stone-500 truncate mt-0.5">
                {user.email} • {profile?.phoneNumber || 'Mobile unverified'}
              </p>
              {isAdmin && (
                <span className="inline-flex items-center space-x-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-900 text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin Access Active</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 self-stretch sm:self-auto">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate?.('admin')}
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Admin Panel
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                await logout();
                onBack();
              }}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-stone-200 pb-2 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-4 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
            }`}
          >
            My Details & Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`py-2 px-4 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'purchases'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Purchases ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`py-2 px-4 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'subjects'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subjects & Exam Classes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`py-2 px-4 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'policies'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Policies, Help & About</span>
          </button>
        </div>

        {/* TAB 1: PROFILE & SETTINGS */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Personal Details</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Keep your phone number and contact details up-to-date for payment verification and invoice delivery.
              </p>
            </div>

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Mobile Number <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 font-mono text-xs">+91</span>
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
                {phoneError && (
                  <p className="text-[10px] text-red-600 mt-1">{phoneError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="w-full bg-stone-100 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: PURCHASES */}
        {activeTab === 'purchases' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-stone-200">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Purchased Notes & Invoices</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  All educational notes purchased with your student account.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToPurchases}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>Full Purchase Reader</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingOrders ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-stone-500">Loading order records...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm">No Purchased Notes Yet</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  When you purchase notes, they will appear here with direct download links and receipts.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate?.('browse')}
                  className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Browse Available Notes
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-stone-900 text-sm truncate">
                          {ord.productTitleSnapshot}
                        </span>
                        {ord.status === 'paid' || ord.status === 'manually_approved' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Access Granted
                          </span>
                        ) : ord.status === 'pending' ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Pending
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {ord.status}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 font-mono">
                        Order #{ord.id} • {new Date(ord.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="font-black text-stone-900 font-sans text-sm">
                        ₹{ord.amountPaise / 100}
                      </span>
                      <button
                        type="button"
                        onClick={onNavigateToPurchases}
                        className="px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Open & Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUBJECTS & EXAMS */}
        {activeTab === 'subjects' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-stone-900 border-l-3 border-red-700 pl-3">
                Subjects (বিষয়সমূহ)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'General Science (বিজ্ঞান)', subject: 'General Science', count: 'Physics, Chem, Bio' },
                  { name: 'Mathematics (গণিত)', subject: 'Mathematics', count: 'Complete Solutions' },
                  { name: 'Social Science (সমাজ বিজ্ঞান)', subject: 'Social Science', count: 'History, Geog, Civics' },
                  { name: 'English (ইংৰাজী)', subject: 'English', count: 'Grammar & Prose' },
                  { name: 'Assamese (অসমীয়া)', subject: 'Assamese', count: 'MIL Notes' }
                ].map((sub) => (
                  <button
                    key={sub.subject}
                    type="button"
                    onClick={() => onNavigate?.('browse', { subject: sub.subject })}
                    className="p-4 rounded-2xl bg-stone-50 hover:bg-red-50 hover:border-red-200 border border-stone-200 text-left transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-sm">{sub.name}</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                    <p className="text-xs text-stone-500">{sub.count}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-200">
              <h2 className="text-lg font-bold text-stone-900 border-l-3 border-red-700 pl-3">
                Classes & Target Exams
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate?.('browse', { classLevel: 'HSLC 2027' })}
                  className="p-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-red-900 text-sm">HSLC 2027</span>
                    <ArrowRight className="w-4 h-4 text-red-700" />
                  </div>
                  <p className="text-xs text-red-700">Special Target Question Banks</p>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.('browse', { classLevel: 'Class 10' })}
                  className="p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-sm">Class 10 Notes</span>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="text-xs text-stone-500">Chapter-wise PDF Materials</p>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.('browse', { classLevel: 'Class 9' })}
                  className="p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-sm">Class 9 Notes</span>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="text-xs text-stone-500">Foundational Exam Revision</p>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.('free-pdfs')}
                  className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 text-sm">Free PDFs</span>
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                  </div>
                  <p className="text-xs text-emerald-700">100% Free Study Materials</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: POLICIES, HELP & ABOUT */}
        {activeTab === 'policies' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Policies, Legal & Support</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Review legal notices, grievance officer information, and contact student support.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => onOpenPolicy?.('privacy')}
                className="p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">Privacy Policy</h4>
                    <p className="text-[11px] text-stone-500">Data protection & zero-telemetry rules</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => onOpenPolicy?.('terms')}
                className="p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">Terms of Use</h4>
                    <p className="text-[11px] text-stone-500">Educational terms & conditions</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => onOpenPolicy?.('refund')}
                className="p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">Refund Policy</h4>
                    <p className="text-[11px] text-stone-500">Digital downloads & dispute process</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => onOpenPolicy?.('grievance')}
                className="p-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-red-200 text-red-800 flex items-center justify-center shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-900">Grievance Redressal</h4>
                    <p className="text-[11px] text-red-700">Submit a ticket to Grievance Officer</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </button>

              <button
                type="button"
                onClick={() => onOpenPolicy?.('tax-certin')}
                className="p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">Tax & CERT-In Notice</h4>
                    <p className="text-[11px] text-stone-500">Section 8 non-profit tax exemptions</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => onOpenPolicy?.('contact')}
                className="p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">Contact & Support</h4>
                    <p className="text-[11px] text-stone-500">WhatsApp helpline & email support</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            {/* About MKR Academy Card */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onOpenPolicy?.('about')}
                className="w-full p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-red-700 text-white flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">About MKR Academy</h3>
                    <p className="text-xs text-stone-400">Section 8 educational mission, history & student impact</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
