import {describe, expect, it} from 'vitest'
import {TRANSLATIONS} from '../data/translations'
import {localizeCabinetApiError} from './cabinetApiErrors'

describe('localizeCabinetApiError', () => {
  const uk = TRANSLATIONS.uk
  const en = TRANSLATIONS.en

  it('maps invalid current password for uk/en', () => {
    expect(localizeCabinetApiError('Invalid current password', uk)).toBe(
      uk.cabinet_invalid_current_password,
    )
    expect(localizeCabinetApiError('Invalid current password', en)).toBe(
      en.cabinet_invalid_current_password,
    )
  })

  it('maps credentials and rate-limit messages', () => {
    expect(localizeCabinetApiError('Invalid credentials', uk)).toBe(uk.cabinet_invalid_credentials)
    expect(localizeCabinetApiError('Too many requests', uk)).toBe(uk.cabinet_too_many_requests)
  })

  it('maps cabinet password recovery errors', () => {
    expect(localizeCabinetApiError('Recovery email is not configured', uk)).toBe(
      uk.cabinet_forgot_unavailable,
    )
    expect(localizeCabinetApiError('Email required', en)).toBe(en.cabinet_forgot_need_email)
  })

  it('never returns raw English for unknown API strings', () => {
    const out = localizeCabinetApiError('Some obscure English failure', uk)
    expect(out).toBe(uk.cabinet_request_failed)
    expect(out).not.toMatch(/obscure/i)
  })
})
