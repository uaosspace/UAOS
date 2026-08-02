import type {Locale} from '../data/locales'
import { AssociationEvent } from '../types';
import { DateTime } from 'luxon';

function buildPublicUrl(eventId: string): string {
  const origin = window.location.origin;
  const path = window.location.pathname;
  return `${origin}${path}?event=${eventId}`;
}

export function getGoogleCalendarUrl(event: AssociationEvent, lang: Locale): string {
  const start = DateTime.fromISO(event.startAt, { zone: 'utc' }).toFormat("yyyyMMdd'T'HHmmss'Z'");
  const end = DateTime.fromISO(event.endAt, { zone: 'utc' }).toFormat("yyyyMMdd'T'HHmmss'Z'");
  
  const title = event.title[lang];
  const desc = `${event.shortDescription[lang]}\n\n${buildPublicUrl(event.id)}`;
  const location = event.location ? event.location[lang] : '';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: desc,
    location: location,
    ctz: event.timeZone
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getOutlookCalendarUrl(event: AssociationEvent, lang: Locale): string {
  const start = DateTime.fromISO(event.startAt, { zone: 'utc' }).toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
  const end = DateTime.fromISO(event.endAt, { zone: 'utc' }).toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
  
  const title = event.title[lang];
  const desc = `${event.shortDescription[lang]}\n\n${buildPublicUrl(event.id)}`;
  const location = event.location ? event.location[lang] : '';

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: start,
    enddt: end,
    subject: title,
    body: desc,
    location: location
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function escapeIcsText(str: string): string {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateIcsBlob(event: AssociationEvent, lang: Locale): Blob {
  const start = DateTime.fromISO(event.startAt, { zone: 'utc' }).toFormat("yyyyMMdd'T'HHmmss'Z'");
  const end = DateTime.fromISO(event.endAt, { zone: 'utc' }).toFormat("yyyyMMdd'T'HHmmss'Z'");
  const now = DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const uid = `${event.id}@uaos`;

  const title = escapeIcsText(event.title[lang]);
  const desc = escapeIcsText(`${event.shortDescription[lang]}\n\n${buildPublicUrl(event.id)}`);
  const location = escapeIcsText(event.location ? event.location[lang] : '');
  const url = buildPublicUrl(event.id);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UAOS//Events//UK',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${location}`,
    `URL:${url}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
}

export function downloadIcs(event: AssociationEvent, lang: Locale) {
  const blob = generateIcsBlob(event, lang);
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  
  const safeName = event.title.en.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `uaos-event-${safeName || event.id}.ics`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

export function copyEventLink(event: AssociationEvent): Promise<void> {
  const url = buildPublicUrl(event.id);
  return navigator.clipboard.writeText(url);
}

export function getTelegramShareUrl(event: AssociationEvent, lang: Locale): string {
  const url = encodeURIComponent(buildPublicUrl(event.id));
  const text = encodeURIComponent(event.title[lang]);
  return `https://t.me/share/url?url=${url}&text=${text}`;
}

export function getFacebookShareUrl(event: AssociationEvent, lang: Locale): string {
  const url = encodeURIComponent(buildPublicUrl(event.id));
  return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
}

export function getLinkedInShareUrl(event: AssociationEvent, lang: Locale): string {
  const url = encodeURIComponent(buildPublicUrl(event.id));
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
}

export function getViberShareUrl(event: AssociationEvent, lang: Locale): string {
  const url = encodeURIComponent(buildPublicUrl(event.id));
  const text = encodeURIComponent(`${event.title[lang]} ${buildPublicUrl(event.id)}`);
  return `viber://forward?text=${text}`;
}

export function getTwitterShareUrl(event: AssociationEvent, lang: Locale): string {
  const url = encodeURIComponent(buildPublicUrl(event.id));
  const text = encodeURIComponent(event.title[lang]);
  return `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
}

export function getWhatsAppShareUrl(event: AssociationEvent, lang: Locale): string {
  const url = encodeURIComponent(buildPublicUrl(event.id));
  const text = encodeURIComponent(`${event.title[lang]} `);
  return `https://api.whatsapp.com/send?text=${text}${url}`;
}

export function getEmailShareUrl(event: AssociationEvent, lang: Locale): string {
  const url = buildPublicUrl(event.id);
  const subject = encodeURIComponent(event.title[lang]);
  const body = encodeURIComponent(`${event.shortDescription[lang]}\n\n${url}`);
  return `mailto:?subject=${subject}&body=${body}`;
}

export async function shareEvent(event: AssociationEvent, lang: Locale): Promise<void> {
  const url = buildPublicUrl(event.id);
  if (navigator.share) {
    try {
      await navigator.share({
        title: event.title[lang],
        text: event.shortDescription[lang],
        url: url
      });
      return;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  }
  
  await copyEventLink(event);
}
