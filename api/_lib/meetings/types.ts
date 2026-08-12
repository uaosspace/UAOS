/** Neutral meeting-domain types (no vendor field names in public DTOs). */

export {
  ACCESS_LEVELS,
  ASSIGNABLE_ACCESS_LEVELS,
  isAccessLevel,
  isAssignableAccessLevel,
  type AccessLevel,
  type AssignableAccessLevel,
} from './accessCore.js'

/** @deprecated Use ASSIGNABLE_ACCESS_LEVELS — kept for transitional imports. */
export const MEMBER_ROLE_CODES = ['partner', 'member', 'staff', 'board'] as const
export type MemberRoleCode = (typeof MEMBER_ROLE_CODES)[number]

export function isMemberRoleCode(value: string): value is MemberRoleCode {
  return (MEMBER_ROLE_CODES as readonly string[]).includes(value)
}

export type MeetingStatus =
  | 'pending'
  | 'ready'
  | 'live'
  | 'ended'
  | 'sync_error'
  | 'cancelled'
  | 'awaiting_artifacts'

export type MeetingReportStatus = 'draft' | 'in_review' | 'approved' | 'rejected'

export type ProviderEventStatus = 'pending' | 'processing' | 'processed' | 'failed' | 'ignored'

export type CreateMeetingInput = {
  topic: string
  agenda?: string
  startAt: string
  endAt?: string | null
  timezone: string
  waitingRoom?: boolean
}

export type ProviderMeeting = {
  externalId: string
  externalUuid: string
  joinUrl: string
  startUrl: string
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
  timezone: string
  raw?: unknown
}

export type ProviderRecording = {
  externalId: string
  fileType: string
  recordingType: string
  downloadUrl: string
  fileSizeBytes?: number | null
  raw?: unknown
}

export type ProviderTranscript = {
  externalId: string
  format: string
  contentText: string
  downloadUrl: string
  raw?: unknown
}

export type NormalizedMeetingReport = {
  summary: string
  topics: unknown[]
  decisions: unknown[]
  actionItems: unknown[]
  sourceProvider: string
  rawProviderData: unknown
}

export type WebhookVerifyResult =
  | {ok: true; kind: 'event'; body: unknown}
  | {ok: true; kind: 'crc'; plainToken: string; encryptedToken: string}
  | {ok: false; status: number; error: string}

export type ParsedWebhookEnvelope = {
  externalEventType: string
  externalMeetingId: string
  externalOccurrenceId: string
  idempotencyKey: string
  payload: unknown
}

export class ProviderNotImplementedError extends Error {
  readonly provider: string
  constructor(provider: string, method: string) {
    super(`Meeting provider "${provider}" does not implement ${method}`)
    this.name = 'ProviderNotImplementedError'
    this.provider = provider
  }
}

export class UnknownMeetingProviderError extends Error {
  constructor(provider: string) {
    super(`Unknown meeting provider: ${provider}`)
    this.name = 'UnknownMeetingProviderError'
  }
}
