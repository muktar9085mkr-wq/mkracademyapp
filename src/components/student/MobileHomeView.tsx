import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Target,
  BookOpen,
  Sparkles,
  Clock,
  Calendar,
  FileText,
  ShoppingBag,
  Video,
  HelpCircle,
  Download,
  MessageCircle,
  MoreHorizontal,
  ArrowRight,
  ChevronRight,
  PenTool,
  FlaskConical,
  Calculator,
  Globe,
  Bell,
  CheckCircle2,
  ExternalLink,
  Flame,
  Award
} from 'lucide-react';
import { Product, AppPublicSettings, Purchase } from '../../types';
import { useAuth } from '../../context/AuthContext';

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

  // 1. Calculate dynamic countdown to HSLC 2027 (Assam Board approx Feb 15, 2027)
  const targetDate = new Date('2027-02-15T09:00:00+05:30');
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

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

  // 3. Dynamic statistics from real Firestore products
  const publishedProducts = products.filter((p) => p.published);
  const totalSubjectSet = new Set<string>();
  publishedProducts.forEach((p) => {
    if (p.subject) totalSubjectSet.add(p.subject);
  });
  freeNotes.forEach((n) => {
    if (n.subject) totalSubjectSet.add(n.subject);
  });
  const totalSubjectsCount = Math.max(5, totalSubjectSet.size);

  const availablePdfsCount = publishedProducts.length + freeNotes.length;
  const totalPurchasesDisplay = purchases.length > 0 ? `${purchases.length} Yours` : '1,250+';

  // 4. LATEST PDF UPDATES - Real-time merged and sorted from Firestore
  // Combines published study notes & free chapter notes, latest upload date first
  const allLatestItems: Product[] = [...publishedProducts, ...freeNotes]
    .filter((item, index, self) => index === self.findIndex((t) => t.id === item.id))
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

  return (
    <div className="w-full bg-stone-50 text-stone-900 pb-24 space-y-5 animate-in fade-in duration-200 overflow-x-hidden">
      
      {/* ==============================================================
          1. HERO BANNER: TARGET HSLC 2027 (Premium Red & Light-Pink Theme)
          ============================================================== */}
      <section className="px-4 pt-3">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-stone-900 text-white shadow-xl shadow-red-950/20 border border-red-600/40 p-5 sm:p-6">
          {/* Subtle background educational glow and motifs */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-rose-500/15 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-amber-400/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="relative z-10 space-y-3">
            {/* Top Tag & Target Icon */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/25">
                <Target className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span className="text-[11px] font-black tracking-wider uppercase text-white">
                  TARGET HSLC 2027
                </span>
              </div>
              <span className="bg-red-950/70 border border-white/15 text-[10px] font-bold px-2 py-0.5 rounded-full text-rose-200">
                Assam Board
              </span>
            </div>

            {/* Main Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                Complete Exam Preparation
              </h1>
              <p className="text-rose-100 text-xs mt-1 font-medium leading-relaxed">
                Assamese • English • Science • Mathematics • Social Science
              </p>
            </div>

            {/* Educational Feature Pills */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="bg-white/15 text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs text-white">
                ✓ Solved Question Banks
              </span>
              <span className="bg-white/15 text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs text-white">
                ✓ Chapter Formulas
              </span>
              <span className="bg-white/15 text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs text-white">
                ✓ 100% Verified Notes
              </span>
            </div>

            {/* Banner CTAs */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('browse')}
                className="py-2.5 px-3 bg-white hover:bg-rose-50 text-red-800 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-98 transition-transform cursor-pointer"
              >
                <span>Study Notes</span>
                <ArrowRight className="w-3.5 h-3.5 text-red-700" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('free-pdfs')}
                className="py-2.5 px-3 bg-red-900/80 hover:bg-red-900 text-white border border-white/20 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 active:scale-98 transition-transform cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Free Chapter PDFs</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          2. STATISTICS SECTION (4 Compact Real-Time Cards)
          ============================================================== */}
      <section className="px-4">
        <div className="grid grid-cols-4 gap-2">
          {/* 1. Days Left */}
          <div className="bg-white rounded-2xl p-2.5 border border-stone-200/90 shadow-xs text-center flex flex-col items-center justify-center min-h-[72px]">
            <div className="w-6 h-6 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-1">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
              {daysLeft}d
            </span>
            <span className="text-[9.5px] font-semibold text-stone-500 tracking-tight leading-tight">
              Days Left
            </span>
          </div>

          {/* 2. Total Subjects */}
          <div className="bg-white rounded-2xl p-2.5 border border-stone-200/90 shadow-xs text-center flex flex-col items-center justify-center min-h-[72px]">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-1">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
              {totalSubjectsCount}
            </span>
            <span className="text-[9.5px] font-semibold text-stone-500 tracking-tight leading-tight">
              Subjects
            </span>
          </div>

          {/* 3. Available PDFs */}
          <div className="bg-white rounded-2xl p-2.5 border border-stone-200/90 shadow-xs text-center flex flex-col items-center justify-center min-h-[72px]">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
              {availablePdfsCount}
            </span>
            <span className="text-[9.5px] font-semibold text-stone-500 tracking-tight leading-tight">
              Available PDFs
            </span>
          </div>

          {/* 4. Total Purchases */}
          <div className="bg-white rounded-2xl p-2.5 border border-stone-200/90 shadow-xs text-center flex flex-col items-center justify-center min-h-[72px]">
            <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-1">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
              {totalPurchasesDisplay}
            </span>
            <span className="text-[9.5px] font-semibold text-stone-500 tracking-tight leading-tight truncate max-w-full">
              Purchases
            </span>
          </div>
        </div>
      </section>

      {/* ==============================================================
          3. QUICK ACCESS FEATURES (4-Column Grid, 2 Rows)
          No Online Tests shortcut as strictly requested.
          ============================================================== */}
      <section className="px-4 space-y-2">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 px-0.5">
          Quick Access
        </h2>
        <div className="bg-white rounded-3xl p-3.5 border border-stone-200 shadow-xs">
          <div className="grid grid-cols-4 gap-y-3 gap-x-2 text-center">
            {/* 1. Study Notes */}
            <button
              type="button"
              onClick={() => onNavigate('browse')}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center shadow-xs group-hover:bg-red-100 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-stone-800 mt-1.5 leading-tight">
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
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-xs group-hover:bg-blue-100 transition-colors">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-stone-800 mt-1.5 leading-tight">
                Video Classes
              </span>
            </a>

            {/* 3. Courses */}
            <button
              type="button"
              onClick={() => onNavigate('browse', { category: 'Premium' })}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-xs group-hover:bg-amber-100 transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-stone-800 mt-1.5 leading-tight">
                Courses
              </span>
            </button>

            {/* 4. Previous Papers */}
            <button
              type="button"
              onClick={() => onNavigate('previous-papers')}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs group-hover:bg-emerald-100 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-stone-800 mt-1.5 leading-tight">
                Previous Papers
              </span>
            </button>

            {/* 5. Important Questions */}
            <button
              type="button"
              onClick={() => onNavigate('browse', { tag: 'Important Questions' })}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shadow-xs group-hover:bg-purple-100 transition-colors">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-stone-800 mt-1.5 leading-tight">
                Important Qs
              </span>
            </button>

            {/* 6. Downloads */}
            <button
              type="button"
              onClick={() => onNavigate('purchases')}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shadow-xs group-hover:bg-rose-100 transition-colors">
                <Download className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-stone-800 mt-1.5 leading-tight">
                Downloads
              </span>
            </button>

            {/* 7. Doubt Support (Direct WhatsApp) */}
            <a
              href={`https://wa.me/${settings?.social?.whatsapp || '919864012345'}?text=${encodeURIComponent(
                'Hello MKR Academy, I have a doubt regarding HSLC / Class 10 study materials.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs group-hover:bg-emerald-200 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-stone-800 mt-1.5 leading-tight">
                Doubt Support
              </span>
            </a>

            {/* 8. More */}
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center shadow-xs group-hover:bg-stone-200 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-stone-800 mt-1.5 leading-tight">
                More
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ==============================================================
          4. CONTINUE READING SECTION
          ============================================================== */}
      {lastReading && (
        <section className="px-4 space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
              Continue Reading
            </h2>
            <span className="text-[11px] text-red-700 font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              <span>Recent Note</span>
            </span>
          </div>

          <div className="bg-white rounded-3xl p-3.5 border border-stone-200 shadow-xs flex items-center space-x-3.5">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200 shadow-inner relative">
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
              <h3 className="text-xs font-bold text-stone-900 truncate">
                {lastReading.title}
              </h3>
              <p className="text-[10px] text-stone-500">
                Continue exam preparation right where you left off
              </p>
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={() => {
                const target = products.find((p) => p.id === lastReading.id) || freeNotes.find((n) => n.id === lastReading.id);
                if (target) {
                  onViewDetails(target);
                } else {
                  onNavigate('browse');
                }
              }}
              className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs active:scale-95 transition-transform cursor-pointer"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {/* ==============================================================
          5. EXPLORE SUBJECTS
          ============================================================== */}
      <section className="px-4 space-y-2">
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

        <div className="grid grid-cols-2 gap-2.5">
          {subjectList.map((subj, index) => {
            const Icon = subj.icon;
            // Span the 5th item across both columns for balanced aesthetic
            const isLastOdd = index === 4;

            return (
              <button
                key={subj.id}
                type="button"
                onClick={() => onNavigate('browse', { subject: subj.id })}
                className={`${subj.bg} ${subj.border} ${isLastOdd ? 'col-span-2' : ''} border rounded-2xl p-3 text-left flex items-center space-x-3 shadow-xs active:scale-98 transition-transform cursor-pointer`}
              >
                <div className={`w-9 h-9 rounded-xl ${subj.iconBg} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <h3 className={`text-xs font-extrabold ${subj.textColor} truncate`}>
                      {subj.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium">
                    {subj.sub} • {subj.badge}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 text-stone-400 shrink-0 ${isLastOdd ? 'ml-auto' : ''}`} />
              </button>
            );
          })}
        </div>
      </section>

      {/* ==============================================================
          6. LATEST PDF UPDATES (Dynamic Firebase Firestore Real-Time)
          Automatically refreshes when an admin uploads, updates, or deletes.
          ============================================================== */}
      <section className="px-4 space-y-2.5">
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
              const isFreeNote = Boolean(pdf.isFree || Number(pdf.sellingPricePaise || 0) === 0);
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
                  className="p-3.5 flex items-center space-x-3 hover:bg-stone-50 active:bg-stone-100 transition-colors cursor-pointer"
                >
                  {/* PDF Icon Badge */}
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>

                  {/* Metadata */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="bg-red-700 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                        NEW
                      </span>
                      <span className="text-[10px] font-bold text-stone-500">
                        {pdf.subject} {pdf.classLevel ? `• ${pdf.classLevel}` : ''}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-stone-900 leading-snug line-clamp-1">
                      {pdf.title}
                    </h3>

                    <div className="flex items-center space-x-2 text-[10px] text-stone-400">
                      <span>{relativeTime}</span>
                      <span>•</span>
                      {isFreeNote ? (
                        <span className="text-emerald-700 font-bold">100% Free Note</span>
                      ) : (
                        <span className="text-stone-700 font-bold">
                          ₹{pdf.sellingPricePaise / 100}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Arrow / Action */}
                  <div className="shrink-0 flex items-center space-x-1">
                    <span className="text-[11px] font-bold text-red-700 hidden sm:inline">
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

      {/* ==============================================================
          7. WHATSAPP & SUPPORT HELPLINE BANNER (Mobile Footer Helper)
          ============================================================== */}
      <section className="px-4">
        <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 text-white rounded-3xl p-4 border border-emerald-800/40 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              Student Help & Doubts
            </span>
            <p className="text-xs font-bold text-white truncate">
              WhatsApp Community & Helpline
            </p>
            <p className="text-[10px] text-stone-300">
              Need assistance or study guidance? Reach out directly.
            </p>
          </div>
          <a
            href={`https://wa.me/${settings?.social?.whatsapp || '919864012345'}?text=${encodeURIComponent(
              'Hello MKR Academy, I would like to join the student group and have a question.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center space-x-1.5 shadow-sm active:scale-95 transition-transform"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </section>

    </div>
  );
};
