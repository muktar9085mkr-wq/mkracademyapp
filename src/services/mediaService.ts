import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  HomepageMediaItem,
  HomepageMediaContentType,
  YouTubeFeedVideo,
  HomepageCarouselSlide
} from '../types';
import { logAdminActivity } from './auditService';
import { updatePublicSettings } from './settingsService';

export const HOMEPAGE_MEDIA_COLLECTION = 'homepage_media';
export const YOUTUBE_CACHE_COLLECTION = 'youtube_feed_cache';
export const YOUTUBE_CACHE_DOC = 'latest';

export interface YouTubeFeedResponse {
  videos: YouTubeFeedVideo[];
  excludedVideoIds?: string[];
  channelId: string;
  channelInput: string;
  channelTitle: string;
  source: string;
  hasApiKey: boolean;
  cached: boolean;
  syncedAt: string;
  error?: string;
}

/**
 * Extract 11-char YouTube Video ID from watch, shorts, youtu.be, embed, or live URLs
 */
export function extractYouTubeVideoId(url: string): string {
  const raw = (url || '').trim();
  if (!raw) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const seg = parsed.pathname.split('/').filter(Boolean)[0] || '';
      return /^[a-zA-Z0-9_-]{11}$/.test(seg) ? seg : '';
    }

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const vParam = parsed.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (
        pathParts.length >= 2 &&
        ['shorts', 'embed', 'live', 'v'].includes(pathParts[0].toLowerCase())
      ) {
        const candidate = pathParts[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
      }
    }
  } catch {
    const fallbackMatch = raw.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (fallbackMatch) return fallbackMatch[1];
  }

  return '';
}

/**
 * Extract Google Drive file ID from /file/d/<ID>/..., ?id=<ID>, or Google Docs URLs
 */
export function extractGoogleDriveFileId(url: string): string {
  const raw = (url || '').trim();
  if (!raw) return '';

  const fileMatch = raw.match(/\/file\/d\/([a-zA-Z0-9_-]{15,})/);
  if (fileMatch) return fileMatch[1];

  const docMatch = raw.match(/docs\.google\.com\/(?:document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]{15,})/);
  if (docMatch) return docMatch[1];

  const queryMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (queryMatch) return queryMatch[1];

  return '';
}

/**
 * Derive Google Drive subtype for accurate icon display (PDF, Video, or Document)
 */
export function detectDriveContentKind(
  title: string,
  url: string
): 'pdf' | 'video' | 'document' | 'file' {
  const combined = `${title || ''} ${url || ''}`.toLowerCase();
  if (
    combined.includes('video') ||
    combined.includes('lecture') ||
    combined.includes('class ') ||
    combined.includes('.mp4') ||
    combined.includes('.mov') ||
    combined.includes('recording')
  ) {
    return 'video';
  }
  if (
    combined.includes('docs.google.com/document') ||
    combined.includes('docs.google.com/presentation') ||
    combined.includes('.docx') ||
    combined.includes('syllabus') ||
    combined.includes('doc')
  ) {
    return 'document';
  }
  if (
    combined.includes('pdf') ||
    combined.includes('note') ||
    combined.includes('pyq') ||
    combined.includes('paper') ||
    combined.includes('chapter') ||
    combined.includes('drive.google.com/file/')
  ) {
    return 'pdf';
  }
  return 'file';
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
}

