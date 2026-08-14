import type {Locale} from '../data/locales'

const LOCALE_TAG: Record<Locale, string> = {
  uk: 'uk-UA',
  en: 'en-GB',
  de: 'de-DE',
  es: 'es-ES',
  kk: 'kk-KZ',
  fr: 'fr-FR',
}

export function formatCabinetEventWhen(startAt: string, lang: Locale): string {
  const date = new Date(startAt)
  if (Number.isNaN(date.getTime())) return startAt
  return new Intl.DateTimeFormat(LOCALE_TAG[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Statuses where the join button should be active in the member cabinet. */
export function isCabinetMeetingJoinable(status: string | null | undefined): boolean {
  if (!status) return false
  return status === 'ready' || status === 'live' || status === 'awaiting_artifacts'
}

export type CabinetMeetingStatusKey =
  | 'ready'
  | 'live'
  | 'pending'
  | 'ended'
  | 'error'
  | 'cancelled'
  | 'unavailable'

export function cabinetMeetingStatusKey(status: string | null | undefined): CabinetMeetingStatusKey {
  switch (status) {
    case 'ready':
      return 'ready'
    case 'live':
      return 'live'
    case 'pending':
      return 'pending'
    case 'awaiting_artifacts':
    case 'ended':
      return 'ended'
    case 'sync_error':
      return 'error'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'unavailable'
  }
}
