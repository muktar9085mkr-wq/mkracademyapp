/**
 * MKR Academy - PDF Access, Download Tracking & Product Sharing Service
 * Manages secure file access, compulsory auth checks for free PDFs,
 * server-side download telemetry, native Android downloads, and permanent share links.
 */

import { Product } from '../types';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

export interface DownloadEventRecord {
  eventId: string;
  productId: string;
  productTitle: string;
  pdfId?: string;
  pdfName?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  isFree: boolean;
  downloadedAt: string;
  device?: string;
}

export interface PendingDownloadData {
  product: Product;
  pdf?: {
    id: string;
    name: string;
    driveUrl: string;
  };
}

/**
 * Safely extracts Google Drive File ID from various link formats
 */
export function getDriveFileId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match && match[1] ? match[1] : null;
}

/**
 * Returns Google Drive PDF view / preview URL for opening in a new tab / external viewer
 */
export function getDrivePreviewUrl(urlOrProduct?: string | Product): string {
  if (!urlOrProduct) return 'https://drive.google.com';
  const url = typeof urlOrProduct === 'string' ? urlOrProduct : urlOrProduct.driveFileLink;
  if (!url) return 'https://drive.google.com';
  const fileId = getDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
  return url;
}

/**
 * Returns direct export / download URL from Google Drive link
 */
export function getDriveDirectDownloadUrl(url?: string): string {
  if (!url) return 'https://drive.google.com';
  const fileId = getDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
}

/**
 * Detects device category safely
 */
export function detectDeviceType(): string {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'Web Desktop';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android App';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Web';
  if (/Tablet/i.test(ua)) return 'Tablet';
  return 'Web Desktop';
}

/**
 * Permanent canonical sharing link for a product
 */
export function getProductShareUrl(productId: string): string {
  if (typeof window === 'undefined') return `/product/${productId}`;
  const origin = window.location.origin;
  return `${origin}/product/${productId}`;
}

/**
 * Copies permanent product link to clipboard or triggers native Android/iOS share sheet
 */
export async function shareOrCopyProduct(product: {
  id: string;
  title: string;
  shortDescription?: string;
}): Promise<{ shared: boolean; copied: boolean; action: 'shared' | 'copied' | 'none'; url: string }> {
  const shareUrl = getProductShareUrl(product.id);
  const shareTitle = `${product.title} - MKR Academy Notes`;
  const shareText = `Get authentic HSLC & Board exam notes for "${product.title}" on MKR Academy:`;

  if (typeof navigator !== 'undefined' && (navigator as any).share) {
    try {
      await (navigator as any).share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      });
      return { shared: true, copied: false, action: 'shared', url: shareUrl };
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed, falling back to clipboard copy:', err);
      } else {
        return { shared: false, copied: false, action: 'none', url: shareUrl };
      }
    }
  }

  // Fallback to clipboard copy
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return { shared: false, copied: true, action: 'copied', url: shareUrl };
    } catch {
      // Fallback below
    }
  }

  // Fallback textarea copy
  try {
    const ta = document.createElement('textarea');
    ta.value = shareUrl;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return { shared: false, copied: true, action: 'copied', url: shareUrl };
  } catch {
    return { shared: false, copied: false, action: 'none', url: shareUrl };
  }
}

/**
 * Stores a pending download request in sessionStorage so it can be resumed immediately after login/signup
 */
const PENDING_DOWNLOAD_KEY = 'mkr_pending_download_target';

export function storePendingDownload(
  product: Product,
  pdf?: { id: string; name: string; driveUrl: string }
): void {
  try {
    sessionStorage.setItem(
      PENDING_DOWNLOAD_KEY,
      JSON.stringify({
        product,
        pdf
      })
    );
  } catch (err) {
    console.warn('Could not store pending download:', err);
  }
}

export function getPendingDownload(): PendingDownloadData | null {
  try {
    const raw = sessionStorage.getItem(PENDING_DOWNLOAD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.product) {
      return parsed;
    }
    // Backward compatibility if saved as bare product
    return { product: parsed };
  } catch {
    return null;
  }
}

export function clearPendingDownload(): void {
  try {
    sessionStorage.removeItem(PENDING_DOWNLOAD_KEY);
  } catch {}
}

/**
 * Record a verified successful download event on backend server
 */
export async function recordDownloadEvent(
  productOrParams: Product | { productId: string; productTitle: string; productType?: 'free' | 'paid'; isFree?: boolean },
  pdf?: { id?: string; name?: string },
  isFreeOverride?: boolean
): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  const productId = 'id' in productOrParams ? productOrParams.id : productOrParams.productId;
  const productTitle = 'title' in productOrParams ? productOrParams.title : productOrParams.productTitle;
  const isFree = isFreeOverride !== undefined
    ? isFreeOverride
    : 'isFree' in productOrParams
    ? Boolean(productOrParams.isFree)
    : false;

  const eventId = `dl_${currentUser.uid}_${productId}_${Date.now()}`;
  const device = detectDeviceType();

  // 1. Direct authenticated client write to Firestore download_events
  try {
    const docRef = doc(db, 'download_events', eventId);
    await setDoc(docRef, {
      eventId,
      productId,
      productTitle,
      pdfId: pdf?.id || 'default',
      pdfName: pdf?.name || productTitle,
      userId: currentUser.uid,
      userEmail: currentUser.email || '',
      userName: currentUser.displayName || 'Student',
      isFree,
      downloadedAt: new Date().toISOString(),
      device
    });
  } catch (fsErr) {
    // Non-blocking
  }

  // 2. Telemetry notification to backend server
  try {
    const token = await currentUser.getIdToken();
    const res = await fetch('/api/downloads/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        eventId,
        productId,
        productTitle,
        pdfId: pdf?.id || 'default',
        pdfName: pdf?.name || productTitle,
        isFree,
        device
      })
    });

    if (res.ok) {
      return true;
    }
  } catch {
    // Non-blocking
  }

  return true;
}

/**
 * Triggers file download in browser or Android WebView
 */
export function triggerFileDownload(
  urlOrProduct: string | Product,
  pdfOrFilename?: string | { id?: string; name?: string; driveUrl?: string }
): void {
  let targetUrl = '';
  let filename = 'MKR_Academy_Note.pdf';

  if (typeof urlOrProduct === 'object') {
    if (typeof pdfOrFilename === 'object' && pdfOrFilename?.driveUrl) {
      targetUrl = pdfOrFilename.driveUrl;
      filename = `${pdfOrFilename.name || urlOrProduct.title}.pdf`;
    } else {
      targetUrl = urlOrProduct.driveFileLink || '';
      filename = `${urlOrProduct.title}.pdf`;
    }
  } else {
    targetUrl = urlOrProduct;
    if (typeof pdfOrFilename === 'string') {
      filename = pdfOrFilename;
    }
  }

  const cleanUrl = getDriveDirectDownloadUrl(targetUrl) || targetUrl;
  if (!cleanUrl) return;

  const a = document.createElement('a');
  a.href = cleanUrl;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch {}
  }, 400);
}

/**
 * Opens PDF in preview mode (new tab / external viewer)
 */
export function openPdfPreview(urlOrProduct?: string | Product): void {
  const previewUrl = getDrivePreviewUrl(urlOrProduct);
  window.open(previewUrl, '_blank', 'noopener,noreferrer');
}