export function getGoogleDriveThumbnailUrl(contentUrl: string): string {
  const fileId = extractGoogleDriveFileId(contentUrl);
  if (!fileId) return '';
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

/**
 * Compute default thumbnail URL cleanly when admin leaves Thumbnail URL empty
 */
export function resolveThumbnailUrl(
  contentType: HomepageMediaContentType,
  contentUrl: string,
  manualThumbnailUrl?: string
): string {
  const trimmedManual = (manualThumbnailUrl || '').trim();
  if (trimmedManual && /^https?:\/\//i.test(trimmedManual)) {
    return trimmedManual;
  }

  if (contentType === 'youtube') {
    const vid = extractYouTubeVideoId(contentUrl);
    if (vid) return getYouTubeThumbnailUrl(vid);
  }

  if (contentType === 'google_drive') {
    const driveThumb = getGoogleDriveThumbnailUrl(contentUrl);
    if (driveThumb) return driveThumb;
  }

  return '';
}

/**
 * Validate and normalize destination URL so Android, iOS, and Desktop open content reliably
 */
export function validateAndFormatMediaOpenUrl(
  contentType: HomepageMediaContentType,
  rawUrl: string,
  videoId?: string
): { url: string; valid: boolean; reason?: string } {
  const trimmed = (rawUrl || '').trim();

  if (contentType === 'youtube') {
    const vid = (videoId || '').trim() || extractYouTubeVideoId(trimmed);
    if (vid) {
      return { url: `https://www.youtube.com/watch?v=${vid}`, valid: true };
    }
    if (/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(trimmed)) {
      return { url: trimmed, valid: true };
    }
    return { url: '', valid: false, reason: 'Invalid or unavailable YouTube video link' };
  }

  // Google Drive validation
  if (!/^https?:\/\//i.test(trimmed)) {
    return { url: '', valid: false, reason: 'Google Drive link must start with https://' };
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const isGoogleHost =
      host.includes('drive.google.com') || host.includes('docs.google.com');
    if (!isGoogleHost) {
      return { url: '', valid: false, reason: 'Invalid Google Drive URL host' };
    }

    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId && host.includes('drive.google.com') && !trimmed.includes('/folders/')) {
      // /preview works smoothly inside Android, iOS, and Desktop browsers cleanly
      return {
        url: `https://drive.google.com/file/d/${fileId}/preview`,
        valid: true
      };
    }

    return { url: trimmed, valid: true };
  } catch {
    return { url: '', valid: false, reason: 'Malformed Google Drive URL' };
  }
}

/**
 * Sort active/admin media records stably by displayOrder asc, then newest createdAt
 */
function sortAdminMedia(items: HomepageMediaItem[]): HomepageMediaItem[] {
  return [...items].sort((a, b) => {
    const orderA = Number.isFinite(Number(a.displayOrder)) ? Number(a.displayOrder) : 999;
    const orderB = Number.isFinite(Number(b.displayOrder)) ? Number(b.displayOrder) : 999;
    if (orderA !== orderB) return orderA - orderB;
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Subscribe to ACTIVE homepage media items (student mobile homepage)
 */
export function subscribeToActiveHomepageMedia(
  callback: (items: HomepageMediaItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const q = query(
      collection(db, HOMEPAGE_MEDIA_COLLECTION),
      where('isActive', '==', true)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const items: HomepageMediaItem[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<HomepageMediaItem, 'id'>)
        }));
        callback(sortAdminMedia(items));
      },
      (error) => {
        console.warn('Homepage active media listener warning:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Could not subscribe to active homepage media:', err);
    return () => {};
  }
}

/**
 * Subscribe to ALL homepage media items (Admin Panel manager)
 */
export function subscribeToAllHomepageMediaAdmin(
  callback: (items: HomepageMediaItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const q = query(collection(db, HOMEPAGE_MEDIA_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: HomepageMediaItem[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<HomepageMediaItem, 'id'>)
        }));
        callback(sortAdminMedia(items));
      },
      (error) => {
        console.warn('Admin homepage media listener warning:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Could not subscribe to admin homepage media:', err);
    return () => {};
  }
}

export interface HomepageMediaWriteInput {
  title: string;
  contentType: HomepageMediaContentType;
  contentUrl: string;
  thumbnailUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

/**
 * Create a new homepage media entry (strictly NO description field)
 */
export async function createHomepageMedia(input: HomepageMediaWriteInput): Promise<string> {
  try {
    const id = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const videoId =
      input.contentType === 'youtube'
        ? extractYouTubeVideoId(input.contentUrl)
        : extractGoogleDriveFileId(input.contentUrl);
    const thumbnailUrl = resolveThumbnailUrl(
      input.contentType,
      input.contentUrl,
      input.thumbnailUrl
    );

    const payload: Omit<HomepageMediaItem, 'id'> = {
      title: input.title.trim(),
      contentType: input.contentType,
      contentUrl: input.contentUrl.trim(),
      videoId: videoId || '',
      thumbnailUrl,
      publishedAt: now,
      displayOrder: Math.max(0, Math.floor(Number(input.displayOrder) || 1)),
      isActive: Boolean(input.isActive),
      createdAt: now,
      updatedAt: now
    };

    await setDoc(doc(db, HOMEPAGE_MEDIA_COLLECTION, id), payload);

    logAdminActivity({
      action: 'MEDIA_CREATE',
      targetId: id,
      targetType: 'media',
      details: {
        title: payload.title,
        contentType: payload.contentType,
        displayOrder: payload.displayOrder,
        isActive: payload.isActive
      }
    }).catch(() => {});

    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, HOMEPAGE_MEDIA_COLLECTION);
  }
}

