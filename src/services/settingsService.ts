import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { AppPublicSettings, CountdownSettings } from '../types';
import { logAdminActivity } from './auditService';

const SETTINGS_COLLECTION = 'appSettings';
const PUBLIC_DOC = 'public';

export const DEFAULT_COUNTDOWN_TARGET_DATE = '2027-02-15';

export const DEFAULT_SETTINGS: AppPublicSettings = {
  logo: {
    imageUrl: '',
    text: 'MKR',
    highlightText: 'ACADEMY',
    subtitle: 'Quality Notes • Better Results',
    iconPreset: 'graduation',
    showImageOnly: false
  },
  banner: {
    enabled: true,
    title: 'HSLC 2027 Special Preparation Notes',
    subtitle: 'High-scoring Chapter-wise Notes & Solved Papers in Assamese and English Mediums.',
    badgeText: 'HSLC 2027 Target 90%+',
    ctaText: 'Explore Notes',
    destinationUrl: '#notes'
  },
  social: {
    whatsapp: '7002958511',
    whatsappEnabled: true,
    telegram: 'https://t.me/mkr_academy_official',
    telegramEnabled: false,
    youtube: 'https://youtube.com/@mkracademy01',
    youtubeEnabled: true,
    instagram: 'https://instagram.com/mkr__academy',
    instagramEnabled: true,
    email: 'muktar9085mkr@gmail.com',
    emailEnabled: true,
    supportPhone: '+91 7002958511',
    supportPhoneEnabled: true
  },
  countdown: {
    mode: 'auto',
    daysLeft: 95,
    targetDate: DEFAULT_COUNTDOWN_TARGET_DATE,
    label: 'Days Left'
  },
  announcement: '🔥 Special Launch: Get up to 50% discount on all HSLC 2027 Assamese & English medium note sets!',
  brandTagline: 'Quality Notes. Better Preparation. Better Results.'
};

export const DEFAULT_WHATSAPP_DIGITS = '917002958511';

/**
 * Normalize a phone/WhatsApp string to country-prefixed digits for https://wa.me/<digits>
 */
export function formatWhatsAppDigits(raw?: string | null): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return DEFAULT_WHATSAPP_DIGITS;
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}

/**
 * Format phone number cleanly for display as +91 XXXXXXXXXX without double +91 91...
 */
export function formatIndianPhoneDisplay(raw?: string | null): string {
  const digits = formatWhatsAppDigits(raw);
  if (digits.startsWith('91') && digits.length === 12) {
    return `+91 ${digits.slice(2)}`;
  }
  return `+${digits}`;
}

/**
 * Safely format an ISO date or timestamp without ever rendering "Invalid Date"
 */
export function formatSafeDate(
  val?: string | number | Date | null,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'N/A',
  includeTime: boolean = false
): string {
  if (val === undefined || val === null || val === '') return fallback;
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return fallback;
  return includeTime ? d.toLocaleString('en-IN', options) : d.toLocaleDateString('en-IN', options);
}

/**
 * Compute displayed days left from public countdown settings
 */
export function computeEffectiveDaysLeft(countdown?: CountdownSettings | null): number {
  if (countdown?.mode === 'manual') {
    const parsed = Number(countdown.daysLeft);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }

  const rawDate = (countdown?.targetDate || DEFAULT_COUNTDOWN_TARGET_DATE).trim();
  const target = new Date(`${rawDate}T09:00:00+05:30`);
  const fallbackTarget = new Date(`${DEFAULT_COUNTDOWN_TARGET_DATE}T09:00:00+05:30`);
  const validTarget = isNaN(target.getTime()) ? fallbackTarget : target;
  const diffTime = validTarget.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

function mergePublicSettings(data: Record<string, any> | undefined): AppPublicSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(data || {}),
    logo: {
      ...DEFAULT_SETTINGS.logo,
      ...(data?.logo || {})
    },
    social: {
      ...DEFAULT_SETTINGS.social,
      ...(data?.social || {})
    },
    banner: {
      ...DEFAULT_SETTINGS.banner,
      ...(data?.banner || {})
    },
    countdown: {
      ...DEFAULT_SETTINGS.countdown!,
      ...(data?.countdown || {})
    }
  } as AppPublicSettings;
}

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

    return mergePublicSettings(docSnap.data());
  } catch (error) {
    console.warn('Could not fetch remote settings, using default:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Real-time subscription to public settings from Firestore
 */
export function subscribeToPublicSettings(
  onUpdate: (settings: AppPublicSettings) => void
): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, PUBLIC_DOC);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(mergePublicSettings(snapshot.data()));
      } else {
        onUpdate(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      console.warn('Real-time settings subscription issue:', error);
    }
  );
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
    logAdminActivity({
      action: 'SETTINGS_UPDATE',
      targetId: 'public',
      targetType: 'settings',
      details: { updatedKeys: Object.keys(newSettings) }
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/${PUBLIC_DOC}`);
  }
}
