import {createHmac} from 'node:crypto'
import type {MeetingProvider} from '../../provider.js'
import type {
  CreateMeetingInput,
  NormalizedMeetingReport,
  ParsedWebhookEnvelope,
  ProviderMeeting,
  ProviderRecording,
  ProviderTranscript,
  WebhookVerifyResult,
} from '../../types.js'
import {isRecord, readStringOr} from '../../../../../src/lib/contentGuards.js'

type ZoomTokenCache = {token: string; expiresAtMs: number}

let tokenCache: ZoomTokenCache | null = null

function requireZoomEnv() {
  const accountId = process.env.ZOOM_ACCOUNT_ID?.trim() ?? ''
  const clientId = process.env.ZOOM_CLIENT_ID?.trim() ?? ''
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim() ?? ''
  const hostUserId = process.env.ZOOM_HOST_USER_ID?.trim() ?? ''
  if (!accountId || !clientId || !clientSecret || !hostUserId) {
    throw new Error(
      'Zoom provider requires ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_HOST_USER_ID',
    )
  }
  return {accountId, clientId, clientSecret, hostUserId}
}

function webhookSecret(): string {
  const secret = process.env.ZOOM_WEBHOOK_SECRET?.trim() ?? ''
  if (!secret) throw new Error('ZOOM_WEBHOOK_SECRET is not configured')
  return secret
}

function encodeMeetingUuid(uuid: string): string {
  if (uuid.includes('/') || uuid.startsWith('/')) {
    return encodeURIComponent(encodeURIComponent(uuid))
  }
  return encodeURIComponent(uuid)
}

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (tokenCache && tokenCache.expiresAtMs > now + 30_000) return tokenCache.token
  const {accountId, clientId, clientSecret} = requireZoomEnv()
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: accountId,
    }),
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Zoom token error ${response.status}: ${text.slice(0, 200)}`)
  }
  const data = (await response.json()) as {access_token?: string; expires_in?: number}
  if (!data.access_token) throw new Error('Zoom token response missing access_token')
  tokenCache = {
    token: data.access_token,
    expiresAtMs: now + Math.max(60, Number(data.expires_in ?? 3600)) * 1000,
  }
  return data.access_token
}

async function zoomFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken()
  return fetch(`https://api.zoom.us/v2${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
}

