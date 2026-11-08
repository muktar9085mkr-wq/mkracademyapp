import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Monitor,
  Tablet,
  HelpCircle,
  ShieldAlert,
  LogOut,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserX
} from 'lucide-react';
import { UserSession, revokeSessionAdmin, revokeAllUserSessionsAdmin, subscribeToSessionsAdmin } from '../../services/sessionService';
import { useAuth } from '../../context/AuthContext';

interface SessionManagerProps {
  initialSessions: UserSession[];
  onRefresh: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ initialSessions, onRefresh }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>(initialSessions);
  const [search, setSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'Android' | 'iOS' | 'Desktop' | 'Tablet'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'revoke_session' | 'force_logout_user';
    sessionId?: string;
    uid?: string;
    userName?: string;
    userEmail?: string;
  } | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    // Real-time listener for sessions
    const unsubscribe = subscribeToSessionsAdmin((liveSessions) => {
      setSessions(liveSessions);
    });
    return () => unsubscribe();
  }, []);

  const adminEmail = user?.email || 'muktar9085mkr@gmail.com';

  const handleRevokeSingle = async (sessionId: string) => {
    setActionLoading(sessionId);
    setActionMessage(null);
    try {
      await revokeSessionAdmin(sessionId, adminEmail);
      setActionMessage(`Session successfully terminated and revoked.`);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(`Could not revoke session: ${err.message || err}`);
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const handleForceLogoutUser = async (uid: string) => {
    setActionLoading(uid);
    setActionMessage(null);
    try {
      const count = await revokeAllUserSessionsAdmin(uid, adminEmail);
      setActionMessage(`Force logged out user: ${count} active session(s) terminated.`);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(`Could not force logout user: ${err.message || err}`);
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  // Helper for Device Icon
  const renderDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'Android':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'iOS':
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case 'Desktop':
        return <Monitor className="w-4 h-4 text-purple-600" />;
      case 'Tablet':
        return <Tablet className="w-4 h-4 text-amber-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-stone-400" />;
    }
  };

  // Helper for Last Active indicator
  const formatLastActive = (isoString: string) => {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 120) {
      return (
        <span className="text-emerald-800 font-bold flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Active now</span>
        </span>
      );
    }
    if (diffSec < 3600) {
      return `${Math.floor(diffSec / 60)}m ago`;
    }
    if (diffSec < 86400) {
      return `${Math.floor(diffSec / 3600)}h ago`;
    }
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSessions = sessions.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.userName?.toLowerCase().includes(q) ||
      s.userEmail?.toLowerCase().includes(q) ||
      s.browser?.toLowerCase().includes(q) ||
      s.os?.toLowerCase().includes(q) ||
      s.uid?.toLowerCase().includes(q);

    const matchesDevice = deviceFilter === 'all' || s.deviceType === deviceFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesDevice && matchesStatus;
  });

  const activeCount = sessions.filter((s) => s.status === 'active').length;
  const androidCount = sessions.filter((s) => s.deviceType === 'Android').length;
  const iosCount = sessions.filter((s) => s.deviceType === 'iOS').length;
  const desktopCount = sessions.filter((s) => s.deviceType === 'Desktop').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-stone-900 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span>Active Sessions & Device Management</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Live audit of currently logged-in student & administrator devices, browsers, and security sessions.
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Sessions</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase">Active Sessions</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">{activeCount}</div>
            <span className="text-[10px] text-stone-400">Authenticated devices</span>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase flex items-center space-x-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Android Devices</span>
            </span>
            <div className="text-2xl font-black text-stone-900 mt-1">{androidCount}</div>
            <span className="text-[10px] text-stone-400">Mobile app & WebView</span>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase flex items-center space-x-1">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>iOS Devices</span>
            </span>
            <div className="text-2xl font-black text-stone-900 mt-1">{iosCount}</div>
            <span className="text-[10px] text-stone-400">iPhone / iPad browsers</span>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase flex items-center space-x-1">
              <Monitor className="w-3.5 h-3.5 text-purple-600" />
              <span>Desktop / Laptop</span>
            </span>
            <div className="text-2xl font-black text-stone-900 mt-1">{desktopCount}</div>
            <span className="text-[10px] text-stone-400">Chrome, Edge, Firefox</span>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email, browser, or OS..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-hidden focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value as any)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700"
          >
            <option value="all">All Devices</option>
            <option value="Android">Android</option>
            <option value="iOS">iOS</option>
            <option value="Desktop">Desktop</option>
            <option value="Tablet">Tablet</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="revoked">Revoked Only</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student / User</th>
                <th className="py-3 px-4">Device & OS</th>
                <th className="py-3 px-4">Browser</th>
                <th className="py-3 px-4">Login Time</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-stone-400">
                    No matching user sessions found.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => {
                  const isRevoked = s.status === 'revoked';
                  const isSelf = s.uid === user?.uid;

                  return (
                    <tr key={s.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-stone-900">{s.userName || 'Student'}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{s.userEmail || s.uid}</div>
                        {isSelf && (
                          <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-1.5 py-0.2 rounded">
                            Your Current Admin Session
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          {renderDeviceIcon(s.deviceType)}
                          <span className="font-bold text-stone-800">{s.deviceType}</span>
                        </div>
                        <div className="text-[11px] text-stone-400">{s.os}</div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-stone-700">
                        {s.browser}
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        {new Date(s.loginAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        {formatLastActive(s.lastActiveAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        {isRevoked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                            Revoked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isRevoked ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  type: 'revoke_session',
                                  sessionId: s.id,
                                  userName: s.userName,
                                  userEmail: s.userEmail
                                })
                              }
                              disabled={actionLoading === s.id}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] transition-colors border border-rose-200"
                              title="Terminate this device session immediately"
                            >
                              Revoke Device
                            </button>

                            <button
                              onClick={() =>
                                setConfirmModal({
                                  type: 'force_logout_user',
                                  uid: s.uid,
                                  userName: s.userName,
                                  userEmail: s.userEmail
                                })
                              }
                              disabled={actionLoading === s.uid}
                              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg text-[11px] transition-colors"
                              title="Force logout all active sessions for this student"
                            >
                              Force Logout All
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">Terminated</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-stone-900">
                {confirmModal.type === 'revoke_session' ? 'Revoke Device Session?' : 'Force Logout Student?'}
              </h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                {confirmModal.type === 'revoke_session' ? (
                  <>
                    Are you sure you want to terminate the active session on this device for{' '}
                    <strong className="text-stone-900">{confirmModal.userEmail || confirmModal.userName}</strong>? The student
                    will be immediately signed out from this device.
                  </>
                ) : (
                  <>
                    Are you sure you want to force logout{' '}
                    <strong className="text-stone-900">{confirmModal.userEmail || confirmModal.userName}</strong> from{' '}
                    <strong>ALL</strong> active devices? All active sessions will be revoked.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === 'revoke_session' && confirmModal.sessionId) {
                    handleRevokeSingle(confirmModal.sessionId);
                  } else if (confirmModal.type === 'force_logout_user' && confirmModal.uid) {
                    handleForceLogoutUser(confirmModal.uid);
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
