import React from 'react';
import {
  GraduationCap,
  Mail,
  Phone,
  MessageCircle,
  Send,
  Youtube,
  Instagram,
  ShieldCheck,
  FileText,
  Lock,
  ArrowRight
} from 'lucide-react';
import { SocialLinks, AppPublicSettings } from '../../types';
import { BrandLogo } from './BrandLogo';
import { PolicyType } from './PolicyModal';

interface FooterProps {
  onNavigate: (view: string, filterParam?: any) => void;
  onOpenPolicy: (type: PolicyType) => void;
  onOpenProfile?: () => void;
  socialLinks?: SocialLinks;
  settings?: AppPublicSettings | null;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenPolicy,
  onOpenProfile,
  socialLinks,
  settings
}) => {
  const currentYear = new Date().getFullYear();

  const effectiveSocial = socialLinks || settings?.social;
  const whatsappNumber = effectiveSocial?.whatsapp || '919864012345';
  const telegramUrl = effectiveSocial?.telegram || 'https://t.me/mkr_academy_official';
  const youtubeUrl = effectiveSocial?.youtube || 'https://youtube.com/@mkr_academy';
  const instagramUrl = effectiveSocial?.instagram || 'https://instagram.com/mkr_academy';
  const contactEmail = effectiveSocial?.email || 'muktar9085mkr@gmail.com';

  const isWhatsappEnabled = effectiveSocial?.whatsappEnabled !== false && Boolean(whatsappNumber);
  const isTelegramEnabled = effectiveSocial?.telegramEnabled !== false && Boolean(telegramUrl);
  const isYoutubeEnabled = effectiveSocial?.youtubeEnabled !== false && Boolean(youtubeUrl);
  const isInstagramEnabled = effectiveSocial?.instagramEnabled !== false && Boolean(instagramUrl);
  const isEmailEnabled = effectiveSocial?.emailEnabled !== false && Boolean(contactEmail);

  return (
    <footer className="w-full max-w-full overflow-hidden bg-stone-900 text-stone-300 pt-12 md:pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ==============================================================
            1. MOBILE COMPACT FOOTER (Visible on mobile only: md:hidden)
            Strictly 4 Social Media & Contact icons + About MKR Academy.
            All other navigation sections moved to Profile Menu.
            ============================================================== */}
        <div className="md:hidden space-y-6 pb-8 border-b border-stone-800">
          {/* Brand & About MKR Academy Summary */}
          <div className="space-y-3">
            <BrandLogo settings={settings?.logo} variant="light" size="md" />
            <p className="text-stone-300 text-xs leading-relaxed">
              <span className="font-semibold text-white">Quality Notes. Better Preparation. Better Results.</span>
              <br />
              Dedicated educational digital notes and preparation platform for Class 10 & 9 students and HSLC 2027 aspirants in Assamese and English mediums.
            </p>

            {/* About MKR Academy Action Button */}
            <div className="pt-1">
              <button
                onClick={() => onOpenPolicy('about')}
                type="button"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-stone-800/80 hover:bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700/60 transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5 text-red-500" />
                <span>About MKR Academy →</span>
              </button>
            </div>
          </div>

          {/* Strictly 4 Social Media & Contact Icons (All Clickable) */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-1.5">
              <span>Connect With Us</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* 1. WhatsApp Community */}
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/50 text-emerald-200 transition-colors shadow-xs"
                title="WhatsApp Community"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] text-white leading-tight truncate">WhatsApp</p>
                  <p className="text-[10px] text-emerald-400 leading-tight">Community</p>
                </div>
              </a>

              {/* 2. Instagram */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-pink-950/30 border border-pink-900/50 hover:bg-pink-900/40 text-pink-200 transition-colors shadow-xs"
                title="Instagram"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Instagram className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] text-white leading-tight truncate">Instagram</p>
                  <p className="text-[10px] text-pink-400 leading-tight">@mkr_academy</p>
                </div>
              </a>

              {/* 3. YouTube */}
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-red-950/30 border border-red-900/50 hover:bg-red-900/40 text-red-200 transition-colors shadow-xs"
                title="YouTube"
              >
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Youtube className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] text-white leading-tight truncate">YouTube</p>
                  <p className="text-[10px] text-red-400 leading-tight">Classes & Tips</p>
                </div>
              </a>

              {/* 4. Email */}
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-stone-800/80 border border-stone-700/60 hover:bg-stone-800 text-stone-200 transition-colors shadow-xs"
                title="Email Support"
              >
                <div className="w-7 h-7 rounded-lg bg-stone-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] text-white leading-tight truncate">Email Us</p>
                  <p className="text-[10px] text-stone-400 leading-tight truncate">{contactEmail.split('@')[0]}</p>
                </div>
              </a>
            </div>
          </div>

          {/* Quick Notice to Access Moved Sections in Profile Menu */}
          <div className="bg-stone-800/60 border border-stone-800 rounded-xl p-3 flex items-center justify-between text-xs text-stone-400">
            <span className="text-[11px] leading-tight">
              Subjects, Classes, Policies & Invoices are in your <strong className="text-stone-200">Profile Menu</strong>.
            </span>
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                type="button"
                className="shrink-0 ml-2 px-2.5 py-1 rounded-lg bg-red-700/80 hover:bg-red-700 text-white font-semibold text-[11px] transition-colors cursor-pointer"
              >
                Open Menu
              </button>
            )}
          </div>
        </div>

        {/* ==============================================================
            2. DESKTOP FULL FOOTER (Visible on desktop: hidden md:grid)
            Unchanged 5-column layout with all subjects, classes, & policies
            ============================================================== */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo settings={settings?.logo} variant="light" size="lg" />
            
            <p className="text-stone-300 text-sm leading-relaxed max-w-sm">
              <span className="font-semibold text-white">Quality Notes. Better Preparation. Better Results.</span>
              <br />
              Dedicated educational digital notes and preparation platform for Class 10 & 9 students and HSLC 2027 aspirants. Prepared meticulously in both Assamese and English mediums by experienced subject educators.
            </p>

            {/* Quick Action Social Buttons (Only if enabled) */}
            <div className="pt-2 flex flex-wrap gap-3">
              {isWhatsappEnabled && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Community</span>
                </a>
              )}
              {isTelegramEnabled && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 bg-sky-700/90 hover:bg-sky-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram Channel</span>
                </a>
              )}
            </div>

            {/* Social Icons row (Only active links shown) */}
            <div className="flex items-center space-x-3 pt-1 text-stone-400">
              {isYoutubeEnabled && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-stone-800 hover:text-red-500 hover:bg-stone-700 transition-colors"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {isInstagramEnabled && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-stone-800 hover:text-pink-400 hover:bg-stone-700 transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {isEmailEnabled && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="p-2.5 rounded-xl bg-stone-800 hover:text-white hover:bg-stone-700 transition-colors"
                  title="Email Support"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Subject Categories */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 border-l-2 border-red-600 pl-2">
              Subjects
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('browse', { subject: 'General Science' })}
                  className="hover:text-red-400 transition-colors"
                >
                  General Science (বিজ্ঞান)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse', { subject: 'Mathematics' })}
                  className="hover:text-red-400 transition-colors"
                >
                  Mathematics (গণিত)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse', { subject: 'Social Science' })}
                  className="hover:text-red-400 transition-colors"
                >
                  Social Science (সমাজ বিজ্ঞান)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse', { subject: 'English' })}
                  className="hover:text-red-400 transition-colors"
                >
                  English (ইংৰাজী)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse', { subject: 'Assamese' })}
                  className="hover:text-red-400 transition-colors"
                >
                  Assamese (অসমীয়া)
                </button>
              </li>
            </ul>
          </div>

          {/* Classes & Targets - Strictly Class 10 & 9 */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 border-l-2 border-red-600 pl-2">
              Classes & Exam
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('browse', { classLevel: 'HSLC 2027' })}
                  className="text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center space-x-1"
                >
                  <span>HSLC 2027 Target</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse', { classLevel: 'Class 10' })}
                  className="hover:text-red-400 transition-colors"
                >
                  Class 10 Notes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse', { classLevel: 'Class 9' })}
                  className="hover:text-red-400 transition-colors"
                >
                  Class 9 Notes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('free-pdfs')}
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                >
                  100% Free PDFs & Notes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse', { medium: 'Assamese Medium' })}
                  className="hover:text-red-400 transition-colors"
                >
                  Assamese Medium Notes
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links & Legal */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 border-l-2 border-red-600 pl-2">
              Policies & Help
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onOpenPolicy('privacy')}
                  className="hover:text-stone-100 transition-colors flex items-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-stone-500" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('terms')}
                  className="hover:text-stone-100 transition-colors flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  <span>Terms & Conditions</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('refund')}
                  className="hover:text-stone-100 transition-colors flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                  <span>Refund Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('copyright')}
                  className="hover:text-stone-100 transition-colors flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  <span>Copyright & Anti-Piracy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('grievance')}
                  className="hover:text-stone-100 transition-colors flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-red-400 hover:text-red-300 font-medium">Grievance Redressal</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('tax-certin')}
                  className="hover:text-stone-100 transition-colors flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                  <span>Tax & CERT-In Notice</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('contact')}
                  className="hover:text-stone-100 transition-colors flex items-center space-x-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-stone-500" />
                  <span>Contact & Support</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('purchases')}
                  className="hover:text-stone-100 transition-colors"
                >
                  Student My Purchases
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4 text-center sm:text-left">
          <p className="max-w-full break-words">© {currentYear} MKR Academy. All rights reserved. Built for student academic excellence.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1.5">
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
              <span>100% Secure Razorpay Checkout</span>
            </span>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <span>Instant PDF Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
