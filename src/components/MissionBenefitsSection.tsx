import type {Locale} from '../data/locales'
import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ShieldCheck, Users, Activity, Heart, Zap, Quote } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

interface MissionBenefitsSectionProps {
  currentLang: Locale;
}

export default function MissionBenefitsSection({ currentLang }: MissionBenefitsSectionProps) {
  const t = TRANSLATIONS[currentLang];
  
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, we can unobserve
          if (sectionRef.current) {
            observer.unobserve(sectionRef.current);
          }
        }
      },
      {
        threshold: 0.15, // trigger when 15% of the section is visible
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const cards = [
    {
      icon: ShieldCheck,
      title: t.benefit_1_title,
      description: t.benefit_1_desc,
      color: 'text-brand-blue-500 bg-brand-blue-50 dark:bg-brand-blue-950/30'
    },
    {
      icon: BookOpen,
      title: t.benefit_2_title,
      description: t.benefit_2_desc,
      color: 'text-brand-yellow-500 bg-brand-yellow-50/50 dark:bg-brand-yellow-950/20'
    },
    {
      icon: Users,
      title: t.benefit_3_title,
      description: t.benefit_3_desc,
      color: 'text-brand-blue-500 bg-brand-blue-50 dark:bg-brand-blue-950/30'
    },
    {
      icon: Activity,
      title: t.benefit_4_title,
      description: t.benefit_4_desc,
      color: 'text-brand-yellow-500 bg-brand-yellow-50/50 dark:bg-brand-yellow-950/20'
    }
  ];

  return (
    <section 
      id="about" 
      ref={sectionRef}
      className="scroll-mt-24 py-6 lg:py-8 bg-transparent border-y border-brand-slate-200/20 dark:border-brand-slate-850/20 transition-colors duration-300 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Mission (span 4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center space-x-2 text-brand-blue-500 dark:text-brand-sky-300">
              <Quote className="w-5 h-5 opacity-80 shrink-0" />
              <h2 className="text-xs font-mono font-bold tracking-widest uppercase">
                {t.mission_title}
              </h2>
            </div>

            <p className="text-xl sm:text-2xl font-display font-medium text-brand-slate-800 dark:text-white leading-relaxed italic border-l-2 border-brand-blue-500/30 pl-4">
              «{t.mission_text}»
            </p>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 pt-2 text-brand-slate-500 dark:text-brand-slate-300">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-brand-blue-500 shrink-0" />
                <span className="text-[10px] font-mono tracking-wider uppercase font-semibold">
                  {currentLang === 'uk' ? 'Безпека як цінність' : 'Safety as Value'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-brand-blue-500 shrink-0" />
                <span className="text-[10px] font-mono tracking-wider uppercase font-semibold">
                  {currentLang === 'uk' ? 'Розвиток ринку' : 'Market Development'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Benefits Cards Grid (span 8) */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {cards.map((card, idx) => {
                const Icon = card.icon;
                const isHovered = hoveredCardIndex === idx;
                const isAnyCardHovered = hoveredCardIndex !== null;
                const delayMs = idx * 100; // 80ms - 120ms staggered entry delay
                const isBlue = idx % 2 === 0;

                // Staggered entry transition styles when visible
                const entryStyle: React.CSSProperties = {
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible 
                    ? (isHovered ? 'translateY(-12px)' : 'translateY(0)')
                    : 'translateX(24px)',
                  transition: isVisible 
                    ? 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1), border-color 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)' 
                    : `opacity 500ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms, transform 500ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms`,
                  zIndex: isHovered ? 20 : 10,
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)'
                };

                return (
                  <div
                    key={idx}
                    style={entryStyle}
                    onMouseEnter={() => setHoveredCardIndex(idx)}
                    onMouseLeave={() => setHoveredCardIndex(null)}
                    onTouchStart={() => setHoveredCardIndex(idx)}
                    className={`relative rounded-2xl p-6 shadow-md border overflow-hidden cursor-default transition-[transform,box-shadow,border-color,opacity] duration-300 select-none
                      ${isBlue ? 'border-l-[3px] border-l-brand-blue-500' : 'border-l-[3px] border-l-amber-500'}
                      ${isHovered 
                        ? 'glass-card border-brand-blue-500/80 shadow-lg shadow-brand-blue-500/5 dark:shadow-brand-blue-500/10' 
                        : 'glass-card border-brand-slate-200/50 dark:border-brand-slate-800/20'
                      }
                      ${isAnyCardHovered && !isHovered ? 'opacity-72' : 'opacity-100'}
                    `}
                  >
                    {/* Fold corner effect */}
                    <div 
                      className="absolute top-0 right-0 w-[10px] h-[10px] bg-slate-200/60 dark:bg-slate-800/60 border-l border-b border-slate-300/40 dark:border-slate-700/40 pointer-events-none z-10"
                      style={{
                        borderBottomLeftRadius: '2px',
                        clipPath: 'polygon(0 0, 100% 100%, 0 100%)'
                      }}
                    />

                    {/* Faint watermark Icon */}
                    <Icon className={`absolute -right-3 -bottom-3 w-20 h-20 pointer-events-none transition-transform duration-500 ${isHovered ? 'scale-110' : ''} ${isBlue ? 'text-brand-blue-500/[0.03] dark:text-brand-blue-400/[0.015]' : 'text-amber-500/[0.03] dark:text-amber-400/[0.015]'}`} />

                    <div className="space-y-4 relative z-10">
                      {/* Icon Container */}
                      <div className={`inline-flex items-center justify-center p-3 rounded-xl transition-transform duration-300 ${card.color} ${isHovered ? 'scale-110' : ''}`}>
                        <Icon className="w-5.5 h-5.5" />
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-display font-bold text-brand-slate-900 dark:text-white leading-tight">
                        {card.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-brand-slate-600 dark:text-brand-slate-300 leading-relaxed">
                        {card.description}
                      </p>
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
