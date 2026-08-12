import {createHmac} from 'node:crypto'
import {describe, expect, it, vi} from 'vitest'
import {
  canJoinMeeting,
  canViewEvent,
  hasAccessAtLeast,
  maxAssignableLevel,
  minAssignableThreshold,
  resolveEventNotifyLevels,
} from './access.js'
import {MeetingProviderRegistry} from './registry.js'
import {
  buildZoomCrcResponse,
  toZoomLocalStartTime,
  verifyZoomWebhookSignature,
} from './providers/zoom/zoomProvider.js'
import {ProviderNotImplementedError} from './types.js'
import {buildEventPageUrl} from './meetingNotify.js'

describe('meeting access ladder', () => {
  it('compares ranks on the ladder', () => {
    expect(hasAccessAtLeast('board', 'member')).toBe(true)
    expect(hasAccessAtLeast('member', 'board')).toBe(false)
    expect(hasAccessAtLeast('partner', '')).toBe(true)
    expect(hasAccessAtLeast(null, 'member')).toBe(false)
    expect(hasAccessAtLeast('superadmin', 'board')).toBe(true)
  })

  it('allows public visibility for viewing regardless of level', () => {
    expect(
      canViewEvent({visibility: 'public', accessMinRole: 'board', userLevel: null}),
    ).toBe(true)
  })

  it('requires ladder for restricted view and for join', () => {
    expect(
      canViewEvent({
        visibility: 'restricted',
        accessMinRole: 'board',
        userLevel: 'staff',
      }),
    ).toBe(false)
    expect(
      canViewEvent({
        visibility: 'restricted',
        accessMinRole: 'board',
        userLevel: 'board',
      }),
    ).toBe(true)
    expect(canJoinMeeting({accessMinRole: 'member', userLevel: 'partner'})).toBe(false)
    expect(canJoinMeeting({accessMinRole: '', userLevel: 'partner'})).toBe(true)
  })

  it('maps legacy multi-roles to max/min levels', () => {
    expect(maxAssignableLevel(['member', 'board'])).toBe('board')
    expect(minAssignableThreshold(['board', 'member'])).toBe('member')
    expect(minAssignableThreshold([])).toBe('')
  })

  it('allows restricted view for board and superadmin by ladder', () => {
    expect(
      canViewEvent({
        visibility: 'restricted',
        accessMinRole: 'board',
        userLevel: 'board',
      }),
    ).toBe(true)
    expect(
      canViewEvent({
        visibility: 'restricted',
        accessMinRole: 'board',
        userLevel: 'superadmin',
      }),
    ).toBe(true)
    expect(
      canViewEvent({
        visibility: 'restricted',
        accessMinRole: 'board',
        userLevel: 'member',
      }),
    ).toBe(false)
    expect(
      canViewEvent({
        visibility: 'restricted',
        accessMinRole: 'board',
        userLevel: null,
      }),
    ).toBe(false)
  })

  it('resolves event notify levels for audience mail', () => {
    expect(resolveEventNotifyLevels('')).toEqual(['partner', 'member', 'staff', 'board'])
    expect(resolveEventNotifyLevels('board')).toEqual(['board'])
    expect(resolveEventNotifyLevels('member')).toEqual(['member', 'board'])
    expect(resolveEventNotifyLevels('staff')).toEqual(['staff', 'board'])
    expect(resolveEventNotifyLevels('partner')).toEqual(['partner', 'board'])
  })
})

describe('meeting notify urls', () => {
  it('builds event page urls from SITE_URL', () => {
    expect(buildEventPageUrl('board-q1', {SITE_URL: 'https://uaos.example/'})).toBe(
      'https://uaos.example/events/board-q1',
    )
  })
})

describe('Zoom local start_time', () => {
  it('formats UTC ISO as Kyiv wall clock without Z for Zoom API', () => {
    // 16:00 Europe/Kyiv (EEST, UTC+3) on 2026-08-12
    expect(toZoomLocalStartTime('2026-08-12T13:00:00.000Z', 'Europe/Kyiv')).toBe(
      '2026-08-12T16:00:00',
    )
  })
})

describe('MeetingProviderRegistry', () => {
  it('knows zoom/teams/meet and only implements zoom', () => {
    expect(MeetingProviderRegistry.has('zoom')).toBe(true)
    expect(MeetingProviderRegistry.has('teams')).toBe(true)
    expect(MeetingProviderRegistry.has('webex')).toBe(false)
    expect(MeetingProviderRegistry.listImplemented()).toEqual(['zoom'])
  })

  it('stubs throw ProviderNotImplementedError', async () => {
    const teams = MeetingProviderRegistry.get('teams')
    await expect(
      teams.createMeeting({
        topic: 'x',
        startAt: new Date().toISOString(),
        timezone: 'Europe/Kyiv',
      }),
    ).rejects.toBeInstanceOf(ProviderNotImplementedError)
  })
})

describe('zoom webhook verify helpers', () => {
  it('validates HMAC signature and CRC', () => {
    const secret = 'test-secret'
    const timestamp = '1658940994'
    const rawBody = JSON.stringify({event: 'meeting.ended', event_ts: 1, payload: {}})
    const signatureHeader = `v0=${createHmac('sha256', secret)
      .update(`v0:${timestamp}:${rawBody}`)
      .digest('hex')}`
    expect(
      verifyZoomWebhookSignature({
        secretToken: secret,
        timestamp,
        rawBody,
        signatureHeader,
      }),
    ).toBe(true)
    const crc = buildZoomCrcResponse('plain', secret)
    expect(crc.plainToken).toBe('plain')
    expect(crc.encryptedToken).toHaveLength(64)
  })
})

describe('meeting public DTO shape', () => {
  it('toMeetingPublicDto never exposes startUrl fields', async () => {
    const {toMeetingPublicDto} = await import('./meetingsRepo.js')
    const dto = toMeetingPublicDto({
      id: '1',
      eventId: '2',
      provider: 'zoom',
      externalId: '9',
      externalUuid: 'u',
      joinUrl: 'https://example.test/j/1',
      startUrlEncrypted: 'secret-should-not-leak',
      status: 'ready',
      scheduledStartAt: null,
      scheduledEndAt: null,
      timezone: 'Europe/Kyiv',
      lastSyncError: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    expect(dto).not.toHaveProperty('startUrl')
    expect(dto).not.toHaveProperty('startUrlEncrypted')
    expect(JSON.stringify(dto)).not.toContain('secret-should-not-leak')
    expect(dto.joinUrl).toContain('https://')
  })
})

describe('createMeetingForEvent participation mode', () => {
  it('rejects non-zoom events', async () => {
    vi.resetModules()
    vi.doMock('./meetingsRepo.js', () => ({
      getEventMeetingContext: vi.fn().mockResolvedValue({
        id: 'ev-1',
        slug: 'offline-event',
        titleUk: 'Подія',
        titleEn: 'Event',
        startAt: new Date().toISOString(),
        endAt: new Date().toISOString(),
        timezone: 'Europe/Kyiv',
        participationMode: 'offline',
      }),
      getMeetingByEventId: vi.fn(),
      insertMeeting: vi.fn(),
    }))
    const {createMeetingForEvent} = await import('./meetingService.js')
    await expect(createMeetingForEvent({eventId: 'ev-1'})).rejects.toThrow(/participation mode zoom/)
    vi.doUnmock('./meetingsRepo.js')
    vi.resetModules()
  })
})
