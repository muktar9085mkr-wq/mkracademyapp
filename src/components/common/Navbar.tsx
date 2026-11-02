import React, { useState } from 'react';
import {
  Home,
  BookOpen,
  ShoppingBag,
  User,
  ShieldCheck,
  Search,
  X,
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppPublicSettings } from '../../types';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, filterParam?: any) => void;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
  onOpenProfile: () => void;
  purchaseCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteSearch: () => void;
  settings?: AppPublicSettings | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenProfile,
  purchaseCount,
  searchQuery,
  onSearchChange,
  onExecuteSearch,
  settings
}) => {
  const { user, profile, isAdmin, logout } = useAuth();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteSearch();
    setMobileSearchOpen(false);
  };

  return (
    <header className="w-full max-w-full sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs select-none">
      {/* Top Notification Strip */}
      <div className="w-full bg-stone-900 text-stone-200 text-xs py-1 px-3 sm:px-4 font-medium flex items-center justify-between overflow-hidden">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span className="bg-red-700 text-white text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded shrink-0">
            HSLC 2027
          </span>
          <span className="truncate text-[11px] sm:text-xs min-w-0">
            {settings?.announcement || 'Class 10 & 9 chapter-wise notes & question banks ready for download!'}
          </span>
        </div>
        <div className="hidden sm:flex items-center space-x-4 text-[11px] text-stone-300 shrink-0 ml-2">
          <span>Assamese & English Medium</span>
          <span className="text-stone-600">|</span>
          <a href="#contact" onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
            Help & Support
          </a>
        </div>
      </div>

      {/* Main Brand & Actions Header */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-18 gap-2 sm:gap-4">
          
          {/* Logo & Brand Name */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center text-left focus:outline-none min-w-0 shrink cursor-pointer"
            aria-label="MKR Academy Home"
          >
            <BrandLogo settings={settings?.logo} variant="dark" size="md" />
          </button>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes by subject, chapter, or exam..."
              className="w-full bg-stone-100 hover:bg-stone-50 focus:bg-white text-stone-900 placeholder-stone-400 text-sm rounded-full pl-10 pr-10 py-2.5 border border-stone-200 focus:border-red-600 focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 text-stone-400 hover:text-stone-600 text-xs"
              >
                Clear
              </button>
            )}
          </form>

          {/* Navigation Links - Desktop Only */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                currentView === 'home'
                  ? 'text-red-700 bg-red-50'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                currentView === 'browse'
                  ? 'text-red-700 bg-red-50'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Browse Notes
            </button>
            <button
              onClick={() => onNavigate('browse', { classLevel: 'HSLC 2027' })}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <span>HSLC 2027</span>
            </button>
            <button
              onClick={() => onNavigate('free-pdfs')}
              className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                currentView === 'free-pdfs'
                  ? 'text-emerald-800 bg-emerald-100 shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free PDFs</span>
              <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase">
                FREE
              </span>
            </button>
            <button
              onClick={() => onNavigate('browse', { medium: 'Assamese Medium' })}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              অসমীয়া মাধ্যম
            </button>
          </nav>

          {/* User & Actions (Top Right) */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              type="button"
              className="md:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors touch-manipulation cursor-pointer"
              aria-label="Search"
              title="Search notes"
            >
              {mobileSearchOpen ? <X className="w-5 h-5 text-red-700" /> : <Search className="w-5 h-5" />}
            </button>

            {/* Desktop My Purchases Button */}
            <button
              onClick={() => onNavigate('purchases')}
              className={`hidden sm:flex relative px-3 py-2 rounded-lg text-sm font-semibold items-center space-x-1.5 transition-colors cursor-pointer ${
                currentView === 'purchases'
                  ? 'bg-red-700 text-white'
                  : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
              }`}
              title="My Purchases"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden md:inline">My Purchases</span>
              {purchaseCount > 0 && (
                <span className="ml-1 bg-red-600 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                  {purchaseCount}
                </span>
              )}
            </button>

            {/* Admin Dashboard Badge (Desktop & Tablet) */}
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`hidden sm:flex px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold items-center space-x-1 sm:space-x-1.5 transition-colors cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-stone-900 text-white'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}

            {/* User Account / Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-1 sm:space-x-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-stone-100 text-stone-800 transition-colors border border-stone-200 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {(profile?.displayName || user.email || 'S')[0]}
                  </div>
                  <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">
                    {profile?.displayName || 'Student'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs text-stone-400 uppercase font-semibold">Signed In As</p>
                      <p className="text-sm font-bold text-stone-900 truncate">{profile?.displayName || 'Student'}</p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                      {profile?.phoneNumber && (
                        <p className="text-xs text-stone-500 font-mono">📱 +91 {profile.phoneNumber}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center space-x-2 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-stone-400" />
                      <span>Student Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('purchases');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center space-x-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-stone-400" />
                      <span>My Purchased Notes</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-700 font-semibold hover:bg-red-50 flex items-center space-x-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-red-600" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}
                    <div className="border-t border-stone-100 mt-1"></div>
                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-2.5 sm:px-3.5 py-1 sm:py-2 text-xs sm:text-sm font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:inline-flex px-3.5 py-2 text-sm font-bold bg-red-700 hover:bg-red-800 text-white rounded-lg shadow-sm transition-all shadow-red-800/20 cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 
        PREMIUM HORIZONTAL TOP NAVIGATION BAR (MOBILE ONLY - md:hidden)
        Directly beneath brand header, sticky at the top, replacing the bottom navigation bar.
      */}
      <nav
        aria-label="Mobile top navigation"
        className="md:hidden w-full bg-white border-t border-stone-200/80 shadow-xs"
      >
        <div className="grid grid-cols-5 w-full max-w-lg mx-auto">
          {/* 1. Home */}
          <button
            onClick={() => onNavigate('home')}
            type="button"
            aria-label="Home"
            className={`py-2 px-1 flex flex-col items-center justify-center gap-0.5 text-[11px] leading-tight transition-all relative touch-manipulation cursor-pointer border-b-2 ${
              currentView === 'home'
                ? 'text-red-700 font-bold border-red-700 bg-red-50/50'
                : 'text-stone-600 hover:text-stone-900 border-transparent'
            }`}
          >
            <Home className={`w-4 h-4 transition-transform ${currentView === 'home' ? 'text-red-700 scale-105' : 'text-stone-500'}`} />
            <span className="tracking-tight">Home</span>
          </button>

          {/* 2. Notes */}
          <button
            onClick={() => onNavigate('browse')}
            type="button"
            aria-label="Notes"
            className={`py-2 px-1 flex flex-col items-center justify-center gap-0.5 text-[11px] leading-tight transition-all relative touch-manipulation cursor-pointer border-b-2 ${
              currentView === 'browse'
                ? 'text-red-700 font-bold border-red-700 bg-red-50/50'
                : 'text-stone-600 hover:text-stone-900 border-transparent'
            }`}
          >
            <BookOpen className={`w-4 h-4 transition-transform ${currentView === 'browse' ? 'text-red-700 scale-105' : 'text-stone-500'}`} />
            <span className="tracking-tight">Notes</span>
          </button>

          {/* 3. Free PDFs */}
          <button
            onClick={() => onNavigate('free-pdfs')}
            type="button"
            aria-label="Free PDFs"
            className={`py-2 px-1 flex flex-col items-center justify-center gap-0.5 text-[11px] leading-tight transition-all relative touch-manipulation cursor-pointer border-b-2 ${
              currentView === 'free-pdfs'
                ? 'text-emerald-700 font-bold border-emerald-600 bg-emerald-50/50'
                : 'text-stone-600 hover:text-emerald-800 border-transparent'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Sparkles className={`w-4 h-4 transition-transform ${currentView === 'free-pdfs' ? 'text-emerald-600 scale-105' : 'text-stone-500'}`} />
              <span className="absolute -top-1 -right-2.5 bg-emerald-600 text-white text-[7.5px] font-black px-1 rounded-full uppercase leading-none shadow-xs">
                Free
              </span>
            </div>
            <span className="tracking-tight truncate max-w-full">Free PDFs</span>
          </button>

          {/* 4. Purchases */}
          <button
            onClick={() => onNavigate('purchases')}
            type="button"
            aria-label="My Purchases"
            className={`py-2 px-1 flex flex-col items-center justify-center gap-0.5 text-[11px] leading-tight transition-all relative touch-manipulation cursor-pointer border-b-2 ${
              currentView === 'purchases'
                ? 'text-red-700 font-bold border-red-700 bg-red-50/50'
                : 'text-stone-600 hover:text-stone-900 border-transparent'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag className={`w-4 h-4 transition-transform ${currentView === 'purchases' ? 'text-red-700 scale-105' : 'text-stone-500'}`} />
              {purchaseCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                  {purchaseCount > 9 ? '9+' : purchaseCount}
                </span>
              )}
            </div>
            <span className="tracking-tight">Purchases</span>
          </button>

          {/* 5. Admin or Account */}
          {isAdmin ? (
            <button
              onClick={() => onNavigate('admin')}
              type="button"
              aria-label="Admin Panel"
              className={`py-2 px-1 flex flex-col items-center justify-center gap-0.5 text-[11px] leading-tight transition-all relative touch-manipulation cursor-pointer border-b-2 ${
                currentView === 'admin'
                  ? 'text-red-700 font-bold border-red-700 bg-red-50/50'
                  : 'text-stone-600 hover:text-stone-900 border-transparent'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 transition-transform ${currentView === 'admin' ? 'text-red-700 scale-105' : 'text-stone-700'}`} />
              <span className="tracking-tight font-semibold">Admin</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (user) onOpenProfile();
                else onOpenAuth('login');
              }}
              type="button"
              aria-label={user ? 'Student Account' : 'Student Login'}
              className="py-2 px-1 flex flex-col items-center justify-center gap-0.5 text-[11px] leading-tight transition-all relative touch-manipulation cursor-pointer border-b-2 border-transparent text-stone-600 hover:text-stone-900"
            >
              <div className="relative flex items-center justify-center">
                {user ? (
                  <div className="w-4 h-4 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-[9px] font-bold border border-red-300">
                    {(profile?.displayName || user.email || 'S')[0].toUpperCase()}
                  </div>
                ) : (
                  <User className="w-4 h-4 text-stone-500" />
                )}
              </div>
              <span className="tracking-tight truncate max-w-full">
                {user ? 'Account' : 'Login'}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Expandable Mobile Search Box (when search icon is tapped) */}
      {mobileSearchOpen && (
        <div className="md:hidden p-2.5 bg-stone-50 border-t border-stone-200 animate-in fade-in slide-in-from-top-1 duration-150">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes, chapters, exams..."
              className="w-full bg-white text-stone-900 placeholder-stone-400 text-xs rounded-xl pl-8 pr-12 py-2 border border-stone-300 focus:outline-none focus:border-red-600 shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1.5 text-stone-400 hover:text-stone-600 text-xs py-0.5 px-1 font-medium"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
};
