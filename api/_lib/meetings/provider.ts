import type {
  CreateMeetingInput,
  NormalizedMeetingReport,
  ParsedWebhookEnvelope,
  ProviderMeeting,
  ProviderRecording,
  ProviderTranscript,
  WebhookVerifyResult,
} from './types.js'

export interface MeetingProvider {
  readonly name: string
  createMeeting(input: CreateMeetingInput): Promise<ProviderMeeting>
  updateMeeting(externalId: string, input: CreateMeetingInput): Promise<ProviderMeeting>
  cancelMeeting(externalId: string): Promise<void>
  getMeeting(externalId: string): Promise<ProviderMeeting>
  getRecording(externalIdOrUuid: string): Promise<ProviderRecording[]>
  getTranscript(externalIdOrUuid: string): Promise<ProviderTranscript | null>
  getMeetingReport(externalUuid: string): Promise<NormalizedMeetingReport | null>
  verifyWebhook(input: {
    headers: Record<string, string | string[] | undefined>
    rawBody: string
    parsedBody: unknown
  }): WebhookVerifyResult
  parseWebhook(parsedBody: unknown): ParsedWebhookEnvelope | null
}
