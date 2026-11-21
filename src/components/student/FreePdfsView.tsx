import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  ArrowUpDown,
  ArrowLeft,
  Eye,
  Download,
  AlertCircle,
  Share2,
  Lock,
  Calculator,
  FlaskConical,
  Globe,
  PenTool,
  ExternalLink,
  LucideIcon
} from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  FREE_NOTE_SUBJECTS,
  isFreeNote,
  matchFreeNoteSubject
} from '../../services/productService';
import {
  shareOrCopyProduct,
  storePendingDownload,
  triggerFileDownload,
  recordDownloadEvent,
  isAndroidWebViewApp
} from '../../services/downloadService';

interface FreePdfsViewProps {
  products?: Product[];
  freeNotes?: Product[];
  onViewDetails: (product: Product) => void;
  onNavigateToAdmin?: () => void;
  selectedSubjectId?: string | null;
  onSelectSubject?: (subjectId: string | null) => void;
  previewPdf?: Product | null;
  onPreviewPdf?: (product: Product | null) => void;
  onRequireAuth?: () => void;
}

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  mathematics: Calculator,
  science: FlaskConical,
  english: BookOpen,
  'social-science': Globe,
  assamese: PenTool
};

export const FreePdfsView: React.FC<FreePdfsViewProps> = ({
  products = [],
  freeNotes,
  onViewDetails,
  selectedSubjectId: propSubjectId,
  onSelectSubject,
  previewPdf: propPreviewPdf,
  onPreviewPdf,
  onRequireAuth
}) => {
  const { user } = useAuth();
  const isAndroidApp = isAndroidWebViewApp();
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Subject Selection: controlled or internal fallback
  const [internalSubjectId, setInternalSubjectId] = useState<string | null>(null);
  const selectedSubjectId = propSubjectId !== undefined ? propSubjectId : internalSubjectId;
  const setSelectedSubjectId = (id: string | null) => {
    if (onSelectSubject) {
      onSelectSubject(id);
    } else {
      setInternalSubjectId(id);
    }
  };

  // Search & Sorting state (scoped to selected subject view)
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');

  // In-App PDF Preview state: controlled or internal fallback
  const [internalPreviewPdf, setInternalPreviewPdf] = useState<Product | null>(null);
  const previewPdf = propPreviewPdf !== undefined ? propPreviewPdf : internalPreviewPdf;
  const setPreviewPdf = (prod: Product | null) => {
    if (onPreviewPdf) {
      onPreviewPdf(prod);
    } else {
      setInternalPreviewPdf(prod);
    }
  };

  // Filter only published Free Notes from dedicated freeNotes collection and any free products (deduplicated)
  const allFreeNotes = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      if (isFreeNote(p)) {
        map.set(p.id, { ...p, isFree: true });
      }
    });
    (freeNotes || []).forEach((p) => {
      if (p && p.published !== false) {
        map.set(p.id, { ...p, isFree: true });
      }
    });
    return Array.from(map.values());
  }, [freeNotes, products]);

  // Active subject configuration object
  const activeSubjectConfig = useMemo(() => {
    if (!selectedSubjectId) return null;
    return FREE_NOTE_SUBJECTS.find((s) => s.id === selectedSubjectId) || null;
  }, [selectedSubjectId]);

  // Filter and sort notes for the selected subject
  const displayedNotes = useMemo(() => {
    let list = allFreeNotes;

    if (selectedSubjectId && selectedSubjectId !== 'all') {
      list = list.filter((p) => matchFreeNoteSubject(p, selectedSubjectId));
    }

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

    return [...list].sort((a, b) => {
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortOrder === 'title') {
        return a.title.localeCompare(b.title);
      }
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

  const handleDownload = (product: Product) => {
    if (!user) {
      storePendingDownload(product);
      setAuthNotice(
        `Please create a student account or log in to download "${product.title}". Your download will resume automatically right after sign-in!`
      );
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    triggerFileDownload(product);
    recordDownloadEvent(product, undefined, true);
  };

  const handleShareProduct = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await shareOrCopyProduct(product);
    if (res.action === 'copied') {
      setCopiedId(product.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Full-Page In-App PDF Reader
  if (previewPdf) {
    const embedUrl = getDrivePreviewEmbed(previewPdf.driveFileLink) || previewPdf.driveFileLink;

    return (
      <div className="w-full min-h-[calc(100vh-140px)] bg-stone-950 text-white flex flex-col animate-in fade-in duration-200">
        <div className="bg-stone-900 px-4 sm:px-8 py-3.5 border-b border-stone-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              type="button"
              onClick={() => setPreviewPdf(null)}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-stone-400" />
              <span>Back</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-white truncate">
                {previewPdf.title}
              </h1>
              <p className="text-[11px] text-stone-400 truncate">
                {previewPdf.classLevel} • {previewPdf.subject}
              </p>
            </div>
          </div>

          {previewPdf.driveFileLink && (
            <button
              type="button"
              onClick={() => handleDownload(previewPdf)}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              {isAndroidApp ? (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in Drive</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex-1 bg-stone-950 p-3 sm:p-6 flex justify-center">
          {embedUrl ? (
            <div className="w-full max-w-6xl h-full min-h-[600px] flex flex-col rounded-3xl overflow-hidden border border-stone-800 bg-stone-900 shadow-2xl">
              <iframe
                src={embedUrl}
                title={previewPdf.title}
                className="w-full h-full flex-1 min-h-[600px] border-0"
                allow="autoplay"
              />
            </div>
          ) : (
            <div className="bg-white text-stone-900 rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-4 my-auto border border-stone-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-stone-900 text-base">{previewPdf.title}</h4>
              <p className="text-xs text-stone-500">
                No direct preview URL is attached for this note.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPreviewPdf(null);
                  onViewDetails(previewPdf);
                }}
                className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                View Note Details
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-10 space-y-5 sm:space-y-6 animate-in fade-in min-w-0">
      {/* Mandatory Sign-up Notification Banner (shown only on unauthenticated download attempt) */}
      {authNotice && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start justify-between gap-3 text-xs text-amber-900 shadow-sm animate-in fade-in">
          <div className="flex items-start space-x-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Student Registration Required: </span>
              <span>{authNotice}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAuthNotice(null)}
            className="text-amber-600 hover:text-amber-900 font-bold text-xs cursor-pointer p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW 1: MINIMAL FIVE-SUBJECT SELECTION GRID */}
      {selectedSubjectId === null ? (
        <section className="space-y-4 sm:space-y-6">
          <h1 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight text-center md:text-left">
            Free Notes
          </h1>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
            {FREE_NOTE_SUBJECTS.map((sub, index) => {
              const Icon = SUBJECT_ICONS[sub.id] || BookOpen;
              const isFifth = index === 4;

              return (
                <div
                  key={sub.id}
                  className={isFifth ? 'col-span-2 flex justify-center md:col-span-1' : ''}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectSubject(sub.id)}
                    className={`${
                      isFifth ? 'w-[calc(50%-0.375rem)] md:w-full' : 'w-full'
                    } h-full group bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md hover:border-red-300 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 px-3 py-5 sm:py-7 flex flex-col items-center justify-center gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-600/20`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 group-hover:bg-red-700 group-hover:text-white transition-colors duration-200 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm sm:text-base font-extrabold text-stone-900 group-hover:text-red-800 transition-colors text-center leading-tight">
                      {sub.name}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* VIEW 2: SELECTED SUBJECT NOTES LISTING */
        <div className="space-y-5">
          {/* Minimal Back Button & Subject Title */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-200">
            <div className="flex items-center space-x-3 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedSubjectId(null)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-700 hover:text-red-800 bg-white border border-stone-200 hover:border-red-200 px-3 py-2 rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              {activeSubjectConfig && (
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                    {React.createElement(SUBJECT_ICONS[activeSubjectConfig.id] || BookOpen, {
                      className: 'w-4 h-4'
                    })}
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-stone-900 truncate">
                    {activeSubjectConfig.name}
                  </h1>
                </div>
              )}
            </div>
          </div>

          {/* Search & Sort Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${activeSubjectConfig?.name || 'subject'} notes...`}
                className="w-full bg-stone-50 focus:bg-white text-stone-900 placeholder-stone-400 text-xs sm:text-sm rounded-xl pl-9 pr-9 py-2.5 border border-stone-200 focus:border-red-600 focus:outline-none transition-all"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
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
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'title')}
                className="bg-stone-50 border border-stone-200 text-stone-800 font-bold text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A to Z)</option>
              </select>
            </div>
          </div>

          {/* Notes Grid */}
          {displayedNotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-md mx-auto space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mx-auto">
                {React.createElement(
                  (activeSubjectConfig && SUBJECT_ICONS[activeSubjectConfig.id]) || BookOpen,
                  { className: 'w-6 h-6' }
                )}
              </div>
              <p className="text-sm font-bold text-stone-800">
                {search ? 'No matching notes found' : `No notes available for ${activeSubjectConfig?.name || 'this subject'}`}
              </p>
              <div className="flex justify-center gap-2">
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSubjectId(null)}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Back to Subjects
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedNotes.map((product) => {
                const SubjectIcon =
                  (activeSubjectConfig && SUBJECT_ICONS[activeSubjectConfig.id]) || BookOpen;

                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md hover:border-red-300 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
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
                            <SubjectIcon className="w-8 h-8 text-red-400" />
                            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-200">
                              {product.subject}
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />

                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs font-medium">
                          <span className="bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px]">
                            {product.classLevel || 'Class 10'}
                          </span>
                          {product.pageCount ? (
                            <span className="flex items-center space-x-1 bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px]">
                              <FileText className="w-3 h-3 text-red-400" />
                              <span>{product.pageCount} Pages</span>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 space-y-2">
                        <h3
                          onClick={() => onViewDetails(product)}
                          className="font-bold text-stone-900 text-base line-clamp-2 hover:text-red-700 cursor-pointer transition-colors leading-snug"
                          title={product.title}
                        >
                          {product.title}
                        </h3>

                        {product.chapters && product.chapters.length > 0 && (
                          <div className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100">
                            <span className="font-bold text-stone-800">Chapter: </span>
                            <span>{product.chapters.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 pt-0">
                      <div className="grid grid-cols-5 gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewPdf(product)}
                          className="col-span-2 py-2.5 px-2 rounded-xl border border-stone-300 hover:border-stone-400 hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                          title="View PDF"
                        >
                          <Eye className="w-3.5 h-3.5 text-stone-600" />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(product)}
                          className="col-span-2 py-2.5 px-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-xs transition-colors cursor-pointer"
                          title={isAndroidApp ? 'Open in Drive' : 'Download PDF'}
                        >
                          {isAndroidApp ? (
                            <>
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open in Drive</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleShareProduct(product, e)}
                          className="col-span-1 py-2.5 px-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 hover:text-stone-900 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          title={copiedId === product.id ? 'Copied' : 'Share Note'}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
