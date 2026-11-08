import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Users,
  Activity,
  Printer,
  Table,
  CheckCircle2,
  TrendingUp,
  Package
} from 'lucide-react';
import { Order, UserProfile, Product, Purchase } from '../../types';
import { UserSession } from '../../services/sessionService';
import {
  ReportCategory,
  ReportDateFilter,
  getDateRangeFromFilter,
  exportTableToCsv,
  exportTableToExcel
} from '../../services/reportService';

interface ReportsManagerProps {
  orders: Order[];
  students: UserProfile[];
  products: Product[];
  sessions: UserSession[];
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  orders,
  students,
  products,
  sessions
}) => {
  const [category, setCategory] = useState<ReportCategory>('revenue');
  const [dateFilter, setDateFilter] = useState<ReportDateFilter>('30days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const dateRange = getDateRangeFromFilter(dateFilter, customStart, customEnd);

  // Filter orders by date range
  const filteredOrders = orders.filter((o) => {
    const raw = o.verifiedAt || o.createdAt;
    if (!raw) return false;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return false;
    return d >= dateRange.startDate && d <= dateRange.endDate;
  });

  // Filter students by date range
  const filteredStudents = students.filter((s) => {
    if (!s.createdAt) return false;
    const d = new Date(s.createdAt);
    if (isNaN(d.getTime())) return false;
    return d >= dateRange.startDate && d <= dateRange.endDate;
  });

  // Filter sessions by date range
  const filteredSessions = sessions.filter((sess) => {
    if (!sess.loginAt) return false;
    const d = new Date(sess.loginAt);
    if (isNaN(d.getTime())) return false;
    return d >= dateRange.startDate && d <= dateRange.endDate;
  });

  // 1. REVENUE REPORT DATA
  const paidOrders = filteredOrders.filter((o) => o.status === 'paid' || o.status === 'manually_approved');
  const failedOrders = filteredOrders.filter((o) => o.status === 'failed');
  const pendingOrders = filteredOrders.filter((o) => o.status === 'pending');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;

  // Product-wise breakdown
  const productRevenueMap = new Map<string, { title: string; count: number; revenue: number }>();
  paidOrders.forEach((o) => {
    const pId = o.productId || 'other';
    const title = o.productTitleSnapshot || 'Study Material';
    const existing = productRevenueMap.get(pId) || { title, count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += (o.amountPaise || 0) / 100;
    productRevenueMap.set(pId, existing);
  });
  const productRevenueRows = Array.from(productRevenueMap.values()).sort((a, b) => b.revenue - a.revenue);

  // 2. USER REPORT DATA
  const verifiedUsersCount = students.filter((s) => s.isVerified || s.emailVerified).length;
  const suspendedUsersCount = students.filter((s) => s.status === 'suspended').length;
  const blockedUsersCount = students.filter((s) => s.status === 'blocked').length;
  const activeUsersCount = students.filter((s) => s.status === 'active' || !s.status).length;

  // 3. ACTIVITY REPORT DATA (Recent session and purchase activity)
  const activityRows = filteredSessions.slice(0, 100);

  // Export Handlers
  const handleExportCsv = () => {
    const filename = `mkr_academy_${category}_report_${new Date().toISOString().split('T')[0]}.csv`;

    if (category === 'revenue') {
      const headers = ['Order ID', 'Date', 'Student Name', 'Email', 'Phone', 'Product Title', 'Amount (INR)', 'Payment Status', 'Razorpay Payment ID'];
      const rows = filteredOrders.map((o) => [
        o.id,
        o.verifiedAt || o.createdAt,
        o.studentName || 'Student',
        o.studentEmail || '',
        o.studentPhone || '',
        o.productTitleSnapshot || '',
        (o.amountPaise || 0) / 100,
        o.status,
        o.razorpayPaymentId || 'N/A'
      ]);
      exportTableToCsv(headers, rows, filename);
    } else if (category === 'users') {
      const headers = ['UID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Verified', 'Registered Date'];
      const rows = students.map((s) => [
        s.uid,
        s.displayName || '',
        s.email,
        s.phoneNumber || '',
        s.role || 'student',
        s.status || 'active',
        s.isVerified || s.emailVerified ? 'Yes' : 'No',
        s.createdAt || ''
      ]);
      exportTableToCsv(headers, rows, filename);
    } else {
      const headers = ['Session ID', 'User Name', 'Email', 'Device', 'OS', 'Browser', 'Login Timestamp', 'Status'];
      const rows = filteredSessions.map((s) => [
        s.id,
        s.userName,
        s.userEmail,
        s.deviceType,
        s.os,
        s.browser,
        s.loginAt,
        s.status
      ]);
      exportTableToCsv(headers, rows, filename);
    }

    setExportNotice(`Exported ${category.toUpperCase()} report as CSV.`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportExcel = () => {
    const filename = `mkr_academy_${category}_report_${new Date().toISOString().split('T')[0]}.xls`;

    if (category === 'revenue') {
      const headers = ['Order ID', 'Date', 'Student Name', 'Email', 'Phone', 'Product Title', 'Amount (INR)', 'Payment Status', 'Razorpay ID'];
      const rows = filteredOrders.map((o) => [
        o.id,
        o.verifiedAt || o.createdAt,
        o.studentName || 'Student',
        o.studentEmail || '',
        o.studentPhone || '',
        o.productTitleSnapshot || '',
        (o.amountPaise || 0) / 100,
        o.status,
        o.razorpayPaymentId || 'N/A'
      ]);
      exportTableToExcel(headers, rows, filename, 'Revenue Report');
    } else if (category === 'users') {
      const headers = ['UID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Verified', 'Registered Date'];
      const rows = students.map((s) => [
        s.uid,
        s.displayName || '',
        s.email,
        s.phoneNumber || '',
        s.role || 'student',
        s.status || 'active',
        s.isVerified || s.emailVerified ? 'Yes' : 'No',
        s.createdAt || ''
      ]);
      exportTableToExcel(headers, rows, filename, 'User Directory Report');
    } else {
      const headers = ['Session ID', 'User Name', 'Email', 'Device', 'OS', 'Browser', 'Login Timestamp', 'Status'];
      const rows = filteredSessions.map((s) => [
        s.id,
        s.userName,
        s.userEmail,
        s.deviceType,
        s.os,
        s.browser,
        s.loginAt,
        s.status
      ]);
      exportTableToExcel(headers, rows, filename, 'Activity Report');
    }

    setExportNotice(`Exported ${category.toUpperCase()} report as Excel file.`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Category Selector */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-stone-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-red-600" />
              <span>Exportable Reports System</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Generate, preview, and download formal business audits for revenue, student accounts, and activity.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Export Excel (XLS)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Category Selector Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
          <button
            onClick={() => setCategory('revenue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              category === 'revenue'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>A. Revenue Reports</span>
          </button>

          <button
            onClick={() => setCategory('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              category === 'users'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>B. User Reports</span>
          </button>

          <button
            onClick={() => setCategory('activity')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              category === 'activity'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>C. Activity Reports</span>
          </button>
        </div>
      </div>

      {/* Date Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-1.5 text-stone-500 text-xs font-bold">
          <Calendar className="w-4 h-4 text-red-600" />
          <span>Report Period:</span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Previous Month' },
              { id: 'custom', label: 'Custom Range' }
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setDateFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateFilter === item.id
                  ? 'bg-red-700 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center space-x-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
            />
            <span className="text-stone-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
            />
          </div>
        )}
      </div>

      {/* Report Content Panels */}
      {category === 'revenue' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Period Revenue</span>
              <div className="text-2xl font-black text-stone-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-stone-400">{paidOrders.length} verified sales</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Paid Orders</span>
              <div className="text-2xl font-black text-emerald-800 mt-1">{paidOrders.length}</div>
              <span className="text-[10px] text-stone-400">Successfully unlocked</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Failed Orders</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{failedOrders.length}</div>
              <span className="text-[10px] text-stone-400">Gateway dropped</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Pending Orders</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{pendingOrders.length}</div>
              <span className="text-[10px] text-stone-400">Awaiting payment</span>
            </div>
          </div>

          {/* Product-Wise Sales Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-stone-900">Product-Wise Sales Summary</h3>
              <span className="text-xs text-stone-500 font-bold">{productRevenueRows.length} study materials sold</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Product Title</th>
                    <th className="py-2.5 px-4 text-center">Copies Sold</th>
                    <th className="py-2.5 px-4 text-right">Revenue Generated</th>
                    <th className="py-2.5 px-4 text-right">% Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {productRevenueRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-stone-400">
                        No sales recorded during this period.
                      </td>
                    </tr>
                  ) : (
                    productRevenueRows.map((p) => {
                      const share = totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : '0';
                      return (
                        <tr key={p.title} className="hover:bg-stone-50/60">
                          <td className="py-3 px-4 font-extrabold text-stone-900">{p.title}</td>
                          <td className="py-3 px-4 text-center font-bold text-stone-700">{p.count}</td>
                          <td className="py-3 px-4 text-right font-black text-stone-900">₹{p.revenue.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right text-stone-500 font-bold">{share}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {category === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Total Registered</span>
              <div className="text-2xl font-black text-stone-900 mt-1">{students.length}</div>
              <span className="text-[10px] text-stone-400">All registered student accounts</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase">New in Period</span>
              <div className="text-2xl font-black text-blue-700 mt-1">+{filteredStudents.length}</div>
              <span className="text-[10px] text-stone-400">Onboarded during range</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Verified Accounts</span>
              <div className="text-2xl font-black text-emerald-800 mt-1">{verifiedUsersCount}</div>
              <span className="text-[10px] text-stone-400">Email / Identity verified</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Suspended / Blocked</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{suspendedUsersCount + blockedUsersCount}</div>
              <span className="text-[10px] text-stone-400">Security restricted accounts</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-stone-900">User Roster Preview</h3>
              <span className="text-xs text-stone-500 font-bold">{students.length} accounts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4">Account Status</th>
                    <th className="py-2.5 px-4">Registration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {students.slice(0, 25).map((s) => (
                    <tr key={s.uid} className="hover:bg-stone-50/60">
                      <td className="py-2.5 px-4 font-bold text-stone-900">{s.displayName || 'Student'}</td>
                      <td className="py-2.5 px-4 text-stone-600 font-mono">{s.email}</td>
                      <td className="py-2.5 px-4 text-stone-600">{s.phoneNumber || 'N/A'}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          s.status === 'blocked' ? 'bg-rose-100 text-rose-700' : s.status === 'suspended' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.status || 'active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-stone-500">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {category === 'activity' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-stone-900">Recent Login & Session Activity</h3>
              <span className="text-xs text-stone-500 font-bold">{filteredSessions.length} recorded events</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Device</th>
                    <th className="py-2.5 px-4">Operating System</th>
                    <th className="py-2.5 px-4">Browser</th>
                    <th className="py-2.5 px-4">Login Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {activityRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-stone-400">
                        No activity records found for this period.
                      </td>
                    </tr>
                  ) : (
                    activityRows.map((sess) => (
                      <tr key={sess.id} className="hover:bg-stone-50/60">
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-stone-900">{sess.userName}</div>
                          <div className="text-[10px] text-stone-400 font-mono">{sess.userEmail}</div>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-stone-700">{sess.deviceType}</td>
                        <td className="py-2.5 px-4 text-stone-600">{sess.os}</td>
                        <td className="py-2.5 px-4 text-stone-600">{sess.browser}</td>
                        <td className="py-2.5 px-4 text-stone-500">
                          {new Date(sess.loginAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
