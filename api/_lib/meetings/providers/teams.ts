import type {MeetingProvider} from '../provider.js'
import {ProviderNotImplementedError} from '../types.js'
import type {
  CreateMeetingInput,
  NormalizedMeetingReport,
  ParsedWebhookEnvelope,
  ProviderMeeting,
  ProviderRecording,
  ProviderTranscript,
  WebhookVerifyResult,
} from '../types.js'

function stub(name: string): MeetingProvider {
  const fail = (method: string): never => {
    throw new ProviderNotImplementedError(name, method)
  }
  return {
    name,
    createMeeting: async (_input: CreateMeetingInput): Promise<ProviderMeeting> => fail('createMeeting'),
    updateMeeting: async (): Promise<ProviderMeeting> => fail('updateMeeting'),
    cancelMeeting: async (): Promise<void> => fail('cancelMeeting'),
    getMeeting: async (): Promise<ProviderMeeting> => fail('getMeeting'),
    getRecording: async (): Promise<ProviderRecording[]> => fail('getRecording'),
    getTranscript: async (): Promise<ProviderTranscript | null> => fail('getTranscript'),
    getMeetingReport: async (): Promise<NormalizedMeetingReport | null> => fail('getMeetingReport'),
    verifyWebhook: (): WebhookVerifyResult => fail('verifyWebhook'),
    parseWebhook: (): ParsedWebhookEnvelope | null => fail('parseWebhook'),
  }
}

export const teamsMeetingProvider = stub('teams')
export const meetMeetingProvider = stub('meet')
