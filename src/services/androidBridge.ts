/**
 * MKR Academy - Native Android WebView Bridge & Environment Detection
 * Strictly separates MKR Academy Android APK behavior from the standard Web app.
 * Website users (Desktop & Mobile browsers) continue using standard Web behaviors.
 */

export interface NativeGoogleSignInResult {
  idToken: string;
  rawNonce?: string;
  email?: string;
  displayName?: string;
}

interface MKRAcademyAndroidInterface {
  startGoogleSignIn?: () => void;
  clearGoogleSession?: () => void;
  openInGoogleDrive?: (url: string) => boolean | void;
  isAndroidApp?: () => boolean;
}

declare global {
  interface Window {
    MKRAcademyAndroid?: MKRAcademyAndroidInterface;
    __mkrAndroidGoogleSignInSuccess?: (payload: string | NativeGoogleSignInResult) => void;
    __mkrAndroidGoogleSignInError?: (payload: string | { code?: string; message?: string }) => void;
  }
}

/**
 * Returns true ONLY when running inside the MKR Academy Android APK WebView wrapper.
 * Returns false on Desktop, Mobile Chrome, Safari, and all regular web browsers.
 */
export function isAndroidWebViewApp(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  try {
    if (window.MKRAcademyAndroid) {
      if (typeof window.MKRAcademyAndroid.isAndroidApp === 'function') {
        return Boolean(window.MKRAcademyAndroid.isAndroidApp());
      }
      return true;
    }
  } catch {
    // Ignore bridge inspection issues
  }

  return /MKRAcademyApp/i.test(navigator.userAgent || '');
}

/**
 * Checks whether the native Android Credential Manager Google Sign-In bridge is active.
 */
export function hasNativeGoogleSignInBridge(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.MKRAcademyAndroid &&
    typeof window.MKRAcademyAndroid.startGoogleSignIn === 'function'
  );
}

/**
 * Invokes Android Credential Manager Google Account Picker and resolves with the Google ID token.
 */
export function requestNativeAndroidGoogleSignIn(): Promise<NativeGoogleSignInResult> {
  return new Promise((resolve, reject) => {
    if (!hasNativeGoogleSignInBridge()) {
      reject(new Error('Native Android Google Sign-In bridge is not available on this app version.'));
      return;
    }

    const scheduleTimeout =
      typeof window.setTimeout === 'function' ? window.setTimeout.bind(window) : globalThis.setTimeout;
    const cancelTimeout =
      typeof window.clearTimeout === 'function' ? window.clearTimeout.bind(window) : globalThis.clearTimeout;

    let settled = false;
    const timeoutId = scheduleTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Google Sign-In timed out. Please try again.'));
    }, 120000);

    const cleanup = () => {
      cancelTimeout(timeoutId);
      try {
        delete window.__mkrAndroidGoogleSignInSuccess;
        delete window.__mkrAndroidGoogleSignInError;
      } catch {
        window.__mkrAndroidGoogleSignInSuccess = undefined;
        window.__mkrAndroidGoogleSignInError = undefined;
      }
    };

    window.__mkrAndroidGoogleSignInSuccess = (payload) => {
      if (settled) return;
      settled = true;
      cleanup();

      try {
        const parsed: NativeGoogleSignInResult =
          typeof payload === 'string' ? JSON.parse(payload) : payload;
        if (parsed && parsed.idToken) {
          resolve(parsed);
        } else {
          reject(new Error('Google Sign-In did not return a valid ID token. Please try again.'));
        }
      } catch {
        reject(new Error('Failed to parse Google Sign-In credential from Android.'));
      }
    };

    window.__mkrAndroidGoogleSignInError = (payload) => {
      if (settled) return;
      settled = true;
      cleanup();

      try {
        const parsed =
          typeof payload === 'string' ? JSON.parse(payload) : payload;
        const code = parsed?.code || 'ERROR';
        const message =
          parsed?.message || 'Google Sign-In could not be completed. Please try again.';
        const err: any = new Error(message);
        err.code = code;
        reject(err);
      } catch {
        reject(new Error(typeof payload === 'string' ? payload : 'Google Sign-In failed.'));
      }
    };

    try {
      window.MKRAcademyAndroid!.startGoogleSignIn!();
    } catch (err: any) {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error(err?.message || 'Failed to open native Android Google Account picker.'));
      }
    }
  });
}

