import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  BookOpen,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  Check,
  ChevronDown
} from 'lucide-react';
import { Product, SubjectType, ClassLevel, MediumType, ProductCategory } from '../../types';
import { ProductCard } from './ProductCard';

interface BrowseNotesViewProps {
  products: Product[];
  purchasedProductIds: Set<string>;
  onViewDetails: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onDownloadNotes: (product: Product) => void;
  initialFilters?: {
    subject?: string;
    classLevel?: string;
    medium?: string;
    category?: string;
    search?: string;
  };
}

export const BrowseNotesView: React.FC<BrowseNotesViewProps> = ({
  products,
  purchasedProductIds,
  onViewDetails,
  onBuyNow,
  onDownloadNotes,
  initialFilters
}) => {
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(initialFilters?.subject || 'All');
  const [selectedClass, setSelectedClass] = useState<string>(initialFilters?.classLevel || 'All');
  const [selectedMedium, setSelectedMedium] = useState<string>(initialFilters?.medium || 'All');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilters?.category || 'All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'latest' | 'price-low' | 'price-high' | 'title'>('latest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const subjects = ['All', 'General Science', 'Mathematics', 'Social Science', 'English', 'Assamese', 'Other Subjects'];
  const classes = ['All', 'HSLC 2027', 'Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6'];
  const mediums = ['All', 'Assamese Medium', 'English Medium', 'Both Mediums'];
  const categories = ['All', 'Premium', 'Normal', 'Budget Friendly'];
  const tags = [
    'All',
    'Important Questions',
    'Chapter-wise Notes',
    'Complete Syllabus',
    'Revision Notes',
    'Practice Sets',
    'Model Question Papers',
    'Previous Year Questions'
  ];

  // Filtering & Sorting logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!p.published) return false;

        // Search match
        if (search.trim()) {
          const query = search.toLowerCase();
          const matchesTitle = p.title.toLowerCase().includes(query);
          const matchesShortDesc = p.shortDescription?.toLowerCase().includes(query);
          const matchesDesc = p.description?.toLowerCase().includes(query);
          const matchesSubject = p.subject?.toLowerCase().includes(query);
          const matchesChapters = p.chapters?.some((c) => c.toLowerCase().includes(query));
          const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(query));
          if (!matchesTitle && !matchesShortDesc && !matchesDesc && !matchesSubject && !matchesChapters && !matchesTags) {
            return false;
          }
        }

        // Subject filter
        if (selectedSubject !== 'All' && p.subject !== selectedSubject) {
          return false;
        }

        // Class filter
        if (selectedClass !== 'All' && p.classLevel !== selectedClass) {
          return false;
        }

        // Medium filter
        if (selectedMedium !== 'All' && p.medium !== selectedMedium && p.medium !== 'Both Mediums') {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'All' && p.category !== selectedCategory) {
          return false;
        }

        // Tag filter
        if (selectedTag !== 'All' && (!p.tags || !p.tags.includes(selectedTag))) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') {
          return a.sellingPricePaise - b.sellingPricePaise;
        }
        if (sortBy === 'price-high') {
          return b.sellingPricePaise - a.sellingPricePaise;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        // latest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, search, selectedSubject, selectedClass, selectedMedium, selectedCategory, selectedTag, sortBy]);

  const clearAllFilters = () => {
    setSearch('');
    setSelectedSubject('All');
    setSelectedClass('All');
    setSelectedMedium('All');
    setSelectedCategory('All');
    setSelectedTag('All');
    setSortBy('latest');
  };

  const hasActiveFilters =
    search ||
    selectedSubject !== 'All' ||
    selectedClass !== 'All' ||
    selectedMedium !== 'All' ||
    selectedCategory !== 'All' ||
    selectedTag !== 'All';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-red-700">
            <BookOpen className="w-4 h-4" />
            <span>Official Educational Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-sans mt-1">
            Browse All Study Notes
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Showing {filteredProducts.length} verified notes for HSLC 2027 and Classes 6-10.
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter notes..."
              className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-red-600"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 font-semibold focus:outline-none focus:border-red-600 appearance-none pr-8 cursor-pointer"
            >
              <option value="latest">Sort: Latest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="title">Title: A to Z</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden p-2 rounded-xl border border-stone-300 bg-white text-stone-700"
            title="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid with Sidebar Filters */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Filter Sidebar - Desktop & Responsive Mobile */}
        <aside
          className={`w-full md:w-64 shrink-0 bg-white rounded-2xl border border-stone-200 p-5 space-y-6 ${
            mobileFilterOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-900 flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-red-700" />
              <span>Filters</span>
            </h3>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-red-700 hover:text-red-800"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700">Subject</label>
            <div className="space-y-1">
              {subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedSubject === sub
                      ? 'bg-red-50 text-red-700 font-bold'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>{sub}</span>
                  {selectedSubject === sub && <Check className="w-3 h-3 text-red-700" />}
                </button>
              ))}
            </div>
          </div>

          {/* Class Level Filter */}
          <div className="space-y-2 border-t border-stone-100 pt-4">
            <label className="block text-xs font-bold text-stone-700">Class & Exam</label>
            <div className="space-y-1">
              {classes.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedClass === cls
                      ? 'bg-red-50 text-red-700 font-bold'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>{cls}</span>
                  {selectedClass === cls && <Check className="w-3 h-3 text-red-700" />}
                </button>
              ))}
            </div>
          </div>

          {/* Medium / Language */}
          <div className="space-y-2 border-t border-stone-100 pt-4">
            <label className="block text-xs font-bold text-stone-700">Medium</label>
            <div className="space-y-1">
              {mediums.map((med) => (
                <button
                  key={med}
                  onClick={() => setSelectedMedium(med)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedMedium === med
                      ? 'bg-red-50 text-red-700 font-bold'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>{med}</span>
                  {selectedMedium === med && <Check className="w-3 h-3 text-red-700" />}
                </button>
              ))}
            </div>
          </div>

          {/* Product Category */}
          <div className="space-y-2 border-t border-stone-100 pt-4">
            <label className="block text-xs font-bold text-stone-700">Category</label>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedCategory === cat
                      ? 'bg-red-50 text-red-700 font-bold'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <Check className="w-3 h-3 text-red-700" />}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2 border-t border-stone-100 pt-4">
            <label className="block text-xs font-bold text-stone-700">Tags & Format</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tg) => (
                <button
                  key={tg}
                  onClick={() => setSelectedTag(tg)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                    selectedTag === tg
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tg}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Cards Grid */}
        <main className="flex-1 w-full">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">No Matching Notes Found</h3>
              <p className="text-stone-500 text-xs">
                We couldn't find any study materials matching your selected filters. Try clearing your search query or selecting "All" categories.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-red-700 text-white font-bold text-xs shadow-sm hover:bg-red-800 transition-colors"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
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
          )}
        </main>
      </div>
    </div>
  );
};
