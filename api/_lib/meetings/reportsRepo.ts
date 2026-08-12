import {getSql} from '../db.js'
import type {MeetingReportStatus, NormalizedMeetingReport} from './types.js'

export type MeetingReportRow = {
  id: string
  meetingId: string
  sourceProvider: string
  summary: string
  topics: unknown[]
  decisions: unknown[]
  actionItems: unknown[]
  rawProviderData: unknown
  editedSummary: string | null
  editedTopics: unknown[] | null
  editedDecisions: unknown[] | null
  editedActionItems: unknown[] | null
  status: MeetingReportStatus
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function mapReport(row: Record<string, unknown>): MeetingReportRow {
  return {
    id: String(row.id),
    meetingId: String(row.meeting_id),
    sourceProvider: String(row.source_provider ?? ''),
    summary: String(row.summary ?? ''),
    topics: asArray(row.topics),
    decisions: asArray(row.decisions),
    actionItems: asArray(row.action_items),
    rawProviderData: row.raw_provider_data ?? {},
    editedSummary: row.edited_summary == null ? null : String(row.edited_summary),
    editedTopics: row.edited_topics == null ? null : asArray(row.edited_topics),
    editedDecisions: row.edited_decisions == null ? null : asArray(row.edited_decisions),
    editedActionItems: row.edited_action_items == null ? null : asArray(row.edited_action_items),
    status: String(row.status ?? 'draft') as MeetingReportStatus,
    approvedBy: row.approved_by == null ? null : String(row.approved_by),
    approvedAt: row.approved_at ? new Date(String(row.approved_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }
}

export function toReportDto(report: MeetingReportRow) {
  const summary = report.editedSummary ?? report.summary
  const topics = report.editedTopics ?? report.topics
  const decisions = report.editedDecisions ?? report.decisions
  const actionItems = report.editedActionItems ?? report.actionItems
  return {
    id: report.id,
    meetingId: report.meetingId,
    sourceProvider: report.sourceProvider,
    status: report.status,
    summary,
    topics,
    decisions,
    actionItems,
    aiDraft: {
      summary: report.summary,
      topics: report.topics,
      decisions: report.decisions,
      actionItems: report.actionItems,
    },
    approvedBy: report.approvedBy,
    approvedAt: report.approvedAt,
    updatedAt: report.updatedAt,
  }
}

export async function getReportByMeetingId(meetingId: string): Promise<MeetingReportRow | null> {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM meeting_reports WHERE meeting_id = ${meetingId}::uuid LIMIT 1
  `
  return rows[0] ? mapReport(rows[0] as Record<string, unknown>) : null
}

export async function upsertDraftReport(
  meetingId: string,
  draft: NormalizedMeetingReport,
): Promise<MeetingReportRow> {
  const sql = getSql()
  const existing = await getReportByMeetingId(meetingId)
  if (existing && existing.status === 'approved') {
    // Do not overwrite an approved protocol with a new AI draft silently.
    return existing
  }
  const topics = JSON.stringify(draft.topics)
  const decisions = JSON.stringify(draft.decisions)
  const actionItems = JSON.stringify(draft.actionItems)
  const raw = JSON.stringify(draft.rawProviderData ?? {})
  if (existing) {
    const rows = await sql`
      UPDATE meeting_reports SET
        source_provider = ${draft.sourceProvider},
        summary = ${draft.summary},
        topics = ${topics}::jsonb,
        decisions = ${decisions}::jsonb,
        action_items = ${actionItems}::jsonb,
        raw_provider_data = ${raw}::jsonb,
        status = CASE WHEN status = 'approved' THEN status ELSE 'draft' END,
        updated_at = now()
      WHERE meeting_id = ${meetingId}::uuid
      RETURNING *
    `
    return mapReport(rows[0] as Record<string, unknown>)
  }
  const rows = await sql`
    INSERT INTO meeting_reports (
      meeting_id, source_provider, summary, topics, decisions, action_items, raw_provider_data, status
    ) VALUES (
      ${meetingId}::uuid,
      ${draft.sourceProvider},
      ${draft.summary},
      ${topics}::jsonb,
      ${decisions}::jsonb,
      ${actionItems}::jsonb,
      ${raw}::jsonb,
      'draft'
    )
    RETURNING *
  `
  return mapReport(rows[0] as Record<string, unknown>)
}

export async function patchReport(
  meetingId: string,
  patch: {
    editedSummary?: string
    editedTopics?: unknown[]
    editedDecisions?: unknown[]
    editedActionItems?: unknown[]
    status?: MeetingReportStatus
  },
): Promise<MeetingReportRow | null> {
  const existing = await getReportByMeetingId(meetingId)
  if (!existing) return null
  if (existing.status === 'approved' && patch.status !== 'rejected') {
    throw new Error('Approved report cannot be edited; reject first if needed')
  }
  const sql = getSql()
  const editedSummary =
    patch.editedSummary === undefined ? existing.editedSummary : patch.editedSummary
  const editedTopics =
    patch.editedTopics === undefined ? existing.editedTopics : patch.editedTopics
  const editedDecisions =
    patch.editedDecisions === undefined ? existing.editedDecisions : patch.editedDecisions
  const editedActionItems =
    patch.editedActionItems === undefined ? existing.editedActionItems : patch.editedActionItems
  const status = patch.status ?? (existing.status === 'draft' ? 'in_review' : existing.status)
  const rows = await sql`
    UPDATE meeting_reports SET
      edited_summary = ${editedSummary},
      edited_topics = ${editedTopics == null ? null : JSON.stringify(editedTopics)}::jsonb,
      edited_decisions = ${editedDecisions == null ? null : JSON.stringify(editedDecisions)}::jsonb,
      edited_action_items = ${editedActionItems == null ? null : JSON.stringify(editedActionItems)}::jsonb,
      status = ${status},
      updated_at = now()
    WHERE meeting_id = ${meetingId}::uuid
    RETURNING *
  `
  return rows[0] ? mapReport(rows[0] as Record<string, unknown>) : null
}

export async function approveReport(
  meetingId: string,
  adminUserId: string,
): Promise<MeetingReportRow | null> {
  const sql = getSql()
  const rows = await sql`
    UPDATE meeting_reports SET
      status = 'approved',
      approved_by = ${adminUserId}::uuid,
      approved_at = now(),
      updated_at = now()
    WHERE meeting_id = ${meetingId}::uuid
    RETURNING *
  `
  return rows[0] ? mapReport(rows[0] as Record<string, unknown>) : null
}

export async function replaceRecordings(
  meetingId: string,
  recordings: Array<{
    externalId: string
    fileType: string
    recordingType: string
    downloadUrl: string
    fileSizeBytes?: number | null
    raw?: unknown
  }>,
) {
  const sql = getSql()
  await sql`DELETE FROM meeting_recordings WHERE meeting_id = ${meetingId}::uuid`
  for (const item of recordings) {
    await sql`
      INSERT INTO meeting_recordings (
        meeting_id, external_id, file_type, recording_type, external_download_url,
        file_size_bytes, provider_payload
      ) VALUES (
        ${meetingId}::uuid,
        ${item.externalId},
        ${item.fileType},
        ${item.recordingType},
        ${item.downloadUrl},
        ${item.fileSizeBytes ?? null},
        ${JSON.stringify(item.raw ?? {})}::jsonb
      )
    `
  }
}

export async function replaceTranscript(
  meetingId: string,
  transcript: {
    externalId: string
    format: string
    contentText: string
    downloadUrl: string
    raw?: unknown
  } | null,
) {
  const sql = getSql()
  await sql`DELETE FROM meeting_transcripts WHERE meeting_id = ${meetingId}::uuid`
  if (!transcript) return
  await sql`
    INSERT INTO meeting_transcripts (
      meeting_id, external_id, format, content_text, external_download_url, provider_payload
    ) VALUES (
      ${meetingId}::uuid,
      ${transcript.externalId},
      ${transcript.format},
      ${transcript.contentText},
      ${transcript.downloadUrl},
      ${JSON.stringify(transcript.raw ?? {})}::jsonb
    )
  `
}

export async function listRecordingsForMeeting(meetingId: string) {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM meeting_recordings WHERE meeting_id = ${meetingId}::uuid ORDER BY created_at ASC
  `
  return rows.map((row) => {
    const record = row as Record<string, unknown>
    return {
      id: String(record.id),
      fileType: String(record.file_type ?? ''),
      recordingType: String(record.recording_type ?? ''),
      downloadUrl: String(record.external_download_url ?? ''),
      fileSizeBytes:
        record.file_size_bytes == null ? null : Number(record.file_size_bytes),
    }
  })
}

export async function getTranscriptForMeeting(meetingId: string) {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM meeting_transcripts WHERE meeting_id = ${meetingId}::uuid LIMIT 1
  `
  if (!rows[0]) return null
  const record = rows[0] as Record<string, unknown>
  return {
    id: String(record.id),
    format: String(record.format ?? ''),
    contentText: String(record.content_text ?? ''),
    downloadUrl: String(record.external_download_url ?? ''),
  }
}

export async function listReportsAdmin(limit = 100) {
  const sql = getSql()
  const rows = await sql`
    SELECT r.*, m.event_id, m.status AS meeting_status, m.provider,
           e.slug, e.title_uk, e.title_en, e.start_at
    FROM meeting_reports r
    JOIN meetings m ON m.id = r.meeting_id
    JOIN content_events e ON e.id = m.event_id
    ORDER BY r.updated_at DESC
    LIMIT ${limit}
  `
  return rows.map((row) => {
    const record = row as Record<string, unknown>
    const report = mapReport(record)
    return {
      ...toReportDto(report),
      eventId: String(record.event_id),
      eventSlug: String(record.slug ?? ''),
      titleUk: String(record.title_uk ?? ''),
      titleEn: String(record.title_en ?? ''),
      meetingStatus: String(record.meeting_status ?? ''),
      provider: String(record.provider ?? ''),
      eventStartAt: record.start_at ? new Date(String(record.start_at)).toISOString() : null,
    }
  })
}
