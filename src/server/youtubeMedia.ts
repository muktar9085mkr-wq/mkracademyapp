/**
 * MKR Academy - Secure Server-Side YouTube Channel Fetcher & Cache
 * Fetches the latest 10 uploads from the configured MKR Academy YouTube channel.
 * Supports YouTube Data API v3 (via server-side YOUTUBE_API_KEY) with resilient
 * automatic channel RSS fallback and Firestore + memory caching.
 * Never exposes private API keys to the client.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ServerYouTubeVideo {
  videoId: string;
  title: string;
  contentUrl: string;
  thumbnailUrl: string;
  publishedAt: string;
}

export interface YouTubeFeedPayload {
  videos: ServerYouTubeVideo[];
  channelId: string;
  channelInput: string;
  channelTitle: string;
  source:
    | 'youtube_api_v3'
    | 'youtube_rss_feed'
    | 'youtube_channel_feed'
    | 'firestore_cache'
    | 'memory_cache'
    | 'empty';
  hasApiKey: boolean;
  cached: boolean;
  syncedAt: string;
  error?: string;
}

const DEFAULT_CHANNEL_FALLBACK = 'https://youtube.com/@mkracademy01';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache to prevent YouTube quota burn
const FETCH_TIMEOUT_MS = 7000;

let memoryCache: {
  key: string;
  payload: YouTubeFeedPayload;
  expiresAt: number;
} | null = null;

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseChannelInput(raw: string): { channelId?: string; handle?: string; original: string } {
  const cleaned = (raw || '').trim();
  if (!cleaned) {
    return { handle: 'mkracademy01', original: DEFAULT_CHANNEL_FALLBACK };
  }

  // Raw Channel ID: UCxxxxxxxxxxxxxxxxxxxxxx (24 chars)
  const directUcMatch = cleaned.match(/^(UC[a-zA-Z0-9_-]{22})$/);
  if (directUcMatch) {
    return { channelId: directUcMatch[1], original: cleaned };
  }

  // URL containing /channel/UC...
  const urlUcMatch = cleaned.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
  if (urlUcMatch) {
    return { channelId: urlUcMatch[1], original: cleaned };
  }

  // Handle format: @mkracademy01 or https://youtube.com/@mkracademy01
  const urlHandleMatch = cleaned.match(/youtube\.com\/@([a-zA-Z0-9._-]+)/i);
  if (urlHandleMatch) {
    return { handle: urlHandleMatch[1], original: cleaned };
  }

  if (cleaned.startsWith('@')) {
    return { handle: cleaned.slice(1).trim(), original: cleaned };
  }

  // Plain handle without @
  if (/^[a-zA-Z0-9._-]{3,50}$/.test(cleaned)) {
    return { handle: cleaned, original: cleaned };
  }

  return { handle: 'mkracademy01', original: cleaned };
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

function parseRelativeTimeToIso(rawText: string, indexOffset = 0): string {
  const nowMs = Date.now();
  const text = (rawText || '').toLowerCase().trim();
  const match = text.match(/(\d+)\s*(sec|second|min|minute|hr|hour|day|wk|week|mo|month|yr|year)/);
  if (match) {
    const val = Math.max(0, Number(match[1]) || 0);
    const unit = match[2];
    let deltaMs = 0;
    if (unit.startsWith('sec')) deltaMs = val * 1000;
    else if (unit.startsWith('min')) deltaMs = val * 60 * 1000;
    else if (unit.startsWith('h')) deltaMs = val * 3600 * 1000;
    else if (unit.startsWith('day')) deltaMs = val * 24 * 3600 * 1000;
    else if (unit.startsWith('w')) deltaMs = val * 7 * 24 * 3600 * 1000;
    else if (unit.startsWith('mo')) deltaMs = val * 30 * 24 * 3600 * 1000;
    else if (unit.startsWith('y')) deltaMs = val * 365 * 24 * 3600 * 1000;
    return new Date(nowMs - deltaMs - indexOffset * 1000).toISOString();
  }
  return new Date(nowMs - indexOffset * 1000).toISOString();
}

function extractYtInitialData(html: string): any | null {
  const match = html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

async function fetchViaYouTubeChannelPages(
  channelId: string
): Promise<{ videos: ServerYouTubeVideo[]; channelId: string; channelTitle: string }> {
  const seen = new Set<string>();
  const videos: ServerYouTubeVideo[] = [];
  let channelTitle = 'MKR Academy';

  // 1. Fetch main /videos tab (contains full-length uploads in newest-first order)
  const videosPageUrl = `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/videos`;
  const videosRes = await fetchWithTimeout(videosPageUrl, {
    headers: { 'Accept-Language': 'en-US,en;q=0.9' }
  });
  if (!videosRes.ok) {
    throw new Error(`YouTube channel videos page unavailable (HTTP ${videosRes.status})`);
  }

  const videosHtml = await videosRes.text();
  const videosData = extractYtInitialData(videosHtml);
  channelTitle =
    videosData?.metadata?.channelMetadataRenderer?.title ||
    videosData?.header?.pageHeaderRenderer?.pageTitle ||
    channelTitle;

  const tabs: any[] = videosData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const selectedTab = tabs.find((tb) => tb?.tabRenderer?.selected) || tabs[1] || tabs[0];
  const gridItems: any[] = selectedTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

  for (let i = 0; i < gridItems.length; i++) {
    const content = gridItems[i]?.richItemRenderer?.content;
    if (!content) continue;

    // Modern lockupViewModel structure
    const lvm = content.lockupViewModel;
    if (lvm?.contentId) {
      const videoId = String(lvm.contentId).trim();
      if (!videoId || seen.has(videoId)) continue;
      seen.add(videoId);

      const metaVm = lvm.metadata?.lockupMetadataViewModel;
      const title = decodeXmlEntities(String(metaVm?.title?.content || 'MKR Academy Video'));
      const metaRows: any[] = metaVm?.metadata?.contentMetadataViewModel?.metadataRows || [];
      let timeText = '';
      for (const row of metaRows) {
        for (const part of row?.metadataParts || []) {
          const candidate = part?.accessibilityLabel || part?.text?.content || '';
          if (/\bago\b/i.test(candidate)) {
            timeText = candidate;
          }
        }
      }

      videos.push({
        videoId,
        title,
        contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: parseRelativeTimeToIso(timeText, videos.length)
      });
      if (videos.length >= 10) break;
      continue;
    }

    // Legacy videoRenderer fallback
    const vr = content.videoRenderer;
    if (vr?.videoId) {
      const videoId = String(vr.videoId).trim();
      if (!videoId || seen.has(videoId)) continue;
      seen.add(videoId);

      const title = decodeXmlEntities(
        String(vr.title?.runs?.[0]?.text || vr.title?.simpleText || 'MKR Academy Video')
      );
      const timeText = String(vr.publishedTimeText?.simpleText || '');

      videos.push({
        videoId,
        title,
        contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: parseRelativeTimeToIso(timeText, videos.length)
      });
      if (videos.length >= 10) break;
    }
  }

  // 2. If fewer than 10 videos on /videos tab, top up from /shorts tab cleanly
  if (videos.length < 10) {
    try {
      const shortsRes = await fetchWithTimeout(
        `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/shorts`,
        { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
      );
      if (shortsRes.ok) {
        const shortsHtml = await shortsRes.text();
        const shortsData = extractYtInitialData(shortsHtml);
        const sTabs: any[] = shortsData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        const sSelected = sTabs.find((tb) => tb?.tabRenderer?.selected);
        const sItems: any[] = sSelected?.tabRenderer?.content?.richGridRenderer?.contents || [];

        for (const item of sItems) {
          const slvm = item?.richItemRenderer?.content?.shortsLockupViewModel;
          const videoId = slvm?.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
          if (!videoId || seen.has(videoId)) continue;
          seen.add(videoId);

          const rawAccess = String(slvm?.accessibilityText || 'MKR Academy Short');
          const cleanTitle = decodeXmlEntities(
            rawAccess.replace(/,\s*[\d,.KMB]+\s+views?\s*-\s*play Short$/i, '').trim()
          );

          videos.push({
            videoId,
            title: cleanTitle || 'MKR Academy Video',
            contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            publishedAt: new Date(Date.now() - videos.length * 1000).toISOString()
          });
          if (videos.length >= 10) break;
        }
      }
    } catch {
      // Optional /shorts supplement is non-fatal
    }
  }

  if (videos.length === 0) {
    throw new Error('No public videos found on YouTube channel page');
  }

  return {
    videos: videos.slice(0, 10),
    channelId,
    channelTitle
  };
}

/**
 * Resolve configured channel from override -> env var -> Firestore appSettings/public
 */
