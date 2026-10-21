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
  Calendar,
  ShieldCheck
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 pb-4 border-b border-stone-200">
          <div className="w-12 h-12 rounded-2xl bg-red-700 text-white flex items-center justify-center font-bold text-lg">
            {(profile?.displayName || user.email || 'S')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 font-sans">
              Student Profile & Account
            </h2>
            <p className="text-xs text-stone-500">
              Manage your personal information, mobile contact, and order history.
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Indian Mobile Number <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 font-mono text-xs">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-3 py-2.5 font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                />
              </div>
              {phoneError && <p className="text-[11px] text-red-600 mt-1">{phoneError}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-stone-700 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  disabled
                  value={user.email || ''}
                  className="w-full bg-stone-100 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-stone-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-stone-300 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>

        {/* Order History Section */}
        <div className="mt-8 pt-6 border-t border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-stone-400" />
              <span>Order History & Invoices</span>
            </h3>

            <button
              onClick={() => {
                onClose();
                onNavigateToPurchases();
              }}
              className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center space-x-1"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View All Purchased Notes →</span>
            </button>
          </div>

          {loadingOrders ? (
            <p className="text-xs text-stone-400 py-4 text-center">Loading your order history...</p>
          ) : orders.length === 0 ? (
            <p className="text-xs text-stone-500 py-3 bg-stone-50 rounded-xl p-3 border border-stone-200">
              No previous orders found for this account.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-stone-800 truncate max-w-[240px] sm:max-w-md">
                      {ord.productTitleSnapshot}
                    </p>
                    <p className="text-[11px] text-stone-500 font-mono">
                      Order #{ord.id} • {new Date(ord.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-stone-900">₹{ord.amountPaise / 100}</p>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
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
