import {describe, expect, it} from 'vitest'
import {MEMBER_SESSION_COOKIE} from './memberSession.js'

describe('member auth surface', () => {
  it('uses a cookie name distinct from the admin session', () => {
    expect(MEMBER_SESSION_COOKIE).toBe('uaos_member_session')
    expect(MEMBER_SESSION_COOKIE).not.toBe('uaos_admin_session')
  })
})
