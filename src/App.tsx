/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Product, Purchase, AppPublicSettings } from './types';
import {
  getPublishedProducts,
  subscribeToPublishedProducts,
  getFreeNotes,
  subscribeToFreeNotes
} from './services/productService';
import { getUserPurchases, subscribeToUserPurchases } from './services/orderService';
import { getPublicSettings } from './services/settingsService';
import {
  getPendingDownload,
  clearPendingDownload,
  storePendingDownload,
  triggerFileDownload,
  recordDownloadEvent
} from './services/downloadService';

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomeView } from './components/student/HomeView';
import { BrowseNotesView } from './components/student/BrowseNotesView';
import { FreePdfsView } from './components/student/FreePdfsView';
import { MyPurchasesView } from './components/student/MyPurchasesView';
import { ProductDetailsView } from './components/student/ProductDetailsView';
import { CheckoutView } from './components/student/CheckoutView';
import { AuthView } from './components/student/AuthView';
import { StudentProfileView } from './components/student/StudentProfileView';
import { PolicyView } from './components/common/PolicyView';
import { PolicyType } from './components/common/PolicyModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PreviousPapersView } from './components/student/PreviousPapersView';

export type AppView =
  | 'home'
  | 'browse'
  | 'free-pdfs'
  | 'purchases'
  | 'previous-papers'
  | 'admin'
  | 'product-details'
  | 'checkout'
  | 'auth'
  | 'profile'
  | 'policy';

export function getPolicyTypeFromUrl(): PolicyType {
  if (typeof window === 'undefined') return 'privacy';
  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const typeParam = searchParams.get('policy')?.toLowerCase() || searchParams.get('type')?.toLowerCase();

  if (typeParam === 'terms' || pathname.includes('terms')) return 'terms';
  if (typeParam === 'refund' || pathname.includes('refund')) return 'refund';
  if (typeParam === 'copyright' || pathname.includes('copyright')) return 'copyright';
  if (typeParam === 'grievance' || pathname.includes('grievance')) return 'grievance';
  if (typeParam === 'tax' || typeParam === 'tax-certin' || pathname.includes('tax') || pathname.includes('cert-in')) return 'tax-certin';
  if (typeParam === 'contact' || pathname.includes('contact') || pathname.includes('support')) return 'contact';
  if (typeParam === 'about' || pathname.includes('about')) return 'about';
  return 'privacy';
}

export function getAuthModeFromUrl(): 'login' | 'register' {
  if (typeof window === 'undefined') return 'login';
  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  if (pathname.startsWith('/register') || searchParams.get('mode') === 'register') {
    return 'register';
  }
  return 'login';
}

export function getViewFromUrl(): AppView {
  if (typeof window === 'undefined') return 'browse';

  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const viewParam = searchParams.get('view')?.toLowerCase();

  // 1. Explicit view parameter in search query
  if (viewParam === 'home') return 'home';
  if (viewParam === 'notes' || viewParam === 'browse') return 'browse';
  if (viewParam === 'free-pdfs' || viewParam === 'free-notes') return 'free-pdfs';
  if (viewParam === 'purchases' || viewParam === 'my-purchases') return 'purchases';
  if (viewParam === 'previous-papers' || viewParam === 'pyq' || viewParam === 'question-papers') return 'previous-papers';
  if (viewParam === 'admin') return 'admin';
  if (viewParam === 'profile' || viewParam === 'account') return 'profile';
  if (viewParam === 'auth' || viewParam === 'login' || viewParam === 'register') return 'auth';
  if (viewParam === 'product' || viewParam === 'details') return 'product-details';
  if (viewParam === 'checkout' || viewParam === 'buy') return 'checkout';
  if (viewParam === 'policy' || viewParam === 'legal' || viewParam === 'contact' || viewParam === 'about') return 'policy';

  // 2. Explicit pathname routing
  if (pathname.startsWith('/home')) return 'home';
  if (pathname.startsWith('/notes') || pathname.startsWith('/browse')) return 'browse';
  if (pathname.startsWith('/free-pdfs') || pathname.startsWith('/free-notes')) return 'free-pdfs';
  if (pathname.startsWith('/purchases') || pathname.startsWith('/my-purchases')) return 'purchases';
  if (pathname.startsWith('/previous-papers') || pathname.startsWith('/pyq') || pathname.startsWith('/question-papers')) return 'previous-papers';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/profile') || pathname.startsWith('/account')) return 'profile';
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/auth')) return 'auth';
  if (pathname.startsWith('/checkout') || searchParams.has('checkout')) return 'checkout';
  if (pathname.startsWith('/product/') || searchParams.has('product')) return 'product-details';
  if (
    pathname.startsWith('/policy') ||
    pathname.startsWith('/privacy-policy') ||
    pathname.startsWith('/terms-and-conditions') ||
    pathname.startsWith('/refund-policy') ||
    pathname.startsWith('/copyright') ||
    pathname.startsWith('/grievance') ||
    pathname.startsWith('/tax-notice') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/about')
  ) {
    return 'policy';
  }

  // 3. Default for root URL ('/' or any other unmatched path) is Notes ('browse')
  return 'browse';
}

