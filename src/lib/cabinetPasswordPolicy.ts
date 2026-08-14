/** Client-side mirror of server assertValidNewPassword (api/_lib/auth/session.ts). */

export type PasswordRuleChecks = {
  length: boolean
  upper: boolean
  digit: boolean
  symbol: boolean
  noWhitespace: boolean
}

export function evaluatePasswordRules(password: string): PasswordRuleChecks {
  return {
    length: password.length >= 12 && password.length <= 128,
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    noWhitespace: password.length === 0 || !/\s/.test(password),
  }
}

export function passwordMeetsPolicy(password: string): boolean {
  const rules = evaluatePasswordRules(password)
  return rules.length && rules.upper && rules.digit && rules.symbol && rules.noWhitespace
}
