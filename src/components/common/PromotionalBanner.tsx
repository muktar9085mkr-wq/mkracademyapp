import React from 'react';
import { Sparkles, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';
import { PromotionalBanner as BannerType } from '../../types';

interface PromotionalBannerProps {
  banner?: BannerType;
  onCtaClick: () => void;
}

export const PromotionalBanner: React.FC<PromotionalBannerProps> = ({ banner, onCtaClick }) => {
  if (!banner || banner.enabled === false) {
    return null;
  }

  return (
    <div className="relative w-full max-w-full overflow-hidden bg-gradient-to-r from-red-900 via-red-800 to-rose-950 text-white rounded-2xl shadow-xl shadow-red-950/20 my-6 border border-red-700/50">
      {/* Background Decorative Circles */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 sm:w-96 h-64 sm:h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 -mb-16 w-56 sm:w-80 h-56 sm:h-80 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left max-w-2xl">
          {banner.badgeText && (
            <div className="inline-flex items-center space-x-1.5 bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{banner.badgeText}</span>
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-sans leading-tight">
            {banner.title}
          </h2>

          <p className="text-red-100/90 text-sm sm:text-base font-normal leading-relaxed max-w-xl">
            {banner.subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs text-red-200 font-medium">
            <span className="flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Assamese & English Medium</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chapter-wise Question Bank</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Download PDF</span>
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <button
            onClick={onCtaClick}
            className="group px-6 py-3.5 bg-white text-red-800 hover:bg-stone-100 font-bold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 cursor-pointer"
          >
            <BookOpen className="w-5 h-5 text-red-700" />
            <span>{banner.ctaText || 'Explore Notes'}</span>
            <ArrowRight className="w-4 h-4 text-red-700 group-hover:translate-x-1 transition-transform" />
          </button>
          <span className="text-[11px] text-red-200/80">Affordable student pricing</span>
        </div>
      </div>
    </div>
  );
};
