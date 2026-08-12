import {MeetingProviderRegistry} from './registry.js'
import {
  findMeetingByExternal,
  getEventMeetingContext,
  getMeetingByEventId,
  insertMeeting,
  toMeetingPublicDto,
  updateMeetingRow,
  type MeetingRow,
} from './meetingsRepo.js'
import {
  approveReport,
  getReportByMeetingId,
  getTranscriptForMeeting,
  listRecordingsForMeeting,
  listReportsAdmin,
  patchReport,
  replaceRecordings,
  replaceTranscript,
  toReportDto,
  upsertDraftReport,
} from './reportsRepo.js'
import {
  claimProviderEvent,
  completeProviderEvent,
  getProviderEventById,
  insertProviderEvent,
  listPendingProviderEvents,
} from './providerEventsRepo.js'
import {encryptStartUrl} from './startUrlCrypto.js'
import {ProviderNotImplementedError, UnknownMeetingProviderError} from './types.js'
import {canJoinMeeting, canViewEvent} from './access.js'
import {getSql} from '../db.js'
import {isRecord, readStringOr} from '../../../src/lib/contentGuards.js'
import {notifyMeetingAudience, notifyProtocolApproved} from './meetingNotify.js'
import {listDueReminderMeetings} from './notificationsRepo.js'
import {getPublishedEventBySlug} from '../contentRepo.js'
import {
  getJoinForEventWithLevel,
  getMemberJoinForEvent,
  listMemberAccessibleEvents,
} from './memberCabinetEvents.js'

export {getJoinForEventWithLevel, getMemberJoinForEvent, listMemberAccessibleEvents}

const ARTIFACT_EVENTS = new Set([
  'recording.completed',
  'recording.transcript_completed',
  'meeting.summary_completed',
  'meeting.ended',
])

function topicFromEvent(event: NonNullable<Awaited<ReturnType<typeof getEventMeetingContext>>>) {
  return event.titleUk || event.titleEn || event.slug || 'UAOS meeting'
}

export async function createMeetingForEvent(input: {
  eventId: string
  provider?: string
}): Promise<{meeting: ReturnType<typeof toMeetingPublicDto>}> {
  const providerName = (input.provider ?? 'zoom').trim().toLowerCase()
  if (!MeetingProviderRegistry.has(providerName)) {
    throw new UnknownMeetingProviderError(providerName)
  }
  if (!MeetingProviderRegistry.listImplemented().includes(providerName)) {
    throw new ProviderNotImplementedError(providerName, 'createMeeting')
  }

  const event = await getEventMeetingContext(input.eventId)
  if (!event) throw new Error('Event not found')
  if (event.participationMode !== 'zoom') {
    throw new Error('Zoom meeting can only be created for events with participation mode zoom')
  }

  const existing = await getMeetingByEventId(input.eventId)
  if (existing && existing.status !== 'cancelled' && existing.externalId) {
    return {meeting: toMeetingPublicDto(existing)}
  }

  const provider = MeetingProviderRegistry.get(providerName)
  let pending = existing
  if (!pending) {
    pending = await insertMeeting({
      eventId: input.eventId,
      provider: providerName,
      externalId: '',
      externalUuid: '',
      joinUrl: '',
      startUrlEncrypted: '',
      status: 'pending',
      scheduledStartAt: event.startAt,
      scheduledEndAt: event.endAt,
      timezone: event.timezone,
    })
  }

  try {
    const created = await provider.createMeeting({
      topic: topicFromEvent(event),
      startAt: event.startAt,
      endAt: event.endAt,
      timezone: event.timezone,
    })
    // Event times are source of truth; Zoom response TZ/start can reflect account defaults.
    const updated = await updateMeetingRow(pending.id, {
      externalId: created.externalId,
      externalUuid: created.externalUuid,
      joinUrl: created.joinUrl,
      startUrlEncrypted: encryptStartUrl(created.startUrl),
      status: 'ready',
      scheduledStartAt: event.startAt,
      scheduledEndAt: event.endAt,
      timezone: event.timezone,
      lastSyncError: '',
    })
    const meeting = updated!
    void notifyMeetingAudience({
      meetingId: meeting.id,
      kind: 'created',
      accessMinRole: event.accessMinRole,
      title: topicFromEvent(event),
      startAt: event.startAt,
      eventSlug: event.slug,
    }).catch((err) => console.error('meeting created notify failed:', err))
    return {meeting: toMeetingPublicDto(meeting)}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create meeting failed'
    const updated = await updateMeetingRow(pending.id, {
      status: 'sync_error',
      lastSyncError: message.slice(0, 1000),
    })
    throw Object.assign(new Error(message), {meeting: updated ? toMeetingPublicDto(updated) : null})
  }
}

