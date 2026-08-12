import type {MeetingProvider} from './provider.js'
import {UnknownMeetingProviderError} from './types.js'
import {zoomMeetingProvider} from './providers/zoom/zoomProvider.js'
import {teamsMeetingProvider} from './providers/teams.js'
import {meetMeetingProvider} from './providers/meet.js'

const providers: Record<string, MeetingProvider> = {
  zoom: zoomMeetingProvider,
  teams: teamsMeetingProvider,
  meet: meetMeetingProvider,
}

export const MeetingProviderRegistry = {
  has(name: string): boolean {
    return Boolean(providers[name.trim().toLowerCase()])
  },
  get(name: string): MeetingProvider {
    const key = name.trim().toLowerCase()
    const provider = providers[key]
    if (!provider) throw new UnknownMeetingProviderError(key)
    return provider
  },
  listKnown(): string[] {
    return Object.keys(providers)
  },
  /** Implemented providers that can create meetings (stubs excluded). */
  listImplemented(): string[] {
    return ['zoom']
  },
}
