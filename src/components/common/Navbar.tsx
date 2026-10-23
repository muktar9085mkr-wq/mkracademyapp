import React, { useState } from 'react';
import {
  BookOpen,
  ShoppingBag,
  User,
  ShieldCheck,
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
  GraduationCap,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteSearch();
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full max-w-full sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top Notification Strip */}
      <div className="w-full bg-stone-900 text-stone-200 text-xs py-1.5 px-3 sm:px-4 font-medium flex items-center justify-between overflow-hidden">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span className="bg-red-700 text-white text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0">
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

      {/* Main Navbar */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          
          {/* Logo */}
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

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'home'
                  ? 'text-red-700 bg-red-50'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'browse'
                  ? 'text-red-700 bg-red-50'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Browse Notes
            </button>
            <button
              onClick={() => onNavigate('browse', { classLevel: 'HSLC 2027' })}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors flex items-center space-x-1"
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
              className="px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              অসমীয়া মাধ্যম
            </button>
          </nav>

          {/* User & Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* My Purchases Button - Hidden on small mobile screens because it is in MobileBottomNav */}
            <button
              onClick={() => onNavigate('purchases')}
              className={`hidden sm:flex relative px-3 py-2 rounded-lg text-sm font-semibold items-center space-x-1.5 transition-colors ${
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

            {/* Admin Panel Link (Only visible to verified admins) */}
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center space-x-1 sm:space-x-1.5 transition-colors ${
                  currentView === 'admin'
                    ? 'bg-stone-900 text-white'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* User Account / Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-1 sm:space-x-2 p-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-stone-100 text-stone-800 transition-colors border border-stone-200"
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
                      className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center space-x-2"
                    >
                      <User className="w-4 h-4 text-stone-400" />
                      <span>Student Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('purchases');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center space-x-2"
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
                        className="w-full text-left px-4 py-2 text-sm text-red-700 font-semibold hover:bg-red-50 flex items-center space-x-2"
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
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
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
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:inline-flex px-3.5 py-2 text-sm font-bold bg-red-700 hover:bg-red-800 text-white rounded-lg shadow-sm transition-all shadow-red-800/20"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes, chapters, exams..."
              className="w-full bg-stone-100 text-stone-900 placeholder-stone-400 text-sm rounded-lg pl-9 pr-8 py-2 border border-stone-200 focus:outline-none focus:border-red-600"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-sm font-semibold ${
                currentView === 'home' ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-800'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('browse');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-sm font-semibold ${
                currentView === 'browse' ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-800'
              }`}
            >
              All Notes
            </button>
            <button
              onClick={() => {
                onNavigate('browse', { classLevel: 'HSLC 2027' });
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg text-sm font-semibold bg-red-100 text-red-800"
            >
              HSLC 2027 Notes
            </button>
            <button
              onClick={() => {
                onNavigate('free-pdfs');
                setMobileMenuOpen(false);
              }}
              className={`col-span-2 p-2.5 rounded-lg text-sm font-extrabold flex items-center justify-center space-x-2 border transition-colors ${
                currentView === 'free-pdfs'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Free PDFs & Notes (100% Free • বিনামূল্যে)</span>
            </button>
            <button
              onClick={() => {
                onNavigate('browse', { medium: 'Assamese Medium' });
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg text-sm font-semibold bg-stone-100 text-stone-800"
            >
              অসমীয়া মাধ্যম
            </button>
          </div>

          <div className="pt-2 border-t border-stone-100 flex flex-col space-y-2">
            <button
              onClick={() => {
                onNavigate('purchases');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left p-2.5 rounded-lg bg-stone-50 font-semibold text-stone-800 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-red-700" />
                <span>My Purchases</span>
              </div>
              {purchaseCount > 0 && (
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {purchaseCount}
                </span>
              )}
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-lg bg-red-50 font-bold text-red-800 flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-red-700" />
                <span>Admin Dashboard</span>
              </button>
            )}

            {user ? (
              <button
                onClick={() => {
                  onOpenProfile();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-lg bg-stone-50 font-medium text-stone-700 flex items-center space-x-2"
              >
                <User className="w-4 h-4 text-stone-500" />
                <span>Profile & Settings</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-sm font-bold bg-stone-100 text-stone-800 rounded-lg"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-sm font-bold bg-red-700 text-white rounded-lg shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
