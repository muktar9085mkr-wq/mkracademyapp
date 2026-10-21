import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Download,
  FileText,
  Calendar,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Search,
  Eye,
  ArrowRight,
  AlertCircle,
  Lock,
  Printer,
  ZoomIn,
  ZoomOut,
  X
} from 'lucide-react';
import { Purchase, Product } from '../../types';
import { getUserPurchases } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';

interface MyPurchasesViewProps {
  onBrowseNotes: () => void;
  onOpenAuth: () => void;
}

export const MyPurchasesView: React.FC<MyPurchasesViewProps> = ({
  onBrowseNotes,
  onOpenAuth
}) => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedReaderPurchase, setSelectedReaderPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    async function loadPurchases() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const userPurchases = await getUserPurchases(user.uid);
        setPurchases(userPurchases);
      } catch (err) {
        console.error('Failed to load user purchases:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPurchases();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stone-900">Sign In to Access Your Purchases</h2>
          <p className="text-stone-600 text-sm max-w-md mx-auto">
            Your purchased notes are permanently linked to your student account and remain available whenever you log in on any device.
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          Student Sign In
        </button>
      </div>
    );
  }

  const filteredPurchases = purchases.filter((p) =>
    p.productTitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.orderId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-700 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-sans">
              My Purchased Notes
            </h1>
          </div>
          <p className="text-stone-500 text-sm mt-1">
            Access, view in browser, or download your official educational PDF materials anytime.
          </p>
        </div>

        {/* Search within purchases */}
        {purchases.length > 0 && (
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search your notes..."
              className="w-full bg-white text-stone-900 text-xs rounded-xl pl-8 pr-3 py-2 border border-stone-300 focus:outline-none focus:border-red-600"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-red-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-stone-500">Retrieving your verified purchases...</p>
        </div>
      ) : purchases.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-lg mx-auto space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-stone-900">No Purchased Notes Yet</h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              You haven't bought any study notes yet. Explore our HSLC 2027 and Class 6-10 note sets to begin your exam preparation.
            </p>
          </div>
          <button
            onClick={onBrowseNotes}
            className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 mx-auto cursor-pointer"
          >
            <span>Browse Educational Notes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Purchased Notes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPurchases.map((purchase) => {
            const purchaseDateFormatted = new Date(purchase.purchasedAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div
                key={purchase.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Cover */}
                  <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
                    <img
                      src={purchase.coverImagePath || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'}
                      alt={purchase.productTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-xs">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Active</span>
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-2">
                      {purchase.productTitle}
                    </h3>

                    <div className="space-y-1 text-xs text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>Purchased On:</span>
                        </span>
                        <span className="font-semibold text-stone-700">{purchaseDateFormatted}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Order ID:</span>
                        <span className="font-mono text-stone-700">{purchase.orderId}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 sm:p-5 pt-0 border-t border-stone-100 space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {/* In-App Reader */}
                    <button
                      onClick={() => setSelectedReaderPurchase(purchase)}
                      className="w-full py-2.5 px-3 rounded-xl border border-stone-300 hover:border-stone-400 hover:bg-stone-50 font-bold text-xs text-stone-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-500" />
                      <span>Read Online</span>
                    </button>

                    {/* PDF Download Direct */}
                    <a
                      href={`/api/notes/download/${purchase.id}`}
                      download={`MKR_Academy_${purchase.id}.pdf`}
                      className="w-full py-2.5 px-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-red-800/20 transition-all cursor-pointer text-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App PDF Reader Modal */}
      {selectedReaderPurchase && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-stone-900 text-white rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl border border-stone-800 overflow-hidden">
            
            {/* Reader Toolbar */}
            <div className="bg-stone-900 px-5 py-3 border-b border-stone-800 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 truncate">
                <BookOpen className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm font-bold truncate">
                  {selectedReaderPurchase.productTitle}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <a
                  href={`/api/notes/download/${selectedReaderPurchase.id}`}
                  download
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save PDF</span>
                </a>
                <button
                  onClick={() => setSelectedReaderPurchase(null)}
                  className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Reader Canvas / Document Simulation */}
            <div className="flex-1 bg-stone-950 p-4 sm:p-8 overflow-y-auto flex justify-center">
              <div className="bg-white text-stone-900 rounded-xl max-w-2xl w-full min-h-[600px] p-8 sm:p-12 shadow-2xl space-y-6">
                
                {/* Note Document Header */}
                <div className="border-b-2 border-red-700 pb-4 text-center space-y-1">
                  <div className="inline-block bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Official Student Study Material
                  </div>
                  <h2 className="text-xl font-extrabold text-stone-950 font-sans">
                    {selectedReaderPurchase.productTitle}
                  </h2>
                  <p className="text-xs text-stone-500">
                    MKR Academy • Quality Notes • Better Preparation • Better Results
                  </p>
                </div>

                {/* Document Security License Strip */}
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-lg text-xs text-stone-600 flex justify-between items-center">
                  <span>Licensed to: <strong>{user?.displayName || user?.email}</strong></span>
                  <span className="font-mono text-[11px] text-stone-400">Order #{selectedReaderPurchase.orderId}</span>
                </div>

                {/* Sample Content / Syllabus Preview */}
                <div className="space-y-4 text-sm leading-relaxed text-stone-800">
                  <h3 className="text-base font-bold text-red-800 border-l-4 border-red-700 pl-2">
                    Chapter 1: Key Concepts & Exam Revision Summary
                  </h3>
                  <p>
                    This verified educational material has been compiled and reviewed under the curriculum standards of the Secondary Education Board of Assam (SEBA) and relevant state examination frameworks for HSLC 2027 and secondary classes.
                  </p>
                  
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs space-y-2">
                    <p className="font-bold text-amber-900">Important Board Exam Points:</p>
                    <ul className="list-disc pl-5 space-y-1 text-amber-800">
                      <li>Revise definitions, formula applications, and chemical equations daily.</li>
                      <li>Diagrams must be neatly labelled using a sharp pencil.</li>
                      <li>Solve all previous year question patterns included in the appendix.</li>
                    </ul>
                  </div>

                  <p className="text-xs text-stone-500 italic pt-4">
                    Full printable PDF with all chapters, diagrams, and question banks is ready for download above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
