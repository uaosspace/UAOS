import {getSql} from '../db.js'
import type {MeetingStatus} from './types.js'

export type MeetingRow = {
  id: string
  eventId: string
  provider: string
  externalId: string
  externalUuid: string
  joinUrl: string
  startUrlEncrypted: string
  status: MeetingStatus
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  timezone: string
  lastSyncError: string
  createdAt: string
  updatedAt: string
}

function mapMeeting(row: Record<string, unknown>): MeetingRow {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    provider: String(row.provider),
    externalId: String(row.external_id ?? ''),
    externalUuid: String(row.external_uuid ?? ''),
    joinUrl: String(row.join_url ?? ''),
    startUrlEncrypted: String(row.start_url_encrypted ?? ''),
    status: String(row.status ?? 'pending') as MeetingStatus,
    scheduledStartAt: row.scheduled_start_at ? new Date(String(row.scheduled_start_at)).toISOString() : null,
    scheduledEndAt: row.scheduled_end_at ? new Date(String(row.scheduled_end_at)).toISOString() : null,
    timezone: String(row.timezone ?? 'Europe/Kyiv'),
    lastSyncError: String(row.last_sync_error ?? ''),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }
}

/** Public/admin DTO without start URL. */
export function toMeetingPublicDto(meeting: MeetingRow) {
  return {
    id: meeting.id,
    eventId: meeting.eventId,
    provider: meeting.provider,
    externalId: meeting.externalId,
    status: meeting.status,
    joinUrl: meeting.joinUrl,
    scheduledStartAt: meeting.scheduledStartAt,
    scheduledEndAt: meeting.scheduledEndAt,
    timezone: meeting.timezone,
    lastSyncError: meeting.lastSyncError,
  }
}

export async function getMeetingByEventId(eventId: string): Promise<MeetingRow | null> {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM meetings WHERE event_id = ${eventId}::uuid ORDER BY created_at DESC LIMIT 1
  `
  return rows[0] ? mapMeeting(rows[0] as Record<string, unknown>) : null
}

export async function getMeetingById(id: string): Promise<MeetingRow | null> {
  const sql = getSql()
  const rows = await sql`SELECT * FROM meetings WHERE id = ${id}::uuid LIMIT 1`
  return rows[0] ? mapMeeting(rows[0] as Record<string, unknown>) : null
}

export async function findMeetingByExternal(
  provider: string,
  externalId: string,
  externalUuid?: string,
): Promise<MeetingRow | null> {
  const sql = getSql()
  if (externalUuid) {
    const byUuid = await sql`
      SELECT * FROM meetings
      WHERE provider = ${provider} AND external_uuid = ${externalUuid}
      LIMIT 1
    `
    if (byUuid[0]) return mapMeeting(byUuid[0] as Record<string, unknown>)
  }
  if (!externalId) return null
  const rows = await sql`
    SELECT * FROM meetings
    WHERE provider = ${provider} AND external_id = ${externalId}
    ORDER BY updated_at DESC
    LIMIT 1
  `
  return rows[0] ? mapMeeting(rows[0] as Record<string, unknown>) : null
}

export async function insertMeeting(input: {
  eventId: string
  provider: string
  externalId: string
  externalUuid: string
  joinUrl: string
  startUrlEncrypted: string
  status: MeetingStatus
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  timezone: string
  lastSyncError?: string
}): Promise<MeetingRow> {
  const sql = getSql()
  const rows = await sql`
    INSERT INTO meetings (
      event_id, provider, external_id, external_uuid, join_url, start_url_encrypted,
      status, scheduled_start_at, scheduled_end_at, timezone, last_sync_error
    ) VALUES (
      ${input.eventId}::uuid,
      ${input.provider},
      ${input.externalId},
      ${input.externalUuid},
      ${input.joinUrl},
      ${input.startUrlEncrypted},
      ${input.status},
      ${input.scheduledStartAt},
      ${input.scheduledEndAt},
      ${input.timezone},
      ${input.lastSyncError ?? ''}
    )
    RETURNING *
  `
  return mapMeeting(rows[0] as Record<string, unknown>)
}

export async function updateMeetingRow(
  id: string,
  patch: Partial<{
    externalId: string
    externalUuid: string
    joinUrl: string
    startUrlEncrypted: string
    status: MeetingStatus
    scheduledStartAt: string | null
    scheduledEndAt: string | null
    timezone: string
    lastSyncError: string
  }>,
): Promise<MeetingRow | null> {
  const existing = await getMeetingById(id)
  if (!existing) return null
  const next = {
    externalId: patch.externalId ?? existing.externalId,
    externalUuid: patch.externalUuid ?? existing.externalUuid,
    joinUrl: patch.joinUrl ?? existing.joinUrl,
    startUrlEncrypted: patch.startUrlEncrypted ?? existing.startUrlEncrypted,
    status: patch.status ?? existing.status,
    scheduledStartAt: patch.scheduledStartAt === undefined ? existing.scheduledStartAt : patch.scheduledStartAt,
    scheduledEndAt: patch.scheduledEndAt === undefined ? existing.scheduledEndAt : patch.scheduledEndAt,
    timezone: patch.timezone ?? existing.timezone,
    lastSyncError: patch.lastSyncError ?? existing.lastSyncError,
  }
  const sql = getSql()
  const rows = await sql`
    UPDATE meetings SET
      external_id = ${next.externalId},
      external_uuid = ${next.externalUuid},
      join_url = ${next.joinUrl},
      start_url_encrypted = ${next.startUrlEncrypted},
      status = ${next.status},
      scheduled_start_at = ${next.scheduledStartAt},
      scheduled_end_at = ${next.scheduledEndAt},
      timezone = ${next.timezone},
      last_sync_error = ${next.lastSyncError},
      updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING *
  `
  return rows[0] ? mapMeeting(rows[0] as Record<string, unknown>) : null
}

export async function getEventMeetingContext(eventId: string) {
  const sql = getSql()
  const rows = await sql`
    SELECT id, slug, status, visibility, access_min_role, participation_mode, start_at, end_at, time_zone,
           title_uk, title_en, title_i18n
    FROM content_events WHERE id = ${eventId}::uuid LIMIT 1
  `
  if (!rows[0]) return null
  const row = rows[0] as Record<string, unknown>
  return {
    id: String(row.id),
    slug: String(row.slug ?? ''),
    status: String(row.status ?? 'draft'),
    visibility: String(row.visibility ?? 'public'),
    accessMinRole: String(row.access_min_role ?? ''),
    participationMode: String(row.participation_mode ?? 'offline'),
    startAt: new Date(String(row.start_at)).toISOString(),
    endAt: row.end_at ? new Date(String(row.end_at)).toISOString() : null,
    timezone: String(row.time_zone ?? 'Europe/Kyiv'),
    titleUk: String(row.title_uk ?? ''),
    titleEn: String(row.title_en ?? ''),
  }
}
