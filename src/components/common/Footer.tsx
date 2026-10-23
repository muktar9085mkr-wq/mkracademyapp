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

interface FooterProps {
  onNavigate: (view: string, filterParam?: any) => void;
  onOpenPolicy: (type: 'privacy' | 'terms' | 'refund' | 'contact') => void;
  socialLinks?: SocialLinks;
  settings?: AppPublicSettings | null;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenPolicy,
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
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-20 md:pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          
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
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {currentYear} MKR Academy. All rights reserved. Built for student academic excellence.</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>100% Secure Razorpay Checkout</span>
            </span>
            <span className="text-stone-700">|</span>
            <span>Instant PDF Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
