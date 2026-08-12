import {getSql} from '../db.js'

export type MeetingNotifyKind = 'created' | 'reminder'

export async function tryClaimNotification(
  meetingId: string,
  kind: MeetingNotifyKind,
  recipientEmail: string,
): Promise<boolean> {
  const sql = getSql()
  const email = recipientEmail.trim().toLowerCase()
  try {
    await sql`
      INSERT INTO meeting_notifications (meeting_id, kind, recipient_email)
      VALUES (${meetingId}::uuid, ${kind}, ${email})
    `
    return true
  } catch {
    return false
  }
}

export async function listDueReminderMeetings(nowIso: string, windowEndIso: string) {
  const sql = getSql()
  const rows = await sql`
    SELECT m.id, m.event_id, m.scheduled_start_at, m.status,
           e.slug, e.visibility, e.access_min_role, e.title_uk, e.title_en, e.time_zone
    FROM meetings m
    JOIN content_events e ON e.id = m.event_id
    WHERE m.status IN ('ready', 'live', 'awaiting_artifacts')
      AND m.scheduled_start_at IS NOT NULL
      AND m.scheduled_start_at > ${nowIso}::timestamptz
      AND m.scheduled_start_at <= ${windowEndIso}::timestamptz
  `
  return rows.map((row) => {
    const record = row as Record<string, unknown>
    return {
      meetingId: String(record.id),
      eventId: String(record.event_id),
      scheduledStartAt: new Date(String(record.scheduled_start_at)).toISOString(),
      slug: String(record.slug ?? ''),
      visibility: String(record.visibility ?? 'public'),
      accessMinRole: String(record.access_min_role ?? ''),
      titleUk: String(record.title_uk ?? ''),
      titleEn: String(record.title_en ?? ''),
      timezone: String(record.time_zone ?? 'Europe/Kyiv'),
    }
  })
}
