type RateEntry = {count: number; resetAt: number}

/**
 * Простая in-memory защита от спама для serverless endpoint-а.
 */
export class MemoryRateLimiter {
  private readonly entries = new Map<string, RateEntry>()

  constructor(
    private readonly windowMs: number,
    private readonly limitPerWindow: number
  ) {}

  /**
   * Возвращает `true`, если лимит для ключа уже исчерпан в текущем окне.
   */
  isLimited(key: string): boolean {
    const now = Date.now()
    const existing = this.entries.get(key)

    if (!existing || now > existing.resetAt) {
      this.entries.set(key, {count: 1, resetAt: now + this.windowMs})
      return false
    }

    if (existing.count >= this.limitPerWindow) {
      return true
    }

    this.entries.set(key, {count: existing.count + 1, resetAt: existing.resetAt})
    return false
  }
}