export async function retryMeetingForEvent(eventId: string) {
  const existing = await getMeetingByEventId(eventId)
  if (!existing) return createMeetingForEvent({eventId, provider: 'zoom'})

  const event = await getEventMeetingContext(eventId)
  if (!event) throw new Error('Event not found')
  const provider = MeetingProviderRegistry.get(existing.provider)

  try {
    if (existing.externalId) {
      const updatedRemote = await provider.updateMeeting(existing.externalId, {
        topic: topicFromEvent(event),
        startAt: event.startAt,
        endAt: event.endAt,
        timezone: event.timezone,
      })
      const updated = await updateMeetingRow(existing.id, {
        externalId: updatedRemote.externalId || existing.externalId,
        externalUuid: updatedRemote.externalUuid || existing.externalUuid,
        joinUrl: updatedRemote.joinUrl || existing.joinUrl,
        startUrlEncrypted: updatedRemote.startUrl
          ? encryptStartUrl(updatedRemote.startUrl)
          : existing.startUrlEncrypted,
        status: 'ready',
        lastSyncError: '',
        scheduledStartAt: event.startAt,
        scheduledEndAt: event.endAt,
        timezone: event.timezone,
      })
      return {meeting: toMeetingPublicDto(updated!)}
    }
    return createMeetingForEvent({eventId, provider: existing.provider})
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Retry failed'
    const updated = await updateMeetingRow(existing.id, {
      status: 'sync_error',
      lastSyncError: message.slice(0, 1000),
    })
    throw Object.assign(new Error(message), {meeting: updated ? toMeetingPublicDto(updated) : null})
  }
}

export async function getMeetingDtoForEvent(eventId: string) {
  const meeting = await getMeetingByEventId(eventId)
  return meeting ? toMeetingPublicDto(meeting) : null
}

export async function getReportDtoForEvent(eventId: string) {
  const meeting = await getMeetingByEventId(eventId)
  if (!meeting) return null
  const report = await getReportByMeetingId(meeting.id)
  return report ? toReportDto(report) : null
}

export async function patchReportForEvent(
  eventId: string,
  patch: {
    editedSummary?: string
    editedTopics?: unknown[]
    editedDecisions?: unknown[]
    editedActionItems?: unknown[]
    status?: 'draft' | 'in_review' | 'approved' | 'rejected'
  },
) {
  const meeting = await getMeetingByEventId(eventId)
  if (!meeting) throw new Error('Meeting not found')
  const report = await patchReport(meeting.id, patch)
  if (!report) throw new Error('Report not found')
  return toReportDto(report)
}

export async function approveReportForEvent(eventId: string, adminUserId: string) {
  const meeting = await getMeetingByEventId(eventId)
  if (!meeting) throw new Error('Meeting not found')
  const report = await approveReport(meeting.id, adminUserId)
  if (!report) throw new Error('Report not found')
  const event = await getEventMeetingContext(eventId)
  const dto = toReportDto(report)
  if (event) {
    const transcript = await getTranscriptForMeeting(meeting.id)
    const recordings = await listRecordingsForMeeting(meeting.id)
    void notifyProtocolApproved({
      title: topicFromEvent(event),
      eventSlug: event.slug,
      summary: dto.summary,
      transcriptPreview: transcript?.contentText
        ? transcript.contentText.slice(0, 4000)
        : undefined,
      recordingLinks: recordings.map((item) => item.downloadUrl).filter(Boolean),
    }).catch((err) => console.error('protocol approve notify failed:', err))
  }
  return dto
}

export async function ingestWebhook(input: {
  provider: string
  headers: Record<string, string | string[] | undefined>
  rawBody: string
  parsedBody: unknown
}): Promise<
  | {kind: 'crc'; plainToken: string; encryptedToken: string}
  | {kind: 'accepted'; eventId: string; inserted: boolean}
> {
  const providerName = input.provider.trim().toLowerCase()
  if (!MeetingProviderRegistry.has(providerName)) {
    throw new UnknownMeetingProviderError(providerName)
  }
  const provider = MeetingProviderRegistry.get(providerName)
  const verified = provider.verifyWebhook({
    headers: input.headers,
    rawBody: input.rawBody,
    parsedBody: input.parsedBody,
  })
  if (verified.ok === false) {
    throw Object.assign(new Error(verified.error), {status: verified.status})
  }
  if (verified.kind === 'crc') {
    return {
      kind: 'crc',
      plainToken: verified.plainToken,
      encryptedToken: verified.encryptedToken,
    }
  }
  const envelope = provider.parseWebhook(verified.body)
  if (!envelope) {
    const {row} = await insertProviderEvent({
      provider: providerName,
      externalEventType: 'ignored',
      externalMeetingId: '',
      externalOccurrenceId: '',
      idempotencyKey: `${providerName}:ignored:${Date.now()}:${Math.random()}`,
      payload: verified.body,
    })
    await completeProviderEvent(row.id, 'ignored')
    return {kind: 'accepted', eventId: row.id, inserted: true}
  }
  const {row, inserted} = await insertProviderEvent({
    provider: providerName,
    externalEventType: envelope.externalEventType,
    externalMeetingId: envelope.externalMeetingId,
    externalOccurrenceId: envelope.externalOccurrenceId,
    idempotencyKey: envelope.idempotencyKey,
    payload: envelope.payload,
  })
  return {kind: 'accepted', eventId: row.id, inserted}
}

