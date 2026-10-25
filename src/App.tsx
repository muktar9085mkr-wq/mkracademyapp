/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [policyType, setPolicyType] = useState<'privacy' | 'terms' | 'refund' | 'contact' | null>(null);

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

  const handleNavigate = (view: string, filterParam?: any) => {
    if (view === 'admin') {
      setCurrentView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'free-pdfs') {
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

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleBuyNow = (product: Product) => {
    setCheckoutProduct(product);
  };

  const handleDownloadNotes = (product: Product) => {
    // Har EK PDF student kharidne ke bad actual Google Drive file link hi open hoga
    const purchase = purchases.find((p) => p.productId === product.id);
    const driveUrl = product.driveFileLink || purchase?.driveFileLink;
    if (driveUrl) {
      window.open(driveUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    // Fallback: If no direct drive link stored, redirect to Google Drive
    window.open('https://drive.google.com', '_blank');
  };

  const handleExecuteSearch = () => {
    if (searchQuery.trim()) {
      setBrowseFilters({ search: searchQuery });
      setCurrentView('browse');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        onOpenProfile={() => setProfileModalOpen(true)}
        purchaseCount={purchases.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExecuteSearch={handleExecuteSearch}
        settings={settings}
      />

      {/* Main Content View with mobile safe-padding */}
      <main className="flex-1 w-full max-w-full min-w-0 pb-16 md:pb-0">
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
            onViewDetails={(prod) => setSelectedProduct(prod)}
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
            onViewDetails={(prod) => setSelectedProduct(prod)}
            onNavigateToAdmin={() => handleNavigate('admin')}
          />
        ) : currentView === 'browse' ? (
          <BrowseNotesView
            products={products}
            purchasedProductIds={purchasedProductIds}
            onViewDetails={(prod) => setSelectedProduct(prod)}
            onBuyNow={handleBuyNow}
            onDownloadNotes={handleDownloadNotes}
            initialFilters={browseFilters}
          />
        ) : (
          <MyPurchasesView
            onBrowseNotes={() => handleNavigate('browse')}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenPolicy={(p) => setPolicyType(p)}
        socialLinks={settings?.social}
        settings={settings}
      />

      {/* Mobile-First App Bottom Navigation Bar (Visible on mobile screens) */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={() => setProfileModalOpen(true)}
        purchaseCount={purchases.length}
      />

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isPurchased={purchasedProductIds.has(selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onBuyNow={handleBuyNow}
          onDownloadNotes={handleDownloadNotes}
        />
      )}

      {/* Checkout Modal */}
      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          onSuccess={handlePurchaseSuccess}
          onRequireAuth={() => handleOpenAuth('login')}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
      />

      {/* Student Profile Modal */}
      <StudentProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onNavigateToPurchases={() => handleNavigate('purchases')}
      />

      {/* Legal & Policy Modals */}
      <PolicyModal
        type={policyType}
        onClose={() => setPolicyType(null)}
        socialLinks={settings?.social}
      />
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
