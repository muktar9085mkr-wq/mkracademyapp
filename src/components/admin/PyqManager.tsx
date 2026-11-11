import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  Lock,
  Unlock,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Calendar,
  DollarSign,
  BookOpen,
  Award,
  Target,
  Sparkles,
  Link,
  Plus,
  Loader2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Product, SubjectType, MediumType, ProductPdfEntry } from '../../types';
import {
  addProduct,
  updateProduct,
  deleteProduct,
  deleteLegacySampleProductsAdmin,
  isPYQProduct,
  getPYQExamCategory,
  getPYQYear,
  PYQExamCategory
} from '../../services/productService';

interface PyqManagerProps {
  products: Product[];
  onRefreshProducts: () => void;
  onViewProduct?: (product: Product) => void;
}

const SUBJECT_OPTIONS: SubjectType[] = [
  'General Science',
  'Mathematics',
  'English',
  'Social Science',
  'Assamese',
  'Other Subjects'
];

const MEDIUM_OPTIONS: MediumType[] = [
  'Both Mediums',
  'Assamese Medium',
  'English Medium'
];

const DEFAULT_COVER_BY_SUBJECT: Record<string, string> = {
  'General Science': 'https://user46792.na.imgto.link/public/20261021/4cdf18f40b84ec2326f0e6dd-assameseww.avif',
  'Mathematics': 'https://user46792.na.imgto.link/public/20261024/839e8e6d731a03d018e2758b-english-complete-notes-hslc-2027.avif',
  'English': 'https://user46792.na.imgto.link/public/20261022/6cbc6119234e32533fd182f1-engfhb.avif',
  'Social Science': 'https://user46792.na.imgto.link/public/20261021/31d28f4e794d9dd10411f5ee-socialvv.avif',
  'Assamese': 'https://user46792.na.imgto.link/public/20261022/52ba502d0af0b8cd6dc5892b-assbbg.avif',
  'Other Subjects': 'https://user46792.na.imgto.link/public/20261021/22ab0a34a0090b167878d87d-madam-reee.avif'
};

