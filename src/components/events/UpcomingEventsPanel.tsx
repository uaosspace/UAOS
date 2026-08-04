import type {Locale} from '../../data/locales'
import React from 'react';
import { AssociationEvent } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { isPastEvent } from '../../utils/eventDate';
import EventCard from './EventCard';
import { ArrowRight } from 'lucide-react';

interface UpcomingEventsPanelProps {
  events: AssociationEvent[];
  currentLang: Locale;
  onOpenEvents: (eventId?: string) => void;
}

export default function UpcomingEventsPanel({ events, currentLang, onOpenEvents }: UpcomingEventsPanelProps) {
  const t = TRANSLATIONS[currentLang];
  
  const upcoming = events
    .filter(event => event.published && !isPastEvent(event))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 3);

  if (upcoming.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-white/5 dark:bg-brand-slate-800/20 backdrop-blur-sm border border-brand-slate-200/50 dark:border-brand-slate-700/50 p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-brand-slate-600 dark:text-brand-slate-300">
          {t.events_no_upcoming}
        </span>
        <button 
          onClick={() => onOpenEvents()}
          className="text-sm font-semibold text-brand-blue-600 dark:text-brand-sky-400 hover:underline flex items-center gap-1"
        >
          {t.events_all}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-brand-slate-500 dark:text-brand-slate-300">
          {t.events_upcoming}
        </h3>
        <button 
          onClick={() => onOpenEvents()}
          className="text-sm font-semibold text-brand-blue-600 dark:text-brand-sky-400 hover:text-brand-blue-700 dark:hover:text-brand-sky-300 transition-colors flex items-center gap-1 group"
        >
          {t.events_all}
        </button>
      </div>
      
      <div className="flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide lg:grid lg:grid-cols-2 2xl:grid-cols-3">
        {upcoming.map((event, index) => (
          <div 
            key={event.id} 
            className={`snap-center w-[82vw] min-w-[280px] max-w-[340px] sm:w-[320px] lg:w-auto lg:max-w-none shrink-0 flex flex-col h-full relative ${index === 2 ? 'hidden 2xl:block' : ''}`}
            style={{ zIndex: 10 + index * 10 }}
          >
             <EventCard
                event={event}
                currentLang={currentLang}
                onOpenDetails={onOpenEvents}
             />
          </div>
        ))}
      </div>
    </div>
  );
}
