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

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { HomeView } from './components/student/HomeView';
import { BrowseNotesView } from './components/student/BrowseNotesView';
import { FreePdfsView } from './components/student/FreePdfsView';
import { MyPurchasesView } from './components/student/MyPurchasesView';
import { ProductDetailsModal } from './components/student/ProductDetailsModal';
import { CheckoutModal } from './components/student/CheckoutModal';
import { AuthModal } from './components/student/AuthModal';
import { StudentProfileModal } from './components/student/StudentProfileModal';
import { PolicyModal } from './components/common/PolicyModal';
import { AdminDashboard } from './components/admin/AdminDashboard';

function AppContent() {
  const { user, isAdmin, authInitialized } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'browse' | 'free-pdfs' | 'purchases' | 'admin'>('home');
  const [browseFilters, setBrowseFilters] = useState<any>({});

  // Global Data
  const [products, setProducts] = useState<Product[]>([]);
  const [freeNotes, setFreeNotes] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppPublicSettings | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & In-App Readers (Controlled for 1-step back navigation)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [policyType, setPolicyType] = useState<'privacy' | 'terms' | 'refund' | 'contact' | null>(null);

  // In-App Free Notes Reader & Subject Selection
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<Product | null>(null);

  // In-App Purchased Notes Reader
  const [selectedReaderPurchase, setSelectedReaderPurchase] = useState<Purchase | null>(null);

  // Native Android Double-Back to Exit Toast
  const [showExitToast, setShowExitToast] = useState(false);

  // Refs to allow popstate event handler to inspect current state synchronously
  const currentViewRef = useRef(currentView);
  const selectedProductRef = useRef(selectedProduct);
  const checkoutProductRef = useRef(checkoutProduct);
  const authModalOpenRef = useRef(authModalOpen);
  const profileModalOpenRef = useRef(profileModalOpen);
  const policyTypeRef = useRef(policyType);
  const selectedSubjectIdRef = useRef(selectedSubjectId);
  const previewPdfRef = useRef(previewPdf);
  const selectedReaderPurchaseRef = useRef(selectedReaderPurchase);
  const lastBackPressTimeRef = useRef<number>(0);

  // Keep refs in sync with state
  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);
  useEffect(() => { selectedProductRef.current = selectedProduct; }, [selectedProduct]);
  useEffect(() => { checkoutProductRef.current = checkoutProduct; }, [checkoutProduct]);
  useEffect(() => { authModalOpenRef.current = authModalOpen; }, [authModalOpen]);
  useEffect(() => { profileModalOpenRef.current = profileModalOpen; }, [profileModalOpen]);
  useEffect(() => { policyTypeRef.current = policyType; }, [policyType]);
  useEffect(() => { selectedSubjectIdRef.current = selectedSubjectId; }, [selectedSubjectId]);
  useEffect(() => { previewPdfRef.current = previewPdf; }, [previewPdf]);
  useEffect(() => { selectedReaderPurchaseRef.current = selectedReaderPurchase; }, [selectedReaderPurchase]);

  // Global Android / Browser 1-Step Back Navigation Controller
  useEffect(() => {
    // Initialize root history entry so device back button has a stack frame
    if (!window.history.state) {
      window.history.replaceState({ step: 'root', view: 'home' }, '');
    }

    const handlePopState = () => {
      // 1. If any in-app PDF reader / preview is open, close it (1 step back)
      if (previewPdfRef.current) {
        setPreviewPdf(null);
        return;
      }
      if (selectedReaderPurchaseRef.current) {
        setSelectedReaderPurchase(null);
        return;
      }
      // 2. If checkout modal is open, close it (1 step back)
      if (checkoutProductRef.current) {
        setCheckoutProduct(null);
        return;
      }
      // 3. If product details modal is open, close it (1 step back)
      if (selectedProductRef.current) {
        setSelectedProduct(null);
        return;
      }
      // 4. If auth modal is open, close it (1 step back)
      if (authModalOpenRef.current) {
        setAuthModalOpen(false);
        return;
      }
      // 5. If profile modal is open, close it (1 step back)
      if (profileModalOpenRef.current) {
        setProfileModalOpen(false);
        return;
      }
      // 6. If policy modal is open, close it (1 step back)
      if (policyTypeRef.current) {
        setPolicyType(null);
        return;
      }
      // 7. If inside Free Notes and a specific subject is open, go back to all subjects (1 step back)
      if (selectedSubjectIdRef.current) {
        setSelectedSubjectId(null);
        return;
      }
      // 8. If in any secondary view (browse, free-pdfs, purchases, admin), go back to home (1 step back)
      if (currentViewRef.current !== 'home') {
        setCurrentView('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 9. If already on Home Screen with no modals open:
      // Standard Android UX: Double-tap back within 2 seconds to exit, otherwise show toast
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        // Allow app exit
        window.history.back();
      } else {
        lastBackPressTimeRef.current = now;
        // Re-push root state to trap single back press and protect from accidental app close
        window.history.pushState({ step: 'root', view: 'home' }, '');
        setShowExitToast(true);
        setTimeout(() => {
          setShowExitToast(false);
        }, 2000);
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

    // Real-time synchronization for published products (works for both visitors & users)
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

    // Immediately load student purchases and keep them updated in real-time
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

    // Refresh products catalog when user logs in so that any auth-dependent changes sync immediately
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

  // Controlled Navigation with history stack tracking
  const handleNavigate = (view: string, filterParam?: any) => {
    if (view === currentView) return;

    window.history.pushState({ step: 'view', view }, '');
    if (view === 'admin') {
      setCurrentView('admin');
    } else if (view === 'free-pdfs') {
      setCurrentView('free-pdfs');
    } else if (view === 'browse') {
      setBrowseFilters(filterParam || {});
      setCurrentView('browse');
    } else if (view === 'purchases') {
      setCurrentView('purchases');
    } else {
      setCurrentView('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1-Step Back Controlled Open & Close Handlers
  const handleOpenProductDetails = (product: Product) => {
    window.history.pushState({ step: 'product-details', id: product.id }, '');
    setSelectedProduct(product);
  };

  const handleCloseProductDetails = () => {
    if (window.history.state?.step === 'product-details') {
      window.history.back();
    } else {
      setSelectedProduct(null);
    }
  };

  const handleBuyNow = (product: Product) => {
    window.history.pushState({ step: 'checkout', id: product.id }, '');
    setCheckoutProduct(product);
  };

  const handleCloseCheckout = () => {
    if (window.history.state?.step === 'checkout') {
      window.history.back();
    } else {
      setCheckoutProduct(null);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    window.history.pushState({ step: 'auth', mode }, '');
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    if (window.history.state?.step === 'auth') {
      window.history.back();
    } else {
      setAuthModalOpen(false);
    }
  };

  const handleOpenProfile = () => {
    window.history.pushState({ step: 'profile' }, '');
    setProfileModalOpen(true);
  };

  const handleCloseProfile = () => {
    if (window.history.state?.step === 'profile') {
      window.history.back();
    } else {
      setProfileModalOpen(false);
    }
  };

  const handleOpenPolicy = (type: 'privacy' | 'terms' | 'refund' | 'contact') => {
    window.history.pushState({ step: 'policy', type }, '');
    setPolicyType(type);
  };

  const handleClosePolicy = () => {
    if (window.history.state?.step === 'policy') {
      window.history.back();
    } else {
      setPolicyType(null);
    }
  };

  const handleSelectFreeSubject = (subjectId: string | null) => {
    if (subjectId) {
      window.history.pushState({ step: 'free-subject', subjectId }, '');
      setSelectedSubjectId(subjectId);
    } else {
      if (window.history.state?.step === 'free-subject') {
        window.history.back();
      } else {
        setSelectedSubjectId(null);
      }
    }
  };

  const handlePreviewFreePdf = (prod: Product | null) => {
    if (prod) {
      window.history.pushState({ step: 'pdf-preview', id: prod.id }, '');
      setPreviewPdf(prod);
    } else {
      if (window.history.state?.step === 'pdf-preview') {
        window.history.back();
      } else {
        setPreviewPdf(null);
      }
    }
  };

  const handleSelectReaderPurchase = (purchase: Purchase | null) => {
    if (purchase) {
      window.history.pushState({ step: 'purchase-reader', id: purchase.orderId }, '');
      setSelectedReaderPurchase(purchase);
    } else {
      if (window.history.state?.step === 'purchase-reader') {
        window.history.back();
      } else {
        setSelectedReaderPurchase(null);
      }
    }
  };

  const handleDownloadNotes = (product: Product) => {
    const purchase = purchases.find((p) => p.productId === product.id);
    const driveUrl = product.driveFileLink || purchase?.driveFileLink;
    if (driveUrl) {
      window.open(driveUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    window.open('https://drive.google.com', '_blank');
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
        onBackToStore={() => handleNavigate('home')}
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
        purchaseCount={purchases.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExecuteSearch={handleExecuteSearch}
        settings={settings}
      />

      {/* Main Content View with mobile safe-padding */}
      <main className="flex-1 w-full max-w-full min-w-0 pb-28 md:pb-0">
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
        ) : (
          <MyPurchasesView
            onBrowseNotes={() => handleNavigate('browse')}
            onOpenAuth={() => handleOpenAuth('login')}
            selectedReaderPurchase={selectedReaderPurchase}
            onSelectReaderPurchase={handleSelectReaderPurchase}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenPolicy={handleOpenPolicy}
        socialLinks={settings?.social}
        settings={settings}
      />

      {/* Mobile-First App Bottom Navigation Bar (Visible on mobile screens) */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={handleOpenProfile}
        purchaseCount={purchases.length}
      />

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isPurchased={purchasedProductIds.has(selectedProduct.id)}
          onClose={handleCloseProductDetails}
          onBuyNow={handleBuyNow}
          onDownloadNotes={handleDownloadNotes}
        />
      )}

      {/* Checkout Modal */}
      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          onClose={handleCloseCheckout}
          onSuccess={handlePurchaseSuccess}
          onRequireAuth={() => handleOpenAuth('login')}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleCloseAuth}
        initialMode={authInitialMode}
      />

      {/* Student Profile Modal */}
      <StudentProfileModal
        isOpen={profileModalOpen}
        onClose={handleCloseProfile}
        onNavigateToPurchases={() => handleNavigate('purchases')}
      />

      {/* Legal & Policy Modals */}
      <PolicyModal
        type={policyType}
        onClose={handleClosePolicy}
        socialLinks={settings?.social}
      />

      {/* Native Android Double-Back to Exit Toast */}
      {showExitToast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[10000] bg-stone-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl border border-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center space-x-2 pointer-events-none">
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