function durationMinutes(startAt: string, endAt?: string | null): number {
  if (!endAt) return 60
  const start = Date.parse(startAt)
  const end = Date.parse(endAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 60
  return Math.max(15, Math.round((end - start) / 60_000))
}

/**
 * Zoom expects `start_time` as wall-clock in `timezone` without `Z`/offset.
 * Passing UTC ISO (`…Z`) together with `timezone` makes Zoom mis-schedule
 * (and often echo the account default TZ such as America/Los_Angeles).
 */
export function toZoomLocalStartTime(isoUtc: string, timeZone: string): string {
  const date = new Date(isoUtc)
  if (!Number.isFinite(date.getTime())) {
    return isoUtc.replace(/\.\d{3}Z$/i, '').replace(/Z$/i, '')
  }
  const zone = timeZone.trim() || 'Europe/Kyiv'
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`
}

function mapProviderMeeting(data: Record<string, unknown>): ProviderMeeting {
  return {
    externalId: String(data.id ?? ''),
    externalUuid: String(data.uuid ?? ''),
    joinUrl: String(data.join_url ?? ''),
    startUrl: String(data.start_url ?? ''),
    scheduledStartAt: data.start_time ? String(data.start_time) : null,
    scheduledEndAt: null,
    timezone: String(data.timezone ?? 'Europe/Kyiv'),
    raw: data,
  }
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const raw = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(raw)) return String(raw[0] ?? '')
  return typeof raw === 'string' ? raw : ''
}

export function verifyZoomWebhookSignature(input: {
  secretToken: string
  timestamp: string
  rawBody: string
  signatureHeader: string
}): boolean {
  const message = `v0:${input.timestamp}:${input.rawBody}`
  const hash = createHmac('sha256', input.secretToken).update(message).digest('hex')
  const expected = `v0=${hash}`
  return expected === input.signatureHeader
}

export function buildZoomCrcResponse(plainToken: string, secretToken: string) {
  const encryptedToken = createHmac('sha256', secretToken).update(plainToken).digest('hex')
  return {plainToken, encryptedToken}
}

function normalizeSummary(raw: unknown): NormalizedMeetingReport {
  const source = isRecord(raw) ? raw : {}
  const summary =
    readStringOr(source.summary, '') ||
    readStringOr(source.overview, '') ||
    readStringOr(source.summary_overview, '')
  const topics = Array.isArray(source.summary_details)
    ? source.summary_details
    : Array.isArray(source.topics)
      ? source.topics
      : []
  const nextSteps = Array.isArray(source.next_steps)
    ? source.next_steps
    : Array.isArray(source.action_items)
      ? source.action_items
      : []
  return {
    summary,
    topics,
    decisions: Array.isArray(source.decisions) ? source.decisions : [],
    actionItems: nextSteps,
    sourceProvider: 'zoom',
    rawProviderData: raw,
  }
}

export const zoomMeetingProvider: MeetingProvider = {
  name: 'zoom',

  async createMeeting(input: CreateMeetingInput): Promise<ProviderMeeting> {
    const {hostUserId} = requireZoomEnv()
    const timezone = input.timezone?.trim() || 'Europe/Kyiv'
    const body = {
      topic: input.topic.slice(0, 200),
      type: 2,
      start_time: toZoomLocalStartTime(input.startAt, timezone),
      duration: durationMinutes(input.startAt, input.endAt),
      timezone,
      agenda: input.agenda?.slice(0, 2000) ?? '',
      settings: {
        waiting_room: input.waitingRoom !== false,
        join_before_host: false,
      },
    }
    const response = await zoomFetch(`/users/${encodeURIComponent(hostUserId)}/meetings`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Zoom createMeeting failed ${response.status}: ${text.slice(0, 300)}`)
    }
    const data = (await response.json()) as Record<string, unknown>
    return mapProviderMeeting(data)
  },

  async updateMeeting(externalId: string, input: CreateMeetingInput): Promise<ProviderMeeting> {
    const timezone = input.timezone?.trim() || 'Europe/Kyiv'
    const body = {
      topic: input.topic.slice(0, 200),
      start_time: toZoomLocalStartTime(input.startAt, timezone),
      duration: durationMinutes(input.startAt, input.endAt),
      timezone,
      agenda: input.agenda?.slice(0, 2000) ?? '',
    }
    const response = await zoomFetch(`/meetings/${encodeURIComponent(externalId)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    if (!response.ok && response.status !== 204) {
      const text = await response.text().catch(() => '')
      throw new Error(`Zoom updateMeeting failed ${response.status}: ${text.slice(0, 300)}`)
    }
    return this.getMeeting(externalId)
  },

  async cancelMeeting(externalId: string): Promise<void> {
    const response = await zoomFetch(`/meetings/${encodeURIComponent(externalId)}`, {
      method: 'DELETE',
    })
    if (!response.ok && response.status !== 204 && response.status !== 404) {
      const text = await response.text().catch(() => '')
      throw new Error(`Zoom cancelMeeting failed ${response.status}: ${text.slice(0, 300)}`)
    }
  },

  async getMeeting(externalId: string): Promise<ProviderMeeting> {
    const response = await zoomFetch(`/meetings/${encodeURIComponent(externalId)}`)
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Zoom getMeeting failed ${response.status}: ${text.slice(0, 300)}`)
    }
    const data = (await response.json()) as Record<string, unknown>
    return mapProviderMeeting(data)
  },

  async getRecording(externalIdOrUuid: string): Promise<ProviderRecording[]> {
    const id = encodeMeetingUuid(externalIdOrUuid)
    const response = await zoomFetch(`/meetings/${id}/recordings`)
    if (response.status === 404) return []
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Zoom getRecording failed ${response.status}: ${text.slice(0, 300)}`)
    }
    const data = (await response.json()) as {recording_files?: unknown[]}
    const files = Array.isArray(data.recording_files) ? data.recording_files : []
    return files
      .filter((item): item is Record<string, unknown> => isRecord(item))
      .map((item) => ({
        externalId: String(item.id ?? item.file_name ?? ''),
        fileType: String(item.file_type ?? ''),
        recordingType: String(item.recording_type ?? ''),
        downloadUrl: String(item.download_url ?? ''),
        fileSizeBytes: item.file_size == null ? null : Number(item.file_size),
        raw: item,
      }))
  },

  async getTranscript(externalIdOrUuid: string): Promise<ProviderTranscript | null> {
    const recordings = await this.getRecording(externalIdOrUuid)
    const transcriptFile = recordings.find(
      (item) =>
        item.fileType.toUpperCase() === 'TRANSCRIPT' ||
        item.recordingType.toLowerCase().includes('transcript'),
    )
    if (!transcriptFile?.downloadUrl) return null
    let contentText = ''
    try {
      const token = await getAccessToken()
      const response = await fetch(transcriptFile.downloadUrl, {
        headers: {Authorization: `Bearer ${token}`},
      })
      if (response.ok) contentText = await response.text()
    } catch {
      contentText = ''
    }
    return {
      externalId: transcriptFile.externalId,
      format: 'vtt',
      contentText,
      downloadUrl: transcriptFile.downloadUrl,
      raw: transcriptFile.raw,
    }
  },

  async getMeetingReport(externalUuid: string): Promise<NormalizedMeetingReport | null> {
    const id = encodeMeetingUuid(externalUuid)
    const response = await zoomFetch(`/meetings/${id}/meeting_summary`)
    if (response.status === 404) return null
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Zoom getMeetingReport failed ${response.status}: ${text.slice(0, 300)}`)
    }
    const data = await response.json()
    return normalizeSummary(data)
  },

  verifyWebhook(input): WebhookVerifyResult {
    try {
      const secret = webhookSecret()
      const body = input.parsedBody
      if (isRecord(body) && body.event === 'endpoint.url_validation') {
        const payload = isRecord(body.payload) ? body.payload : {}
        const token = readStringOr(payload.plainToken, '')
        if (!token) return {ok: false, status: 400, error: 'Missing plainToken'}
        const crc = buildZoomCrcResponse(token, secret)
        return {ok: true, kind: 'crc', plainToken: crc.plainToken, encryptedToken: crc.encryptedToken}
      }
      const timestamp = headerValue(input.headers, 'x-zm-request-timestamp')
      const signature = headerValue(input.headers, 'x-zm-signature')
      if (!timestamp || !signature) {
        return {ok: false, status: 401, error: 'Missing webhook signature headers'}
      }
      const valid = verifyZoomWebhookSignature({
        secretToken: secret,
        timestamp,
        rawBody: input.rawBody,
        signatureHeader: signature,
      })
      if (!valid) return {ok: false, status: 401, error: 'Invalid webhook signature'}
      return {ok: true, kind: 'event', body: input.parsedBody}
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook verify failed'
      return {ok: false, status: 500, error: message}
    }
  },

  parseWebhook(parsedBody: unknown): ParsedWebhookEnvelope | null {
    if (!isRecord(parsedBody)) return null
    const eventType = readStringOr(parsedBody.event, '')
    if (!eventType || eventType === 'endpoint.url_validation') return null
    const payload = isRecord(parsedBody.payload) ? parsedBody.payload : {}
    const object = isRecord(payload.object) ? payload.object : payload
    const externalMeetingId = readStringOr(object.id, readStringOr(object.meeting_id, ''))
    const externalOccurrenceId = readStringOr(object.uuid, '')
    const eventTs = readStringOr(parsedBody.event_ts, String(Date.now()))
    const idempotencyKey = `zoom:${eventType}:${externalOccurrenceId || externalMeetingId}:${eventTs}`
    return {
      externalEventType: eventType,
      externalMeetingId: String(externalMeetingId),
      externalOccurrenceId,
      idempotencyKey,
      payload: parsedBody,
    }
  },
}

/** Reset token cache between tests. */
export function resetZoomTokenCacheForTests() {
  tokenCache = null
}