async function syncArtifactsForMeeting(meeting: MeetingRow) {
  const provider = MeetingProviderRegistry.get(meeting.provider)
  const lookupId = meeting.externalUuid || meeting.externalId
  if (!lookupId) return

  if (
    ARTIFACT_EVENTS.size &&
    (meeting.externalUuid || meeting.externalId)
  ) {
    try {
      const recordings = await provider.getRecording(lookupId)
      await replaceRecordings(meeting.id, recordings)
    } catch {
      // recordings may not be ready yet
    }
    try {
      const transcript = await provider.getTranscript(lookupId)
      await replaceTranscript(meeting.id, transcript)
    } catch {
      // optional
    }
  }

  if (meeting.externalUuid) {
    try {
      const report = await provider.getMeetingReport(meeting.externalUuid)
      if (report) await upsertDraftReport(meeting.id, report)
    } catch {
      // summary may lag behind webhook
    }
  }

  await updateMeetingRow(meeting.id, {
    status: 'awaiting_artifacts',
    lastSyncError: '',
  })
}

export async function processProviderEventById(eventId: string) {
  const claimed = await claimProviderEvent(eventId)
  if (!claimed) {
    const existing = await getProviderEventById(eventId)
    if (!existing) throw new Error('Provider event not found')
    if (existing.status === 'processed' || existing.status === 'ignored') {
      return {ok: true, status: existing.status}
    }
    throw new Error('Provider event could not be claimed')
  }

  try {
    if (!ARTIFACT_EVENTS.has(claimed.externalEventType) && claimed.externalEventType !== 'meeting.started') {
      await completeProviderEvent(claimed.id, 'ignored')
      return {ok: true, status: 'ignored' as const}
    }

    let meeting = await findMeetingByExternal(
      claimed.provider,
      claimed.externalMeetingId,
      claimed.externalOccurrenceId || undefined,
    )
    if (!meeting && claimed.externalMeetingId) {
      meeting = await findMeetingByExternal(claimed.provider, claimed.externalMeetingId)
    }
    if (!meeting) {
      await completeProviderEvent(claimed.id, 'failed', 'No matching meeting in UAOS')
      return {ok: false, status: 'failed' as const, error: 'No matching meeting'}
    }

    if (claimed.externalEventType === 'meeting.started') {
      await updateMeetingRow(meeting.id, {status: 'live'})
    } else if (claimed.externalEventType === 'meeting.ended') {
      await updateMeetingRow(meeting.id, {
        status: 'ended',
        externalUuid: claimed.externalOccurrenceId || meeting.externalUuid,
      })
    } else if (claimed.externalOccurrenceId && !meeting.externalUuid) {
      await updateMeetingRow(meeting.id, {externalUuid: claimed.externalOccurrenceId})
      meeting = (await findMeetingByExternal(
        claimed.provider,
        claimed.externalMeetingId,
        claimed.externalOccurrenceId,
      ))!
    }

    const fresh = (await getMeetingByEventId(meeting.eventId)) ?? meeting
    if (claimed.externalEventType !== 'meeting.started') {
      await syncArtifactsForMeeting({
        ...fresh,
        externalUuid: claimed.externalOccurrenceId || fresh.externalUuid,
      })
    }

    await completeProviderEvent(claimed.id, 'processed')
    return {ok: true, status: 'processed' as const}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Process failed'
    await completeProviderEvent(claimed.id, 'failed', message.slice(0, 1000))
    return {ok: false, status: 'failed' as const, error: message}
  }
}

export async function processInbox(limit = 10) {
  const pending = await listPendingProviderEvents(limit)
  const results = []
  for (const item of pending) {
    results.push({id: item.id, ...(await processProviderEventById(item.id))})
  }
  return {processed: results.length, results}
}

