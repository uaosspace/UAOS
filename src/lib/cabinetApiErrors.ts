import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'

type CabinetCopy = (typeof TRANSLATIONS)[Locale]

/**
 * Maps known member-API English error strings to localized cabinet copy.
 * Unknown messages fall back to a generic localized request error (never raw English).
 */
export function localizeCabinetApiError(message: string | null | undefined, t: CabinetCopy): string {
  const raw = (message || '').trim()
  if (!raw) return t.cabinet_request_failed

  if (raw.includes('Invalid credentials')) return t.cabinet_invalid_credentials
  if (raw.includes('Invalid current password') || raw.includes('Current password is incorrect')) {
    return t.cabinet_invalid_current_password
  }
  if (raw.includes('currentPassword and newPassword required')) {
    return t.cabinet_password_fields_required
  }
  if (raw.includes('Password must be at least')) return t.cabinet_password_too_short
  if (raw.includes('Password is too long')) return t.cabinet_password_too_long
  if (raw.includes('Password must not contain whitespace')) return t.cabinet_password_whitespace
  if (raw.includes('New password must differ')) return t.cabinet_password_must_differ
  if (raw === 'Unauthorized') return t.cabinet_unauthorized
  if (raw === 'Forbidden') return t.cabinet_forbidden
  if (raw === 'Too many requests') return t.cabinet_too_many_requests
  if (raw === 'Not found' || raw.includes('Meeting not available') || raw.includes('Meeting unavailable')) {
    return t.cabinet_meeting_unavailable
  }
  if (
    raw.includes('Password change failed') ||
    raw.includes('Could not change password') ||
    raw.includes('Update failed') ||
    raw.includes('Request failed') ||
    raw.includes('Login failed') ||
    raw.includes('Logout failed')
  ) {
    return t.cabinet_request_failed
  }

  return t.cabinet_request_failed
}
