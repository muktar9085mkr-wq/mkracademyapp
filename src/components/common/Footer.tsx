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
import { SocialLinks } from '../../types';

interface FooterProps {
  onNavigate: (view: string, filterParam?: any) => void;
  onOpenPolicy: (type: 'privacy' | 'terms' | 'refund' | 'contact') => void;
  socialLinks?: SocialLinks;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenPolicy,
  socialLinks
}) => {
  const currentYear = new Date().getFullYear();

  const whatsappNumber = socialLinks?.whatsapp || '919864012345';
  const telegramUrl = socialLinks?.telegram || 'https://t.me/mkr_academy_official';
  const youtubeUrl = socialLinks?.youtube || 'https://youtube.com/@mkr_academy';
  const instagramUrl = socialLinks?.instagram || 'https://instagram.com/mkr_academy';
  const contactEmail = socialLinks?.email || 'muktar9085mkr@gmail.com';

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-700 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white font-sans">
                MKR <span className="text-red-500">ACADEMY</span>
              </span>
            </div>
            
            <p className="text-stone-300 text-sm leading-relaxed max-w-sm">
              <span className="font-semibold text-white">Quality Notes. Better Preparation. Better Results.</span>
              <br />
              Dedicated educational digital notes and preparation platform for Class 6 to 10 students and HSLC 2027 aspirants. Prepared meticulously in both Assamese and English mediums by experienced subject educators.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Community</span>
              </a>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 bg-sky-700/80 hover:bg-sky-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram Channel</span>
              </a>
            </div>

            <div className="flex items-center space-x-3 pt-1 text-stone-400">
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-stone-800 hover:text-red-500 hover:bg-stone-700 transition-colors"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-stone-800 hover:text-pink-400 hover:bg-stone-700 transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${contactEmail}`}
                className="p-2 rounded-lg bg-stone-800 hover:text-white hover:bg-stone-700 transition-colors"
                title="Email Support"
              >
                <Mail className="w-4 h-4" />
              </a>
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

          {/* Classes & Targets */}
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
                  onClick={() => onNavigate('browse', { classLevel: 'Class 8' })}
                  className="hover:text-red-400 transition-colors"
                >
                  Class 8 Notes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse', { classLevel: 'Class 7' })}
                  className="hover:text-red-400 transition-colors"
                >
                  Class 7 & Class 6
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
