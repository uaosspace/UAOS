import type {Locale} from '../data/locales'
import { DateTime } from 'luxon';
import { AssociationEvent } from '../types';

export function toEventZone(dateInput: string, timeZone: string): DateTime {
  return DateTime.fromISO(dateInput, { zone: 'utc' }).setZone(timeZone);
}

export function formatEventDay(event: AssociationEvent, lang: Locale): string {
  const dt = toEventZone(event.startAt, event.timeZone);
  return dt.toFormat('d');
}

export function formatEventMonth(event: AssociationEvent, lang: Locale): string {
  const dt = toEventZone(event.startAt, event.timeZone).setLocale(lang);
  return dt.toFormat('MMM').toUpperCase();
}

export function formatEventTime(event: AssociationEvent, lang: Locale): string {
  const dt = toEventZone(event.startAt, event.timeZone);
  return dt.toFormat('HH:mm');
}

export function formatEventDateRange(event: AssociationEvent, lang: Locale): string {
  const start = toEventZone(event.startAt, event.timeZone).setLocale(lang);
  const end = toEventZone(event.endAt, event.timeZone).setLocale(lang);
  
  const startDateStr = start.toFormat('dd MMMM yyyy');
  const startTimeStr = start.toFormat('HH:mm');
  const endTimeStr = end.toFormat('HH:mm');

  // If same day
  if (start.hasSame(end, 'day')) {
    return `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
  }

  // If different day
  const endDateStr = end.toFormat('dd MMMM yyyy');
  return `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
}

export function isPastEvent(event: AssociationEvent): boolean {
  const end = DateTime.fromISO(event.endAt, { zone: 'utc' });
  const now = DateTime.utc();
  return end < now;
}

export function isUpcomingEvent(event: AssociationEvent): boolean {
  return !isPastEvent(event);
}

export function sortEventsAscending(events: AssociationEvent[]): AssociationEvent[] {
  return [...events].sort((a, b) => {
    return DateTime.fromISO(a.startAt).toMillis() - DateTime.fromISO(b.startAt).toMillis();
  });
}

export function sortEventsDescending(events: AssociationEvent[]): AssociationEvent[] {
  return [...events].sort((a, b) => {
    return DateTime.fromISO(b.startAt).toMillis() - DateTime.fromISO(a.startAt).toMillis();
  });
}

export function getEventsForDay(events: AssociationEvent[], date: DateTime): AssociationEvent[] {
  return events.filter(event => {
    const start = toEventZone(event.startAt, event.timeZone);
    return start.hasSame(date, 'day');
  });
}

export function getEventsForMonth(events: AssociationEvent[], year: number, month: number): AssociationEvent[] {
  return events.filter(event => {
    const start = toEventZone(event.startAt, event.timeZone);
    return start.year === year && start.month === month;
  });
}
