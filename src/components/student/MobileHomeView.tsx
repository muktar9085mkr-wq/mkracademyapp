import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Clock,
  FileText,
  ShoppingBag,
  Video,
  HelpCircle,
  Download,
  MessageCircle,
  MoreHorizontal,
  ChevronRight,
  PenTool,
  FlaskConical,
  Calculator,
  Globe
} from 'lucide-react';
import { Product, AppPublicSettings, Purchase } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { computeEffectiveDaysLeft, formatWhatsAppDigits } from '../../services/settingsService';
import { MobileMediaCarousel } from './MobileMediaCarousel';

interface MobileHomeViewProps {
  products: Product[];
  freeNotes?: Product[];
  settings: AppPublicSettings | null;
  purchasedProductIds: Set<string>;
  purchases?: Purchase[];
  onNavigate: (view: string, filterParam?: any) => void;
  onViewDetails: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onDownloadNotes: (product: Product) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteSearch: () => void;
}

interface LastReadingItem {
  id: string;
  title: string;
  subject: string;
  coverImagePath?: string;
  classLevel?: string;
  timestamp?: number;
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  products,
  freeNotes = [],
  settings,
  purchasedProductIds,
  purchases = [],
  onNavigate,
  onViewDetails,
  onBuyNow,
  onDownloadNotes,
  searchQuery,
  onSearchChange,
  onExecuteSearch
}) => {
  const { user } = useAuth();
  const [lastReading, setLastReading] = useState<LastReadingItem | null>(null);

  // 1. Compute Days Left from Admin Settings (supports manual editable days or auto date countdown)
  const daysLeft = computeEffectiveDaysLeft(settings?.countdown);
  const daysLeftLabel = settings?.countdown?.label?.trim() || 'Days Left';

  // 2. Load "Continue Reading" state from localStorage or recent purchases
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mkr_last_reading');
      if (stored) {
        setLastReading(JSON.parse(stored));
      } else if (purchases.length > 0) {
        const mostRecent = purchases[0];
        setLastReading({
          id: mostRecent.productId,
          title: mostRecent.productTitle,
          subject: 'Purchased Notes',
          coverImagePath: mostRecent.coverImagePath
        });
      } else if (products.length > 0) {
        const topFeatured = products.find((p) => p.featured) || products[0];
        setLastReading({
          id: topFeatured.id,
          title: topFeatured.title,
          subject: topFeatured.subject,
          coverImagePath: topFeatured.coverImagePath,
          classLevel: topFeatured.classLevel
        });
      }
    } catch {
      // Ignore storage errors
    }
  }, [purchases, products]);

  // 3. Dynamic statistics from real Firestore data (no hardcoded values)
  const publishedProducts = products.filter((p) => p.published !== false);
  const publishedFreeNotes = freeNotes.filter((n) => n.published !== false);

  const allAvailablePdfs: Product[] = [...publishedProducts, ...publishedFreeNotes].filter(
    (item, index, self) => item?.id && index === self.findIndex((t) => t.id === item.id)
  );

  const subjectKeySet = new Set<string>([
    'mathematics',
    'general science',
    'english',
    'social science',
    'assamese'
  ]);
  allAvailablePdfs.forEach((item) => {
    if (item.subject && item.subject.trim()) {
      const normalized = item.subject.trim().toLowerCase();
      subjectKeySet.add(normalized === 'science' ? 'general science' : normalized);
    }
  });
  const totalSubjectsCount = subjectKeySet.size;
  const availablePdfsCount = allAvailablePdfs.length;
  const yourPurchasesCount = purchases.length;

  // 4. LATEST PDF UPDATES - Real-time merged and sorted from Firestore
  // Combines published study notes & free chapter notes, latest upload date first
  const allLatestItems: Product[] = [...allAvailablePdfs]
    .sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    })
    .slice(0, 8); // Display latest 5 to 8 entries

  // Helper for human-readable relative time
  const getRelativeTime = (isoDate?: string) => {
    if (!isoDate) return 'Recently added';
    const past = new Date(isoDate).getTime();
    if (!Number.isFinite(past)) return 'Recently added';
    const current = Date.now();
    const diffHours = Math.floor((current - past) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(isoDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // 5. Subject configurations
  const subjectList = [
    {
      id: 'Assamese',
      name: 'Assamese',
      sub: 'অসমীয়া',
      icon: PenTool,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-600',
      textColor: 'text-amber-900',
      badge: 'SEBA'
    },
    {
      id: 'English',
      name: 'English',
      sub: 'ইংৰাজী',
      icon: BookOpen,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-600',
      textColor: 'text-blue-900',
      badge: 'Grammar & Prose'
    },
    {
      id: 'General Science',
      name: 'Science',
      sub: 'সাধাৰণ বিজ্ঞান',
      icon: FlaskConical,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-600',
      textColor: 'text-emerald-900',
      badge: 'Physics, Chem, Bio'
    },
    {
      id: 'Mathematics',
      name: 'Mathematics',
      sub: 'গণিত',
      icon: Calculator,
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      iconBg: 'bg-purple-600',
      textColor: 'text-purple-900',
      badge: 'Formulas & Solved'
    },
    {
      id: 'Social Science',
      name: 'Social Science',
      sub: 'সমাজ বিজ্ঞান',
      icon: Globe,
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      iconBg: 'bg-rose-600',
      textColor: 'text-rose-900',
      badge: 'History & Geo'
    }
  ];

  const continueReadingBlock = lastReading ? (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
          Continue Reading
        </h2>
        <span className="text-[11px] text-red-700 font-bold flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
          <span>Recent Note</span>
        </span>
      </div>

      <div className="bg-white rounded-3xl p-3.5 md:p-4 border border-stone-200 shadow-xs flex items-center space-x-3.5">
        {/* Thumbnail */}
        <div className="w-16 h-16 md:w-18 md:h-18 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200 shadow-inner relative">
          <img
            src={
              lastReading.coverImagePath ||
              'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=200&q=80'
            }
            alt={lastReading.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent flex items-end p-1">
            <span className="text-[8px] font-black text-white bg-red-700 px-1 py-0.2 rounded uppercase">
              PDF
            </span>
          </div>
        </div>

        {/* Title & Info */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
            {lastReading.subject} {lastReading.classLevel ? `• ${lastReading.classLevel}` : ''}
          </span>
          <h3 className="text-xs md:text-sm font-bold text-stone-900 truncate">
            {lastReading.title}
          </h3>
          <p className="text-[10px] md:text-[11px] text-stone-500">
            Continue exam preparation right where you left off
          </p>
        </div>

        {/* Action */}
        <button
          type="button"
          onClick={() => {
            const target =
              products.find((p) => p.id === lastReading.id) ||
              freeNotes.find((n) => n.id === lastReading.id);
            if (target) {
              onViewDetails(target);
            } else {
              onNavigate('browse');
            }
          }}
          className="px-3 md:px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs active:scale-95 transition-transform cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="w-full max-w-7xl mx-auto md:px-6 lg:px-8 bg-stone-50 text-stone-900 pb-24 md:pb-14 md:pt-6 space-y-5 md:space-y-7 animate-in fade-in duration-200 overflow-x-hidden">
      {/* ==============================================================
          1. TOP HERO GRID (Media Carousel + Stats & Continue Reading on Desktop)
          ============================================================== */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start space-y-5 lg:space-y-0">
        {/* Homepage Media Carousel (YouTube + Google Drive Dynamic Slider) */}
        <div className="lg:col-span-7">
          <MobileMediaCarousel onNavigate={onNavigate} />
        </div>

        {/* Right Hero Column on Desktop: 4 Real-Time Statistics Cards + Continue Reading */}
        <div className="lg:col-span-5 space-y-5 lg:space-y-4">
          <section className="px-4 md:px-0">
            <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-2 gap-2 md:gap-3">
              {/* 1. Days Left */}
              <button
                type="button"
                onClick={() => onNavigate('browse', { classLevel: 'HSLC 2027' })}
                aria-label={`${daysLeft} ${daysLeftLabel} — View HSLC 2027 Study Notes`}
                className="group w-full bg-white rounded-2xl p-2.5 md:p-4 border border-stone-200/90 shadow-xs hover:shadow-md hover:border-red-300 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 text-center flex flex-col items-center justify-center min-h-[72px] md:min-h-[96px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-600/20"
              >
                <div className="w-6 h-6 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-red-50 text-red-700 group-hover:scale-105 transition-transform flex items-center justify-center mb-1 md:mb-1.5">
                  <Clock className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                </div>
                <span className="text-xs sm:text-sm md:text-lg font-black text-stone-900 leading-tight tabular-nums">
                  {daysLeft}d
                </span>
                <span className="text-[9.5px] md:text-xs font-semibold text-stone-500 tracking-tight leading-tight truncate max-w-full mt-0.5">
                  {daysLeftLabel}
                </span>
              </button>

              {/* 2. Subjects */}
              <button
                type="button"
                onClick={() => onNavigate('subjects')}
                aria-label={`${totalSubjectsCount} Subjects — View all subjects`}
                className="group w-full bg-white rounded-2xl p-2.5 md:p-4 border border-stone-200/90 shadow-xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 text-center flex flex-col items-center justify-center min-h-[72px] md:min-h-[96px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <div className="w-6 h-6 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-blue-50 text-blue-700 group-hover:scale-105 transition-transform flex items-center justify-center mb-1 md:mb-1.5">
                  <BookOpen className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                </div>
                <span className="text-xs sm:text-sm md:text-lg font-black text-stone-900 leading-tight tabular-nums">
                  {totalSubjectsCount}
                </span>
                <span className="text-[9.5px] md:text-xs font-semibold text-stone-500 tracking-tight leading-tight mt-0.5">
                  Subjects
                </span>
              </button>

              {/* 3. Available PDFs */}
              <button
                type="button"
                onClick={() => onNavigate('browse')}
                aria-label={`${availablePdfsCount} Available PDFs — Open PDF Library`}
                className="group w-full bg-white rounded-2xl p-2.5 md:p-4 border border-stone-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 text-center flex flex-col items-center justify-center min-h-[72px] md:min-h-[96px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              >
                <div className="w-6 h-6 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-105 transition-transform flex items-center justify-center mb-1 md:mb-1.5">
                  <FileText className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                </div>
                <span className="text-xs sm:text-sm md:text-lg font-black text-stone-900 leading-tight tabular-nums">
                  {availablePdfsCount}
                </span>
                <span className="text-[9.5px] md:text-xs font-semibold text-stone-500 tracking-tight leading-tight mt-0.5">
                  Available PDFs
                </span>
              </button>

              {/* 4. Your Purchases */}
              <button
                type="button"
                onClick={() => onNavigate('purchases')}
                aria-label={`${yourPurchasesCount} Your Purchases — View purchased notes`}
                className="group w-full bg-white rounded-2xl p-2.5 md:p-4 border border-stone-200/90 shadow-xs hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 text-center flex flex-col items-center justify-center min-h-[72px] md:min-h-[96px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-600/20"
              >
                <div className="w-6 h-6 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-purple-50 text-purple-700 group-hover:scale-105 transition-transform flex items-center justify-center mb-1 md:mb-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                </div>
                <span className="text-xs sm:text-sm md:text-lg font-black text-stone-900 leading-tight tabular-nums">
                  {yourPurchasesCount}
                </span>
                <span className="text-[9.5px] md:text-xs font-semibold text-stone-500 tracking-tight leading-tight truncate max-w-full mt-0.5">
                  Your Purchases
                </span>
              </button>
            </div>
          </section>

          {/* Continue Reading placed inside right hero column on Desktop */}
          {continueReadingBlock && (
            <section className="hidden lg:block">{continueReadingBlock}</section>
          )}
        </div>
      </div>

      {/* ==============================================================
          2. QUICK ACCESS FEATURES (4 cols Mobile/Tablet, 8 cols Desktop)
          ============================================================== */}
      <section className="px-4 md:px-0 space-y-2">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 px-0.5">
          Quick Access
        </h2>
        <div className="bg-white rounded-3xl p-3.5 md:p-5 border border-stone-200 shadow-xs">
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-y-3 gap-x-2 md:gap-4 text-center">
            {/* 1. Study Notes */}
            <button
              type="button"
              onClick={() => onNavigate('browse')}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center shadow-xs group-hover:bg-red-100 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-bold text-stone-800 mt-1.5 leading-tight">
                Study Notes
              </span>
            </button>

            {/* 2. Video Classes */}
            <a
              href={settings?.social?.youtube || 'https://youtube.com/@mkr_academy'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-xs group-hover:bg-blue-100 transition-colors">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-bold text-stone-800 mt-1.5 leading-tight">
                Video Classes
              </span>
            </a>

            {/* 3. Courses */}
            <button
              type="button"
              onClick={() => onNavigate('browse', { category: 'Premium' })}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-xs group-hover:bg-amber-100 transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-bold text-stone-800 mt-1.5 leading-tight">
                Courses
              </span>
            </button>

            {/* 4. Previous Papers */}
            <button
              type="button"
              onClick={() => onNavigate('previous-papers')}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs group-hover:bg-emerald-100 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-bold text-stone-800 mt-1.5 leading-tight">
                Previous Papers
              </span>
            </button>

            {/* 5. Important Questions */}
            <button
              type="button"
              onClick={() => onNavigate('browse', { tag: 'Important Questions' })}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shadow-xs group-hover:bg-purple-100 transition-colors">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-bold text-stone-800 mt-1.5 leading-tight">
                Important Qs
              </span>
            </button>

            {/* 6. Downloads */}
            <button
              type="button"
              onClick={() => onNavigate('purchases')}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shadow-xs group-hover:bg-rose-100 transition-colors">
                <Download className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-bold text-stone-800 mt-1.5 leading-tight">
                Downloads
              </span>
            </button>

            {/* 7. Doubt Support (Direct WhatsApp) */}
            <a
              href={`https://wa.me/${formatWhatsAppDigits(settings?.social?.whatsapp)}?text=${encodeURIComponent(
                'Hello MKR Academy, I have a doubt regarding HSLC / Class 10 study materials.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs group-hover:bg-emerald-200 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-bold text-stone-800 mt-1.5 leading-tight">
                Doubt Support
              </span>
            </a>

            {/* 8. More */}
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center shadow-xs group-hover:bg-stone-200 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-bold text-stone-800 mt-1.5 leading-tight">
                More
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ==============================================================
          3. CONTINUE READING SECTION (Mobile & Tablet Flow)
          ============================================================== */}
      {continueReadingBlock && (
        <section className="px-4 md:px-0 lg:hidden">{continueReadingBlock}</section>
      )}

      {/* ==============================================================
          4. EXPLORE SUBJECTS + LATEST PDF UPDATES
          Stacked on Mobile/Tablet, Two-Column on Desktop
          ============================================================== */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start space-y-5 lg:space-y-0">
        {/* EXPLORE SUBJECTS */}
        <section className="lg:col-span-5 px-4 md:px-0 space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
              Explore Subjects
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('browse')}
              className="text-[11px] font-bold text-red-700 hover:text-red-800 flex items-center space-x-0.5 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-2.5 md:gap-3">
            {subjectList.map((subj, index) => {
              const Icon = subj.icon;
              // Span the 5th item cleanly on 2-col Mobile and 3-col Tablet; single row on 1-col Desktop stack
              const isLastOdd = index === 4;

              return (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => onNavigate('browse', { subject: subj.id })}
                  className={`${subj.bg} ${subj.border} ${
                    isLastOdd ? 'col-span-2 md:col-span-2 lg:col-span-1' : ''
                  } border rounded-2xl p-3 md:p-3.5 text-left flex items-center space-x-3 shadow-xs hover:shadow-sm active:scale-98 transition-all cursor-pointer`}
                >
                  <div
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${subj.iconBg} text-white flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <h3 className={`text-xs md:text-sm font-extrabold ${subj.textColor} truncate`}>
                        {subj.name}
                      </h3>
                    </div>
                    <p className="text-[10px] md:text-[11px] text-stone-500 font-medium">
                      {subj.sub} • {subj.badge}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-stone-400 shrink-0 ${isLastOdd ? 'ml-auto' : ''}`}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* LATEST PDF UPDATES (Dynamic Firebase Firestore Real-Time) */}
        <section className="lg:col-span-7 px-4 md:px-0 space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-900">
                LATEST PDF UPDATES
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('browse')}
              className="text-[11px] font-bold text-red-700 hover:text-red-800 flex items-center space-x-0.5 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden divide-y divide-stone-100">
            {allLatestItems.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-500">
                  New chapter notes will appear here automatically when uploaded.
                </p>
              </div>
            ) : (
              allLatestItems.map((pdf) => {
                const isFreeNote = Boolean(
                  pdf.isFree || Number(pdf.sellingPricePaise || 0) === 0
                );
                const relativeTime = getRelativeTime(pdf.createdAt);

                return (
                  <div
                    key={pdf.id}
                    onClick={() => {
                      // Record in continue reading
                      try {
                        localStorage.setItem(
                          'mkr_last_reading',
                          JSON.stringify({
                            id: pdf.id,
                            title: pdf.title,
                            subject: pdf.subject,
                            coverImagePath: pdf.coverImagePath,
                            classLevel: pdf.classLevel,
                            timestamp: Date.now()
                          })
                        );
                      } catch {}
                      onViewDetails(pdf);
                    }}
                    className="p-3.5 md:p-4 flex items-center space-x-3 md:space-x-4 hover:bg-stone-50 active:bg-stone-100 transition-colors cursor-pointer"
                  >
                    {/* PDF Icon Badge */}
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="bg-red-700 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                          NEW
                        </span>
                        <span className="text-[10px] md:text-[11px] font-bold text-stone-500">
                          {pdf.subject} {pdf.classLevel ? `• ${pdf.classLevel}` : ''}
                        </span>
                      </div>

                      <h3 className="text-xs md:text-sm font-bold text-stone-900 leading-snug line-clamp-1">
                        {pdf.title}
                      </h3>

                      <div className="flex items-center space-x-2 text-[10px] md:text-[11px] text-stone-400">
                        <span>{relativeTime}</span>
                        <span>•</span>
                        {isFreeNote ? (
                          <span className="text-emerald-700 font-bold">100% Free Note</span>
                        ) : (
                          <span className="text-stone-700 font-bold">
                            ₹{(pdf.sellingPricePaise || 0) / 100}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Arrow / Action */}
                    <div className="shrink-0 flex items-center space-x-1">
                      <span className="text-[11px] md:text-xs font-bold text-red-700 hidden sm:inline">
                        View
                      </span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* ==============================================================
          5. WHATSAPP & SUPPORT HELPLINE BANNER
          ============================================================== */}
      <section className="px-4 md:px-0">
        <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 text-white rounded-3xl p-4 md:p-6 border border-emerald-800/40 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] md:text-[11px] uppercase font-bold text-emerald-400 tracking-wider">
              Student Help & Doubts
            </span>
            <p className="text-xs md:text-base font-bold text-white truncate">
              WhatsApp Community & Helpline
            </p>
            <p className="text-[10px] md:text-xs text-stone-300">
              Need assistance or study guidance? Reach out directly.
            </p>
          </div>
          <a
            href={`https://wa.me/${formatWhatsAppDigits(settings?.social?.whatsapp)}?text=${encodeURIComponent(
              'Hello MKR Academy, I would like to join the student group and have a question.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 md:px-5 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-bold shrink-0 flex items-center space-x-1.5 shadow-sm active:scale-95 transition-transform"
          >
            <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>WhatsApp</span>
          </a>
        </div>
      </section>
    </div>
  );
};
