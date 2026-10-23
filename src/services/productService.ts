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
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'mkr_hslc_2027_science_master',
    title: 'HSLC 2027 General Science Master Notes (Assamese & English Medium)',
    slug: 'hslc-2027-science-master-notes',
    shortDescription: 'Complete chapter-wise theory, diagrams, balanced equations, and scoring question bank for SEBA/State Board Exam 2027.',
    description: 'Specially compiled by experienced senior educators for HSLC 2027 candidates. Includes Chemical Reactions, Acids & Bases, Metals & Non-metals, Carbon Compounds, Life Processes, Control & Coordination, Light, Electricity, and Magnetic Effects with bilingual explanations and previous board question solutions.',
    subject: 'General Science',
    classLevel: 'HSLC 2027',
    examTarget: 'HSLC 2027 Board Exam (SEBA)',
    medium: 'Both Mediums',
    category: 'Premium',
    tags: ['Important Questions', 'Chapter-wise Notes', 'Complete Syllabus', 'Model Question Papers'],
    chapters: [
      'Chemical Reactions & Equations (ৰাসায়নিক বিক্ৰিয়া আৰু সমীকৰণ)',
      'Acids, Bases & Salts (এছিড, ক্ষাৰক আৰু লৱণ)',
      'Metals & Non-metals (ধাতু আৰু অধাতু)',
      'Carbon & its Compounds (কাৰ্বন আৰু তাৰ যৌগ)',
      'Life Processes (জীৱন প্ৰক্ৰিয়া)',
      'Control & Coordination (নিয়ন্ত্ৰণ আৰু সমন্বয়)',
      'Light - Reflection & Refraction (পোহৰ - প্ৰতিফলন আৰু প্ৰতিসৰণ)',
      'Electricity (বিদ্যুৎ)'
    ],
    coverImagePath: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    fileType: 'PDF Master Notes',
    pageCount: 148,
    originalPricePaise: 29900,
    sellingPricePaise: 14900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'mkr_hslc_2027_maths_target90',
    title: 'HSLC 2027 Mathematics Target 90+ Question Bank & Solved Theorems',
    slug: 'hslc-2027-mathematics-target90',
    shortDescription: 'Step-by-step NCERT/SEBA theorem proofs, formula sheet, and most probable 4-mark and 5-mark board exam problems.',
    description: 'Master Class 10 Board Exam Mathematics with ease. Covers Real Numbers, Polynomials, Linear Equations, Quadratic Equations, Arithmetic Progressions, Coordinate Geometry, Triangles, Trigonometry, and Circles with detailed step-by-step proofs.',
    subject: 'Mathematics',
    classLevel: 'HSLC 2027',
    examTarget: 'HSLC 2027 Target 90%+',
    medium: 'Both Mediums',
    category: 'Premium',
    tags: ['Important Questions', 'Previous Year Questions', 'Revision Notes', 'Practice Sets'],
    chapters: [
      'Real Numbers (বাস্তৱ সংখ্যা)',
      'Polynomials (বহুপদ)',
      'Pair of Linear Equations (দুটা চলকযুক্ত ৰৈখিক সমীকৰণৰ যোৰ)',
      'Quadratic Equations (দ্বিঘাত সমীকৰণ)',
      'Triangles & Theorems (ত্ৰিভুজ আৰু উপপাদ্য)',
      'Coordinate Geometry (স্থানাংক জ্যামিতি)',
      'Introduction to Trigonometry (ত্ৰিকোণমিতিৰ পৰিচয়)'
    ],
    coverImagePath: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    fileType: 'PDF Problem Bank',
    pageCount: 164,
    originalPricePaise: 24900,
    sellingPricePaise: 9900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-03-05T00:00:00.000Z'
  },
  {
    id: 'mkr_c10_science_ch1_free',
    title: 'Class 10 Science Chapter 1: Chemical Reactions & Equations (Free PDF)',
    slug: 'class-10-science-ch1-free-pdf',
    shortDescription: 'Complete chapter summary with balanced chemical reactions, color changes, precipitation, and important question-answers.',
    description: '100% Free educational PDF notes for Class 10 Science Chapter 1. Includes definitions, balanced chemical reaction list, NCERT in-text question answers, and revision tips for board exams.',
    subject: 'General Science',
    classLevel: 'Class 10',
    examTarget: 'Class 10 Board & Annual Exam',
    medium: 'Both Mediums',
    category: 'Normal',
    tags: ['Chapter-wise Notes', 'Revision Notes', 'Important Questions'],
    chapters: [
      'What is a Chemical Reaction?',
      'Balancing Chemical Equations',
      'Combination & Decomposition Reactions',
      'Displacement & Double Displacement Reactions',
      'Oxidation, Reduction, Corrosion & Rancidity'
    ],
    coverImagePath: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
    driveFileLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view',
    fileType: 'Free PDF Note',
    pageCount: 22,
    originalPricePaise: 0,
    sellingPricePaise: 0,
    isFree: true,
    featured: true,
    published: true,
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z'
  },
  {
    id: 'mkr_c10_maths_formulas_free',
    title: 'Class 10 Mathematics Complete Formula Book & Theorem Proofs (Free PDF)',
    slug: 'class-10-maths-formulas-free-pdf',
    shortDescription: 'Quick revision pocket guide containing all Class 10 Mathematics formulas, identities, and core geometric theorem statements.',
    description: 'Handy formula and theorem summary sheet for quick exam revision. Includes Trigonometric identities, Mensuration surface area & volume formulas, Statistics mean-median-mode formulas, and Thales theorem proof.',
    subject: 'Mathematics',
    classLevel: 'Class 10',
    examTarget: 'Class 10 Revision & Quick Formula',
    medium: 'Both Mediums',
    category: 'Normal',
    tags: ['Revision Notes', 'Practice Sets'],
    chapters: [
      'Algebra & Quadratic Formula Quick Reference',
      'Trigonometric Tables (0°, 30°, 45°, 60°, 90°)',
      'Circle & Tangent Properties',
      'Surface Areas and Volumes Formulas',
      'Statistics & Probability Equations'
    ],
    coverImagePath: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
    driveFileLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view',
    fileType: 'Free PDF Note',
    pageCount: 18,
    originalPricePaise: 0,
    sellingPricePaise: 0,
    isFree: true,
    featured: false,
    published: true,
    createdAt: '2026-03-12T00:00:00.000Z',
    updatedAt: '2026-03-12T00:00:00.000Z'
  },
  {
    id: 'mkr_c10_social_science_assam',
    title: 'Class 10 Social Science Board Exam Guide (সমাজ বিজ্ঞান)',
    slug: 'class-10-social-science-board-guide',
    shortDescription: 'History, Geography, Political Science, and Economics complete chapter questions in lucid Assamese medium.',
    description: 'Prepared strictly as per the SEBA curriculum in pure, easy-to-understand Assamese medium. Detailed notes on Partition of Bengal, Swadeshi Movement, Mahatma Gandhi & the Indian Freedom Movement, Geography of Assam, and Financial Institutions.',
    subject: 'Social Science',
    classLevel: 'Class 10',
    examTarget: 'Class 10 Board Exam (SEBA)',
    medium: 'Assamese Medium',
    category: 'Budget Friendly',
    tags: ['Chapter-wise Notes', 'Important Questions', 'Complete Syllabus'],
    chapters: [
      'Partition of Bengal & Swadeshi Movement (বঙ্গ বিভাজন আৰু স্বদেশী আন্দোলন)',
      'Rise of Gandhi & Freedom Struggle (মহাত্মা গান্ধী আৰু ভাৰতৰ স্বাধীনতা সংগ্ৰাম)',
      'Geography of Assam: Physical & Economic (অসমৰ ভূগোল)',
      'Environmental Problems (পৰিৱেশ আৰু পৰিৱেশৰ সমস্যা)',
      'Money and Banking (টকা আৰু বেংক ব্যৱস্থা)'
    ],
    coverImagePath: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    fileType: 'PDF Study Pack',
    pageCount: 132,
    originalPricePaise: 19900,
    sellingPricePaise: 7900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: '2026-03-15T00:00:00.000Z',
    updatedAt: '2026-03-15T00:00:00.000Z'
  },
  {
    id: 'mkr_c9_science_foundation',
    title: 'Class 9 General Science Complete Syllabus Foundation Notes',
    slug: 'class-9-science-foundation-notes',
    shortDescription: 'Solidify your science basics for Class 10 with clear concept explanations, textbook exercise solutions, and diagrams.',
    description: 'Comprehensive chapter notes for Class 9 students covering Matter in Our Surroundings, Atoms & Molecules, Structure of the Atom, Fundamental Unit of Life (Cell), Tissues, Motion, and Force & Laws of Motion.',
    subject: 'General Science',
    classLevel: 'Class 9',
    examTarget: 'Class 9 Annual Exams & Foundation',
    medium: 'Both Mediums',
    category: 'Normal',
    tags: ['Complete Syllabus', 'Chapter-wise Notes', 'Revision Notes'],
    chapters: [
      'Matter in Our Surroundings',
      'Is Matter Around Us Pure?',
      'Atoms and Molecules',
      'Structure of the Atom',
      'The Fundamental Unit of Life',
      'Tissues & Organs',
      'Motion and Laws of Motion'
    ],
    coverImagePath: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    fileType: 'PDF Study Pack',
    pageCount: 110,
    originalPricePaise: 19900,
    sellingPricePaise: 8900,
    isFree: false,
    featured: false,
    published: true,
    createdAt: '2026-03-18T00:00:00.000Z',
    updatedAt: '2026-03-18T00:00:00.000Z'
  },
  {
    id: 'mkr_c9_maths_practice_bank',
    title: 'Class 9 Mathematics Chapter-wise Solved Exercise Bank',
    slug: 'class-9-mathematics-exercise-bank',
    shortDescription: 'Every NCERT exercise solved with neat working steps, geometric constructions, and extra practice questions.',
    description: 'Complete companion for Class 9 Maths. Covers Number Systems, Polynomials, Coordinate Geometry, Linear Equations in Two Variables, Lines and Angles, Triangles, and Herons Formula.',
    subject: 'Mathematics',
    classLevel: 'Class 9',
    examTarget: 'Class 9 Annual Exam & Maths Prep',
    medium: 'Both Mediums',
    category: 'Budget Friendly',
    tags: ['Practice Sets', 'Chapter-wise Notes'],
    chapters: [
      'Number Systems (সংখ্যা প্ৰণালী)',
      'Polynomials (বহুপদ)',
      'Coordinate Geometry (স্থানাংক জ্যামিতি)',
      'Linear Equations in Two Variables (দুটা চলকযুক্ত ৰৈখিক সমীকৰণ)',
      'Lines and Angles (ৰেখা আৰু কোণ)',
      'Triangles (ত্ৰিভুজ)'
    ],
    coverImagePath: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    fileType: 'PDF Exercise Bank',
    pageCount: 125,
    originalPricePaise: 14900,
    sellingPricePaise: 5900,
    isFree: false,
    featured: false,
    published: true,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z'
  },
  {
    id: 'mkr_c10_english_first_flight',
    title: 'Class 10 English First Flight & Footprints with Applied Grammar',
    slug: 'class-10-english-first-flight-notes',
    shortDescription: 'Summary, theme, character sketches, text questions, and English grammar (Tenses, Determiners, Voice change).',
    description: 'Comprehensive English guide for Class 10 candidates. Covers prose and poetry from First Flight, supplementary reader Footprints Without Feet, and SEBA standard English grammar rules with solved model papers.',
    subject: 'English',
    classLevel: 'Class 10',
    examTarget: 'Class 10 Board Exam English',
    medium: 'English Medium',
    category: 'Normal',
    tags: ['Important Questions', 'Complete Syllabus', 'Model Question Papers'],
    chapters: [
      'A Letter to God (Prose & Questions)',
      'Nelson Mandela: Long Walk to Freedom',
      'Stories about Flying & Anne Frank Diary',
      'Dust of Snow & Fire and Ice (Poetry Analysis)',
      'Tenses, Determiners, Prepositions & Vocabulary'
    ],
    coverImagePath: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    fileType: 'PDF Notes & Grammar',
    pageCount: 118,
    originalPricePaise: 14900,
    sellingPricePaise: 6900,
    isFree: false,
    featured: true,
    published: true,
    createdAt: '2026-03-22T00:00:00.000Z',
    updatedAt: '2026-03-22T00:00:00.000Z'
  }
];