/**
 * Clears cached Credential Manager state on sign-out in Android APK.
 */
export function clearNativeAndroidGoogleSession(): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.MKRAcademyAndroid && typeof window.MKRAcademyAndroid.clearGoogleSession === 'function') {
      window.MKRAcademyAndroid.clearGoogleSession();
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Validates that a PDF / Google Drive URL is a safe, accessible http/https URL.
 */
export function validateDriveUrl(rawUrl?: string | null): { valid: boolean; url: string; reason?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      valid: false,
      url: '',
      reason: 'Google Drive link is missing for this study material.'
    };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      valid: false,
      url: '',
      reason: 'Google Drive link is empty for this study material.'
    };
  }

  if (/^(javascript|data|blob|vbscript|file):/i.test(trimmed)) {
    return {
      valid: false,
      url: '',
      reason: 'Invalid PDF link format. Please contact MKR Academy support.'
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        valid: false,
        url: '',
        reason: 'Unsupported URL protocol for Google Drive PDF.'
      };
    }
    return { valid: true, url: parsed.toString() };
  } catch {
    return {
      valid: false,
      url: '',
      reason: 'The Google Drive PDF link appears invalid or incomplete. Please contact MKR Academy support.'
    };
  }
}

/**
 * Displays a non-blocking notification banner inside the app if opening Drive fails.
 */
export function showAndroidNoticeToast(message: string, isError = true): void {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('mkr-android-bridge-toast');
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }

  const toast = document.createElement('div');
  toast.id = 'mkr-android-bridge-toast';
  toast.setAttribute('role', 'alert');
  toast.style.position = 'fixed';
  toast.style.bottom = '76px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.zIndex = '99999';
  toast.style.maxWidth = '92vw';
  toast.style.width = 'max-content';
  toast.style.padding = '12px 16px';
  toast.style.borderRadius = '14px';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = '700';
  toast.style.color = '#ffffff';
  toast.style.backgroundColor = isError ? '#991b1b' : '#065f46';
  toast.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.28)';
  toast.textContent = message;

  document.body.appendChild(toast);
  const scheduleTimeout =
    typeof window !== 'undefined' && typeof window.setTimeout === 'function'
      ? window.setTimeout.bind(window)
      : globalThis.setTimeout;
  scheduleTimeout(() => {
    try {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    } catch {
      // Ignore cleanup race
    }
  }, 4500);
}

/**
 * Opens an existing Google Drive URL externally via Android ACTION_VIEW Intent.
 * Never downloads into internal storage and never forces opening inside WebView.
 */
export function openExternalDriveInAndroid(rawUrl?: string | null): boolean {
  const check = validateDriveUrl(rawUrl);
  if (!check.valid) {
    showAndroidNoticeToast(check.reason || 'Unable to open PDF link.', true);
    return false;
  }

  try {
    if (
      window.MKRAcademyAndroid &&
      typeof window.MKRAcademyAndroid.openInGoogleDrive === 'function'
    ) {
      window.MKRAcademyAndroid.openInGoogleDrive(check.url);
      return true;
    }

    // Fallback when running in older APK builds with MKRAcademyApp UA:
    // Top-level navigation is intercepted by WebViewClient.shouldOverrideUrlLoading without HTML download attr
    window.location.href = check.url;
    return true;
  } catch (err: any) {
    showAndroidNoticeToast(
      err?.message || 'Unable to open Google Drive on this device. Please ensure Google Drive or a browser is installed.',
      true
    );
    return false;
  }
}
