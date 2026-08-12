/**
 * Lightweight member-cabinet event reads.
 * Kept separate from meetingService so /api/member auth routes do not load Zoom/providers.
 */
import {getSql} from '../db.js'
import {canJoinMeeting, canViewEvent} from './access.js'
import {getEventMeetingContext, getMeetingByEventId} from './meetingsRepo.js'
import {getMemberAccessLevel} from './memberRolesRepo.js'
import type {AssignableAccessLevel} from './accessCore.js'

export type MemberCabinetEventItem = {
  id: string
  slug: string
  titleUk: string
  titleEn: string
  shortDescriptionUk: string
  shortDescriptionEn: string
  startAt: string
  endAt: string | null
  timezone: string
  visibility: string
  accessMinRole: string
  meeting: {id: string; status: string; provider: string} | null
}

export async function listMemberAccessibleEvents(
  memberUserId: string,
  knownAccessLevel?: AssignableAccessLevel,
): Promise<MemberCabinetEventItem[]> {
  const accessLevel = knownAccessLevel ?? (await getMemberAccessLevel(memberUserId))
  const sql = getSql()
  const rows = await sql`
    SELECT e.id, e.slug, e.status, e.visibility, e.access_min_role, e.start_at, e.end_at, e.time_zone,
           e.title_i18n, e.title_uk, e.title_en, e.short_description_i18n,
           e.short_description_uk, e.short_description_en,
           m.id AS meeting_id, m.status AS meeting_status, m.provider
    FROM content_events e
    LEFT JOIN LATERAL (
      SELECT id, status, provider FROM meetings
      WHERE event_id = e.id AND status <> 'cancelled'
      ORDER BY created_at DESC
      LIMIT 1
    ) m ON true
    WHERE e.status = 'published'
    ORDER BY e.start_at DESC
  `

  return rows
    .map((row) => {
      const record = row as Record<string, unknown>
      const visibility = String(record.visibility ?? 'public')
      const accessMinRole = String(record.access_min_role ?? '')
      if (!canViewEvent({visibility, accessMinRole, userLevel: accessLevel})) return null
      return {
        id: String(record.id),
        slug: String(record.slug ?? ''),
        titleUk: String(record.title_uk ?? ''),
        titleEn: String(record.title_en ?? ''),
        shortDescriptionUk: String(record.short_description_uk ?? ''),
        shortDescriptionEn: String(record.short_description_en ?? ''),
        startAt: new Date(String(record.start_at)).toISOString(),
        endAt: record.end_at ? new Date(String(record.end_at)).toISOString() : null,
        timezone: String(record.time_zone ?? 'Europe/Kyiv'),
        visibility,
        accessMinRole,
        meeting: record.meeting_id
          ? {
              id: String(record.meeting_id),
              status: String(record.meeting_status ?? ''),
              provider: String(record.provider ?? ''),
            }
          : null,
      }
    })
    .filter((item): item is MemberCabinetEventItem => item != null)
}

export async function getJoinForEventWithLevel(eventId: string, userLevel: string | null) {
  const event = await getEventMeetingContext(eventId)
  if (!event || event.status !== 'published') {
    throw Object.assign(new Error('Not found'), {status: 404})
  }
  if (!canViewEvent({visibility: event.visibility, accessMinRole: event.accessMinRole, userLevel})) {
    throw Object.assign(new Error('Forbidden'), {status: 403})
  }
  if (!canJoinMeeting({accessMinRole: event.accessMinRole, userLevel})) {
    throw Object.assign(new Error('Forbidden'), {status: 403})
  }
  const meeting = await getMeetingByEventId(eventId)
  if (!meeting || !meeting.joinUrl || meeting.status === 'cancelled') {
    throw Object.assign(new Error('Meeting not available'), {status: 404})
  }
  return {
    eventId: event.id,
    status: meeting.status,
    joinUrl: meeting.joinUrl,
    provider: meeting.provider,
  }
}

export async function getMemberJoinForEvent(memberUserId: string, eventId: string) {
  const accessLevel = await getMemberAccessLevel(memberUserId)
  return getJoinForEventWithLevel(eventId, accessLevel)
}