/**
 * Fetch all published products for student application.
 * Reads directly from Firestore without requiring user authentication.
 * Falls back safely to initial materials if Firestore returns empty so visitors always see notes.
 */
export async function getPublishedProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return INITIAL_PRODUCTS;
    }

    const items: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<Product, 'id'>;
      if (isLegacySampleDoc(docSnap.id, data.title)) {
        return;
      }
      if (data.published !== false) {
        items.push({ id: docSnap.id, ...data });
      }
    });

    return items.length > 0 ? items : INITIAL_PRODUCTS;
  } catch (error) {
    console.warn('Could not read products from Firestore, using initial materials:', error);
    return INITIAL_PRODUCTS;
  }
}

/**
 * Subscribe to real-time updates of published products.
 * Allows instant UI synchronization when admin publishes or edits notes, without page refresh.
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
        if (querySnapshot.empty) {
          callback(INITIAL_PRODUCTS);
          return;
        }

        const items: Product[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Product, 'id'>;
          if (isLegacySampleDoc(docSnap.id, data.title)) {
            return;
          }
          if (data.published !== false) {
            items.push({ id: docSnap.id, ...data });
          }
        });

        callback(items.length > 0 ? items : INITIAL_PRODUCTS);
      },
      (error) => {
        console.warn('Real-time products subscription issue:', error);
        callback(INITIAL_PRODUCTS);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to attach products listener:', err);
    callback(INITIAL_PRODUCTS);
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

    if (querySnapshot.empty) {
      return INITIAL_PRODUCTS;
    }

    const items: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<Product, 'id'>;
      if (isLegacySampleDoc(docSnap.id, data.title)) {
        return;
      }
      items.push({ id: docSnap.id, ...data });
    });
    return items.length > 0 ? items : INITIAL_PRODUCTS;
  } catch (error) {
    console.warn('Error in getAllProductsAdmin:', error);
    return INITIAL_PRODUCTS;
  }
}

function isLegacySampleDoc(id: string, title?: string): boolean {
  if (
    id.startsWith('dummy_') ||
    id.startsWith('test_fake_')
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
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
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
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }
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
