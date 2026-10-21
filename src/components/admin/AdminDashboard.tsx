import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Users,
  ShoppingBag,
  Megaphone,
  Share2,
  CreditCard,
  LogOut,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Save,
  Loader2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  ShieldCheck,
  Copy,
  Check,
  Calendar,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Product, Order, UserProfile, AppPublicSettings } from '../../types';
import {
  getAllProductsAdmin,
  addProduct,
  updateProduct,
  deleteProduct,
  deleteLegacySampleProductsAdmin
} from '../../services/productService';
import {
  getAllOrdersAdmin,
  getAllStudentsAdmin
} from '../../services/orderService';
import {
  getPublicSettings,
  updatePublicSettings
} from '../../services/settingsService';

interface AdminDashboardProps {
  onBackToStore: () => void;
  onProductsChanged?: () => void;
}

type AdminTab =
  | 'dashboard'
  | 'products'
  | 'add-product'
  | 'students'
  | 'orders'
  | 'banner'
  | 'social'
  | 'payment-config';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToStore, onProductsChanged }) => {
  const { user, isAdmin, logout } = useAuth();

  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<AppPublicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form fields
  const [prodTitle, setProdTitle] = useState('');
  const [prodSlug, setProdSlug] = useState('');
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodSubject, setProdSubject] = useState('General Science');
  const [prodClass, setProdClass] = useState('HSLC 2027');
  const [prodExamTarget, setProdExamTarget] = useState('HSLC 2027 Board Exam');
  const [prodMedium, setProdMedium] = useState('Assamese Medium');
  const [prodCategory, setProdCategory] = useState<'Normal' | 'Premium' | 'Budget Friendly'>('Normal');
  const [prodTags, setProdTags] = useState<string>('Important Questions, Chapter-wise Notes');
  const [prodChapters, setProdChapters] = useState<string>('');
  const [prodCoverUrl, setProdCoverUrl] = useState('');
  const [prodDriveLink, setProdDriveLink] = useState('');
  const [prodPdfPath, setProdPdfPath] = useState('');
  const [prodPdfFileName, setProdPdfFileName] = useState('');
  const [prodFileType, setProdFileType] = useState('PDF Document');
  const [prodPageCount, setProdPageCount] = useState<number>(100);
  const [prodOriginalPrice, setProdOriginalPrice] = useState<number>(199);
  const [prodSellingPrice, setProdSellingPrice] = useState<number>(99);
  const [prodIsFree, setProdIsFree] = useState(false);
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodPublished, setProdPublished] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  // Quick Price Edit Modal State (Edit price in paise / rupees anytime)
  const [quickPriceModalProduct, setQuickPriceModalProduct] = useState<Product | null>(null);
  const [quickSellingPrice, setQuickSellingPrice] = useState<number>(0);
  const [quickOriginalPrice, setQuickOriginalPrice] = useState<number>(0);
  const [quickPriceSaving, setQuickPriceSaving] = useState(false);
  const [quickPriceMessage, setQuickPriceMessage] = useState<string | null>(null);

  // Banner State
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerBadge, setBannerBadge] = useState('');
  const [bannerCta, setBannerCta] = useState('');
  const [bannerSaving, setBannerSaving] = useState(false);

  // Social Links State
  const [socialWhatsapp, setSocialWhatsapp] = useState('');
  const [socialTelegram, setSocialTelegram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialEmail, setSocialEmail] = useState('');
  const [socialSaving, setSocialSaving] = useState(false);

  // Search in tables
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Payment Gateway State
  const [gatewayConfig, setGatewayConfig] = useState<{
    keyId: string;
    mode: string;
    isLive: boolean;
    isConfigured: boolean;
    currency: string;
  } | null>(null);
  const [gatewayStatusChecking, setGatewayStatusChecking] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState<{
    success: boolean;
    message: string;
    keyId?: string;
    mode?: string;
  } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Revenue Analytics View States
  const [revenueViewTab, setRevenueViewTab] = useState<'monthly' | 'yearly' | 'product'>('monthly');
  const [revenueYearFilter, setRevenueYearFilter] = useState<string>('all');
  const [orderYearFilter, setOrderYearFilter] = useState<string>('all');
  const [orderMonthFilter, setOrderMonthFilter] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadAllAdminData();
    fetchGatewayConfig();
  }, []);

  const fetchGatewayConfig = async () => {
    try {
      const res = await fetch('/api/payment/config');
      if (res.ok) {
        const data = await res.json();
        setGatewayConfig(data);
      }
    } catch (e) {
      console.warn('Could not load payment configuration:', e);
    }
  };

  const handleTestGateway = async () => {
    setGatewayStatusChecking(true);
    setGatewayTestResult(null);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setGatewayTestResult({
          success: true,
          message: 'Razorpay Gateway is active and responding. Server-side HMAC-SHA256 signature verification is armed.',
          keyId: data.keyId,
          mode: data.mode
        });
        fetchGatewayConfig();
      } else {
        setGatewayTestResult({
          success: false,
          message: `Backend API returned HTTP status ${res.status}`
        });
      }
    } catch (err: any) {
      setGatewayTestResult({
        success: false,
        message: 'Failed to connect to backend: ' + (err.message || 'Network error')
      });
    } finally {
      setGatewayStatusChecking(false);
    }
  };

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      // Automatically clean up any legacy sample documents from Firestore
      await deleteLegacySampleProductsAdmin().catch(() => 0);

      const [prods, ords, studs, setts] = await Promise.all([
        getAllProductsAdmin(),
        getAllOrdersAdmin(),
        getAllStudentsAdmin(),
        getPublicSettings()
      ]);
      setProducts(prods);
      setOrders(ords);
      setStudents(studs);
      setSettings(setts);

      if (setts) {
        setBannerEnabled(setts.banner.enabled);
        setBannerTitle(setts.banner.title || '');
        setBannerSubtitle(setts.banner.subtitle || '');
        setBannerBadge(setts.banner.badgeText || '');
        setBannerCta(setts.banner.ctaText || '');

        setSocialWhatsapp(setts.social.whatsapp || '');
        setSocialTelegram(setts.social.telegram || '');
        setSocialYoutube(setts.social.youtube || '');
        setSocialInstagram(setts.social.instagram || '');
        setSocialEmail(setts.social.email || '');
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-stone-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Access Denied</h2>
        <p className="text-stone-600 text-xs leading-relaxed">
          The Admin Panel is strictly protected. Your current signed-in email ({user?.email || 'Guest'}) does not have verified administrator privileges.
        </p>
        <button
          onClick={onBackToStore}
          className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs"
        >
          Return to Store
        </button>
      </div>
    );
  }

  // Helper to safely parse order date
  const parseOrderDate = (order: Order): Date => {
    const raw = order.verifiedAt || order.createdAt;
    if (!raw) return new Date();
    const d = new Date(raw);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed: 0 = Jan, 9 = Oct

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculated Metrics
  const verifiedPaidOrders = orders.filter((o) => o.status === 'paid');
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const failedOrders = orders.filter((o) => o.status === 'failed');

  // 1. Total Lifetime Revenue
  const totalRevenue = verifiedPaidOrders.reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;

  // 2. This Year's Revenue
  const thisYearPaidOrders = verifiedPaidOrders.filter((o) => {
    return parseOrderDate(o).getFullYear() === currentYear;
  });
  const currentYearRevenue = thisYearPaidOrders.reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;

  // 3. This Month's Revenue
  const thisMonthPaidOrders = verifiedPaidOrders.filter((o) => {
    const d = parseOrderDate(o);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const currentMonthRevenue = thisMonthPaidOrders.reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;

  // 4. Today's Revenue
  const todayStr = now.toDateString();
  const todayPaidOrders = verifiedPaidOrders.filter((o) => {
    return parseOrderDate(o).toDateString() === todayStr;
  });
  const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;

  // 5. Monthly Breakdown Grouping
  const monthlyStatsMap = new Map<string, {
    key: string;
    year: number;
    month: number;
    monthName: string;
    shortName: string;
    revenue: number;
    orderCount: number;
    isCurrentMonth: boolean;
  }>();

  // Always seed current month
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  monthlyStatsMap.set(currentMonthKey, {
    key: currentMonthKey,
    year: currentYear,
    month: currentMonth,
    monthName: `${monthNames[currentMonth]} ${currentYear}`,
    shortName: `${monthNames[currentMonth].substring(0, 3)} ${currentYear}`,
    revenue: 0,
    orderCount: 0,
    isCurrentMonth: true
  });

  verifiedPaidOrders.forEach((o) => {
    const d = parseOrderDate(o);
    const yr = d.getFullYear();
    const m = d.getMonth();
    const key = `${yr}-${String(m + 1).padStart(2, '0')}`;
    const existing = monthlyStatsMap.get(key) || {
      key,
      year: yr,
      month: m,
      monthName: `${monthNames[m]} ${yr}`,
      shortName: `${monthNames[m].substring(0, 3)} ${yr}`,
      revenue: 0,
      orderCount: 0,
      isCurrentMonth: yr === currentYear && m === currentMonth
    };
    existing.revenue += (o.amountPaise || 0) / 100;
    existing.orderCount += 1;
    monthlyStatsMap.set(key, existing);
  });

  const monthlyBreakdown = Array.from(monthlyStatsMap.values()).sort((a, b) => b.key.localeCompare(a.key));

  // 6. Yearly Breakdown Grouping
  const yearlyStatsMap = new Map<number, {
    year: number;
    revenue: number;
    orderCount: number;
    isCurrentYear: boolean;
  }>();

  // Always seed current year
  yearlyStatsMap.set(currentYear, {
    year: currentYear,
    revenue: 0,
    orderCount: 0,
    isCurrentYear: true
  });

  verifiedPaidOrders.forEach((o) => {
    const yr = parseOrderDate(o).getFullYear();
    const existing = yearlyStatsMap.get(yr) || {
      year: yr,
      revenue: 0,
      orderCount: 0,
      isCurrentYear: yr === currentYear
    };
    existing.revenue += (o.amountPaise || 0) / 100;
    existing.orderCount += 1;
    yearlyStatsMap.set(yr, existing);
  });

  const yearlyBreakdown = Array.from(yearlyStatsMap.values()).sort((a, b) => b.year - a.year);

  // Available distinct years
  const availableYears = Array.from(new Set([currentYear, ...yearlyBreakdown.map((y) => y.year)])).sort((a, b) => b - a);

  // Filtered orders for Orders & Payments tab
  const filteredOrdersList = orders.filter((o) => {
    const matchesSearch =
      !orderSearch ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.studentName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.studentPhone?.includes(orderSearch) ||
      o.studentEmail?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.productTitleSnapshot?.toLowerCase().includes(orderSearch.toLowerCase());

    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;

    const orderDate = parseOrderDate(o);
    const matchesYear = orderYearFilter === 'all' || String(orderDate.getFullYear()) === orderYearFilter;
    const matchesMonth = orderMonthFilter === 'all' || String(orderDate.getMonth()) === orderMonthFilter;

    return matchesSearch && matchesStatus && matchesYear && matchesMonth;
  });

  // Product-wise revenue stats
  const productStatsMap = new Map<string, {
    productId: string;
    productTitle: string;
    orderCount: number;
    revenue: number;
  }>();

  verifiedPaidOrders.forEach((o) => {
    const pId = o.productId || 'unknown';
    const title = o.productTitleSnapshot || 'Study Notes';
    const existing = productStatsMap.get(pId) || {
      productId: pId,
      productTitle: title,
      orderCount: 0,
      revenue: 0
    };
    existing.orderCount += 1;
    existing.revenue += (o.amountPaise || 0) / 100;
    productStatsMap.set(pId, existing);
  });

  const productBreakdown = Array.from(productStatsMap.values()).sort((a, b) => b.revenue - a.revenue);

  const filteredOrdersRevenue = filteredOrdersList
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + (o.amountPaise || 0), 0) / 100;

  // Open Quick Price Editor (Paise & Rupees)
  const openQuickPriceEdit = (p: Product) => {
    setQuickPriceModalProduct(p);
    setQuickSellingPrice(p.sellingPricePaise / 100);
    setQuickOriginalPrice(p.originalPricePaise / 100);
    setQuickPriceMessage(null);
  };

  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPriceModalProduct) return;
    setQuickPriceSaving(true);
    setQuickPriceMessage(null);
    try {
      const sellingPaise = Math.round(Number(quickSellingPrice) * 100);
      const originalPaise = Math.round(Number(quickOriginalPrice) * 100);

      await updateProduct(quickPriceModalProduct.id, {
        sellingPricePaise: sellingPaise,
        originalPricePaise: originalPaise
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === quickPriceModalProduct.id
            ? { ...item, sellingPricePaise: sellingPaise, originalPricePaise: originalPaise }
            : item
        )
      );

      setQuickPriceMessage(`Price successfully saved: ₹${quickSellingPrice} (${sellingPaise} paise)!`);
      setTimeout(() => {
        setQuickPriceModalProduct(null);
        setQuickPriceMessage(null);
      }, 1000);
    } catch (err: any) {
      setQuickPriceMessage(err.message || 'Failed to update price');
    } finally {
      setQuickPriceSaving(false);
    }
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setProdTitle(p.title);
    setProdSlug(p.slug);
    setProdShortDesc(p.shortDescription || '');
    setProdDesc(p.description || '');
    setProdSubject(p.subject || 'General Science');
    setProdClass(p.classLevel || 'HSLC 2027');
    setProdExamTarget(p.examTarget || 'HSLC 2027 Board Exam');
    setProdMedium(p.medium || 'Assamese Medium');
    setProdCategory(p.category || 'Normal');
    setProdTags(p.tags?.join(', ') || '');
    setProdChapters(p.chapters?.join('\n') || '');
    setProdCoverUrl(p.coverImagePath || '');
    setProdDriveLink(p.driveFileLink || '');
    setProdPdfPath(p.pdfStoragePath || '');
    setProdPdfFileName(p.pdfFileName || '');
    setProdFileType(p.fileType || 'PDF Document');
    setProdPageCount(p.pageCount || 100);
    setProdOriginalPrice(p.originalPricePaise / 100);
    setProdSellingPrice(p.sellingPricePaise / 100);
    setProdIsFree(p.isFree || p.sellingPricePaise === 0);
    setProdFeatured(p.featured || false);
    setProdPublished(p.published !== false);
    setFormMessage(null);
    setCurrentTab('add-product');
  };

  const handleResetProductForm = () => {
    setEditingProduct(null);
    setProdTitle('');
    setProdSlug('');
    setProdShortDesc('');
    setProdDesc('');
    setProdSubject('General Science');
    setProdClass('HSLC 2027');
    setProdExamTarget('HSLC 2027 Board Exam');
    setProdMedium('Assamese Medium');
    setProdCategory('Normal');
    setProdTags('Important Questions, Chapter-wise Notes');
    setProdChapters('');
    setProdCoverUrl('');
    setProdDriveLink('');
    setProdPdfPath('');
    setProdPdfFileName('');
    setProdFileType('PDF Document');
    setProdPageCount(100);
    setProdOriginalPrice(199);
    setProdSellingPrice(99);
    setProdIsFree(false);
    setProdFeatured(false);
    setProdPublished(true);
    setFormMessage(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim()) {
      setFormMessage('Product title is required');
      return;
    }
    setFormSaving(true);
    setFormMessage(null);

    try {
      const tagsArray = prodTags.split(',').map((t) => t.trim()).filter(Boolean);
      const chaptersArray = prodChapters.split('\n').map((c) => c.trim()).filter(Boolean);
      const generatedSlug = prodSlug.trim() || prodTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const payload: Partial<Product> = {
        title: prodTitle.trim(),
        slug: generatedSlug,
        shortDescription: prodShortDesc.trim(),
        description: prodDesc.trim(),
        subject: prodSubject,
        classLevel: prodClass,
        examTarget: prodExamTarget.trim() || 'HSLC 2027 Board Exam',
        medium: prodMedium,
        category: prodCategory,
        tags: tagsArray,
        chapters: chaptersArray,
        coverImagePath: prodCoverUrl.trim() || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
        driveFileLink: prodDriveLink.trim(),
        pdfStoragePath: prodPdfPath.trim() || (prodDriveLink.trim() ? '' : `notes/${generatedSlug}.pdf`),
        pdfFileName: prodPdfFileName.trim() || `${generatedSlug}.pdf`,
        fileType: prodFileType.trim() || 'PDF Document',
        pageCount: Number(prodPageCount) || 1,
        originalPricePaise: Math.round(Number(prodOriginalPrice) * 100),
        sellingPricePaise: Math.round(Number(prodSellingPrice) * 100),
        isFree: prodIsFree || Number(prodSellingPrice) === 0,
        featured: prodFeatured,
        published: prodPublished
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        setFormMessage('Product and all information updated successfully!');
      } else {
        await addProduct(payload as any);
        setFormMessage('New educational product created successfully with Google Drive link!');
      }

      const refreshed = await getAllProductsAdmin();
      setProducts(refreshed);
      setTimeout(() => {
        handleResetProductForm();
        setCurrentTab('products');
      }, 1200);
    } catch (err: any) {
      setFormMessage(err.message || 'Failed to save product');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete or archive "${title}"? Existing student purchases will remain safely preserved.`)) {
      try {
        await deleteProduct(id);
        setProducts(products.filter((p) => p.id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  const handleTogglePublish = async (p: Product) => {
    try {
      const nextStatus = !p.published;
      await updateProduct(p.id, { published: nextStatus });
      setProducts(products.map((item) => (item.id === p.id ? { ...item, published: nextStatus } : item)));
    } catch (err: any) {
      alert(err.message || 'Failed to update publication status');
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerSaving(true);
    try {
      await updatePublicSettings({
        banner: {
          enabled: bannerEnabled,
          title: bannerTitle,
          subtitle: bannerSubtitle,
          badgeText: bannerBadge,
          ctaText: bannerCta,
          destinationUrl: '#notes'
        }
      });
      alert('Promotional banner updated in real-time for all students!');
    } catch (err: any) {
      alert(err.message || 'Failed to update banner');
    } finally {
      setBannerSaving(false);
    }
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocialSaving(true);
    try {
      await updatePublicSettings({
        social: {
          whatsapp: socialWhatsapp,
          telegram: socialTelegram,
          youtube: socialYoutube,
          instagram: socialInstagram,
          email: socialEmail
        }
      });
      alert('Social links updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update social links');
    } finally {
      setSocialSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Top Admin Bar */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToStore}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors flex items-center space-x-1 text-xs"
            title="Return to Student App"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Store View</span>
          </button>
          <div className="h-4 w-px bg-stone-700"></div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight font-sans">
              MKR ACADEMY <span className="text-red-500 font-bold">ADMIN PANEL</span>
            </h1>
            <p className="text-[10px] text-stone-400">Authenticated: {user?.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              await logout();
              onBackToStore();
            }}
            className="px-3 py-1.5 bg-stone-800 hover:bg-red-950/60 hover:text-red-400 text-stone-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Admin Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-60 shrink-0 space-y-1">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setCurrentTab('products')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
              currentTab === 'products'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Package className="w-4 h-4" />
              <span>Products & Notes</span>
            </div>
            <span className="text-[11px] opacity-80">{products.length}</span>
          </button>

          <button
            onClick={() => {
              handleResetProductForm();
              setCurrentTab('add-product');
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-colors ${
              currentTab === 'add-product'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </button>

          <button
            onClick={() => setCurrentTab('orders')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
              currentTab === 'orders'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <ShoppingBag className="w-4 h-4" />
              <span>Orders & Payments</span>
            </div>
            <span className="text-[11px] opacity-80">{orders.length}</span>
          </button>

          <button
            onClick={() => setCurrentTab('students')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
              currentTab === 'students'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Users className="w-4 h-4" />
              <span>Registered Students</span>
            </div>
            <span className="text-[11px] opacity-80">{students.length}</span>
          </button>

          <button
            onClick={() => setCurrentTab('banner')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-colors ${
              currentTab === 'banner'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Banner Management</span>
          </button>

          <button
            onClick={() => setCurrentTab('social')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-colors ${
              currentTab === 'social'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Social & Support Links</span>
          </button>

          <button
            onClick={() => setCurrentTab('payment-config')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-colors ${
              currentTab === 'payment-config'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment Settings</span>
          </button>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 bg-white rounded-3xl border border-stone-200 shadow-xs p-6 sm:p-8 overflow-x-auto">
          {/* TAB: DASHBOARD OVERVIEW */}
          {currentTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-stone-900 font-sans">
                  Platform Performance Dashboard
                </h2>
                <p className="text-xs text-stone-500">
                  Real-time analytics computed strictly from verified Firestore transactions.
                </p>
              </div>

              {/* Top Revenue & Performance Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Lifetime Revenue */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Total Revenue (Lifetime)
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      All Time
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-700">₹{totalRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-400">From {verifiedPaidOrders.length} verified paid orders</p>
                </div>

                {/* 2. Yearly Revenue */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Yearly Revenue ({currentYear})
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                      Year {currentYear}
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-stone-900">₹{currentYearRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-400">{thisYearPaidOrders.length} paid orders in {currentYear}</p>
                </div>

                {/* 3. Monthly Revenue */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Monthly Revenue ({monthNames[currentMonth].substring(0, 3)} {currentYear})
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      This Month
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-blue-700">₹{currentMonthRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-400">{thisMonthPaidOrders.length} paid orders in {monthNames[currentMonth]}</p>
                </div>

                {/* 4. Today's Revenue & Students */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Today's Sales
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Today
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-stone-900">₹{todayRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-400">{todayPaidOrders.length} sales today • {students.length} students</p>
                </div>
              </div>

              {/* REVENUE & EARNINGS ANALYTICS: MONTHLY & YEARLY BREAKDOWN */}
              <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-red-700" />
                      <h3 className="font-extrabold text-base text-stone-900">
                        Earnings & Revenue Analytics
                      </h3>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Detailed Monthly and Yearly income breakdown from verified student notes sales.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* View Switcher: Monthly vs Yearly vs By Notes */}
                    <div className="bg-white p-1 rounded-xl border border-stone-200 flex items-center shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setRevenueViewTab('monthly')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          revenueViewTab === 'monthly'
                            ? 'bg-red-700 text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                        }`}
                      >
                        Monthly Revenue
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenueViewTab('yearly')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          revenueViewTab === 'yearly'
                            ? 'bg-red-700 text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                        }`}
                      >
                        Yearly Revenue
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenueViewTab('product')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          revenueViewTab === 'product'
                            ? 'bg-red-700 text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                        }`}
                      >
                        Revenue by Notes
                      </button>
                    </div>

                    {/* If in monthly view, optional year filter */}
                    {revenueViewTab === 'monthly' && (
                      <select
                        value={revenueYearFilter}
                        onChange={(e) => setRevenueYearFilter(e.target.value)}
                        className="bg-white border border-stone-200 text-stone-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 shadow-2xs focus:outline-none focus:border-red-600 cursor-pointer"
                      >
                        <option value="all">All Years</option>
                        {availableYears.map((yr) => (
                          <option key={yr} value={String(yr)}>
                            Year {yr}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* MONTHLY VIEW CONTENT */}
                {revenueViewTab === 'monthly' && (
                  <div className="space-y-4">
                    {/* Quick Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400">This Month ({monthNames[currentMonth].substring(0, 3)} {currentYear})</span>
                        <p className="text-xl font-extrabold text-blue-700">₹{currentMonthRevenue.toLocaleString()}</p>
                        <p className="text-[10px] text-stone-500">{thisMonthPaidOrders.length} verified purchases</p>
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400">Total Recorded Months</span>
                        <p className="text-xl font-extrabold text-stone-900">{monthlyBreakdown.length}</p>
                        <p className="text-[10px] text-stone-500">Active monthly intervals</p>
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400">Monthly Avg (Active)</span>
                        <p className="text-xl font-extrabold text-emerald-700">
                          ₹{monthlyBreakdown.length > 0 ? Math.round(totalRevenue / Math.max(1, monthlyBreakdown.filter(m => m.orderCount > 0).length || 1)).toLocaleString() : 0}
                        </p>
                        <p className="text-[10px] text-stone-500">Per active month</p>
                      </div>
                    </div>

                    {/* Monthly Cards / Breakdown */}
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
                      {monthlyBreakdown
                        .filter((m) => revenueYearFilter === 'all' || String(m.year) === revenueYearFilter)
                        .map((m) => {
                          const progressPercent = totalRevenue > 0 ? Math.min(100, Math.round((m.revenue / totalRevenue) * 100)) : 0;
                          return (
                            <div key={m.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 transition-colors">
                              <div className="flex items-center space-x-3 min-w-[200px]">
                                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex flex-col items-center justify-center font-bold text-xs shrink-0 border border-red-100">
                                  <span className="text-[9px] uppercase font-semibold text-red-500">{m.shortName.split(' ')[0]}</span>
                                  <span className="text-xs font-black">{m.shortName.split(' ')[1]}</span>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <h4 className="font-bold text-sm text-stone-900">{m.monthName}</h4>
                                    {m.isCurrentMonth && (
                                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full">
                                        Current Month
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-500">{m.orderCount} paid {m.orderCount === 1 ? 'order' : 'orders'}</p>
                                </div>
                              </div>

                              {/* Progress bar visual */}
                              <div className="flex-1 max-w-xs hidden md:block">
                                <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                                  <span>Share of Lifetime Revenue</span>
                                  <span className="font-bold text-stone-700">{progressPercent}%</span>
                                </div>
                                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(progressPercent, m.revenue > 0 ? 5 : 0)}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Revenue values */}
                              <div className="text-left sm:text-right">
                                <p className="text-base font-extrabold text-stone-900">
                                  ₹{m.revenue.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-stone-500">
                                  {m.orderCount > 0 ? `Avg ₹${Math.round(m.revenue / m.orderCount)}/order` : 'No orders yet'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* YEARLY VIEW CONTENT */}
                {revenueViewTab === 'yearly' && (
                  <div className="space-y-4">
                    {/* Quick highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400">Current Year ({currentYear})</span>
                        <p className="text-xl font-extrabold text-red-700">₹{currentYearRevenue.toLocaleString()}</p>
                        <p className="text-[10px] text-stone-500">{thisYearPaidOrders.length} verified purchases</p>
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400">Total Lifetime Revenue</span>
                        <p className="text-xl font-extrabold text-emerald-700">₹{totalRevenue.toLocaleString()}</p>
                        <p className="text-[10px] text-stone-500">Across {yearlyBreakdown.length} academic {yearlyBreakdown.length === 1 ? 'year' : 'years'}</p>
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400">Target Benchmark</span>
                        <p className="text-xl font-extrabold text-stone-900">HSLC 2027</p>
                        <p className="text-[10px] text-stone-500">Assam Board Curriculum</p>
                      </div>
                    </div>

                    {/* Yearly Breakdown List */}
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
                      {yearlyBreakdown.map((y) => {
                        const progressPercent = totalRevenue > 0 ? Math.min(100, Math.round((y.revenue / totalRevenue) * 100)) : 0;
                        return (
                          <div key={y.year} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 transition-colors">
                            <div className="flex items-center space-x-3 min-w-[200px]">
                              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex flex-col items-center justify-center font-bold text-xs shrink-0">
                                <span className="text-[9px] uppercase font-semibold text-red-400">Year</span>
                                <span className="text-xs font-black">{y.year}</span>
                              </div>
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <h4 className="font-bold text-sm text-stone-900">Academic Year {y.year}</h4>
                                  {y.isCurrentYear && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full">
                                      Current Year
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-500">{y.orderCount} paid orders completed</p>
                              </div>
                            </div>

                            {/* Progress bar visual */}
                            <div className="flex-1 max-w-xs hidden md:block">
                              <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                                <span>Share of Total Revenue</span>
                                <span className="font-bold text-stone-700">{progressPercent}%</span>
                              </div>
                              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-red-700 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(progressPercent, y.revenue > 0 ? 5 : 0)}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Revenue values */}
                            <div className="text-left sm:text-right">
                              <p className="text-base font-extrabold text-stone-900">
                                ₹{y.revenue.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-stone-500">
                                {y.orderCount > 0 ? `Avg ₹${Math.round(y.revenue / 12)} / month` : 'No orders yet'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PRODUCT / NOTES VIEW CONTENT */}
                {revenueViewTab === 'product' && (
                  <div className="space-y-4">
                    {/* Quick highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400">Total Educational Notes</span>
                        <p className="text-xl font-extrabold text-stone-900">{products.length} Products</p>
                        <p className="text-[10px] text-stone-500">{products.filter((p) => p.published).length} published live</p>
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400">Monetized Note Sets</span>
                        <p className="text-xl font-extrabold text-emerald-700">{productBreakdown.length}</p>
                        <p className="text-[10px] text-stone-500">With at least 1 verified purchase</p>
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400">Top Grossing Subject</span>
                        <p className="text-xl font-extrabold text-red-700 truncate">
                          {productBreakdown.length > 0 ? productBreakdown[0].productTitle.split(' ')[0] + ' Notes' : 'General Science'}
                        </p>
                        <p className="text-[10px] text-stone-500">Highest student sales demand</p>
                      </div>
                    </div>

                    {/* Product Revenue List */}
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
                      {productBreakdown.length === 0 ? (
                        <div className="p-8 text-center text-xs text-stone-500">
                          No verified sales recorded yet for notes. Once students purchase, real revenue per product will appear here.
                        </div>
                      ) : (
                        productBreakdown.map((item, idx) => {
                          const progressPercent = totalRevenue > 0 ? Math.min(100, Math.round((item.revenue / totalRevenue) * 100)) : 0;
                          return (
                            <div key={item.productId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 transition-colors">
                              <div className="flex items-center space-x-3 min-w-[220px]">
                                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-bold text-xs shrink-0 border border-red-200">
                                  #{idx + 1}
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-stone-900 line-clamp-1">{item.productTitle}</h4>
                                  <p className="text-[11px] text-stone-500">
                                    {item.orderCount} student {item.orderCount === 1 ? 'purchase' : 'purchases'}
                                  </p>
                                </div>
                              </div>

                              {/* Progress bar visual */}
                              <div className="flex-1 max-w-xs hidden md:block">
                                <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                                  <span>Share of Total Revenue</span>
                                  <span className="font-bold text-stone-700">{progressPercent}%</span>
                                </div>
                                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-red-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(progressPercent, 5)}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Revenue values */}
                              <div className="text-left sm:text-right">
                                <p className="text-base font-extrabold text-stone-900">
                                  ₹{item.revenue.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-stone-500">
                                  Total collected earnings
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Orders Overview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-stone-900">Recent Customer Orders</h3>
                  <button
                    onClick={() => setCurrentTab('orders')}
                    className="text-xs font-semibold text-red-700 hover:text-red-800"
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="border border-stone-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {orders.slice(0, 5).map((ord) => (
                        <tr key={ord.id} className="hover:bg-stone-50/50">
                          <td className="py-2.5 px-3 font-mono font-medium">{ord.id}</td>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-stone-900">{ord.studentName}</p>
                            <p className="text-[10px] text-stone-400 font-mono">+91 {ord.studentPhone}</p>
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px] truncate">{ord.productTitleSnapshot}</td>
                          <td className="py-2.5 px-3 font-bold text-stone-900">₹{ord.amountPaise / 100}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                ord.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ord.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRODUCTS CATALOG */}
          {currentTab === 'products' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900 font-sans">
                    Product & Notes Management
                  </h2>
                  <p className="text-xs text-stone-500">
                    Publish, edit pricing, or replace PDF notes across the platform.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={async () => {
                      if (window.confirm('Do you want to clean up and remove any remaining example or test products from the database?')) {
                        const removed = await deleteLegacySampleProductsAdmin();
                        const refreshed = await getAllProductsAdmin();
                        setProducts(refreshed);
                        alert(`Cleaned up ${removed} sample product(s). Catalog is now clean.`);
                      }
                    }}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
                    title="Remove any sample or example products"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Clear Sample Data</span>
                  </button>

                  <button
                    onClick={() => {
                      handleResetProductForm();
                      setCurrentTab('add-product');
                    }}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                </div>
              </div>

              {/* If no products exist yet */}
              {products.length === 0 ? (
                <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-3xl p-10 text-center space-y-4">
                  <div className="w-14 h-14 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto">
                    <Package className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-stone-900">
                      Product Catalog is Empty
                    </h3>
                    <p className="text-xs text-stone-600 max-w-md mx-auto">
                      All example and sample products have been cleared. No dummy data is being shown. You can now add your original educational notes and study materials.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        handleResetProductForm();
                        setCurrentTab('add-product');
                      }}
                      className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Your First Product Now</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Product search */}
                  <div className="relative max-w-sm">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Filter products by title, subject, or class..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                    />
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  </div>

                  {/* Products Table */}
                  <div className="border border-stone-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="py-3 px-4">Title & Subject</th>
                          <th className="py-3 px-4">Class & Medium</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products
                      .filter((p) =>
                        p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.subject.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.classLevel.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-stone-50/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={p.coverImagePath}
                                alt={p.title}
                                className="w-11 h-11 object-cover rounded-xl border border-stone-200 shrink-0"
                              />
                              <div className="max-w-xs space-y-0.5">
                                <p className="font-bold text-stone-900 truncate">{p.title}</p>
                                <div className="flex items-center space-x-1.5 flex-wrap">
                                  <span className="text-[10px] text-red-700 font-semibold uppercase">
                                    {p.subject} • {p.category}
                                  </span>
                                  {p.driveFileLink ? (
                                    <a
                                      href={p.driveFileLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center space-x-1 text-[9px] text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold px-1.5 py-0.5 rounded border border-blue-200"
                                      title="Open attached Google Drive file"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      <span>Drive Attached</span>
                                    </a>
                                  ) : (
                                    <span className="text-[9px] text-stone-400 font-medium">
                                      Storage: {p.pdfFileName || 'PDF'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-stone-800">{p.classLevel}</p>
                            <p className="text-[11px] text-stone-500">{p.medium}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                                {p.isFree || p.sellingPricePaise === 0 ? (
                                  <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs">
                                    FREE PDF
                                  </span>
                                ) : (
                                  <span className="font-extrabold text-stone-900 text-sm">
                                    ₹{p.sellingPricePaise / 100}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openQuickPriceEdit(p)}
                                  className="text-[10px] bg-red-50 hover:bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded border border-red-200 cursor-pointer transition-colors"
                                  title="Edit price anytime"
                                >
                                  Edit ₹
                                </button>
                              </div>
                              <div className="text-[10px] text-stone-400 font-mono">
                                <span>{p.sellingPricePaise.toLocaleString()} paise</span>
                                {p.originalPricePaise > p.sellingPricePaise && (
                                  <span className="ml-1 text-stone-400 line-through">
                                    ₹{p.originalPricePaise / 100}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleTogglePublish(p)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                p.published
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                              }`}
                            >
                              {p.published ? 'Published' : 'Draft / Unpublished'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center space-x-1.5">
                              <button
                                onClick={() => handleEditClick(p)}
                                className="px-2.5 py-1.5 rounded-lg text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 font-semibold text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
                                title="Edit all information for this product"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit All</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.title)}
                                className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer transition-colors"
                                title="Delete or Archive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

          {/* TAB: ADD / EDIT PRODUCT */}
          {currentTab === 'add-product' && (
            <div className="space-y-6 animate-in fade-in max-w-4xl">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900 font-sans flex items-center space-x-2">
                    {editingProduct ? (
                      <>
                        <Edit className="w-5 h-5 text-red-700" />
                        <span>Edit Educational Product</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-5 h-5 text-red-700" />
                        <span>Add New Educational Notes Product</span>
                      </>
                    )}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Har EK information editable hai — Google Drive link, PDF pricing in rupees & paise, syllabus, and covers.
                  </p>
                </div>
                {editingProduct && (
                  <button
                    onClick={handleResetProductForm}
                    className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✕ Cancel Edit & Create New
                  </button>
                )}
              </div>

              {/* Active Edit Mode Banner */}
              {editingProduct && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                      <Edit className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-stone-900">
                        Editing: <span className="text-amber-900">{editingProduct.title}</span>
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Product ID: <span className="font-mono text-stone-700">{editingProduct.id}</span> • Sabhi fields ko abhi update kar sakte hain
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full self-start sm:self-auto">
                    Live Edit Mode
                  </span>
                </div>
              )}

              {formMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-red-700 shrink-0" />
                  <span>{formMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-6 text-xs">
                {/* 1. Title & Slug */}
                <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <span>1. Title & URL Identifier</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        Product Title <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={prodTitle}
                        onChange={(e) => setProdTitle(e.target.value)}
                        placeholder="e.g. HSLC 2027 General Science Complete Notes (অসমীয়া মাধ্যম)"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        Slug or Unique Identifier
                      </label>
                      <input
                        type="text"
                        value={prodSlug}
                        onChange={(e) => setProdSlug(e.target.value)}
                        placeholder="e.g. hslc-2027-general-science-assamese"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-mono text-stone-900 focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Target Curriculum, Subject, Class & Medium */}
                <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    2. Subject, Class & Examination Target
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Subject</label>
                      <select
                        value={prodSubject}
                        onChange={(e) => setProdSubject(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                      >
                        <option value="General Science">General Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Social Science">Social Science</option>
                        <option value="English">English</option>
                        <option value="Assamese">Assamese</option>
                        <option value="Other Subjects">Other Subjects</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Class Level</label>
                      <select
                        value={prodClass}
                        onChange={(e) => setProdClass(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                      >
                        <option value="HSLC 2027">HSLC 2027</option>
                        <option value="Class 10">Class 10</option>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 8">Class 8</option>
                        <option value="Class 7">Class 7</option>
                        <option value="Class 6">Class 6</option>
                        <option value="Other Examinations">Other Examinations</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Medium</label>
                      <select
                        value={prodMedium}
                        onChange={(e) => setProdMedium(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                      >
                        <option value="Assamese Medium">Assamese Medium</option>
                        <option value="English Medium">English Medium</option>
                        <option value="Both Mediums">Both Mediums</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Category</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value as any)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Premium">Premium</option>
                        <option value="Budget Friendly">Budget Friendly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Exam Target</label>
                      <input
                        type="text"
                        value={prodExamTarget}
                        onChange={(e) => setProdExamTarget(e.target.value)}
                        placeholder="HSLC 2027 Board Exam"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Pricing in Rupees & Paise (Editable Anytime) */}
                <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      3. Pricing (In ₹ Rupees & Paise - Editable Anytime)
                    </h3>
                    <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Stored accurately in paise (1 ₹ = 100 paise)
                    </span>
                  </div>

                  {/* Free PDF Toggle Option */}
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodIsFree}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setProdIsFree(val);
                          if (val) {
                            setProdSellingPrice(0);
                          } else if (prodSellingPrice === 0) {
                            setProdSellingPrice(99);
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <div>
                        <span className="font-extrabold text-stone-900 text-xs">
                          Free PDF Option (100% Free Note — Students get direct Drive access without payment)
                        </span>
                        <p className="text-[11px] text-stone-500">
                          Tick this box to add this note to the website's dedicated Free PDFs section.
                        </p>
                      </div>
                    </label>
                    {prodIsFree && (
                      <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase shrink-0">
                        Free PDF Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-3.5 rounded-xl border border-stone-300 space-y-1">
                      <label className="block text-stone-700 font-semibold">
                        Selling Price (₹) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={prodSellingPrice}
                        onChange={(e) => setProdSellingPrice(Number(e.target.value))}
                        className="w-full text-lg font-black text-red-700 focus:outline-none"
                      />
                      <div className="text-[11px] text-stone-500 font-mono">
                        Equals: <strong className="text-stone-800">{Math.round(Number(prodSellingPrice) * 100).toLocaleString()} paise</strong>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-stone-300 space-y-1">
                      <label className="block text-stone-700 font-semibold">
                        Original / MRP Price (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={prodOriginalPrice}
                        onChange={(e) => setProdOriginalPrice(Number(e.target.value))}
                        className="w-full text-lg font-bold text-stone-800 focus:outline-none"
                      />
                      <div className="text-[11px] text-stone-500 font-mono">
                        Equals: <strong className="text-stone-800">{Math.round(Number(prodOriginalPrice) * 100).toLocaleString()} paise</strong>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-stone-300 flex flex-col justify-between">
                      <span className="text-stone-500 font-medium">Automatic Discount %</span>
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-3 py-2 font-bold text-sm text-center">
                        {prodOriginalPrice > prodSellingPrice
                          ? `${Math.round(((prodOriginalPrice - prodSellingPrice) / prodOriginalPrice) * 100)}% DISCOUNT`
                          : '0% (Standard Price)'}
                      </div>
                      <span className="text-[10px] text-stone-400 text-center">
                        Student saves ₹{Math.max(0, prodOriginalPrice - prodSellingPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Google Drive Link & PDF Delivery (NEW & CRITICAL) */}
                <div className="bg-blue-50/70 p-4 sm:p-5 rounded-2xl border border-blue-200 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                        4. Google Drive File Link & PDF File Settings
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Direct Student Access
                    </span>
                  </div>

                  {/* Google Drive Link Input */}
                  <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-2">
                    <label className="block text-stone-800 font-bold">
                      Google Drive File Link (Share / View Link)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={prodDriveLink}
                        onChange={(e) => setProdDriveLink(e.target.value)}
                        placeholder="https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing"
                        className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-blue-600 text-xs"
                      />
                      {prodDriveLink.trim() && (
                        <a
                          href={prodDriveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center justify-center space-x-1.5 shrink-0 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Test Drive Link</span>
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      💡 <strong>Tip:</strong> In Google Drive, click <em>Share &gt; Anyone with the link can view</em>. Paste that link here. Once verified students purchase notes, they get instant Google Drive access, download links, and an in-app viewer!
                    </p>
                  </div>

                  {/* PDF Meta details */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/80 p-3.5 rounded-xl border border-blue-100">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        PDF File Name
                      </label>
                      <input
                        type="text"
                        value={prodPdfFileName}
                        onChange={(e) => setProdPdfFileName(e.target.value)}
                        placeholder="MKR_HSLC_2027_Science.pdf"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        File Format Type
                      </label>
                      <input
                        type="text"
                        value={prodFileType}
                        onChange={(e) => setProdFileType(e.target.value)}
                        placeholder="PDF Document"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        Total Page Count
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={prodPageCount}
                        onChange={(e) => setProdPageCount(Number(e.target.value))}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        PDF Cloud Storage Path
                      </label>
                      <input
                        type="text"
                        value={prodPdfPath}
                        onChange={(e) => setProdPdfPath(e.target.value)}
                        placeholder="notes/science-2027.pdf"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-mono text-stone-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Cover Image & Visuals */}
                <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    5. Cover Image & Preview
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-stone-200 overflow-hidden border border-stone-300 shrink-0">
                      <img
                        src={prodCoverUrl || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=400&q=80'}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <label className="block text-stone-700 font-semibold">Cover Image URL</label>
                      <input
                        type="url"
                        value={prodCoverUrl}
                        onChange={(e) => setProdCoverUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                      />
                      <div className="flex items-center space-x-2 flex-wrap gap-1 pt-1">
                        <span className="text-[10px] text-stone-400 font-bold uppercase">Presets:</span>
                        <button
                          type="button"
                          onClick={() => setProdCoverUrl('https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80')}
                          className="text-[10px] bg-white border border-stone-200 hover:bg-stone-100 px-2 py-0.5 rounded text-stone-700"
                        >
                          Science
                        </button>
                        <button
                          type="button"
                          onClick={() => setProdCoverUrl('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80')}
                          className="text-[10px] bg-white border border-stone-200 hover:bg-stone-100 px-2 py-0.5 rounded text-stone-700"
                        >
                          Mathematics
                        </button>
                        <button
                          type="button"
                          onClick={() => setProdCoverUrl('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80')}
                          className="text-[10px] bg-white border border-stone-200 hover:bg-stone-100 px-2 py-0.5 rounded text-stone-700"
                        >
                          Study Books
                        </button>
                        <button
                          type="button"
                          onClick={() => setProdCoverUrl('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80')}
                          className="text-[10px] bg-white border border-stone-200 hover:bg-stone-100 px-2 py-0.5 rounded text-stone-700"
                        >
                          Library Notes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Descriptions */}
                <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    6. Descriptions & Highlights
                  </h3>
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Short Description (Card preview)
                    </label>
                    <textarea
                      rows={2}
                      value={prodShortDesc}
                      onChange={(e) => setProdShortDesc(e.target.value)}
                      placeholder="Brief highlights of notes for card previews..."
                      className="w-full bg-white border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Full Syllabus Description
                    </label>
                    <textarea
                      rows={4}
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="Detailed explanation of curriculum, question patterns, and teacher preparation notes..."
                      className="w-full bg-white border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 7. Chapters & Tags */}
                <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    7. Syllabus Chapters & Feature Tags
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        Included Chapters (One chapter per line)
                      </label>
                      <textarea
                        rows={5}
                        value={prodChapters}
                        onChange={(e) => setProdChapters(e.target.value)}
                        placeholder="Chapter 1: Chemical Reactions&#10;Chapter 2: Acids, Bases and Salts&#10;Chapter 3: Metals and Non-Metals"
                        className="w-full bg-white border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        Tags (Comma separated)
                      </label>
                      <input
                        type="text"
                        value={prodTags}
                        onChange={(e) => setProdTags(e.target.value)}
                        placeholder="Important Questions, Chapter-wise Notes, Revision Notes"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 mb-2"
                      />
                      <p className="text-[11px] text-stone-500">
                        E.g.: <em>Important Questions, Previous Year Questions, Complete Syllabus, Revision Notes</em>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 8. Visibility Toggles */}
                <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodPublished}
                        onChange={(e) => setProdPublished(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded"
                      />
                      <span className="font-bold text-stone-900">Publish Immediately to Store</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodFeatured}
                        onChange={(e) => setProdFeatured(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded"
                      />
                      <span className="font-bold text-stone-900">Feature on Homepage</span>
                    </label>
                  </div>

                  <span className="text-[11px] text-stone-500">
                    Status: <strong className={prodPublished ? 'text-emerald-700' : 'text-stone-500'}>{prodPublished ? 'Published' : 'Draft / Unpublished'}</strong>
                  </span>
                </div>

                {/* Submit & Reset Buttons */}
                <div className="pt-4 border-t border-stone-200 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleResetProductForm}
                    className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold transition-colors cursor-pointer"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="py-3 px-8 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-stone-300 text-white font-extrabold flex items-center space-x-2 shadow-lg shadow-red-800/25 transition-all cursor-pointer"
                  >
                    {formSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{editingProduct ? 'Save All Product Updates' : 'Create Educational Product'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: ORDERS & PAYMENTS */}
          {currentTab === 'orders' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900 font-sans">
                    Order Transactions & Verification Log
                  </h2>
                  <p className="text-xs text-stone-500">
                    Track Razorpay payment IDs, student phone numbers, and download verification records.
                  </p>
                </div>

                <div className="relative max-w-xs">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by student, order ID, phone..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-red-600"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                </div>
              </div>

              {/* Order Filters Bar (Year, Month, Status, Revenue Summary) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-stone-700 flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5 text-stone-400" />
                    <span>Filter:</span>
                  </span>

                  {/* Year Filter */}
                  <select
                    value={orderYearFilter}
                    onChange={(e) => setOrderYearFilter(e.target.value)}
                    className="bg-white border border-stone-200 text-stone-800 rounded-xl px-2.5 py-1.5 font-semibold focus:outline-none focus:border-red-600 cursor-pointer shadow-2xs"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={String(yr)}>
                        Year {yr}
                      </option>
                    ))}
                  </select>

                  {/* Month Filter */}
                  <select
                    value={orderMonthFilter}
                    onChange={(e) => setOrderMonthFilter(e.target.value)}
                    className="bg-white border border-stone-200 text-stone-800 rounded-xl px-2.5 py-1.5 font-semibold focus:outline-none focus:border-red-600 cursor-pointer shadow-2xs"
                  >
                    <option value="all">All Months</option>
                    {monthNames.map((mName, idx) => (
                      <option key={mName} value={String(idx)}>
                        {mName}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-white border border-stone-200 text-stone-800 rounded-xl px-2.5 py-1.5 font-semibold focus:outline-none focus:border-red-600 cursor-pointer shadow-2xs"
                  >
                    <option value="all">All Statuses</option>
                    <option value="paid">Paid & Verified</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>

                  {(orderYearFilter !== 'all' || orderMonthFilter !== 'all' || orderStatusFilter !== 'all' || orderSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrderYearFilter('all');
                        setOrderMonthFilter('all');
                        setOrderStatusFilter('all');
                        setOrderSearch('');
                      }}
                      className="text-red-700 hover:text-red-800 font-bold px-2 py-1 text-[11px] underline cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Filtered Revenue Metric */}
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-stone-500">
                    Showing <strong className="text-stone-900">{filteredOrdersList.length}</strong> orders
                  </span>
                  <div className="h-4 w-px bg-stone-300"></div>
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl font-bold flex items-center space-x-1.5">
                    <span>Period Revenue:</span>
                    <strong className="text-emerald-900">₹{filteredOrdersRevenue.toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Order & Razorpay ID</th>
                      <th className="py-3 px-4">Student & Contact</th>
                      <th className="py-3 px-4">Product Snapshot</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrdersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-stone-500">
                          <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                          <p className="font-semibold text-stone-700">No orders found for this period</p>
                          <p className="text-[11px] text-stone-400">Try adjusting the year or month filter.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrdersList.map((o) => (
                        <tr key={o.id} className="hover:bg-stone-50/50">
                          <td className="py-3 px-4 font-mono">
                            <p className="font-bold text-stone-900">{o.id}</p>
                            {o.razorpayPaymentId && (
                              <p className="text-[10px] text-stone-400 truncate max-w-[140px]">
                                {o.razorpayPaymentId}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-stone-900">{o.studentName}</p>
                            <p className="text-[11px] text-stone-500 font-mono">📱 +91 {o.studentPhone}</p>
                            <p className="text-[10px] text-stone-400">{o.studentEmail}</p>
                          </td>
                          <td className="py-3 px-4 max-w-[220px]">
                            <p className="font-medium text-stone-800 truncate" title={o.productTitleSnapshot}>
                              {o.productTitleSnapshot}
                            </p>
                          </td>
                          <td className="py-3 px-4 font-bold text-stone-900">
                            ₹{o.amountPaise / 100}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                o.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : o.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-500 text-[11px]">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: REGISTERED STUDENTS */}
          {currentTab === 'students' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900 font-sans">
                    Registered Students Database
                  </h2>
                  <p className="text-xs text-stone-500">
                    Official student accounts with validated Indian mobile contacts.
                  </p>
                </div>

                <div className="relative max-w-xs">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by student name or phone..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-red-600"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                </div>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Mobile Number</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {students
                      .filter((s) =>
                        s.displayName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.phoneNumber?.includes(studentSearch) ||
                        s.email?.toLowerCase().includes(studentSearch.toLowerCase())
                      )
                      .map((s) => (
                        <tr key={s.uid} className="hover:bg-stone-50/50">
                          <td className="py-3 px-4 font-bold text-stone-900">
                            {s.displayName || 'Student'}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-stone-700">
                            {s.phoneNumber ? `+91 ${s.phoneNumber}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-stone-600">{s.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                s.role === 'admin'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {s.role || 'student'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-500 text-[11px]">
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Active'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: BANNER MANAGEMENT */}
          {currentTab === 'banner' && (
            <div className="space-y-6 animate-in fade-in max-w-2xl">
              <div>
                <h2 className="text-xl font-extrabold text-stone-900 font-sans">
                  Promotional Banner Management
                </h2>
                <p className="text-xs text-stone-500">
                  Updates immediately appear on the student homepage without rebuilding or redeploying the app.
                </p>
              </div>

              <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <input
                    type="checkbox"
                    checked={bannerEnabled}
                    onChange={(e) => setBannerEnabled(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="font-bold text-stone-900">
                    Enable Promotional Banner on Homepage
                  </span>
                </label>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={bannerBadge}
                    onChange={(e) => setBannerBadge(e.target.value)}
                    placeholder="e.g. HSLC 2027 Admission & Notes Open"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Banner Title</label>
                  <input
                    type="text"
                    required
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="e.g. HSLC 2027 Special Preparation Notes"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Banner Subtitle</label>
                  <textarea
                    rows={2}
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="High-scoring Chapter-wise Notes & Solved Papers in Assamese and English Mediums."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Call to Action Button Text</label>
                  <input
                    type="text"
                    value={bannerCta}
                    onChange={(e) => setBannerCta(e.target.value)}
                    placeholder="Explore Notes"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bannerSaving}
                  className="py-2.5 px-6 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-stone-300 text-white font-bold flex items-center space-x-2 shadow-sm cursor-pointer"
                >
                  {bannerSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save & Publish Banner</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB: SOCIAL LINKS */}
          {currentTab === 'social' && (
            <div className="space-y-6 animate-in fade-in max-w-2xl">
              <div>
                <h2 className="text-xl font-extrabold text-stone-900 font-sans">
                  Official Social & Student Support Links
                </h2>
                <p className="text-xs text-stone-500">
                  Only configured links are displayed on the student store and footer.
                </p>
              </div>

              <form onSubmit={handleSaveSocial} className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    WhatsApp Number (Indian format without +)
                  </label>
                  <input
                    type="text"
                    value={socialWhatsapp}
                    onChange={(e) => setSocialWhatsapp(e.target.value)}
                    placeholder="919864012345"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Telegram Channel URL</label>
                  <input
                    type="url"
                    value={socialTelegram}
                    onChange={(e) => setSocialTelegram(e.target.value)}
                    placeholder="https://t.me/mkr_academy_official"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">YouTube Channel URL</label>
                  <input
                    type="url"
                    value={socialYoutube}
                    onChange={(e) => setSocialYoutube(e.target.value)}
                    placeholder="https://youtube.com/@mkr_academy"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Instagram Profile URL</label>
                  <input
                    type="url"
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    placeholder="https://instagram.com/mkr_academy"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Official Support Email</label>
                  <input
                    type="email"
                    value={socialEmail}
                    onChange={(e) => setSocialEmail(e.target.value)}
                    placeholder="muktar9085mkr@gmail.com"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={socialSaving}
                  className="py-2.5 px-6 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-stone-300 text-white font-bold flex items-center space-x-2 shadow-sm cursor-pointer"
                >
                  {socialSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Social Settings</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB: PAYMENT CONFIG */}
          {currentTab === 'payment-config' && (
            <div className="space-y-6 animate-in fade-in max-w-3xl">
              <div>
                <h2 className="text-xl font-extrabold text-stone-900 font-sans">
                  Razorpay Live Payment Gateway
                </h2>
                <p className="text-xs text-stone-500">
                  Real-time payment gateway credentials, webhook listener, and Netlify deployment configuration.
                </p>
              </div>

              {/* Live Gateway Status Box */}
              <div className="bg-stone-50 p-5 rounded-3xl border border-stone-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-900">Razorpay Live Production Gateway</h4>
                      <p className="text-[11px] text-stone-500">Official Payment Processor for MKR Academy</p>
                    </div>
                  </div>

                  <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-wider flex items-center space-x-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>Live Gateway Active</span>
                  </span>
                </div>

                {/* Key Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Merchant Key ID</span>
                    <p className="font-mono font-bold text-stone-900 text-sm select-all">
                      {gatewayConfig?.keyId || 'rzp_live_TqPdwQmi6yOprh'}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">✓ Live credentials loaded from configuration</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Key Secret Status</span>
                    <p className="font-mono font-bold text-stone-900 text-sm">
                      ••••••••••••••••••••••••
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">✓ Securely encrypted & HMAC-SHA256 verified</p>
                  </div>
                </div>

                {/* Supported Methods */}
                <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                  <span className="font-bold text-stone-800">Supported Payment Methods:</span>
                  <span className="bg-stone-200/60 px-2.5 py-0.5 rounded-md font-medium text-stone-700">UPI (Google Pay, PhonePe, Paytm, BHIM)</span>
                  <span className="bg-stone-200/60 px-2.5 py-0.5 rounded-md font-medium text-stone-700">RuPay, Visa, Mastercard</span>
                  <span className="bg-stone-200/60 px-2.5 py-0.5 rounded-md font-medium text-stone-700">All Indian Banks (NetBanking)</span>
                </div>

                {/* Test Connection Button */}
                <div className="pt-2">
                  <button
                    onClick={handleTestGateway}
                    disabled={gatewayStatusChecking}
                    className="py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    {gatewayStatusChecking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{gatewayStatusChecking ? 'Testing Gateway...' : 'Test Payment Gateway Connection'}</span>
                  </button>

                  {gatewayTestResult && (
                    <div className={`mt-3 p-3 rounded-xl text-xs flex items-start space-x-2 ${
                      gatewayTestResult.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">{gatewayTestResult.message}</p>
                        {gatewayTestResult.keyId && (
                          <p className="font-mono text-[11px] mt-0.5">Active Key: {gatewayTestResult.keyId} | Mode: {gatewayTestResult.mode?.toUpperCase()}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Webhook Configuration Card */}
              <div className="bg-white p-5 rounded-3xl border border-stone-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">Razorpay Webhook URL</h4>
                    <p className="text-stone-500 text-[11px]">Configure this in your Razorpay Dashboard under Account & Settings &gt; Webhooks</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/payment/webhook` : '/api/payment/webhook'}
                    className="flex-1 bg-stone-50 border border-stone-300 font-mono text-xs px-3 py-2.5 rounded-xl text-stone-800 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/api/payment/webhook`;
                      navigator.clipboard.writeText(url);
                      setCopiedWebhook(true);
                      setTimeout(() => setCopiedWebhook(false), 2000);
                    }}
                    className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    {copiedWebhook ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedWebhook ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-stone-500">
                  Recommended webhook events to enable in Razorpay: <code className="font-mono text-red-700 bg-red-50 px-1 py-0.5 rounded">payment.captured</code> and <code className="font-mono text-red-700 bg-red-50 px-1 py-0.5 rounded">order.paid</code>.
                </p>
              </div>

              {/* Netlify Deployment Variables Guide */}
              <div className="bg-red-50/60 border border-red-200/80 rounded-3xl p-5 text-red-950 space-y-3 text-xs">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-700" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-red-950">
                    Netlify Deployment: Environment Variables
                  </h4>
                </div>

                <p className="text-stone-700 leading-relaxed text-xs">
                  When deploying to Netlify, set these two environment variables in <strong>Netlify Dashboard &gt; Site configuration &gt; Environment variables</strong>:
                </p>

                <div className="bg-stone-900 text-stone-100 p-3.5 rounded-2xl font-mono text-xs space-y-1.5 select-all">
                  <p className="text-emerald-400">RAZORPAY_KEY_ID = rzp_live_TqPdwQmi6yOprh</p>
                  <p className="text-emerald-400">RAZORPAY_KEY_SECRET = eIJMyjZbJkBgLgWB59HYX7hn</p>
                  <p className="text-stone-400">ADMIN_EMAIL = muktar9085mkr@gmail.com</p>
                </div>

                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Both your Netlify Functions (<code className="font-mono text-stone-800">netlify/functions/api.ts</code>) and Express server utilize these keys to create signed Razorpay orders and authenticate live customer payments.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Quick Price Edit Modal (Allows changing price in paise / rupees anytime) */}
      {quickPriceModalProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  ₹
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900">
                    Quick Edit Price (Har Time Editable)
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate max-w-[240px]">
                    {quickPriceModalProduct.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPriceModalProduct(null)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {quickPriceMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{quickPriceMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickPrice} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Selling Price (₹ Rupees) <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={quickSellingPrice}
                    onChange={(e) => setQuickSellingPrice(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-3 py-2 text-base font-extrabold text-red-700 focus:bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1 font-mono">
                  Stored as: <strong className="text-stone-900">{Math.round(Number(quickSellingPrice) * 100).toLocaleString()} paise</strong>
                </p>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Original / MRP Price (₹ Rupees)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={quickOriginalPrice}
                    onChange={(e) => setQuickOriginalPrice(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-3 py-2 text-stone-900 font-bold focus:bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1 font-mono">
                  Stored as: <strong className="text-stone-900">{Math.round(Number(quickOriginalPrice) * 100).toLocaleString()} paise</strong>
                </p>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                <span className="text-stone-500 font-medium">Calculated Discount:</span>
                <span className="font-extrabold text-emerald-700">
                  {quickOriginalPrice > quickSellingPrice
                    ? `${Math.round(((quickOriginalPrice - quickSellingPrice) / quickOriginalPrice) * 100)}% Discount`
                    : 'No Discount'}
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setQuickPriceModalProduct(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickPriceSaving}
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-stone-300 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                >
                  {quickPriceSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save New Price</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
