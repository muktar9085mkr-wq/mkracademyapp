import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Package,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  RefreshCw,
  Smartphone,
  Monitor
} from 'lucide-react';
import { Product, Order, UserProfile } from '../../types';
import { UserSession } from '../../services/sessionService';

interface AnalyticsDashboardProps {
  orders: Order[];
  products: Product[];
  students: UserProfile[];
  sessions: UserSession[];
  onNavigateToTab: (tab: any) => void;
  onRefreshData: () => void;
  refreshing: boolean;
}

type TimeframeFilter = 'today' | '7days' | '30days' | 'this_month' | 'this_year' | 'all';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  orders,
  products,
  students,
  sessions,
  onNavigateToTab,
  onRefreshData,
  refreshing
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('30days');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Helper to parse order timestamp
  const parseOrderDate = (o: Order): Date => {
    const raw = o.verifiedAt || o.createdAt;
    if (!raw) return new Date();
    const d = new Date(raw);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // Helper to parse user registration date
  const parseUserDate = (u: UserProfile): Date => {
    if (!u.createdAt) return new Date(0);
    const d = new Date(u.createdAt);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  // Filter orders by timeframe
  const filteredOrders = orders.filter((o) => {
    if (timeframe === 'all') return true;
    const d = parseOrderDate(o);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (timeframe === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (timeframe === '7days') {
      return diffDays <= 7;
    }
    if (timeframe === '30days') {
      return diffDays <= 30;
    }
    if (timeframe === 'this_month') {
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }
    if (timeframe === 'this_year') {
      return d.getFullYear() === currentYear;
    }
    return true;
  });

  // Calculate Revenue metrics
  const verifiedPaidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'manually_approved');
  const filteredPaidOrders = filteredOrders.filter((o) => o.status === 'paid' || o.status === 'manually_approved');

  const totalLifetimeRevenue = verifiedPaidOrders.reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;
  const filteredRevenue = filteredPaidOrders.reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;

  // Today's revenue
  const todayStr = now.toDateString();
  const todayPaidOrders = verifiedPaidOrders.filter((o) => parseOrderDate(o).toDateString() === todayStr);
  const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;

  // This Month's revenue
  const monthPaidOrders = verifiedPaidOrders.filter(
    (o) => parseOrderDate(o).getFullYear() === currentYear && parseOrderDate(o).getMonth() === currentMonth
  );
  const monthlyRevenue = monthPaidOrders.reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;

  // Signups count
  const todaySignups = students.filter((u) => parseUserDate(u).toDateString() === todayStr).length;
  const last7DaysSignups = students.filter((u) => (now.getTime() - parseUserDate(u).getTime()) / (1000 * 60 * 60 * 24) <= 7).length;
  const last30DaysSignups = students.filter((u) => (now.getTime() - parseUserDate(u).getTime()) / (1000 * 60 * 60 * 24) <= 30).length;

  // Active / Online users (sessions active in last 15 minutes)
  const fifteenMinutesAgo = now.getTime() - 15 * 60 * 1000;
  const onlineSessions = sessions.filter((s) => {
    if (s.status !== 'active') return false;
    const lastActive = new Date(s.lastActiveAt).getTime();
    return !isNaN(lastActive) && lastActive >= fifteenMinutesAgo;
  });
  const onlineUserIds = new Set(onlineSessions.map((s) => s.uid));
  const currentlyOnlineCount = onlineUserIds.size;

  // Total active users (status != suspended/blocked)
  const totalActiveUsers = students.filter((s) => (s as any).status !== 'suspended' && (s as any).status !== 'blocked').length;

  // Orders counts
  const totalPurchasesCount = verifiedPaidOrders.length;
  const failedTransactionsCount = orders.filter((o) => o.status === 'failed').length;
  const pendingTransactionsCount = orders.filter((o) => o.status === 'pending').length;

  // Daily revenue trend for the last 7 days for the chart
  const last7DaysTrend: { dateStr: string; label: string; amount: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const dayOrders = verifiedPaidOrders.filter((o) => parseOrderDate(o).toDateString() === dateStr);
    const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    last7DaysTrend.push({
      dateStr,
      label: dayName,
      amount: dayRevenue,
      count: dayOrders.length
    });
  }

  const maxDailyRevenue = Math.max(...last7DaysTrend.map((d) => d.amount), 100);

  // Subject-wise sales distribution
  const subjectSalesMap = new Map<string, { count: number; revenue: number }>();
  verifiedPaidOrders.forEach((o) => {
    const prod = products.find((p) => p.id === o.productId);
    const subj = prod?.subject || 'Other Subjects';
    const existing = subjectSalesMap.get(subj) || { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += (o.amountPaise || 0) / 100;
    subjectSalesMap.set(subj, existing);
  });
  const subjectSalesList = Array.from(subjectSalesMap.entries())
    .map(([subject, data]) => ({ subject, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* Top Header & Timeframe Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
              Real-Time Live Analytics
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-stone-900 mt-1">Platform Performance Dashboard</h2>
          <p className="text-xs text-stone-500">Live synchronized metrics from MKR Academy Cloud Firestore.</p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Timeframe Buttons */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7days', label: '7 Days' },
                { id: '30days', label: '30 Days' },
                { id: 'this_month', label: 'This Month' },
                { id: 'all', label: 'All Time' }
              ] as const
            ).map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  timeframe === tf.id
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            onClick={onRefreshData}
            disabled={refreshing}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors border border-stone-200 flex items-center justify-center"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Row 1: Primary Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lifetime Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-red-200 transition-all">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">₹{totalLifetimeRevenue.toLocaleString('en-IN')}</div>
          <div className="flex items-center space-x-1 mt-2 text-[11px] text-stone-500">
            <span className="text-emerald-800 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> ₹{todayRevenue.toLocaleString('en-IN')}
            </span>
            <span>earned today</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-red-200 transition-all">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">₹{monthlyRevenue.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-stone-500 mt-2">
            Current month ({now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})
          </div>
        </div>

        {/* Total Registered Users */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-red-200 transition-all">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Students</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">{students.length}</div>
          <div className="flex items-center space-x-1 mt-2 text-[11px] text-stone-500">
            <span className="text-blue-800 font-bold">+{last7DaysSignups} new</span>
            <span>in last 7 days</span>
          </div>
        </div>

        {/* Currently Online / Active Users */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-red-200 transition-all">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active & Online</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-black text-emerald-800">{currentlyOnlineCount}</div>
            <span className="text-xs font-bold text-stone-400">online now</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-2">
            {totalActiveUsers} verified active student accounts
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Operational Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products Uploaded */}
        <div
          onClick={() => onNavigateToTab('products')}
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Total Products</span>
            <Package className="w-4 h-4 text-stone-400 group-hover:text-red-600 transition-colors" />
          </div>
          <div className="text-xl font-black text-stone-900 mt-1">{products.length}</div>
          <p className="text-[11px] text-stone-400 mt-1">Study notes & question papers</p>
        </div>

        {/* Successful Purchases */}
        <div
          onClick={() => onNavigateToTab('orders')}
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Successful Purchases</span>
            <ShoppingBag className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-black text-emerald-800 mt-1">{totalPurchasesCount}</div>
          <p className="text-[11px] text-emerald-800 mt-1">Delivered to student dashboards</p>
        </div>

        {/* Failed Transactions */}
        <div
          onClick={() => onNavigateToTab('orders')}
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Failed Payments</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-black text-rose-600 mt-1">{failedTransactionsCount}</div>
          <p className="text-[11px] text-stone-400 mt-1">Razorpay gateway declines</p>
        </div>

        {/* Pending Orders awaiting confirmation / approval */}
        <div
          onClick={() => onNavigateToTab('orders')}
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Pending Approvals</span>
            <span className="text-amber-500 text-xs font-bold">⚡ Manual Action</span>
          </div>
          <div className="text-xl font-black text-amber-600 mt-1">{pendingOrdersCount(orders)}</div>
          <p className="text-[11px] text-stone-400 mt-1">Ready for Manual Approval</p>
        </div>
      </div>

      {/* Row 3: Interactive Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue Trend Visual Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <span>Daily Revenue Trend (Last 7 Days)</span>
              </h3>
              <p className="text-xs text-stone-500">Actual student payments collected via Razorpay & approved orders</p>
            </div>
            <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
              ₹{last7DaysTrend.reduce((s, d) => s + d.amount, 0).toLocaleString('en-IN')} total (7D)
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-stone-100">
            {last7DaysTrend.map((day, idx) => {
              const heightPercent = maxDailyRevenue > 0 ? Math.max(12, Math.round((day.amount / maxDailyRevenue) * 100)) : 12;
              const isToday = idx === last7DaysTrend.length - 1;

              return (
                <div key={day.dateStr} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-md pointer-events-none whitespace-nowrap z-10">
                    ₹{day.amount.toLocaleString('en-IN')} ({day.count} orders)
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[42px] bg-stone-100 rounded-t-lg flex items-end overflow-hidden h-40">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday ? 'bg-red-600' : 'bg-red-900 hover:bg-red-800'
                      }`}
                    ></div>
                  </div>

                  {/* Label */}
                  <div className="text-[11px] font-bold text-stone-600 mt-2 text-center">
                    {day.label}
                    {isToday && <span className="block text-[9px] text-red-600 font-black">Today</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 mt-3 pt-2">
            <span>Chart values based on verified database payment timestamps</span>
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-xs inline-block"></span>
              <span>Today</span>
              <span className="w-2.5 h-2.5 bg-red-900 rounded-xs inline-block ml-2"></span>
              <span>Previous Days</span>
            </span>
          </div>
        </div>

        {/* Top Subjects & Category Performance */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 mb-1">Top Subject Sales</h3>
            <p className="text-xs text-stone-500 mb-4">Highest revenue generating study materials</p>

            <div className="space-y-3">
              {subjectSalesList.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">No subject sales recorded yet.</div>
              ) : (
                subjectSalesList.slice(0, 5).map((item) => {
                  const percent = totalLifetimeRevenue > 0 ? Math.round((item.revenue / totalLifetimeRevenue) * 100) : 0;
                  return (
                    <div key={item.subject} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800 truncate max-w-[150px]">{item.subject}</span>
                        <span className="font-black text-stone-900">₹{item.revenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="bg-red-600 h-full rounded-full transition-all duration-300"
                        ></div>
                      </div>
                      <div className="text-[10px] text-stone-400 flex justify-between">
                        <span>{item.count} copies sold</span>
                        <span>{percent}% of revenue</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={() => onNavigateToTab('reports')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1"
            >
              <span>View Full Reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-stone-400">{products.length} catalog items</span>
          </div>
        </div>
      </div>

      {/* Row 4: New Signups Breakdown (Today, 7D, 30D) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900">Student Acquisition Velocity</h3>
            <p className="text-xs text-stone-500">Track registration trends across time periods</p>
          </div>
          <button
            onClick={() => onNavigateToTab('students')}
            className="text-xs font-bold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 w-fit"
          >
            <span>Manage User Directory</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-xs font-bold text-stone-500 uppercase">Today's Signups</div>
            <div className="text-2xl font-black text-stone-900 mt-1">+{todaySignups}</div>
            <div className="text-[11px] text-stone-400 mt-1">Accounts registered since midnight</div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-xs font-bold text-stone-500 uppercase">Last 7 Days</div>
            <div className="text-2xl font-black text-blue-700 mt-1">+{last7DaysSignups}</div>
            <div className="text-[11px] text-stone-400 mt-1">Active student onboarding weekly</div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-xs font-bold text-stone-500 uppercase">Last 30 Days</div>
            <div className="text-2xl font-black text-emerald-800 mt-1">+{last30DaysSignups}</div>
            <div className="text-[11px] text-stone-400 mt-1">Monthly registration total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

function pendingOrdersCount(orders: Order[]): number {
  return orders.filter((o) => o.status === 'pending').length;
}
