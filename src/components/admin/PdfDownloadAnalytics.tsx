import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Filter,
  Calendar,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  X,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Smartphone,
  Laptop
} from 'lucide-react';
import { auth, db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

interface PdfItemStat {
  id: string;
  name: string;
  count: number;
}

interface ProductAnalyticsItem {
  productId: string;
  productTitle: string;
  isFree: boolean;
  freeCount: number;
  paidCount: number;
  totalCount: number;
  lastDownloadedAt: string;
  pdfList: PdfItemStat[];
}

interface DownloadAnalyticsSummary {
  totalDownloads: number;
  freeDownloads: number;
  paidDownloads: number;
  totalRegisteredStudents: number;
  uniqueDownloaders: number;
  mostDownloaded: { title: string; count: number } | null;
  leastDownloaded: { title: string; count: number } | null;
}

interface RecentDownloadEvent {
  id: string;
  eventId: string;
  productId: string;
  productTitle: string;
  pdfId: string;
  pdfName: string;
  userId: string;
  userEmail: string;
  userName: string;
  isFree: boolean;
  downloadedAt: string;
  device: string;
}

export const PdfDownloadAnalytics: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<DownloadAnalyticsSummary>({
    totalDownloads: 0,
    freeDownloads: 0,
    paidDownloads: 0,
    totalRegisteredStudents: 0,
    uniqueDownloaders: 0,
    mostDownloaded: null,
    leastDownloaded: null
  });

  const [products, setProducts] = useState<ProductAnalyticsItem[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentDownloadEvent[]>([]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Drilldown modal
  const [selectedProduct, setSelectedProduct] = useState<ProductAnalyticsItem | null>(null);

  const fetchAnalytics = async () => {
    try {
      setError(null);

      // Strategy 1: Direct client-side Firestore query using the admin's active authenticated session
      try {
        const [prodSnap, usersSnap, eventsSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'users')).catch(() => ({ size: 0, forEach: () => {} } as any)),
          getDocs(collection(db, 'download_events')).catch(() => ({ size: 0, forEach: () => {} } as any))
        ]);

        const productsMap = new Map<string, any>();
        prodSnap.forEach((d) => productsMap.set(d.id, { id: d.id, ...d.data() }));

        const totalRegisteredStudents = usersSnap?.size || 0;
        const events: any[] = [];
        const uniqueUserSet = new Set<string>();
        let freeDownloads = 0;
        let paidDownloads = 0;

        const productCountMap = new Map<string, {
          productId: string;
          productTitle: string;
          isFree: boolean;
          freeCount: number;
          paidCount: number;
          totalCount: number;
          lastDownloadedAt: string;
          pdfBreakdown: Record<string, { pdfName: string; count: number }>;
        }>();

        productsMap.forEach((p, pId) => {
          const isFree = Number(p.sellingPricePaise || 0) === 0;
          productCountMap.set(pId, {
            productId: pId,
            productTitle: p.title || 'Untitled Material',
            isFree,
            freeCount: 0,
            paidCount: 0,
            totalCount: 0,
            lastDownloadedAt: p.lastDownloadedAt || '',
            pdfBreakdown: {}
          });
        });

        eventsSnap.forEach((docSnap: any) => {
          const ev = docSnap.data();
          events.push({ id: docSnap.id, ...ev });
          if (ev.userId) uniqueUserSet.add(ev.userId);

          if (ev.isFree) {
            freeDownloads++;
          } else {
            paidDownloads++;
          }

          const pId = ev.productId;
          let pStats = productCountMap.get(pId);
          if (!pStats) {
            pStats = {
              productId: pId,
              productTitle: ev.productTitle || 'Unknown Product',
              isFree: Boolean(ev.isFree),
              freeCount: 0,
              paidCount: 0,
              totalCount: 0,
              lastDownloadedAt: ev.downloadedAt || '',
              pdfBreakdown: {}
            };
            productCountMap.set(pId, pStats);
          }

          if (ev.isFree) {
            pStats.freeCount++;
          } else {
            pStats.paidCount++;
          }
          pStats.totalCount++;

          if (ev.downloadedAt && (!pStats.lastDownloadedAt || ev.downloadedAt > pStats.lastDownloadedAt)) {
            pStats.lastDownloadedAt = ev.downloadedAt;
          }

          const pdfKey = ev.pdfId || ev.pdfName || 'default';
          if (!pStats.pdfBreakdown[pdfKey]) {
            pStats.pdfBreakdown[pdfKey] = {
              pdfName: ev.pdfName || 'Main PDF',
              count: 0
            };
          }
          pStats.pdfBreakdown[pdfKey].count++;
        });

        const totalDownloads = eventsSnap.size || 0;
        const productBreakdown = Array.from(productCountMap.values());
        productBreakdown.sort((a, b) => b.totalCount - a.totalCount);

        const mostDownloaded = productBreakdown.length > 0 && productBreakdown[0].totalCount > 0
          ? { title: productBreakdown[0].productTitle, count: productBreakdown[0].totalCount }
          : null;

        const leastDownloaded = productBreakdown.length > 0
          ? { title: productBreakdown[productBreakdown.length - 1].productTitle, count: productBreakdown[productBreakdown.length - 1].totalCount }
          : null;

        setSummary({
          totalDownloads,
          freeDownloads,
          paidDownloads,
          totalRegisteredStudents,
          uniqueDownloaders: uniqueUserSet.size,
          mostDownloaded,
          leastDownloaded
        });

        setProducts(
          productBreakdown.map((p) => ({
            ...p,
            pdfList: Object.entries(p.pdfBreakdown).map(([k, v]) => ({
              id: k,
              name: v.pdfName,
              count: v.count
            }))
          }))
        );

        setRecentEvents(events.slice(-50).reverse());
        return;
      } catch (clientErr) {
        console.warn('Direct client read encountered issue, falling back to server API:', clientErr);
      }

      // Strategy 2: Fallback to server API
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setError('Authentication required to access analytics.');
        return;
      }

      const res = await fetch('/api/admin/download-analytics', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setSummary(data.summary);
        }
        if (Array.isArray(data.productBreakdown)) {
          setProducts(data.productBreakdown);
        }
        if (Array.isArray(data.recentEvents)) {
          setRecentEvents(data.recentEvents);
        }
      }
    } catch (err: any) {
      console.error('Error fetching download analytics:', err);
      setError(err?.message || 'Failed to load PDF download analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Type filter
      if (typeFilter === 'free' && !p.isFree) return false;
      if (typeFilter === 'paid' && p.isFree) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.productTitle.toLowerCase().includes(q);
        const matchesPdf = p.pdfList.some((pdf) => pdf.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesPdf) return false;
      }

      // Date filter on lastDownloadedAt
      if (dateRange !== 'all' && p.lastDownloadedAt) {
        const downloadDate = new Date(p.lastDownloadedAt);
        const now = new Date();

        if (dateRange === 'today') {
          const isToday =
            downloadDate.getDate() === now.getDate() &&
            downloadDate.getMonth() === now.getMonth() &&
            downloadDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateRange === '7d') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (downloadDate < sevenDaysAgo) return false;
        } else if (dateRange === '30d') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (downloadDate < thirtyDaysAgo) return false;
        } else if (dateRange === 'custom') {
          if (customStartDate && downloadDate < new Date(customStartDate)) return false;
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (downloadDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [products, typeFilter, searchQuery, dateRange, customStartDate, customEndDate]);

  // CSV Export
  const handleExportCsv = () => {
    if (products.length === 0) return;

    const headers = [
      'Product ID',
      'Product Title',
      'Type',
      'Total Downloads',
      'Free Downloads',
      'Paid Downloads',
      'Last Downloaded At',
      'Individual PDF Breakdown'
    ];

    const rows = filteredProducts.map((p) => {
      const pdfBreakdownStr = p.pdfList.map((pdf) => `${pdf.name} (${pdf.count})`).join('; ');
      return [
        `"${p.productId}"`,
        `"${p.productTitle.replace(/"/g, '""')}"`,
        p.isFree ? 'Free' : 'Paid',
        p.totalCount,
        p.freeCount,
        p.paidCount,
        p.lastDownloadedAt ? `"${new Date(p.lastDownloadedAt).toLocaleString('en-IN')}"` : '"Never"',
        `"${pdfBreakdownStr.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MKR_Academy_PDF_Downloads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered recent events for drilldown
  const drilldownEvents = useMemo(() => {
    if (!selectedProduct) return [];
    return recentEvents.filter((ev) => ev.productId === selectedProduct.productId);
  }, [selectedProduct, recentEvents]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto mb-3" />
        <p className="text-stone-600 font-semibold text-sm">Loading PDF download telemetry and analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-red-50 text-red-700 rounded-xl">
              <Download className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">PDF Download Analytics</h2>
            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Track student downloads, free/paid engagement, most popular study materials, and verified download events.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredProducts.length === 0}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Download full analytics as CSV file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Global Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Downloads */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Downloads</span>
            <Download className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{summary.totalDownloads}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Across all notes</div>
        </div>

        {/* Free Downloads */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Free Downloads</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{summary.freeDownloads}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Signed-in students</div>
        </div>

        {/* Paid Downloads */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Paid Downloads</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{summary.paidDownloads}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Verified buyers</div>
        </div>

        {/* Registered Students */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Registered</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{summary.totalRegisteredStudents}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Student profiles</div>
        </div>

        {/* Unique Downloaders */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Unique Users</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{summary.uniqueDownloaders}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Active students</div>
        </div>

        {/* Most Downloaded */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs col-span-2 sm:col-span-1 lg:col-span-1">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Most Popular</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-extrabold text-stone-900 truncate" title={summary.mostDownloaded?.title || 'None'}>
            {summary.mostDownloaded ? summary.mostDownloaded.title : 'None yet'}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
            {summary.mostDownloaded ? `${summary.mostDownloaded.count} downloads` : '0 downloads'}
          </div>
        </div>

        {/* Least Downloaded */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Least Popular</span>
            <TrendingDown className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-base font-extrabold text-stone-700 truncate" title={summary.leastDownloaded?.title || 'None'}>
            {summary.leastDownloaded ? summary.leastDownloaded.title : 'None yet'}
          </div>
          <div className="text-[10px] text-stone-500 font-bold mt-0.5">
            {summary.leastDownloaded ? `${summary.leastDownloaded.count} downloads` : '0 downloads'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product title, chapter name, or subject..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                typeFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Products
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('free')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                typeFilter === 'free' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Free Only
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                typeFilter === 'paid' ? 'bg-red-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Paid Only
            </button>
          </div>

          {/* Date Filter Buttons */}
          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setDateRange('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                dateRange === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                dateRange === 'today' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateRange('7d')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                dateRange === '7d' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30d')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                dateRange === '30d' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('custom')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                dateRange === 'custom' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateRange === 'custom' && (
          <div className="pt-2 border-t border-stone-100 flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-stone-500 font-medium">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 text-xs"
              />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-stone-500 font-medium">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Product-Wise Analytics Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-red-600" />
            <h3 className="font-extrabold text-stone-900 text-sm">Product-Wise Download Statistics</h3>
            <span className="text-stone-400 text-xs font-semibold">({filteredProducts.length} materials)</span>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs">
            No study materials matched the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-4">Study Material / Title</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-center">Total Downloads</th>
                  <th className="py-3 px-3 text-center">Free Downloads</th>
                  <th className="py-3 px-3 text-center">Paid Downloads</th>
                  <th className="py-3 px-3">Last Downloaded</th>
                  <th className="py-3 px-4 text-right">Drilldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                {filteredProducts.map((p) => {
                  const lastDownFormatted = p.lastDownloadedAt
                    ? new Date(p.lastDownloadedAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Never';

                  return (
                    <tr key={p.productId} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{p.productTitle}</div>
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                          ID: {p.productId.slice(0, 16)}... • {p.pdfList.length} PDF{p.pdfList.length === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {p.isFree ? (
                          <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md text-[10px] inline-flex items-center">
                            Free Note
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md text-[10px] inline-flex items-center">
                            Paid Note
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold text-stone-900 text-sm">{p.totalCount}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-emerald-700">{p.freeCount}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-blue-700">{p.paidCount}</span>
                      </td>
                      <td className="py-3 px-3 text-stone-500 text-[11px] whitespace-nowrap">
                        {lastDownFormatted}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(p)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[11px] font-bold inline-flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3 text-stone-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Download Audit Log */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-stone-900 text-sm">Recent Verified Download Events</h3>
            <span className="text-stone-400 text-xs font-semibold">(Audit Trail)</span>
          </div>
        </div>

        {recentEvents.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs">
            No download events recorded yet. When students download free or paid notes, events will appear here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-3">Product / Chapter</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Device</th>
                  <th className="py-2.5 px-4 text-right">Downloaded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {recentEvents.slice(0, 15).map((ev) => (
                  <tr key={ev.id || ev.eventId} className="hover:bg-stone-50/60">
                    <td className="py-2 px-4">
                      <div className="font-bold text-stone-900">{ev.userName || 'Student'}</div>
                      <div className="text-[10px] text-stone-400">{ev.userEmail}</div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-stone-800 truncate max-w-xs">{ev.productTitle}</div>
                      <div className="text-[10px] text-stone-500 truncate max-w-xs">{ev.pdfName}</div>
                    </td>
                    <td className="py-2 px-3">
                      {ev.isFree ? (
                        <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md">
                          Free
                        </span>
                      ) : (
                        <span className="text-blue-700 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded-md">
                          Paid
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-stone-500 text-[11px] flex items-center space-x-1 mt-1">
                      {ev.device?.toLowerCase().includes('android') ? (
                        <Smartphone className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Laptop className="w-3 h-3 text-stone-400" />
                      )}
                      <span>{ev.device || 'Web'}</span>
                    </td>
                    <td className="py-2 px-4 text-right text-stone-500 text-[11px] whitespace-nowrap">
                      {new Date(ev.downloadedAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product-Level Drilldown Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div>
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
                  Product Download Drilldown
                </span>
                <h3 className="text-base font-black text-stone-900 leading-tight">
                  {selectedProduct.productTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Total Downloads</div>
                  <div className="text-xl font-black text-stone-900">{selectedProduct.totalCount}</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                  <div className="text-[10px] text-emerald-700 font-bold uppercase">Free Downloads</div>
                  <div className="text-xl font-black text-emerald-800">{selectedProduct.freeCount}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                  <div className="text-[10px] text-blue-700 font-bold uppercase">Paid Downloads</div>
                  <div className="text-xl font-black text-blue-800">{selectedProduct.paidCount}</div>
                </div>
              </div>

              {/* Individual PDFs in this product */}
              <div className="space-y-2">
                <div className="font-extrabold text-stone-900 flex items-center justify-between">
                  <span>Individual Chapter / PDF Downloads</span>
                  <span className="text-stone-400 text-[10px]">
                    {selectedProduct.pdfList.length} chapter files
                  </span>
                </div>

                {selectedProduct.pdfList.length === 0 ? (
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-center text-stone-500">
                    No individual chapters recorded for this product yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedProduct.pdfList.map((pdf, idx) => (
                      <div
                        key={pdf.id || idx}
                        className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-md bg-red-100 text-red-700 font-bold text-[10px] flex items-center justify-center font-mono">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="font-bold text-stone-800">{pdf.name}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 font-bold text-stone-900">
                          <Download className="w-3.5 h-3.5 text-stone-400" />
                          <span>{pdf.count} downloads</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Events for this product */}
              <div className="space-y-2">
                <div className="font-extrabold text-stone-900">Recent Download Logs for this Product</div>
                {drilldownEvents.length === 0 ? (
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-center text-stone-500">
                    No recent student events logged for this product.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {drilldownEvents.map((ev) => (
                      <div
                        key={ev.id || ev.eventId}
                        className="bg-stone-50 p-2 rounded-xl border border-stone-200 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-stone-900">{ev.userName}</span>{' '}
                          <span className="text-stone-400">({ev.userEmail})</span>
                          <div className="text-[10px] text-stone-500">{ev.pdfName}</div>
                        </div>
                        <div className="text-right text-[10px] text-stone-400">
                          <div>{new Date(ev.downloadedAt).toLocaleString('en-IN')}</div>
                          <span className="font-semibold text-stone-600">{ev.device}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-100 flex justify-end bg-stone-50">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
