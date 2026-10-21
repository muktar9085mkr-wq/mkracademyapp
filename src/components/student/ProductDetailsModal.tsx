import React from 'react';
import {
  X,
  FileText,
  Download,
  CheckCircle,
  ShieldCheck,
  BookOpen,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Lock,
  Layers
} from 'lucide-react';
import { Product } from '../../types';

interface ProductDetailsModalProps {
  product: Product | null;
  isPurchased?: boolean;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
  onDownloadNotes?: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isPurchased = false,
  onClose,
  onBuyNow,
  onDownloadNotes
}) => {
  if (!product) return null;

  const originalPrice = product.originalPricePaise / 100;
  const sellingPrice = product.sellingPricePaise / 100;
  const discountPercent =
    originalPrice > sellingPrice
      ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 relative flex flex-col">
        
        {/* Sticky Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>

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
              {product.driveFileLink && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <ExternalLink className="w-3 h-3" />
                  <span>Google Drive File</span>
                </span>
              )}
              {discountPercent > 0 && (
                <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {discountPercent}% DISCOUNT
                </span>
              )}
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
              {product.isFree || sellingPrice === 0 ? (
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-sans flex items-center space-x-1.5">
                  <span>FREE</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase">100% Free Note</span>
                </span>
              ) : (
                <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-sans">
                  ₹{sellingPrice}
                </span>
              )}
              {originalPrice > sellingPrice && !product.isFree && sellingPrice > 0 && (
                <span className="ml-2 text-sm text-stone-400 line-through">
                  ₹{originalPrice}
                </span>
              )}
            </div>
            {discountPercent > 0 && !product.isFree && sellingPrice > 0 && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Save ₹{originalPrice - sellingPrice} ({discountPercent}%)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {isPurchased ? (
              product.driveFileLink ? (
                <a
                  href={product.driveFileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md shadow-blue-800/20 cursor-pointer transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Drive PDF (Purchased)</span>
                </a>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    if (onDownloadNotes) onDownloadNotes(product);
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Open Drive PDF</span>
                </button>
              )
            ) : product.isFree || sellingPrice === 0 ? (
              product.driveFileLink ? (
                <a
                  href={product.driveFileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-800/20 hover:shadow-xl transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Free PDF in Google Drive</span>
                </a>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    if (onDownloadNotes) onDownloadNotes(product);
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-800/20 hover:shadow-xl transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Access Free PDF</span>
                </button>
              )
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onBuyNow(product);
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-red-800/30 hover:shadow-xl transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Buy Now (₹{sellingPrice}) & Access Drive File</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
