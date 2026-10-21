import React from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Lock,
  Phone,
  Mail,
  MessageCircle,
  Send,
  AlertCircle
} from 'lucide-react';
import { SocialLinks } from '../../types';

interface PolicyModalProps {
  type: 'privacy' | 'terms' | 'refund' | 'contact' | null;
  onClose: () => void;
  socialLinks?: SocialLinks;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  type,
  onClose,
  socialLinks
}) => {
  if (!type) return null;

  const whatsapp = socialLinks?.whatsapp || '919864012345';
  const email = socialLinks?.email || 'muktar9085mkr@gmail.com';
  const telegram = socialLinks?.telegram || 'https://t.me/mkr_academy_official';

  const getTitle = () => {
    switch (type) {
      case 'privacy':
        return 'Privacy Policy — MKR Academy';
      case 'terms':
        return 'Terms & Conditions — MKR Academy';
      case 'refund':
        return 'Refund & Digital Download Policy';
      case 'contact':
        return 'Contact Us & Student Support';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative max-h-[88vh] overflow-y-auto space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-700 text-white flex items-center justify-center">
              {type === 'privacy' && <Lock className="w-5 h-5" />}
              {type === 'terms' && <FileText className="w-5 h-5" />}
              {type === 'refund' && <ShieldCheck className="w-5 h-5" />}
              {type === 'contact' && <Phone className="w-5 h-5" />}
            </div>
            <h2 className="text-xl font-bold text-stone-900 font-sans">
              {getTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content based on type */}
        <div className="text-xs sm:text-sm text-stone-700 leading-relaxed space-y-4">
          {type === 'privacy' && (
            <>
              <p>
                At <strong>MKR Academy</strong>, your privacy and academic trust are our utmost priorities. This Privacy Policy details how we collect, safeguard, and use your information when purchasing educational notes.
              </p>
              <h4 className="font-bold text-stone-900 text-sm">1. Information We Collect</h4>
              <p>
                We only collect information necessary to deliver educational products: student full name, email address, and 10-digit mobile phone number for sending purchase invoices and account verification.
              </p>
              <h4 className="font-bold text-stone-900 text-sm">2. Payment Security</h4>
              <p>
                All online payments are securely processed through Razorpay. MKR Academy does not store debit card, credit card, UPI MPIN, or bank account credentials on our servers.
              </p>
              <h4 className="font-bold text-stone-900 text-sm">3. Data Sharing & Confidentiality</h4>
              <p>
                We never sell, rent, or trade student personal information to any third-party marketing companies. Data is used exclusively for note delivery and course updates.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <p>
                By accessing and purchasing educational materials on <strong>MKR Academy</strong>, you agree to these Terms and Conditions.
              </p>
              <h4 className="font-bold text-stone-900 text-sm">1. Intellectual Property & License</h4>
              <p>
                All educational notes, question banks, formula sheets, and study materials are the copyrighted property of MKR Academy. Purchases grant a personal, non-transferable license for student revision. Unauthorized commercial resale, mass file sharing, or unauthorized uploading to external websites is strictly prohibited.
              </p>
              <h4 className="font-bold text-stone-900 text-sm">2. Account Responsibility</h4>
              <p>
                Students are responsible for maintaining the confidentiality of their login credentials. Any activity conducted under your account is your responsibility.
              </p>
              <h4 className="font-bold text-stone-900 text-sm">3. Curriculum Alignment</h4>
              <p>
                Our notes are prepared with care aligned with SEBA syllabus and guidelines for HSLC 2027 and secondary classes. MKR Academy strives for absolute accuracy in all solutions and explanations.
              </p>
            </>
          )}

          {type === 'refund' && (
            <>
              <p>
                Thank you for choosing <strong>MKR Academy</strong> for your examination preparation. Please review our refund guidelines regarding digital educational products.
              </p>
              <h4 className="font-bold text-stone-900 text-sm">1. Digital Product Nature</h4>
              <p>
                Because all educational notes are instant digital downloads (PDF format) accessible immediately after payment, we generally cannot accept cancellations once a file has been downloaded or opened.
              </p>
              <h4 className="font-bold text-stone-900 text-sm">2. Eligible Refund Circumstances</h4>
              <p>
                We provide prompt, full refunds in the following verified cases:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-stone-600">
                <li>Double or duplicate payment charged due to a payment gateway timeout or bank glitch.</li>
                <li>Payment deducted from student account but order status failed to activate automatically.</li>
                <li>Corrupted or inaccessible PDF file that our technical support team cannot resolve within 24 hours.</li>
              </ul>
              <h4 className="font-bold text-stone-900 text-sm">3. How to Request a Refund</h4>
              <p>
                Contact our WhatsApp support at <strong>+91 {whatsapp}</strong> or email <strong>{email}</strong> with your Order ID, Razorpay payment reference, and screenshot. Verified refunds are credited back to the original source within 3-5 business days.
              </p>
            </>
          )}

          {type === 'contact' && (
            <div className="space-y-4">
              <p>
                Have questions regarding HSLC 2027 notes, Assamese medium study materials, or need help with a payment? Reach out to our dedicated support team directly:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center space-x-3 hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider text-emerald-800">WhatsApp Support</p>
                    <p className="font-semibold text-sm">+91 {whatsapp}</p>
                    <p className="text-[11px] text-emerald-700">Instant Chat & Query Response</p>
                  </div>
                </a>

                <a
                  href={telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 flex items-center space-x-3 hover:bg-sky-100 transition-colors"
                >
                  <Send className="w-6 h-6 text-sky-600 shrink-0" />
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider text-sky-800">Telegram Channel</p>
                    <p className="font-semibold text-sm">@mkr_academy_official</p>
                    <p className="text-[11px] text-sky-700">Free updates, alerts & tips</p>
                  </div>
                </a>

                <a
                  href={`mailto:${email}`}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 flex items-center space-x-3 hover:bg-stone-100 transition-colors sm:col-span-2"
                >
                  <Mail className="w-6 h-6 text-red-700 shrink-0" />
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider text-stone-500">Official Email</p>
                    <p className="font-semibold text-sm">{email}</p>
                    <p className="text-[11px] text-stone-500">For academic inquiries, refunds & partnerships</p>
                  </div>
                </a>
              </div>

              <div className="bg-stone-100 p-4 rounded-2xl text-xs text-stone-600 space-y-1">
                <p className="font-bold text-stone-800">MKR Academy Office:</p>
                <p>Guwahati / Nagaon, Assam, India • PIN: 781001</p>
                <p>Support Hours: 8:00 AM – 9:00 PM (Monday to Sunday)</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
