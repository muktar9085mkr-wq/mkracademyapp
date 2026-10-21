export type SubjectType =
  | 'Assamese'
  | 'English'
  | 'Mathematics'
  | 'General Science'
  | 'Social Science'
  | 'Other Subjects';

export type ClassLevel =
  | 'Class 6'
  | 'Class 7'
  | 'Class 8'
  | 'Class 9'
  | 'Class 10'
  | 'HSLC 2027'
  | 'Other Examinations';

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
  fileType: string;
  pageCount?: number;
  originalPricePaise: number; // Stored in paise (e.g. 19900 = ₹199)
  sellingPricePaise: number;  // Stored in paise (e.g. 9900 = ₹99)
  featured: boolean;
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
  verifiedAt?: string;
  refundStatus?: string;
}

export interface Purchase {
  id: string;
  uid: string;
  productId: string;
  orderId: string;
  productTitle: string;
  coverImagePath: string;
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
  telegram?: string;
  youtube?: string;
  instagram?: string;
  website?: string;
  email?: string;
  supportPhone?: string;
}

export interface AppPublicSettings {
  banner: PromotionalBanner;
  social: SocialLinks;
  announcement?: string;
  brandTagline?: string;
  updatedAt?: string;
}
