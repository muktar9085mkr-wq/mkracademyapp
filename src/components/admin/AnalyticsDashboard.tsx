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
  Calendar,
  RefreshCw,
  Clock,
  BarChart3
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

const DONUT_PALETTE = ['#B91C1C', '#DC2626', '#EA580C', '#D97706', '#292524'];

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
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(6);

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

  // Daily revenue trend for the last 7 days for the chart
  const last7DaysTrend: { dateStr: string; label: string; fullDate: string; amount: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const dayOrders = verifiedPaidOrders.filter((o) => parseOrderDate(o).toDateString() === dateStr);
    const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    last7DaysTrend.push({
      dateStr,
      label: dayName,
      fullDate,
      amount: dayRevenue,
      count: dayOrders.length
    });
  }

  const maxDailyRevenue = Math.max(...last7DaysTrend.map((d) => d.amount), 100);
  const sevenDayTotal = last7DaysTrend.reduce((s, d) => s + d.amount, 0);
  const sevenDayAvg = Math.round(sevenDayTotal / 7);
  const activeDay = last7DaysTrend[selectedDayIdx] || last7DaysTrend[6];

  // SVG Trend Line Path coordinates (viewBox 0 0 700 180)
  const chartW = 700;
  const chartH = 150;
  const padX = 50;
  const padY = 20;
  const stepX = (chartW - padX * 2) / 6;

  const trendPoints = last7DaysTrend.map((d, idx) => {
    const x = padX + idx * stepX;
    const ratio = maxDailyRevenue > 0 ? d.amount / maxDailyRevenue : 0;
    const y = chartH - padY - ratio * (chartH - padY * 2);
    return { x, y, ...d };
  });

  const linePath = trendPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${trendPoints[trendPoints.length - 1].x.toFixed(1)} ${(chartH - padY).toFixed(1)} L ${trendPoints[0].x.toFixed(1)} ${(chartH - padY).toFixed(1)} Z`;

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

  // Build SVG Donut segments for Top 5 subjects
  const topSubjects = subjectSalesList.slice(0, 5);
  const donutRadius = 46;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedOffset = 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header & Timeframe Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-red-700">
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>MKR Academy Live Analytics</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight mt-0.5">
            Platform Performance Overview
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Selected Period Revenue:{' '}
            <strong className="text-stone-900 tabular-nums">₹{filteredRevenue.toLocaleString('en-IN')}</strong>
            {' '}·{' '}
            <span className="tabular-nums">{filteredPaidOrders.length} verified orders</span>
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end flex-wrap gap-2">
          {/* Timeframe Segmented Controls */}
          <div className="flex items-center overflow-x-auto max-w-full rounded-xl bg-stone-100 p-1 border border-stone-200/80 text-xs">
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
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
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
            className="h-9 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors border border-stone-200 flex items-center space-x-1.5 text-xs font-bold shrink-0 cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-red-700' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Row 1: Primary Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Lifetime Revenue */}
        <div className="bg-gradient-to-br from-[#8B0F17] to-[#B91C1C] text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-100">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-[26px] font-extrabold tracking-tight tabular-nums">
              ₹{totalLifetimeRevenue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center space-x-1.5 mt-1.5 text-xs text-red-100">
              <span className="font-bold text-white flex items-center tabular-nums">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ₹{todayRevenue.toLocaleString('en-IN')}
              </span>
              <span>earned today</span>
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:border-red-200 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Monthly Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-[26px] font-extrabold text-stone-900 tracking-tight tabular-nums">
              ₹{monthlyRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-stone-500 mt-1.5">
              {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Total Registered Users */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:border-red-200 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Registered Students</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-[26px] font-extrabold text-stone-900 tracking-tight tabular-nums">
              {students.length.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center space-x-1.5 mt-1.5 text-xs text-stone-500">
              <span className="text-blue-700 font-bold tabular-nums">+{last7DaysSignups} new</span>
              <span>in last 7 days</span>
            </div>
          </div>
        </div>

        {/* Currently Online / Active Users */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:border-red-200 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Active &amp; Online</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl sm:text-[26px] font-extrabold text-emerald-700 tracking-tight tabular-nums">
                {currentlyOnlineCount}
              </div>
              <span className="text-xs font-semibold text-stone-400">online now</span>
            </div>
            <p className="text-xs text-stone-500 mt-1.5 tabular-nums">
              {totalActiveUsers} active student accounts
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Operational Action Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Products Uploaded */}
        <button
          type="button"
          onClick={() => onNavigateToTab('products')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs hover:border-red-300 hover:bg-red-50/15 transition-all text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 truncate">Total Products</span>
            <Package className="w-4 h-4 text-stone-400 group-hover:text-red-700 transition-colors shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1.5 tabular-nums">
            {products.length}
          </div>
          <p className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
            <span className="truncate">Notes &amp; PYQ papers</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-red-700 shrink-0" />
          </p>
        </button>

        {/* Successful Purchases */}
        <button
          type="button"
          onClick={() => onNavigateToTab('orders')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs hover:border-emerald-300 hover:bg-emerald-50/20 transition-all text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 truncate">Paid Orders</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1.5 tabular-nums">
            {totalPurchasesCount}
          </div>
          <p className="text-[11px] text-emerald-700/90 mt-1 flex items-center justify-between">
            <span className="truncate">Delivered to students</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </p>
        </button>

        {/* Failed Transactions */}
        <button
          type="button"
          onClick={() => onNavigateToTab('orders')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs hover:border-rose-300 hover:bg-rose-50/20 transition-all text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 truncate">Failed Payments</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1.5 tabular-nums">
            {failedTransactionsCount}
          </div>
          <p className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
            <span className="truncate">Gateway declines</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-600 shrink-0" />
          </p>
        </button>

        {/* Pending Orders */}
        <button
          type="button"
          onClick={() => onNavigateToTab('orders')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs hover:border-amber-300 hover:bg-amber-50/20 transition-all text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 truncate">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1.5 tabular-nums">
            {pendingOrdersCount(orders)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
            <span className="truncate">Manual review queue</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 shrink-0" />
          </p>
        </button>
      </div>

      {/* Row 3: Interactive Charts & Subject Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* 7-Day Revenue SVG Trend + Interactive Bars */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-red-700 shrink-0" />
                <span>7-Day Revenue &amp; Order Trend</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Tap or hover any day column to inspect verified sales
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs bg-stone-50 px-3 py-2 rounded-xl border border-stone-200/80 shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-400 block">7D Total</span>
                <span className="font-extrabold text-stone-900 tabular-nums">
                  ₹{sevenDayTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="h-6 w-px bg-stone-200" />
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-400 block">Daily Avg</span>
                <span className="font-extrabold text-red-700 tabular-nums">
                  ₹{sevenDayAvg.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Selected Day Summary Strip */}
          {activeDay && (
            <div className="mb-3 px-3.5 py-2 rounded-xl bg-red-50/70 border border-red-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-red-900">
                  {activeDay.label}, {activeDay.fullDate}
                </span>
                <span className="text-red-400">·</span>
                <span className="text-red-800 font-medium tabular-nums">
                  {activeDay.count} {activeDay.count === 1 ? 'order' : 'orders'}
                </span>
              </div>
              <span className="font-extrabold text-red-800 tabular-nums">
                ₹{activeDay.amount.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* SVG Smooth Area Trend + Bar Columns */}
          <div className="w-full pt-2">
            <div className="relative h-44 w-full">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
                aria-label="7 day revenue trend chart"
              >
                <defs>
                  <linearGradient id="mkrRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B91C1C" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#B91C1C" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                {[0.25, 0.5, 0.75, 1].map((frac) => {
                  const yPos = chartH - padY - frac * (chartH - padY * 2);
                  return (
                    <line
                      key={frac}
                      x1={padX - 20}
                      y1={yPos}
                      x2={chartW - padX + 20}
                      y2={yPos}
                      stroke="#E7E5E4"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Area Gradient Fill */}
                <path d={areaPath} fill="url(#mkrRevenueGrad)" />

                {/* Interactive Bar Columns behind points */}
                {trendPoints.map((pt, idx) => {
                  const barH = Math.max(8, chartH - padY - pt.y);
                  const isSelected = idx === selectedDayIdx;
                  return (
                    <rect
                      key={pt.dateStr}
                      x={pt.x - 16}
                      y={chartH - padY - barH}
                      width="32"
                      height={barH}
                      rx="6"
                      fill={isSelected ? '#B91C1C' : '#FCA5A5'}
                      fillOpacity={isSelected ? 0.92 : 0.45}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setSelectedDayIdx(idx)}
                      onClick={() => setSelectedDayIdx(idx)}
                    />
                  );
                })}

                {/* Trend Polyline */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#991B1B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Point Nodes */}
                {trendPoints.map((pt, idx) => {
                  const isSelected = idx === selectedDayIdx;
                  return (
                    <circle
                      key={`dot-${pt.dateStr}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6 : 4}
                      fill={isSelected ? '#FFFFFF' : '#B91C1C'}
                      stroke="#991B1B"
                      strokeWidth={isSelected ? 3 : 2}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setSelectedDayIdx(idx)}
                      onClick={() => setSelectedDayIdx(idx)}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Day Labels Row (Touch-Friendly Selector) */}
            <div className="grid grid-cols-7 gap-1 pt-2 border-t border-stone-100 mt-1">
              {last7DaysTrend.map((day, idx) => {
                const isSelected = idx === selectedDayIdx;
                const isToday = idx === last7DaysTrend.length - 1;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`py-1.5 rounded-lg text-center transition-colors cursor-pointer ${
                      isSelected ? 'bg-red-50 text-red-800' : 'text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    <span className="block text-[11px] font-bold">{day.label}</span>
                    <span className="block text-[9px] font-medium opacity-75">
                      {isToday ? 'Today' : day.fullDate.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Subjects Revenue Share (Donut Ring + Bars) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900">Top Subject Sales</h3>
            <p className="text-xs text-stone-500 mt-0.5">Revenue distribution by subject</p>

            {/* Donut Visualization */}
            {topSubjects.length > 0 && totalLifetimeRevenue > 0 && (
              <div className="flex items-center justify-center my-4">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="none"
                      stroke="#F5F5F4"
                      strokeWidth="14"
                    />
                    {topSubjects.map((item, idx) => {
                      const pct = item.revenue / totalLifetimeRevenue;
                      const dash = pct * donutCircumference;
                      const offset = accumulatedOffset;
                      accumulatedOffset += dash;
                      return (
                        <circle
                          key={item.subject}
                          cx="60"
                          cy="60"
                          r={donutRadius}
                          fill="none"
                          stroke={DONUT_PALETTE[idx % DONUT_PALETTE.length]}
                          strokeWidth="14"
                          strokeDasharray={`${dash} ${donutCircumference}`}
                          strokeDashoffset={-offset}
                          strokeLinecap="butt"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[9px] font-bold uppercase text-stone-400">Subjects</span>
                    <span className="text-sm font-extrabold text-stone-900 tabular-nums">
                      {subjectSalesList.length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Subject Bars */}
            <div className="space-y-3 mt-3">
              {subjectSalesList.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No subject sales recorded yet.
                </div>
              ) : (
                topSubjects.map((item, idx) => {
                  const percent =
                    totalLifetimeRevenue > 0
                      ? Math.round((item.revenue / totalLifetimeRevenue) * 100)
                      : 0;
                  const color = DONUT_PALETTE[idx % DONUT_PALETTE.length];
                  return (
                    <div key={item.subject} className="space-y-1">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-bold text-stone-800 truncate">{item.subject}</span>
                        </div>
                        <span className="font-extrabold text-stone-900 tabular-nums shrink-0">
                          ₹{item.revenue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%`, backgroundColor: color }}
                          className="h-full rounded-full transition-all duration-300"
                        />
                      </div>
                      <div className="text-[10px] text-stone-400 flex justify-between tabular-nums">
                        <span>{item.count} copies sold</span>
                        <span>{percent}% share</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigateToTab('reports')}
              className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>View Full Reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-stone-400 tabular-nums">{products.length} catalog items</span>
          </div>
        </div>
      </div>

      {/* Row 4: Student Acquisition Velocity */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900">Student Acquisition Velocity</h3>
            <p className="text-xs text-stone-500">New student signups across reporting windows</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('students')}
            className="text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1 w-fit cursor-pointer"
          >
            <span>Manage User Directory</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Today&apos;s Signups
            </div>
            <div className="text-2xl font-extrabold text-stone-900 mt-1 tabular-nums">
              +{todaySignups}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">Accounts registered since midnight</div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Last 7 Days
            </div>
            <div className="text-2xl font-extrabold text-blue-700 mt-1 tabular-nums">
              +{last7DaysSignups}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">Weekly student onboarding</div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Last 30 Days
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
              +{last30DaysSignups}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">Monthly registration total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

function pendingOrdersCount(orders: Order[]): number {
  return orders.filter((o) => o.status === 'pending').length;
}
