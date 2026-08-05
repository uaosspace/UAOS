import type {Locale} from '../../data/locales'
import {PARTICIPANT_TYPES, SECTORS} from '../../data/referenceLists'
import {TRANSLATIONS} from '../../data/translations'

type T = (typeof TRANSLATIONS)[Locale]

export function statusLabel(t: T, status: string): string {
  switch (status) {
    case 'pending':
      return t.admin_app_status_pending
    case 'reviewed':
      return t.admin_app_status_reviewed
    case 'accepted':
      return t.admin_app_status_accepted
    case 'rejected':
      return t.admin_app_status_rejected
    default:
      return status || t.admin_unknown
  }
}

export function applicantKindLabel(lang: Locale, t: T, kind: string): string {
  const value = kind.trim()
  if (!value || value === 'unknown') return t.admin_unknown
  const found = PARTICIPANT_TYPES.find((item) => item.id === value)
  return found ? found.label[lang] : value
}

export function sectorLabel(lang: Locale, t: T, sector: string): string {
  const value = sector.trim()
  if (!value || value === 'unknown') return t.admin_unknown
  const found = SECTORS.find((item) => item.id === value)
  return found ? found.label[lang] : value
}

export function statsKeyLabel(
  kind: 'status' | 'applicantKind' | 'sector',
  key: string,
  lang: Locale,
  t: T,
): string {
  if (kind === 'status') return statusLabel(t, key)
  if (kind === 'applicantKind') return applicantKindLabel(lang, t, key)
  return sectorLabel(lang, t, key)
}
