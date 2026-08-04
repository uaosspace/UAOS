import type {Locale} from '../../data/locales'
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AssociationEvent } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { DateTime } from 'luxon';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Archive } from 'lucide-react';
import { isPastEvent, toEventZone, sortEventsAscending, sortEventsDescending } from '../../utils/eventDate';
import EventDetails from './EventDetails';

interface EventsCalendarModalProps {
  open: boolean;
  events: AssociationEvent[];
  selectedEventId: string | null;
  currentLang: Locale;
  onSelectEvent: (id: string | null) => void;
  onClose: () => void;
}

type TabType = 'upcoming' | 'calendar' | 'archive';

export default function EventsCalendarModal({
  open,
  events,
  selectedEventId,
  currentLang,
  onSelectEvent,
  onClose
}: EventsCalendarModalProps) {
  const t = TRANSLATIONS[currentLang];
  const weekdayLabels = t.events_weekdays_short.split(',');
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [currentMonth, setCurrentMonth] = useState<DateTime>(DateTime.utc().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<DateTime | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Focus management & lock scroll
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      document.body.style.overflow = '';
      if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
      }
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Initial tab selection if event is provided
  useEffect(() => {
    if (open && selectedEventId) {
      const event = events.find(e => e.id === selectedEventId);
      if (event) {
        if (isPastEvent(event)) {
          setActiveTab('archive');
        } else {
          setActiveTab('upcoming');
        }
        // Jump to month if opening calendar
        setCurrentMonth(toEventZone(event.startAt, event.timeZone).startOf('month'));
      }
    }
  }, [open, selectedEventId, events]);

  if (!open) return null;

  const publishedEvents = events.filter(e => e.published);
  const upcomingEvents = sortEventsAscending(publishedEvents.filter(e => !isPastEvent(e)));
  const archiveEvents = sortEventsDescending(publishedEvents.filter(e => isPastEvent(e)));

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const nextMonth = () => setCurrentMonth(currentMonth.plus({ months: 1 }));
  const prevMonth = () => setCurrentMonth(currentMonth.minus({ months: 1 }));
  const goToday = () => {
    const today = DateTime.utc();
    setCurrentMonth(today.startOf('month'));
    setSelectedDate(today.startOf('day'));
  };

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) || null : null;

  // Calendar grid logic
  const startDay = currentMonth.startOf('week'); // Monday
  const endDay = currentMonth.endOf('month').endOf('week'); // Sunday
  const days = [];
  let d = startDay;
  while (d <= endDay) {
    days.push(d);
    d = d.plus({ days: 1 });
  }

  const eventsForDay = (day: DateTime) => {
    return publishedEvents.filter(e => {
      const eStart = toEventZone(e.startAt, e.timeZone).startOf('day');
      const eEnd = toEventZone(e.endAt, e.timeZone).startOf('day');
      return day >= eStart && day <= eEnd;
    });
  };

  const renderEventList = (list: AssociationEvent[], emptyMsg: string) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-brand-slate-500">
          <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
          <p>{emptyMsg}</p>
        </div>
      );
    }
    return (
      <div className="space-y-3 p-4">
        {list.map(evt => {
          const isPast = isPastEvent(evt);
          const typeKey = `events_${evt.type}` as keyof typeof t;
          return (
            <div 
              key={evt.id}
              onClick={() => onSelectEvent(evt.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedEventId === evt.id 
                  ? 'border-brand-blue-500 bg-brand-blue-50 dark:bg-brand-blue-900/20' 
                  : 'border-brand-slate-200 dark:border-brand-slate-700 bg-white dark:bg-brand-slate-800 hover:border-brand-blue-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  evt.type === 'training' ? 'text-brand-blue-500' :
                  evt.type === 'meeting' ? 'text-amber-500' : 'text-indigo-500'
                }`}>
                  {t[typeKey] || evt.type}
                </span>
                <span className="text-xs font-mono text-brand-slate-500">
                  {toEventZone(evt.startAt, evt.timeZone).setLocale(currentLang).toFormat('dd MMM yyyy, HH:mm')}
                </span>
              </div>
              <h4 className="font-display font-bold text-brand-slate-900 dark:text-white leading-snug">
                {evt.title[currentLang]}
              </h4>
            </div>
          );
        })}
      </div>
    );
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-slate-900/60 backdrop-blur-sm p-0 md:p-4 lg:p-8"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      ref={modalRef}
    >
      <div className="bg-brand-slate-50 dark:bg-brand-slate-900 w-full h-[100dvh] md:h-[min(85vh,900px)] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden min-h-0 max-w-6xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white dark:bg-brand-slate-800 border-b border-brand-slate-200 dark:border-brand-slate-700 shrink-0">
          <div className="flex gap-2 bg-brand-slate-100 dark:bg-brand-slate-900 p-1 rounded-lg">
            <button
              onClick={() => { setActiveTab('upcoming'); onSelectEvent(null); }}
              className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'upcoming' ? 'bg-white dark:bg-brand-slate-800 shadow-sm text-brand-slate-900 dark:text-white' : 'text-brand-slate-600 dark:text-brand-slate-300 hover:text-brand-slate-900 dark:hover:text-white'}`}
            >
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 hidden sm:block" />{t.events_upcoming_tab}</span>
            </button>
            <button
              onClick={() => { setActiveTab('calendar'); onSelectEvent(null); }}
              className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'calendar' ? 'bg-white dark:bg-brand-slate-800 shadow-sm text-brand-slate-900 dark:text-white' : 'text-brand-slate-600 dark:text-brand-slate-300 hover:text-brand-slate-900 dark:hover:text-white'}`}
            >
              <span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 hidden sm:block" />{t.events_calendar_tab}</span>
            </button>
            <button
              onClick={() => { setActiveTab('archive'); onSelectEvent(null); }}
              className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'archive' ? 'bg-white dark:bg-brand-slate-800 shadow-sm text-brand-slate-900 dark:text-white' : 'text-brand-slate-600 dark:text-brand-slate-300 hover:text-brand-slate-900 dark:hover:text-white'}`}
            >
              <span className="flex items-center gap-2"><Archive className="w-4 h-4 hidden sm:block" />{t.events_archive_tab}</span>
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-brand-slate-500 hover:text-brand-slate-900 dark:hover:text-white hover:bg-brand-slate-100 dark:hover:bg-brand-slate-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* Mobile Details Overlay */}
          {selectedEvent && (
            <div className="absolute inset-0 z-10 bg-brand-slate-50 dark:bg-brand-slate-900 lg:hidden flex flex-col min-h-0">
              <div className="px-4 py-3 bg-white dark:bg-brand-slate-800 border-b border-brand-slate-200 dark:border-brand-slate-700 shrink-0">
                <button 
                  onClick={() => onSelectEvent(null)}
                  className="text-sm font-medium text-brand-slate-600 hover:text-brand-slate-900 dark:text-brand-slate-300 dark:hover:text-white flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> {t.events_back_to_list}
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden p-0">
                <EventDetails event={selectedEvent} currentLang={currentLang} />
              </div>
            </div>
          )}

          {/* Left Panel: Lists or Calendar */}
          <div className="flex-1 lg:max-w-[400px] border-r border-brand-slate-200 dark:border-brand-slate-700 bg-brand-slate-50 dark:bg-brand-slate-900/50 flex flex-col h-full min-h-0 overflow-hidden shrink-0">
            {activeTab === 'upcoming' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {renderEventList(upcomingEvents, t.events_no_upcoming)}
              </div>
            )}

            {activeTab === 'archive' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {renderEventList(archiveEvents, t.events_empty)}
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 bg-white dark:bg-brand-slate-800 border-b border-brand-slate-200 dark:border-brand-slate-700 flex items-center justify-between shrink-0">
                  <h3 className="font-display font-bold text-lg capitalize text-brand-slate-900 dark:text-white">
                    {currentMonth.setLocale(currentLang).toFormat('LLLL yyyy')}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button onClick={goToday} className="px-2 py-1 text-xs font-medium text-brand-blue-600 hover:bg-brand-blue-50 dark:hover:bg-brand-blue-900/20 rounded mr-2">
                      {t.events_today}
                    </button>
                    <button onClick={prevMonth} className="p-1 rounded-md hover:bg-brand-slate-100 dark:hover:bg-brand-slate-700 text-brand-slate-600 dark:text-brand-slate-300">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextMonth} className="p-1 rounded-md hover:bg-brand-slate-100 dark:hover:bg-brand-slate-700 text-brand-slate-600 dark:text-brand-slate-300">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {weekdayLabels.map((day, i) => (
                      <div key={i} className="text-xs font-semibold text-brand-slate-400 py-1">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {days.map(day => {
                      const isCurrentMonth = day.month === currentMonth.month;
                      const isToday = day.hasSame(DateTime.utc(), 'day');
                      const isSelected = selectedDate && day.hasSame(selectedDate, 'day');
                      const dayEvents = eventsForDay(day);

                      return (
                        <div 
                          key={day.toISO()}
                          onClick={() => { setSelectedDate(day); onSelectEvent(null); }}
                          className={`
                            aspect-square flex flex-col items-center justify-start pt-1.5 pb-1 rounded-lg cursor-pointer transition-colors relative
                            ${!isCurrentMonth ? 'opacity-30' : ''}
                            ${isSelected ? 'bg-brand-blue-100 dark:bg-brand-blue-900/40 text-brand-blue-700 dark:text-brand-sky-300 font-bold' : 'hover:bg-brand-slate-100 dark:hover:bg-brand-slate-800 text-brand-slate-700 dark:text-brand-slate-200'}
                          `}
                        >
                          <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${isToday && !isSelected ? 'bg-brand-blue-500 text-white font-bold' : ''}`}>
                            {day.day}
                          </span>
                          <div className="flex gap-0.5 mt-auto mb-1">
                            {dayEvents.slice(0, 3).map((e, i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                                e.type === 'training' ? 'bg-brand-blue-500' :
                                e.type === 'meeting' ? 'bg-amber-500' : 'bg-indigo-500'
                              }`} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {selectedDate && (
                    <div className="mt-6 border-t border-brand-slate-200 dark:border-brand-slate-700 pt-4">
                      <h4 className="text-sm font-semibold mb-3 text-brand-slate-700 dark:text-brand-slate-200">
                        {selectedDate.setLocale(currentLang).toFormat('d MMMM yyyy')}
                      </h4>
                      {renderEventList(eventsForDay(selectedDate), t.events_no_day_events)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Details (Desktop) */}
          <div className="hidden lg:flex flex-col flex-1 min-h-0 overflow-hidden bg-brand-slate-100 dark:bg-brand-slate-900/30">
            {selectedEvent ? (
              <div className="h-full min-h-0">
                <EventDetails event={selectedEvent} currentLang={currentLang} />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-brand-slate-400 p-8 text-center">
                <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">{t.events_select_prompt}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