/**
 * Update an existing homepage media entry (strictly NO description field)
 */
export async function updateHomepageMedia(
  id: string,
  updates: Partial<HomepageMediaWriteInput> & { createdAt?: string }
): Promise<void> {
  try {
    const docRef = doc(db, HOMEPAGE_MEDIA_COLLECTION, id);
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      throw new Error('Media entry not found');
    }
    const existing = existingSnap.data() as Omit<HomepageMediaItem, 'id'>;

    const nextContentType = updates.contentType ?? existing.contentType;
    const nextContentUrl = (updates.contentUrl ?? existing.contentUrl).trim();
    const nextTitle = (updates.title ?? existing.title).trim();
    const nextVideoId =
      nextContentType === 'youtube'
        ? extractYouTubeVideoId(nextContentUrl)
        : extractGoogleDriveFileId(nextContentUrl);

    const nextThumb =
      updates.thumbnailUrl !== undefined
        ? resolveThumbnailUrl(nextContentType, nextContentUrl, updates.thumbnailUrl)
        : existing.thumbnailUrl || resolveThumbnailUrl(nextContentType, nextContentUrl);

    const now = new Date().toISOString();

    const sanitizedPayload: Omit<HomepageMediaItem, 'id'> = {
      title: nextTitle,
      contentType: nextContentType,
      contentUrl: nextContentUrl,
      videoId: nextVideoId || '',
      thumbnailUrl: nextThumb,
      publishedAt: existing.publishedAt || existing.createdAt || now,
      displayOrder:
        updates.displayOrder !== undefined
          ? Math.max(0, Math.floor(Number(updates.displayOrder) || 0))
          : existing.displayOrder,
      isActive: updates.isActive !== undefined ? Boolean(updates.isActive) : existing.isActive,
      createdAt: existing.createdAt || now,
      updatedAt: now
    };

    await setDoc(docRef, sanitizedPayload);

    logAdminActivity({
      action: 'MEDIA_UPDATE',
      targetId: id,
      targetType: 'media',
      details: {
        title: sanitizedPayload.title,
        contentType: sanitizedPayload.contentType,
        displayOrder: sanitizedPayload.displayOrder,
        isActive: sanitizedPayload.isActive
      }
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${HOMEPAGE_MEDIA_COLLECTION}/${id}`);
  }
}

/**
 * Quick Active/Inactive status toggle
 */
export async function toggleHomepageMediaActive(id: string, isActive: boolean): Promise<void> {
  try {
    const docRef = doc(db, HOMEPAGE_MEDIA_COLLECTION, id);
    await updateDoc(docRef, {
      isActive: Boolean(isActive),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${HOMEPAGE_MEDIA_COLLECTION}/${id}`);
  }
}

/**
 * Quick displayOrder position update
 */
