import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  ExternalLink,
  FileText,
  Sparkles,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  GraduationCap,
  Eye,
  X,
  Share2
} from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface FreePdfsViewProps {
  products: Product[];
  onViewDetails: (product: Product) => void;
  onNavigateToAdmin?: () => void;
}

export const FreePdfsView: React.FC<FreePdfsViewProps> = ({
  products,
  onViewDetails,
  onNavigateToAdmin
}) => {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedMedium, setSelectedMedium] = useState('All');
  // Sorting: Default 'newest' so "naya PDF sabse upar hoga aur purana PDF sabse niche hoga"
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [previewPdf, setPreviewPdf] = useState<Product | null>(null);

  const subjects = ['All', 'General Science', 'Mathematics', 'Social Science', 'English', 'Assamese', 'Other Subjects'];
  const classes = ['All', 'HSLC 2027', 'Class 10', 'Class 9'];
  const mediums = ['All', 'Assamese Medium', 'English Medium', 'Both Mediums'];

  // Filter only Free PDFs (isFree === true OR sellingPricePaise === 0 OR category === 'Free')
  const freeProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.published) return false;
      const isFreeProduct = p.isFree === true || p.sellingPricePaise === 0 || (p.category as any) === 'Free';
      return isFreeProduct;
    });
  }, [products]);

  // Apply real-time search & filter & sort (Newest on top, Oldest on bottom)
  const filteredAndSortedPdfs = useMemo(() => {
    return freeProducts
      .filter((p) => {
        // Search query across title, short description, description, subject, chapters, tags
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesDesc = (p.shortDescription || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
          const matchesSubject = (p.subject || '').toLowerCase().includes(q);
          const matchesClass = (p.classLevel || '').toLowerCase().includes(q);
          const matchesExam = (p.examTarget || '').toLowerCase().includes(q);
          const matchesChapters = p.chapters?.some((c) => c.toLowerCase().includes(q));
          const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(q));

          if (!matchesTitle && !matchesDesc && !matchesSubject && !matchesClass && !matchesExam && !matchesChapters && !matchesTags) {
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

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortOrder === 'title') {
          return a.title.localeCompare(b.title);
        }
        // Default: 'newest' -> Naya PDF sabse upar, purana PDF sabse niche
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [freeProducts, search, selectedSubject, selectedClass, selectedMedium, sortOrder]);

  const handleOpenDrivePdf = (product: Product) => {
    if (product.driveFileLink) {
      window.open(product.driveFileLink, '_blank', 'noopener,noreferrer');
    } else {
      onViewDetails(product);
    }
  };

  const getDrivePreviewEmbed = (url?: string) => {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in min-w-0">
      {/* Hero Header Strip */}
      <div className="w-full max-w-full bg-gradient-to-r from-emerald-900 via-stone-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Free Study Materials • বিনামূলীয়া ন’টচ</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-sans tracking-tight text-white break-words">
            MKR Academy Free PDFs & Study Notes
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed break-words">
            All free chapter notes, practice papers, formula sheets, and important question banks. 
            Direct Google Drive access — read online or download free without any payment!
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-2 text-xs font-semibold text-emerald-200">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{freeProducts.length} Free Notes Available</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="text-stone-300">
              Sorted: <strong>Newest PDF at the Top (নব্য প্ৰথম)</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        {/* Real-time Search Box */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search free PDFs by chapter name, subject, topic, or exam (e.g. Science, Assamese, Acids, HSLC)..."
            className="w-full bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-stone-900 placeholder-stone-400 text-sm rounded-xl pl-11 pr-10 py-3 border border-stone-200 focus:border-emerald-600 focus:outline-none transition-all"
          />
          <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-3.5 text-xs text-stone-400 hover:text-stone-700 font-bold p-0.5 rounded-full"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Filter & Sort Options */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-stone-100">
          {/* Quick Subject Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-stone-500 font-bold mr-1 shrink-0 flex items-center space-x-1">
              <Filter className="w-3 h-3 text-stone-400" />
              <span>Subject:</span>
            </span>
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto text-xs">
            <span className="text-stone-500 font-bold flex items-center space-x-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <span>Sorting:</span>
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-stone-100 border border-stone-200 text-stone-800 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-600"
            >
              <option value="newest">🔥 Newest First (Latest on Top)</option>
              <option value="oldest">⏳ Oldest First</option>
              <option value="title">🔤 Title (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Secondary Class & Medium Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="text-stone-400 font-medium">Quick Class:</span>
          {classes.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedClass === cls
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cls}
            </button>
          ))}

          <span className="text-stone-400 font-medium ml-3">Medium:</span>
          {mediums.map((med) => (
            <button
              key={med}
              onClick={() => setSelectedMedium(med)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedMedium === med
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {med}
            </button>
          ))}

          {(search || selectedSubject !== 'All' || selectedClass !== 'All' || selectedMedium !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedSubject('All');
                setSelectedClass('All');
                setSelectedMedium('All');
              }}
              className="ml-auto text-[11px] text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Free PDFs List / Grid */}
      {filteredAndSortedPdfs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-stone-900 font-sans">
              {search ? 'No Free PDFs matched your search' : 'Free PDFs Coming Soon'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              {search
                ? `No free study materials found for "${search}". Try searching with different keywords like Science, Maths, or HSLC.`
                : 'MKR Academy will be uploading free chapter notes, practice papers, and formulas shortly!'}
            </p>
          </div>

          {search && (
            <button
              onClick={() => setSearch('')}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Clear Search Query
            </button>
          )}

          {isAdmin && onNavigateToAdmin && (
            <div className="pt-4 border-t border-stone-100">
              <p className="text-xs text-stone-500 mb-2">
                Admin: You can add Free PDFs anytime by checking <strong>"Mark as Free PDF Note"</strong> in the Admin Panel!
              </p>
              <button
                onClick={onNavigateToAdmin}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                + Add Free PDF in Admin Panel
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold px-1">
            <span>
              Showing <strong>{filteredAndSortedPdfs.length}</strong> free notes (Newest uploaded at top)
            </span>
            {sortOrder === 'newest' && (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ✓ Latest Uploads First
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPdfs.map((product, idx) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between w-full max-w-full min-w-0"
              >
                <div>
                  {/* Thumbnail Cover */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-100">
                    <img
                      src={
                        product.coverImagePath ||
                        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent"></div>

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-xs flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-emerald-100" />
                        <span>100% FREE PDF</span>
                      </span>

                      {idx === 0 && sortOrder === 'newest' && (
                        <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs animate-pulse">
                          NEWEST
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs font-medium">
                      <span className="bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px]">
                        {product.classLevel} • {product.medium}
                      </span>
                      {product.pageCount ? (
                        <span className="flex items-center space-x-1 bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px]">
                          <FileText className="w-3 h-3 text-emerald-400" />
                          <span>{product.pageCount} Pages</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                        {product.subject}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Active'}
                      </span>
                    </div>

                    <h3
                      onClick={() => onViewDetails(product)}
                      className="font-bold text-stone-900 text-base line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors leading-snug"
                      title={product.title}
                    >
                      {product.title}
                    </h3>

                    <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed">
                      {product.shortDescription || product.description}
                    </p>

                    {product.chapters && product.chapters.length > 0 && (
                      <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-100 line-clamp-1">
                        <strong>Chapters:</strong> {product.chapters.slice(0, 2).join(', ')}
                        {product.chapters.length > 2 && ` +${product.chapters.length - 2} more`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 sm:p-5 pt-0 border-t border-stone-100 mt-2 space-y-2">
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-emerald-700 font-extrabold text-base flex items-center space-x-1">
                      <span>₹0</span>
                      <span className="text-xs font-bold text-stone-400 uppercase ml-1">Free Download</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium uppercase">
                      Google Drive PDF
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPreviewPdf(product)}
                      className="py-2.5 px-3 rounded-xl border border-stone-300 hover:border-stone-400 hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-500" />
                      <span>Preview</span>
                    </button>

                    {product.driveFileLink ? (
                      <a
                        href={product.driveFileLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-800/20 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Drive</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => onViewDetails(product)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read Note</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-App Drive Preview Modal */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="space-y-0.5 max-w-xl">
                <div className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                  <span>Free PDF Reader</span>
                </div>
                <h3 className="font-extrabold text-stone-900 text-sm sm:text-base truncate">
                  {previewPdf.title}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                {previewPdf.driveFileLink && (
                  <a
                    href={previewPdf.driveFileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Drive</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewPdf(null)}
                  className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Embed */}
            <div className="flex-1 bg-stone-100 min-h-[450px] relative overflow-hidden flex flex-col items-center justify-center">
              {previewPdf.driveFileLink ? (
                <iframe
                  src={getDrivePreviewEmbed(previewPdf.driveFileLink) || previewPdf.driveFileLink}
                  title={previewPdf.title}
                  className="w-full h-full min-h-[500px] border-0"
                  allow="autoplay"
                />
              ) : (
                <div className="p-8 text-center space-y-4 max-w-md">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-base">{previewPdf.title}</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      {previewPdf.description || previewPdf.shortDescription}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPreviewPdf(null);
                      onViewDetails(previewPdf);
                    }}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    View Complete Details
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold text-stone-700">
                {previewPdf.classLevel} • {previewPdf.subject} • 100% Free Note
              </span>
              <button
                onClick={() => setPreviewPdf(null)}
                className="px-4 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold cursor-pointer"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
