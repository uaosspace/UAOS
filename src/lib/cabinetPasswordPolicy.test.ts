import {describe, expect, it} from 'vitest'
import {evaluatePasswordRules, passwordMeetsPolicy} from './cabinetPasswordPolicy'

describe('cabinetPasswordPolicy', () => {
  it('accepts a policy-compliant password', () => {
    expect(passwordMeetsPolicy('LongEnough1!aa')).toBe(true)
  })

  it('flags missing classes separately', () => {
    expect(evaluatePasswordRules('short').length).toBe(false)
    expect(evaluatePasswordRules('LongEnoughPass1').symbol).toBe(false)
    expect(evaluatePasswordRules('LongEnoughPass!').digit).toBe(false)
    expect(evaluatePasswordRules('longenough1!aa').upper).toBe(false)
    expect(evaluatePasswordRules('Has Space1!aaa').noWhitespace).toBe(false)
  })
})
