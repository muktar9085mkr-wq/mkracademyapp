import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Download,
  FileText,
  Calendar,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Search,
  Eye,
  ArrowRight,
  AlertCircle,
  Lock,
  ListOrdered,
  X
} from 'lucide-react';
import { Purchase, Product, ProductPdfEntry } from '../../types';
import { getUserPurchases, subscribeToUserPurchases } from '../../services/orderService';
import { getProductPdfList, subscribeToPublishedProducts } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';

interface MyPurchasesViewProps {
  onBrowseNotes: () => void;
  onOpenAuth: () => void;
  selectedReaderPurchase?: Purchase | null;
  onSelectReaderPurchase?: (purchase: Purchase | null) => void;
}

function getGoogleDriveEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return null;
}

function getGoogleDriveDownloadUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

export const MyPurchasesView: React.FC<MyPurchasesViewProps> = ({
  onBrowseNotes,
  onOpenAuth,
  selectedReaderPurchase: propReaderPurchase,
  onSelectReaderPurchase
}) => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [productsMap, setProductsMap] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Controlled or internal fallback for reader
  const [internalReaderPurchase, setInternalReaderPurchase] = useState<Purchase | null>(null);
  const [activeReaderPdf, setActiveReaderPdf] = useState<ProductPdfEntry | null>(null);

  const selectedReaderPurchase = propReaderPurchase !== undefined ? propReaderPurchase : internalReaderPurchase;
  const setSelectedReaderPurchase = (purchase: Purchase | null, initialPdf?: ProductPdfEntry | null) => {
    if (onSelectReaderPurchase) {
      onSelectReaderPurchase(purchase);
    } else {
      setInternalReaderPurchase(purchase);
    }
    setActiveReaderPdf(initialPdf || null);
  };

  useEffect(() => {
    if (!user) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Real-time subscription to user purchases
    const unsubscribePurchases = subscribeToUserPurchases(
      user.uid,
      (userPurchases) => {
        setPurchases(userPurchases);
        setLoading(false);
      },
      (err) => {
        console.warn('Real-time purchases subscription error:', err);
        setLoading(false);
      }
    );

    // 2. Real-time subscription to published products
    const unsubscribeProducts = subscribeToPublishedProducts((prods) => {
      const map = new Map<string, Product>();
      prods.forEach((p) => map.set(p.id, p));
      setProductsMap(map);
    });

    return () => {
      unsubscribePurchases();
      unsubscribeProducts();
    };
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stone-900">Sign In to Access Your Purchases</h2>
          <p className="text-stone-600 text-sm max-w-md mx-auto">
            Your purchased notes are permanently linked to your student account and remain available whenever you log in on any device.
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          Student Sign In
        </button>
      </div>
    );
  }

  const filteredPurchases = purchases.filter((p) =>
    p.productTitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.orderId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200 min-w-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-700 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-sans">
              My Purchased Notes
            </h1>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Access, view in browser, or download your official educational PDF materials anytime.
          </p>
        </div>

        {/* Search within purchases */}
        {purchases.length > 0 && (
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search your notes..."
              className="w-full bg-white text-stone-900 text-xs rounded-xl pl-8 pr-3 py-2 border border-stone-300 focus:outline-none focus:border-red-600"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-red-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-stone-500">Retrieving your verified purchases...</p>
        </div>
      ) : purchases.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-stone-900">No Purchased Notes Yet</h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              You haven't bought any study notes yet. Explore our HSLC 2027, Class 10 & Class 9 note sets to begin your exam preparation.
            </p>
          </div>
          <button
            onClick={onBrowseNotes}
            className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 mx-auto cursor-pointer"
          >
            <span>Browse Educational Notes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Purchased Notes Grid (Original clean MKR Academy layout) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPurchases.map((purchase) => {
            const purchaseDateFormatted = new Date(purchase.purchasedAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            // Live product data synchronization
            const liveProduct = productsMap.get(purchase.productId);
            const pdfList = getProductPdfList(liveProduct || purchase);
            const primaryDriveLink = pdfList[0]?.driveUrl || purchase.driveFileLink || '';

            return (
              <div
                key={purchase.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between w-full max-w-full min-w-0"
              >
                <div>
                  {/* Cover */}
                  <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
                    <img
                      src={purchase.coverImagePath || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'}
                      alt={purchase.productTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      {purchase.approvalMethod === 'admin_manual' ? (
                        <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-xs" title={`Manually approved by ${purchase.approvedByAdminEmail || 'Admin'}`}>
                          <ShieldCheck className="w-3 h-3 text-emerald-200" />
                          <span>Approved by Admin</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-xs">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified Active</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-2">
                      {purchase.productTitle}
                    </h3>

                    <div className="space-y-1 text-xs text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>Purchased On:</span>
                        </span>
                        <span className="font-semibold text-stone-700">{purchaseDateFormatted}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Order ID:</span>
                        <span className="font-mono text-stone-700">{purchase.orderId}</span>
                      </div>
                    </div>

                    {/* Multiple PDF materials list if more than 1 file exists */}
                    {pdfList.length > 1 && (
                      <div className="space-y-2 pt-1 border-t border-stone-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-stone-800 flex items-center space-x-1">
                            <ListOrdered className="w-3.5 h-3.5 text-red-700" />
                            <span>Download Materials ({pdfList.length} PDFs)</span>
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                            All Unlocked
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {pdfList.map((pdf, idx) => {
                            const fileNumber = String(idx + 1).padStart(2, '0');
                            const downloadUrl = getGoogleDriveDownloadUrl(pdf.driveUrl) || pdf.driveUrl;

                            return (
                              <div
                                key={pdf.id || idx}
                                className="bg-stone-50 p-2 rounded-xl border border-stone-200 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center space-x-1.5 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-red-100 text-red-700 font-bold text-[10px] flex items-center justify-center font-mono shrink-0">
                                    {fileNumber}
                                  </span>
                                  <span className="font-semibold text-stone-800 truncate" title={pdf.name}>
                                    {pdf.name}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReaderPurchase(purchase, pdf)}
                                    className="px-2 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-[10px] font-bold cursor-pointer"
                                    title="Read online"
                                  >
                                    Read
                                  </button>
                                  <a
                                    href={downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1"
                                    title="Download PDF"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>PDF</span>
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Card Actions */}
                <div className="p-4 sm:p-5 pt-0 border-t border-stone-100 space-y-2 mt-2">
                  {primaryDriveLink ? (
                    <a
                      href={primaryDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md shadow-blue-800/20 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Note in Google Drive</span>
                    </a>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* In-App Reader */}
                    <button
                      onClick={() => setSelectedReaderPurchase(purchase, pdfList[0] || null)}
                      className="w-full py-2.5 px-3 rounded-xl border border-stone-300 hover:border-stone-400 hover:bg-stone-50 font-bold text-xs text-stone-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-500" />
                      <span>Read Online</span>
                    </button>

                    {/* PDF Download Direct */}
                    <a
                      href={primaryDriveLink ? (getGoogleDriveDownloadUrl(primaryDriveLink) || primaryDriveLink) : `https://drive.google.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-800/20 transition-all cursor-pointer text-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Drive</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App PDF Reader Modal */}
      {selectedReaderPurchase && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-stone-900 text-white rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl border border-stone-800 overflow-hidden">
            
            {/* Reader Toolbar */}
            <div className="bg-stone-900 px-4 sm:px-6 py-3 border-b border-stone-800 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5 truncate">
                <BookOpen className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm font-bold truncate">
                  {activeReaderPdf?.name || selectedReaderPurchase.productTitle}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {(() => {
                  const currentDriveUrl = activeReaderPdf?.driveUrl || selectedReaderPurchase.driveFileLink;
                  const currentDownloadUrl = currentDriveUrl ? (getGoogleDriveDownloadUrl(currentDriveUrl) || currentDriveUrl) : `/api/notes/download/${selectedReaderPurchase.id}`;

                  return (
                    <>
                      {currentDriveUrl && (
                        <a
                          href={currentDriveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Google Drive</span>
                        </a>
                      )}
                      <a
                        href={currentDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download PDF</span>
                      </a>
                    </>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setSelectedReaderPurchase(null)}
                  className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer"
                  title="Close viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chapter Selector Tab Strip (if multiple PDFs are available) */}
            {(() => {
              const liveProduct = productsMap.get(selectedReaderPurchase.productId);
              const allPdfs = getProductPdfList(liveProduct || selectedReaderPurchase);

              if (allPdfs.length <= 1) return null;

              const currentActive = activeReaderPdf || allPdfs[0];

              return (
                <div className="bg-stone-950 px-4 py-2 border-b border-stone-800 overflow-x-auto flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider shrink-0 mr-1">
                    Chapters:
                  </span>
                  {allPdfs.map((pdf, idx) => {
                    const isSelected = (currentActive.id && currentActive.id === pdf.id) || currentActive.driveUrl === pdf.driveUrl;
                    const numStr = String(idx + 1).padStart(2, '0');
                    return (
                      <button
                        key={pdf.id || idx}
                        type="button"
                        onClick={() => setActiveReaderPdf(pdf)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-red-700 text-white shadow-xs'
                            : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        <span className="font-mono text-[10px]">{numStr}.</span>
                        <span className="truncate max-w-[140px] sm:max-w-xs">{pdf.name}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Reader Canvas / Document View */}
            <div className="flex-1 bg-stone-950 p-2 sm:p-4 overflow-y-auto flex justify-center">
              {(() => {
                const targetDriveUrl = activeReaderPdf?.driveUrl || selectedReaderPurchase.driveFileLink;
                const embedUrl = getGoogleDriveEmbedUrl(targetDriveUrl);

                if (embedUrl) {
                  return (
                    <div className="w-full h-full min-h-[500px] flex flex-col rounded-2xl overflow-hidden border border-stone-800 bg-stone-900">
                      <iframe
                        src={embedUrl}
                        title={activeReaderPdf?.name || selectedReaderPurchase.productTitle}
                        className="w-full h-full flex-1 border-0 rounded-2xl"
                        allow="autoplay"
                      />
                    </div>
                  );
                }

                return (
                  <div className="bg-white text-stone-900 rounded-2xl max-w-2xl w-full min-h-[500px] p-6 sm:p-10 shadow-2xl space-y-5 my-auto">
                    <div className="border-b-2 border-red-700 pb-3 text-center space-y-1">
                      <div className="inline-block bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        Official Student Study Material
                      </div>
                      <h2 className="text-xl font-extrabold text-stone-950 font-sans">
                        {activeReaderPdf?.name || selectedReaderPurchase.productTitle}
                      </h2>
                      <p className="text-xs text-stone-500">
                        MKR Academy • Quality Notes • Better Preparation • Better Results
                      </p>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs text-stone-600 flex justify-between items-center">
                      <span>Licensed to: <strong>{user?.displayName || user?.email}</strong></span>
                      <span className="font-mono text-[11px] text-stone-400">Order #{selectedReaderPurchase.orderId}</span>
                    </div>

                    <div className="space-y-4 text-sm leading-relaxed text-stone-800">
                      <p>
                        This educational material is ready to access. Click the button below to view and download this file directly from Google Drive:
                      </p>

                      {targetDriveUrl && (
                        <div className="pt-2 text-center">
                          <a
                            href={targetDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open in Google Drive</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
