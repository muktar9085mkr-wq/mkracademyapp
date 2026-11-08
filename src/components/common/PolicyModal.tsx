import React, { useState } from 'react';
import {
  X,
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
  Server
} from 'lucide-react';
import { SocialLinks } from '../../types';

export type PolicyType = 'privacy' | 'terms' | 'refund' | 'copyright' | 'grievance' | 'contact' | 'tax-certin' | null;

interface PolicyModalProps {
  type: PolicyType;
  onClose: () => void;
  socialLinks?: SocialLinks;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  type,
  onClose,
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

  // Keep activeTab in sync with prop if changed from outside
  React.useEffect(() => {
    if (type) {
      setActiveTab(type);
      setGrievanceSubmitted(false);
    }
  }, [type]);

  if (!type) return null;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5 py-4 sm:py-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-7 shadow-2xl border border-stone-200 relative max-h-[92vh] flex flex-col my-auto overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-700 text-white flex items-center justify-center shadow-xs">
              {effectiveTab === 'privacy' && <Lock className="w-5 h-5" />}
              {effectiveTab === 'terms' && <FileText className="w-5 h-5" />}
              {effectiveTab === 'refund' && <ShieldCheck className="w-5 h-5" />}
              {effectiveTab === 'copyright' && <Copyright className="w-5 h-5" />}
              {effectiveTab === 'grievance' && <Scale className="w-5 h-5" />}
              {effectiveTab === 'contact' && <Phone className="w-5 h-5" />}
              {effectiveTab === 'tax-certin' && <Receipt className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 font-sans">
                {effectiveTab === 'privacy' && 'Privacy Policy & Data Protection'}
                {effectiveTab === 'terms' && 'Terms and Conditions of Use'}
                {effectiveTab === 'refund' && 'Cancellation & Refund Policy'}
                {effectiveTab === 'copyright' && 'Copyright & Intellectual Property'}
                {effectiveTab === 'grievance' && 'Grievance Redressal & Business Details'}
                {effectiveTab === 'contact' && 'Contact Us & Student Support'}
                {effectiveTab === 'tax-certin' && 'GST, Tax & Cybersecurity Disclosures'}
              </h2>
              <p className="text-[11px] text-stone-500">
                MKR Academy • Legal & Compliance Documentation (Applicable Indian Laws)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-2.5 border-b border-stone-100 bg-stone-50/80 -mx-4 sm:-mx-7 px-4 sm:px-7 shrink-0 text-xs font-semibold text-stone-600 no-scrollbar">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              effectiveTab === 'privacy'
                ? 'bg-red-700 text-white shadow-xs'
                : 'hover:bg-stone-200/70 text-stone-700'
            }`}
          >
            Privacy Policy (DPDP)
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              effectiveTab === 'terms'
                ? 'bg-red-700 text-white shadow-xs'
                : 'hover:bg-stone-200/70 text-stone-700'
            }`}
          >
            Terms & Conditions
          </button>
          <button
            onClick={() => setActiveTab('refund')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              effectiveTab === 'refund'
                ? 'bg-red-700 text-white shadow-xs'
                : 'hover:bg-stone-200/70 text-stone-700'
            }`}
          >
            Refund Policy
          </button>
          <button
            onClick={() => setActiveTab('copyright')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              effectiveTab === 'copyright'
                ? 'bg-red-700 text-white shadow-xs'
                : 'hover:bg-stone-200/70 text-stone-700'
            }`}
          >
            Copyright & Anti-Piracy
          </button>
          <button
            onClick={() => setActiveTab('grievance')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              effectiveTab === 'grievance'
                ? 'bg-red-700 text-white shadow-xs'
                : 'hover:bg-stone-200/70 text-stone-700'
            }`}
          >
            Grievance Officer
          </button>
          <button
            onClick={() => setActiveTab('tax-certin')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              effectiveTab === 'tax-certin'
                ? 'bg-red-700 text-white shadow-xs'
                : 'hover:bg-stone-200/70 text-stone-700'
            }`}
          >
            GST & CERT-In Notice
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              effectiveTab === 'contact'
                ? 'bg-red-700 text-white shadow-xs'
                : 'hover:bg-stone-200/70 text-stone-700'
            }`}
          >
            Contact & Support
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 text-xs sm:text-sm text-stone-700 leading-relaxed space-y-4">
          
          {/* ============================================================
              1. PRIVACY POLICY
              ============================================================ */}
          {effectiveTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-red-50/60 border border-red-200/70 p-3.5 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-red-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-red-700 shrink-0" />
                  <span>Statutory Compliance Notice (Indian Law)</span>
                </p>
                <p className="text-stone-700">
                  This Privacy Policy is published in accordance with Section 43A of the Information Technology Act, 2000; the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules); and the Digital Personal Data Protection Act, 2023 (DPDP Act, 2023).
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">1. Scope and Platform Identity</h3>
                <p>
                  This Privacy Policy governs the collection, processing, storage, and protection of personal data by <strong>MKR Academy</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), an online educational platform delivering digital study notes, formula sheets, chapter question banks, and examination preparation materials for Class 9, Class 10, and HSLC 2027 students.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">2. Personal Information We Actually Collect</h3>
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
                <h3 className="font-bold text-stone-900 text-sm">3. Information We Explicitly DO NOT Collect or Store</h3>
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-stone-700 space-y-1">
                  <p className="font-bold text-stone-900">Payment Card & Banking Confidentiality:</p>
                  <p>
                    MKR Academy <strong>never</strong> collects, processes, or stores Debit Card numbers, Credit Card numbers, CVV codes, Expiry Dates, Net Banking login passwords, or UPI MPINs. All payment transactions occur directly within the secure, PCI-DSS Level 1 certified checkout environment of Razorpay Software Private Limited.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">4. Purpose of Data Processing (Purpose Limitation)</h3>
                <p>Your personal data is processed solely for lawful purposes:</p>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li>Authenticating student identity and managing single-user study licenses.</li>
                  <li>Enabling instant download and in-browser reading of purchased PDF notes.</li>
                  <li>Issuing electronic purchase invoices and receipts.</li>
                  <li>Delivering critical syllabus updates, exam tips, and student support.</li>
                  <li>Complying with statutory financial audit and cybersecurity reporting requirements.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">5. Third-Party Data Processors</h3>
                <p>We share limited personal data only with trusted, legally compliant service providers:</p>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong>Google Cloud Platform & Firebase:</strong> Provides secure database (Firestore) and authentication infrastructure within India/Asia-Southeast cloud regions with AES-256 encryption at rest.</li>
                  <li><strong>Razorpay Software Private Limited:</strong> RBI-authorized Payment Aggregator processing UPI, Card, and NetBanking payments under strict RBI tokenization mandates.</li>
                  <li><strong>Google Drive:</strong> Secure host for verified educational PDF note storage and access links.</li>
                </ul>
                <p className="text-stone-500 text-xs italic">
                  MKR Academy never sells, rents, monetizes, or shares student data with third-party advertisers or marketing data brokers.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">6. Protection of School Students and Minors (DPDP Act, 2023 §9)</h3>
                <p>
                  Because MKR Academy serves secondary school students (Class 9 and 10), many of whom are under 18 years of age:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li>Parental/guardian authorization is mandatory before purchasing notes or creating accounts.</li>
                  <li>We <strong>do not engage in behavioral monitoring, student tracking, or targeted advertising directed at children</strong>.</li>
                  <li>No discriminatory, psychological, or profiling algorithms are employed.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">7. Data Principal Rights Under DPDP Act, 2023</h3>
                <p>Students and parents/guardians retain the following statutory rights:</p>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong>Right to Access:</strong> View all personal data and order records held in your student profile.</li>
                  <li><strong>Right to Correction & Updating:</strong> Correct inaccurate phone numbers or profile names via the Student Profile interface.</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your student account and personal data, subject to mandatory 7-year financial record-keeping laws.</li>
                  <li><strong>Right to Grievance Redressal:</strong> Submit grievances directly to our designated Grievance Officer.</li>
                  <li><strong>Right to Nominate:</strong> Nominate an individual to exercise data rights in the event of death or incapacity.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">8. Data Retention Policy</h3>
                <p>
                  Student account entitlements are preserved for the student&apos;s active study period to allow repeated access to purchased notes. Financial order logs are preserved for 7 years in compliance with Section 128 of the Companies Act, 2013 and Section 44AA of the Income Tax Act, 1961.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">9. Contact & Grievance Redressal</h3>
                <p>
                  For data privacy inquiries or to exercise statutory rights, write to our designated Grievance Officer at <strong>{email}</strong> or visit the Grievance Officer tab in this window.
                </p>
              </section>
            </div>
          )}

          {/* ============================================================
              2. TERMS AND CONDITIONS
              ============================================================ */}
          {effectiveTab === 'terms' && (
            <div className="space-y-4">
              <div className="bg-stone-100 p-3.5 rounded-2xl text-xs text-stone-700 space-y-1">
                <p className="font-bold text-stone-900 flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-stone-800 shrink-0" />
                  <span>Binding Electronic Agreement (Indian Contract Act, 1872)</span>
                </p>
                <p>
                  By accessing, browsing, registering on, or purchasing digital educational materials from MKR Academy, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">1. Platform Nature and Educational Scope</h3>
                <p>
                  MKR Academy provides supplementary digital educational materials, notes, formula banks, and chapter-wise question explanations designed for Class 9, Class 10, and HSLC 2027 board exam preparation.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">2. Eligibility and Minor Students</h3>
                <p>
                  Students under the age of 18 years represent and warrant that they are accessing the platform with the informed consent, supervision, and approval of their parent or legal guardian. Financial purchases must be authorized by a parent or adult guardian using their valid payment instrument.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">3. License Grant for Digital Materials</h3>
                <p>
                  Upon verified payment of the applicable fee or administrative approval, MKR Academy grants the student a <strong>single-user, non-exclusive, non-transferable, revocable license</strong> to view, read online, and download a personal study copy of the purchased PDF notes solely for non-commercial educational revision.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">4. Strict Anti-Piracy and Prohibition of Resale</h3>
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl space-y-1.5 text-stone-800">
                  <p className="font-bold text-red-900">Zero Tolerance for Unauthorized Sharing & Piracy:</p>
                  <p>
                    Purchasing a note set gives you personal study access. It <strong>does NOT</strong> transfer copyright ownership. You are strictly prohibited from:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-stone-700">
                    <li>Uploading, sharing, distributing, or broadcasting MKR Academy PDF notes on Telegram channels, WhatsApp groups, Discord servers, Google Drives, or torrents.</li>
                    <li>Reselling, sub-licensing, renting, or commercially redistributing study notes.</li>
                    <li>Printing and selling physical copies at coaching centers, bookstores, or photocopy shops.</li>
                    <li>Removing or modifying any digital forensic watermarks, order identifiers, or copyright tags embedded in the notes.</li>
                  </ul>
                  <p className="text-[11px] text-red-700 font-semibold pt-1">
                    Violation will result in immediate permanent account termination without refund, and initiation of civil copyright damages and criminal prosecution under Sections 51, 63, and 65 of the Indian Copyright Act, 1957.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">5. Academic Outcomes Disclaimer</h3>
                <p>
                  While our educational notes are meticulously prepared in alignment with SEBA / ASSEB curriculum standards, MKR Academy makes no guarantee that using these notes will achieve a specific percentage, grade, or state board rank. Student academic success depends on individual practice, school attendance, and comprehensive preparation.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">6. Account Suspension and Misuse</h3>
                <p>
                  MKR Academy reserves the right to suspend or terminate student access without prior notice if fraudulent payment activity, chargeback abuse, security scanning, bot scraping, or unauthorized file distribution is detected.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">7. Limitation of Liability</h3>
                <p>
                  To the maximum extent permitted under applicable Indian law, MKR Academy and its instructors shall not be liable for any indirect, incidental, punitive, or consequential damages. In all circumstances, MKR Academy&apos;s total aggregate liability arising out of any purchase shall strictly not exceed the actual amount paid by the student for the specific product in dispute.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">8. Dispute Resolution & Governing Jurisdiction</h3>
                <p>
                  These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, controversy, or claim arising out of or in connection with MKR Academy shall be subject to the exclusive jurisdiction of the competent courts in <strong>Guwahati / Nagaon, Assam, India</strong>.
                </p>
              </section>
            </div>
          )}

          {/* ============================================================
              3. REFUND AND CANCELLATION POLICY
              ============================================================ */}
          {effectiveTab === 'refund' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-emerald-950 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Consumer Protection Compliant Refund Architecture</span>
                </p>
                <p className="text-emerald-900">
                  This Refund Policy is drafted in compliance with the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020. MKR Academy does not enforce an unfair or arbitrary blanket &quot;No Refund&quot; policy.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">1. Digital Educational Goods Nature</h3>
                <p>
                  Educational study materials and notes on MKR Academy are digital goods delivered via immediate Google Drive download links and in-app viewing tools. Because digital files can be read, saved, or copied instantly upon payment verification, conventional physical returns do not apply.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">2. Circumstances Where 100% Full Refund is Guaranteed</h3>
                <p>We provide prompt, unconditional 100% refunds in the following verified scenarios:</p>
                <div className="space-y-2 pt-1">
                  <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl">
                    <p className="font-bold text-stone-900 text-xs">A. Duplicate / Multiple Deductions:</p>
                    <p className="text-xs text-stone-600">
                      If a student or parent account was debited multiple times for the exact same order due to a payment gateway lag, network drop, or server timeout, 100% of all excess charges are immediately refunded.
                    </p>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl">
                    <p className="font-bold text-stone-900 text-xs">B. Payment Deducted but Access Failed:</p>
                    <p className="text-xs text-stone-600">
                      If money was deducted from your bank/UPI account and captured by Razorpay, but the student dashboard was not activated within 24 hours, and our manual administrative approval team cannot unlock access upon request.
                    </p>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl">
                    <p className="font-bold text-stone-900 text-xs">C. Defective or Inaccessible File Links:</p>
                    <p className="text-xs text-stone-600">
                      If an authorized download link is corrupt, blank, or broken, and our technical support cannot provide alternative working access within 24 hours of receiving your support ticket.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">3. Ineligible Circumstances</h3>
                <p>Refunds are not granted in cases where:</p>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li>The student has already downloaded, accessed, or read the study materials and requests a refund due to a change of mind.</li>
                  <li>The student purchased notes for an incorrect class level or medium despite clear product descriptions.</li>
                  <li>Account suspension resulting from violation of anti-piracy or unauthorized note distribution rules.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">4. Refund Procedure & Processing Timelines</h3>
                <p>
                  To submit a refund request, provide your <strong>Order ID</strong>, <strong>Razorpay Payment ID</strong>, and a screenshot of the payment debit notification to <strong>{email}</strong> or via WhatsApp at <strong>+91 {whatsapp}</strong>.
                </p>
                <div className="bg-stone-100 p-3 rounded-xl text-stone-700 text-xs space-y-1">
                  <p><strong>Timeline:</strong> Verified refund requests are approved within <strong>24 to 48 hours</strong>.</p>
                  <p><strong>Settlement:</strong> Funds are automatically credited back to the original source of payment (Original UPI ID, Debit Card, or Bank Account) via Razorpay within <strong>5 to 7 business days</strong> as per standard Reserve Bank of India (RBI) interbank settlement cycles.</p>
                </div>
              </section>
            </div>
          )}

          {/* ============================================================
              4. COPYRIGHT & INTELLECTUAL PROPERTY PROTECTION
              ============================================================ */}
          {effectiveTab === 'copyright' && (
            <div className="space-y-4">
              <div className="bg-red-50/70 border border-red-200 p-3.5 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-red-950 flex items-center space-x-1.5">
                  <Copyright className="w-4 h-4 text-red-700 shrink-0" />
                  <span>The Copyright Act, 1957 (Statutory Ownership Notice)</span>
                </p>
                <p className="text-stone-800">
                  All educational notes, question banks, diagrams, chapter summaries, formula sheets, and study compilations made available on MKR Academy are protected original literary works owned exclusively by MKR Academy.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">1. Ownership and Authorship</h3>
                <p>
                  The unique explanations, chapter-wise structures, scoring techniques, and solution compilations published on this platform have been authored and compiled by MKR Academy educators. All moral and legal rights under Section 57 of the Copyright Act, 1957 are expressly reserved.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">2. Digital Watermarking and Leak Tracking</h3>
                <p>
                  To combat digital piracy, MKR Academy employs dynamic forensic identifiers across student accounts and PDF distribution endpoints. Files downloaded by students are associated with unique transaction identifiers and student credentials.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">3. Criminal and Civil Penalties for Infringement</h3>
                <p>
                  Unauthorized reproduction, public distribution, or online mirroring is a cognizable criminal offense in India:
                </p>
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-stone-900">Section 63, Indian Copyright Act, 1957:</p>
                  <p className="text-stone-700">
                    Any person who knowingly infringes or abets the infringement of copyright shall be punishable with <strong>imprisonment for a term not less than 6 months which may extend to 3 years</strong>, and with fine which shall not be less than ₹50,000 but which may extend to ₹2,00,000.
                  </p>
                  <p className="font-bold text-stone-900 pt-1">Section 65:</p>
                  <p className="text-stone-700">
                    Possession of plates or digital copies for the purpose of making unauthorized copies is punishable with imprisonment up to 2 years and fines.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">4. Permitted Fair Dealing (Personal Study Only)</h3>
                <p>
                  In accordance with Section 52(1)(a) of the Copyright Act, 1957, a student who has lawfully purchased notes may make a single printout or offline copy solely for their own private study and board exam revision. Sharing copies with classmates, coaching institutions, or photocopy retailers is strictly non-exempt and unlawful.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">5. Reporting Infringement / Takedown Notice</h3>
                <p>
                  If you discover MKR Academy materials being pirated or sold unlawfully on Telegram, WhatsApp, social media, or other websites, please report it immediately to <strong>{email}</strong>. Informants receive priority support and appreciation rewards.
                </p>
              </section>
            </div>
          )}

          {/* ============================================================
              5. GRIEVANCE REDRESSAL & BUSINESS INFORMATION
              ============================================================ */}
          {effectiveTab === 'grievance' && (
            <div className="space-y-5">
              <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-blue-950 flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Statutory Grievance Redressal Mechanism</span>
                </p>
                <p className="text-blue-900">
                  Published pursuant to Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and Rule 4(1)(d) of the Consumer Protection (E-Commerce) Rules, 2020.
                </p>
              </div>

              {/* Official Grievance Officer Details */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
                <h3 className="font-bold text-stone-900 text-sm flex items-center space-x-2">
                  <Building className="w-4 h-4 text-red-700" />
                  <span>Designated Grievance Officer Contact Details</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <span className="text-stone-500 block text-[11px]">Platform / Brand:</span>
                    <strong className="text-stone-900">MKR Academy</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Grievance Officer Name:</span>
                    <strong className="text-stone-900">[Grievance Officer Name / Muktar Hussain, MKR Academy]</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Official Grievance Email:</span>
                    <strong className="text-red-700">{email}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Phone / WhatsApp Support:</span>
                    <strong className="text-stone-900">+91 {whatsapp}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-stone-500 block text-[11px]">Official Business & Operating Address:</span>
                    <strong className="text-stone-800">[Official Business Address: Nagaon / Guwahati, Assam, India • PIN: 781001]</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Statutory Acknowledgment Time:</span>
                    <strong className="text-emerald-700">Within 48 Hours</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Statutory Redressal Resolution Time:</span>
                    <strong className="text-emerald-700">Within 15 to 30 Days</strong>
                  </div>
                </div>
              </div>

              {/* Interactive In-App Grievance Submission Interface */}
              <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3">
                <h4 className="font-bold text-stone-900 text-sm flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-red-700" />
                  <span>Submit an Official Grievance / Complaint Online</span>
                </h4>
                <p className="text-xs text-stone-600">
                  Students or parents with payment disputes, PDF download problems, or personal data requests can submit an official complaint below:
                </p>

                {grievanceSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center space-y-2 animate-in fade-in">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h5 className="font-bold text-sm text-emerald-900">Grievance Successfully Registered</h5>
                    <p className="text-xs text-emerald-800">
                      Your statutory complaint ticket is: <strong className="font-mono text-emerald-950 font-black">{grievanceTicketId}</strong>
                    </p>
                    <p className="text-[11px] text-stone-600">
                      An official acknowledgment has been logged. Our Grievance Officer will review your submission and respond to <strong>{grievanceEmail}</strong> within 48 hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => setGrievanceSubmitted(false)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs mt-2"
                    >
                      Submit Another Ticket
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleGrievanceSubmit} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-700 font-semibold text-xs mb-1">
                          Student / Parent Full Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={grievanceName}
                          onChange={(e) => setGrievanceName(e.target.value)}
                          placeholder="Your Full Name"
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold text-xs mb-1">
                          Email Address <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={grievanceEmail}
                          onChange={(e) => setGrievanceEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold text-xs mb-1">
                          10-Digit Mobile Number
                        </label>
                        <input
                          type="tel"
                          value={grievancePhone}
                          onChange={(e) => setGrievancePhone(e.target.value)}
                          placeholder="9864012345"
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold text-xs mb-1">
                          Order ID / Payment Ref (If Applicable)
                        </label>
                        <input
                          type="text"
                          value={grievanceOrderId}
                          onChange={(e) => setGrievanceOrderId(e.target.value)}
                          placeholder="e.g. mkr_ord_... or pay_..."
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-red-600"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-stone-700 font-semibold text-xs mb-1">
                          Grievance Category <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={grievanceCategory}
                          onChange={(e: any) => setGrievanceCategory(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-red-600"
                        >
                          <option value="payment">Payment Deduction / Razorpay Verification Issue</option>
                          <option value="pdf_access">PDF Download / Google Drive Access Issue</option>
                          <option value="data_privacy">Data Privacy / Personal Data Correction or Deletion Request (DPDP Act)</option>
                          <option value="copyright">Report Copyright Infringement / Content Misuse</option>
                          <option value="other">General Academic Support or Grievance</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-stone-700 font-semibold text-xs mb-1">
                          Detailed Description of Grievance <span className="text-red-600">*</span>
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={grievanceDescription}
                          onChange={(e) => setGrievanceDescription(e.target.value)}
                          placeholder="Please explain the issue with exact details so we can resolve it quickly..."
                          className="w-full bg-white border border-stone-300 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-red-600"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Grievance to Officer</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              6. GST, TAX & CYBERSECURITY DISCLOSURES
              ============================================================ */}
          {effectiveTab === 'tax-certin' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-amber-950 flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>Indian Tax, GST and Cybersecurity Compliance Transparency</span>
                </p>
                <p className="text-amber-900">
                  Regulatory disclosures regarding Good and Services Tax (GST Act, 2017), Income Tax Act, 1961, and CERT-In Cyber Security Directions (Section 70B of IT Act, 2000).
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">1. Goods and Services Tax (GST) Treatment</h3>
                <p>
                  MKR Academy supplies digital educational textbooks, study notes, and chapter revision guides directly to students through its web platform.
                </p>
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs space-y-1.5">
                  <p><strong>Service Accounting Code (SAC) / HSN:</strong> SAC 998431 (Online text content / educational publications) and SAC 9992 (Education support services).</p>
                  <p><strong>Aggregate Turnover Threshold in Assam:</strong> Under the Goods and Services Tax framework, small suppliers whose annual aggregate turnover from services remains below the statutory threshold (₹20 Lakhs per annum for services in the State of Assam) are not mandated to obtain compulsory GST registration.</p>
                  <p><strong>Pricing Transparency:</strong> Product prices displayed on MKR Academy are all-inclusive of any applicable current charges. We do not assess unverified surcharges at checkout.</p>
                  <p className="text-[11px] text-stone-500 italic">
                    Note for Professional Tax Verification: Specific tax treatment and ongoing threshold status are subject to periodic audit and formal review by our qualified Indian Chartered Accountant (CA).
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">2. Tax Invoicing & Financial Record-Keeping</h3>
                <p>
                  Upon verified payment, an electronic order summary and invoice reference containing the student name, mobile number, product title, timestamp, and unique Razorpay transaction identifier is generated and saved to the student&apos;s account.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">3. Income Tax & E-Commerce Operator Status</h3>
                <p>
                  MKR Academy operates as a direct first-party publisher of its own study notes. It is not an e-commerce marketplace facilitating third-party sellers, and therefore Section 194-O (TDS by e-commerce operators) does not apply to transactions between MKR Academy and students.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm">4. CERT-In Cybersecurity Directives (Directions u/s 70B(6) IT Act)</h3>
                <p>
                  MKR Academy implements cybersecurity safeguards in line with the Directions issued by the Indian Computer Emergency Response Team (CERT-In):
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-stone-600">
                  <li><strong>Mandatory 6-Hour Incident Reporting:</strong> In the event of a verified data compromise, system tampering, or security breach, an official notification is dispatched to CERT-In (incident@cert-in.org.in) within 6 hours of discovery.</li>
                  <li><strong>180-Day Secure Rolling Log Retention:</strong> Transactional logs, payment verification trails, and authentication timestamps are securely archived within Indian cloud data centers for a minimum rolling period of 180 days.</li>
                  <li><strong>Indian Standard Time (IST) Synchronization:</strong> Application server clocks and database timestamps are synchronized with Indian Standard Time through Network Time Protocol (NTP).</li>
                </ul>
              </section>
            </div>
          )}

          {/* ============================================================
              7. CONTACT & SUPPORT
              ============================================================ */}
          {effectiveTab === 'contact' && (
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
                    <p className="text-[11px] text-stone-500">For academic inquiries, refunds, and partnerships</p>
                  </div>
                </a>
              </div>

              <div className="bg-stone-100 p-4 rounded-2xl text-xs text-stone-600 space-y-1">
                <p className="font-bold text-stone-800">MKR Academy Office & Support Hours:</p>
                <p>[Official Business Operating Address: Nagaon / Guwahati, Assam, India • PIN: 781001]</p>
                <p>Support Hours: 8:00 AM – 9:00 PM (Monday to Sunday, All Days)</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-400 hidden sm:inline">
            Official Compliance Documentation • Republic of India
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer ml-auto"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
