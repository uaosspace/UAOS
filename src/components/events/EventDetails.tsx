import type {Locale} from '../../data/locales'
import React from 'react';
import { AssociationEvent } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { formatEventDateRange, isPastEvent } from '../../utils/eventDate';
import SaveEventMenu from './SaveEventMenu';
import { shareEvent } from '../../utils/calendarExport';
import { MapPin, Globe, User, Clock, ExternalLink, Share2 } from 'lucide-react';

interface EventDetailsProps {
  event: AssociationEvent;
  currentLang: Locale;
}

export default function EventDetails({ event, currentLang }: EventDetailsProps) {
  const t = TRANSLATIONS[currentLang];
  
  const typeKey = `events_${event.type}` as keyof typeof t;
  const typeText = t[typeKey] || event.type;
  
  const formatKey = `events_${event.format}` as keyof typeof t;
  const formatText = t[formatKey] || event.format;

  const dateRange = formatEventDateRange(event, currentLang);
  const past = isPastEvent(event);

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] rounded-2xl bg-white dark:bg-brand-slate-900">
      {/* Cover + text scroll; actions stay in bottom row (no card-level overflow — dropdowns must escape) */}
      <div className="min-h-0 overflow-y-auto overscroll-contain custom-scrollbar rounded-t-2xl">
        {event.coverImageUrl && (
          <div className="w-full bg-brand-slate-50 dark:bg-brand-slate-800/80 border-b border-brand-slate-100 dark:border-brand-slate-700">
            <img
              src={event.coverImageUrl}
              alt={event.title[currentLang]}
              className="w-full max-h-[min(28vh,200px)] object-contain object-center"
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-full ${
              event.type === 'training' ? 'bg-brand-blue-50 text-brand-blue-600 dark:bg-brand-blue-900/20 dark:text-brand-sky-300' :
              event.type === 'meeting' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300' :
              'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300'
            }`}>
              {typeText}
            </span>
            <span className="px-3 py-1 text-xs font-semibold text-brand-slate-600 dark:text-brand-slate-200 bg-brand-slate-100 dark:bg-brand-slate-800 rounded-full">
              {formatText}
            </span>
            {past && (
              <span className="px-3 py-1 text-xs font-semibold text-brand-slate-500 dark:text-brand-slate-300 bg-brand-slate-100 dark:bg-brand-slate-800 rounded-full">
                {t.events_archive_tab}
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-bold text-brand-slate-900 dark:text-white leading-tight mb-6">
            {event.title[currentLang]}
          </h2>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 text-brand-slate-700 dark:text-brand-slate-200">
              <Clock className="w-5 h-5 text-brand-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{dateRange}</p>
                <p className="text-sm text-brand-slate-500 dark:text-brand-slate-300">{t.events_timezone}</p>
              </div>
            </div>

            {(event.format === 'offline' || event.format === 'hybrid') && event.location && event.location[currentLang] && (
              <div className="flex items-start gap-3 text-brand-slate-700 dark:text-brand-slate-200">
                <MapPin className="w-5 h-5 text-brand-slate-400 shrink-0 mt-0.5" />
                <p>{event.location[currentLang]}</p>
              </div>
            )}

            {(event.format === 'online' || event.format === 'hybrid') && (
              <div className="flex items-start gap-3 text-brand-slate-700 dark:text-brand-slate-200">
                <Globe className="w-5 h-5 text-brand-slate-400 shrink-0 mt-0.5" />
                <p>{t.events_online}</p>
              </div>
            )}

            {event.organizer && event.organizer[currentLang] && (
              <div className="flex items-start gap-3 text-brand-slate-700 dark:text-brand-slate-200">
                <User className="w-5 h-5 text-brand-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-brand-slate-500 dark:text-brand-slate-300">{t.events_organizer}</p>
                  <p>{event.organizer[currentLang]}</p>
                </div>
              </div>
            )}
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg text-brand-slate-700 dark:text-brand-slate-200 mb-6 font-medium">
              {event.shortDescription[currentLang]}
            </p>
            {event.fullDescription && event.fullDescription[currentLang] && (
              <div className="text-brand-slate-600 dark:text-brand-slate-200 whitespace-pre-line">
                {event.fullDescription[currentLang]}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-20 flex flex-col items-stretch gap-3 rounded-b-2xl border-t border-brand-slate-100 bg-brand-slate-50 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-6 dark:border-brand-slate-700 dark:bg-brand-slate-800/50">
        {!past && (
          <>
            {event.registrationUrl && (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-brand-slate-900 dark:bg-white text-white dark:text-brand-slate-900 font-medium rounded-lg hover:bg-brand-slate-800 dark:hover:bg-brand-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                {t.events_registration}
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {event.onlineUrl && (
              <a
                href={event.onlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {t.events_join_online}
                <Globe className="w-4 h-4" />
              </a>
            )}

            <SaveEventMenu event={event} currentLang={currentLang} />
          </>
        )}

        <button
          type="button"
          onClick={() => shareEvent(event, currentLang)}
          className="w-full sm:w-auto px-6 py-3 bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          {t.events_share}
        </button>
      </div>
    </div>
  );
}
