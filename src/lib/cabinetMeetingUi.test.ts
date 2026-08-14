import {describe, expect, it} from 'vitest'
import {
  cabinetMeetingStatusKey,
  formatCabinetEventWhen,
  isCabinetMeetingJoinable,
} from './cabinetMeetingUi'

describe('cabinetMeetingUi', () => {
  it('formats event time for uk without raw ISO noise', () => {
    const text = formatCabinetEventWhen('2026-08-20T12:00:00.000Z', 'uk')
    expect(text).toMatch(/2026/)
    expect(text).not.toMatch(/T12:00/)
  })

  it('maps joinable statuses', () => {
    expect(isCabinetMeetingJoinable('ready')).toBe(true)
    expect(isCabinetMeetingJoinable('live')).toBe(true)
    expect(isCabinetMeetingJoinable('awaiting_artifacts')).toBe(true)
    expect(isCabinetMeetingJoinable('pending')).toBe(false)
    expect(isCabinetMeetingJoinable('cancelled')).toBe(false)
  })

  it('maps status keys for copy', () => {
    expect(cabinetMeetingStatusKey('awaiting_artifacts')).toBe('ended')
    expect(cabinetMeetingStatusKey('sync_error')).toBe('error')
    expect(cabinetMeetingStatusKey('weird')).toBe('unavailable')
  })
})