export function getPathForView(
  view: AppView,
  extra?: { productId?: string; authMode?: 'login' | 'register'; policyType?: PolicyType }
): string {
  switch (view) {
    case 'home':
      return '/home';
    case 'browse':
      return '/notes';
    case 'free-pdfs':
      return '/free-pdfs';
    case 'purchases':
      return '/purchases';
    case 'previous-papers':
      return '/previous-papers';
    case 'admin':
      return '/admin';
    case 'profile':
      return '/profile';
    case 'auth':
      return extra?.authMode === 'register' ? '/register' : '/login';
    case 'product-details':
      return extra?.productId ? `/product/${extra.productId}` : '/notes';
    case 'checkout':
      return extra?.productId ? `/checkout/${extra.productId}` : '/notes';
    case 'policy':
      return extra?.policyType ? `/policy/${extra.policyType}` : '/policy/privacy';
    default:
      return '/notes';
  }
}

function AppContent() {
  const { user, isAdmin } = useAuth();

  // Navigation State - Defaults to Notes ('browse') on main root URL
  const [currentView, setCurrentView] = useState<AppView>(() => getViewFromUrl());
  const [browseFilters, setBrowseFilters] = useState<any>({});

  // Global Data
  const [products, setProducts] = useState<Product[]>([]);
  const [freeNotes, setFreeNotes] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppPublicSettings | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Full-page active items & modes
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>(() => getAuthModeFromUrl());
  const [policyType, setPolicyType] = useState<PolicyType>(() => getPolicyTypeFromUrl());

  // In-App Free Notes Reader & Subject Selection (renders within FreePdfsView)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<Product | null>(null);

  // In-App Purchased Notes Reader (renders within MyPurchasesView)
  const [selectedReaderPurchase, setSelectedReaderPurchase] = useState<Purchase | null>(null);

  // Native Android Double-Back to Exit Toast & Notifications
  const [showExitToast, setShowExitToast] = useState(false);
  const [pendingDownloadToast, setPendingDownloadToast] = useState<string | null>(null);
  const [unavailableProductNotice, setUnavailableProductNotice] = useState<string | null>(null);

  // Synchronous refs for browser / Android back navigation
  const currentViewRef = useRef(currentView);
  const selectedProductRef = useRef(selectedProduct);
  const checkoutProductRef = useRef(checkoutProduct);
  const policyTypeRef = useRef(policyType);
  const selectedSubjectIdRef = useRef(selectedSubjectId);
  const previewPdfRef = useRef(previewPdf);
  const selectedReaderPurchaseRef = useRef(selectedReaderPurchase);
  const lastBackPressTimeRef = useRef<number>(0);

  // Keep refs in sync with state
  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);
  useEffect(() => { selectedProductRef.current = selectedProduct; }, [selectedProduct]);
  useEffect(() => { checkoutProductRef.current = checkoutProduct; }, [checkoutProduct]);
  useEffect(() => { policyTypeRef.current = policyType; }, [policyType]);
  useEffect(() => { selectedSubjectIdRef.current = selectedSubjectId; }, [selectedSubjectId]);
  useEffect(() => { previewPdfRef.current = previewPdf; }, [previewPdf]);
  useEffect(() => { selectedReaderPurchaseRef.current = selectedReaderPurchase; }, [selectedReaderPurchase]);

  // Global Android / Browser Back Navigation Controller
  useEffect(() => {
    // Initialize root history entry so device back button has a stack frame
    const initialView = getViewFromUrl();
    if (!window.history.state) {
      const currentPath = window.location.pathname === '/' ? '/' : window.location.pathname;
      window.history.replaceState({ step: initialView, view: initialView }, '', currentPath + window.location.search);
    }

    const handlePopState = (event: PopStateEvent) => {
      // 1. If any in-app free PDF reader preview is open, close it (1 step back)
      if (previewPdfRef.current) {
        setPreviewPdf(null);
        return;
      }
      // 2. If purchased notes reader is open, close it (1 step back)
      if (selectedReaderPurchaseRef.current) {
        setSelectedReaderPurchase(null);
        return;
      }
      // 3. If inside Free Notes and a specific subject is open, go back to all subjects (1 step back)
      if (selectedSubjectIdRef.current) {
        setSelectedSubjectId(null);
        return;
      }

      // 4. If history state has a recorded view or URL changed, navigate to that view
      const targetView = (event.state?.view as AppView) || getViewFromUrl();
      if (targetView && targetView !== currentViewRef.current) {
        setCurrentView(targetView);
        if (event.state?.type) {
          setPolicyType(event.state.type);
        }
        if (event.state?.mode) {
          setAuthInitialMode(event.state.mode);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 5. If already on landing page (browse or home) with no child reader open:
      // Standard Android UX: Double-tap back within 2 seconds to exit, otherwise show toast
      const isLandingPage = currentViewRef.current === 'browse' || currentViewRef.current === 'home';
      if (isLandingPage) {
        const now = Date.now();
        if (now - lastBackPressTimeRef.current < 2000) {
          // Allow app exit
          window.history.back();
        } else {
          lastBackPressTimeRef.current = now;
          const currentPath = window.location.pathname === '/' ? '/' : window.location.pathname;
          window.history.pushState({ step: 'root', view: currentViewRef.current }, '', currentPath + window.location.search);
          setShowExitToast(true);
          setTimeout(() => {
            setShowExitToast(false);
          }, 2000);
        }
      } else {
        // Fall back to browse catalog if popping out of a standalone page with no history
        setCurrentView('browse');
        window.history.replaceState({ step: 'browse', view: 'browse' }, '', '/notes');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 1. Load public settings and subscribe to published study materials in real-time
  useEffect(() => {
    let isMounted = true;

    // Fetch initial settings
    getPublicSettings()
      .then((loadedSettings) => {
        if (isMounted) setSettings(loadedSettings);
      })
      .catch((err) => console.warn('Could not load settings:', err));

    // One-time fallback eager load
    getPublishedProducts().then((initialItems) => {
      if (isMounted && initialItems.length > 0) {
        setProducts(initialItems);
        setLoading(false);
      }
    });

    getFreeNotes().then((initialFreeNotes) => {
      if (isMounted && initialFreeNotes.length > 0) {
        setFreeNotes(initialFreeNotes);
      }
    });

    // Real-time synchronization for published products
    const unsubscribeProducts = subscribeToPublishedProducts(
      (loadedProducts) => {
        if (isMounted) {
          setProducts(loadedProducts);
          setLoading(false);
        }
      },
      (error) => {
        console.warn('Real-time products subscription issue:', error);
        if (isMounted) setLoading(false);
      }
    );

    // Real-time synchronization for free notes
    const unsubscribeFreeNotes = subscribeToFreeNotes(
      (loadedFreeNotes) => {
        if (isMounted) {
          setFreeNotes(loadedFreeNotes);
        }
      },
      (error) => {
        console.warn('Real-time free notes subscription issue:', error);
      }
    );

    return () => {
      isMounted = false;
      unsubscribeProducts();
      unsubscribeFreeNotes();
    };
  }, []);

  // 2. React to authentication changes immediately (login, register, logout)
  useEffect(() => {
    let isMounted = true;
    let unsubscribePurchases: (() => void) | null = null;

    if (!user) {
      setPurchases([]);
      return;
    }

    unsubscribePurchases = subscribeToUserPurchases(
      user.uid,
      (userPurchases) => {
        if (isMounted) {
          setPurchases(userPurchases);
        }
      },
      (err) => {
        console.warn('Subscription error for user purchases, falling back to direct fetch:', err);
        getUserPurchases(user.uid).then((p) => {
          if (isMounted) setPurchases(p);
        });
      }
    );

    getPublishedProducts().then((latest) => {
      if (isMounted && latest.length > 0) {
        setProducts(latest);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribePurchases) {
        unsubscribePurchases();
      }
    };
  }, [user]);

  const purchasedProductIds = new Set(purchases.map((p) => p.productId));

  // 3. Automatic resumption of free PDF downloads after sign-up / login
  useEffect(() => {
    if (user) {
      const pending = getPendingDownload();
      if (pending && pending.product) {
        clearPendingDownload();
        triggerFileDownload(pending.product, pending.pdf);
        recordDownloadEvent(pending.product, pending.pdf, true);
        setPendingDownloadToast(`Welcome! Your free PDF download for "${pending.product.title}" has started automatically.`);
        setTimeout(() => setPendingDownloadToast(null), 6000);
      }
    }
  }, [user]);

  // 4. Direct Product Deep-linking (/product/:id or /checkout/:id)
  useEffect(() => {
    if (products.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const queryProductId = urlParams.get('product') || urlParams.get('id');
    const queryCheckoutId = urlParams.get('checkout');
    const productMatch = window.location.pathname.match(/\/product\/([a-zA-Z0-9_-]+)/);
    const checkoutMatch = window.location.pathname.match(/\/checkout\/([a-zA-Z0-9_-]+)/);

    const targetCheckoutId = queryCheckoutId || (checkoutMatch ? checkoutMatch[1] : null);
    const targetProductId = queryProductId || (productMatch ? productMatch[1] : null);

    if (targetCheckoutId) {
      const found = products.find((p) => p.id === targetCheckoutId);
      if (found) {
        setCheckoutProduct(found);
        setCurrentView('checkout');
      } else {
        setUnavailableProductNotice('The requested study material for checkout is currently unavailable.');
      }
    } else if (targetProductId) {
      const found = products.find((p) => p.id === targetProductId);
      if (found) {
        setSelectedProduct(found);
        setCurrentView('product-details');
      } else {
        setUnavailableProductNotice('The requested study material is currently unavailable or has been archived.');
      }
    }
  }, [products]);

  // 5. Dynamic Page Title
  useEffect(() => {
    if (currentView === 'product-details' && selectedProduct) {
      document.title = `${selectedProduct.title} - MKR Academy`;
    } else if (currentView === 'checkout' && checkoutProduct) {
      document.title = `Checkout: ${checkoutProduct.title} - MKR Academy`;
    } else if (currentView === 'profile') {
      document.title = 'My Profile & Account - MKR Academy';
    } else if (currentView === 'purchases') {
      document.title = 'My Purchased Notes - MKR Academy';
    } else if (currentView === 'free-pdfs') {
      document.title = 'Free Notes & Question Papers - MKR Academy';
    } else if (currentView === 'policy') {
      document.title = `${policyType ? policyType.toUpperCase() : 'Policy'} - MKR Academy`;
    } else if (currentView === 'auth') {
      document.title = `${authInitialMode === 'register' ? 'Register' : 'Login'} - MKR Academy`;
    } else {
      document.title = 'MKR Academy - Quality Educational Notes & Materials';
    }
  }, [currentView, selectedProduct, checkoutProduct, policyType, authInitialMode]);

  // Controlled Full-Page Navigation with browser URL updates
  const handleNavigate = (view: string, filterParam?: any) => {
    const targetView = view as AppView;

    let targetPath = '/notes';
    if (targetView === 'home') targetPath = '/home';
    else if (targetView === 'browse') targetPath = '/notes';
    else if (targetView === 'free-pdfs') targetPath = '/free-pdfs';
    else if (targetView === 'purchases') targetPath = '/purchases';
    else if (targetView === 'previous-papers') targetPath = '/previous-papers';
    else if (targetView === 'admin') targetPath = '/admin';
    else if (targetView === 'profile') targetPath = '/profile';
    else if (targetView === 'auth') targetPath = authInitialMode === 'register' ? '/register' : '/login';

    try {
      window.history.pushState({ step: targetView, view: targetView }, '', targetPath);
    } catch {
      // Fallback
    }

    if (targetView === 'browse') {
      setBrowseFilters(filterParam || {});
    }

    setCurrentView(targetView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Full-Page Actions
  const handleOpenProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product-details');
    try {
      window.history.pushState(
        { step: 'product-details', view: 'product-details', id: product.id },
        '',
        `/product/${product.id}`
      );
    } catch {
      // Fallback
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyNow = (product: Product) => {
    setCheckoutProduct(product);
    setCurrentView('checkout');
    try {
      window.history.pushState(
        { step: 'checkout', view: 'checkout', id: product.id },
        '',
        `/checkout/${product.id}`
      );
    } catch {
      // Fallback
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthInitialMode(mode);
    setCurrentView('auth');
    try {
      window.history.pushState(
        { step: 'auth', view: 'auth', mode },
        '',
        mode === 'register' ? '/register' : '/login'
      );
    } catch {
      // Fallback
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProfile = () => {
    setCurrentView('profile');
    try {
      window.history.pushState({ step: 'profile', view: 'profile' }, '', '/profile');
    } catch {
      // Fallback
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPolicy = (type: PolicyType) => {
    const targetType = type || 'privacy';
    setPolicyType(targetType);
    setCurrentView('policy');
    try {
      window.history.pushState(
        { step: 'policy', view: 'policy', type: targetType },
        '',
        `/policy/${targetType}`
      );
    } catch {
      // Fallback
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectFreeSubject = (subjectId: string | null) => {
    if (subjectId) {
      try {
        window.history.pushState({ step: 'free-subject', subjectId }, '');
      } catch {
        // Fallback
      }
      setSelectedSubjectId(subjectId);
    } else {
      setSelectedSubjectId(null);
    }
  };

  const handlePreviewFreePdf = (prod: Product | null) => {
    if (prod) {
      try {
        window.history.pushState({ step: 'pdf-preview', id: prod.id }, '');
      } catch {
        // Fallback
      }
      setPreviewPdf(prod);
    } else {
      setPreviewPdf(null);
    }
  };

  const handleSelectReaderPurchase = (purchase: Purchase | null) => {
    if (purchase) {
      try {
        window.history.pushState({ step: 'purchase-reader', id: purchase.orderId }, '');
      } catch {
        // Fallback
      }
      setSelectedReaderPurchase(purchase);
    } else {
      setSelectedReaderPurchase(null);
    }
  };

  const handleDownloadNotes = (product: Product) => {
    const isFree = Boolean(product.isFree || Number(product.sellingPricePaise || 0) === 0);
    if (isFree && !user) {
      storePendingDownload(product);
      handleOpenAuth('register');
      setPendingDownloadToast(
        `Please sign in or register to download "${product.title}". Your download will resume automatically right after sign-in!`
      );
      setTimeout(() => setPendingDownloadToast(null), 7000);
      return;
    }

    triggerFileDownload(product);
    recordDownloadEvent(product, undefined, isFree);
  };

  const handleExecuteSearch = () => {
    if (searchQuery.trim()) {
      setBrowseFilters({ search: searchQuery });
      handleNavigate('browse');
    }
  };

  const handlePurchaseSuccess = (newPurchase: Purchase) => {
    setPurchases((prev) => [newPurchase, ...prev]);
  };

  // If in Admin Panel View
  if (currentView === 'admin' && isAdmin) {
    return (
      <AdminDashboard
        onBackToStore={() => handleNavigate('browse')}
        onProductsChanged={() => {
          getPublishedProducts().then((latest) => {
            if (latest.length > 0) setProducts(latest);
          });
          getFreeNotes().then((latestFree) => {
            if (latestFree.length > 0) setFreeNotes(latestFree);
          });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-red-700 selection:text-white overflow-x-hidden">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={handleOpenProfile}
        onOpenPolicy={handleOpenPolicy}
        purchaseCount={purchases.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExecuteSearch={handleExecuteSearch}
        settings={settings}
      />

      {/* Main Content View (All Features Render Full-Page, No Modal Overlays) */}
      <main className="flex-1 w-full max-w-full min-w-0 pb-20 md:pb-0">
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-red-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-stone-600">
              Loading MKR Academy notes & study materials...
            </p>
          </div>
        ) : currentView === 'home' ? (
          <HomeView
            products={products}
            freeNotes={freeNotes}
            purchases={purchases}
            settings={settings}
            purchasedProductIds={purchasedProductIds}
            onNavigate={handleNavigate}
            onViewDetails={handleOpenProductDetails}
            onBuyNow={handleBuyNow}
            onDownloadNotes={handleDownloadNotes}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onExecuteSearch={handleExecuteSearch}
          />
        ) : currentView === 'free-pdfs' ? (
          <FreePdfsView
            products={products}
            freeNotes={freeNotes}
            onViewDetails={handleOpenProductDetails}
            onNavigateToAdmin={() => handleNavigate('admin')}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={handleSelectFreeSubject}
            previewPdf={previewPdf}
            onPreviewPdf={handlePreviewFreePdf}
            onRequireAuth={() => handleOpenAuth('register')}
          />
        ) : currentView === 'browse' ? (
          <BrowseNotesView
            products={products}
            purchasedProductIds={purchasedProductIds}
            onViewDetails={handleOpenProductDetails}
            onBuyNow={handleBuyNow}
            onDownloadNotes={handleDownloadNotes}
            initialFilters={browseFilters}
          />
        ) : currentView === 'purchases' ? (
          <MyPurchasesView
            onBrowseNotes={() => handleNavigate('browse')}
            onOpenAuth={() => handleOpenAuth('login')}
            selectedReaderPurchase={selectedReaderPurchase}
            onSelectReaderPurchase={handleSelectReaderPurchase}
          />
        ) : currentView === 'previous-papers' ? (
          <PreviousPapersView
            products={products}
            purchasedProductIds={purchasedProductIds}
            purchases={purchases}
            settings={settings}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                handleNavigate('home');
              }
            }}
            onViewDetails={handleOpenProductDetails}
            onBuyNow={handleBuyNow}
            onDownloadNotes={handleDownloadNotes}
            onNavigate={handleNavigate}
          />
        ) : currentView === 'product-details' ? (
          <ProductDetailsView
            product={selectedProduct}
            isPurchased={selectedProduct ? purchasedProductIds.has(selectedProduct.id) : false}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                handleNavigate('browse');
              }
            }}
            onBuyNow={handleBuyNow}
            onDownloadNotes={handleDownloadNotes}
            onRequireAuth={() => handleOpenAuth('register')}
            onNavigate={handleNavigate}
          />
        ) : currentView === 'checkout' ? (
          <CheckoutView
            product={checkoutProduct}
            onBack={() => {
              if (selectedProduct) {
                setCurrentView('product-details');
                try {
                  window.history.pushState(
                    { step: 'product-details', view: 'product-details', id: selectedProduct.id },
                    '',
                    `/product/${selectedProduct.id}`
                  );
                } catch {
                  // Fallback
                }
              } else if (window.history.length > 1) {
                window.history.back();
              } else {
                handleNavigate('browse');
              }
            }}
            onSuccess={handlePurchaseSuccess}
            onRequireAuth={() => handleOpenAuth('login')}
            onOpenPolicy={handleOpenPolicy}
            onNavigateToPurchases={() => handleNavigate('purchases')}
          />
        ) : currentView === 'auth' ? (
          <AuthView
            initialMode={authInitialMode}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                handleNavigate('browse');
              }
            }}
            onSuccess={() => {
              if (checkoutProduct) {
                setCurrentView('checkout');
              } else if (selectedProduct) {
                setCurrentView('product-details');
              } else {
                handleNavigate('browse');
              }
            }}
            onOpenPolicy={handleOpenPolicy}
          />
        ) : currentView === 'profile' ? (
          <StudentProfileView
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                handleNavigate('browse');
              }
            }}
            onNavigateToPurchases={() => handleNavigate('purchases')}
            onNavigate={handleNavigate}
            onOpenPolicy={handleOpenPolicy}
            onOpenAuth={handleOpenAuth}
          />
        ) : currentView === 'policy' ? (
          <PolicyView
            type={policyType}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                handleNavigate('browse');
              }
            }}
            socialLinks={settings?.social}
          />
        ) : (
          <BrowseNotesView
            products={products}
            purchasedProductIds={purchasedProductIds}
            onViewDetails={handleOpenProductDetails}
            onBuyNow={handleBuyNow}
            onDownloadNotes={handleDownloadNotes}
            initialFilters={browseFilters}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenPolicy={handleOpenPolicy}
        onOpenProfile={handleOpenProfile}
        socialLinks={settings?.social}
        settings={settings}
      />

      {/* Unavailable Product Inline/Top Banner if accessed directly */}
      {unavailableProductNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-xs font-semibold px-5 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center space-x-3 max-w-md w-[90%] animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
          <span className="flex-1">{unavailableProductNotice}</span>
          <button
            type="button"
            onClick={() => {
              setUnavailableProductNotice(null);
              handleNavigate('browse');
            }}
            className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
          >
            Browse
          </button>
        </div>
      )}

      {/* Free PDF Download Toast / Resumption Notification */}
      {pendingDownloadToast && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-[10000] bg-emerald-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center space-x-2.5 max-w-md w-[90%]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="flex-1 leading-snug">{pendingDownloadToast}</span>
          <button
            type="button"
            onClick={() => setPendingDownloadToast(null)}
            className="text-emerald-300 hover:text-white font-bold text-xs p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Native Android Double-Back to Exit Toast */}
      {showExitToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] bg-stone-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl border border-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center space-x-2 pointer-events-none">
          <span>Press back again to exit MKR Academy</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
