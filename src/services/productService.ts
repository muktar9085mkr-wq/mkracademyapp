import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Product, FreeNote } from '../types';

export const PRODUCTS_COLLECTION = 'products';
export const FREE_NOTES_COLLECTION = 'freeNotes';

// Authentic Official MKR Academy Study Materials for Classes 10 & 9 and HSLC 2027
// Preserves all 5 original authentic paid products
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1792811094545_9xspg',
    title: 'HSLC-2027 : COMPLETE ENGLISH',
    slug: 'hslc-2027-complete-english',
    shortDescription: 'Complete English study notes for HSLC 2027 Board Exam. Chapter-wise complete notes for easy learning.',
    description: 'MKR ACADEMY | HSLC-2027 : COMPLETE ENGLISH NOTES\n\n• Chapter-wise complete notes for easy learning\n• Important Previous Year Questions (PYQs)\n• Grammar and textbook question solutions\n• Exam-oriented answers for quick revision\n\nPrice: Only ₹99\nPrepare smarter with MKR Academy!',
    subject: 'English',
    classLevel: 'HSLC 2027',
    examTarget: 'HSLC 2027',
    medium: 'Both Mediums',
    category: 'Premium',
    tags: ['Important Questions', 'Chapter-wise Notes'],
    chapters: [],
    coverImagePath: 'https://user46792.na.imgto.link/public/20261024/839e8e6d731a03d018e2758b-english-complete-notes-hslc-2027.avif',
    driveFileLink: 'https://drive.google.com/file/d/1UZVuRJWyWeK5SHdPXx35PgVzJ0JPI__O/view?usp=drivesdk',
    fileType: 'PDF Document',
    pdfFileName: 'hslc-2027-complete-english.pdf',
    pdfStoragePath: '',
    pageCount: 100,
    originalPricePaise: 19900,
    sellingPricePaise: 9900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: '2026-10-24T03:04:54.545Z',
    updatedAt: '2026-10-24T03:09:51.959Z'
  },
  {
    id: 'prod_1792640796523_mip06',
    title: 'English Grammer HSLC-2027 ( COMPLETE )',
    slug: 'english-grammer-hslc-2027-complete',
    shortDescription: 'Complete English Grammar for HSLC-2027 preparation.',
    description: 'Complete English Grammar for HSLC-2027 preparation.\n\n• Detailed rules and solved examples for Determiners, Tenses, Voice Change, Narration, Prepositions, and Vocabulary.\n• Previous board examination question solutions included.',
    subject: 'English',
    classLevel: 'HSLC 2027',
    examTarget: 'HSLC 2027',
    medium: 'Both Mediums',
    category: 'Premium',
    tags: ['English Grammar'],
    chapters: [],
    coverImagePath: 'https://user46792.na.imgto.link/public/20261022/6cbc6119234e32533fd182f1-engfhb.avif',
    driveFileLink: 'https://drive.google.com/uc?export=download&id=1Fbk6fA8nFVF9aIHEcWoVwIydT8sZTf9y',
    fileType: 'PDF Document',
    pdfFileName: 'English Grammar',
    pdfStoragePath: '',
    pageCount: 90,
    originalPricePaise: 9900,
    sellingPricePaise: 4900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: '2026-10-22T03:46:36.523Z',
    updatedAt: '2026-10-22T03:46:36.523Z'
  },
  {
    id: 'prod_1792637927619_1xxcz',
    title: 'অসমীয়া ব্যাকৰণ ( Complete ) PYQ',
    slug: 'complete-pyq',
    shortDescription: 'Complete Assamese Grammar (অসমীয়া ব্যাকৰণ) Previous Year Questions for HSLC 2027.',
    description: 'Complete Assamese Grammar (অসমীয়া ব্যাকৰণ) Previous Year Questions for HSLC 2027 (ASSEB/SEBA). Includes sandhi, samas, prottoy, bakyo poriborton, and board exam previous years questions.',
    subject: 'Assamese',
    classLevel: 'HSLC 2027',
    examTarget: 'HSLC 2027 (ASSEB/SEBA)',
    medium: 'Assamese Medium',
    category: 'Budget Friendly',
    tags: ['অসমীয়া ব্যাকৰণ (PYQs)'],
    chapters: [],
    coverImagePath: 'https://user46792.na.imgto.link/public/20261022/52ba502d0af0b8cd6dc5892b-assbbg.avif',
    driveFileLink: 'https://drive.google.com/uc?export=download&id=1DV44yv11wuNuSke88tpKmD-SsS4zWQeZ',
    fileType: 'PDF Document',
    pdfFileName: 'অসমীয়া ব্যাকৰণ',
    pdfStoragePath: '',
    pageCount: 89,
    originalPricePaise: 9900,
    sellingPricePaise: 4900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: '2026-10-22T02:58:47.619Z',
    updatedAt: '2026-10-22T03:46:55.562Z'
  },
  {
    id: 'prod_1792588389139_duc2u',
    title: 'HSLC-2027: Assamese (অসমীয়া) Class 10',
    slug: 'hslc-2027-assamese-class-10',
    shortDescription: 'Complete Assamese (অসমীয়া) Class 10 notes for HSLC 2027 preparation.',
    description: 'Complete Assamese (অসমীয়া) Class 10 notes for HSLC 2027 preparation.\n\n• Strictly according to ASSEB/SEBA latest curriculum\n• Chapter-wise grammar and literature explanations\n• Most probable exam questions and scoring tips',
    subject: 'Assamese',
    classLevel: 'HSLC 2027',
    examTarget: 'HSLC 2027 ( ASSEB/SEBA)',
    medium: 'Assamese Medium',
    category: 'Premium',
    tags: ['Important Questions', 'Chapter-wise Notes'],
    chapters: [],
    coverImagePath: 'https://user46792.na.imgto.link/public/20261021/4cdf18f40b84ec2326f0e6dd-assameseww.avif',
    driveFileLink: 'https://drive.google.com/uc?export=download&id=125jtbu28z9Mso6OZeW0saCsXqQ8jQnCv',
    fileType: 'PDF Document',
    pdfFileName: 'hslc-2027-assamese-class-10.pdf',
    pdfStoragePath: '',
    pageCount: 208,
    originalPricePaise: 19900,
    sellingPricePaise: 9900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: '2026-10-21T13:13:09.139Z',
    updatedAt: '2026-10-21T13:36:24.588Z'
  },
  {
    id: 'prod_1792587796027_h9uus',
    title: 'HSLC-2027: Social Science (সমাজ বিজ্ঞান)',
    slug: 'hslc-2027-social-science',
    shortDescription: 'MKR ACADEMY | SOCIAL SCIENCE NOTES – HSLC 2027. Chapter-wise complete notes for easy learning.',
    description: 'MKR ACADEMY | SOCIAL SCIENCE NOTES – HSLC 2027\n\n1. Chapter-wise complete notes for easy learning.\n2. Important Previous Year Questions (PYQs).\n3. Most Important 1, 2, 3 & 5 Mark Questions.\n4. Exam-oriented answers for quick revision.\n5. Perfect for HSLC 2027 preparation and scoring better marks.\n\nPrice: Only ₹99\n\nPrepare smarter with MKR Academy!',
    subject: 'Social Science',
    classLevel: 'HSLC 2027',
    examTarget: 'HSLC 2027(ASSEB/SABA)',
    medium: 'Assamese Medium',
    category: 'Premium',
    tags: ['Important Questions', 'Chapter-wise Notes'],
    chapters: [],
    coverImagePath: 'https://user46792.na.imgto.link/public/20261021/31d28f4e794d9dd10411f5ee-socialvv.avif',
    driveFileLink: 'https://drive.google.com/uc?export=download&id=1whbiH5gjDGHmuacCBaUJ3zW6B2zZAYqh',
    fileType: 'PDF Document',
    pdfFileName: 'hslc-2027-social-science.pdf',
    pdfStoragePath: '',
    pageCount: 209,
    originalPricePaise: 19900,
    sellingPricePaise: 9900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: '2026-10-21T13:03:16.027Z',
    updatedAt: '2026-10-21T13:07:19.943Z'
  }
];

