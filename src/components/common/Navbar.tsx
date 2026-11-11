import React, { useState, useEffect } from 'react';
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
  Sparkles,
  GraduationCap,
  Lock,
  FileText,
  Phone,
  Scale,
  Receipt,
  ChevronRight,
  ArrowRight,
  Menu,
  Bell,
  Flame
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppPublicSettings } from '../../types';
import { BrandLogo } from './BrandLogo';
import { PolicyType } from './PolicyModal';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, filterParam?: any) => void;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
  onOpenProfile: () => void;
  onOpenPolicy?: (type: PolicyType) => void;
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
  onOpenPolicy,
  purchaseCount,
  searchQuery,
  onSearchChange,
  onExecuteSearch,
  settings
}) => {
  const { user, profile, isAdmin } = useAuth();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const displayMobileNumber =
    settings?.social?.supportPhone || settings?.social?.whatsapp || '+91 98640 12345';
  const contactNumberClean = displayMobileNumber.replace(/\s+/g, '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteSearch();
    setMobileSearchOpen(false);
  };

  return (
    <header className="w-full max-w-full sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs select-none">
      {/* Top Notification Strip (Desktop Only) */}
      <div className="hidden md:flex w-full bg-stone-900 text-stone-200 text-xs py-1 px-3 sm:px-4 font-medium items-center justify-between overflow-hidden">
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

      {/* Main Brand & Actions Header (Desktop Only: hidden md:block) */}
      <div className="hidden md:block w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
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
              onClick={() => onNavigate('previous-papers')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                currentView === 'previous-papers'
                  ? 'text-red-700 bg-red-50'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Previous Papers
            </button>
            <button
              onClick={() => onNavigate('browse', { medium: 'Assamese Medium' })}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              অসমীয়া মাধ্যম
            </button>
          </nav>

          {/* User & Actions (Top Right - Desktop) */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
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

            {/* Profile & Account Controls (Header) */}
            <div className="flex items-center space-x-2">
              {user ? (
                <button
                  onClick={() => onNavigate('profile')}
                  type="button"
                  aria-label="Student Profile Page"
                  className={`flex items-center space-x-1.5 sm:space-x-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border transition-all cursor-pointer ${
                    currentView === 'profile'
                      ? 'bg-red-50 border-red-300 text-red-800'
                      : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-200'
                  }`}
                  title="My Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {(profile?.displayName || user.displayName || user.email || 'S')[0]}
                  </div>
                  <span className="hidden md:inline text-xs sm:text-sm font-semibold max-w-[110px] truncate">
                    {profile?.displayName || user.displayName || 'Profile'}
                  </span>
                </button>
              ) : (
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer ${
                      currentView === 'auth'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="px-3 py-1.5 text-xs sm:text-sm font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          NEW MOBILE RED HEADER (Mobile Only: md:hidden)
          Professional Red Educational Header with Hamburger, Logo,
          Brand Name, Configured Mobile Number, Search, and Notification Bell.
          ============================================================== */}
      <div className="md:hidden bg-red-700 text-white px-3 py-2.5 shadow-md flex items-center justify-between gap-2 border-b border-red-800">
        {/* Left: Hamburger Menu Icon */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="p-1.5 rounded-lg text-white hover:bg-red-800 active:bg-red-900 transition-colors cursor-pointer shrink-0"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Center-Left: Logo, Brand Name & Configured Mobile Number */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-2 min-w-0 flex-1 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-xs">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>

          <div className="flex flex-col min-w-0 leading-tight">
            <span className="font-black text-sm tracking-tight text-white uppercase truncate">
              MKR ACADEMY
            </span>
            {/* Display configured mobile number (+91 98640 12345) instead of tagline */}
            <a
              href={`tel:${contactNumberClean}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10.5px] text-red-100 font-semibold tracking-wide flex items-center space-x-1 hover:text-white transition-colors truncate"
              title="Click to call MKR Academy"
            >
              <Phone className="w-2.5 h-2.5 shrink-0 text-red-200" />
              <span>{displayMobileNumber}</span>
            </a>
          </div>
        </div>

        {/* Right: Search & Notification Bell Icons */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className={`p-1.5 rounded-lg text-white hover:bg-red-800 active:bg-red-900 transition-colors cursor-pointer relative ${
              mobileSearchOpen ? 'bg-red-800 ring-1 ring-white/30' : ''
            }`}
            aria-label="Search study notes"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`p-1.5 rounded-lg text-white hover:bg-red-800 active:bg-red-900 transition-colors cursor-pointer relative ${
              notificationsOpen ? 'bg-red-800 ring-1 ring-white/30' : ''
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-300 ring-2 ring-red-700 animate-pulse"></span>
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Box (when search icon is tapped) */}
      {mobileSearchOpen && (
        <div className="md:hidden p-2.5 bg-stone-50 border-b border-stone-200 animate-in fade-in slide-in-from-top-1 duration-150">
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

      {/* Expandable Mobile Notifications Sheet (when notification bell is tapped) */}
      {notificationsOpen && (
        <div className="md:hidden bg-stone-900 text-white p-3 border-b border-stone-800 text-xs shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="font-bold flex items-center space-x-1.5 text-amber-300">
              <Bell className="w-3.5 h-3.5" />
              <span>Announcements & Alerts</span>
            </span>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="text-stone-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2 pt-2">
            <div
              onClick={() => {
                onNavigate('browse', { classLevel: 'HSLC 2027' });
                setNotificationsOpen(false);
              }}
              className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <p className="font-semibold text-red-300">🎯 TARGET HSLC 2027 Notes Live</p>
              <p className="text-[11px] text-stone-300 mt-0.5">Assamese & English medium chapter-wise notes available for download.</p>
            </div>
            <div
              onClick={() => {
                onNavigate('free-pdfs');
                setNotificationsOpen(false);
              }}
              className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <p className="font-semibold text-emerald-300">✨ Free Sample PDFs Added</p>
              <p className="text-[11px] text-stone-300 mt-0.5">Free chapter-wise previews and sample PDFs ready to read.</p>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Mobile Navigation Drawer (when Hamburger is tapped) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 sm:w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="bg-red-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase">MKR ACADEMY</h3>
                  <p className="text-[10px] text-red-200">{displayMobileNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-white hover:bg-red-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 text-sm">
              <button
                onClick={() => {
                  onNavigate('home');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-left ${
                  currentView === 'home' ? 'bg-red-50 text-red-700 font-bold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Home className="w-4 h-4 text-stone-500" />
                <span>Home</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('browse');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-left ${
                  currentView === 'browse' ? 'bg-red-50 text-red-700 font-bold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <BookOpen className="w-4 h-4 text-stone-500" />
                <span>Study Notes</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('browse', { classLevel: 'HSLC 2027' });
                  setMobileDrawerOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-stone-700 hover:bg-stone-100 text-left"
              >
                <div className="flex items-center space-x-3">
                  <Flame className="w-4 h-4 text-red-600" />
                  <span>TARGET HSLC 2027</span>
                </div>
                <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase">Hot</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('free-pdfs');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-left ${
                  currentView === 'free-pdfs' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Free PDFs</span>
                </div>
                <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full uppercase">Free</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('previous-papers');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-left ${
                  currentView === 'previous-papers' ? 'bg-red-50 text-red-700 font-bold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Previous Papers (PYQ)</span>
                </div>
                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full uppercase">HSLC & Exam</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('purchases');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-left ${
                  currentView === 'purchases' ? 'bg-red-50 text-red-700 font-bold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <ShoppingBag className="w-4 h-4 text-stone-500" />
                  <span>My Purchases</span>
                </div>
                {purchaseCount > 0 && (
                  <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">{purchaseCount}</span>
                )}
              </button>

              <button
                onClick={() => {
                  onNavigate('profile');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-left ${
                  currentView === 'profile' ? 'bg-red-50 text-red-700 font-bold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <User className="w-4 h-4 text-stone-500" />
                <span>My Profile & Settings</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    onNavigate('admin');
                    setMobileDrawerOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-left bg-stone-900 text-white mt-2"
                >
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <span>Admin Dashboard</span>
                </button>
              )}

              <div className="pt-4 border-t border-stone-200 mt-4 space-y-2">
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3">Direct Support</p>
                <a
                  href={`tel:${contactNumberClean}`}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-stone-700 hover:bg-stone-100 text-xs font-semibold"
                >
                  <Phone className="w-4 h-4 text-red-600" />
                  <span>Call {displayMobileNumber}</span>
                </a>
                <a
                  href={`https://wa.me/${contactNumberClean.replace(/\+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-stone-700 hover:bg-stone-100 text-xs font-semibold"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">W</span>
                  <span>WhatsApp Community</span>
                </a>
              </div>
            </div>

            {/* Drawer Bottom Action */}
            <div className="p-4 border-t border-stone-200 bg-stone-50">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {profile?.displayName || user.displayName || user.email}
                    </p>
                    <p className="text-[10px] text-stone-500">Student Account</p>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setMobileDrawerOpen(false);
                    }}
                    className="text-xs font-bold text-red-700 hover:underline"
                  >
                    Manage
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onOpenAuth('login');
                      setMobileDrawerOpen(false);
                    }}
                    className="py-2 text-center text-xs font-bold rounded-lg border border-stone-300 hover:bg-stone-100"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      onOpenAuth('register');
                      setMobileDrawerOpen(false);
                    }}
                    className="py-2 text-center text-xs font-bold rounded-lg bg-red-700 text-white hover:bg-red-800 shadow-xs"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          FIXED MOBILE BOTTOM NAVIGATION BAR (Mobile Only: md:hidden)
          Exactly 5 items:
          1. Home (Home icon)
          2. Notes (Book/Notes icon)
          3. Free PDFs (Green "FREE" badge above icon)
          4. Purchases (Red notification badge for purchase count)
          5. Profile (User icon)
          Clean white background, top border, fixed at bottom of screen.
          ============================================================== */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden select-none"
      >
        <div className="grid grid-cols-5 w-full max-w-lg mx-auto py-1 px-1">
          {/* 1. Home */}
          <button
            onClick={() => onNavigate('home')}
            type="button"
            aria-label="Home"
            className={`flex flex-col items-center justify-center py-1 px-0.5 text-[11px] leading-tight transition-colors cursor-pointer ${
              currentView === 'home'
                ? 'text-red-700 font-bold'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Home className={`w-5 h-5 transition-transform ${currentView === 'home' ? 'text-red-700 scale-105' : 'text-stone-400'}`} />
            <span className="mt-1">Home</span>
          </button>

          {/* 2. Notes */}
          <button
            onClick={() => onNavigate('browse')}
            type="button"
            aria-label="Notes"
            className={`flex flex-col items-center justify-center py-1 px-0.5 text-[11px] leading-tight transition-colors cursor-pointer ${
              currentView === 'browse'
                ? 'text-red-700 font-bold'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <BookOpen className={`w-5 h-5 transition-transform ${currentView === 'browse' ? 'text-red-700 scale-105' : 'text-stone-400'}`} />
            <span className="mt-1">Notes</span>
          </button>

          {/* 3. Free PDFs with Green "FREE" badge above icon */}
          <button
            onClick={() => onNavigate('free-pdfs')}
            type="button"
            aria-label="Free PDFs"
            className={`flex flex-col items-center justify-center py-1 px-0.5 text-[11px] leading-tight transition-colors cursor-pointer relative ${
              currentView === 'free-pdfs'
                ? 'text-emerald-700 font-bold'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {/* Green FREE badge positioned directly above the icon */}
            <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase leading-none shadow-xs -mt-1 mb-0.5">
              FREE
            </span>
            <Sparkles className={`w-5 h-5 transition-transform ${currentView === 'free-pdfs' ? 'text-emerald-600 scale-105' : 'text-stone-400'}`} />
            <span className="mt-0.5">Free PDFs</span>
          </button>

          {/* 4. Purchases with Red notification badge */}
          <button
            onClick={() => onNavigate('purchases')}
            type="button"
            aria-label="My Purchases"
            className={`flex flex-col items-center justify-center py-1 px-0.5 text-[11px] leading-tight transition-colors cursor-pointer relative ${
              currentView === 'purchases'
                ? 'text-red-700 font-bold'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <div className="relative">
              <ShoppingBag className={`w-5 h-5 transition-transform ${currentView === 'purchases' ? 'text-red-700 scale-105' : 'text-stone-400'}`} />
              {purchaseCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                  {purchaseCount > 9 ? '9+' : purchaseCount}
                </span>
              )}
            </div>
            <span className="mt-1">Purchases</span>
          </button>

          {/* 5. Profile */}
          <button
            onClick={() => onNavigate('profile')}
            type="button"
            aria-label="Profile"
            className={`flex flex-col items-center justify-center py-1 px-0.5 text-[11px] leading-tight transition-colors cursor-pointer ${
              currentView === 'profile'
                ? 'text-red-700 font-bold'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <User className={`w-5 h-5 transition-transform ${currentView === 'profile' ? 'text-red-700 scale-105' : 'text-stone-400'}`} />
            <span className="mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
