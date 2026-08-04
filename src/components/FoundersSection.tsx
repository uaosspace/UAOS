import type {Locale} from '../data/locales'
import React, { useState } from 'react';
import { ExternalLink, Users, FileText, ChevronRight, GraduationCap, Newspaper } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

interface FoundersSectionProps {
  currentLang: Locale;
}

export default function FoundersSection({ currentLang }: FoundersSectionProps) {
  const t = TRANSLATIONS[currentLang];
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const founders = [
    {
      id: 'esosh',
      logo: GraduationCap,
      name: {
        uk: 'Асоціація фахівців з безпеки праці ESOSH',
        en: 'ESOSH Association of Occupational Safety Specialists'
      },
      role: t.founder_esosh_role,
      description: {
        uk: 'ESOSH формує професійні цінності, підвищує рівень знань, підтримує законодавчі зміни та розвиває міжнародні зв’язки задля безпечної праці в Україні.',
        en: 'ESOSH cultivates professional values, boosts knowledge level, supports legislative improvements, and advances global links for occupational health in Ukraine.'
      },
      url: 'https://www.esosh.net/',
      btnText: { uk: 'Перейти на сайт ESOSH', en: 'Visit ESOSH website' }
    },
    {
      id: 'journal',
      logo: Newspaper,
      name: {
        uk: 'Науково-виробничий журнал «Охорона праці»',
        en: 'Scientific and Practical Journal "Occupational Safety"'
      },
      role: t.founder_journal_role,
      description: {
        uk: 'Професійне видання, що об’єднує українських та іноземних фахівців і експертів у сфері безпеки та гігієни праці задля створення безпечного й здорового виробничого середовища.',
        en: 'Professional industrial journal uniting Ukrainian and global experts in occupational safety and hygiene to build safe and healthy workspace conditions.'
      },
      url: 'https://ohoronapraci.kiev.ua/',
      btnText: { uk: 'Офіційний сайт журналу', en: 'Visit Journal website' }
    }
  ];

  const structureLinks = [
    { label: { uk: 'Наглядова рада', en: 'Supervisory Board' }, desc: { uk: 'Матеріал готується', en: 'Content is being prepared' } },
    { label: { uk: 'Загальні збори', en: 'General Assembly' }, desc: { uk: 'Матеріал готується', en: 'Content is being prepared' } },
    { label: { uk: 'Правління', en: 'Board of Directors' }, desc: { uk: 'Матеріал готується', en: 'Content is being prepared' } },
    { label: { uk: 'Статут спілки', en: 'Association Statute' }, desc: { uk: 'Матеріал готується', en: 'Content is being prepared' } },
    { label: { uk: 'Положення про органи управління', en: 'Regulations on Governing Bodies' }, desc: { uk: 'Матеріал готується', en: 'Content is being prepared' } }
  ];

  return (
    <section id="founders" className="scroll-mt-24 py-6 lg:py-8 bg-transparent transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 lg:mb-10 space-y-4">
          <h2 className="text-xs font-mono font-bold tracking-widest text-brand-blue-500 dark:text-brand-sky-300 uppercase">
            {t.founders_title}
          </h2>
          <p className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
            {t.founders_subtitle}
          </p>
          <div className="h-1 w-12 bg-brand-blue-500 mx-auto rounded-full"></div>
        </div>

        {/* Founders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {founders.map((founder) => {
            const IconLogo = founder.logo;
            const isBlue = founder.id === 'esosh';
            const isHovered = hoveredId === founder.id;
            const isAnyHovered = hoveredId !== null;

            return (
              <div
                key={founder.id}
                onMouseEnter={() => setHoveredId(founder.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                  transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                  transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1), border-color 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)'
                }}
                className={`relative rounded-2xl p-6 shadow-md border overflow-hidden cursor-default transition-[transform,box-shadow,border-color,opacity] duration-300 flex flex-col justify-between select-none
                  ${isBlue ? 'border-l-[3px] border-l-brand-blue-500' : 'border-l-[3px] border-l-amber-500'}
                  ${isHovered 
                    ? 'glass-card border-brand-blue-500/80 shadow-lg shadow-brand-blue-500/5 dark:shadow-brand-blue-500/10' 
                    : 'glass-card border-brand-slate-200/50 dark:border-brand-slate-800/20'
                  }
                  ${isAnyHovered && !isHovered ? 'opacity-80' : 'opacity-100'}
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
                <IconLogo className={`absolute -right-3 -bottom-3 w-20 h-20 pointer-events-none transition-transform duration-500 ${isHovered ? 'scale-110 rotate-6' : ''} ${isBlue ? 'text-brand-blue-500/[0.03] dark:text-brand-blue-400/[0.015]' : 'text-amber-500/[0.03] dark:text-amber-400/[0.015]'}`} />

                <div className="space-y-4 relative z-10">
                  
                  {/* Founder Logo & Role */}
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center p-3 rounded-xl bg-brand-blue-50 dark:bg-brand-blue-950/40 text-brand-blue-500 shrink-0">
                      <IconLogo className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white leading-snug">
                        {founder.name[currentLang]}
                      </h3>
                      <span className="inline-block mt-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-blue-600 dark:text-brand-sky-300">
                        {founder.role}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-brand-slate-600 dark:text-brand-slate-300 leading-relaxed pt-2">
                    {founder.description[currentLang]}
                  </p>

                  {/* Disclaimer check to fit Section 27 */}
                  {founder.id === 'esosh' && (
                    <div className="p-3 rounded-xl bg-brand-slate-50 dark:bg-brand-slate-950 text-[11px] text-brand-slate-500 italic border border-brand-slate-200/40 dark:border-brand-slate-800/40">
                      {currentLang === 'uk'
                        ? '*Примітка: ESOSH є професійним об’єднанням фахівців і не є державним органом чи інституцією ЄС.'
                        : '*Note: ESOSH is a professional association of experts and does not constitute a state body or European Union authority.'}
                    </div>
                  )}

                </div>

                {/* Website link */}
                <div className="pt-6 relative z-10">
                  <a
                    href={founder.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-blue-500 hover:text-brand-blue-600 dark:text-brand-sky-300 dark:hover:text-brand-sky-400 hover:underline"
                  >
                    <span>{founder.btnText[currentLang]}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            );
          })}
        </div>

        {/* Governing Structure Panel */}
        <div className="rounded-2xl glass-card p-5 lg:p-6 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            
            {/* Left title info */}
            <div className="lg:col-span-4 space-y-3 text-left">
              <div className="inline-flex items-center space-x-1.5 p-1 px-2.5 rounded bg-brand-blue-50 dark:bg-brand-blue-950/40 text-brand-blue-500 font-mono text-[10px] font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>STRUCTURE</span>
              </div>
              <h3 className="text-xl font-display font-bold text-brand-slate-900 dark:text-white leading-tight">
                {t.structure_title}
              </h3>
              <p className="text-xs text-brand-slate-500 dark:text-brand-slate-300 leading-relaxed">
                {t.structure_desc}
              </p>
            </div>

            {/* Right link list - compact horizontal strip */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {structureLinks.map((link, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl glass-pill hover:border-brand-blue-500 dark:hover:border-brand-sky-400 transition-all duration-200 text-left group cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="block text-[11px] font-bold text-brand-slate-800 dark:text-brand-slate-200 leading-tight">
                      {link.label[currentLang]}
                    </span>
                    <FileText className="w-3.5 h-3.5 text-brand-slate-400 group-hover:text-brand-blue-500 transition-colors shrink-0" />
                  </div>
                  <span className="block text-[9px] font-mono text-brand-slate-400 uppercase leading-tight">
                    {link.desc[currentLang]}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