// Authentic Official MKR Academy Free Educational Notes
// Preserves all existing verified free notes created by MKR Academy
export const INITIAL_FREE_NOTES: Product[] = [
  {
    id: 'prod_1792589249434_kwfee',
    title: 'Madam rides the bus',
    slug: 'madam-rides-the-bus',
    shortDescription: 'Madam rides the bus free chapter note and question answers.',
    description: 'Madam rides the bus free chapter note and question answers for HSLC 2027 Board Exam.',
    subject: 'English',
    classLevel: 'HSLC 2027',
    examTarget: 'HSLC 2027 Board Exam',
    medium: 'English Medium',
    category: 'Normal',
    tags: ['Important Questions', 'Chapter-wise Notes', 'Free PDF'],
    chapters: ['Madam rides the bus'],
    coverImagePath: 'https://user46792.na.imgto.link/public/20261021/22ab0a34a0090b167878d87d-madam-reee.avif',
    driveFileLink: 'https://drive.google.com/uc?export=download&id=1LuQDa9mQ6YtnkYl0eAgEJYAlFnvEiXOK',
    fileType: 'PDF Document',
    pdfFileName: 'madam-rides-the-bus.pdf',
    pdfStoragePath: '',
    pageCount: 3,
    originalPricePaise: 0,
    sellingPricePaise: 0,
    isFree: true,
    featured: false,
    published: true,
    createdAt: '2026-10-21T13:27:29.434Z',
    updatedAt: '2026-10-22T03:47:46.578Z'
  },
  {
    id: 'prod_1792823094592_ririu',
    title: 'ইণ্টাৰনেটৰ তিতা-মিঠা FREE',
    slug: 'free',
    shortDescription: 'ইণ্টাৰনেটৰ তিতা-মিঠা free chapter notes for HSLC 2027.',
    description: 'ইণ্টাৰনেটৰ তিতা-মিঠা free chapter notes for HSLC 2027 Board Exam.',
    subject: 'Assamese',
    classLevel: 'HSLC 2027',
    examTarget: 'HSLC 2027 Board Exam',
    medium: 'Both Mediums',
    category: 'Normal',
    tags: ['Important Questions', 'Chapter-wise Notes', 'Free PDF'],
    chapters: ['ইণ্টাৰনেটৰ তিতা-মিঠা'],
    coverImagePath: 'https://user46792.na.imgto.link/public/20261024/7ef7a3af1129d3c1e32cf750-class-10-hslc-2027-pdf-lesson.avif',
    driveFileLink: 'https://drive.google.com/file/d/1kGWb3fCYFMI7NC_1hHi8AsN32XaX_sXK/view?usp=drivesdk',
    fileType: 'PDF Document',
    pdfFileName: 'ASSAMESE',
    pdfStoragePath: '',
    pageCount: 2,
    originalPricePaise: 0,
    sellingPricePaise: 0,
    isFree: true,
    featured: false,
    published: true,
    createdAt: '2026-10-24T06:24:54.592Z',
    updatedAt: '2026-10-24T06:24:54.592Z'
  }
];

