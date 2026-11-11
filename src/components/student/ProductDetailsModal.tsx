import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  CheckCircle,
  ShieldCheck,
  BookOpen,
  Sparkles,
  ExternalLink,
  Lock,
  Layers,
  ListOrdered,
  Share2,
  Copy,
  Eye,
  Check
} from 'lucide-react';
import { Product } from '../../types';
import { getProductPdfList } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import {
  shareOrCopyProduct,
  storePendingDownload,
  triggerFileDownload,
  openPdfPreview,
  recordDownloadEvent
} from '../../services/downloadService';

interface ProductDetailsModalProps {
  product: Product | null;
  isPurchased?: boolean;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
  onDownloadNotes?: (product: Product) => void;
  onRequireAuth?: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isPurchased = false,
  onClose,
  onBuyNow,
  onDownloadNotes,
  onRequireAuth
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);

  if (!product) return null;

  const originalPrice = product.originalPricePaise / 100;
  const sellingPrice = product.sellingPricePaise / 100;
  const discountPercent =
    originalPrice > sellingPrice
      ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
      : 0;

  const isFree = Boolean(product.isFree || sellingPrice === 0);
  const isUnlocked = Boolean(isPurchased || isFree);

  // Sharing handler
  const handleShare = async () => {
    const res = await shareOrCopyProduct(product);
    if (res.action === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Preview individual PDF
  const handlePreviewPdf = (pdf?: { driveUrl: string }) => {
    const url = pdf?.driveUrl || product.driveFileLink;
    if (url) {
      openPdfPreview(url);
    }
  };

  // Download individual PDF
  const handleDownloadPdf = (pdf?: { id: string; name: string; driveUrl: string }) => {
    if (isFree && !user) {
      // Mandatory sign-up before free PDF download
      storePendingDownload(product, pdf);
      onClose();
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    if (isUnlocked) {
      triggerFileDownload(product, pdf);
      recordDownloadEvent(product, pdf, isFree);
    } else {
      onClose();
      onBuyNow(product);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6 py-3 sm:py-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-3xl max-h-[calc(100dvh-24px)] overflow-y-auto shadow-2xl border border-stone-200 relative flex flex-col my-auto">
        
        {/* Sticky Header Top Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
            title="Share this note"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Cover & Summary */}
        <div className="relative bg-stone-950 text-white p-6 sm:p-8 overflow-hidden rounded-t-3xl">
          <div className="absolute inset-0 opacity-25">
            <img
              src={product.coverImagePath}
              alt={product.title}
              className="w-full h-full object-cover blur-sm"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent"></div>

          <div className="relative space-y-4 max-w-2xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-red-700 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {product.classLevel}
              </span>
              <span className="bg-stone-800 text-stone-200 text-xs font-semibold px-3 py-1 rounded-full">
                {product.medium}
              </span>
              <span className="bg-stone-800 text-stone-200 text-xs font-semibold px-3 py-1 rounded-full">
                {product.subject}
              </span>
              {isFree ? (
                <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>100% Free Note</span>
                </span>
              ) : discountPercent > 0 ? (
                <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {discountPercent}% DISCOUNT
                </span>
              ) : null}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-sans text-white leading-tight">
              {product.title}
            </h1>

            <p className="text-stone-300 text-sm leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Quick Spec Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Exam Target</span>
                <span className="font-semibold text-white">{product.examTarget}</span>
              </div>
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Format</span>
                <span className="font-semibold text-white">{product.fileType || 'PDF Notes'}</span>
              </div>
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Page Count</span>
                <span className="font-semibold text-white">{product.pageCount ? `${product.pageCount} Pages` : 'Comprehensive'}</span>
              </div>
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Medium</span>
                <span className="font-semibold text-white">{product.medium}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          {/* Share & Copy Link Alert */}
          {copied && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Product link copied to clipboard! Share it with classmates and friends.</span>
            </div>
          )}

          {/* Detailed Description */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-red-700" />
              <span>About These Notes</span>
            </h3>
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line bg-stone-50 p-4 rounded-2xl border border-stone-200">
              {product.description}
            </p>
          </div>

          {/* Included PDF Materials (All Unlocked With Single Payment) */}
          {(() => {
            const pdfs = getProductPdfList(product);
            if (pdfs.length === 0) return null;

            return (
              <div className="space-y-3 bg-red-50/50 p-4 sm:p-5 rounded-2xl border border-red-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-extrabold text-stone-900 flex items-center space-x-2">
                    <ListOrdered className="w-4 h-4 text-red-700" />
                    <span>Included PDF Materials ({pdfs.length} Chapter Files)</span>
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {isUnlocked ? '✓ All PDFs Unlocked' : '✓ All Unlocked After 1 Payment'}
                  </span>
                </div>

                <div className="space-y-2">
                  {pdfs.map((pdf, idx) => (
                    <div
                      key={pdf.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white border border-stone-200 text-xs gap-2.5 shadow-xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 font-bold text-[11px] flex items-center justify-center font-mono shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="font-bold text-stone-800 truncate" title={pdf.name}>
                          {pdf.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {isUnlocked ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePreviewPdf(pdf)}
                              className="px-3 py-1.5 rounded-lg border border-stone-300 hover:border-stone-400 hover:bg-stone-50 font-bold text-stone-700 text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                              title="Open PDF Preview"
                            >
                              <Eye className="w-3.5 h-3.5 text-stone-500" />
                              <span>Open PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(pdf)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                              title="Download PDF directly"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onBuyNow(product);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 border border-stone-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <Lock className="w-3 h-3 text-stone-400" />
                            <span>Unlock Material</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Included Chapters / Content Syllabus */}
          {product.chapters && product.chapters.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-red-700" />
                  <span>Included Chapters & Topics ({product.chapters.length})</span>
                </h3>
                <span className="text-xs text-stone-500 font-medium">SEBA / State Board Aligned</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.chapters.map((chapter, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2.5 p-3 rounded-xl bg-white border border-stone-200 hover:border-red-300 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-stone-800 leading-snug">
                      {chapter}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Features & Tags</h4>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium bg-red-50 text-red-800 border border-red-200 px-3 py-1 rounded-full"
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Instructions & Download Policy */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <h4 className="text-sm font-bold text-amber-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Digital Purchase & Download Policy</span>
            </h4>
            <ul className="text-xs text-amber-900/90 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Instant verified PDF download unlocked right after payment.</li>
              <li>Files remain permanently accessible in your <strong>My Purchases</strong> account across any device.</li>
              <li>Encrypted 100% genuine Razorpay payment gateway (UPI, GPay, PhonePe, Paytm, Cards, NetBanking).</li>
              <li>For any payment query or download help, 24/7 WhatsApp support is available.</li>
            </ul>
          </div>
        </div>

        {/* Sticky Bottom Purchase Action Bar */}
        <div className="sticky bottom-0 bg-white border-t border-stone-200 p-4 sm:p-6 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-baseline space-x-3 text-center sm:text-left">
            <div>
              {isFree ? (
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-sans flex items-center space-x-1.5">
                  <span>FREE</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase">100% Free Note</span>
                </span>
              ) : (
                <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-sans">
                  ₹{sellingPrice}
                </span>
              )}
              {originalPrice > sellingPrice && !isFree && sellingPrice > 0 && (
                <span className="ml-2 text-sm text-stone-400 line-through">
                  ₹{originalPrice}
                </span>
              )}
            </div>
            {discountPercent > 0 && !isFree && sellingPrice > 0 && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Save ₹{originalPrice - sellingPrice} ({discountPercent}%)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Share Product Link Button */}
            <button
              type="button"
              onClick={handleShare}
              className="px-4 py-3 rounded-xl border border-stone-300 hover:border-stone-400 hover:bg-stone-50 font-bold text-stone-700 text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              title="Share or Copy Product Link"
            >
              <Share2 className="w-4 h-4 text-stone-500" />
              <span>Share</span>
            </button>

            {isPurchased ? (
              <button
                type="button"
                onClick={() => handleDownloadPdf()}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Note (Purchased)</span>
              </button>
            ) : isFree ? (
              <button
                type="button"
                onClick={() => handleDownloadPdf()}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-800/20 hover:shadow-xl transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{user ? 'Download Free PDF' : 'Sign Up to Download Free PDF'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBuyNow(product);
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-red-800/30 hover:shadow-xl transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Buy Now (₹{sellingPrice}) & Access Materials</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
