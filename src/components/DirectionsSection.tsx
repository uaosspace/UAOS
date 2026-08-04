import type {Locale} from '../data/locales'
import React, { useState, useRef, useEffect } from 'react';
import { Target, Trophy, Compass, Shield, Award, Sparkles, Network } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

interface DirectionsSectionProps {
  currentLang: Locale;
}

export default function DirectionsSection({ currentLang }: DirectionsSectionProps) {
  const t = TRANSLATIONS[currentLang];
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState<number>(0);

  const goals = [
    { 
      title: t.goal_1_title || (currentLang === 'uk' ? 'Культура безпеки' : 'Safety Culture'),
      text: t.goal_1, 
      icon: Compass 
    },
    { 
      title: t.goal_2_title || (currentLang === 'uk' ? 'Прозоре середовище' : 'Transparent Environment'),
      text: t.goal_2, 
      icon: Shield 
    },
    { 
      title: t.goal_3_title || (currentLang === 'uk' ? 'Надійні партнери' : 'Reliable Partners'),
      text: t.goal_3, 
      icon: Trophy 
    },
    { 
      title: t.goal_4_title || (currentLang === 'uk' ? 'Експертні компетенції' : 'Expert Competencies'),
      text: t.goal_4, 
      icon: Network 
    },
    { 
      title: t.goal_5_title || (currentLang === 'uk' ? 'Відповідальний ринок ЗІЗ' : 'Responsible PPE Market'),
      text: t.goal_5, 
      icon: Award 
    },
    { 
      title: t.goal_6_title || (currentLang === 'uk' ? 'Стандарти та сертифікація' : 'Standards & Certification'),
      text: t.goal_6, 
      icon: Target 
    },
    { 
      title: t.goal_7_title || (currentLang === 'uk' ? 'Європейські підходи' : 'European Approaches'),
      text: t.goal_7, 
      icon: Sparkles 
    }
  ];

  // Static layout parameters for Desktop "cards scattered on a table"
  const desktopLayouts = [
    { left: '2%', top: '6%', rotate: '-3deg', zIndex: 10 },
    { left: '26%', top: '4%', rotate: '2deg', zIndex: 11 },
    { left: '50%', top: '9%', rotate: '-4deg', zIndex: 12 },
    { left: '74%', top: '5%', rotate: '3deg', zIndex: 13 },
    { left: '14%', top: '51%', rotate: '4deg', zIndex: 14 },
    { left: '38%', top: '53%', rotate: '-3deg', zIndex: 15 },
    { left: '62%', top: '49%', rotate: '1deg', zIndex: 16 }
  ];

  // Static layout parameters for Tablet "neat grid-like but slightly organic"
  const tabletRotations = ['rotate-1', 'rotate-[-2deg]', 'rotate-[2deg]', 'rotate-[-1deg]', 'rotate-[3deg]', 'rotate-[-3deg]', 'rotate-1'];

  // Scroll listener for mobile slider to detect central card
  const handleMobileScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const children = container.children;
    let closestIndex = 0;
    let minDiff = Infinity;
    const containerCenter = container.getBoundingClientRect().left + container.offsetWidth / 2;

    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const childCenter = rect.left + rect.width / 2;
      const diff = Math.abs(childCenter - containerCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    setActiveMobileIndex(closestIndex);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', handleMobileScroll);
      // Trigger once initially
      handleMobileScroll();
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', handleMobileScroll);
      }
    };
  }, []);

  return (
    <section 
      id="directions" 
      className="scroll-mt-24 py-6 lg:py-8 bg-transparent border-y border-brand-slate-200/20 dark:border-brand-slate-850/20 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 lg:mb-10 space-y-4">
          <h2 className="text-xs font-mono font-bold tracking-widest text-brand-blue-500 dark:text-brand-sky-300 uppercase">
            {t.goals_title}
          </h2>
          <p className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
            {t.goals_subtitle}
          </p>
          <div className="h-1 w-12 bg-brand-blue-500 mx-auto rounded-full"></div>
        </div>

        {/* 1. DESKTOP LAYOUT (width >= 1024px) - "scattered cards" */}
        <div className="hidden lg:block relative w-full h-[470px] bg-gradient-to-br from-slate-100/40 via-slate-50/10 to-slate-100/30 dark:from-slate-950/20 dark:via-brand-slate-900/10 dark:to-slate-950/20 border border-slate-200/20 dark:border-slate-800/10 rounded-3xl p-6 overflow-hidden">
          {goals.map((goal, idx) => {
            const Icon = goal.icon;
            const isHovered = hoveredIndex === idx;
            const isAnyHovered = hoveredIndex !== null;
            const layout = desktopLayouts[idx];
            const isBlue = idx % 2 === 0;

            const cardStyle: React.CSSProperties = {
              position: 'absolute',
              left: layout.left,
              top: layout.top,
              width: '24%',
              height: '42%',
              transform: isHovered 
                ? 'translateY(-24px) rotate(0deg)' 
                : `rotate(${layout.rotate})`,
              zIndex: isHovered ? 50 : layout.zIndex,
              transition: 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 350ms cubic-bezier(0.22, 1, 0.36, 1), border-color 350ms cubic-bezier(0.22, 1, 0.36, 1), opacity 350ms cubic-bezier(0.22, 1, 0.36, 1)',
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)'
            };

            return (
              <div
                key={idx}
                style={cardStyle}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`relative p-5 shadow-[0_4px_24px_rgba(15,23,42,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)] border-y border-r cursor-default select-none flex flex-col justify-between transition-[transform,box-shadow,border-color,opacity] duration-300
                  bg-slate-50/95 dark:bg-[#0c1222]/95
                  border-slate-200/80 dark:border-slate-800/80
                  ${isBlue ? 'border-l-[3px] border-l-brand-blue-500' : 'border-l-[3px] border-l-amber-500'}
                  ${isHovered ? 'shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.3)] border-slate-300 dark:border-slate-700' : ''}
                  ${isAnyHovered && !isHovered ? 'opacity-70' : 'opacity-100'}
                `}
              >
                {/* Fold corner effect */}
                <div 
                  className="absolute top-0 right-0 w-[12px] h-[12px] bg-slate-200 dark:bg-slate-800 border-l border-b border-slate-300 dark:border-slate-700 pointer-events-none z-10"
                  style={{
                    borderBottomLeftRadius: '2px',
                    clipPath: 'polygon(0 0, 100% 100%, 0 100%)'
                  }}
                />

                {/* Technical dot grid - weakened */}
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:8px_8px] opacity-20 pointer-events-none rounded-2xl" />

                {/* Watermark Icon */}
                <Icon className={`absolute -right-4 -bottom-4 w-24 h-24 pointer-events-none transition-transform duration-500 ${isHovered ? 'scale-110 rotate-6' : ''} ${isBlue ? 'text-brand-blue-500/[0.04] dark:text-brand-blue-400/[0.02]' : 'text-amber-500/[0.04] dark:text-amber-400/[0.02]'}`} />

                <div className="space-y-2.5 relative z-10">
                  <div className="flex items-center justify-end pb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isBlue ? 'bg-brand-blue-500' : 'bg-amber-500'}`} />
                  </div>

                  <h3 className="font-display font-semibold text-base lg:text-[17px] text-brand-slate-900 dark:text-white leading-snug">
                    {goal.title}
                  </h3>
                  
                  <p className="text-[12px] font-normal leading-relaxed text-brand-slate-600 dark:text-brand-slate-350">
                    {goal.text}
                  </p>
                </div>

                {/* Bottom Card Footer */}
                <div className="flex justify-end items-center relative z-10 pt-2 mt-auto border-t border-slate-100 dark:border-slate-800/40">
                  <span className={`text-[8px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${isBlue ? 'bg-brand-blue-50/80 dark:bg-brand-blue-950/20 text-brand-blue-600 dark:text-brand-blue-400' : 'bg-amber-50/80 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'}`}>
                    UAOS
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. TABLET LAYOUT (640px - 1023px) - "grid of rows with slight rotation" */}
        <div className="hidden sm:grid lg:hidden grid-cols-2 gap-6 py-2">
          {goals.map((goal, idx) => {
            const Icon = goal.icon;
            const isHovered = hoveredIndex === idx;
            const isAnyHovered = hoveredIndex !== null;
            const rotationClass = tabletRotations[idx];
            const isBlue = idx % 2 === 0;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => setHoveredIndex(idx)}
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)'
                }}
                className={`relative p-5 shadow-[0_4px_24px_rgba(15,23,42,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)] border-y border-r transition-[transform,box-shadow,border-color,opacity] duration-300 cursor-default select-none flex flex-col justify-between
                  bg-slate-50/95 dark:bg-[#0c1222]/95
                  border-slate-200/80 dark:border-slate-800/80
                  ${isBlue ? 'border-l-[3px] border-l-brand-blue-500' : 'border-l-[3px] border-l-amber-500'}
                  ${rotationClass}
                  ${isHovered ? '!rotate-0 -translate-y-3 shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.3)] border-slate-300 dark:border-slate-700' : ''}
                  ${isAnyHovered && !isHovered ? 'opacity-70' : 'opacity-100'}
                  ${idx === 6 ? 'sm:col-span-2 sm:max-w-md sm:mx-auto sm:w-full' : ''}
                `}
              >
                {/* Fold corner effect */}
                <div 
                  className="absolute top-0 right-0 w-[12px] h-[12px] bg-slate-200 dark:bg-slate-800 border-l border-b border-slate-300 dark:border-slate-700 pointer-events-none z-10"
                  style={{
                    borderBottomLeftRadius: '2px',
                    clipPath: 'polygon(0 0, 100% 100%, 0 100%)'
                  }}
                />

                {/* Technical dot grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:8px_8px] opacity-20 pointer-events-none rounded-2xl" />

                {/* Watermark Icon */}
                <Icon className={`absolute -right-4 -bottom-4 w-24 h-24 pointer-events-none ${isBlue ? 'text-brand-blue-500/[0.04] dark:text-brand-blue-400/[0.02]' : 'text-amber-500/[0.04] dark:text-amber-400/[0.02]'}`} />

                <div className="space-y-2.5 relative z-10">
                  <div className="flex items-center justify-end pb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isBlue ? 'bg-brand-blue-500' : 'bg-amber-500'}`} />
                  </div>

                  <h3 className="font-display font-semibold text-base sm:text-lg text-brand-slate-900 dark:text-white leading-snug">
                    {goal.title}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-brand-slate-600 dark:text-brand-slate-350 leading-relaxed font-normal">
                    {goal.text}
                  </p>
                </div>

                {/* Bottom Card Footer */}
                <div className="flex justify-end items-center relative z-10 pt-2 mt-4 border-t border-slate-100 dark:border-slate-800/40">
                  <span className={`text-[8px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${isBlue ? 'bg-brand-blue-50/80 dark:bg-brand-blue-950/20 text-brand-blue-600 dark:text-brand-blue-400' : 'bg-amber-50/80 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'}`}>
                    UAOS
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. MOBILE LAYOUT (width < 640px) - "horizontal manual slider" */}
        <div className="block sm:hidden relative w-full overflow-hidden py-4">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory gap-4 px-[9vw]"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {goals.map((goal, idx) => {
              const Icon = goal.icon;
              const isActive = activeMobileIndex === idx;
              const isBlue = idx % 2 === 0;

              return (
                <div
                  key={idx}
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)'
                  }}
                  className={`w-[82vw] max-w-[340px] shrink-0 snap-center relative p-5 shadow-[0_4px_24px_rgba(15,23,42,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)] border-y border-r transition-[transform,box-shadow,border-color,opacity] duration-300 select-none flex flex-col justify-between
                    bg-slate-50/95 dark:bg-[#0c1222]/95
                    border-slate-200/80 dark:border-slate-800/80
                    ${isBlue ? 'border-l-[3px] border-l-brand-blue-500' : 'border-l-[3px] border-l-amber-500'}
                    ${isActive ? '-translate-y-1.5 border-slate-300 dark:border-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.3)] opacity-100' : 'opacity-70'}
                  `}
                >
                  {/* Fold corner effect */}
                  <div 
                    className="absolute top-0 right-0 w-[12px] h-[12px] bg-slate-200 dark:bg-slate-800 border-l border-b border-slate-300 dark:border-slate-700 pointer-events-none z-10"
                    style={{
                      borderBottomLeftRadius: '2px',
                      clipPath: 'polygon(0 0, 100% 100%, 0 100%)'
                    }}
                  />

                  {/* Technical dot grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:8px_8px] opacity-20 pointer-events-none rounded-2xl" />

                  {/* Watermark Icon */}
                  <Icon className={`absolute -right-4 -bottom-4 w-24 h-24 pointer-events-none ${isBlue ? 'text-brand-blue-500/[0.04] dark:text-brand-blue-400/[0.02]' : 'text-amber-500/[0.04] dark:text-amber-400/[0.02]'}`} />

                  <div className="space-y-2.5 relative z-10">
                    <div className="flex items-center justify-end pb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isBlue ? 'bg-brand-blue-500' : 'bg-amber-500'}`} />
                    </div>

                    <h3 className="font-display font-semibold text-base text-brand-slate-900 dark:text-white leading-snug">
                      {goal.title}
                    </h3>
                    
                    <p className="text-xs text-brand-slate-600 dark:text-brand-slate-350 leading-relaxed font-normal">
                      {goal.text}
                    </p>
                  </div>

                  {/* Bottom Card Footer */}
                  <div className="flex justify-end items-center relative z-10 pt-2 mt-4 border-t border-slate-100 dark:border-slate-800/40">
                    <span className={`text-[8px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${isBlue ? 'bg-brand-blue-50/80 dark:bg-brand-blue-950/20 text-brand-blue-600 dark:text-brand-blue-400' : 'bg-amber-50/80 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'}`}>
                      UAOS
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Slider Pagination dots indicator */}
          <div className="flex justify-center space-x-1.5 mt-4">
            {goals.map((_, idx) => (
              <span 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeMobileIndex === idx ? 'w-4 bg-brand-blue-500' : 'w-1.5 bg-brand-slate-200 dark:bg-brand-slate-800'}`}
              ></span>
            ))}
          </div>
        </div>

        {/* Compact final tagline under the deck */}
        <div className="mt-12 text-center max-w-[700px] mx-auto border-t border-brand-slate-100 dark:border-brand-slate-800/40 pt-8 px-4">
          <p className="font-manrope text-clamp-tagline font-semibold leading-[1.35] tracking-[-0.02em] text-brand-slate-850 dark:text-brand-slate-100 mx-auto">
            {currentLang === 'uk' ? (
              <>
                Виводимо охорону праці в Україні на сучасний рівень, де{' '}
                <span className="text-brand-blue-500 dark:text-brand-sky-300 border-b-2 border-brand-yellow-400 dark:border-brand-yellow-500 pb-0.5">
                  здоров’я людини
                </span>{' '}
                — найвищий і безумовний пріоритет.
              </>
            ) : (
              <>
                We elevate occupational safety in Ukraine to a modern level, where{' '}
                <span className="text-brand-blue-500 dark:text-brand-sky-300 border-b-2 border-brand-yellow-400 dark:border-brand-yellow-500 pb-0.5">
                  human health
                </span>{' '}
                is the ultimate and unconditional priority.
              </>
            )}
          </p>
        </div>

      </div>
    </section>
  );
}
