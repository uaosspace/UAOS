import {describe, expect, it} from 'vitest'
import {generateTotpSecret, verifyTotpCode, buildOtpAuthUrl} from './totp.js'
import {hashPassword, verifyPassword, hashToken, createSessionToken} from './crypto.js'
import {roleHasPermission, roleRequiresMfa} from './policy.js'
import {assertValidNewPassword} from './session.js'

describe('admin auth primitives', () => {
  it('hashes and verifies passwords', () => {
    const encoded = hashPassword('correct horse battery')
    expect(verifyPassword('correct horse battery', encoded)).toBe(true)
    expect(verifyPassword('wrong', encoded)).toBe(false)
  })

  it('creates opaque session tokens', () => {
    const token = createSessionToken()
    expect(token.length).toBeGreaterThan(20)
    expect(hashToken(token)).toHaveLength(64)
  })

  it('builds otpauth URLs and rejects invalid TOTP codes', () => {
    const secret = generateTotpSecret()
    expect(buildOtpAuthUrl({secret, email: 'a@b.c'})).toContain('otpauth://totp/')
    expect(verifyTotpCode(secret, 'abcdef')).toBe(false)
    expect(verifyTotpCode(secret, '123')).toBe(false)
  })

  it('applies deny-by-default permissions', () => {
    expect(roleHasPermission('editor', 'applications.read')).toBe(false)
    expect(roleHasPermission('applications', 'applications.read')).toBe(true)
    expect(roleRequiresMfa('admin')).toBe(true)
    expect(roleRequiresMfa('editor')).toBe(false)
  })

  it('enforces password policy without accepting weak values', () => {
    expect(() => assertValidNewPassword('short')).toThrow(/at least/)
    expect(() => assertValidNewPassword('has spaces here!!')).toThrow(/whitespace/)
    expect(() => assertValidNewPassword('a'.repeat(200))).toThrow(/too long/)
    expect(() => assertValidNewPassword('LongEnoughPass1')).not.toThrow()
  })
})
