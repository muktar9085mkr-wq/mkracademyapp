import React from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Download,
  Flame,
  Award,
  Users,
  Search,
  MessageCircle,
  Send,
  Layers,
  ChevronRight,
  ShoppingBag,
  PlusCircle,
  FileText
} from 'lucide-react';
import { Product, AppPublicSettings } from '../../types';
import { PromotionalBanner } from '../common/PromotionalBanner';
import { ProductCard } from './ProductCard';
import { useAuth } from '../../context/AuthContext';

interface HomeViewProps {
  products: Product[];
  settings: AppPublicSettings | null;
  purchasedProductIds: Set<string>;
  onNavigate: (view: string, filterParam?: any) => void;
  onViewDetails: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onDownloadNotes: (product: Product) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteSearch: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  settings,
  purchasedProductIds,
  onNavigate,
  onViewDetails,
  onBuyNow,
  onDownloadNotes,
  searchQuery,
  onSearchChange,
  onExecuteSearch
}) => {
  const { isAdmin } = useAuth();
  const publishedProducts = products.filter((p) => p.published);

  // Curated lists based on real database attributes
  const freeNotes = publishedProducts.filter(
    (p) => p.isFree === true || p.sellingPricePaise === 0 || (p.category as any) === 'Free'
  ).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  const hslc2027Notes = publishedProducts.filter((p) => p.classLevel === 'HSLC 2027');
  const featuredNotes = publishedProducts.filter((p) => p.featured || p.category === 'Premium');
  const latestNotes = [...publishedProducts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const discountedNotes = publishedProducts.filter(
    (p) => p.originalPricePaise > p.sellingPricePaise
  );

  const subjectCategories = [
    { name: 'General Science', label: 'General Science', assamese: 'সাধাৰণ বিজ্ঞান', icon: '🔬' },
    { name: 'Mathematics', label: 'Mathematics', assamese: 'গণিত', icon: '📐' },
    { name: 'Social Science', label: 'Social Science', assamese: 'সমাজ বিজ্ঞান', icon: '🌍' },
    { name: 'English', label: 'English', assamese: 'ইংৰাজী', icon: '📖' },
    { name: 'Assamese', label: 'Assamese', assamese: 'অসমীয়া', icon: '✍️' },
    { name: 'Other Subjects', label: 'Other Subjects', assamese: 'অন্যান্য বিষয়', icon: '📚' }
  ];

  const classBadges = [
    { id: 'HSLC 2027', name: 'HSLC 2027', desc: 'Target 90%+ in Board Exams', highlight: true },
    { id: 'Class 10', name: 'Class 10', desc: 'Pre-board & Annual Exam Notes', highlight: false },
    { id: 'Class 9', name: 'Class 9', desc: 'Foundation & Theorem Proofs', highlight: false },
    { id: 'Class 8', name: 'Class 8', desc: 'Quick Hand Revision Notes', highlight: false },
    { id: 'Class 7', name: 'Class 7', desc: 'Basic Concepts & Worksheets', highlight: false },
    { id: 'Class 6', name: 'Class 6', desc: 'Middle School Prep Sets', highlight: false }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteSearch();
  };

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 text-white pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-red-700/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-stone-800/80 border border-stone-700 text-stone-200 text-xs font-bold px-3.5 py-1.5 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>HSLC 2027 & Classes 6-10 Educational Platform</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-sans leading-tight">
              Quality Notes.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">
                Better Preparation.
              </span>{' '}
              Better Results.
            </h1>
            <p className="text-stone-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
              Assam’s educational notes platform for SEBA & Board examination success. Chapter-wise solved questions, formula banks, and important notes in <strong>অসমীয়া</strong> and <strong>English</strong> mediums.
            </p>
          </div>

          {/* Hero Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto relative flex items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes by subject, chapter, or exam (e.g. Science, HSLC 2027)..."
              className="w-full bg-stone-800/90 text-white placeholder-stone-400 text-sm rounded-2xl pl-11 pr-28 py-4 border border-stone-700 focus:outline-none focus:border-red-500 shadow-2xl backdrop-blur-md"
            />
            <Search className="w-5 h-5 text-stone-400 absolute left-4" />
            <button
              type="submit"
              className="absolute right-2.5 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('free-pdfs')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Explore Free PDFs & Notes</span>
              <span className="bg-emerald-800 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                FREE
              </span>
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold text-xs border border-stone-700 transition-all cursor-pointer"
            >
              <span>Browse All Paid Notes</span>
            </button>
          </div>

          {/* Highlights / Features Banner */}
          <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left text-xs">
            <div className="bg-stone-800/50 border border-stone-700/60 p-3.5 rounded-2xl backdrop-blur-xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-red-900/60 text-red-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Assamese & English</p>
                <p className="text-[10px] text-stone-400">Both Mediums Covered</p>
              </div>
            </div>

            <div className="bg-stone-800/50 border border-stone-700/60 p-3.5 rounded-2xl backdrop-blur-xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">SEBA Board Aligned</p>
                <p className="text-[10px] text-stone-400">Strict Curriculum Standard</p>
              </div>
            </div>

            <div className="bg-stone-800/50 border border-stone-700/60 p-3.5 rounded-2xl backdrop-blur-xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-900/60 text-amber-400 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Instant Download</p>
                <p className="text-[10px] text-stone-400">Permanent PDF Access</p>
              </div>
            </div>

            <div className="bg-stone-800/50 border border-stone-700/60 p-3.5 rounded-2xl backdrop-blur-xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-rose-900/60 text-rose-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Expert Educators</p>
                <p className="text-[10px] text-stone-400">Prepared by Top Teachers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Promotional Banner (Admin controlled) */}
        {settings?.banner && (
          <PromotionalBanner
            banner={settings.banner}
            onCtaClick={() => onNavigate('browse', { classLevel: 'HSLC 2027' })}
          />
        )}

        {/* Section 4B: Subject Category Navigation */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">Explore by Subject</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-sans mt-0.5">
                Subject Categories
              </h2>
            </div>
            <button
              onClick={() => onNavigate('browse')}
              className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center space-x-1"
            >
              <span>View All Notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {subjectCategories.map((sub) => {
              const count = publishedProducts.filter((p) => p.subject === sub.name).length;
              return (
                <button
                  key={sub.name}
                  onClick={() => onNavigate('browse', { subject: sub.name })}
                  className="group bg-white p-4 rounded-2xl border border-stone-200 hover:border-red-300 hover:shadow-lg transition-all text-left flex flex-col justify-between cursor-pointer space-y-3"
                >
                  <div className="text-2xl">{sub.icon}</div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-xs sm:text-sm group-hover:text-red-700 transition-colors">
                      {sub.label}
                    </h3>
                    <p className="text-[11px] text-stone-400 font-medium">{sub.assamese}</p>
                    <span className="text-[10px] font-bold text-red-600 mt-1 inline-block">
                      {count} {count === 1 ? 'Note' : 'Notes'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 4C: Class-wise Navigation & Exam Filters */}
        <section className="space-y-4 bg-stone-50 p-6 sm:p-8 rounded-3xl border border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">Target Preparation</span>
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 font-sans">
                Select Your Class or Exam
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Assamese Medium & English Medium study materials ready for download.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {classBadges.map((badge) => (
              <button
                key={badge.id}
                onClick={() => onNavigate('browse', { classLevel: badge.id })}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  badge.highlight
                    ? 'bg-red-700 text-white border-red-700 shadow-md shadow-red-900/20 hover:bg-red-800'
                    : 'bg-white text-stone-800 border-stone-200 hover:border-red-300 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-extrabold ${badge.highlight ? 'text-white' : 'text-stone-900'}`}>
                    {badge.name}
                  </span>
                  {badge.highlight && <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                </div>
                <p className={`text-[10px] mt-1 line-clamp-1 ${badge.highlight ? 'text-red-100' : 'text-stone-500'}`}>
                  {badge.desc}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* When products list is empty (waiting for admin to add products) */}
        {publishedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-5 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-stone-900 font-sans">
                Educational Notes Coming Soon
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                MKR Academy is preparing high-scoring chapter-wise notes, question banks, and solutions. Check back shortly!
              </p>
            </div>

            {isAdmin && (
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('admin')}
                  className="px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Admin: Add Your First Product Now</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* HSLC 2027 Special Preparation Section */}
            {hslc2027Notes.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase">
                      <Flame className="w-3 h-3 text-red-600" />
                      <span>High Priority</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-sans mt-1">
                      HSLC 2027 Target Master Notes
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Complete chapter-wise notes and solved questions prepared specifically for the 2027 Board Exam.
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate('browse', { classLevel: 'HSLC 2027' })}
                    className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center space-x-1"
                  >
                    <span>View All HSLC Notes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hslc2027Notes.slice(0, 3).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      isPurchased={purchasedProductIds.has(p.id)}
                      onViewDetails={onViewDetails}
                      onBuyNow={onBuyNow}
                      onDownloadNotes={onDownloadNotes}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 100% Free PDFs Section (Newest at Top) */}
            {freeNotes.length > 0 && (
              <section className="space-y-6 bg-gradient-to-br from-emerald-50/80 to-white p-6 sm:p-8 rounded-3xl border border-emerald-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>100% Free Study Materials</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-sans mt-1">
                      Free PDF Notes (বিনামূলীয়া অধ্যয়ন সামগ্ৰী)
                    </h2>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Newest PDFs are at the top. Open directly in Google Drive or download free!
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate('free-pdfs')}
                    className="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <span>View All {freeNotes.length} Free Notes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {freeNotes.slice(0, 3).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      isPurchased={purchasedProductIds.has(p.id)}
                      onViewDetails={onViewDetails}
                      onBuyNow={onBuyNow}
                      onDownloadNotes={onDownloadNotes}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Featured & Premium Notes */}
            {featuredNotes.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-700">Hand-Picked Quality</span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-sans mt-0.5">
                      Featured & Premium Notes
                    </h2>
                  </div>
                  <button
                    onClick={() => onNavigate('browse', { category: 'Premium' })}
                    className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center space-x-1"
                  >
                    <span>See More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredNotes.slice(0, 3).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      isPurchased={purchasedProductIds.has(p.id)}
                      onViewDetails={onViewDetails}
                      onBuyNow={onBuyNow}
                      onDownloadNotes={onDownloadNotes}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Discounted Notes Section */}
            {discountedNotes.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase">
                      <span>Special Offers</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-sans mt-1">
                      Budget Friendly & Discounted Sets
                    </h2>
                  </div>
                  <button
                    onClick={() => onNavigate('browse')}
                    className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center space-x-1"
                  >
                    <span>View All Offers</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {discountedNotes.slice(0, 3).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      isPurchased={purchasedProductIds.has(p.id)}
                      onViewDetails={onViewDetails}
                      onBuyNow={onBuyNow}
                      onDownloadNotes={onDownloadNotes}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Section 4L: About MKR Academy */}
        <section className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 border border-stone-800 relative overflow-hidden">
          <div className="relative max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 bg-red-950/80 border border-red-700/60 text-red-200 text-xs font-bold px-3 py-1 rounded-full uppercase">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>About MKR Academy</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-sans leading-tight">
              Empowering Assam’s Secondary Students to Score Top Ranks
            </h2>

            <p className="text-stone-300 text-sm leading-relaxed">
              MKR Academy was founded with a single mission: provide every student in Assam with high-standard, verified educational notes at affordable prices. Our materials are crafted by experienced teachers who understand the SEBA syllabus, question weightage, and common scoring pitfalls.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700">
                <p className="font-bold text-white text-sm">Assamese Medium</p>
                <p className="text-stone-400 mt-1">অসমীয়া মাধ্যমৰ ছাত্ৰ-ছাত্ৰীৰ বাবে বিশুদ্ধ আৰু সৰল ভাষাৰ নোটচ্।</p>
              </div>
              <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700">
                <p className="font-bold text-white text-sm">English Medium</p>
                <p className="text-stone-400 mt-1">Clear NCERT/SEBA aligned explanations and diagrams.</p>
              </div>
              <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700">
                <p className="font-bold text-white text-sm">24/7 WhatsApp Support</p>
                <p className="text-stone-400 mt-1">Direct educator query assistance for study clarification.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4K: My Purchases Shortcut Banner */}
        <section className="bg-gradient-to-r from-red-800 to-rose-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold flex items-center justify-center sm:justify-start space-x-2">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
              <span>Already Purchased Notes?</span>
            </h3>
            <p className="text-red-100 text-xs sm:text-sm">
              Access your digital PDF files anytime from your student dashboard.
            </p>
          </div>
          <button
            onClick={() => onNavigate('purchases')}
            className="px-6 py-3 bg-white text-red-900 hover:bg-stone-100 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer shrink-0"
          >
            Open My Purchases
          </button>
        </section>
      </div>
    </div>
  );
};