export interface FreeNoteSubjectConfig {
  id: string;
  name: string;
  assamese: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
}

export const FREE_NOTE_SUBJECTS: FreeNoteSubjectConfig[] = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    assamese: 'গণিত',
    icon: '📐',
    badgeBg: 'bg-blue-100 text-blue-800',
    badgeText: 'text-blue-700',
    accentBorder: 'hover:border-blue-300'
  },
  {
    id: 'science',
    name: 'Science',
    assamese: 'সাধাৰণ বিজ্ঞান',
    icon: '🔬',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    badgeText: 'text-emerald-700',
    accentBorder: 'hover:border-emerald-300'
  },
  {
    id: 'english',
    name: 'English',
    assamese: 'ইংৰাজী',
    icon: '📖',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    badgeText: 'text-indigo-700',
    accentBorder: 'hover:border-indigo-300'
  },
  {
    id: 'social-science',
    name: 'Social Science',
    assamese: 'সমাজ বিজ্ঞান',
    icon: '🌍',
    badgeBg: 'bg-amber-100 text-amber-800',
    badgeText: 'text-amber-700',
    accentBorder: 'hover:border-amber-300'
  },
  {
    id: 'assamese',
    name: 'Assamese',
    assamese: 'অসমীয়া',
    icon: '✍️',
    badgeBg: 'bg-rose-100 text-rose-800',
    badgeText: 'text-rose-700',
    accentBorder: 'hover:border-rose-300'
  }
];

