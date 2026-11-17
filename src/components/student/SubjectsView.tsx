import React, { useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  ChevronRight,
  FileText,
  FlaskConical,
  Globe,
  Layers,
  PenTool,
  LucideIcon
} from 'lucide-react';
import { Product } from '../../types';
import { isFreeNote } from '../../services/productService';

interface SubjectsViewProps {
  products: Product[];
  freeNotes?: Product[];
  onBack: () => void;
  onSelectSubject: (subject: string) => void;
  onBrowseAllPdfs: () => void;
}

interface SubjectCardInfo {
  key: string;
  name: string;
  filterValue: string;
  subtitle: string;
  badge: string;
  icon: LucideIcon;
  bg: string;
  border: string;
  iconBg: string;
  textColor: string;
  totalCount: number;
  freeCount: number;
  paidCount: number;
}

const CORE_SUBJECTS: Array<{
  key: string;
  name: string;
  filterValue: string;
  subtitle: string;
  badge: string;
  icon: LucideIcon;
  bg: string;
  border: string;
  iconBg: string;
  textColor: string;
}> = [
  {
    key: 'mathematics',
    name: 'Mathematics',
    filterValue: 'Mathematics',
    subtitle: 'গণিত',
    badge: 'Formulas & Solved',
    icon: Calculator,
    bg: 'bg-purple-50/70',
    border: 'border-purple-200 hover:border-purple-400',
    iconBg: 'bg-purple-600',
    textColor: 'text-purple-950'
  },
  {
    key: 'science',
    name: 'General Science',
    filterValue: 'General Science',
    subtitle: 'সাধাৰণ বিজ্ঞান',
    badge: 'Physics, Chem & Bio',
    icon: FlaskConical,
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-200 hover:border-emerald-400',
    iconBg: 'bg-emerald-600',
    textColor: 'text-emerald-950'
  },
  {
    key: 'english',
    name: 'English',
    filterValue: 'English',
    subtitle: 'ইংৰাজী',
    badge: 'Grammar & Prose',
    icon: BookOpen,
    bg: 'bg-blue-50/70',
    border: 'border-blue-200 hover:border-blue-400',
    iconBg: 'bg-blue-600',
    textColor: 'text-blue-950'
  },
  {
    key: 'social-science',
    name: 'Social Science',
    filterValue: 'Social Science',
    subtitle: 'সমাজ বিজ্ঞান',
    badge: 'History, Geo & Civics',
    icon: Globe,
    bg: 'bg-rose-50/70',
    border: 'border-rose-200 hover:border-rose-400',
    iconBg: 'bg-rose-600',
    textColor: 'text-rose-950'
  },
  {
    key: 'assamese',
    name: 'Assamese',
    filterValue: 'Assamese',
    subtitle: 'অসমীয়া',
    badge: 'MIL & Grammar',
    icon: PenTool,
    bg: 'bg-amber-50/70',
    border: 'border-amber-200 hover:border-amber-400',
    iconBg: 'bg-amber-600',
    textColor: 'text-amber-950'
  }
];

function normalizeSubjectKey(subject?: string): string {
  const s = (subject || '').trim().toLowerCase();
  if (s === 'mathematics' || s === 'maths' || s === 'math') return 'mathematics';
  if (s === 'science' || s === 'general science') return 'science';
  if (s === 'english') return 'english';
  if (s === 'social science') return 'social-science';
  if (s === 'assamese') return 'assamese';
  return s || 'other-subjects';
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  products = [],
  freeNotes = [],
  onBack,
  onSelectSubject,
  onBrowseAllPdfs
}) => {
  const { subjectCards, totalPdfCount } = useMemo(() => {
    const paidNotes = products.filter(
      (item) => item && item.id && item.published !== false && !isFreeNote(item) && Number(item.sellingPricePaise || 0) > 0
    );
    const freeMap = new Map<string, Product>();
    products.forEach((p) => {
      if (isFreeNote(p)) freeMap.set(p.id, p);
    });
    freeNotes.forEach((n) => {
      if (n && n.published !== false) freeMap.set(n.id, n);
    });

    const countsByKey = new Map<string, { total: number; free: number; paid: number; rawName: string }>();

    for (const item of paidNotes) {
      const key = normalizeSubjectKey(item.subject);
      const prev = countsByKey.get(key) || {
        total: 0,
        free: 0,
        paid: 0,
        rawName: item.subject || 'Other Subjects'
      };
      countsByKey.set(key, {
        total: prev.total + 1,
        free: prev.free,
        paid: prev.paid + 1,
        rawName: prev.rawName
      });
    }

    freeMap.forEach((item) => {
      const key = normalizeSubjectKey(item.subject);
      const prev = countsByKey.get(key) || {
        total: 0,
        free: 0,
        paid: 0,
        rawName: item.subject || 'Other Subjects'
      };
      countsByKey.set(key, {
        total: prev.total,
        free: prev.free + 1,
        paid: prev.paid,
        rawName: prev.rawName
      });
    });

    const cards: SubjectCardInfo[] = CORE_SUBJECTS.map((core) => {
      const stats = countsByKey.get(core.key);
      return {
        ...core,
        totalCount: stats?.paid || 0,
        freeCount: stats?.free || 0,
        paidCount: stats?.paid || 0
      };
    });

    // Include any additional dynamic subjects from Firestore that have materials
    const coreKeys = new Set(CORE_SUBJECTS.map((c) => c.key));
    countsByKey.forEach((stats, key) => {
      if (!coreKeys.has(key) && stats.paid > 0) {
        cards.push({
          key,
          name: stats.rawName,
          filterValue: stats.rawName,
          subtitle: 'Study Materials',
          badge: 'PDF Library',
          icon: Layers,
          bg: 'bg-stone-50',
          border: 'border-stone-200 hover:border-red-300',
          iconBg: 'bg-red-700',
          textColor: 'text-stone-900',
          totalCount: stats.paid,
          freeCount: stats.free,
          paidCount: stats.paid
        });
      }
    });

    return {
      subjectCards: cards,
      totalPdfCount: paidNotes.length
    };
  }, [products, freeNotes]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 animate-in fade-in duration-200 min-w-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-stone-700 hover:text-red-700 font-bold text-xs sm:text-sm px-2.5 py-1.5 rounded-xl hover:bg-stone-200/70 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onBrowseAllPdfs}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>All PDFs ({totalPdfCount})</span>
        </button>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-red-700">
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          All Subjects ({subjectCards.length})
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Select a subject below to browse study notes, question banks, and PDFs.
        </p>
      </div>

      {/* Dynamic Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjectCards.map((subj) => {
          const Icon = subj.icon;
          return (
            <button
              key={subj.key}
              type="button"
              onClick={() => onSelectSubject(subj.filterValue)}
              className={`group w-full text-left bg-white rounded-2xl border ${subj.border} p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-600/20`}
            >
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div
                  className={`w-12 h-12 rounded-2xl ${subj.iconBg} text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h2 className={`text-base font-extrabold ${subj.textColor} truncate`}>
                    {subj.name}
                  </h2>
                  <p className="text-xs text-stone-500 truncate">
                    {subj.subtitle} • {subj.badge}
                  </p>
                  <div className="flex items-center flex-wrap gap-2 pt-0.5 text-[11px] font-bold">
                    <span className="text-stone-700">
                      {subj.totalCount} {subj.totalCount === 1 ? 'PDF' : 'PDFs'} Available
                    </span>
                    {subj.freeCount > 0 && (
                      <span className="text-emerald-700">• {subj.freeCount} Free</span>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-red-700 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