async function resolveConfiguredChannelInput(explicitOverride?: string): Promise<string> {
  if (explicitOverride && explicitOverride.trim()) {
    return explicitOverride.trim();
  }

  if (process.env.YOUTUBE_CHANNEL_ID && process.env.YOUTUBE_CHANNEL_ID.trim()) {
    return process.env.YOUTUBE_CHANNEL_ID.trim();
  }

  try {
    const publicSettingsSnap = await getDoc(doc(db, 'appSettings', 'public'));
    if (publicSettingsSnap.exists()) {
      const data = publicSettingsSnap.data() as any;
      if (data?.youtubeChannelId && String(data.youtubeChannelId).trim()) {
        return String(data.youtubeChannelId).trim();
      }
      if (data?.social?.youtube && String(data.social.youtube).trim()) {
        return String(data.social.youtube).trim();
      }
    }
  } catch {
    // Non-fatal: use default
  }

  return DEFAULT_CHANNEL_FALLBACK;
}

/**
 * Primary method: Official YouTube Data API v3 (when YOUTUBE_API_KEY is configured server-side)
 */
async function fetchViaYouTubeDataApiV3(
  channelInput: string,
  apiKey: string
): Promise<{ videos: ServerYouTubeVideo[]; channelId: string; channelTitle: string }> {
  const parsed = parseChannelInput(channelInput);
  let channelId = parsed.channelId || '';
  let uploadsPlaylistId = channelId ? `UU${channelId.slice(2)}` : '';
  let channelTitle = 'MKR Academy';

  // Resolve handle or verify channel details
  const channelQueryParam = parsed.channelId
    ? `id=${encodeURIComponent(parsed.channelId)}`
    : `forHandle=${encodeURIComponent(parsed.handle || 'mkracademy01')}`;

  const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&${channelQueryParam}&key=${encodeURIComponent(apiKey)}`;
  const chRes = await fetchWithTimeout(chUrl);
  if (!chRes.ok) {
    const errJson = await chRes.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `YouTube channels API error (${chRes.status})`);
  }

  const chData = await chRes.json();
  const channelItem = chData?.items?.[0];
  if (!channelItem) {
    throw new Error('YouTube channel not found for configured ID/handle');
  }

  channelId = channelItem.id || channelId;
  uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads || `UU${channelId.slice(2)}`;
  channelTitle = channelItem.snippet?.title || 'MKR Academy';

  // Fetch latest 10 uploads from the channel's uploads playlist
  const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
    uploadsPlaylistId
  )}&maxResults=10&key=${encodeURIComponent(apiKey)}`;
  const plRes = await fetchWithTimeout(plUrl);
  if (!plRes.ok) {
    const errJson = await plRes.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `YouTube playlistItems API error (${plRes.status})`);
  }

  const plData = await plRes.json();
  const rawItems: any[] = Array.isArray(plData?.items) ? plData.items : [];
  const seen = new Set<string>();
  const videos: ServerYouTubeVideo[] = [];

  for (const item of rawItems) {
    const videoId =
      item?.contentDetails?.videoId ||
      item?.snippet?.resourceId?.videoId ||
      '';
    if (!videoId || seen.has(videoId)) continue;
    seen.add(videoId);

    const title = (item?.snippet?.title || 'MKR Academy Video').trim();
    if (title === 'Deleted video' || title === 'Private video') continue;

    const publishedAt =
      item?.contentDetails?.videoPublishedAt ||
      item?.snippet?.publishedAt ||
      new Date().toISOString();

    const thumbs = item?.snippet?.thumbnails || {};
    const thumbnailUrl =
      thumbs.high?.url ||
      thumbs.medium?.url ||
      thumbs.standard?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    videos.push({
      videoId,
      title,
      contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl,
      publishedAt
    });
  }

  videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return {
    videos: videos.slice(0, 10),
    channelId,
    channelTitle
  };
}