/**
 * Checks whether an item is specifically marked as a Free Note.
 * Strictly adheres to rule: only designated free notes, not merely zero price.
 */
export function isFreeNote(p: Product | FreeNote): boolean {
  if (p.published === false) return false;
  return p.isFree === true || (p as any).freeNote === true || (p as any).category === 'Free';
}

/**
 * Match a Free Note to one of the 5 canonical curriculum subjects.
 */
export function matchFreeNoteSubject(p: Product | FreeNote, subjectId: string): boolean {
  const target = subjectId.toLowerCase().replace(/[-\s]+/g, '');
  const s = (p.subject || '').toLowerCase().replace(/[-\s]+/g, '');

  if (target === 'mathematics') {
    return s === 'mathematics' || s === 'maths' || s === 'math';
  }
  if (target === 'science') {
    return s === 'science' || s === 'generalscience';
  }
  if (target === 'english') {
    return (
      s === 'english' ||
      (s === 'othersubjects' &&
        (p.pdfFileName?.toLowerCase().includes('english') ||
         p.title?.toLowerCase().includes('madam rides the bus')))
    );
  }
  if (target === 'socialscience') {
    return s === 'socialscience';
  }
  if (target === 'assamese') {
    return (
      s === 'assamese' ||
      (s === 'othersubjects' &&
        (p.pdfFileName?.toLowerCase().includes('assamese') ||
         p.title?.includes('ইণ্টাৰনেটৰ')))
    );
  }
  return false;
}

function isLegacySampleDoc(id: string, title?: string): boolean {
  if (
    id.startsWith('dummy_') ||
    id.startsWith('test_fake_') ||
    id.startsWith('mkr_sample_') ||
    id === 'test_write_perm'
  ) {
    return true;
  }
  if (title) {
    const t = title.toLowerCase();
    if (t.includes('fake sample test') || t.includes('dummy placeholder')) {
      return true;
    }
  }
  return false;
}

/**
 * Safely merges baseline products with Firestore documents.
 * Ensures that adding or editing a product in Firestore NEVER removes or hides existing products.
 * Firestore document fields always take precedence over static baseline values.
 */