export async function updateHomepageMediaPosition(id: string, displayOrder: number): Promise<void> {
  try {
    const docRef = doc(db, HOMEPAGE_MEDIA_COLLECTION, id);
    await updateDoc(docRef, {
      displayOrder: Math.max(0, Math.floor(Number(displayOrder) || 0)),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${HOMEPAGE_MEDIA_COLLECTION}/${id}`);
  }
}

/**
 * Delete homepage media item permanently from Firestore
 */
export async function deleteHomepageMedia(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, HOMEPAGE_MEDIA_COLLECTION, id));
    logAdminActivity({
      action: 'MEDIA_DELETE',
      targetId: id,
      targetType: 'media'
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${HOMEPAGE_MEDIA_COLLECTION}/${id}`);
  }
}

/**
 * Fallback helper: read cached YouTube videos & exclusions directly from Firestore cache collection
 */
export async function getCachedYouTubeFeedFromFirestore(): Promise<YouTubeFeedResponse | null> {
  try {
    const snap = await getDoc(doc(db, YOUTUBE_CACHE_COLLECTION, YOUTUBE_CACHE_DOC));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    const excludedVideoIds: string[] = Array.isArray(data?.excludedVideoIds)
      ? data.excludedVideoIds.filter((v: any) => typeof v === 'string')
      : [];
    const excludedSet = new Set(excludedVideoIds);
    const videos: YouTubeFeedVideo[] = Array.isArray(data?.videos)
      ? data.videos.filter((v: any) => v?.videoId && !excludedSet.has(v.videoId)).slice(0, 10)
      : [];
    return {
      videos,
      excludedVideoIds,
      channelId: data?.channelId || '',
      channelInput: data?.channelId || '',
      channelTitle: data?.channelTitle || 'MKR Academy',
      source: data?.source || 'firestore_cache',
      hasApiKey: false,
      cached: true,
      syncedAt: data?.syncedAt || ''
    };
  } catch {
    return null;
  }
}

/**
 * Real-time listener on youtube_feed_cache/latest so edits, deletions, or syncs propagate immediately
 */
export function subscribeToYoutubeFeedCache(
  callback: (data: {
    videos: YouTubeFeedVideo[];
    excludedVideoIds: string[];
    channelId: string;
    channelTitle: string;
    syncedAt: string;
  }) => void
): () => void {
  try {
    const docRef = doc(db, YOUTUBE_CACHE_COLLECTION, YOUTUBE_CACHE_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as any;
        const excludedVideoIds: string[] = Array.isArray(data?.excludedVideoIds)
          ? data.excludedVideoIds.filter((v: any) => typeof v === 'string')
          : [];
        const excludedSet = new Set(excludedVideoIds);
        const videos: YouTubeFeedVideo[] = Array.isArray(data?.videos)
          ? data.videos.filter((v: any) => v?.videoId && !excludedSet.has(v.videoId)).slice(0, 10)
          : [];
        callback({
          videos,
          excludedVideoIds,
          channelId: data?.channelId || '',
          channelTitle: data?.channelTitle || 'MKR Academy',
          syncedAt: data?.syncedAt || ''
        });
      },
      (err) => {
        console.warn('YouTube cache listener warning:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Remove / hide an auto-fetched YouTube video from the Mobile Carousel (and persist exclusion in Firestore)
 */
export async function excludeAutoYouTubeVideo(videoId: string): Promise<void> {
  if (!videoId) return;
  try {
    const docRef = doc(db, YOUTUBE_CACHE_COLLECTION, YOUTUBE_CACHE_DOC);
    const snap = await getDoc(docRef);
    const data = snap.exists() ? (snap.data() as any) : {};
    const existingExcluded: string[] = Array.isArray(data?.excludedVideoIds)
      ? data.excludedVideoIds
      : [];
    const nextExcluded = Array.from(new Set([...existingExcluded, videoId]));
    const existingVideos: YouTubeFeedVideo[] = Array.isArray(data?.videos) ? data.videos : [];
    const nextVideos = existingVideos.filter((v) => v?.videoId !== videoId);

    await setDoc(
      docRef,
      {
        channelId: data?.channelId || '',
        channelTitle: data?.channelTitle || 'MKR Academy',
        videos: nextVideos,
        excludedVideoIds: nextExcluded,
        source: data?.source || 'admin_curated',
        syncedAt: data?.syncedAt || new Date().toISOString()
      },
      { merge: true }
    );

    logAdminActivity({
      action: 'MEDIA_YOUTUBE_DELETE',
      targetId: videoId,
      targetType: 'media',
      details: { excludedVideoId: videoId }
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${YOUTUBE_CACHE_COLLECTION}/${YOUTUBE_CACHE_DOC}`);
  }
}

/**
 * Restore a previously excluded auto-fetched YouTube video
 */
export async function restoreAutoYouTubeVideo(videoId: string): Promise<void> {
  if (!videoId) return;
  try {
    const docRef = doc(db, YOUTUBE_CACHE_COLLECTION, YOUTUBE_CACHE_DOC);
    const snap = await getDoc(docRef);
    const data = snap.exists() ? (snap.data() as any) : {};
    const existingExcluded: string[] = Array.isArray(data?.excludedVideoIds)
      ? data.excludedVideoIds
      : [];
    const nextExcluded = existingExcluded.filter((id) => id !== videoId);

    await setDoc(
      docRef,
      {
        excludedVideoIds: nextExcluded
      },
      { merge: true }
    );

    logAdminActivity({
      action: 'MEDIA_YOUTUBE_RESTORE',
      targetId: videoId,
      targetType: 'media'
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${YOUTUBE_CACHE_COLLECTION}/${YOUTUBE_CACHE_DOC}`);
  }
}

/**
 * Fetch latest cached 10 YouTube uploads from backend API (with Firestore cache fallback)
 */
export async function fetchLatestYouTubeFeed(): Promise<YouTubeFeedResponse> {
  try {
    const [apiRes, fsFallback] = await Promise.all([
      fetch('/api/media/youtube').catch(() => null),
      getCachedYouTubeFeedFromFirestore()
    ]);

    const excludedSet = new Set(fsFallback?.excludedVideoIds || []);

    if (apiRes && apiRes.ok) {
      const data = await apiRes.json();
      const rawVideos: YouTubeFeedVideo[] = Array.isArray(data?.videos) ? data.videos : [];
      const filteredVideos = rawVideos.filter((v) => v?.videoId && !excludedSet.has(v.videoId));
      if (filteredVideos.length > 0) {
        return {
          ...(data as YouTubeFeedResponse),
          videos: filteredVideos,
          excludedVideoIds: fsFallback?.excludedVideoIds || []
        };
      }
      if (fsFallback && fsFallback.videos.length > 0) {
        return fsFallback;
      }
      return {
        ...(data as YouTubeFeedResponse),
        videos: filteredVideos,
        excludedVideoIds: fsFallback?.excludedVideoIds || []
      };
    }

    if (fsFallback) return fsFallback;
  } catch {
    const fsFallback = await getCachedYouTubeFeedFromFirestore();
    if (fsFallback) return fsFallback;
  }

  return {
    videos: [],
    excludedVideoIds: [],
    channelId: '',
    channelInput: '',
    channelTitle: 'MKR Academy',
    source: 'empty',
    hasApiKey: false,
    cached: false,
    syncedAt: ''
  };
}

/**
 * Admin: Save channel ID/handle & force refresh latest YouTube videos via secure server route,
 * then persist updated cache to Firestore so homepage loads fast with minimal API quota.
 */
export async function syncYouTubeChannelAdmin(channelInput?: string): Promise<YouTubeFeedResponse> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  if (!token) {
    throw new Error('Administrator authentication required to sync YouTube channel.');
  }

  // Save configured channelInput to public settings if provided
  if (channelInput !== undefined) {
    await updatePublicSettings({ youtubeChannelId: channelInput.trim() });
  }

  // Preserve excludedVideoIds from existing cache doc
  let excludedIds: string[] = [];
  try {
    const existingSnap = await getDoc(doc(db, YOUTUBE_CACHE_COLLECTION, YOUTUBE_CACHE_DOC));
    if (existingSnap.exists()) {
      const exData = existingSnap.data() as any;
      if (Array.isArray(exData?.excludedVideoIds)) {
        excludedIds = exData.excludedVideoIds.filter((v: any) => typeof v === 'string');
      }
    }
  } catch {
    // Non-fatal
  }
  const excludedSet = new Set(excludedIds);

  const res = await fetch('/api/admin/media/sync-youtube', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ channelInput: channelInput?.trim() || '' })
  });

  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'Failed to sync YouTube channel');
  }

  const filteredVideos: YouTubeFeedVideo[] = Array.isArray(data.videos)
    ? data.videos.filter((v: any) => v?.videoId && !excludedSet.has(v.videoId)).slice(0, 10)
    : [];

  // Ensure Firestore cache doc is persisted using authenticated admin session
  try {
    await setDoc(
      doc(db, YOUTUBE_CACHE_COLLECTION, YOUTUBE_CACHE_DOC),
      {
        channelId: data.channelId || '',
        channelTitle: data.channelTitle || 'MKR Academy',
        videos: filteredVideos,
        excludedVideoIds: excludedIds,
        source: data.source || 'youtube_sync',
        syncedAt: data.syncedAt || new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not persist YouTube cache doc as admin:', err);
  }

  logAdminActivity({
    action: 'YOUTUBE_FEED_SYNC',
    targetId: data.channelId || 'youtube',
    targetType: 'media',
    details: {
      channelTitle: data.channelTitle,
      videoCount: filteredVideos.length,
      source: data.source
    }
  }).catch(() => {});

  return {
    ...(data as YouTubeFeedResponse),
    videos: filteredVideos,
    excludedVideoIds: excludedIds
  };
}

/**
 * Combine Admin-managed Google Drive/manual slides with latest auto-fetched YouTube videos.
 * - Never displays inactive items (and ensures inactive manual YouTube overrides also suppress the auto-feed duplicate).
 * - Filters out any excluded auto-YouTube video IDs.
 * - Deduplicates YouTube videos by videoId cleanly.
 * - Prioritizes newest YouTube uploads while letting Admin position manual entries cleanly
 *   at their displayOrder slot (e.g., pos 2 -> Slide 2, pos 4 -> Slide 4).
 */
export function buildCarouselSlides(
  youtubeVideos: YouTubeFeedVideo[],
  adminMediaItems: HomepageMediaItem[],
  excludedVideoIds: string[] = []
): HomepageCarouselSlide[] {
  const seenVideoIds = new Set<string>(excludedVideoIds || []);
  const seenUrls = new Set<string>();

  // First register ALL admin-managed YouTube videoIds (active OR inactive) so disabled overrides stay hidden
  for (const item of adminMediaItems || []) {
    if (item && item.contentType === 'youtube') {
      const vid = (item.videoId || extractYouTubeVideoId(item.contentUrl)).trim();
      if (vid && item.isActive === false) {
        seenVideoIds.add(vid);
      }
    }
  }

  // 1. Only active admin items
  const activeAdmin = sortAdminMedia(
    (adminMediaItems || []).filter((item) => item && item.isActive === true)
  );

  const adminSlides: HomepageCarouselSlide[] = [];

  for (const item of activeAdmin) {
    const vid =
      item.contentType === 'youtube'
        ? (item.videoId || extractYouTubeVideoId(item.contentUrl)).trim()
        : '';
    const normUrl = (item.contentUrl || '').trim();

    if (vid) {
      if (seenVideoIds.has(vid)) continue;
      seenVideoIds.add(vid);
    } else if (normUrl) {
      if (seenUrls.has(normUrl)) continue;
      seenUrls.add(normUrl);
    }

    adminSlides.push({
      id: item.id,
      title: item.title,
      contentType: item.contentType,
      contentUrl: item.contentUrl,
      videoId: vid || item.videoId || '',
      thumbnailUrl: resolveThumbnailUrl(item.contentType, item.contentUrl, item.thumbnailUrl),
      publishedAt: item.publishedAt || item.createdAt,
      displayOrder: Math.max(1, Number(item.displayOrder) || 1),
      source: 'manual_admin',
      driveKind:
        item.contentType === 'google_drive'
          ? detectDriveContentKind(item.title, item.contentUrl)
          : undefined
    });
  }

  // 2. Prepare newest-first deduplicated auto-fetched YouTube slides (up to 10)
  const autoYoutubeSlides: HomepageCarouselSlide[] = [];
  const sortedYt = [...(youtubeVideos || [])].sort(
    (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
  );

  for (const yt of sortedYt) {
    if (!yt?.videoId) continue;
    if (seenVideoIds.has(yt.videoId)) continue;
    seenVideoIds.add(yt.videoId);

    autoYoutubeSlides.push({
      id: `yt_auto_${yt.videoId}`,
      title: yt.title,
      contentType: 'youtube',
      contentUrl: yt.contentUrl || `https://www.youtube.com/watch?v=${yt.videoId}`,
      videoId: yt.videoId,
      thumbnailUrl: yt.thumbnailUrl || getYouTubeThumbnailUrl(yt.videoId),
      publishedAt: yt.publishedAt,
      displayOrder: 0,
      source: 'auto_youtube'
    });

    if (autoYoutubeSlides.length >= 10) break;
  }

  if (adminSlides.length === 0) return autoYoutubeSlides;
  if (autoYoutubeSlides.length === 0) return adminSlides;

  // 3. Interleave cleanly: place each active admin slide at its 1-based displayOrder position
  // while filling all other slots chronologically with newest YouTube uploads!
  const result: HomepageCarouselSlide[] = [];
  const remainingAdmin = [...adminSlides];
  let ytIdx = 0;

  const totalCount = autoYoutubeSlides.length + adminSlides.length;
  for (let slot = 1; slot <= totalCount; slot++) {
    const adminMatchIdx = remainingAdmin.findIndex((a) => a.displayOrder <= slot);
    if (adminMatchIdx !== -1) {
      result.push(remainingAdmin.splice(adminMatchIdx, 1)[0]);
    } else if (ytIdx < autoYoutubeSlides.length) {
      result.push(autoYoutubeSlides[ytIdx++]);
    } else if (remainingAdmin.length > 0) {
      result.push(remainingAdmin.shift()!);
    }
  }

  return result;
}
