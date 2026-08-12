import {DateTime} from 'luxon'
import type {Locale} from '../../data/locales'
import {TRANSLATIONS} from '../../data/translations'

export type AdminMeetingInfo = {
  status?: string
  joinUrl?: string
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
  timezone?: string
  lastSyncError?: string
}

type AdminCopy = (typeof TRANSLATIONS)[Locale]

function formatSchedule(meeting: AdminMeetingInfo): string | null {
  const startIso = meeting.scheduledStartAt?.trim()
  if (!startIso) return null
  const zone = meeting.timezone?.trim() || 'Europe/Kyiv'
  const start = DateTime.fromISO(startIso, {zone: 'utc'}).setZone(zone)
  if (!start.isValid) return null
  const endIso = meeting.scheduledEndAt?.trim()
  const end = endIso ? DateTime.fromISO(endIso, {zone: 'utc'}).setZone(zone) : null
  const startText = start.toFormat('dd.MM.yyyy HH:mm')
  if (end?.isValid) {
    return `${startText} – ${end.toFormat('HH:mm')} (${zone})`
  }
  return `${startText} (${zone})`
}

export function describeAdminMeeting(
  meeting: AdminMeetingInfo | null,
  t: AdminCopy,
): {
  headline: string
  schedule: string | null
  joinUrl: string | null
  error: string | null
  missingJoin: boolean
} {
  if (!meeting) {
    return {
      headline: t.admin_meeting_none,
      schedule: null,
      joinUrl: null,
      error: null,
      missingJoin: false,
    }
  }

  const status = String(meeting.status || '').toLowerCase()
  const joinUrl = meeting.joinUrl?.trim() || null
  const schedule = formatSchedule(meeting)
  const syncError = meeting.lastSyncError?.trim() || null

  const headlines: Record<string, string> = {
    ready: t.admin_meeting_status_ready,
    live: t.admin_meeting_status_live,
    ended: t.admin_meeting_status_ended,
    pending: t.admin_meeting_status_pending,
    sync_error: t.admin_meeting_status_sync_error,
    cancelled: t.admin_meeting_status_cancelled,
    awaiting_artifacts: t.admin_meeting_status_awaiting_artifacts,
  }

  const headline = headlines[status] || t.admin_meeting_status_unknown
  const missingJoin = Boolean(status === 'ready' && !joinUrl)

  return {
    headline,
    schedule,
    joinUrl,
    error: status === 'sync_error' ? syncError : null,
    missingJoin,
  }
}