export function mergeWithBaselineProducts(firestoreProducts: Product[]): Product[] {
  const productMap = new Map<string, Product>();

  // 1. Seed with baseline authentic MKR Academy products
  for (const base of INITIAL_PRODUCTS) {
    productMap.set(base.id, { ...base });
  }

  // 2. Overlay Firestore documents (preserving any new products and any field edits)
  for (const fp of firestoreProducts) {
    if (!fp || !fp.id) continue;
    if (isLegacySampleDoc(fp.id, fp.title)) continue;

    // Check if the product was explicitly deleted
    if ((fp as any)._deleted === true) {
      productMap.delete(fp.id);
      continue;
    }

    const existing = productMap.get(fp.id);
    if (existing) {
      productMap.set(fp.id, { ...existing, ...fp });
    } else {
      productMap.set(fp.id, fp);
    }
  }

  // 3. Sort stably by createdAt descending (newest study notes first)
  return Array.from(productMap.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Safely merges baseline free notes with Firestore documents from freeNotes collection.
 */
export function mergeWithBaselineFreeNotes(firestoreNotes: Product[]): Product[] {
  const noteMap = new Map<string, Product>();

  // 1. Seed with baseline authentic MKR Academy free notes
  for (const base of INITIAL_FREE_NOTES) {
    noteMap.set(base.id, { ...base });
  }

  // 2. Overlay Firestore documents (preserving newly added notes and edits)
  for (const fn of firestoreNotes) {
    if (!fn || !fn.id) continue;
    if (isLegacySampleDoc(fn.id, fn.title)) continue;

    if ((fn as any)._deleted === true) {
      noteMap.delete(fn.id);
      continue;
    }

    const existing = noteMap.get(fn.id);
    if (existing) {
      noteMap.set(fn.id, { ...existing, ...fn, isFree: true });
    } else {
      noteMap.set(fn.id, { ...fn, isFree: true });
    }
  }

  // 3. Sort stably by createdAt descending
  return Array.from(noteMap.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Fetch all published PAID products for student store.
 * Filters out documents specifically marked as free, ensuring they are treated separately.
 * Reads directly from Firestore without requiring user authentication.
 */
export async function getPublishedProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION));
    const querySnapshot = await getDocs(q);

    const items: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<Product, 'id'>;
      if (isLegacySampleDoc(docSnap.id, data.title)) {
        return;
      }
      items.push({ id: docSnap.id, ...data });
    });

    const merged = mergeWithBaselineProducts(items);
    // Filter strictly for paid products: not marked free and selling price > 0
    return merged.filter((p) => p.published !== false && !isFreeNote(p) && (p.sellingPricePaise || 0) > 0);
  } catch (error) {
    console.warn('Could not read products from Firestore, using baseline materials:', error);
    return INITIAL_PRODUCTS.filter((p) => p.published !== false && !isFreeNote(p) && (p.sellingPricePaise || 0) > 0);
  }
}

/**
 * Subscribe to real-time updates of published PAID products.
 * Filters out free notes to treat them completely separately.
 */
export function subscribeToPublishedProducts(
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items: Product[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Product, 'id'>;
          if (isLegacySampleDoc(docSnap.id, data.title)) {
            return;
          }
          items.push({ id: docSnap.id, ...data });
        });

        const merged = mergeWithBaselineProducts(items);
        callback(merged.filter((p) => p.published !== false && !isFreeNote(p) && (p.sellingPricePaise || 0) > 0));
      },
      (error) => {
        console.warn('Real-time products subscription issue:', error);
        callback(INITIAL_PRODUCTS.filter((p) => p.published !== false && !isFreeNote(p) && (p.sellingPricePaise || 0) > 0));
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to attach products listener:', err);
    callback(INITIAL_PRODUCTS.filter((p) => p.published !== false && !isFreeNote(p) && (p.sellingPricePaise || 0) > 0));
    return () => {};
  }
}

/**
 * Fetch all Free Notes from the dedicated 'freeNotes' Firestore collection.
 * Includes backward-compatible fallback to existing free notes so none are ever lost.
 */
export async function getFreeNotes(): Promise<Product[]> {
  try {
    const items: Product[] = [];

    // 1. Fetch from dedicated freeNotes collection
    try {
      const qFree = query(collection(db, FREE_NOTES_COLLECTION));
      const freeSnapshot = await getDocs(qFree);
      freeSnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Product, 'id'>;
        if (isLegacySampleDoc(docSnap.id, data.title)) return;
        items.push({ id: docSnap.id, ...data, isFree: true });
      });
    } catch (e) {
      console.warn('Could not read freeNotes collection:', e);
    }

    // 2. Also check if any existing free notes are present in products collection (backward compatibility)
    try {
      const qProd = query(collection(db, PRODUCTS_COLLECTION));
      const prodSnapshot = await getDocs(qProd);
      prodSnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        if (isFreeNote(data) && !items.some((item) => item.id === docSnap.id)) {
          if (!isLegacySampleDoc(docSnap.id, data.title)) {
            items.push({ ...data, id: docSnap.id, isFree: true });
          }
        }
      });
    } catch (e) {
      // Products collection check is optional
    }

    const merged = mergeWithBaselineFreeNotes(items);
    return merged.filter((p) => p.published !== false);
  } catch (error) {
    console.warn('Error reading free notes from Firestore, using baseline free notes:', error);
    return INITIAL_FREE_NOTES.filter((p) => p.published !== false);
  }
}

