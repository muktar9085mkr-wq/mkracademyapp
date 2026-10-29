export type SubjectType =
  | 'Assamese'
  | 'English'
  | 'Mathematics'
  | 'General Science'
  | 'Social Science'
  | 'Other Subjects';

export type ClassLevel =
  | 'Class 9'
  | 'Class 10'
  | 'HSLC 2027';

export type MediumType = 'Assamese Medium' | 'English Medium' | 'Both Mediums';

export type ProductCategory = 'Normal' | 'Premium' | 'Budget Friendly';

export type ProductTag =
  | 'Important Questions'
  | 'Previous Year Questions'
  | 'Complete Syllabus'
  | 'Chapter-wise Notes'
  | 'Model Question Papers'
  | 'Revision Notes'
  | 'Practice Sets';

export interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  subject: SubjectType | string;
  classLevel: ClassLevel | string;
  examTarget: string;
  medium: MediumType | string;
  category: ProductCategory;
  tags: string[];
  chapters: string[];
  coverImagePath: string;
  pdfStoragePath?: string;
  pdfFileName?: string;
  driveFileLink?: string; // Google Drive share/view/preview link
  fileType: string;
  pageCount?: number;
  originalPricePaise: number; // Stored in paise (e.g. 19900 = ₹199)
  sellingPricePaise: number;  // Stored in paise (e.g. 9900 = ₹99, 0 for Free)
  isFree?: boolean;           // True if product is a Free PDF note
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FreeNote {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  subject: string;
  chapterTopic?: string;
  chapters?: string[];
  classLevel: string;
  examTarget?: string;
  medium: string;
  coverImagePath: string;
  driveFileLink: string;
  fileType: string;
  pageCount?: number;
  pdfFileName?: string;
  isFree: true;
  featured?: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  role?: 'student' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  uid: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  productId: string;
  productTitleSnapshot: string;
  amountPaise: number;
  currency: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  verifiedAt?: string;
  refundStatus?: string;
  failureReason?: string;
}

export interface Purchase {
  id: string;
  uid: string;
  productId: string;
  orderId: string;
  productTitle: string;
  coverImagePath: string;
  driveFileLink?: string;
  pdfStoragePath?: string;
  entitlementStatus: 'active' | 'revoked';
  purchasedAt: string;
  createdAt: string;
}

export interface PromotionalBanner {
  enabled: boolean;
  title: string;
  subtitle: string;
  badgeText?: string;
  imageUrl?: string;
  ctaText?: string;
  destinationUrl?: string;
}

export interface SocialLinks {
  whatsapp?: string;
  whatsappEnabled?: boolean;
  telegram?: string;
  telegramEnabled?: boolean;
  youtube?: string;
  youtubeEnabled?: boolean;
  instagram?: string;
  instagramEnabled?: boolean;
  website?: string;
  websiteEnabled?: boolean;
  email?: string;
  emailEnabled?: boolean;
  supportPhone?: string;
  supportPhoneEnabled?: boolean;
}

export interface AppLogoSettings {
  imageUrl?: string;
  text?: string;
  highlightText?: string;
  subtitle?: string;
  iconPreset?: 'graduation' | 'book' | 'sparkles' | 'award' | 'school';
  showImageOnly?: boolean;
}

export interface AppPublicSettings {
  logo?: AppLogoSettings;
  banner: PromotionalBanner;
  social: SocialLinks;
  announcement?: string;
  brandTagline?: string;
  updatedAt?: string;
}
