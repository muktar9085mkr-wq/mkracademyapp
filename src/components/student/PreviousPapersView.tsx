import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  Lock,
  Unlock,
  CheckCircle2,
  Download,
  Eye,
  ShoppingBag,
  Sparkles,
  Calendar,
  BookOpen,
  Filter,
  Search,
  X,
  Target,
  Award,
  ChevronRight,
  ShieldCheck,
  MessageCircle,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { Product, AppPublicSettings, Purchase } from '../../types';
import { isPYQProduct, getPYQExamCategory, getPYQYear, PYQExamCategory } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';

interface PreviousPapersViewProps {
  products: Product[];
  purchasedProductIds: Set<string>;
  purchases?: Purchase[];
  settings: AppPublicSettings | null;
  onBack: () => void;
  onViewDetails: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onDownloadNotes: (product: Product) => void;
  onNavigate: (view: string, filterParam?: any) => void;
  initialCategory?: PYQExamCategory;
}

export const PreviousPapersView: React.FC<PreviousPapersViewProps> = ({
  products,
  purchasedProductIds,
  purchases = [],
  settings,
  onBack,
  onViewDetails,
  onBuyNow,
  onDownloadNotes,
  onNavigate,
  initialCategory = 'HSLC'
}) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<PYQExamCategory>(initialCategory);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedMedium, setSelectedMedium] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract all published products that are PYQs
  const pyqProducts = useMemo(() => {
    return products.filter((p) => p.published !== false && isPYQProduct(p));
  }, [products]);

  // Counts for the 3 main options
  const hslcCount = useMemo(() => {
    return pyqProducts.filter((p) => getPYQExamCategory(p) === 'HSLC').length;
  }, [pyqProducts]);

  const halfYearlyCount = useMemo(() => {
    return pyqProducts.filter((p) => getPYQExamCategory(p) === 'Half Yearly').length;
  }, [pyqProducts]);

  const preFinalCount = useMemo(() => {
    return pyqProducts.filter((p) => getPYQExamCategory(p) === 'Pre-Final').length;
  }, [pyqProducts]);

  // Available years based on existing products in selected category
  const availableYears = useMemo(() => {
    const categoryProducts = pyqProducts.filter((p) => getPYQExamCategory(p) === selectedCategory);
    const yearsSet = new Set<number>();
    // Include standard academic years
    [2026, 2025, 2024, 2023, 2022, 2021, 2020].forEach((y) => yearsSet.add(y));
    categoryProducts.forEach((p) => {
      const y = getPYQYear(p);
      if (y) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [pyqProducts, selectedCategory]);

  // Subjects list
  const subjectsList = [
    { id: 'all', label: 'All Subjects' },
    { id: 'General Science', label: 'General Science' },
    { id: 'Mathematics', label: 'Mathematics' },
    { id: 'English', label: 'English' },
    { id: 'Social Science', label: 'Social Science' },
    { id: 'Assamese', label: 'Assamese' }
  ];

  // Filtered list
  const filteredPapers = useMemo(() => {
    return pyqProducts.filter((p) => {
      // 1. Exam category filter (HSLC / Half Yearly / Pre-Final)
      const cat = getPYQExamCategory(p);
      if (cat !== selectedCategory) return false;

      // 2. Year filter
      if (selectedYear !== 'all') {
        const y = getPYQYear(p);
        if (String(y) !== String(selectedYear)) return false;
      }

      // 3. Subject filter
      if (selectedSubject !== 'all') {
        const s = (p.subject || '').toLowerCase();
        const target = selectedSubject.toLowerCase();
        if (!s.includes(target) && !target.includes(s)) return false;
      }

      // 4. Medium filter
      if (selectedMedium !== 'all') {
        const m = (p.medium || '').toLowerCase();
        if (selectedMedium === 'Assamese Medium' && !m.includes('assamese')) return false;
        if (selectedMedium === 'English Medium' && !m.includes('english')) return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const subMatch = (p.subject || '').toLowerCase().includes(q);
        const yearMatch = String(getPYQYear(p)).includes(q);
        if (!titleMatch && !descMatch && !subMatch && !yearMatch) return false;
      }

      return true;
    });
  }, [pyqProducts, selectedCategory, selectedYear, selectedSubject, selectedMedium, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-stone-50 pb-28 text-stone-900 font-sans">
      
      {/* Top Header & Breadcrumb */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Back to previous page"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2 text-xs text-stone-500 font-medium">
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-red-700"
                >
                  Home
                </button>
                <span>/</span>
                <span className="text-red-700 font-bold">Previous Papers (PYQ)</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-stone-900 font-sans leading-tight">
                Previous Year Question Papers
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('purchases')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-800 hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-red-700" />
            <span className="hidden sm:inline">My Purchases</span>
            {purchasedProductIds.size > 0 && (
              <span className="bg-red-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {purchasedProductIds.size}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Hero Notice Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-stone-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center space-x-1.5 bg-red-950/80 border border-red-700/60 px-3 py-0.5 rounded-full text-[11px] font-bold text-red-200">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>SEBA & Assam Board Exam Papers</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Year-Wise Solved & Original Question Papers
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Choose from <strong>HSLC Board PYQ</strong>, <strong>Half Yearly PYQ</strong>, or <strong>Pre-Final PYQ</strong>. All question papers are verified by MKR Academy teachers with step-by-step marking schemes and model solutions.
              </p>
            </div>
            <div className="bg-stone-800/80 border border-stone-700 p-3 rounded-2xl shrink-0 text-center text-xs">
              <div className="flex items-center justify-center space-x-1.5 text-amber-400 font-bold">
                <Lock className="w-4 h-4" />
                <span>Locked Papers</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">Unlock with 1-click Razorpay payment</p>
            </div>
          </div>
        </div>

        {/* ==============================================================
            THE 3 PRIMARY OPTIONS:
            1. HSLC PYQ
            2. Half Yearly PYQ
            3. Pre-Final PYQ
            ============================================================== */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-stone-500">
              Select Exam Category
            </span>
            <span className="text-xs text-stone-400 font-medium">Click an option to explore</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. HSLC PYQ */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('HSLC');
                setSelectedYear('all');
              }}
              className={`text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                selectedCategory === 'HSLC'
                  ? 'bg-red-50/80 border-red-600 shadow-md ring-2 ring-red-600/20'
                  : 'bg-white border-stone-200 hover:border-red-300 hover:bg-stone-50 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-2xl bg-red-700 text-white flex items-center justify-center shadow-md shadow-red-950/20 group-hover:scale-105 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    selectedCategory === 'HSLC'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {hslcCount} {hslcCount === 1 ? 'Paper' : 'Papers'}
                </span>
              </div>

              <div className="mt-3.5 space-y-1">
                <h3 className="text-base font-black text-stone-900 group-hover:text-red-700 transition-colors">
                  HSLC PYQ
                </h3>
                <p className="text-xs text-stone-500 font-medium leading-relaxed">
                  SEBA / Assam Board Final Examination past papers with solved solutions.
                </p>
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-red-700 pt-1">
                  <span>Class 10 Board Papers</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {selectedCategory === 'HSLC' && (
                <div className="absolute top-0 right-0 w-2 h-full bg-red-600"></div>
              )}
            </button>

            {/* 2. Half Yearly PYQ */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Half Yearly');
                setSelectedYear('all');
              }}
              className={`text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                selectedCategory === 'Half Yearly'
                  ? 'bg-blue-50/80 border-blue-600 shadow-md ring-2 ring-blue-600/20'
                  : 'bg-white border-stone-200 hover:border-blue-300 hover:bg-stone-50 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-950/20 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    selectedCategory === 'Half Yearly'
                      ? 'bg-blue-700 text-white'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {halfYearlyCount} {halfYearlyCount === 1 ? 'Paper' : 'Papers'}
                </span>
              </div>

              <div className="mt-3.5 space-y-1">
                <h3 className="text-base font-black text-stone-900 group-hover:text-blue-700 transition-colors">
                  Half Yearly PYQ
                </h3>
                <p className="text-xs text-stone-500 font-medium leading-relaxed">
                  Mid-Term & Half Yearly Exam question papers across various districts.
                </p>
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-blue-700 pt-1">
                  <span>Mid-Term Exam Papers</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {selectedCategory === 'Half Yearly' && (
                <div className="absolute top-0 right-0 w-2 h-full bg-blue-600"></div>
              )}
            </button>

            {/* 3. Pre-Final PYQ */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Pre-Final');
                setSelectedYear('all');
              }}
              className={`text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                selectedCategory === 'Pre-Final'
                  ? 'bg-purple-50/80 border-purple-600 shadow-md ring-2 ring-purple-600/20'
                  : 'bg-white border-stone-200 hover:border-purple-300 hover:bg-stone-50 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-950/20 group-hover:scale-105 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    selectedCategory === 'Pre-Final'
                      ? 'bg-purple-700 text-white'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {preFinalCount} {preFinalCount === 1 ? 'Paper' : 'Papers'}
                </span>
              </div>

              <div className="mt-3.5 space-y-1">
                <h3 className="text-base font-black text-stone-900 group-hover:text-purple-700 transition-colors">
                  Pre-Final PYQ
                </h3>
                <p className="text-xs text-stone-500 font-medium leading-relaxed">
                  Pre-Board and Pre-Final test papers to test your final readiness.
                </p>
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-purple-700 pt-1">
                  <span>Pre-Board Mock Tests</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {selectedCategory === 'Pre-Final' && (
                <div className="absolute top-0 right-0 w-2 h-full bg-purple-600"></div>
              )}
            </button>
          </div>
        </section>

        {/* ==============================================================
            ACTIVE CATEGORY CONTROLS:
            Year Selection, Subject Filter, Medium Filter, and Search
            ============================================================== */}
        <section className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Browsing Papers For
              </span>
              <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center space-x-2">
                <span>
                  {selectedCategory === 'HSLC'
                    ? 'HSLC (Board Final) Papers'
                    : selectedCategory === 'Half Yearly'
                    ? 'Half Yearly Examination Papers'
                    : 'Pre-Final (Pre-Board) Papers'}
                </span>
                <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                  {filteredPapers.length} Available
                </span>
              </h3>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search paper or year..."
                className="w-full bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-stone-900 text-xs rounded-xl pl-8 pr-8 py-2 border border-stone-200 focus:outline-none focus:border-red-600 transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 1. Year Selector (Horizontal scrollable pills) */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-stone-600 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-red-700" />
              <span>Select Examination Year:</span>
            </span>
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedYear('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedYear === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                All Years
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(String(year))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                    String(selectedYear) === String(year)
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Year {year}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Subject Filter Pills */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-stone-600 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-red-700" />
              <span>Filter by Subject:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {subjectsList.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedSubject === sub.id
                      ? 'bg-red-100 text-red-800 font-bold border border-red-300'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ==============================================================
            QUESTION PAPERS GRID:
            Shows year-wise question papers.
            Unpurchased = LOCKED (Paid).
            Purchased = UNLOCKED (Read/Download).
            ============================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-stone-800 uppercase tracking-wider">
              {selectedYear === 'all' ? 'All Question Papers' : `Year ${selectedYear} Question Papers`}
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              Showing {filteredPapers.length} results
            </span>
          </div>

          {filteredPapers.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-bold text-stone-900">
                  No question papers found for this selection
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  MKR Academy is continuously scanning and uploading authentic question papers with full answer keys.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedYear('all');
                    setSelectedSubject('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
                <a
                  href={`https://wa.me/${settings?.social?.whatsapp || '919864012345'}?text=${encodeURIComponent(
                    `Hello MKR Academy, I am looking for ${selectedCategory} ${selectedYear !== 'all' ? selectedYear : ''} question papers.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center space-x-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Request Paper on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPapers.map((paper) => {
                const isPurchased = purchasedProductIds.has(paper.id);
                const year = getPYQYear(paper);
                const category = getPYQExamCategory(paper);
                const priceRs = Math.round((paper.sellingPricePaise || 4900) / 100);
                const originalPriceRs = Math.round((paper.originalPricePaise || 9900) / 100);
                const discount = originalPriceRs > priceRs ? Math.round(((originalPriceRs - priceRs) / originalPriceRs) * 100) : 0;

                return (
                  <div
                    key={paper.id}
                    className={`bg-white rounded-3xl border-2 transition-all overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
                      isPurchased
                        ? 'border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'border-stone-200 hover:border-red-300'
                    }`}
                  >
                    {/* Card Header & Status Banner */}
                    <div>
                      {/* Top Lock/Unlock Strip */}
                      <div
                        className={`px-4 py-2 text-xs font-bold flex items-center justify-between border-b ${
                          isPurchased
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : 'bg-amber-50 text-amber-900 border-amber-100'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          {isPurchased ? (
                            <>
                              <Unlock className="w-4 h-4 text-emerald-600" />
                              <span>UNLOCKED • PURCHASED</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 text-amber-700" />
                              <span>LOCKED PAPER • PAID</span>
                            </>
                          )}
                        </div>

                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white/80 shadow-2xs">
                          Year {year}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 sm:p-5 space-y-3">
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                            {paper.subject || 'General'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700">
                            {category} PYQ
                          </span>
                          {paper.medium && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-50 text-stone-500 border border-stone-200">
                              {paper.medium}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4
                          onClick={() => onViewDetails(paper)}
                          className="font-bold text-sm sm:text-base text-stone-900 hover:text-red-700 transition-colors cursor-pointer line-clamp-2 leading-snug"
                        >
                          {paper.title}
                        </h4>

                        {/* Description */}
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {paper.shortDescription || paper.description || 'Complete official question paper with step-by-step marking scheme.'}
                        </p>

                        {/* Features List */}
                        <div className="space-y-1 pt-1 text-[11px] text-stone-600 font-medium">
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Original questions with verified solutions</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>ASSEB / SEBA Board syllabus aligned</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer with Price and Actions */}
                    <div className="p-4 sm:p-5 pt-0 border-t border-stone-100 mt-2">
                      <div className="flex items-center justify-between py-2">
                        {isPurchased ? (
                          <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-extrabold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Instant PDF Access Active</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline space-x-2">
                            <span className="text-lg font-black text-stone-900">
                              ₹{priceRs}
                            </span>
                            {originalPriceRs > priceRs && (
                              <span className="text-xs text-stone-400 line-through">
                                ₹{originalPriceRs}
                              </span>
                            )}
                            {discount > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                {discount}% OFF
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onViewDetails(paper)}
                          className="py-2.5 px-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors cursor-pointer text-center"
                        >
                          View Details
                        </button>

                        {isPurchased ? (
                          <button
                            type="button"
                            onClick={() => onDownloadNotes(paper)}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onBuyNow(paper)}
                            className="py-2.5 px-3 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Buy Now • ₹{priceRs}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom Support Callout */}
        <div className="bg-stone-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600 border border-stone-200">
          <div className="flex items-center space-x-2.5 text-center sm:text-left">
            <HelpCircle className="w-5 h-5 text-red-700 shrink-0" />
            <span>
              Need solutions for older papers or district question papers? We provide instant help on WhatsApp.
            </span>
          </div>
          <a
            href={`https://wa.me/${settings?.social?.whatsapp || '919864012345'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 rounded-xl font-bold shrink-0 shadow-2xs"
          >
            Chat with Educator
          </a>
        </div>

      </div>
    </div>
  );
};
