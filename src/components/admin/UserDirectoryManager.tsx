import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  RefreshCw,
  X,
  ExternalLink
} from 'lucide-react';
import {
  UserManagementItem,
  getAllUsersWithStatsAdmin,
  toggleUserVerificationAdmin,
  suspendUserAdmin,
  blockUserAdmin,
  restoreUserAccountAdmin
} from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { UserSession } from '../../services/sessionService';

interface UserDirectoryManagerProps {
  sessions: UserSession[];
  onRefreshAll?: () => void;
}

export const UserDirectoryManager: React.FC<UserDirectoryManagerProps> = ({ sessions, onRefreshAll }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'active' | 'suspended' | 'blocked'>('all');

  // Selected user for detailed profile drawer/modal
  const [selectedUser, setSelectedUser] = useState<UserManagementItem | null>(null);

  // Status Action Modal (Suspend / Block / Restore)
  const [statusModal, setStatusModal] = useState<{
    type: 'suspend' | 'block' | 'restore';
    targetUser: UserManagementItem;
  } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const adminEmail = user?.email || 'muktar9085mkr@gmail.com';

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsersWithStatsAdmin();
      setUsers(data);
    } catch (err) {
      console.warn('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle Verify / Unverify toggle
  const handleToggleVerify = async (u: UserManagementItem) => {
    const nextVal = !u.isAccountVerified;
    try {
      await toggleUserVerificationAdmin(u.uid, nextVal, adminEmail);
      setUsers((prev) =>
        prev.map((item) =>
          item.uid === u.uid ? { ...item, isAccountVerified: nextVal, isVerified: nextVal, emailVerified: nextVal } : item
        )
      );
      if (selectedUser && selectedUser.uid === u.uid) {
        setSelectedUser((prev) => prev ? { ...prev, isAccountVerified: nextVal } : null);
      }
      setStatusFeedback(`Account verification set to: ${nextVal ? 'Verified' : 'Unverified'}`);
      setTimeout(() => setStatusFeedback(null), 4000);
    } catch (err: any) {
      alert(`Could not toggle verification: ${err.message || err}`);
    }
  };

  // Handle status update submission (Suspend / Block / Restore)
  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal) return;
    setStatusUpdating(true);
    const { type, targetUser } = statusModal;

    try {
      if (type === 'suspend') {
        await suspendUserAdmin(targetUser.uid, statusReason.trim(), adminEmail);
        setStatusFeedback(`Student ${targetUser.displayName || targetUser.email} has been temporarily suspended.`);
      } else if (type === 'block') {
        await blockUserAdmin(targetUser.uid, statusReason.trim(), adminEmail);
        setStatusFeedback(`Student ${targetUser.displayName || targetUser.email} has been blocked.`);
      } else if (type === 'restore') {
        await restoreUserAccountAdmin(targetUser.uid, adminEmail);
        setStatusFeedback(`Student ${targetUser.displayName || targetUser.email} account has been restored to Active status.`);
      }

      await loadUsers();
      if (selectedUser && selectedUser.uid === targetUser.uid) {
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                accountStatus: type === 'restore' ? 'active' : type === 'suspend' ? 'suspended' : 'blocked'
              }
            : null
        );
      }
      setStatusModal(null);
      setStatusReason('');
      setTimeout(() => setStatusFeedback(null), 5000);
    } catch (err: any) {
      alert(`Failed to update user status: ${err.message || err}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phoneNumber?.includes(q) ||
      u.uid.toLowerCase().includes(q);

    let matchesStatus = true;
    if (statusFilter === 'verified') matchesStatus = Boolean(u.isAccountVerified);
    else if (statusFilter === 'unverified') matchesStatus = !u.isAccountVerified;
    else if (statusFilter === 'active') matchesStatus = u.accountStatus === 'active';
    else if (statusFilter === 'suspended') matchesStatus = u.accountStatus === 'suspended';
    else if (statusFilter === 'blocked') matchesStatus = u.accountStatus === 'blocked';

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Summary */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-stone-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-red-600" />
              <span>Advanced User Management Directory</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Search, verify, inspect purchase and payment histories, and manage student account statuses safely.
            </p>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-600' : ''}`} />
            <span>Sync Students</span>
          </button>
        </div>

        {/* User Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase">Total Students</span>
            <div className="text-2xl font-black text-stone-900 mt-1">{users.length}</div>
            <span className="text-[10px] text-stone-400">Registered profiles</span>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Accounts</span>
            </span>
            <div className="text-2xl font-black text-emerald-800 mt-1">
              {users.filter((u) => u.isAccountVerified).length}
            </div>
            <span className="text-[10px] text-stone-400">Identity / Email verified</span>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Suspended Users</span>
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {users.filter((u) => u.accountStatus === 'suspended').length}
            </div>
            <span className="text-[10px] text-stone-400">Temporarily on hold</span>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Blocked Users</span>
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {users.filter((u) => u.accountStatus === 'blocked').length}
            </div>
            <span className="text-[10px] text-stone-400">Security restricted</span>
          </div>
        </div>
      </div>

      {statusFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, email, or 10-digit phone number..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-hidden focus:border-red-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700"
        >
          <option value="all">All Accounts ({users.length})</option>
          <option value="verified">Verified Only</option>
          <option value="unverified">Unverified Only</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
          <option value="blocked">Blocked Only</option>
        </select>
      </div>

      {/* User Directory Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student Name & Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-center">Purchases</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4 text-center">Verification</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-stone-400">
                    No matching student profiles found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isBlocked = u.accountStatus === 'blocked';
                  const isSuspended = u.accountStatus === 'suspended';

                  return (
                    <tr key={u.uid} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-stone-900">{u.displayName || 'Student'}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{u.email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-stone-700">
                        {u.phoneNumber ? (
                          <span>+91 {u.phoneNumber}</span>
                        ) : (
                          <span className="text-stone-400 italic">Not added</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        {u.registrationDateFormatted}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black px-2 py-0.5 rounded-full bg-stone-100 text-stone-800">
                          {u.totalPurchasesCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-stone-900">
                        ₹{u.totalSpentRupees.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleVerify(u)}
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase transition-colors ${
                            u.isAccountVerified
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                          }`}
                          title="Click to toggle account verification status"
                        >
                          {u.isAccountVerified ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Verified</span>
                            </>
                          ) : (
                            <span>Unverified</span>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isBlocked
                              ? 'bg-rose-100 text-rose-700'
                              : isSuspended
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.accountStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                            title="Open detailed user profile drawer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isBlocked || isSuspended ? (
                            <button
                              onClick={() => setStatusModal({ type: 'restore', targetUser: u })}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] transition-colors border border-emerald-200"
                              title="Restore account to Active status"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setStatusModal({ type: 'suspend', targetUser: u })}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-[11px] transition-colors border border-amber-200"
                                title="Temporarily suspend student account"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => setStatusModal({ type: 'block', targetUser: u })}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] transition-colors border border-rose-200"
                                title="Block student account"
                              >
                                Block
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-stone-200 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  Student Account Dossier
                </span>
                <h3 className="text-xl font-black text-stone-900 mt-1">{selectedUser.displayName || 'Student Profile'}</h3>
                <p className="text-xs text-stone-500 font-mono">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Account Status</span>
                <div className="text-sm font-black text-stone-900 capitalize mt-0.5">{selectedUser.accountStatus}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Verification</span>
                <div className="text-sm font-black text-stone-900 mt-0.5">
                  {selectedUser.isAccountVerified ? 'Verified' : 'Unverified'}
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Purchases</span>
                <div className="text-sm font-black text-stone-900 mt-0.5">{selectedUser.totalPurchasesCount} items</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Total Spent</span>
                <div className="text-sm font-black text-emerald-800 mt-0.5">
                  ₹{selectedUser.totalSpentRupees.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Student Identity Information */}
            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-stone-900">Student Contact Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Full Name</span>
                  <span className="font-bold text-stone-900">{selectedUser.displayName || 'Student'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Email Address</span>
                  <span className="font-mono text-stone-900">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Mobile Number</span>
                  <span className="font-mono text-stone-900">{selectedUser.phoneNumber ? `+91 ${selectedUser.phoneNumber}` : 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Registered On</span>
                  <span>{selectedUser.registrationDateFormatted}</span>
                </div>
              </div>
            </div>

            {/* Purchased Study Materials */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-stone-900 flex items-center space-x-1.5">
                  <ShoppingBag className="w-4 h-4 text-red-600" />
                  <span>Purchased Materials ({selectedUser.purchasedItems.length})</span>
                </h4>
              </div>

              {selectedUser.purchasedItems.length === 0 ? (
                <div className="p-4 rounded-xl bg-stone-50 text-center text-stone-400 border border-stone-200">
                  No study materials purchased yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedUser.purchasedItems.map((pur) => (
                    <div
                      key={pur.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-extrabold text-stone-900">{pur.productTitle}</div>
                        <div className="text-[10px] text-stone-400">
                          Purchased: {new Date(pur.purchasedAt || pur.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {pur.entitlementStatus || 'active'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Orders History */}
            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-stone-900 flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-red-600" />
                <span>Orders & Payment History ({selectedUser.successfulOrders.length + selectedUser.failedOrders.length})</span>
              </h4>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {[...selectedUser.successfulOrders, ...selectedUser.failedOrders].map((ord) => (
                  <div
                    key={ord.id}
                    className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-stone-800">{ord.productTitleSnapshot}</div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        ID: {ord.id} • {ord.razorpayPaymentId || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-stone-900">₹{(ord.amountPaise || 0) / 100}</div>
                      <span className={`text-[10px] font-black uppercase ${
                        ord.status === 'paid' || ord.status === 'manually_approved' ? 'text-emerald-800' : 'text-rose-600'
                      }`}>
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Management Actions in Drawer */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleToggleVerify(selectedUser)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors"
                >
                  {selectedUser.isAccountVerified ? 'Unverify Account' : 'Verify Account'}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {selectedUser.accountStatus === 'active' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setStatusModal({ type: 'suspend', targetUser: selectedUser })}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-xs border border-amber-200 transition-colors"
                    >
                      Suspend
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusModal({ type: 'block', targetUser: selectedUser })}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition-colors"
                    >
                      Block User
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStatusModal({ type: 'restore', targetUser: selectedUser })}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Restore Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Suspend / Block / Restore */}
      {statusModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-stone-900 capitalize">
                {statusModal.type} Student Account?
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Target User:{' '}
                <strong className="text-stone-900">
                  {statusModal.targetUser.displayName || statusModal.targetUser.email}
                </strong>
                <br />
                {statusModal.type === 'suspend' &&
                  'The user will be temporarily blocked from signing in or placing new orders, but existing purchase records will remain preserved.'}
                {statusModal.type === 'block' &&
                  'The user account will be permanently blocked for policy violation. Their purchase and payment history will be preserved for financial auditing.'}
                {statusModal.type === 'restore' &&
                  'The user account will be restored to Active status, allowing normal sign-in and purchase capability.'}
              </p>
            </div>

            {statusModal.type !== 'restore' && (
              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">
                  Reason for {statusModal.type}:
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Enter reason for audit logs (optional)..."
                  rows={2}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-hidden focus:border-red-500"
                />
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={statusUpdating}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                {statusUpdating ? 'Processing...' : `Confirm ${statusModal.type}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