export async function getEventForSiteBySlug(
  slug: string,
  userLevel: string | null,
) {
  const event = await getPublishedEventBySlug(slug)
  if (!event) throw Object.assign(new Error('Not found'), {status: 404})
  if (
    !canViewEvent({
      visibility: String(event.visibility),
      accessMinRole: String(event.accessMinRole ?? ''),
      userLevel,
    })
  ) {
    throw Object.assign(new Error('Forbidden'), {status: 403})
  }
  const sql = getSql()
  const rows = await sql`
    SELECT id FROM content_events WHERE slug = ${slug} AND status = 'published' LIMIT 1
  `
  const eventId = rows[0] ? String((rows[0] as {id: string}).id) : ''
  const meeting = eventId ? await getMeetingByEventId(eventId) : null
  const canJoin = canJoinMeeting({
    accessMinRole: String(event.accessMinRole ?? ''),
    userLevel,
  })
  return {
    event: {
      ...event,
      eventId,
    },
    meeting: meeting
      ? {
          status: meeting.status,
          provider: meeting.provider,
          canJoin: Boolean(canJoin && meeting.joinUrl && meeting.status !== 'cancelled'),
        }
      : null,
  }
}

export async function getJoinForEventBySlug(slug: string, userLevel: string | null) {
  const sql = getSql()
  const rows = await sql`
    SELECT id FROM content_events WHERE slug = ${slug} AND status = 'published' LIMIT 1
  `
  if (!rows[0]) throw Object.assign(new Error('Not found'), {status: 404})
  return getJoinForEventWithLevel(String((rows[0] as {id: string}).id), userLevel)
}

export async function listMeetingsAdmin(limit = 100) {
  const sql = getSql()
  const rows = await sql`
    SELECT m.*, e.slug, e.title_uk, e.title_en, e.start_at AS event_start_at,
           e.visibility, e.access_min_role
    FROM meetings m
    JOIN content_events e ON e.id = m.event_id
    ORDER BY m.updated_at DESC
    LIMIT ${limit}
  `
  return rows.map((row) => {
    const record = row as Record<string, unknown>
    const meeting = toMeetingPublicDto({
      id: String(record.id),
      eventId: String(record.event_id),
      provider: String(record.provider ?? ''),
      externalId: String(record.external_id ?? ''),
      externalUuid: String(record.external_uuid ?? ''),
      joinUrl: String(record.join_url ?? ''),
      startUrlEncrypted: String(record.start_url_encrypted ?? ''),
      status: String(record.status ?? 'pending') as MeetingRow['status'],
      scheduledStartAt: record.scheduled_start_at
        ? new Date(String(record.scheduled_start_at)).toISOString()
        : null,
      scheduledEndAt: record.scheduled_end_at
        ? new Date(String(record.scheduled_end_at)).toISOString()
        : null,
      timezone: String(record.timezone ?? 'Europe/Kyiv'),
      lastSyncError: String(record.last_sync_error ?? ''),
      createdAt: new Date(String(record.created_at)).toISOString(),
      updatedAt: new Date(String(record.updated_at)).toISOString(),
    })
    return {
      ...meeting,
      eventSlug: String(record.slug ?? ''),
      titleUk: String(record.title_uk ?? ''),
      titleEn: String(record.title_en ?? ''),
      eventStartAt: record.event_start_at
        ? new Date(String(record.event_start_at)).toISOString()
        : null,
      visibility: String(record.visibility ?? 'public'),
      accessMinRole: String(record.access_min_role ?? ''),
    }
  })
}

export async function getMeetingBundleForEvent(eventId: string) {
  const meeting = await getMeetingByEventId(eventId)
  if (!meeting) return null
  const report = await getReportByMeetingId(meeting.id)
  const recordings = await listRecordingsForMeeting(meeting.id)
  const transcript = await getTranscriptForMeeting(meeting.id)
  return {
    meeting: toMeetingPublicDto(meeting),
    report: report ? toReportDto(report) : null,
    recordings,
    transcript,
  }
}

export {listReportsAdmin}

export async function processMeetingCronJobs() {
  const inbox = await processInbox(20)
  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const windowEndIso = new Date(now + 24 * 60 * 60 * 1000).toISOString()
  const due = await listDueReminderMeetings(nowIso, windowEndIso)
  const reminders = []
  for (const item of due) {
    const result = await notifyMeetingAudience({
      meetingId: item.meetingId,
      kind: 'reminder',
      accessMinRole: item.accessMinRole,
      title: item.titleUk || item.titleEn || item.slug,
      startAt: item.scheduledStartAt,
      eventSlug: item.slug,
    })
    reminders.push({meetingId: item.meetingId, ...result})
  }
  return {inbox, reminders}
}

export async function parseAccessMinRole(body: unknown): Promise<string> {
  if (!isRecord(body)) return ''
  return readStringOr(body.accessMinRole, '').trim().toLowerCase()
}

export function readVisibility(body: unknown): 'public' | 'restricted' {
  if (!isRecord(body)) return 'public'
  return readStringOr(body.visibility, 'public') === 'restricted' ? 'restricted' : 'public'
}
