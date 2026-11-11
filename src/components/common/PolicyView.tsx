import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Lock,
  Phone,
  Mail,
  MessageCircle,
  Send,
  AlertCircle,
  Copyright,
  Building,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Scale,
  Receipt,
  Server,
  GraduationCap
} from 'lucide-react';
import { SocialLinks } from '../../types';
import { PolicyType } from './PolicyModal';

interface PolicyViewProps {
  type: PolicyType;
  onBack: () => void;
  socialLinks?: SocialLinks;
}

export const PolicyView: React.FC<PolicyViewProps> = ({
  type,
  onBack,
  socialLinks
}) => {
  const [activeTab, setActiveTab] = useState<PolicyType>(type || 'privacy');

  // Grievance Form State
  const [grievanceName, setGrievanceName] = useState('');
  const [grievanceEmail, setGrievanceEmail] = useState('');
  const [grievancePhone, setGrievancePhone] = useState('');
  const [grievanceOrderId, setGrievanceOrderId] = useState('');
  const [grievanceCategory, setGrievanceCategory] = useState<'payment' | 'pdf_access' | 'data_privacy' | 'copyright' | 'other'>('payment');
  const [grievanceDescription, setGrievanceDescription] = useState('');
  const [grievanceSubmitted, setGrievanceSubmitted] = useState(false);
  const [grievanceTicketId, setGrievanceTicketId] = useState('');

  React.useEffect(() => {
    if (type) {
      setActiveTab(type);
      setGrievanceSubmitted(false);
    }
  }, [type]);

  const whatsapp = socialLinks?.whatsapp || '919864012345';
  const email = socialLinks?.email || 'muktar9085mkr@gmail.com';
  const telegram = socialLinks?.telegram || 'https://t.me/mkr_academy_official';

  const handleGrievanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievanceName || !grievanceEmail || !grievanceDescription) return;

    const generatedTicket = `MKR-GRV-${Date.now().toString().slice(-6)}`;
    setGrievanceTicketId(generatedTicket);
    setGrievanceSubmitted(true);
  };

  const effectiveTab = activeTab || type || 'privacy';

  return (
    <div className="w-full min-h-[calc(100vh-140px)] bg-stone-50 py-6 sm:py-10 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Bar / Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-stone-600 hover:text-stone-900 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500" />
            <span>Back to Notes</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-stone-500">
            <span>Policies & Student Support</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          
          {/* Header */}
          <div className="flex items-center space-x-3 pb-4 border-b border-stone-200">
            <div className="w-12 h-12 rounded-2xl bg-red-700 text-white flex items-center justify-center shadow-xs shrink-0">
              {effectiveTab === 'privacy' && <Lock className="w-6 h-6" />}
              {effectiveTab === 'terms' && <FileText className="w-6 h-6" />}
              {effectiveTab === 'refund' && <ShieldCheck className="w-6 h-6" />}
              {effectiveTab === 'copyright' && <Copyright className="w-6 h-6" />}
              {effectiveTab === 'grievance' && <Scale className="w-6 h-6" />}
              {effectiveTab === 'contact' && <Phone className="w-6 h-6" />}
              {effectiveTab === 'tax-certin' && <Receipt className="w-6 h-6" />}
              {effectiveTab === 'about' && <GraduationCap className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-sans">
                {effectiveTab === 'privacy' && 'Privacy Policy & Data Protection'}
                {effectiveTab === 'terms' && 'Terms and Conditions of Use'}
                {effectiveTab === 'refund' && 'Cancellation & Refund Policy'}
                {effectiveTab === 'copyright' && 'Copyright & Intellectual Property'}
                {effectiveTab === 'grievance' && 'Grievance Redressal & Business Details'}
                {effectiveTab === 'contact' && 'Contact Us & Student Support'}
                {effectiveTab === 'tax-certin' && 'GST, Tax & Cybersecurity Disclosures'}
                {effectiveTab === 'about' && 'About MKR Academy — Quality Notes & HSLC Preparation'}
              </h1>
              <p className="text-xs text-stone-500">
                MKR Academy • Legal & Compliance Documentation (Applicable Indian Laws)
              </p>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-stone-100 text-xs font-semibold text-stone-600 no-scrollbar">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                effectiveTab === 'privacy'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              Privacy Policy (DPDP)
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                effectiveTab === 'terms'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => setActiveTab('refund')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                effectiveTab === 'refund'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              Refund Policy
            </button>
            <button
              onClick={() => setActiveTab('copyright')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                effectiveTab === 'copyright'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              Copyright & Anti-Piracy
            </button>
            <button
              onClick={() => setActiveTab('grievance')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                effectiveTab === 'grievance'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              Grievance Officer
            </button>
            <button
              onClick={() => setActiveTab('tax-certin')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                effectiveTab === 'tax-certin'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              GST & CERT-In Notice
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                effectiveTab === 'contact'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              Contact & Support
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                effectiveTab === 'about'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              About MKR Academy
            </button>
          </div>

          {/* Policy Content */}
          <div className="text-xs sm:text-sm text-stone-700 leading-relaxed space-y-5">
            
            {/* 1. PRIVACY POLICY */}
            {effectiveTab === 'privacy' && (
              <div className="space-y-4">
                <div className="bg-red-50/60 border border-red-200/70 p-4 rounded-2xl text-xs space-y-1">
                  <p className="font-bold text-red-900 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-red-700 shrink-0" />
                    <span>Statutory Compliance Notice (Indian Law)</span>
                  </p>
                  <p className="text-stone-700">
                    This Privacy Policy is published in accordance with Section 43A of the Information Technology Act, 2000; the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules); and the Digital Personal Data Protection Act, 2023 (DPDP Act, 2023).
                  </p>
                </div>

                <section className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-base">1. Scope and Platform Identity</h3>
                  <p>
                    This Privacy Policy governs the collection, processing, storage, and protection of personal data by <strong>MKR Academy</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), an online educational platform delivering digital study notes, formula sheets, chapter question banks, and examination preparation materials for Class 9, Class 10, and HSLC 2027 students.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-base">2. Personal Information We Actually Collect</h3>
                  <p>
                    In accordance with the principle of <em>Data Minimization</em>, MKR Academy only collects personal information strictly necessary to provide student authentication, verify purchases, and deliver educational notes:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
                    <li><strong>Student Identification Data:</strong> Full Name, Email Address, and a 10-digit Indian Mobile Phone Number.</li>
                    <li><strong>Account Credentials:</strong> Encrypted authentication tokens managed via Google Firebase Authentication (Email/Password or Google OAuth). We never see or store plaintext account passwords.</li>
                    <li><strong>Order & Entitlement Records:</strong> Order ID, Razorpay Order ID, Razorpay Payment ID, purchased product title snapshot, amount paid in Indian Rupees (INR), and entitlement activation timestamp.</li>
                    <li><strong>Academic Preferences:</strong> Selected Class Level (e.g. Class 9, Class 10, HSLC 2027) and Medium of instruction (Assamese Medium, English Medium).</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-base">3. Information We Explicitly DO NOT Collect or Store</h3>
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl text-stone-700 space-y-1">
                    <p className="font-bold text-stone-900">Payment Card & Banking Confidentiality:</p>
                    <p>
                      MKR Academy <strong>never</strong> collects, processes, or stores Debit Card numbers, Credit Card numbers, CVV codes, Expiry Dates, Net Banking login passwords, or UPI MPINs. All payment transactions occur directly within the secure, PCI-DSS Level 1 certified checkout environment of Razorpay Software Private Limited.
                    </p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-base">4. Purpose of Data Processing</h3>
                  <p>Your personal data is processed solely for lawful purposes:</p>
                  <ul className="list-disc pl-5 space-y-1 text-stone-600">
                    <li>Authenticating student identity and managing single-user study licenses.</li>
                    <li>Enabling instant download and in-browser reading of purchased PDF notes.</li>
                    <li>Issuing electronic purchase invoices and receipts.</li>
                    <li>Delivering critical syllabus updates, exam tips, and student support.</li>
                    <li>Complying with statutory financial audit and cybersecurity reporting requirements.</li>
                  </ul>
                </section>
              </div>
            )}

            {/* 2. TERMS OF USE */}
            {effectiveTab === 'terms' && (
              <div className="space-y-4">
                <section className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-base">1. Acceptance of Terms</h3>
                  <p>
                    By browsing, purchasing, downloading, or reading study materials from MKR Academy, you agree to be bound by these Terms and Conditions. If you are under 18 years of age, you must have parental or guardian consent to register and make purchases.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-base">2. Single-Student License Grant</h3>
                  <p>
                    Every PDF note or question bank purchased grants a personal, non-transferable, single-student educational license. You may view and print the PDF for your individual exam preparation. You may not resell, upload to public cloud drives, share in bulk Telegram groups, or redistribute these files commercially.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-base">3. Payment & Pricing</h3>
                  <p>
                    All prices are listed in Indian Rupees (INR). Payments are processed securely via RBI-authorized payment aggregator Razorpay. Upon successful transaction verification, digital notes are immediately unlocked and permanently available in your student account.
                  </p>
                </section>
              </div>
            )}

            {/* 3. REFUND POLICY */}
            {effectiveTab === 'refund' && (
              <div className="space-y-4">
                <section className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-base">Cancellation & Refund Policy for Digital Goods</h3>
                  <p>
                    Because educational PDF materials and study notes are digital goods that are delivered and downloadable immediately upon payment confirmation:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
                    <li><strong>Duplicate Payments:</strong> If money was deducted multiple times for the same note due to a network glitch, full refund for the duplicate transaction will be credited back to the original payment source within 5–7 banking days.</li>
                    <li><strong>Technical File Inaccessibility:</strong> If a purchased PDF is corrupt or completely inaccessible and our technical team cannot deliver a replacement within 24 hours, a 100% refund will be granted.</li>
                    <li><strong>Customer Request Window:</strong> Refund inquiries must be submitted within 48 hours of purchase with Order ID and payment proof to <strong>{email}</strong>.</li>
                  </ul>
                </section>
              </div>
            )}

            {/* 4. COPYRIGHT & ANTI-PIRACY */}
            {effectiveTab === 'copyright' && (
              <div className="space-y-4">
                <section className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-base">Intellectual Property Rights</h3>
                  <p>
                    All educational notes, solutions, summaries, and exam question sets published on MKR Academy are protected intellectual property under the Indian Copyright Act, 1957. Unauthorized copying, piracy, or commercial re-sale is strictly prohibited and subject to legal action under Section 63 of the Copyright Act.
                  </p>
                </section>
              </div>
            )}

            {/* 5. GRIEVANCE REDRESSAL */}
            {effectiveTab === 'grievance' && (
              <div className="space-y-6">
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-1">
                  <h3 className="font-bold text-stone-900 text-sm">Designated Grievance Officer</h3>
                  <p className="text-xs text-stone-600">Name: Muktar Ali • Email: {email} • Helpline: +91 {whatsapp}</p>
                  <p className="text-xs text-stone-500">Official Jurisdiction: Guwahati / Nagaon, Assam, India</p>
                </div>

                {grievanceSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-stone-900 text-base">Grievance Ticket Submitted</h4>
                    <p className="text-xs text-stone-600">Your ticket reference is <strong>{grievanceTicketId}</strong>. Our grievance team will review your case and respond within 24–48 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleGrievanceSubmit} className="space-y-4 max-w-xl">
                    <h4 className="font-bold text-stone-900 text-sm">Submit Grievance / Dispute Form</h4>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={grievanceName}
                        onChange={(e) => setGrievanceName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={grievanceEmail}
                        onChange={(e) => setGrievanceEmail(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">Order ID (if applicable)</label>
                      <input
                        type="text"
                        value={grievanceOrderId}
                        onChange={(e) => setGrievanceOrderId(e.target.value)}
                        placeholder="e.g. ord_123456"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">Grievance Details *</label>
                      <textarea
                        required
                        rows={4}
                        value={grievanceDescription}
                        onChange={(e) => setGrievanceDescription(e.target.value)}
                        placeholder="Please describe your issue or concern in detail..."
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Submit Grievance
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* 6. TAX & CERT-IN */}
            {effectiveTab === 'tax-certin' && (
              <div className="space-y-4">
                <section className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-base">GST & Tax Disclosures</h3>
                  <p>
                    MKR Academy operates in accordance with applicable Goods and Services Tax (GST) laws of the Republic of India. Invoices reflect digital educational content deliveries.
                  </p>
                </section>
                <section className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-base">CERT-In Cybersecurity Compliance</h3>
                  <p>
                    All systems adhere to CERT-In cybersecurity guidelines with encrypted communication (HTTPS/TLS 1.3), role-based database permissions, and secure server-authoritative payment verification.
                  </p>
                </section>
              </div>
            )}

            {/* 7. CONTACT & SUPPORT */}
            {effectiveTab === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Contact MKR Academy Support</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    We are here to help you with study material access, payment queries, and academic questions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href={`https://wa.me/${whatsapp}?text=Hello%20MKR%20Academy,%20I%20need%20help%20with%20study%20notes.`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center space-x-3.5 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider text-emerald-800">WhatsApp Community & Helpline</p>
                      <p className="font-extrabold text-base">+91 {whatsapp}</p>
                      <p className="text-xs text-emerald-700">Quick response • Chat with us</p>
                    </div>
                  </a>

                  <a
                    href={`mailto:${email}`}
                    className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 flex items-center space-x-3.5 hover:bg-stone-100 transition-colors"
                  >
                    <Mail className="w-8 h-8 text-red-700 shrink-0" />
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider text-stone-500">Official Email</p>
                      <p className="font-extrabold text-base">{email}</p>
                      <p className="text-xs text-stone-500">Academic & payment support</p>
                    </div>
                  </a>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl text-xs text-stone-600 space-y-1 border border-stone-200">
                  <p className="font-bold text-stone-800">Support Hours & Address:</p>
                  <p>Operating Address: Nagaon / Guwahati, Assam, India • PIN: 781001</p>
                  <p>Working Hours: 8:00 AM – 9:00 PM (Monday to Sunday, All Days)</p>
                </div>
              </div>
            )}

            {/* 8. ABOUT MKR ACADEMY */}
            {effectiveTab === 'about' && (
              <div className="space-y-6">
                <div className="bg-red-50/70 border border-red-200 p-5 rounded-2xl space-y-2">
                  <h3 className="font-bold text-red-900 text-base flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-red-700 shrink-0" />
                    <span>MKR Academy • Educational Mission</span>
                  </h3>
                  <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                    MKR Academy is a premier digital educational portal founded with a single mission: to empower students with precise, comprehensive, and exam-oriented study materials, notes, and question banks. We specialize in Assamese and English medium education for Class 10 & 9 students preparing for SEBA board exams and the HSLC 2027 milestone.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <p className="font-bold text-stone-900 flex items-center space-x-1.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Curriculum Alignment</span>
                    </p>
                    <p className="text-stone-600">
                      Meticulously aligned with SEBA curriculum textbooks, updated blueprint guidelines, and chapter-wise question formats.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <p className="font-bold text-stone-900 flex items-center space-x-1.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Dual Medium Support</span>
                    </p>
                    <p className="text-stone-600">
                      Notes crafted with linguistic precision in both Assamese Medium (অসমীয়া মাধ্যম) and English Medium.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <p className="font-bold text-stone-900 flex items-center space-x-1.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Instant PDF Access</span>
                    </p>
                    <p className="text-stone-600">
                      High-speed direct digital delivery via secure Razorpay checkout with permanent access in the student's My Purchases library.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <p className="font-bold text-stone-900 flex items-center space-x-1.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Free Notes Portal</span>
                    </p>
                    <p className="text-stone-600">
                      A dedicated section of 100% free notes and important question sheets so every student can prepare without barriers.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-stone-900 text-stone-200 space-y-2 text-xs">
                  <p className="font-bold text-white text-sm">Academic Leadership & Headquarters</p>
                  <p className="text-stone-300">
                    Headquartered in Assam, MKR Academy is spearheaded by dedicated educators committed to quality digital education.
                  </p>
                  <div className="pt-2 text-[11px] text-stone-400 space-y-1">
                    <p>• Official Email: {email}</p>
                    <p>• Student Helpline: +91 {whatsapp}</p>
                    <p>• Official Website: mkracademy.in</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
