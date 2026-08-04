import type {Locale} from '../../data/locales'
import React from 'react';
import { AssociationEvent } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { formatEventDay, formatEventMonth, formatEventTime } from '../../utils/eventDate';

interface EventCardProps {
  event: AssociationEvent;
  currentLang: Locale;
  onOpenDetails: (eventId: string) => void;
}

export default function EventCard({ event, currentLang, onOpenDetails }: EventCardProps) {
  const t = TRANSLATIONS[currentLang];
  
  const typeKey = `events_${event.type}` as keyof typeof t;
  const typeText = t[typeKey] || event.type;
  
  const formatKey = `events_${event.format}` as keyof typeof t;
  const formatText = t[formatKey] || event.format;

  const day = formatEventDay(event, currentLang);
  const month = formatEventMonth(event, currentLang);
  const time = formatEventTime(event, currentLang);

  const typeColorClass = 
    event.type === 'training' ? 'text-brand-blue-500' :
    event.type === 'meeting' ? 'text-amber-500' :
    'text-indigo-500';

  const typeBorderClass = 
    event.type === 'training' ? 'border-brand-blue-500/20 group-hover:border-brand-blue-500/40' :
    event.type === 'meeting' ? 'border-amber-500/20 group-hover:border-amber-500/40' :
    'border-indigo-500/20 group-hover:border-indigo-500/40';

  return (
    <div 
      className={`group relative flex flex-col bg-white/80 dark:bg-brand-slate-800/80 backdrop-blur-md border ${typeBorderClass} rounded-2xl p-4 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-blue-500/5 w-full cursor-pointer h-full`}
      onClick={() => onOpenDetails(event.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails(event.id);
        }
      }}
    >
      <div className="flex gap-4 flex-1">
        {/* Date column */}
        <div className="flex flex-col items-center justify-start pt-1 shrink-0 w-12">
          <span className="text-2xl font-display font-bold text-brand-slate-900 dark:text-white leading-none">{day}</span>
          <span className="text-xs font-mono font-bold text-brand-slate-500 dark:text-brand-slate-300 mt-1 uppercase">{month}</span>
        </div>
        
        {/* Content column */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-semibold text-brand-slate-600 dark:text-brand-slate-200">{time}</span>
            <span className="text-xs text-brand-slate-400">•</span>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${typeColorClass}`}>
              {typeText}
            </span>
          </div>
          
          <h4 className="text-base font-display font-bold text-brand-slate-900 dark:text-white leading-snug mb-2 line-clamp-2 group-hover:text-brand-blue-600 dark:group-hover:text-brand-sky-300 transition-colors">
            {event.title[currentLang]}
          </h4>
          
          <div className="text-xs text-brand-slate-600 dark:text-brand-slate-200 line-clamp-1 mb-4">
            <span className="font-semibold">{formatText}</span>
            {event.location && event.location[currentLang] && (
              <>
                <span className="mx-1 text-brand-slate-400">/</span>
                <span className="truncate">{event.location[currentLang]}</span>
              </>
            )}
          </div>
          
          <div className="mt-auto flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-blue-600 dark:text-brand-sky-400 group-hover:underline">
              {t.events_details}
            </span>
            {/* The save button is intentionally not functional directly on the card to avoid stopping propagation complexity, it will just open details where save is available, or we can make it a secondary button */}
            <span className="text-xs font-medium text-brand-slate-500 hover:text-brand-slate-800 dark:hover:text-white transition-colors" aria-label={t.events_save} title={t.events_save}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
