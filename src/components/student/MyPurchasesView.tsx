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
  Loader2,
  FolderArchive,
  Layers,
  ChevronDown,
  ChevronUp,
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

  // ZIP download state per purchase ID
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null);
  const [zipMessage, setZipMessage] = useState<{ id: string; text: string; isError?: boolean } | null>(null);

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

  // Real-time synchronization: sync purchases & live products catalog
  useEffect(() => {
    if (!user) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Subscribe to user purchases
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

    // 2. Subscribe to live published products so newly added/updated PDFs sync in real-time
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

  // Handle Download All as ZIP
  const handleDownloadAllZip = async (purchase: Purchase, pdfs: ProductPdfEntry[]) => {
    if (pdfs.length === 0) return;
    setDownloadingZipId(purchase.id);
    setZipMessage({ id: purchase.id, text: 'Preparing ZIP bundle with all chapter PDFs...', isError: false });

    try {
      const response = await fetch('/api/notes/bundle-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: purchase.productTitle,
          pdfList: pdfs
        })
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Server could not bundle ZIP file');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const cleanTitle = purchase.productTitle.replace(/[^a-zA-Z0-9_\u0980-\u09FF\s-]/g, '').trim().replace(/\s+/g, '_') || 'MKR_Academy_Notes';
      link.download = `${cleanTitle}_All_Materials.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setZipMessage({ id: purchase.id, text: 'ZIP file downloaded successfully! All chapter files are included.', isError: false });
      setTimeout(() => setZipMessage(null), 5000);
    } catch (err: any) {
      console.warn('Download ZIP failed:', err);
      setZipMessage({
        id: purchase.id,
        text: `ZIP generation note: ${err?.message || 'Please use individual chapter download buttons below'}.`,
        isError: true
      });
      setTimeout(() => setZipMessage(null), 7000);
    } finally {
      setDownloadingZipId(null);
    }
  };

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
            Access, view online, or download all chapter PDF materials unlocked under your student account.
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
          <p className="text-xs text-stone-500">Retrieving your verified purchases & materials...</p>
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
        /* Purchased Notes List */
        <div className="space-y-6">
          {filteredPurchases.map((purchase) => {
            const purchaseDateFormatted = new Date(purchase.purchasedAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            // Retrieve all PDFs for this product: live product takes precedence for instant real-time sync
            const liveProduct = productsMap.get(purchase.productId);
            const pdfList = getProductPdfList(liveProduct || purchase);
            const isDownloadingThisZip = downloadingZipId === purchase.id;

            return (
              <div
                key={purchase.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between w-full max-w-full min-w-0"
              >
                {/* Product Summary Header Card */}
                <div className="p-4 sm:p-6 bg-gradient-to-r from-stone-900 to-stone-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={purchase.coverImagePath || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'}
                      alt={purchase.productTitle}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border border-stone-800 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="bg-red-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Official MKR Notes
                        </span>
                        {purchase.approvalMethod === 'admin_manual' ? (
                          <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1" title={`Manually approved by ${purchase.approvedByAdminEmail || 'Admin'}`}>
                            <ShieldCheck className="w-3 h-3 text-emerald-200" />
                            <span>Approved by Admin</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Active</span>
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                        {purchase.productTitle}
                      </h2>

                      <div className="flex items-center space-x-4 text-xs text-stone-300 pt-0.5 flex-wrap gap-y-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>Purchased: {purchaseDateFormatted}</span>
                        </span>
                        <span>Order ID: <strong className="font-mono text-stone-200">{purchase.orderId}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Top quick action: Download All as ZIP */}
                  {pdfList.length > 0 && (
                    <div className="shrink-0 flex items-center">
                      <button
                        type="button"
                        disabled={isDownloadingThisZip}
                        onClick={() => handleDownloadAllZip(purchase, pdfList)}
                        className={`w-full sm:w-auto px-5 py-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer ${
                          isDownloadingThisZip
                            ? 'bg-stone-700 text-stone-300 cursor-wait'
                            : 'bg-red-700 hover:bg-red-600 text-white active:scale-95 shadow-red-950/40'
                        }`}
                      >
                        {isDownloadingThisZip ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Generating ZIP...</span>
                          </>
                        ) : (
                          <>
                            <FolderArchive className="w-4 h-4 text-white" />
                            <span>Download All (ZIP)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Status message for ZIP download if any */}
                {zipMessage && zipMessage.id === purchase.id && (
                  <div className={`px-4 sm:px-6 py-2.5 text-xs font-semibold flex items-center space-x-2 border-b ${
                    zipMessage.isError ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  }`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{zipMessage.text}</span>
                  </div>
                )}

                {/* 2. DEDICATED DOWNLOAD MATERIALS SECTION */}
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                        <Download className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
                        Download Materials
                      </h3>
                      <span className="bg-stone-100 text-stone-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
                        {pdfList.length} {pdfList.length === 1 ? 'Chapter PDF' : 'Chapter PDFs'}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-500 hidden sm:block">
                      100% Unlocked • Permanent Access
                    </div>
                  </div>

                  {/* List of All PDFs with clear numbering (01, 02, 03...) */}
                  {pdfList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">
                      Materials are being organized by the instructor. You will be able to access them shortly.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {pdfList.map((pdf, idx) => {
                        const fileNumber = String(idx + 1).padStart(2, '0');
                        const downloadUrl = getGoogleDriveDownloadUrl(pdf.driveUrl) || pdf.driveUrl;

                        return (
                          <div
                            key={pdf.id || idx}
                            className="bg-stone-50 hover:bg-stone-100/80 transition-colors p-3.5 sm:p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            {/* File Numbering and PDF Name */}
                            <div className="flex items-center space-x-3 min-w-0">
                              <span className="w-8 h-8 rounded-xl bg-red-700 text-white font-extrabold text-xs flex items-center justify-center font-mono shrink-0 shadow-xs">
                                {fileNumber}
                              </span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-stone-900 text-sm leading-snug truncate sm:whitespace-normal">
                                  {pdf.name}
                                </h4>
                                <div className="flex items-center space-x-2 text-[11px] text-stone-500 pt-0.5">
                                  <span className="inline-flex items-center space-x-1">
                                    <FileText className="w-3 h-3 text-stone-400" />
                                    <span>Verified PDF Document</span>
                                  </span>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-semibold">Ready to Read & Save</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons: Download + Read Online + Drive Link */}
                            <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                              {/* Read Online in Viewer */}
                              <button
                                type="button"
                                onClick={() => setSelectedReaderPurchase(purchase, pdf)}
                                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                                title="Read online inside the website"
                              >
                                <Eye className="w-3.5 h-3.5 text-stone-600" />
                                <span>Read Online</span>
                              </button>

                              {/* Individual Download Button */}
                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                                title="Download PDF to device"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>

                              {/* Open Direct on Google Drive */}
                              <a
                                href={pdf.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center transition-colors cursor-pointer"
                                title="Open this chapter directly in Google Drive"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
