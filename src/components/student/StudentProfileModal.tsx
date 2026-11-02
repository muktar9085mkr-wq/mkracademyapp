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
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';
import { getUserOrders } from '../../services/orderService';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPurchases: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPurchases
}) => {
  const { user, profile, updateProfileData } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhoneNumber(profile.phoneNumber || '');
    }
    if (user) {
      loadOrders(user.uid);
    }
  }, [profile, user]);

  const loadOrders = async (uid: string) => {
    try {
      setLoadingOrders(true);
      const userOrders = await getUserOrders(uid);
      setOrders(userOrders);
    } catch (err) {
      console.error('Could not load user orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6 py-3 sm:py-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-lg sm:max-w-xl p-3.5 sm:p-6 shadow-2xl border border-stone-200 relative max-h-[calc(100dvh-24px)] overflow-y-auto my-auto">
        
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
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        ord.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