export const PyqManager: React.FC<PyqManagerProps> = ({
  products,
  onRefreshProducts,
  onViewProduct
}) => {
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | PYQExamCategory>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // In-app Delete Confirmation Modal State
  const [paperToDelete, setPaperToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPurgingSamples, setIsPurgingSamples] = useState(false);

  // Automatically purge legacy sample documents on mount
  useEffect(() => {
    deleteLegacySampleProductsAdmin()
      .then((count) => {
        if (count > 0) {
          onRefreshProducts();
        }
      })
      .catch(() => {});
  }, []);

  // Form Fields
  const [formCategory, setFormCategory] = useState<PYQExamCategory>('HSLC');
  const [formYear, setFormYear] = useState<number>(2024);
  const [formSubject, setFormSubject] = useState<SubjectType>('General Science');
  const [formMedium, setFormMedium] = useState<MediumType>('Both Mediums');
  const [formClassLevel, setFormClassLevel] = useState<string>('Class 10');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formShortDesc, setFormShortDesc] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formSellingPriceRs, setFormSellingPriceRs] = useState<number>(49);
  const [formOriginalPriceRs, setFormOriginalPriceRs] = useState<number>(99);
  const [formDriveUrl, setFormDriveUrl] = useState<string>('');
  const [formCoverImage, setFormCoverImage] = useState<string>('');
  const [formPublished, setFormPublished] = useState<boolean>(true);
  const [formPdfList, setFormPdfList] = useState<ProductPdfEntry[]>([]);

  // Filter only PYQ products
  const pyqList = useMemo(() => {
    return products.filter((p) => isPYQProduct(p));
  }, [products]);

  // Counts
  const hslcCount = useMemo(() => pyqList.filter((p) => getPYQExamCategory(p) === 'HSLC').length, [pyqList]);
  const halfYearlyCount = useMemo(() => pyqList.filter((p) => getPYQExamCategory(p) === 'Half Yearly').length, [pyqList]);
  const preFinalCount = useMemo(() => pyqList.filter((p) => getPYQExamCategory(p) === 'Pre-Final').length, [pyqList]);

  // Filtered PYQ list
  const filteredPyqs = useMemo(() => {
    return pyqList.filter((p) => {
      if (selectedCategoryTab !== 'all' && getPYQExamCategory(p) !== selectedCategoryTab) {
        return false;
      }
      if (yearFilter !== 'all' && String(getPYQYear(p)) !== String(yearFilter)) {
        return false;
      }
      if (subjectFilter !== 'all' && p.subject !== subjectFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (p.title || '').toLowerCase().includes(q) ||
          (p.subject || '').toLowerCase().includes(q) ||
          String(getPYQYear(p)).includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [pyqList, selectedCategoryTab, yearFilter, subjectFilter, searchQuery]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Add Form
  const handleOpenAddForm = () => {
    setEditingProductId(null);
    setFormCategory('HSLC');
    setFormYear(2024);
    setFormSubject('General Science');
    setFormMedium('Both Mediums');
    setFormClassLevel('Class 10');
    setFormTitle('HSLC 2024: General Science Question Paper with Full Solutions');
    setFormShortDesc('Official SEBA HSLC 2024 General Science examination paper with complete step-by-step verified solutions.');
    setFormDesc('Official SEBA / ASSEB HSLC 2024 General Science Question Paper.\n\n• Complete solved answers for Physics, Chemistry and Biology sections\n• Marking scheme and high-scoring answer presentation tips\n• Verified by experienced Assam board teachers\n\nInstant locked access. Unlock with one click.');
    setFormSellingPriceRs(49);
    setFormOriginalPriceRs(99);
    setFormDriveUrl('');
    setFormCoverImage(DEFAULT_COVER_BY_SUBJECT['General Science']);
    setFormPublished(true);
    setFormPdfList([]);
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEditForm = (p: Product) => {
    setEditingProductId(p.id);
    const cat = getPYQExamCategory(p);
    const yr = getPYQYear(p);
    setFormCategory(cat);
    setFormYear(yr);
    setFormSubject((p.subject as SubjectType) || 'General Science');
    setFormMedium((p.medium as MediumType) || 'Both Mediums');
    setFormClassLevel((p.classLevel as string) || 'Class 10');
    setFormTitle(p.title || '');
    setFormShortDesc(p.shortDescription || '');
    setFormDesc(p.description || '');
    setFormSellingPriceRs(Math.round((p.sellingPricePaise || 4900) / 100));
    setFormOriginalPriceRs(Math.round((p.originalPricePaise || 9900) / 100));
    setFormDriveUrl(p.driveFileLink || '');
    setFormCoverImage(p.coverImagePath || DEFAULT_COVER_BY_SUBJECT[p.subject as string] || '');
    setFormPublished(p.published !== false);
    setFormPdfList(p.pdfList || []);
    setIsFormOpen(true);
  };

  // Auto-generate title suggestion when category, year, or subject changes
  const handleAutoSuggestTitle = (newCat: PYQExamCategory, newYear: number, newSub: string) => {
    setFormTitle(`${newCat} ${newYear}: ${newSub} Question Paper with Solutions`);
  };

  // Save Form
  const handleSavePYQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('error', 'Please enter a title for the question paper.');
      return;
    }

    if (formSellingPriceRs <= 0) {
      showToast('error', 'PYQ papers must have a selling price (locked/paid). For free notes, use the Free Notes Manager.');
      return;
    }

    try {
      setIsSubmitting(true);
      const slug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const cover = formCoverImage.trim() || DEFAULT_COVER_BY_SUBJECT[formSubject] || DEFAULT_COVER_BY_SUBJECT['General Science'];

      const payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formTitle.trim(),
        slug: slug || `pyq-${Date.now()}`,
        shortDescription: formShortDesc.trim() || `${formCategory} ${formYear} ${formSubject} Question Paper.`,
        description: formDesc.trim() || `${formCategory} ${formYear} ${formSubject} Question Paper with complete solutions.`,
        subject: formSubject,
        classLevel: formClassLevel,
        examTarget: `${formCategory} ${formYear}`,
        medium: formMedium,
        category: 'Budget Friendly',
        tags: ['Previous Year Questions', `${formCategory} PYQ`],
        chapters: [`${formCategory} ${formYear} Exam`],
        coverImagePath: cover,
        driveFileLink: formDriveUrl.trim(),
        pdfList: formPdfList,
        fileType: 'PDF Document',
        pdfFileName: `${slug}.pdf`,
        originalPricePaise: Math.round(formOriginalPriceRs * 100),
        sellingPricePaise: Math.round(formSellingPriceRs * 100),
        isFree: false, // PYQ papers are strictly paid / locked
        pyqType: formCategory,
        pyqYear: formYear,
        featured: false,
        published: formPublished
      };

      if (editingProductId) {
        await updateProduct(editingProductId, payload);
        showToast('success', `Question paper "${formTitle}" updated successfully!`);
      } else {
        await addProduct(payload);
        showToast('success', `New question paper "${formTitle}" added successfully!`);
      }

      setIsFormOpen(false);
      onRefreshProducts();
    } catch (err: any) {
      console.error('Failed to save PYQ:', err);
      showToast('error', err?.message || 'Failed to save question paper.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete PYQ via In-App Confirmation Modal
  const handleConfirmDelete = async () => {
    if (!paperToDelete) return;
    try {
      setIsDeleting(true);
      await deleteProduct(paperToDelete.id);
      showToast('success', `Question paper "${paperToDelete.title}" deleted.`);
      setPaperToDelete(null);
      onRefreshProducts();
    } catch (err: any) {
      console.error('Failed to delete PYQ:', err);
      showToast('error', err?.message || 'Failed to delete question paper.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePurgeAllSamples = async () => {
    try {
      setIsPurgingSamples(true);
      const count = await deleteLegacySampleProductsAdmin();
      showToast('success', count > 0 ? `Successfully removed ${count} sample question papers.` : 'All sample question papers are already clean.');
      onRefreshProducts();
    } catch (err: any) {
      console.error('Failed to purge sample data:', err);
      showToast('error', 'Failed to clean sample data.');
    } finally {
      setIsPurgingSamples(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center space-x-3 text-xs font-bold shadow-lg animate-in fade-in duration-150 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase">
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>PYQ System • Locked & Paid Papers</span>
          </div>
          <h2 className="text-xl font-black text-stone-900 font-sans">
            Previous Year Papers (PYQ) Manager
          </h2>
          <p className="text-xs text-stone-500 max-w-2xl leading-relaxed">
            Manage year-wise question papers for <strong>HSLC</strong>, <strong>Half Yearly</strong>, and <strong>Pre-Final</strong> exams. Papers remain locked until purchased by students via Razorpay.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handlePurgeAllSamples}
            disabled={isPurgingSamples}
            className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Clean any legacy sample data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPurgingSamples ? 'animate-spin' : ''}`} />
            <span>{isPurgingSamples ? 'Cleaning...' : 'Clean Sample Data'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddForm}
            className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New PYQ Paper</span>
          </button>
        </div>
      </div>

      {/* 3 Categories Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setSelectedCategoryTab('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedCategoryTab === 'all'
              ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold block opacity-75">All Categories</span>
          <span className="text-xl font-black">{pyqList.length} Papers</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategoryTab('HSLC')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedCategoryTab === 'HSLC'
              ? 'bg-red-700 text-white border-red-700 shadow-sm'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-red-50/50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold block opacity-75">1. HSLC PYQ</span>
          <span className="text-xl font-black">{hslcCount} Papers</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategoryTab('Half Yearly')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedCategoryTab === 'Half Yearly'
              ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-blue-50/50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold block opacity-75">2. Half Yearly PYQ</span>
          <span className="text-xl font-black">{halfYearlyCount} Papers</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategoryTab('Pre-Final')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedCategoryTab === 'Pre-Final'
              ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-purple-50/50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold block opacity-75">3. Pre-Final PYQ</span>
          <span className="text-xl font-black">{preFinalCount} Papers</span>
        </button>
      </div>

      {/* Filter Row: Year, Subject, and Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-bold text-stone-800 text-xs focus:outline-none focus:border-red-600"
            >
              <option value="all">All Years</option>
              <option value="2026">Year 2026</option>
              <option value="2025">Year 2025</option>
              <option value="2024">Year 2024</option>
              <option value="2023">Year 2023</option>
              <option value="2022">Year 2022</option>
              <option value="2021">Year 2021</option>
              <option value="2020">Year 2020</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-bold text-stone-800 text-xs focus:outline-none focus:border-red-600"
            >
              <option value="all">All Subjects</option>
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, subject..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-red-600"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ==============================================================
          ADD / EDIT PYQ MODAL / FORM
          ============================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {editingProductId ? 'Edit Question Paper' : 'Add New Question Paper'}
                </span>
                <h3 className="text-lg font-black text-stone-900 mt-1">
                  {editingProductId ? 'Update PYQ Paper' : 'Add Year-Wise PYQ Paper (Locked & Paid)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePYQ} className="space-y-4">
              
              {/* 1. Exam Category & Exam Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Exam Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const newCat = e.target.value as PYQExamCategory;
                      setFormCategory(newCat);
                      handleAutoSuggestTitle(newCat, formYear, formSubject);
                    }}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-red-600"
                  >
                    <option value="HSLC">1. HSLC PYQ (Board Final Exam)</option>
                    <option value="Half Yearly">2. Half Yearly PYQ (Mid-Term Exam)</option>
                    <option value="Pre-Final">3. Pre-Final PYQ (Pre-Board Test)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Examination Year *
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => {
                      const newYr = Number(e.target.value);
                      setFormYear(newYr);
                      handleAutoSuggestTitle(formCategory, newYr, formSubject);
                    }}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-red-600"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                    <option value={2023}>2023</option>
                    <option value={2022}>2022</option>
                    <option value={2021}>2021</option>
                    <option value={2020}>2020</option>
                  </select>
                </div>
              </div>

              {/* 2. Subject & Medium */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Subject *
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => {
                      const newSub = e.target.value as SubjectType;
                      setFormSubject(newSub);
                      setFormCoverImage(DEFAULT_COVER_BY_SUBJECT[newSub] || DEFAULT_COVER_BY_SUBJECT['General Science']);
                      handleAutoSuggestTitle(formCategory, formYear, newSub);
                    }}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-red-600"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Medium *
                  </label>
                  <select
                    value={formMedium}
                    onChange={(e) => setFormMedium(e.target.value as MediumType)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-red-600"
                  >
                    {MEDIUM_OPTIONS.map((med) => (
                      <option key={med} value={med}>
                        {med}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Question Paper Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. HSLC 2024: General Science Question Paper with Full Solutions"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* 4. Short Description & Full Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Short Summary
                </label>
                <input
                  type="text"
                  value={formShortDesc}
                  onChange={(e) => setFormShortDesc(e.target.value)}
                  placeholder="Brief summary shown on card preview..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Detailed Description & Solution Notes
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Details about question paper, marking scheme, important questions included..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* 5. Pricing (Locked & Paid Notice) */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-black text-amber-900">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Locked Paper Pricing (Paid Access)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Question papers are locked by default. Students will see a lock icon with the price and must purchase via Razorpay to unlock instant viewing and PDF download.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formSellingPriceRs}
                      onChange={(e) => setFormSellingPriceRs(Number(e.target.value))}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      Original / MRP Price (₹)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formOriginalPriceRs}
                      onChange={(e) => setFormOriginalPriceRs(Number(e.target.value))}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Google Drive PDF Link */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>Google Drive PDF Link (Question Paper + Solutions) *</span>
                  <span className="text-[10px] text-stone-400 font-normal">Share permission: "Anyone with the link can view"</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formDriveUrl}
                    onChange={(e) => setFormDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=drivesdk"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-16 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-red-600"
                  />
                  <Link className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  {formDriveUrl && (
                    <a
                      href={formDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1.5 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Test</span>
                    </a>
                  )}
                </div>
              </div>

              {/* 7. Cover Image */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={formCoverImage}
                  onChange={(e) => setFormCoverImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* 8. Published Status */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="formPublished"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="w-4 h-4 text-red-700 rounded border-stone-300 focus:ring-red-600"
                />
                <label htmlFor="formPublished" className="text-xs font-bold text-stone-800 cursor-pointer">
                  Publish immediately (visible to students in Previous Papers section)
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-extrabold shadow-xs transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Firebase...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingProductId ? 'Update Paper' : 'Save & Publish PYQ'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          PYQ PAPERS LIST (TABLE / CARDS)
          ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-stone-500">
            {selectedCategoryTab === 'all' ? 'All Question Papers' : `${selectedCategoryTab} Papers`}
            {yearFilter !== 'all' ? ` (${yearFilter})` : ''}
          </span>
          <span className="text-xs text-stone-500 font-medium">
            Total {filteredPyqs.length} papers
          </span>
        </div>

        {filteredPyqs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">
              No question papers found matching your filters
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Click the button below to add your first question paper for this category.
            </p>
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl"
            >
              + Add PYQ Paper
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPyqs.map((paper) => {
              const cat = getPYQExamCategory(paper);
              const yr = getPYQYear(paper);
              const priceRs = Math.round((paper.sellingPricePaise || 4900) / 100);
              const originalRs = Math.round((paper.originalPricePaise || 9900) / 100);

              return (
                <div
                  key={paper.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-red-300 transition-colors"
                >
                  <div className="space-y-2">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            cat === 'HSLC'
                              ? 'bg-red-100 text-red-800'
                              : cat === 'Half Yearly'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {cat} PYQ
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-800">
                          Year {yr}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 text-amber-700 text-xs font-bold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>₹{priceRs}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-sm text-stone-900 line-clamp-2 leading-snug">
                      {paper.title}
                    </h4>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-1 text-[11px] text-stone-500 font-medium">
                      <span>{paper.subject}</span>
                      <span>•</span>
                      <span>{paper.medium || 'Both Mediums'}</span>
                      {paper.published === false && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700 font-bold bg-amber-50 px-1 rounded">Draft</span>
                        </>
                      )}
                    </div>

                    {/* PDF Link status */}
                    <div className="text-[11px] text-stone-600 flex items-center space-x-1 truncate bg-stone-50 p-1.5 rounded-lg border border-stone-100 font-mono">
                      <FileText className="w-3 h-3 shrink-0 text-red-600" />
                      <span className="truncate flex-1">
                        {paper.driveFileLink || paper.pdfFileName || 'PDF file attached'}
                      </span>
                      {paper.driveFileLink && (
                        <a
                          href={paper.driveFileLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-700 hover:text-red-900 p-0.5 shrink-0"
                          title="Open PDF"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    {onViewProduct && (
                      <button
                        type="button"
                        onClick={() => onViewProduct(paper)}
                        className="text-stone-600 hover:text-stone-900 font-bold flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                    )}

                    <div className="flex items-center space-x-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(paper)}
                        className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="Edit question paper"
                      >
                        <Edit className="w-4 h-4 text-stone-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaperToDelete(paper)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete question paper"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-App Delete Confirmation Modal (Replaces browser popups for 100% reliability) */}
      {paperToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-black text-stone-900 text-base">
                Delete Question Paper?
              </h3>
              <p className="text-xs text-stone-600 font-semibold line-clamp-2 px-2 bg-stone-50 py-2 rounded-xl border border-stone-100">
                "{paperToDelete.title}"
              </p>
              <p className="text-[11px] text-red-600 font-medium">
                This will permanently delete this question paper from the database and remove it from student view.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaperToDelete(null)}
                disabled={isDeleting}
                className="py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-extrabold shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
