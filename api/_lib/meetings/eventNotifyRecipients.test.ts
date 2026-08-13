import {describe, expect, it} from 'vitest'
import {
  mergeUniqueEmails,
  parseNotifyFilterRole,
  parseNotifyPickerMode,
  parseNotifyRecipients,
} from './eventNotifyRecipients.js'

describe('event notify recipient parsing', () => {
  it('defaults picker mode to by_role', () => {
    expect(parseNotifyPickerMode(undefined)).toBe('by_role')
    expect(parseNotifyPickerMode('by_members')).toBe('by_members')
    expect(parseNotifyPickerMode('nope')).toBe('by_role')
  })

  it('accepts only assignable filter roles', () => {
    expect(parseNotifyFilterRole('board')).toBe('board')
    expect(parseNotifyFilterRole('superadmin')).toBe('')
    expect(parseNotifyFilterRole('')).toBe('')
  })

  it('keeps only valid checked recipients', () => {
    expect(
      parseNotifyRecipients([
        {
          memberUserId: '59ef3f26-de5e-4fa0-be68-a0b11feb8427',
          notifyMeeting: true,
          notifyProtocol: false,
        },
        {memberUserId: 'not-a-uuid', notifyMeeting: true, notifyProtocol: true},
        {
          memberUserId: '0abd8abe-fed1-4306-acc3-df4dc3995adf',
          notifyMeeting: false,
          notifyProtocol: false,
        },
        {
          memberUserId: '59ef3f26-de5e-4fa0-be68-a0b11feb8427',
          notifyMeeting: false,
          notifyProtocol: true,
        },
      ]),
    ).toEqual([
      {
        memberUserId: '59ef3f26-de5e-4fa0-be68-a0b11feb8427',
        notifyMeeting: true,
        notifyProtocol: false,
      },
    ])
  })

  it('merges protocol ops emails with selected people', () => {
    expect(
      mergeUniqueEmails(
        ['Director@uaos.example', 'admin@uaos.example'],
        ['admin@uaos.example', 'board@uaos.example'],
      ),
    ).toEqual(['director@uaos.example', 'admin@uaos.example', 'board@uaos.example'])
  })
})