/**
 * Subscribe to real-time updates of the dedicated 'freeNotes' collection.
 */
export function subscribeToFreeNotes(
  callback: (freeNotes: Product[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const q = query(collection(db, FREE_NOTES_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items: Product[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Product, 'id'>;
          if (isLegacySampleDoc(docSnap.id, data.title)) return;
          items.push({ id: docSnap.id, ...data, isFree: true });
        });

        const merged = mergeWithBaselineFreeNotes(items);
        callback(merged.filter((p) => p.published !== false));
      },
      (error) => {
        console.warn('Real-time free notes subscription issue:', error);
        callback(INITIAL_FREE_NOTES.filter((p) => p.published !== false));
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to attach free notes listener:', err);
    callback(INITIAL_FREE_NOTES.filter((p) => p.published !== false));
    return () => {};
  }
}

/**
 * Fetch all products (including unpublished/drafts) for Admin
 */
export async function getAllProductsAdmin(): Promise<Product[]> {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION));
    const querySnapshot = await getDocs(q);

    const items: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<Product, 'id'>;
      if (isLegacySampleDoc(docSnap.id, data.title)) {
        return;
      }
      items.push({ id: docSnap.id, ...data });
    });

    return mergeWithBaselineProducts(items);
  } catch (error) {
    console.warn('Error in getAllProductsAdmin:', error);
    return INITIAL_PRODUCTS;
  }
}

/**
 * Fetch all Free Notes for Admin (including drafts)
 */
export async function getAllFreeNotesAdmin(): Promise<Product[]> {
  return getFreeNotes();
}

/**
 * Get product by ID (searches products and free notes)
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    // 1. Try freeNotes collection first if id starts with freenote_
    if (id.startsWith('freenote_')) {
      const freeDocRef = doc(db, FREE_NOTES_COLLECTION, id);
      const freeDocSnap = await getDoc(freeDocRef);
      if (freeDocSnap.exists() && !isLegacySampleDoc(id)) {
        return { id: freeDocSnap.id, ...(freeDocSnap.data() as Omit<Product, 'id'>), isFree: true };
      }
    }

    // 2. Try products collection
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && !isLegacySampleDoc(id)) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) };
    }

    // 3. Fallback to baseline lists
    const localProd = INITIAL_PRODUCTS.find((p) => p.id === id);
    if (localProd) return localProd;

    const localFree = INITIAL_FREE_NOTES.find((p) => p.id === id);
    if (localFree) return localFree;

    return null;
  } catch (error) {
    const local = INITIAL_PRODUCTS.find((p) => p.id === id) || INITIAL_FREE_NOTES.find((p) => p.id === id);
    return local || null;
  }
}

/**
 * Add product (Admin only)
 * Creates a unique document in products collection without replacing other products.
 */
export async function addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const newProduct = {
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, newProduct);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PRODUCTS_COLLECTION);
  }
}

/**
 * Update product (Admin only)
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await setDoc(
      docRef,
      {
        ...updates,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Delete product (Admin only)
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await setDoc(docRef, { _deleted: true, published: false, updatedAt: new Date().toISOString() }, { merge: true });
    await deleteDoc(docRef).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Add Free Note into dedicated 'freeNotes' Firestore collection (Admin only)
 */
export async function addFreeNote(noteData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const id = `freenote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, FREE_NOTES_COLLECTION, id);
    const newNote = {
      ...noteData,
      isFree: true,
      sellingPricePaise: 0,
      originalPricePaise: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, newNote);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, FREE_NOTES_COLLECTION);
  }
}

/**
 * Update Free Note in dedicated 'freeNotes' Firestore collection (Admin only)
 */
export async function updateFreeNote(id: string, updates: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, FREE_NOTES_COLLECTION, id);
    await setDoc(
      docRef,
      {
        ...updates,
        isFree: true,
        sellingPricePaise: 0,
        originalPricePaise: 0,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    // If document also exists in legacy products collection, keep it in sync
    if (id.startsWith('prod_')) {
      const prodRef = doc(db, PRODUCTS_COLLECTION, id);
      await setDoc(
        prodRef,
        {
          ...updates,
          isFree: true,
          sellingPricePaise: 0,
          originalPricePaise: 0,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      ).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FREE_NOTES_COLLECTION}/${id}`);
  }
}

