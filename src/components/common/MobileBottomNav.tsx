import React from 'react';
import {
  Home,
  BookOpen,
  Sparkles,
  ShoppingBag,
  User,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string, filterParam?: any) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenProfile: () => void;
  purchaseCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenProfile,
  purchaseCount
}) => {
  const { user, isAdmin } = useAuth();

  const handleAccountClick = () => {
    if (user) {
      onOpenProfile();
    } else {
      onOpenAuth('login');
    }
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 w-full max-w-full overflow-hidden bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe transition-all"
    >
      <div className="grid grid-cols-5 h-16 w-full max-w-lg mx-auto px-1">
        {/* 1. Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1 transition-all relative ${
            currentView === 'home' ? 'text-red-700 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 transition-transform ${currentView === 'home' ? 'scale-110 text-red-700' : ''}`} />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Home</span>
          {currentView === 'home' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-red-700 rounded-full" />
          )}
        </button>

        {/* 2. All Notes */}
        <button
          onClick={() => onNavigate('browse')}
          className={`flex flex-col items-center justify-center py-1 transition-all relative ${
            currentView === 'browse' ? 'text-red-700 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <BookOpen className={`w-5 h-5 transition-transform ${currentView === 'browse' ? 'scale-110 text-red-700' : ''}`} />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Notes</span>
          {currentView === 'browse' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-red-700 rounded-full" />
          )}
        </button>

        {/* 3. Free PDFs (Highlighted Center Tab) */}
        <button
          onClick={() => onNavigate('free-pdfs')}
          className={`flex flex-col items-center justify-center py-1 transition-all relative group ${
            currentView === 'free-pdfs' ? 'text-emerald-700 font-bold' : 'text-stone-600 hover:text-emerald-700'
          }`}
        >
          <div className="relative">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                currentView === 'free-pdfs'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200'
              }`}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            {/* Tiny "FREE" badge */}
            <span className="absolute -top-1 -right-2 bg-emerald-600 text-[8px] font-black text-white px-1 py-0.2 rounded-full uppercase leading-none shadow-xs">
              Free
            </span>
          </div>
          <span className={`text-[10px] mt-0.5 tracking-tight ${currentView === 'free-pdfs' ? 'text-emerald-700 font-extrabold' : 'text-emerald-800 font-semibold'}`}>
            Free PDFs
          </span>
          {currentView === 'free-pdfs' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        {/* 4. My Purchases */}
        <button
          onClick={() => onNavigate('purchases')}
          className={`flex flex-col items-center justify-center py-1 transition-all relative ${
            currentView === 'purchases' ? 'text-red-700 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 transition-transform ${currentView === 'purchases' ? 'scale-110 text-red-700' : ''}`} />
            {purchaseCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {purchaseCount > 9 ? '9+' : purchaseCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Purchases</span>
          {currentView === 'purchases' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-red-700 rounded-full" />
          )}
        </button>

        {/* 5. Account or Admin */}
        {isAdmin ? (
          <button
            onClick={() => onNavigate('admin')}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              currentView === 'admin' ? 'text-red-700 font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className="relative">
              <ShieldCheck className={`w-5 h-5 transition-transform ${currentView === 'admin' ? 'scale-110 text-red-700' : 'text-stone-700'}`} />
            </div>
            <span className="text-[10px] mt-1 tracking-tight font-semibold">Admin</span>
            {currentView === 'admin' && (
              <span className="absolute bottom-1 w-6 h-0.5 bg-red-700 rounded-full" />
            )}
          </button>
        ) : (
          <button
            onClick={handleAccountClick}
            className="flex flex-col items-center justify-center py-1 text-stone-500 hover:text-stone-800 transition-all relative"
          >
            <div className="relative">
              {user ? (
                <div className="w-5 h-5 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-[10px] font-bold border border-red-300">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'S'}
                </div>
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">
              {user ? 'Account' : 'Login'}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
