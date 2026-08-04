import type {Locale} from '../data/locales'
import {resolveLocalized} from '../data/locales'
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, ArrowUpRight, Shield } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';
import { AssociationMember } from '../types';

interface MembersCarouselProps {
  currentLang: Locale;
  members: AssociationMember[];
  onSelectMember: (slug: string) => void;
  /** Industrial shell: id="participants" + industrial section chrome */
  variant?: 'default' | 'industrial';
  /** Показує посилання «Переглянути всіх учасників» → /members (розділ 8.1 ТЗ). */
  onViewAllMembers?: () => void;
}

function isImageAssetUrl(value: string | undefined): value is string {
  if (!value) return false
  return (
    value.startsWith('/') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    /\.(png|jpe?g|webp|svg)(\?|$)/i.test(value)
  )
}

export function renderMemberName(name: string) {
  if (!name.includes('&')) return name;
  const parts = name.split('&');
  return (
    <>
      {parts[0]}
      <span className="font-sans mx-0.5">&</span>
      {parts[1]}
    </>
  );
}

interface MemberCoverImageProps {
  src?: string;
  logoSrc?: string;
  alt: string;
  shortName: string;
  isCentral: boolean;
  isHovered: boolean;
}

function MemberCoverImage({ src, logoSrc, alt, shortName, isCentral, isHovered }: MemberCoverImageProps) {
  const primary = isImageAssetUrl(logoSrc) ? logoSrc : src;
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(primary ? 'loading' : 'error');
  const showAsLogo = isImageAssetUrl(logoSrc);

  useEffect(() => {
    if (!primary) {
      setStatus('error');
      return;
    }
    const img = new Image();
    img.src = primary;
    img.onload = () => setStatus('loaded');
    img.onerror = () => setStatus('error');
  }, [primary]);

  if (showAsLogo) {
    return (
      <div className="member-card-logo">
        {status === 'loading' && (
          <div className="absolute inset-0 animate-pulse bg-black/40" />
        )}
        {status === 'loaded' && primary && (
          <img
            src={primary}
            alt={alt}
            loading={isCentral ? 'eager' : 'lazy'}
            decoding="async"
            className={isHovered ? 'scale-105 transition-transform duration-500' : 'transition-transform duration-500'}
            referrerPolicy="no-referrer"
          />
        )}
        {status === 'error' && (
          <div className="member-card-logo-fallback">{shortName}</div>
        )}
      </div>
    );
  }

  return (
    <div className="aspect-[16/9] rounded-xl bg-brand-slate-50 dark:bg-brand-slate-950 overflow-hidden relative border border-brand-slate-100 dark:border-brand-slate-800/20">
      {status === 'loading' && (
        <div className="absolute inset-0 bg-brand-slate-100 dark:bg-brand-slate-900 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-brand-blue-500/20 border-t-brand-blue-500 animate-spin" />
        </div>
      )}

      {status === 'loaded' && primary && (
        <img
          src={primary}
          alt={alt}
          loading={isCentral ? "eager" : "lazy"}
          decoding="async"
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-105' : ''}`}
          referrerPolicy="no-referrer"
        />
      )}

      {status === 'error' && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-50 to-brand-slate-100 dark:from-brand-blue-950/20 dark:to-brand-slate-900 flex flex-col items-center justify-center p-3 text-center">
          <Shield className="w-8 h-8 text-brand-blue-500/20 mb-1" />
          <span className="font-display font-black text-sm tracking-tighter text-brand-blue-600/60 dark:text-brand-sky-300/60">
            {shortName}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-brand-slate-950/60 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute bottom-3 left-3 bg-white dark:bg-brand-slate-900 p-1.5 rounded-lg border border-brand-slate-200/50 shadow-sm z-10">
        <span className="font-display font-black text-[10px] tracking-tighter text-brand-blue-600 dark:text-brand-sky-300">
          {shortName}
        </span>
      </div>
    </div>
  );
}

export default function MembersCarousel({
  currentLang,
  members,
  onSelectMember,
  variant = 'default',
  onViewAllMembers,
}: MembersCarouselProps) {
  const t = TRANSLATIONS[currentLang];
  const isIndustrial = variant === 'industrial';
  const publishedMembers = members.filter(m => m.published !== false).sort((a, b) => a.order - b.order);

  // Clone members to simulate an endless tape
  const clonedMembers = [...publishedMembers, ...publishedMembers, ...publishedMembers];

  const [isPlaying, setIsPlaying] = useState(true);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [isEdgeHovering, setIsEdgeHovering] = useState<'left' | 'right' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const targetScrollPositionRef = useRef<number>(0);
  const requestRef = useRef<number | null>(null);

  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Constants for card width and spacing
  const cardWidth = 280;
  const gap = 24;
  const stepWidth = cardWidth + gap; // 304px
  const singleSetWidth = publishedMembers.length * stepWidth;

  // Preload unique cover images once
  useEffect(() => {
    publishedMembers.forEach(m => {
      if (m.coverImageUrl) {
        const img = new Image();
        img.src = m.coverImageUrl;
      }
    });
  }, [publishedMembers.length]);

  // Initialize and keep scroll position centered at the middle clone set
  useEffect(() => {
    if (publishedMembers.length > 0) {
      const initialScroll = singleSetWidth;
      scrollPositionRef.current = initialScroll;
      targetScrollPositionRef.current = initialScroll;
      if (trayRef.current) {
        trayRef.current.style.transform = `translateX(-${initialScroll}px)`;
      }
    }
  }, [publishedMembers.length, singleSetWidth]);

  // Unified high-performance continuous animation loop (runs every frame)
  useEffect(() => {
    if (publishedMembers.length === 0) return;

    const animate = () => {
      let speed = 0;

      // Strict Animation Priorities:
      // 1. Pause is pressed -> speed = 0
      // 2. Left Edge Hover -> fast backward
      // 3. Right Edge Hover -> fast forward
      // 4. Center Card Hover -> speed = 0
      // 5. Default auto scroll
      if (!isPlaying) {
        speed = 0;
      } else if (isEdgeHovering === 'left') {
        speed = -4.5; // Fast backward / scrolls right (visual move left)
      } else if (isEdgeHovering === 'right') {
        speed = 4.5; // Fast forward / scrolls left (visual move right)
      } else if (hoveredCardId !== null) {
        speed = 0; // Pause when hovering any card
      } else {
        speed = 0.8; // Base continuous speed
      }

      // Update target position
      targetScrollPositionRef.current += speed;

      // Lerp for smooth acceleration/deceleration transitions
      const lerpFactor = 0.08;
      scrollPositionRef.current += (targetScrollPositionRef.current - scrollPositionRef.current) * lerpFactor;

      // Infinite wrapping boundaries
      if (scrollPositionRef.current >= singleSetWidth * 2) {
        const diff = scrollPositionRef.current - singleSetWidth * 2;
        scrollPositionRef.current = singleSetWidth + diff;
        targetScrollPositionRef.current = scrollPositionRef.current;
      } else if (scrollPositionRef.current < singleSetWidth) {
        const diff = singleSetWidth - scrollPositionRef.current;
        scrollPositionRef.current = singleSetWidth * 2 - diff;
        targetScrollPositionRef.current = scrollPositionRef.current;
      }

      // Direct style update for buttery smooth 60+ FPS
      if (trayRef.current) {
        trayRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [publishedMembers.length, isPlaying, hoveredCardId, isEdgeHovering, singleSetWidth]);

  // Handle manual arrow keys when focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (document.activeElement && containerRef.current.contains(document.activeElement)) {
        if (e.key === 'ArrowRight') {
          handleManualInteraction(() => handleNext());
        } else if (e.key === 'ArrowLeft') {
          handleManualInteraction(() => handlePrev());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNext = () => {
    targetScrollPositionRef.current += stepWidth;
  };

  const handlePrev = () => {
    targetScrollPositionRef.current -= stepWidth;
  };

  const handleManualInteraction = (actionFn: () => void) => {
    actionFn();
    setIsPlaying(false);
    
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    
    resumeTimerRef.current = setTimeout(() => {
      setIsPlaying(true);
    }, 5000);
  };

  // Edge hover acceleration detection
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const width = rect.width;

    const leftEdgeThreshold = width * 0.15; // 15% left edge
    const rightEdgeThreshold = width * 0.85; // 15% right edge

    if (mouseX < leftEdgeThreshold) {
      setIsEdgeHovering('left');
      setHoveredCardId(null); // Reset card hover while accelerating
    } else if (mouseX > rightEdgeThreshold) {
      setIsEdgeHovering('right');
      setHoveredCardId(null); // Reset card hover while accelerating
    } else {
      setIsEdgeHovering(null);
    }
  };

  const handleMouseLeave = () => {
    setIsEdgeHovering(null);
    setHoveredCardId(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].clientX;
    scrollLeftRef.current = targetScrollPositionRef.current;
    setIsPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const x = e.touches[0].clientX;
    const delta = startXRef.current - x;
    targetScrollPositionRef.current = scrollLeftRef.current + delta;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPlaying(true);
    }, 4000);
  };

  const handleCardClick = (member: AssociationMember) => {
    onSelectMember(member.slug);
  };

  const controls = (
    <div className={isIndustrial ? 'members-carousel-controls' : 'flex items-center space-x-3 shrink-0'}>
      <button
        type="button"
        onClick={() => handleManualInteraction(() => handlePrev())}
        className={
          isIndustrial
            ? undefined
            : 'p-2.5 rounded-xl border border-brand-slate-200 dark:border-brand-slate-800 bg-white dark:bg-brand-slate-900 text-brand-slate-600 dark:text-brand-slate-200 hover:border-brand-blue-500 transition-colors cursor-pointer'
        }
        aria-label={t.members_carousel_prev}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setIsPlaying(!isPlaying)}
        className={
          isIndustrial
            ? undefined
            : 'p-2.5 rounded-xl border border-brand-slate-200 dark:border-brand-slate-800 bg-white dark:bg-brand-slate-900 text-brand-slate-600 dark:text-brand-slate-200 hover:border-brand-blue-500 transition-colors cursor-pointer'
        }
        aria-label={isPlaying ? t.members_carousel_pause : t.members_carousel_play}
        title={isPlaying ? t.members_carousel_pause : t.members_carousel_play}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <button
        type="button"
        onClick={() => handleManualInteraction(() => handleNext())}
        className={
          isIndustrial
            ? undefined
            : 'p-2.5 rounded-xl border border-brand-slate-200 dark:border-brand-slate-800 bg-white dark:bg-brand-slate-900 text-brand-slate-600 dark:text-brand-slate-200 hover:border-brand-blue-500 transition-colors cursor-pointer'
        }
        aria-label={t.members_carousel_next}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <section 
      id={isIndustrial ? 'participants' : 'members'}
      className={
        isIndustrial
          ? 'section participants scroll-mt-24 relative overflow-x-clip'
          : 'scroll-mt-24 py-6 lg:py-8 bg-transparent transition-colors duration-300 relative overflow-hidden'
      }
    >
      {!isIndustrial && (
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
      )}

      <div className={isIndustrial ? 'container relative z-10' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'}>
        
        {isIndustrial ? (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="section-kicker" data-index="01 /">
                {t.participants_kicker}
              </div>
              <div className="section-heading">
                <h2>{t.participants_title}</h2>
                {onViewAllMembers && (
                  <button type="button" className="text-link" onClick={onViewAllMembers}>
                    {t.participants_link} <span>→</span>
                  </button>
                )}
              </div>
            </div>
            {controls}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8">
            <div className="space-y-4 text-left max-w-2xl">
              <h2 className="text-xs font-mono font-bold tracking-widest text-brand-blue-500 dark:text-brand-sky-300 uppercase">
                {t.nav_members}
              </h2>
              <p className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
                {t.members_subtitle}
              </p>
            </div>
            <div className="mt-4 md:mt-0">{controls}</div>
          </div>
        )}

        {/* Carousel Viewport Wrapper */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative overflow-visible pb-8 cursor-grab active:cursor-grabbing focus:outline-none"
          tabIndex={0}
        >
          {/* Edge overlays with gradient and arrows (Hidden on mobile) */}
          <div
            className={`members-carousel-edge members-carousel-edge--left pointer-events-none z-20 transition-opacity duration-300 ${
              isEdgeHovering === 'left' ? 'is-active' : ''
            }`}
          >
            {isEdgeHovering === 'left' && (
              <div className="members-carousel-edge-hint hidden md:flex" aria-hidden>
                <ChevronLeft className="w-5 h-5" />
              </div>
            )}
          </div>

          <div
            className={`members-carousel-edge members-carousel-edge--right pointer-events-none z-20 transition-opacity duration-300 ${
              isEdgeHovering === 'right' ? 'is-active' : ''
            }`}
          >
            {isEdgeHovering === 'right' && (
              <div className="members-carousel-edge-hint hidden md:flex" aria-hidden>
                <ChevronRight className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Cards Tray */}
          <div className="w-full overflow-hidden">
            <div
              ref={trayRef}
              className="flex items-stretch gap-6"
              style={{
                transform: `translateX(-${scrollPositionRef.current}px)`
              }}
            >
              {clonedMembers.map((member, idx) => {
                const isHovered = hoveredCardId === member.id;
                const isAnyHovered = hoveredCardId !== null;

                // Identify if this card belongs to the middle "central" set for eager loading
                const isCentral = idx >= publishedMembers.length && idx < publishedMembers.length * 2;

                return (
                  <div
                    key={`${member.id}-${idx}`}
                    onMouseEnter={() => { setHoveredCardId(member.id); }}
                    onMouseLeave={() => { setHoveredCardId(null); }}
                    onClick={() => handleCardClick(member)}
                    className={`w-[280px] shrink-0 rounded-2xl glass-card p-6 flex flex-col justify-between transition-all duration-300 text-left cursor-pointer ${
                      isIndustrial ? 'members-carousel-card' : ''
                    } ${
                      isHovered
                        ? 'translate-y-[-10px] scale-[1.05] shadow-xl z-30 ring-1 ring-brand-blue-500/20'
                        : isAnyHovered
                        ? 'opacity-40 scale-[0.96] z-10'
                        : 'shadow-sm z-20'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className={`flex items-center justify-end ${isIndustrial ? 'member-card-badge' : ''}`}>
                        <Shield className="w-4 h-4 text-brand-slate-300 dark:text-brand-slate-700" />
                      </div>

                      {/* Custom cover image preloaded & fallback handled component */}
                      <MemberCoverImage
                        src={member.coverImageUrl}
                        logoSrc={member.logoUrl}
                        alt={member.shortName}
                        shortName={member.shortName}
                        isCentral={isCentral}
                        isHovered={isHovered}
                      />

                      {/* Titles */}
                      <div className="space-y-1 text-left">
                        <h3 className="text-base font-display font-bold text-brand-slate-900 dark:text-white leading-snug">
                          {renderMemberName(resolveLocalized(member.name, currentLang))}
                        </h3>
                        <span className="block text-[10px] font-mono font-bold text-brand-blue-500 uppercase tracking-wide">
                          {resolveLocalized(member.category, currentLang)}
                        </span>
                      </div>

                      {/* Brief description, expanded on hover */}
                      <p className={`text-xs text-brand-slate-600 dark:text-brand-slate-300 leading-relaxed transition-all duration-300 ${
                        isHovered ? 'line-clamp-none' : 'line-clamp-2'
                      }`}>
                        {resolveLocalized(member.shortDescription, currentLang)}
                      </p>

                    </div>

                    {/* Actions Button */}
                    <div className={`pt-4 border-t border-brand-slate-100 dark:border-brand-slate-800/80 mt-4 flex items-center justify-between transition-opacity duration-300 ${
                      isHovered ? 'opacity-100' : 'opacity-80'
                    }`}>
                      <span className="text-[10px] font-mono text-brand-slate-400 uppercase">
                        {t.profile_updated}: {member.lastUpdated || '2026-07'}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMember(member.slug);
                        }}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-brand-blue-500 hover:text-brand-blue-600 dark:text-brand-sky-300 dark:hover:text-brand-sky-400 group cursor-pointer"
                      >
                        <span>{t.btn_read_more}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>


      </div>
    </section>
  );
}