/**
 * Delete Free Note from 'freeNotes' collection (Admin only)
 */
export async function deleteFreeNote(id: string): Promise<void> {
  try {
    const docRef = doc(db, FREE_NOTES_COLLECTION, id);
    await setDoc(docRef, { _deleted: true, published: false, updatedAt: new Date().toISOString() }, { merge: true });
    await deleteDoc(docRef).catch(() => {});

    // If it was originally in products collection, also soft-delete it there
    if (id.startsWith('prod_')) {
      const prodRef = doc(db, PRODUCTS_COLLECTION, id);
      await setDoc(prodRef, { _deleted: true, published: false, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      await deleteDoc(prodRef).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${FREE_NOTES_COLLECTION}/${id}`);
  }
}

/**
 * Synchronize baseline free notes into the 'freeNotes' Firestore collection.
 */
export async function syncFreeNotesToFirestore(): Promise<{ synced: number; skipped: number }> {
  let synced = 0;
  let skipped = 0;
  try {
    for (const note of INITIAL_FREE_NOTES) {
      try {
        const docRef = doc(db, FREE_NOTES_COLLECTION, note.id);
        const existing = await getDoc(docRef);
        if (!existing.exists()) {
          const { id, ...data } = note;
          await setDoc(docRef, { ...data, isFree: true, updatedAt: new Date().toISOString() }, { merge: true });
          synced++;
        } else {
          skipped++;
        }
      } catch (e) {
        // Silently handled
      }
    }
  } catch (err) {
    console.warn('Sync free notes error:', err);
  }
  return { synced, skipped };
}

/**
 * Automatically persists baseline products into Firestore when an authorized admin is active.
 * Ensures every authentic MKR Academy product exists as a physical document in the Firestore database.
 */
export async function syncBaselineProductsToFirestore(): Promise<{ synced: number; skipped: number }> {
  let synced = 0;
  let skipped = 0;

  try {
    for (const prod of INITIAL_PRODUCTS) {
      try {
        const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
        const existing = await getDoc(docRef);
        if (!existing.exists()) {
          const { id, ...data } = prod;
          await setDoc(docRef, data, { merge: true });
          synced++;
        } else {
          skipped++;
        }
      } catch (e) {
        // Handled silently if permissions not yet granted
      }
    }

    // Also sync free notes to dedicated freeNotes collection
    await syncFreeNotesToFirestore();
  } catch (err) {
    console.warn('Sync baseline products error:', err);
  }

  return { synced, skipped };
}

/**
 * Clean up any legacy seeded sample documents from Firestore
 */
export async function deleteLegacySampleProductsAdmin(): Promise<number> {
  let count = 0;
  try {
    // 1. Direct check of mkr_prod_1 through mkr_prod_20
    for (let i = 1; i <= 20; i++) {
      const docRef = doc(db, PRODUCTS_COLLECTION, `mkr_prod_${i}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await deleteDoc(docRef);
        count++;
      }
    }

    // 2. Query any remaining products matching sample criteria
    const q = query(collection(db, PRODUCTS_COLLECTION));
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (isLegacySampleDoc(docSnap.id, data.title)) {
        await deleteDoc(doc(db, PRODUCTS_COLLECTION, docSnap.id));
        count++;
      }
    }

    // 3. Query freeNotes collection for any legacy samples
    const qFree = query(collection(db, FREE_NOTES_COLLECTION));
    const snapFree = await getDocs(qFree);
    for (const docSnap of snapFree.docs) {
      const data = docSnap.data();
      if (isLegacySampleDoc(docSnap.id, data.title)) {
        await deleteDoc(doc(db, FREE_NOTES_COLLECTION, docSnap.id));
        count++;
      }
    }
  } catch (err) {
    console.warn('Could not clear legacy sample products:', err);
  }
  return count;
}