/**
 * Fallback method: Official public YouTube channel Atom/RSS feed with resilient channel page fallback
 * Resolves handle -> UC channel ID once if needed, tries RSS first, and seamlessly uses /videos & /shorts
 * ytInitialData if YouTube's RSS endpoint returns HTTP 404 or times out.
 */
async function fetchViaYouTubeRssFeed(channelInput: string): Promise<{
  videos: ServerYouTubeVideo[];
  channelId: string;
  channelTitle: string;
  source: 'youtube_rss_feed' | 'youtube_channel_feed';
}> {
  const parsed = parseChannelInput(channelInput);
  let channelId = parsed.channelId || '';

  if (!channelId) {
    const handle = parsed.handle || 'mkracademy01';
    const pageUrl = `https://www.youtube.com/@${encodeURIComponent(handle)}`;
    const pageRes = await fetchWithTimeout(pageUrl, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (!pageRes.ok) {
      throw new Error(`Could not resolve YouTube handle @${handle} (HTTP ${pageRes.status})`);
    }
    const html = await pageRes.text();
    const idMatch =
      html.match(/"externalId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/) ||
      html.match(/<meta\s+itemprop="identifier"\s+content="(UC[a-zA-Z0-9_-]{22})"/i) ||
      html.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i);

    if (!idMatch) {
      throw new Error(`Could not extract Channel ID from YouTube handle @${handle}`);
    }
    channelId = idMatch[1];
  }

  // 1. Try YouTube Atom/RSS feed first
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const rssRes = await fetchWithTimeout(rssUrl);
    if (rssRes.ok) {
      const xml = await rssRes.text();
      const feedTitleMatch = xml.match(/<feed[^>]*>[\s\S]*?<title>([\s\S]*?)<\/title>/i);
      const channelTitle = feedTitleMatch ? decodeXmlEntities(feedTitleMatch[1]) : 'MKR Academy';

      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
      const seen = new Set<string>();
      const videos: ServerYouTubeVideo[] = [];
      let match: RegExpExecArray | null;

      while ((match = entryRegex.exec(xml)) !== null) {
        const block = match[1];
        const vidMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i);
        const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
        const pubMatch = block.match(/<published>([^<]+)<\/published>/i);

        const videoId = vidMatch?.[1]?.trim();
        if (!videoId || seen.has(videoId)) continue;
        seen.add(videoId);

        const title = titleMatch ? decodeXmlEntities(titleMatch[1]) : 'MKR Academy Video';
        const publishedAt = pubMatch?.[1]?.trim() || new Date().toISOString();

        videos.push({
          videoId,
          title,
          contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt
        });
      }

      if (videos.length > 0) {
        videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        return {
          videos: videos.slice(0, 10),
          channelId,
          channelTitle,
          source: 'youtube_rss_feed'
        };
      }
    }
  } catch {
    // Fall through cleanly to public channel page parser
  }

  // 2. Seamless channel page fallback when YouTube RSS returns HTTP 404 / is unavailable
  const pageResult = await fetchViaYouTubeChannelPages(channelId);
  return {
    ...pageResult,
    source: 'youtube_channel_feed'
  };
}

