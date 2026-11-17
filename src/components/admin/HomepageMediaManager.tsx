import React, { useState, useEffect, useMemo } from 'react';
import {
  Youtube,
  HardDrive,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Play,
  FileText,
  Film,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Clapperboard,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import {
  HomepageMediaItem,
  HomepageMediaContentType,
  YouTubeFeedVideo,
  HomepageCarouselSlide
} from '../../types';
import {
  subscribeToAllHomepageMediaAdmin,
  subscribeToYoutubeFeedCache,
  createHomepageMedia,
  updateHomepageMedia,
  deleteHomepageMedia,
  toggleHomepageMediaActive,
  updateHomepageMediaPosition,
  fetchLatestYouTubeFeed,
  syncYouTubeChannelAdmin,
  excludeAutoYouTubeVideo,
  restoreAutoYouTubeVideo,
  resolveThumbnailUrl,
  validateAndFormatMediaOpenUrl,
  extractYouTubeVideoId,
  buildCarouselSlides,
  detectDriveContentKind
} from '../../services/mediaService';
import { getPublicSettings } from '../../services/settingsService';

type DeleteTarget =
  | { kind: 'manual'; item: HomepageMediaItem }
  | { kind: 'auto_youtube'; videoId: string; title: string };

export const HomepageMediaManager: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<HomepageMediaItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // YouTube auto-sync state
  const [channelInput, setChannelInput] = useState('https://youtube.com/@mkracademy01');
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeFeedVideo[]>([]);
  const [excludedVideoIds, setExcludedVideoIds] = useState<string[]>([]);
  const [youtubeMeta, setYoutubeMeta] = useState<{
    channelId: string;
    channelTitle: string;
    source: string;
    hasApiKey: boolean;
    syncedAt: string;
  }>({
    channelId: '',
    channelTitle: 'MKR Academy',
    source: '',
    hasApiKey: false,
    syncedAt: ''
  });
  const [syncingYoutube, setSyncingYoutube] = useState(false);
  const [restoringVideoId, setRestoringVideoId] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [showYoutubeVideos, setShowYoutubeVideos] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | HomepageMediaContentType>('all');

  // Add / Edit Media Modal State (STRICTLY ONLY THE 6 ALLOWED FIELDS — NO DESCRIPTION)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HomepageMediaItem | null>(null);
  const [contentType, setContentType] = useState<HomepageMediaContentType>('google_drive');
  const [contentTitle, setContentTitle] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(2);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [savingForm, setSavingForm] = useState(false);
  const [formNotice, setFormNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Preview & Delete Confirmation Modals
  const [previewSlide, setPreviewSlide] = useState<HomepageCarouselSlide | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // 1. Real-time listener on homepage_media collection
  useEffect(() => {
    const unsub = subscribeToAllHomepageMediaAdmin(
      (items) => {
        setMediaItems(items);
        setLoadingList(false);
      },
      () => {
        setLoadingList(false);
      }
    );
    return () => unsub();
  }, []);

  // 2. Load configured YouTube channel + cached feed + subscribe to Firestore YouTube cache updates
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [settings, ytFeed] = await Promise.all([
          getPublicSettings(),
          fetchLatestYouTubeFeed()
        ]);
        if (!mounted) return;
        const savedChannel =
          settings?.youtubeChannelId?.trim() ||
          settings?.social?.youtube?.trim() ||
          'https://youtube.com/@mkracademy01';
        setChannelInput(savedChannel);
        if (ytFeed) {
          setYoutubeVideos(ytFeed.videos || []);
          setExcludedVideoIds(ytFeed.excludedVideoIds || []);
          setYoutubeMeta({
            channelId: ytFeed.channelId || '',
            channelTitle: ytFeed.channelTitle || 'MKR Academy',
            source: ytFeed.source || '',
            hasApiKey: Boolean(ytFeed.hasApiKey),
            syncedAt: ytFeed.syncedAt || ''
          });
        }
      } catch {
        // Handled cleanly
      }
    })();

    const unsubYtCache = subscribeToYoutubeFeedCache((cache) => {
      if (!mounted) return;
      setYoutubeVideos(cache.videos);
      setExcludedVideoIds(cache.excludedVideoIds);
      setYoutubeMeta((prev) => ({
        ...prev,
        channelId: cache.channelId || prev.channelId,
        channelTitle: cache.channelTitle || prev.channelTitle,
        syncedAt: cache.syncedAt || prev.syncedAt
      }));
    });

    return () => {
      mounted = false;
      unsubYtCache();
    };
  }, []);

  // Live merged preview matching student mobile homepage
  const combinedPreviewSlides = useMemo(
    () => buildCarouselSlides(youtubeVideos, mediaItems, excludedVideoIds),
    [youtubeVideos, mediaItems, excludedVideoIds]
  );

  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      if (typeFilter !== 'all' && item.contentType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.contentUrl.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mediaItems, typeFilter, searchQuery]);

  const activeDriveCount = mediaItems.filter(
    (m) => m.isActive && m.contentType === 'google_drive'
  ).length;
  const activeManualCount = mediaItems.filter((m) => m.isActive).length;

  const handleSyncYoutubeNow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSyncingYoutube(true);
    setSyncNotice(null);
    try {
      const res = await syncYouTubeChannelAdmin(channelInput);
      setYoutubeVideos(res.videos || []);
      setExcludedVideoIds(res.excludedVideoIds || []);
      setYoutubeMeta({
        channelId: res.channelId || '',
        channelTitle: res.channelTitle || 'MKR Academy',
        source: res.source || '',
        hasApiKey: Boolean(res.hasApiKey),
        syncedAt: res.syncedAt || new Date().toISOString()
      });
      setSyncNotice({
        type: 'success',
        text: `Synced ${res.videos?.length || 0} latest upload(s) from ${res.channelTitle || 'MKR Academy'}.`
      });
    } catch (err: any) {
      setSyncNotice({
        type: 'error',
        text: err?.message || 'Could not sync YouTube channel right now.'
      });
    } finally {
      setSyncingYoutube(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setContentType('google_drive');
    setContentTitle('');
    setContentUrl('');
    setThumbnailUrl('');
    setDisplayOrder(mediaItems.length === 0 ? 2 : mediaItems.length + 2);
    setIsActive(true);
    setFormNotice(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: HomepageMediaItem) => {
    setEditingItem(item);
    setContentType(item.contentType);
    setContentTitle(item.title);
    setContentUrl(item.contentUrl);
    setThumbnailUrl(item.thumbnailUrl || '');
    setDisplayOrder(Number(item.displayOrder) || 1);
    setIsActive(Boolean(item.isActive));
    setFormNotice(null);
    setFormModalOpen(true);
  };

  /**
   * Edit an auto-fetched YouTube video cleanly:
   * - If an override already exists in homepage_media with the same videoId, edit it.
   * - Otherwise prefill the 6-field modal so saving creates a managed override entry without duplicating.
   */
  const openEditForAutoYouTube = (yt: YouTubeFeedVideo, preferredOrder = 1) => {
    const vid = (yt.videoId || extractYouTubeVideoId(yt.contentUrl)).trim();
    const existingOverride = mediaItems.find(
      (m) =>
        m.contentType === 'youtube' &&
        (m.videoId === vid || extractYouTubeVideoId(m.contentUrl) === vid)
    );
    if (existingOverride) {
      openEditModal(existingOverride);
      return;
    }

    setEditingItem(null);
    setContentType('youtube');
    setContentTitle(yt.title);
    setContentUrl(yt.contentUrl || `https://www.youtube.com/watch?v=${vid}`);
    setThumbnailUrl(yt.thumbnailUrl || '');
    setDisplayOrder(Math.max(1, preferredOrder));
    setIsActive(true);
    setFormNotice(null);
    setFormModalOpen(true);
  };

  const openEditFromSlide = (slide: HomepageCarouselSlide, slideIndex: number) => {
    if (slide.source === 'manual_admin') {
      const found = mediaItems.find((m) => m.id === slide.id);
      if (found) {
        openEditModal(found);
        return;
      }
    }
    const vid = (slide.videoId || extractYouTubeVideoId(slide.contentUrl)).trim();
    openEditForAutoYouTube(
      {
        videoId: vid,
        title: slide.title,
        contentUrl: slide.contentUrl,
        thumbnailUrl: slide.thumbnailUrl,
        publishedAt: slide.publishedAt || ''
      },
      slideIndex + 1
    );
  };

  const openDeleteFromSlide = (slide: HomepageCarouselSlide) => {
    if (slide.source === 'manual_admin') {
      const found = mediaItems.find((m) => m.id === slide.id);
      if (found) {
        setDeleteTarget({ kind: 'manual', item: found });
        return;
      }
    }
    const vid = (slide.videoId || extractYouTubeVideoId(slide.contentUrl)).trim();
    if (vid) {
      setDeleteTarget({ kind: 'auto_youtube', videoId: vid, title: slide.title });
    }
  };

  const handleRestoreYoutubeVideo = async (videoId: string) => {
    setRestoringVideoId(videoId);
    setActionBanner(null);
    try {
      await restoreAutoYouTubeVideo(videoId);
      const res = await syncYouTubeChannelAdmin(channelInput);
      setYoutubeVideos(res.videos || []);
      setExcludedVideoIds(res.excludedVideoIds || []);
      setActionBanner({
        type: 'success',
        text: `Restored YouTube video (${videoId}) back to the Homepage Carousel.`
      });
    } catch (err: any) {
      setActionBanner({
        type: 'error',
        text: err?.message || 'Could not restore YouTube video right now.'
      });
    } finally {
      setRestoringVideoId(null);
    }
  };

  const handleSaveMediaForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormNotice(null);

    if (!contentTitle.trim()) {
      setFormNotice({ type: 'error', text: 'Content Title is required.' });
      return;
    }

    const urlCheck = validateAndFormatMediaOpenUrl(contentType, contentUrl);
    if (!urlCheck.valid) {
      setFormNotice({
        type: 'error',
        text: urlCheck.reason || 'Please enter a valid YouTube or Google Drive URL.'
      });
      return;
    }

    setSavingForm(true);
    try {
      if (editingItem) {
        await updateHomepageMedia(editingItem.id, {
          title: contentTitle.trim(),
          contentType,
          contentUrl: contentUrl.trim(),
          thumbnailUrl: thumbnailUrl.trim(),
          displayOrder: Math.max(0, Math.floor(Number(displayOrder) || 0)),
          isActive
        });
        setActionBanner({ type: 'success', text: `Updated "${contentTitle.trim()}" successfully.` });
      } else {
        await createHomepageMedia({
          title: contentTitle.trim(),
          contentType,
          contentUrl: contentUrl.trim(),
          thumbnailUrl: thumbnailUrl.trim(),
          displayOrder: Math.max(0, Math.floor(Number(displayOrder) || 1)),
          isActive
        });
        setActionBanner({
          type: 'success',
          text: `Saved "${contentTitle.trim()}" to Homepage Media Carousel.`
        });
      }
      setFormModalOpen(false);
    } catch (err: any) {
      setFormNotice({
        type: 'error',
        text: err?.message || 'Failed to save media item.'
      });
    } finally {
      setSavingForm(false);
    }
  };

  const handleToggleStatus = async (item: HomepageMediaItem) => {
    try {
      await toggleHomepageMediaActive(item.id, !item.isActive);
      setActionBanner({
        type: 'success',
        text: `"${item.title}" is now ${!item.isActive ? 'Active' : 'Inactive'}.`
      });
    } catch (err: any) {
      setActionBanner({ type: 'error', text: err?.message || 'Failed to toggle status.' });
    }
  };

  const handleStepPosition = async (item: HomepageMediaItem, delta: number) => {
    const nextOrder = Math.max(1, (Number(item.displayOrder) || 1) + delta);
    try {
      await updateHomepageMediaPosition(item.id, nextOrder);
    } catch (err: any) {
      setActionBanner({ type: 'error', text: err?.message || 'Failed to update position.' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'manual') {
      setDeletingId(deleteTarget.item.id);
      try {
        await deleteHomepageMedia(deleteTarget.item.id);
        if (previewSlide?.id === deleteTarget.item.id) {
          setPreviewSlide(null);
        }
        setActionBanner({
          type: 'success',
          text: `Deleted "${deleteTarget.item.title}" permanently.`
        });
        setDeleteTarget(null);
      } catch (err: any) {
        setActionBanner({ type: 'error', text: err?.message || 'Failed to delete media item.' });
      } finally {
        setDeletingId(null);
      }
    } else {
      setDeletingId(deleteTarget.videoId);
      try {
        await excludeAutoYouTubeVideo(deleteTarget.videoId);
        setYoutubeVideos((prev) => prev.filter((v) => v.videoId !== deleteTarget.videoId));
        setExcludedVideoIds((prev) => Array.from(new Set([...prev, deleteTarget.videoId])));
        if (previewSlide?.videoId === deleteTarget.videoId) {
          setPreviewSlide(null);
        }
        setActionBanner({
          type: 'success',
          text: `Removed "${deleteTarget.title}" from the Homepage Carousel.`
        });
        setDeleteTarget(null);
      } catch (err: any) {
        setActionBanner({
          type: 'error',
          text: err?.message || 'Failed to remove YouTube video.'
        });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const liveFormThumbnailPreview = resolveThumbnailUrl(contentType, contentUrl, thumbnailUrl);
  const liveFormYoutubeId = contentType === 'youtube' ? extractYouTubeVideoId(contentUrl) : '';
  const liveFormDriveKind =
    contentType === 'google_drive' ? detectDriveContentKind(contentTitle, contentUrl) : 'pdf';

  const renderDriveBadgeIcon = (kind: 'pdf' | 'video' | 'document' | 'file') => {
    if (kind === 'video') return <Film className="w-4 h-4" />;
    if (kind === 'document') return <BookOpen className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B0F17] to-[#B91C1C] text-white flex items-center justify-center shadow-xs">
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 leading-tight">
                Homepage Media Manager
              </h2>
              <p className="text-xs text-stone-500">
                Edit, reorder, or delete any YouTube upload &amp; Google Drive item shown in the mobile homepage 16:9 Media Carousel.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-extrabold flex items-center space-x-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Drive / Media Item</span>
        </button>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Total Carousel Slides
          </p>
          <p className="text-2xl font-black text-stone-900 mt-1 tabular-nums">
            {combinedPreviewSlides.length}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">Live on Mobile Homepage</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Auto YouTube Feed
          </p>
          <p className="text-2xl font-black text-[#B91C1C] mt-1 tabular-nums">
            {youtubeVideos.length}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">Latest channel uploads cached</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Active Drive Items
          </p>
          <p className="text-2xl font-black text-stone-900 mt-1 tabular-nums">
            {activeDriveCount}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">PDFs, Videos &amp; Docs enabled</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Manual Entries
          </p>
          <p className="text-2xl font-black text-stone-900 mt-1 tabular-nums">
            {activeManualCount} / {mediaItems.length}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">Active / Total created</p>
        </div>
      </div>

      {/* Action Status Feedback */}
      {actionBanner && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            actionBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-[#991B1B]'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B91C1C]" />
            )}
            <span>{actionBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: YouTube Channel Auto-Sync Control */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 text-[#B91C1C] flex items-center justify-center shrink-0">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
                Official YouTube Channel Auto-Sync (Latest 10 Uploads)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Automatically fetches &amp; caches the newest uploads from MKR Academy&apos;s YouTube channel. You can edit or remove individual videos below.
              </p>
            </div>
          </div>

          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
              youtubeMeta.hasApiKey
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-stone-100 text-stone-700 border-stone-200'
            }`}
          >
            {youtubeMeta.hasApiKey ? 'YouTube Data API v3 Active' : 'Official Channel Auto-Feed Active'}
          </span>
        </div>

        <form onSubmit={handleSyncYoutubeNow} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            placeholder="Channel ID (UC...) or Handle (https://youtube.com/@mkracademy01)"
            className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 font-mono focus:bg-white focus:outline-none focus:border-[#991B1B]"
          />
          <button
            type="submit"
            disabled={syncingYoutube}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer shrink-0"
          >
            {syncingYoutube ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{syncingYoutube ? 'Syncing...' : 'Sync Latest Videos'}</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Channel: <strong className="text-stone-800">{youtubeMeta.channelTitle}</strong>
            </span>
            {youtubeMeta.channelId && (
              <span>
                ID: <code className="font-mono text-stone-700">{youtubeMeta.channelId}</code>
              </span>
            )}
            {youtubeMeta.syncedAt && (
              <span>
                Last Synced:{' '}
                <strong className="text-stone-700">
                  {new Date(youtubeMeta.syncedAt).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata'
                  })}
                </strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowYoutubeVideos((v) => !v)}
            className="text-xs font-bold text-[#991B1B] hover:underline cursor-pointer"
          >
            {showYoutubeVideos
              ? `Hide Cached Uploads (${youtubeVideos.length})`
              : `Show Cached Uploads (${youtubeVideos.length})`}
          </button>
        </div>

        {syncNotice && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
              syncNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-[#991B1B]'
            }`}
          >
            {syncNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B91C1C]" />
            )}
            <span>{syncNotice.text}</span>
          </div>
        )}

        {showYoutubeVideos && youtubeVideos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-stone-100">
            {youtubeVideos.map((v, idx) => (
              <div
                key={v.videoId}
                className="flex flex-col justify-between p-2.5 rounded-2xl border border-stone-200 bg-stone-50/70 hover:border-red-200 transition-colors gap-2.5"
              >
                <div className="flex items-start space-x-2.5">
                  <a
                    href={v.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-24 aspect-video rounded-lg overflow-hidden bg-stone-900 shrink-0 relative block"
                  >
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tabular-nums">
                      #{idx + 1}
                    </span>
                  </a>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-900 line-clamp-2 leading-snug">
                      {v.title}
                    </p>
                    <p className="text-[10px] text-stone-500 mt-1">
                      {new Date(v.publishedAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-stone-200/70">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewSlide({
                        id: `yt_auto_${v.videoId}`,
                        title: v.title,
                        contentType: 'youtube',
                        contentUrl: v.contentUrl,
                        videoId: v.videoId,
                        thumbnailUrl: v.thumbnailUrl,
                        publishedAt: v.publishedAt,
                        displayOrder: idx + 1,
                        source: 'auto_youtube'
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-[11px] font-bold inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditForAutoYouTube(v, idx + 1)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-red-50 hover:border-red-200 text-stone-800 hover:text-[#991B1B] text-[11px] font-bold inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({
                        kind: 'auto_youtube',
                        videoId: v.videoId,
                        title: v.title
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-[#B91C1C] text-[11px] font-bold inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Removed Auto-YouTube Videos Bar with Restore */}
        {excludedVideoIds.length > 0 && (
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-stone-700 uppercase tracking-wider">
                Removed Auto-YouTube Videos ({excludedVideoIds.length})
              </span>
              <span className="text-[10px] text-stone-500">
                Click Restore to bring a deleted YouTube upload back
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {excludedVideoIds.map((vid) => (
                <div
                  key={vid}
                  className="inline-flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-[11px]"
                >
                  <code className="font-mono text-stone-700">{vid}</code>
                  <button
                    type="button"
                    onClick={() => handleRestoreYoutubeVideo(vid)}
                    disabled={restoringVideoId === vid}
                    className="inline-flex items-center space-x-1 font-bold text-[#991B1B] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {restoringVideoId === vid ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    <span>Restore</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Admin-Managed Media Entries (Google Drive + Custom Videos) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-stone-900">
              Google Drive &amp; Custom Media Entries
            </h3>
            <p className="text-xs text-stone-500">
              Control display position, toggle visibility, preview cards, or edit and delete entries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title or link..."
                className="w-full sm:w-48 pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200 text-xs font-bold">
              {(['all', 'google_drive', 'youtube'] as const).map((filterVal) => (
                <button
                  key={filterVal}
                  type="button"
                  onClick={() => setTypeFilter(filterVal)}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    typeFilter === filterVal
                      ? 'bg-white text-[#991B1B] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {filterVal === 'all'
                    ? 'All'
                    : filterVal === 'google_drive'
                    ? 'Google Drive'
                    : 'YouTube'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loadingList ? (
          <div className="p-10 text-center text-stone-500 flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#991B1B]" />
            <span className="text-xs font-semibold">Loading media entries...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-stone-300 rounded-2xl space-y-3">
            <HardDrive className="w-9 h-9 text-stone-300 mx-auto" />
            <div>
              <p className="text-sm font-bold text-stone-700">
                {mediaItems.length === 0
                  ? 'No Google Drive or Custom Media Added Yet'
                  : 'No Media Matches Your Filter'}
              </p>
              <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                Add Google Drive PDFs, video lectures, or custom featured videos to display alongside MKR Academy&apos;s latest YouTube uploads in the mobile homepage carousel.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Drive / Media Item</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Responsive Stacked Cards (No horizontal scrolling, clear Edit & Delete buttons) */}
            <div className="md:hidden space-y-3">
              {filteredItems.map((item) => {
                const thumb = resolveThumbnailUrl(
                  item.contentType,
                  item.contentUrl,
                  item.thumbnailUrl
                );
                const isYt = item.contentType === 'youtube';
                const driveKind = detectDriveContentKind(item.title, item.contentUrl);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-24 aspect-video rounded-xl overflow-hidden bg-stone-900 border border-stone-200 shrink-0 relative flex items-center justify-center text-white">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : isYt ? (
                          <Play className="w-4 h-4 fill-white" />
                        ) : (
                          renderDriveBadgeIcon(driveKind)
                        )}
                        <span className="absolute top-1 left-1 bg-black/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded tabular-nums">
                          #{item.displayOrder}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                              isYt
                                ? 'bg-red-50 text-[#B91C1C] border-red-200'
                                : 'bg-white text-stone-800 border-stone-200'
                            }`}
                          >
                            {isYt ? (
                              <Youtube className="w-3 h-3" />
                            ) : (
                              <HardDrive className="w-3 h-3" />
                            )}
                            <span>{isYt ? 'YouTube' : 'Google Drive'}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border cursor-pointer ${
                              item.isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-stone-200 text-stone-600 border-stone-300'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </div>

                        <p className="text-xs font-extrabold text-stone-900 line-clamp-2 leading-snug">
                          {item.title}
                        </p>

                        <a
                          href={item.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-stone-500 hover:text-[#991B1B] inline-flex items-center space-x-1 max-w-full"
                        >
                          <span className="truncate max-w-[200px]">{item.contentUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>

                    {/* Mobile Position + Action Buttons Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-stone-200/80">
                      <div className="inline-flex items-center space-x-1 bg-white rounded-xl p-1 border border-stone-200">
                        <button
                          type="button"
                          onClick={() => handleStepPosition(item, -1)}
                          className="w-8 h-8 rounded-lg hover:bg-stone-100 text-stone-700 flex items-center justify-center cursor-pointer"
                          title="Move earlier"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-black text-stone-900 tabular-nums">
                          Pos #{item.displayOrder}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStepPosition(item, 1)}
                          className="w-8 h-8 rounded-lg hover:bg-stone-100 text-stone-700 flex items-center justify-center cursor-pointer"
                          title="Move later"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewSlide({
                              id: item.id,
                              title: item.title,
                              contentType: item.contentType,
                              contentUrl: item.contentUrl,
                              videoId: item.videoId,
                              thumbnailUrl: thumb,
                              displayOrder: item.displayOrder,
                              source: 'manual_admin',
                              driveKind:
                                item.contentType === 'google_drive' ? driveKind : undefined
                            })
                          }
                          className="min-h-[40px] px-3 rounded-xl bg-white border border-stone-200 text-stone-700 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="min-h-[40px] px-3 rounded-xl bg-white border border-stone-200 hover:border-red-200 text-stone-800 hover:text-[#991B1B] text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ kind: 'manual', item })}
                          className="min-h-[40px] px-3 rounded-xl bg-red-50 border border-red-200 text-[#B91C1C] text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (Clear labeled Preview, Edit & Delete actions) */}
            <div className="hidden md:block overflow-x-auto admin-table-scroll rounded-2xl border border-stone-200">
              <table className="w-full min-w-[760px] text-left text-xs text-stone-700 border-collapse">
                <thead className="bg-stone-50/90 text-stone-500 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-3">Position</th>
                    <th className="p-3">Preview &amp; Content Title</th>
                    <th className="p-3">Content Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredItems.map((item) => {
                    const thumb = resolveThumbnailUrl(
                      item.contentType,
                      item.contentUrl,
                      item.thumbnailUrl
                    );
                    const isYt = item.contentType === 'youtube';
                    const driveKind = detectDriveContentKind(item.title, item.contentUrl);

                    return (
                      <tr key={item.id} className="hover:bg-red-50/20 transition-colors">
                        {/* Position Controls */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1 bg-stone-100 rounded-lg p-1 border border-stone-200">
                            <button
                              type="button"
                              onClick={() => handleStepPosition(item, -1)}
                              className="w-6 h-6 rounded hover:bg-white text-stone-600 flex items-center justify-center cursor-pointer"
                              title="Move earlier in carousel"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-black text-stone-900 tabular-nums">
                              #{item.displayOrder}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStepPosition(item, 1)}
                              className="w-6 h-6 rounded hover:bg-white text-stone-600 flex items-center justify-center cursor-pointer"
                              title="Move later in carousel"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Thumbnail + Title */}
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-20 aspect-video rounded-lg overflow-hidden bg-stone-900 border border-stone-200 shrink-0 relative flex items-center justify-center text-white">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={item.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : isYt ? (
                                <Play className="w-4 h-4 fill-white" />
                              ) : (
                                renderDriveBadgeIcon(driveKind)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-stone-900 line-clamp-1 max-w-xs">
                                {item.title}
                              </p>
                              <a
                                href={item.contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-stone-500 hover:text-[#991B1B] inline-flex items-center space-x-1 truncate max-w-[260px]"
                              >
                                <span className="truncate">{item.contentUrl}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Content Type */}
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                              isYt
                                ? 'bg-red-50 text-[#B91C1C] border-red-200'
                                : 'bg-stone-100 text-stone-800 border-stone-200'
                            }`}
                          >
                            {isYt ? (
                              <Youtube className="w-3.5 h-3.5" />
                            ) : (
                              <HardDrive className="w-3.5 h-3.5" />
                            )}
                            <span>{isYt ? 'YouTube' : 'Google Drive'}</span>
                          </span>
                        </td>

                        {/* Active/Inactive Toggle */}
                        <td className="p-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold border transition-colors cursor-pointer ${
                              item.isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Labeled Actions */}
                        <td className="p-3 whitespace-nowrap text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewSlide({
                                  id: item.id,
                                  title: item.title,
                                  contentType: item.contentType,
                                  contentUrl: item.contentUrl,
                                  videoId: item.videoId,
                                  thumbnailUrl: thumb,
                                  displayOrder: item.displayOrder,
                                  source: 'manual_admin',
                                  driveKind:
                                    item.contentType === 'google_drive' ? driveKind : undefined
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold inline-flex items-center space-x-1 cursor-pointer"
                              title="Preview slide"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-800 hover:text-[#991B1B] font-bold inline-flex items-center space-x-1 cursor-pointer"
                              title="Edit media item"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ kind: 'manual', item })}
                              className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#B91C1C] font-bold inline-flex items-center space-x-1 cursor-pointer"
                              title="Delete media item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* SECTION 3: Live Combined Carousel Order Sequence (with direct Edit & Delete per Slide) */}
      {combinedPreviewSlides.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-4 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-[#991B1B]" />
              <h3 className="text-sm font-extrabold text-stone-900">
                Live Mobile Carousel Slide Sequence ({combinedPreviewSlides.length} Slides)
              </h3>
            </div>
            <span className="text-[11px] text-stone-500">Autoplays every 5 seconds</span>
          </div>

          <div className="flex overflow-x-auto gap-3 pb-2 admin-table-scroll">
            {combinedPreviewSlides.map((slide, index) => (
              <div
                key={slide.id}
                className="w-56 shrink-0 rounded-2xl border border-stone-200 overflow-hidden bg-white flex flex-col justify-between hover:border-[#991B1B]/60 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setPreviewSlide(slide)}
                  className="text-left cursor-pointer focus:outline-none group"
                >
                  <div className="aspect-video w-full bg-stone-900 relative flex items-center justify-center text-white overflow-hidden">
                    {slide.thumbnailUrl ? (
                      <img
                        src={slide.thumbnailUrl}
                        alt={slide.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                      />
                    ) : slide.contentType === 'youtube' ? (
                      <Play className="w-5 h-5 fill-white" />
                    ) : (
                      renderDriveBadgeIcon(slide.driveKind || 'pdf')
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-stone-950/85 text-white text-[10px] font-black px-2 py-0.5 rounded-md tabular-nums">
                      Slide {index + 1}
                    </span>
                  </div>
                  <div className="p-2.5 space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#991B1B]">
                      {slide.contentType === 'youtube' ? 'YOUTUBE VIDEO' : 'GOOGLE DRIVE'}
                    </p>
                    <p className="text-[11px] font-bold text-stone-900 line-clamp-2 leading-snug">
                      {slide.title}
                    </p>
                  </div>
                </button>

                <div className="px-2.5 pb-2.5 pt-2 border-t border-stone-100 flex items-center gap-1.5 bg-stone-50/70">
                  <button
                    type="button"
                    onClick={() => openEditFromSlide(slide, index)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-stone-200 hover:border-red-200 hover:bg-red-50 text-stone-800 hover:text-[#991B1B] text-[11px] font-bold inline-flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteFromSlide(slide)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-[#B91C1C] text-[11px] font-bold inline-flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD / EDIT MEDIA MODAL — STRICTLY ONLY 6 SPECIFIED FIELDS, ZERO DESCRIPTION */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  {editingItem ? 'Edit Homepage Media Item' : 'Add / Customize Homepage Media Item'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Displayed inside the 16:9 mobile homepage Media Carousel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formNotice && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#991B1B] text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formNotice.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveMediaForm} className="space-y-4 text-xs">
              {/* Field 1: Content Type */}
              <div>
                <label className="block text-stone-800 font-bold mb-1.5">
                  1. Content Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setContentType('google_drive')}
                    className={`p-3 rounded-xl border flex items-center justify-center space-x-2 font-bold cursor-pointer transition-all ${
                      contentType === 'google_drive'
                        ? 'bg-red-50 border-[#991B1B] text-[#991B1B]'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Google Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('youtube')}
                    className={`p-3 rounded-xl border flex items-center justify-center space-x-2 font-bold cursor-pointer transition-all ${
                      contentType === 'youtube'
                        ? 'bg-red-50 border-[#991B1B] text-[#991B1B]'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Youtube className="w-4 h-4" />
                    <span>YouTube</span>
                  </button>
                </div>
              </div>

              {/* Field 2: Content Title */}
              <div>
                <label className="block text-stone-800 font-bold mb-1">
                  2. Content Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder={
                    contentType === 'google_drive'
                      ? 'e.g. HSLC 2027 General Science Solved Paper PDF'
                      : 'e.g. Class 10 Trigonometry Full Revision Lecture'
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 focus:bg-white focus:outline-none focus:border-[#991B1B]"
                />
              </div>

              {/* Field 3: Content URL */}
              <div>
                <label className="block text-stone-800 font-bold mb-1">
                  3. Content URL (YouTube Video URL or Google Drive Link)
                </label>
                <input
                  type="url"
                  required
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder={
                    contentType === 'google_drive'
                      ? 'https://drive.google.com/file/d/.../view?usp=sharing'
                      : 'https://www.youtube.com/watch?v=...'
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-[#991B1B]"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  {contentType === 'google_drive'
                    ? 'Tip: Ensure Drive link permission is set to "Anyone with the link" so students can view PDF/Video.'
                    : liveFormYoutubeId
                    ? `Detected YouTube Video ID: ${liveFormYoutubeId}`
                    : 'Supports youtube.com/watch?v=..., youtu.be/..., and YouTube Shorts URLs.'}
                </p>
              </div>

              {/* Field 4: Thumbnail Image URL (Optional) */}
              <div>
                <label className="block text-stone-800 font-bold mb-1">
                  4. Thumbnail Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Leave blank to auto-use YouTube / Google Drive thumbnail"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-[#991B1B]"
                />
              </div>

              {/* Live 16:9 Preview of Form Entry */}
              <div className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50">
                <div className="aspect-video w-full bg-stone-900 relative flex items-center justify-center text-white">
                  {liveFormThumbnailPreview ? (
                    <img
                      src={liveFormThumbnailPreview}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : contentType === 'youtube' ? (
                    <Play className="w-8 h-8 fill-white opacity-70" />
                  ) : (
                    renderDriveBadgeIcon(liveFormDriveKind)
                  )}
                </div>
                <div className="px-3.5 py-2.5 bg-white border-t border-stone-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#B91C1C]">
                    {contentType === 'youtube' ? 'YOUTUBE VIDEO' : 'GOOGLE DRIVE'}
                  </span>
                  <p className="text-xs font-bold text-stone-900 truncate mt-0.5">
                    {contentTitle.trim() || 'Live 16:9 Slide Preview'}
                  </p>
                </div>
              </div>

              {/* Field 5 & Field 6: Display Position & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-800 font-bold mb-1">
                    5. Display Position
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    required
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 font-bold tabular-nums focus:bg-white focus:outline-none focus:border-[#991B1B]"
                  />
                </div>

                <div>
                  <label className="block text-stone-800 font-bold mb-1">
                    6. Status
                  </label>
                  <select
                    value={isActive ? 'active' : 'inactive'}
                    onChange={(e) => setIsActive(e.target.value === 'active')}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 font-bold focus:bg-white focus:outline-none focus:border-[#991B1B]"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  disabled={savingForm}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="px-5 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] disabled:bg-stone-300 text-white font-bold flex items-center space-x-2 cursor-pointer"
                >
                  {savingForm && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Publish Media'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL (exact mobile 16:9 card appearance + direct Edit/Delete buttons) */}
      {previewSlide && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <span className="text-xs font-extrabold text-stone-900">
                Mobile Carousel Slide Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewSlide(null)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-stone-50">
              <div className="rounded-3xl overflow-hidden bg-white border border-stone-200 shadow-lg">
                <div className="relative aspect-video w-full bg-stone-900 flex items-center justify-center text-white">
                  {previewSlide.thumbnailUrl ? (
                    <img
                      src={previewSlide.thumbnailUrl}
                      alt={previewSlide.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : previewSlide.contentType === 'youtube' ? (
                    <Play className="w-10 h-10 fill-white" />
                  ) : (
                    renderDriveBadgeIcon(previewSlide.driveKind || 'pdf')
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-12 h-12 flex items-center justify-center text-white shadow-xl ${
                        previewSlide.contentType === 'youtube'
                          ? 'rounded-full bg-[#B91C1C]/95 border-2 border-white'
                          : 'rounded-2xl bg-stone-950/80 border border-white/30'
                      }`}
                    >
                      {previewSlide.contentType === 'youtube' ? (
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      ) : (
                        renderDriveBadgeIcon(previewSlide.driveKind || 'pdf')
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#B91C1C]">
                    {previewSlide.contentType === 'youtube' ? 'YOUTUBE VIDEO' : 'GOOGLE DRIVE'}
                  </span>
                  <h4 className="text-sm font-extrabold text-stone-900 leading-snug">
                    {previewSlide.title}
                  </h4>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 bg-white">
              <a
                href={
                  validateAndFormatMediaOpenUrl(
                    previewSlide.contentType,
                    previewSlide.contentUrl,
                    previewSlide.videoId
                  ).url || previewSlide.contentUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold inline-flex items-center space-x-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Link</span>
              </a>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const current = previewSlide;
                    setPreviewSlide(null);
                    openEditFromSlide(current, Math.max(0, (current.displayOrder || 1) - 1));
                  }}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-800 hover:text-[#991B1B] text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => openDeleteFromSlide(previewSlide)}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#B91C1C] text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewSlide(null)}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-[#B91C1C] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">
                  {deleteTarget.kind === 'manual'
                    ? 'Delete Media Entry?'
                    : 'Remove YouTube Video from Carousel?'}
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Are you sure you want to remove{' '}
                  <strong className="text-stone-800">
                    {deleteTarget.kind === 'manual'
                      ? deleteTarget.item.title
                      : deleteTarget.title}
                  </strong>
                  ?{' '}
                  {deleteTarget.kind === 'manual'
                    ? 'It will be permanently deleted from the Homepage Media Carousel.'
                    : 'It will be removed immediately from the mobile homepage carousel, and you can restore it anytime from Removed Videos.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingId)}
                className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                {deletingId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {deleteTarget.kind === 'manual' ? 'Delete Permanently' : 'Remove Video'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
