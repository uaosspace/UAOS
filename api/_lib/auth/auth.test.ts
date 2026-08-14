import {describe, expect, it} from 'vitest'
import {generateTotpSecret, verifyTotpCode, buildOtpAuthUrl} from './totp.js'
import {hashPassword, verifyPassword, hashToken, createSessionToken} from './crypto.js'
import {roleHasPermission, roleRequiresMfa} from './policy.js'
import {
  assertValidNewPassword,
  generateRecoveryMfaCode,
  generateTempAdminPassword,
  hashRecoveryMfaCode,
  recoveryMfaHashesEqual,
} from './session.js'

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
    expect(() => assertValidNewPassword('LongEnoughPass1')).toThrow(/symbol/)
    expect(() => assertValidNewPassword('LongEnoughPass!')).toThrow(/digit/)
    expect(() => assertValidNewPassword('longenough1!aa')).toThrow(/uppercase/)
    expect(() => assertValidNewPassword('LongEnough1!aa')).not.toThrow()
  })

  it('generates temporary passwords that pass policy', () => {
    const password = generateTempAdminPassword()
    expect(() => assertValidNewPassword(password)).not.toThrow()
    expect(password).not.toMatch(/\s/)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[^A-Za-z0-9]/)
  })

  it('hashes recovery MFA codes in a timing-safe comparable form', () => {
    const code = generateRecoveryMfaCode(() => Buffer.from([0, 0, 0, 42]))
    expect(code).toMatch(/^\d{6}$/)
    const hash = hashRecoveryMfaCode(code)
    expect(recoveryMfaHashesEqual(hash, code)).toBe(true)
    expect(recoveryMfaHashesEqual(hash, '000000')).toBe(false)
  })
})