/**
 * Read persisted Firestore cache & exclusion list if available
 */
async function readFirestoreYouTubeCache(): Promise<(YouTubeFeedPayload & { excludedVideoIds: string[] }) | null> {
  try {
    const snap = await getDoc(doc(db, 'youtube_feed_cache', 'latest'));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    const excludedVideoIds: string[] = Array.isArray(data?.excludedVideoIds)
      ? data.excludedVideoIds.filter((v: any) => typeof v === 'string')
      : [];
    const excludedSet = new Set(excludedVideoIds);
    const videos: ServerYouTubeVideo[] = Array.isArray(data?.videos)
      ? data.videos.filter((v: any) => v?.videoId && !excludedSet.has(v.videoId)).slice(0, 10)
      : [];

    return {
      videos,
      excludedVideoIds,
      channelId: data.channelId || '',
      channelInput: data.channelId || DEFAULT_CHANNEL_FALLBACK,
      channelTitle: data.channelTitle || 'MKR Academy',
      source: 'firestore_cache',
      hasApiKey: Boolean(process.env.YOUTUBE_API_KEY),
      cached: true,
      syncedAt: data.syncedAt || new Date().toISOString()
    };
  } catch {
    return null;
  }
}

async function getExcludedVideoIds(): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, 'youtube_feed_cache', 'latest'));
    if (!snap.exists()) return [];
    const data = snap.data() as any;
    return Array.isArray(data?.excludedVideoIds)
      ? data.excludedVideoIds.filter((v: any) => typeof v === 'string')
      : [];
  } catch {
    return [];
  }
}

/**
 * Main entry point used by /api/media/youtube and /api/admin/media/sync-youtube
 */
