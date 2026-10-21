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
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Product } from '../types';

const PRODUCTS_COLLECTION = 'products';

// No dummy or example products - everything is kept completely empty until admin adds products
export const INITIAL_PRODUCTS: Omit<Product, 'id'>[] = [];

/**
 * Fetch all published products for student application (Reads directly from Firestore)
 */
export async function getPublishedProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    const items: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<Product, 'id'>;
      // Filter out any legacy seeded products or sample/example data
      if (isLegacySampleDoc(docSnap.id, data.title)) {
        return;
      }
      if (data.published !== false) {
        items.push({ id: docSnap.id, ...data });
      }
    });

    return items;
  } catch (error) {
    console.warn('Could not read products from Firestore:', error);
    return [];
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
      return [];
    }

    const items: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<Product, 'id'>;
      // Filter out any legacy sample/example docs
      if (isLegacySampleDoc(docSnap.id, data.title)) {
        return;
      }
      items.push({ id: docSnap.id, ...data });
    });
    return items;
  } catch (error) {
    console.warn('Error in getAllProductsAdmin:', error);
    return [];
  }
}

function isLegacySampleDoc(id: string, title?: string): boolean {
  // Checks if ID or title belongs to any example/dummy/sample data
  if (
    id.startsWith('mkr_prod_') ||
    id.startsWith('sample_') ||
    id.startsWith('example_') ||
    id.startsWith('test_') ||
    id.toLowerCase().includes('sample') ||
    id.toLowerCase().includes('example')
  ) {
    return true;
  }
  if (title) {
    const t = title.toLowerCase();
    if (t.includes('sample') || t.includes('example') || t.includes('dummy')) {
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
    if (!docSnap.exists() || isLegacySampleDoc(id)) {
      return null;
    }
    return { id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${PRODUCTS_COLLECTION}/${id}`);
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
