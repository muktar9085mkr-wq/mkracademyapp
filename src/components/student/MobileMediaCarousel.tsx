import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  FileText,
  Film,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import {
  HomepageMediaItem,
  YouTubeFeedVideo,
  HomepageCarouselSlide
} from '../../types';
import {
  subscribeToActiveHomepageMedia,
  subscribeToYoutubeFeedCache,
  fetchLatestYouTubeFeed,
  buildCarouselSlides,
  validateAndFormatMediaOpenUrl
} from '../../services/mediaService';

interface MobileMediaCarouselProps {
  onNavigate?: (view: string, filterParam?: any) => void;
}

const AUTOPLAY_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 42;

export const MobileMediaCarousel: React.FC<MobileMediaCarouselProps> = ({ onNavigate }) => {
  const [adminMedia, setAdminMedia] = useState<HomepageMediaItem[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeFeedVideo[]>([]);
  const [excludedVideoIds, setExcludedVideoIds] = useState<string[]>([]);
  const [loadingYoutube, setLoadingYoutube] = useState(true);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>({});
  const [linkWarning, setLinkWarning] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const dragLockedAxisRef = useRef<'x' | 'y' | null>(null);
  const mouseDownXRef = useRef<number | null>(null);
  const didSwipeOrDragRef = useRef(false);
  const timerTickRef = useRef(0);
  const [timerResetKey, setTimerResetKey] = useState(0);

  // 1. Subscribe to Firestore active homepage_media items in real time
  useEffect(() => {
    const unsub = subscribeToActiveHomepageMedia(
      (items) => {
        setAdminMedia(items);
        setLoadingAdmin(false);
      },
      () => {
        setLoadingAdmin(false);
      }
    );
    return () => unsub();
  }, []);

  // 2. Fetch cached latest 10 YouTube uploads + listen to real-time Firestore cache changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchLatestYouTubeFeed();
        if (mounted) {
          if (Array.isArray(res?.videos)) {
            setYoutubeVideos(res.videos);
          }
          if (Array.isArray(res?.excludedVideoIds)) {
            setExcludedVideoIds(res.excludedVideoIds);
          }
        }
      } catch {
        // Fallback already handled inside fetchLatestYouTubeFeed
      } finally {
        if (mounted) setLoadingYoutube(false);
      }
    })();

    const unsubYt = subscribeToYoutubeFeedCache((cache) => {
      if (!mounted) return;
      setYoutubeVideos(cache.videos);
      setExcludedVideoIds(cache.excludedVideoIds);
      setLoadingYoutube(false);
    });

    return () => {
      mounted = false;
      unsubYt();
    };
  }, []);

  // 3. Merge YouTube + Active Google Drive items cleanly (prioritized & deduplicated)
  const slides: HomepageCarouselSlide[] = useMemo(
    () => buildCarouselSlides(youtubeVideos, adminMedia, excludedVideoIds),
    [youtubeVideos, adminMedia, excludedVideoIds]
  );

  // Clamp activeIndex if slides count shrinks
  useEffect(() => {
    if (slides.length === 0) {
      setActiveIndex(0);
    } else if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [slides.length, activeIndex]);

  const resetAutoplayTimer = useCallback(() => {
    timerTickRef.current += 1;
    setTimerResetKey(timerTickRef.current);
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (slides.length <= 1) return;
      const wrapped = ((index % slides.length) + slides.length) % slides.length;
      setActiveIndex(wrapped);
      resetAutoplayTimer();
    },
    [slides.length, resetAutoplayTimer]
  );

  const goNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  // 4. Autoplay every 5 seconds; disabled when <= 1 slide or paused
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [slides.length, isPaused, timerResetKey]);

  // Touch Swipe Handlers (Mobile finger swipe left/right without blocking vertical scroll)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    dragLockedAxisRef.current = null;
    didSwipeOrDragRef.current = false;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    if (slides.length <= 1) return;

    const dx = e.touches[0].clientX - touchStartXRef.current;
    const dy = e.touches[0].clientY - touchStartYRef.current;

    if (!dragLockedAxisRef.current) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        dragLockedAxisRef.current = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      }
    }

    if (dragLockedAxisRef.current === 'x') {
      setIsDragging(true);
      setDragOffsetPx(dx);
      if (Math.abs(dx) > 10) {
        didSwipeOrDragRef.current = true;
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragLockedAxisRef.current === 'x' && slides.length > 1) {
      if (dragOffsetPx <= -SWIPE_THRESHOLD_PX) {
        goNext();
      } else if (dragOffsetPx >= SWIPE_THRESHOLD_PX) {
        goPrev();
      } else {
        resetAutoplayTimer();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    dragLockedAxisRef.current = null;
    setIsDragging(false);
    setDragOffsetPx(0);
    setIsPaused(false);
  };

  // Mouse Drag Handlers (Desktop testing / pointer swipe)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (slides.length <= 1 || e.button !== 0) return;
    mouseDownXRef.current = e.clientX;
    didSwipeOrDragRef.current = false;
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseDownXRef.current === null || !isDragging) return;
    const dx = e.clientX - mouseDownXRef.current;
    if (Math.abs(dx) > 8) {
      didSwipeOrDragRef.current = true;
    }
    setDragOffsetPx(dx);
  };

  const finalizeMouseDrag = () => {
    if (mouseDownXRef.current === null) return;
    if (slides.length > 1) {
      if (dragOffsetPx <= -SWIPE_THRESHOLD_PX) {
        goNext();
      } else if (dragOffsetPx >= SWIPE_THRESHOLD_PX) {
        goPrev();
      } else if (didSwipeOrDragRef.current) {
        resetAutoplayTimer();
      }
    }
    mouseDownXRef.current = null;
    setIsDragging(false);
    setDragOffsetPx(0);
    setIsPaused(false);
  };

  const handleSlideClick = (e: React.MouseEvent<HTMLAnchorElement>, slide: HomepageCarouselSlide) => {
    if (didSwipeOrDragRef.current) {
      e.preventDefault();
      didSwipeOrDragRef.current = false;
      return;
    }

    const validation = validateAndFormatMediaOpenUrl(
      slide.contentType,
      slide.contentUrl,
      slide.videoId
    );
    if (!validation.valid) {
      e.preventDefault();
      setLinkWarning(validation.reason || 'This study resource link is currently unavailable.');
      window.setTimeout(() => setLinkWarning(null), 4000);
    }
  };

  const renderDriveIcon = (kind?: HomepageCarouselSlide['driveKind']) => {
    if (kind === 'video') return <Film className="w-4 h-4" />;
    if (kind === 'document') return <BookOpen className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getDriveTypeSubLabel = (kind?: HomepageCarouselSlide['driveKind']) => {
    if (kind === 'video') return 'DRIVE VIDEO';
    if (kind === 'document') return 'DRIVE DOC';
    return 'DRIVE PDF';
  };

  const isLoading = loadingYoutube && loadingAdmin && slides.length === 0;

  // Loading Skeleton (16:9 matching final geometry)
  if (isLoading) {
    return (
      <section className="px-4 pt-3 md:px-0 md:pt-0">
        <div className="rounded-3xl overflow-hidden bg-white border border-stone-200 shadow-md shadow-red-950/5">
          <div className="aspect-video w-full bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 animate-pulse" />
          <div className="p-3.5 md:p-4 space-y-2">
            <div className="h-3 w-24 rounded bg-stone-200 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-stone-200 animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  // Fallback card if both YouTube feed and Drive media currently have 0 active items
  if (slides.length === 0) {
    return (
      <section className="px-4 pt-3 md:px-0 md:pt-0">
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#991B1B] via-[#7F1D1D] to-[#1C1917] text-white border border-red-800/40 shadow-lg shadow-red-950/15 p-5 space-y-3">
          <div className="aspect-[16/7] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-200">
                MKR ACADEMY LEARNING HUB
              </span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight leading-snug">
                Latest Classes & Study PDFs
              </h2>
              <p className="text-xs text-rose-100/90 mt-1">
                Explore Assam Board HSLC 2027 notes and solved papers.
              </p>
            </div>
            {onNavigate && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('browse')}
                  className="px-4 py-2 rounded-xl bg-white text-[#8B0F17] text-xs font-extrabold cursor-pointer active:scale-95 transition-transform"
                >
                  Browse Study Notes
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  const viewportWidth = viewportRef.current?.offsetWidth || 1;
  const dragPercentage = isDragging ? (dragOffsetPx / viewportWidth) * 100 : 0;
  const trackTransform = `translate3d(calc(-${activeIndex * 100}% + ${dragPercentage}%), 0, 0)`;

  return (
    <section
      className="px-4 pt-3 md:px-0 md:pt-0 select-none"
      aria-label="MKR Academy Latest Videos and Study Materials"
    >
      <div
        className="relative rounded-3xl overflow-hidden bg-white border border-stone-200/90 shadow-lg shadow-red-950/10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          finalizeMouseDrag();
          setIsPaused(false);
        }}
      >
        {/* Carousel Viewport */}
        <div
          ref={viewportRef}
          className="relative w-full overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={finalizeMouseDrag}
        >
          {/* Horizontal Slide Track */}
          <div
            className={`flex will-change-transform ${
              isDragging ? 'transition-none' : 'transition-transform duration-500 ease-out'
            }`}
            style={{ transform: trackTransform }}
          >
            {slides.map((slide) => {
              const formatted = validateAndFormatMediaOpenUrl(
                slide.contentType,
                slide.contentUrl,
                slide.videoId
              );
              const thumbFailed = Boolean(failedThumbIds[slide.id]);
              const showImage = Boolean(slide.thumbnailUrl) && !thumbFailed;
              const isYoutube = slide.contentType === 'youtube';

              return (
                <a
                  key={slide.id}
                  href={formatted.valid ? formatted.url : '#'}
                  target={formatted.valid ? '_blank' : undefined}
                  rel={formatted.valid ? 'noopener noreferrer' : undefined}
                  onClick={(e) => handleSlideClick(e, slide)}
                  draggable={false}
                  className="w-full shrink-0 block group focus:outline-none"
                >
                  {/* Strict 16:9 Thumbnail Frame */}
                  <div className="relative aspect-video w-full bg-stone-900 overflow-hidden">
                    {showImage ? (
                      <img
                        src={slide.thumbnailUrl}
                        alt={slide.title}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        loading="eager"
                        onError={() =>
                          setFailedThumbIds((prev) => ({ ...prev, [slide.id]: true }))
                        }
                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      /* Branded Dark Crimson MKR Fallback Card (zero broken image icon) */
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center p-5 text-white ${
                          isYoutube
                            ? 'bg-gradient-to-br from-[#7F0E15] via-[#991B1B] to-[#1C1917]'
                            : 'bg-gradient-to-br from-stone-900 via-[#450A0A] to-[#7F1D1D]'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-2.5 shadow-lg">
                          {isYoutube ? (
                            <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                          ) : (
                            renderDriveIcon(slide.driveKind)
                          )}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-200">
                          {isYoutube ? 'MKR Academy Video' : `MKR Academy ${getDriveTypeSubLabel(slide.driveKind)}`}
                        </span>
                      </div>
                    )}

                    {/* Subtle dark edge gradient for clean contrast without obscuring thumbnail */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/15 pointer-events-none" />

                    {/* Center Action Icon: Play for YouTube, Document/PDF/Video badge for Google Drive */}
                    {isYoutube ? (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-[#B91C1C]/95 border-2 border-white/90 text-white shadow-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-2xl bg-stone-950/80 backdrop-blur-xs border border-white/30 text-white shadow-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                          {renderDriveIcon(slide.driveKind)}
                        </div>
                      </div>
                    )}

                    {/* Top-right Open Indicator */}
                    <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/45 backdrop-blur-xs border border-white/20 text-white flex items-center justify-center pointer-events-none">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Clean Card Footer below Thumbnail: Label + Title ONLY (no description) */}
                  <div className="px-4 py-3 md:px-5 md:py-3.5 bg-white border-t border-stone-100 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center space-x-1.5 text-[10px] md:text-[11px] font-black tracking-wider uppercase ${
                          isYoutube ? 'text-[#B91C1C]' : 'text-stone-700'
                        }`}
                      >
                        {isYoutube ? (
                          <Play className="w-3 h-3 fill-[#B91C1C]" />
                        ) : (
                          renderDriveIcon(slide.driveKind)
                        )}
                        <span>{isYoutube ? 'YOUTUBE VIDEO' : 'GOOGLE DRIVE'}</span>
                      </span>

                      {slides.length > 1 && (
                        <span className="text-[10px] md:text-[11px] font-bold text-stone-400 tabular-nums">
                          {activeIndex + 1} / {slides.length}
                        </span>
                      )}
                    </div>

                    <h2 className="text-[13px] sm:text-sm md:text-base font-extrabold text-stone-900 leading-snug line-clamp-2">
                      {slide.title}
                    </h2>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Unobtrusive Left / Right Navigation Arrows (disabled if <= 1 item) */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="Previous slide"
                className="absolute left-2 top-[calc(50%-28px)] -translate-y-1/2 w-9 h-9 rounded-full bg-stone-950/55 hover:bg-stone-950/80 text-white border border-white/20 backdrop-blur-xs flex items-center justify-center transition-all active:scale-90 cursor-pointer z-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="Next slide"
                className="absolute right-2 top-[calc(50%-28px)] -translate-y-1/2 w-9 h-9 rounded-full bg-stone-950/55 hover:bg-stone-950/80 text-white border border-white/20 backdrop-blur-xs flex items-center justify-center transition-all active:scale-90 cursor-pointer z-10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pagination Dots below Carousel (hidden when <= 1 slide) */}
      {slides.length > 1 && (
        <div
          className="flex items-center justify-center gap-0.5 pt-2"
          role="tablist"
          aria-label="Media carousel slides"
        >
          {slides.map((slide, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => goToSlide(idx)}
                className="p-1.5 flex items-center justify-center cursor-pointer focus:outline-none"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'w-5 h-1.5 bg-[#B91C1C]'
                      : 'w-1.5 h-1.5 bg-stone-300 hover:bg-stone-400'
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Graceful warning banner if a Drive/YouTube link is invalid/inaccessible */}
      {linkWarning && (
        <div className="mt-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-[#991B1B] text-[11px] font-semibold flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{linkWarning}</span>
        </div>
      )}
    </section>
  );
};