export async function getLatestYouTubeFeed(options?: {
  forceRefresh?: boolean;
  channelInput?: string;
}): Promise<YouTubeFeedPayload> {
  const forceRefresh = Boolean(options?.forceRefresh);
  const channelInput = await resolveConfiguredChannelInput(options?.channelInput);
  const apiKey = (process.env.YOUTUBE_API_KEY || '').trim();
  const hasApiKey = Boolean(apiKey);
  const now = Date.now();
  const excludedIds = await getExcludedVideoIds();
  const excludedSet = new Set(excludedIds);

  // 1. Return warm server memory cache if fresh and matches channel
  if (!forceRefresh && memoryCache && memoryCache.key === channelInput && memoryCache.expiresAt > now) {
    return {
      ...memoryCache.payload,
      videos: memoryCache.payload.videos.filter((v) => !excludedSet.has(v.videoId)),
      cached: true
    };
  }

  // 2. Check Firestore cache when cold-booted (unless forceRefresh) to reduce unnecessary API requests
  if (!forceRefresh) {
    const fsCache = await readFirestoreYouTubeCache();
    if (fsCache && fsCache.videos.length > 0) {
      const syncedMs = new Date(fsCache.syncedAt).getTime();
      const cacheMatchesInput =
        !options?.channelInput &&
        (!channelInput.startsWith('UC') || fsCache.channelId === channelInput);

      if (cacheMatchesInput && Number.isFinite(syncedMs) && now - syncedMs < CACHE_TTL_MS) {
        memoryCache = {
          key: channelInput,
          payload: fsCache,
          expiresAt: now + CACHE_TTL_MS
        };
        return fsCache;
      }
    }
  }

  let liveError: string | undefined;

  // 3. Try YouTube Data API v3 if key configured
  if (apiKey) {
    try {
      const apiResult = await fetchViaYouTubeDataApiV3(channelInput, apiKey);
      const filteredVideos = apiResult.videos.filter((v) => !excludedSet.has(v.videoId));
      const payload: YouTubeFeedPayload = {
        videos: filteredVideos,
        channelId: apiResult.channelId,
        channelInput,
        channelTitle: apiResult.channelTitle,
        source: 'youtube_api_v3',
        hasApiKey: true,
        cached: false,
        syncedAt: new Date().toISOString()
      };
      memoryCache = { key: channelInput, payload, expiresAt: now + CACHE_TTL_MS };

      // Best-effort Firestore cache persistence (preserving excludedVideoIds)
      setDoc(
        doc(db, 'youtube_feed_cache', 'latest'),
        {
          channelId: apiResult.channelId,
          channelTitle: apiResult.channelTitle,
          videos: filteredVideos,
          excludedVideoIds: excludedIds,
          source: 'youtube_api_v3',
          syncedAt: payload.syncedAt
        },
        { merge: true }
      ).catch(() => {});

      return payload;
    } catch (err: any) {
      liveError = err?.message || 'YouTube API v3 fetch failed';
      console.warn('[YouTube Sync] Data API v3 failed, attempting RSS fallback:', liveError);
    }
  }

  // 4. Automatic RSS + Channel Page fallback (works reliably without API keys even if RSS returns HTTP 404)
  try {
    const rssResult = await fetchViaYouTubeRssFeed(channelInput);
    const filteredVideos = rssResult.videos.filter((v) => !excludedSet.has(v.videoId));
    const payload: YouTubeFeedPayload = {
      videos: filteredVideos,
      channelId: rssResult.channelId,
      channelInput,
      channelTitle: rssResult.channelTitle,
      source: rssResult.source,
      hasApiKey,
      cached: false,
      syncedAt: new Date().toISOString()
    };
    memoryCache = { key: channelInput, payload, expiresAt: now + CACHE_TTL_MS };

    // Best-effort Firestore cache persistence (preserving excludedVideoIds)
    setDoc(
      doc(db, 'youtube_feed_cache', 'latest'),
      {
        channelId: rssResult.channelId,
        channelTitle: rssResult.channelTitle,
        videos: filteredVideos,
        excludedVideoIds: excludedIds,
        source: rssResult.source,
        syncedAt: payload.syncedAt
      },
      { merge: true }
    ).catch(() => {});

    return payload;
  } catch (rssErr: any) {
    liveError = liveError || rssErr?.message || 'YouTube feed unreachable';
    console.warn('[YouTube Sync] Live RSS/channel fetch failed:', liveError);
  }

  // 5. Fallback to stale memory or Firestore cache so mobile carousel never goes blank
  if (memoryCache && memoryCache.payload.videos.length > 0) {
    return {
      ...memoryCache.payload,
      source: 'memory_cache',
      cached: true,
      error: liveError
    };
  }

  const staleFsCache = await readFirestoreYouTubeCache();
  if (staleFsCache) {
    return {
      ...staleFsCache,
      error: liveError
    };
  }

  return {
    videos: [],
    channelId: parseChannelInput(channelInput).channelId || '',
    channelInput,
    channelTitle: 'MKR Academy',
    source: 'empty',
    hasApiKey,
    cached: false,
    syncedAt: new Date().toISOString(),
    error: liveError
  };
}
