/**
 * MKR Academy - Firebase App Check Integration
 * Protects backend resources (Firestore, Storage) against scraping and unauthorized API calls.
 * Gracefully degrades in local development/preview when site keys are not yet configured in Firebase Console.
 */

import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';
import { app } from './config';
import firebaseConfig from '../../firebase-applet-config.json';

let appCheckInstance: AppCheck | null = null;

export function initAppCheck(): AppCheck | null {
  if (typeof window === 'undefined') return null;
  if (appCheckInstance) return appCheckInstance;

  const siteKey =
    (import.meta.env?.VITE_FIREBASE_APPCHECK_SITE_KEY as string | undefined) ||
    firebaseConfig.recaptchaSiteKey ||
    '';

  const isDev = import.meta.env?.DEV || window.location.hostname.includes('localhost') || window.location.hostname.includes('run.app');

  // In development and preview environments, enable debug token to prevent blocking dev workflows
  if (isDev) {
    // Setting self.FIREBASE_APPCHECK_DEBUG_TOKEN allows authorized debugging
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN || true;
  }

  if (!siteKey) {
    if (isDev) {
      console.info('ℹ️ [App Check] Standby: No reCAPTCHA v3 site key provided. App Check is configured to activate once siteKey is added.');
    }
    return null;
  }

  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.log('🛡️ [App Check] Firebase App Check successfully initialized with reCAPTCHA v3 provider.');
    return appCheckInstance;
  } catch (err) {
    console.warn('⚠️ [App Check] Initialization notice:', err);
    return null;
  }
}
