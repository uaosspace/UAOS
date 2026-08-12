import {getSql} from '../db.js'

export type MeetingOpsSettings = {
  protocolNotifyEmails: string[]
  updatedAt: string
}

function normalizeEmails(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === 'string'
      ? raw.split(/[,;\s]+/)
      : []
  return [
    ...new Set(
      list
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.includes('@')),
    ),
  ].slice(0, 50)
}

export async function getMeetingOpsSettings(): Promise<MeetingOpsSettings> {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM meeting_ops_settings WHERE id = 'default' LIMIT 1
  `
  if (!rows[0]) {
    return {protocolNotifyEmails: [], updatedAt: new Date().toISOString()}
  }
  const row = rows[0] as Record<string, unknown>
  const emails = Array.isArray(row.protocol_notify_emails)
    ? (row.protocol_notify_emails as unknown[]).map(String)
    : []
  return {
    protocolNotifyEmails: normalizeEmails(emails),
    updatedAt: row.updated_at
      ? new Date(String(row.updated_at)).toISOString()
      : new Date().toISOString(),
  }
}

export async function putMeetingOpsSettings(body: unknown): Promise<MeetingOpsSettings> {
  const source = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const emails = normalizeEmails(source.protocolNotifyEmails ?? source.emails)
  const sql = getSql()
  await sql`
    INSERT INTO meeting_ops_settings (id, protocol_notify_emails, updated_at)
    VALUES ('default', ${emails}, now())
    ON CONFLICT (id) DO UPDATE SET
      protocol_notify_emails = EXCLUDED.protocol_notify_emails,
      updated_at = now()
  `
  return getMeetingOpsSettings()
}
