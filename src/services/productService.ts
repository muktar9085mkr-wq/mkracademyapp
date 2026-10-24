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
import { Product } from '../types';

const PRODUCTS_COLLECTION = 'products';

// Authentic Official MKR Academy Study Materials for Classes 10 & 9 and HSLC 2027
// Preserves all 5 original authentic products + the newly created PDF product
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
    id: 'prod_1792589249434_kwfee',
    title: 'Madam rides the bus',
    slug: 'madam-rides-the-bus',
    shortDescription: 'Madam rides the bus free chapter note and question answers.',
    description: 'Madam rides the bus free chapter note and question answers for HSLC 2027 Board Exam.',
    subject: 'Other Subjects',
    classLevel: 'HSLC 2027',
    examTarget: 'HSLC 2027 Board Exam',
    medium: 'English Medium',
    category: 'Normal',
    tags: ['Important Questions', 'Chapter-wise Notes'],
    chapters: [],
    coverImagePath: 'https://user46792.na.imgto.link/public/20261021/22ab0a34a0090b167878d87d-madam-reee.avif',
    driveFileLink: 'https://drive.google.com/uc?export=download&id=1LuQDa9mQ6YtnkYl0eAgEJYAlFnvEiXOK',
    fileType: 'PDF Document',
    pdfFileName: 'madam-rides-the-bus.pdf',
    pdfStoragePath: '',
    pageCount: 3,
    originalPricePaise: 19900,
    sellingPricePaise: 0,
    isFree: true,
    featured: false,
    published: true,
    createdAt: '2026-10-21T13:27:29.434Z',
    updatedAt: '2026-10-22T03:47:46.578Z'
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
 * Fetch all published products for student application.
 * Reads directly from Firestore without requiring user authentication.
 * Merges with baseline authentic products so notes are ALWAYS visible and never lost.
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
    return merged.filter((p) => p.published !== false);
  } catch (error) {
    console.warn('Could not read products from Firestore, using baseline materials:', error);
    return INITIAL_PRODUCTS.filter((p) => p.published !== false);
  }
}

/**
 * Subscribe to real-time updates of published products.
 * Allows instant UI synchronization when admin publishes, edits, or adds notes, without page refresh.
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
        callback(merged.filter((p) => p.published !== false));
      },
      (error) => {
        console.warn('Real-time products subscription issue:', error);
        callback(INITIAL_PRODUCTS.filter((p) => p.published !== false));
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to attach products listener:', err);
    callback(INITIAL_PRODUCTS.filter((p) => p.published !== false));
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
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && !isLegacySampleDoc(id)) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) };
    }
    const local = INITIAL_PRODUCTS.find((p) => p.id === id);
    return local || null;
  } catch (error) {
    const local = INITIAL_PRODUCTS.find((p) => p.id === id);
    return local || null;
  }
}

/**
 * Add product (Admin only)
 * Creates a unique document in Firestore without replacing or clearing other products.
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
 * Uses setDoc with merge: true to safely handle both existing Firestore docs and baseline items.
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
 * Marks as _deleted: true and removes from collection to cleanly delete from student and admin views.
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await setDoc(docRef, { _deleted: true, published: false, updatedAt: new Date().toISOString() }, { merge: true });
    // Attempt deleteDoc if exists as distinct document
    await deleteDoc(docRef).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }
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
  } catch (err) {
    console.warn('Could not clear legacy sample products:', err);
  }
  return count;
}
