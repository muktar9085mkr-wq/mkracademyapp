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
  ArrowLeft,
  Eye,
  X,
  Download,
  AlertCircle
} from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  FREE_NOTE_SUBJECTS,
  isFreeNote,
  matchFreeNoteSubject,
  FreeNoteSubjectConfig
} from '../../services/productService';

interface FreePdfsViewProps {
  products?: Product[];
  freeNotes?: Product[];
  onViewDetails: (product: Product) => void;
  onNavigateToAdmin?: () => void;
}

export const FreePdfsView: React.FC<FreePdfsViewProps> = ({
  products = [],
  freeNotes,
  onViewDetails,
  onNavigateToAdmin
}) => {
  const { isAdmin } = useAuth();

  // Active Subject Selection: null = Subject Cards Overview, string = specific subject selected ('mathematics', 'science', etc.)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Search & Sorting state (scoped to current view)
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');

  // In-App PDF Preview state
  const [previewPdf, setPreviewPdf] = useState<Product | null>(null);

  // Filter only published Free Notes from dedicated freeNotes collection or fallback products
  const allFreeNotes = useMemo(() => {
    if (freeNotes && freeNotes.length > 0) {
      return freeNotes.filter((p) => p.published !== false);
    }
    return products.filter((p) => isFreeNote(p));
  }, [freeNotes, products]);

  // Compute live count of free notes for each of the 5 subjects strictly from real data
  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sub of FREE_NOTE_SUBJECTS) {
      counts[sub.id] = allFreeNotes.filter((p) => matchFreeNoteSubject(p, sub.id)).length;
    }
    return counts;
  }, [allFreeNotes]);

  // Active subject configuration object
  const activeSubjectConfig = useMemo(() => {
    if (!selectedSubjectId) return null;
    return FREE_NOTE_SUBJECTS.find((s) => s.id === selectedSubjectId) || null;
  }, [selectedSubjectId]);

  // Filter and sort notes for the selected subject (or all if 'all' selected)
  const displayedNotes = useMemo(() => {
    let list = allFreeNotes;

    // Apply exact subject filter
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      list = list.filter((p) => matchFreeNoteSubject(p, selectedSubjectId));
    }

    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((p) => {
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesDesc =
          (p.shortDescription || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q);
        const matchesChapters = p.chapters?.some((c) => c.toLowerCase().includes(q));
        const matchesClass = (p.classLevel || '').toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesChapters || matchesClass;
      });
    }

    // Apply sorting
    return [...list].sort((a, b) => {
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortOrder === 'title') {
        return a.title.localeCompare(b.title);
      }
      // Default: 'newest'
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [allFreeNotes, selectedSubjectId, search, sortOrder]);

  // Helper to extract embed preview URL for Google Drive
  const getDrivePreviewEmbed = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  // Helper to generate a direct download / export URL from Drive link
  const getDriveDirectDownloadUrl = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
    return url;
  };

  const handleDownload = (product: Product) => {
    const downloadUrl = getDriveDirectDownloadUrl(product.driveFileLink) || product.driveFileLink;
    if (downloadUrl) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } else {
      onViewDetails(product);
    }
  };

  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in min-w-0">
      
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-stone-500 font-medium">
        <button
          onClick={() => setSelectedSubjectId(null)}
          className="hover:text-stone-900 transition-colors cursor-pointer"
        >
          Free Notes
        </button>
        {activeSubjectConfig && (
          <>
            <span>/</span>
            <span className="text-stone-900 font-bold">{activeSubjectConfig.name} ({activeSubjectConfig.assamese})</span>
          </>
        )}
      </nav>

      {/* Main Header Strip */}
      <div className="w-full max-w-full bg-gradient-to-r from-emerald-900 via-stone-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Free Study Materials • বিনামূলীয়া অধ্যয়ন সামগ্ৰী</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-sans tracking-tight text-white break-words">
            {activeSubjectConfig
              ? `${activeSubjectConfig.name} Free Notes (${activeSubjectConfig.assamese})`
              : 'MKR Academy Free Notes Portal'}
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed break-words">
            {activeSubjectConfig
              ? `Browse all verified free chapter notes, practice papers, and formulas for ${activeSubjectConfig.name}. Open in Google Drive or download free without any registration or payment.`
              : 'Chapter-wise notes, formulas, and solved question sets organized across the 5 core subjects. Select any subject below to explore available free study materials.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-emerald-200">
            <span className="flex items-center space-x-1.5 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {activeSubjectConfig
                  ? `${subjectCounts[activeSubjectConfig.id] || 0} Free Notes in ${activeSubjectConfig.name}`
                  : `${allFreeNotes.length} Total Free Notes Available Across Subjects`}
              </span>
            </span>
            <span className="text-stone-300">
              • Direct Google Drive Access
            </span>
          </div>
        </div>
      </div>

      {/* Quick Subject Tabs Bar (Always accessible on desktop and mobile) */}
      <div className="bg-white p-2 sm:p-3 rounded-2xl border border-stone-200 shadow-xs flex items-center space-x-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            setSelectedSubjectId(null);
            setSearch('');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center space-x-1.5 ${
            selectedSubjectId === null
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <span>All 5 Subjects</span>
        </button>

        {FREE_NOTE_SUBJECTS.map((sub) => {
          const count = subjectCounts[sub.id] || 0;
          const isSelected = selectedSubjectId === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => handleSelectSubject(sub.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center space-x-2 ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              <span>{sub.icon}</span>
              <span>{sub.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  isSelected
                    ? 'bg-emerald-900 text-emerald-100'
                    : count > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: SUBJECT CARDS OVERVIEW (When no specific subject is selected) */}
      {selectedSubjectId === null ? (
        <div className="space-y-8">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-sans">
                Select a Subject to Explore Free Notes
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Choose from the five core subjects below to view all available free study materials.
            </p>
          </div>

          {/* The 5 Subject Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FREE_NOTE_SUBJECTS.map((sub) => {
              const count = subjectCounts[sub.id] || 0;
              return (
                <div
                  key={sub.id}
                  onClick={() => handleSelectSubject(sub.id)}
                  className={`group bg-white rounded-3xl border border-stone-200 hover:border-emerald-500 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden`}
                >
                  {/* Subject Header */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-stone-100 group-hover:bg-emerald-50 flex items-center justify-center text-3xl transition-colors border border-stone-200 group-hover:border-emerald-200">
                        {sub.icon}
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {count > 0 ? `${count} Free ${count === 1 ? 'Note' : 'Notes'}` : '0 Notes'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-extrabold text-stone-900 group-hover:text-emerald-800 transition-colors font-sans">
                        {sub.name}
                      </h3>
                      <p className="text-xs font-semibold text-stone-500">
                        {sub.assamese} • Free Study Material
                      </p>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {count > 0
                        ? `Access ${count} chapter-wise note${count > 1 ? 's' : ''} with solved questions and exam tips.`
                        : `No free notes uploaded yet for ${sub.name}. Check back shortly!`}
                    </p>
                  </div>

                  {/* Card Action */}
                  <div className="pt-6 mt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-700 group-hover:text-emerald-800 flex items-center space-x-1">
                      <span>View {sub.name} Notes</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">100% Free PDF</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Notice for Admin */}
          {isAdmin && onNavigateToAdmin && (
            <div className="bg-stone-100 border border-stone-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-700">
              <div className="space-y-0.5">
                <p className="font-bold text-stone-900">Administrator Tools</p>
                <p className="text-stone-500">
                  You can add or update Free Notes for any of the 5 subjects in the Admin Panel Free Notes Manager.
                </p>
              </div>
              <button
                onClick={onNavigateToAdmin}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shrink-0 transition-colors cursor-pointer"
              >
                Open Free Notes Manager →
              </button>
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: SUBJECT NOTES LISTING (When a specific subject is selected) */
        <div className="space-y-6">
          {/* Back Button & Subject Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
            <button
              onClick={() => setSelectedSubjectId(null)}
              className="inline-flex items-center space-x-2 text-xs font-bold text-stone-700 hover:text-emerald-800 bg-stone-100 hover:bg-stone-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Subjects</span>
            </button>

            <div className="flex items-center space-x-2 text-xs text-stone-500">
              <span>Showing:</span>
              <strong className="text-stone-900 font-bold">
                {activeSubjectConfig?.name} ({displayedNotes.length} available)
              </strong>
            </div>
          </div>

          {/* Search & Sort Bar for the Selected Subject */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search within ${activeSubjectConfig?.name || 'subject'} free notes by chapter or topic...`}
                className="w-full bg-stone-50 focus:bg-white text-stone-900 placeholder-stone-400 text-xs sm:text-sm rounded-xl pl-9 pr-9 py-2.5 border border-stone-200 focus:border-emerald-600 focus:outline-none transition-all"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-700 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0 text-xs">
              <span className="text-stone-500 font-bold flex items-center space-x-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                <span>Sort:</span>
              </span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-stone-50 border border-stone-200 text-stone-800 font-bold text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="newest">🔥 Newest First</option>
                <option value="oldest">⏳ Oldest First</option>
                <option value="title">🔤 Title (A to Z)</option>
              </select>
            </div>
          </div>

          {/* Subject Notes Listing or Specific Empty State */}
          {displayedNotes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto text-3xl">
                {activeSubjectConfig?.icon || '📚'}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-extrabold text-stone-900 font-sans">
                  {search ? 'No notes matched your search' : 'No free notes available yet.'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {search
                    ? `No free study materials found for "${search}" in ${activeSubjectConfig?.name}. Try a different keyword.`
                    : `Free study materials for ${activeSubjectConfig?.name || 'this subject'} will be uploaded soon by MKR Academy. Check back shortly!`}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
                <button
                  onClick={() => setSelectedSubjectId(null)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Browse Other Subjects
                </button>
              </div>

              {isAdmin && onNavigateToAdmin && (
                <div className="pt-4 border-t border-stone-100">
                  <button
                    onClick={onNavigateToAdmin}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    + Add {activeSubjectConfig?.name} Free Note in Admin Panel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedNotes.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-400 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail or Subject Banner */}
                    <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-100">
                      {product.coverImagePath ? (
                        <img
                          src={product.coverImagePath}
                          alt={product.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-900 to-stone-800 flex flex-col items-center justify-center text-white p-4 text-center space-y-2">
                          <span className="text-3xl">{activeSubjectConfig?.icon || '📖'}</span>
                          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                            {product.subject}
                          </span>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent"></div>

                      {/* 100% Free Badge */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-xs flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-emerald-100" />
                          <span>100% FREE NOTE</span>
                        </span>
                        <span className="bg-stone-900/90 text-stone-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {product.fileType || 'PDF Document'}
                        </span>
                      </div>

                      {/* Metadata bar at bottom of thumbnail */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs font-medium">
                        <span className="bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px]">
                          {product.classLevel || 'Class 10'} • {product.medium || 'Both Mediums'}
                        </span>
                        {product.pageCount ? (
                          <span className="flex items-center space-x-1 bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px]">
                            <FileText className="w-3 h-3 text-emerald-400" />
                            <span>{product.pageCount} Pages</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 sm:p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span className="font-extrabold text-emerald-700 uppercase tracking-wider text-[11px]">
                          {product.subject}
                        </span>
                        {product.createdAt && (
                          <span className="text-[10px] text-stone-400">
                            {new Date(product.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => onViewDetails(product)}
                        className="font-bold text-stone-900 text-base line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors leading-snug"
                        title={product.title}
                      >
                        {product.title}
                      </h3>

                      {/* Chapter or topic name if available in record */}
                      {product.chapters && product.chapters.length > 0 ? (
                        <div className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100">
                          <span className="font-bold text-stone-800">Chapter / Topic: </span>
                          <span>{product.chapters.join(', ')}</span>
                        </div>
                      ) : product.shortDescription ? (
                        <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed">
                          {product.shortDescription}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Card Action Buttons (View PDF and Download PDF) */}
                  <div className="p-4 sm:p-5 pt-0 border-t border-stone-100 mt-2 space-y-2">
                    <div className="flex items-center justify-between pt-2 text-xs">
                      <span className="text-emerald-700 font-extrabold text-sm flex items-center space-x-1">
                        <span>₹0</span>
                        <span className="text-[11px] font-bold text-stone-400 uppercase ml-1">Free Access</span>
                      </span>
                      <span className="text-[10px] text-stone-400 uppercase font-mono">
                        Google Drive
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPreviewPdf(product)}
                        className="py-2.5 px-3 rounded-xl border border-stone-300 hover:border-stone-400 hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                        title="View PDF online"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-600" />
                        <span>View PDF</span>
                      </button>

                      <button
                        onClick={() => handleDownload(product)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-800/20 transition-all cursor-pointer"
                        title="Download or open in Google Drive"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* In-App PDF Preview Reader Modal */}
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
                  <button
                    onClick={() => handleDownload(previewPdf)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
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
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-base">{previewPdf.title}</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      No direct preview URL is attached for this free note.
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
