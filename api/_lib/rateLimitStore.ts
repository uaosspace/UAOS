import {getSql, isDatabaseConfigured} from './db.js'
import {MemoryRateLimiter} from './rateLimit.js'

const memoryFallback = new MemoryRateLimiter(10 * 60 * 1000, 5)

/**
 * Distributed rate limit backed by Postgres when DATABASE_URL is set.
 * Falls back to in-memory limiter for local/dev without DB (not production-grade).
 */
export async function isRateLimited(
  bucketKey: string,
  windowMs = 10 * 60 * 1000,
  limit = 5,
): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return memoryFallback.isLimited(bucketKey)
  }

  const sql = getSql()
  const now = new Date()
  const rows = await sql`
    SELECT window_started_at, hit_count
    FROM rate_limits
    WHERE bucket_key = ${bucketKey}
    LIMIT 1
  `

  if (!rows[0]) {
    await sql`
      INSERT INTO rate_limits (bucket_key, window_started_at, hit_count)
      VALUES (${bucketKey}, ${now.toISOString()}, 1)
      ON CONFLICT (bucket_key) DO NOTHING
    `
    return false
  }

  const windowStarted = new Date(String(rows[0].window_started_at))
  const hitCount = Number(rows[0].hit_count ?? 0)
  const elapsed = now.getTime() - windowStarted.getTime()

  if (elapsed >= windowMs) {
    await sql`
      UPDATE rate_limits
      SET window_started_at = ${now.toISOString()}, hit_count = 1
      WHERE bucket_key = ${bucketKey}
    `
    return false
  }

  if (hitCount >= limit) {
    return true
  }

  await sql`
    UPDATE rate_limits
    SET hit_count = hit_count + 1
    WHERE bucket_key = ${bucketKey}
  `
  return false
}
