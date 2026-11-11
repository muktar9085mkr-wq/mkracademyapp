import React, { useState } from 'react';
import {
  ArrowLeft,
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
  Check,
  ShoppingBag,
  HelpCircle,
  Clock,
  Award
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

interface ProductDetailsViewProps {
  product: Product | null;
  isPurchased?: boolean;
  onBack: () => void;
  onBuyNow: (product: Product) => void;
  onDownloadNotes?: (product: Product) => void;
  onRequireAuth?: () => void;
  onNavigate?: (view: string, filterParam?: any) => void;
}

export const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  product,
  isPurchased = false,
  onBack,
  onBuyNow,
  onDownloadNotes,
  onRequireAuth,
  onNavigate
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);

  if (!product) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Study material not found</h2>
        <p className="text-stone-500 text-sm">
          The requested study material may have been moved or is currently unavailable.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Return to Browse Notes
        </button>
      </div>
    );
  }

  const originalPrice = product.originalPricePaise / 100;
  const sellingPrice = product.sellingPricePaise / 100;
  const discountPercent =
    originalPrice > sellingPrice
      ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
      : 0;

  const isFree = Boolean(product.isFree || sellingPrice === 0);
  const isUnlocked = Boolean(isPurchased || isFree);
  const pdfs = getProductPdfList(product);

  const handleShare = async () => {
    const res = await shareOrCopyProduct(product);
    if (res.action === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePreviewPdf = (pdf?: { driveUrl: string }) => {
    const url = pdf?.driveUrl || product.driveFileLink;
    if (url) {
      openPdfPreview(url);
    }
  };

  const handleDownloadPdf = (pdf?: { id: string; name: string; driveUrl: string }) => {
    if (isFree && !user) {
      storePendingDownload(product, pdf);
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    if (isUnlocked) {
      triggerFileDownload(product, pdf);
      recordDownloadEvent(product, pdf, isFree);
    } else {
      onBuyNow(product);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] bg-stone-50 py-6 sm:py-10 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Bar / Breadcrumb */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-stone-200">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-stone-600 hover:text-stone-900 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500" />
            <span>Back to Notes</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-stone-500">
            <span className="hidden sm:inline">Notes</span>
            <span className="hidden sm:inline text-stone-400">/</span>
            <span className="font-semibold text-stone-700">{product.classLevel}</span>
            <span className="text-stone-400">/</span>
            <span className="font-semibold text-stone-700">{product.subject}</span>
          </div>
        </div>

        {/* Share & Copy Link Alert Banner */}
        {copied && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3.5 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Product direct link copied to clipboard! Share it with your classmates and study groups.</span>
          </div>
        )}

        {/* Main Product Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          
          {/* Hero Banner Section */}
          <div className="relative bg-stone-950 text-white p-6 sm:p-10 lg:p-12 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <img
                src={product.coverImagePath}
                alt={product.title}
                className="w-full h-full object-cover blur-sm"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/85 to-transparent"></div>

            <div className="relative space-y-4 max-w-3xl">
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
                  <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>100% Free Note</span>
                  </span>
                ) : discountPercent > 0 ? (
                  <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {discountPercent}% DISCOUNT
                  </span>
                ) : null}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-sans text-white leading-tight">
                {product.title}
              </h1>

              <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
                {product.shortDescription}
              </p>

              {/* Quick Spec Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Exam Target</span>
                  <span className="font-semibold text-white">{product.examTarget}</span>
                </div>
                <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Format</span>
                  <span className="font-semibold text-white">{product.fileType || 'PDF Notes'}</span>
                </div>
                <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Page Count</span>
                  <span className="font-semibold text-white">{product.pageCount ? `${product.pageCount} Pages` : 'Comprehensive'}</span>
                </div>
                <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Medium</span>
                  <span className="font-semibold text-white">{product.medium}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Details & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 sm:p-10">
            
            {/* Left 2 Columns: Description & Included Materials */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Detailed Description */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-stone-900 flex items-center space-x-2 border-b border-stone-200 pb-2">
                  <BookOpen className="w-5 h-5 text-red-700" />
                  <span>About These Notes</span>
                </h3>
                <div className="text-stone-700 text-sm leading-relaxed whitespace-pre-line bg-stone-50 p-5 rounded-2xl border border-stone-200">
                  {product.description}
                </div>
              </div>

              {/* Included PDF Materials */}
              {pdfs.length > 0 && (
                <div className="space-y-3 bg-red-50/40 p-5 sm:p-6 rounded-2xl border border-red-100">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-red-100">
                    <h3 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center space-x-2">
                      <ListOrdered className="w-4 h-4 text-red-700" />
                      <span>Included PDF Materials ({pdfs.length} Chapter Files)</span>
                    </h3>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                      {isUnlocked ? '✓ All PDFs Unlocked' : '✓ All Unlocked After 1 Payment'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {pdfs.map((pdf, idx) => (
                      <div
                        key={pdf.id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white border border-stone-200 text-xs gap-3 shadow-2xs hover:border-red-200 transition-colors"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center font-mono shrink-0">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="font-bold text-stone-800 truncate text-sm" title={pdf.name}>
                            {pdf.name}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {isUnlocked ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePreviewPdf(pdf)}
                                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadPdf(pdf)}
                                className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center space-x-1.5 text-stone-400 font-semibold">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Highlights & Guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center mb-2">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs">Curriculum Aligned</h4>
                  <p className="text-[11px] text-stone-600">Updated for SEBA / Assam Board examination pattern.</p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs">Instant Access</h4>
                  <p className="text-[11px] text-stone-600">Download link available immediately after payment.</p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                    <Award className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs">MKR Quality</h4>
                  <p className="text-[11px] text-stone-600">Prepared by expert educators for high exam scores.</p>
                </div>
              </div>
            </div>

            {/* Right Column: Pricing & Purchase Card */}
            <div className="space-y-6">
              
              <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 space-y-6 sticky top-20 shadow-xs">
                
                {/* Price Display */}
                <div>
                  <span className="text-stone-500 text-xs uppercase font-bold tracking-wider">Price</span>
                  {isFree ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-3xl font-black text-emerald-700">FREE</span>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
                        100% Free
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-baseline space-x-3">
                      <span className="text-3xl sm:text-4xl font-black text-stone-900 font-sans">
                        ₹{sellingPrice}
                      </span>
                      {originalPrice > sellingPrice && (
                        <span className="text-stone-400 line-through text-base font-semibold">
                          ₹{originalPrice}
                        </span>
                      )}
                      {discountPercent > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                          Save {discountPercent}%
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-stone-500 mt-1">
                    {isFree ? 'Free educational material for students' : 'One-time payment • Lifetime access to all chapters'}
                  </p>
                </div>

                {/* Primary Action Button */}
                <div className="space-y-2.5">
                  {isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf()}
                      className="w-full py-4 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download PDF Notes</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onBuyNow(product)}
                      className="w-full py-4 px-6 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-extrabold text-sm shadow-lg shadow-red-900/20 flex items-center justify-center space-x-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Buy Now – ₹{sellingPrice}</span>
                    </button>
                  )}

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs border border-stone-200 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Share With Friends</span>
                  </button>
                </div>

                {/* Security and Trust Badges */}
                <div className="pt-4 border-t border-stone-200/80 space-y-2.5 text-xs text-stone-600">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>100% Secure Payment via Razorpay</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Instant PDF Download & In-Browser Reader</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-stone-500 shrink-0" />
                    <span>High Quality Printable PDF Format</span>
                  </div>
                </div>

                {/* Support Note */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 text-[11px] text-stone-500 space-y-1">
                  <p className="font-semibold text-stone-700">Need help with this note?</p>
                  <p>Our student support team is available on WhatsApp and email to assist you.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
