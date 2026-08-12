import {describe, expect, it} from 'vitest'
import {TRANSLATIONS} from '../../data/translations'
import {describeAdminMeeting} from './meetingStatusCopy'

describe('describeAdminMeeting', () => {
  const t = TRANSLATIONS.uk

  it('explains missing meeting', () => {
    expect(describeAdminMeeting(null, t).headline).toBe(t.admin_meeting_none)
  })

  it('explains ready meeting with join link and schedule', () => {
    const view = describeAdminMeeting(
      {
        status: 'ready',
        joinUrl: 'https://zoom.example/j/1',
        scheduledStartAt: '2026-08-12T13:00:00.000Z',
        scheduledEndAt: '2026-08-12T13:10:00.000Z',
        timezone: 'Europe/Kyiv',
      },
      t,
    )
    expect(view.headline).toBe(t.admin_meeting_status_ready)
    expect(view.joinUrl).toContain('zoom.example')
    expect(view.schedule).toContain('16:00')
    expect(view.missingJoin).toBe(false)
  })

  it('flags ready meeting without join url', () => {
    const view = describeAdminMeeting({status: 'ready', joinUrl: ''}, t)
    expect(view.missingJoin).toBe(true)
  })
})
