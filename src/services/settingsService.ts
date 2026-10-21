import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { AppPublicSettings } from '../types';

const SETTINGS_COLLECTION = 'appSettings';
const PUBLIC_DOC = 'public';

export const DEFAULT_SETTINGS: AppPublicSettings = {
  banner: {
    enabled: true,
    title: 'HSLC 2027 Special Preparation Notes',
    subtitle: 'High-scoring Chapter-wise Notes & Solved Papers in Assamese and English Mediums.',
    badgeText: 'HSLC 2027 Target 90%+',
    ctaText: 'Explore Notes',
    destinationUrl: '#notes'
  },
  social: {
    whatsapp: '919864012345',
    telegram: 'https://t.me/mkr_academy_official',
    youtube: 'https://youtube.com/@mkr_academy',
    instagram: 'https://instagram.com/mkr_academy',
    email: 'muktar9085mkr@gmail.com',
    supportPhone: '+91 98640 12345'
  },
  announcement: '🔥 Special Launch: Get up to 50% discount on all HSLC 2027 Assamese & English medium note sets!',
  brandTagline: 'Quality Notes. Better Preparation. Better Results.'
};

/**
 * Fetch public settings from Firestore
 */
export async function getPublicSettings(): Promise<AppPublicSettings> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PUBLIC_DOC);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Seed default settings if not exists
      try {
        await setDoc(docRef, DEFAULT_SETTINGS);
      } catch (e) {
        // May fail if not signed in as admin yet
      }
      return DEFAULT_SETTINGS;
    }

    return { ...DEFAULT_SETTINGS, ...docSnap.data() } as AppPublicSettings;
  } catch (error) {
    console.warn('Could not fetch remote settings, using default:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update public settings (Admin only)
 */
export async function updatePublicSettings(newSettings: Partial<AppPublicSettings>): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PUBLIC_DOC);
    await setDoc(docRef, {
      ...newSettings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/${PUBLIC_DOC}`);
  }
}
