import React from 'react';
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  BookMarked,
  Tag
} from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  isPurchased?: boolean;
  onViewDetails: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onDownloadNotes?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isPurchased = false,
  onViewDetails,
  onBuyNow,
  onDownloadNotes
}) => {
  const originalPrice = product.originalPricePaise / 100;
  const sellingPrice = product.sellingPricePaise / 100;
  
  // Real mathematical discount percentage calculation (no false numbers)
  const discountPercent =
    originalPrice > sellingPrice
      ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
      : 0;

  // Category badge style
  const getCategoryBadge = () => {
    switch (product.category) {
      case 'Premium':
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-800 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-md">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Premium</span>
          </span>
        );
      case 'Budget Friendly':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-md">
            <Tag className="w-3 h-3 text-emerald-600" />
            <span>Budget Friendly</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-semibold px-2 py-0.5 rounded-md">
            <span>Standard</span>
          </span>
        );
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-red-200 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Cover Image & Badges */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-100">
          <img
            src={product.coverImagePath || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent"></div>

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 flex-wrap">
            <span className="bg-red-700/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs">
              {product.classLevel}
            </span>

            {discountPercent > 0 && (
              <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Bottom Overlay Info */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs font-medium">
            <span className="bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px]">
              {product.medium}
            </span>
            {product.pageCount ? (
              <span className="flex items-center space-x-1 bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px]">
                <FileText className="w-3 h-3 text-red-400" />
                <span>{product.pageCount} Pages</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Category & Subject Tag */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
              {product.subject}
            </span>
            {getCategoryBadge()}
          </div>

          {/* Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-stone-900 text-base line-clamp-2 hover:text-red-700 cursor-pointer transition-colors leading-snug"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Short Description */}
          <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span className="text-[10px] text-stone-400">+{product.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer & Pricing */}
      <div className="p-4 sm:p-5 pt-0 border-t border-stone-100 mt-2 space-y-3">
        <div className="flex items-baseline justify-between pt-2">
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-stone-900 font-sans">
              ₹{sellingPrice}
            </span>
            {originalPrice > sellingPrice && (
              <span className="ml-2 text-xs text-stone-400 line-through">
                ₹{originalPrice}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            {product.fileType || 'PDF Notes'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onViewDetails(product)}
            className="w-full py-2.5 px-3 rounded-xl border border-stone-300 hover:border-stone-400 hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-stone-500" />
            <span>View Details</span>
          </button>

          {isPurchased ? (
            <button
              onClick={() => onDownloadNotes ? onDownloadNotes(product) : onViewDetails(product)}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Purchased</span>
            </button>
          ) : (
            <button
              onClick={() => onBuyNow(product)}
              className="w-full py-2.5 px-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-red-800/20 transition-all hover:shadow-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Buy Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
