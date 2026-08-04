/**
 * Neon Postgres access for Vercel serverless.
 * Uses @neondatabase/serverless HTTP driver (no TCP pool exhaustion).
 */
import {neon, type NeonQueryFunction} from '@neondatabase/serverless'

let sqlSingleton: NeonQueryFunction<false, false> | null = null

export function isDatabaseConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const url = typeof env.DATABASE_URL === 'string' ? env.DATABASE_URL.trim() : ''
  return url.length > 0
}

export function getSql(env: NodeJS.ProcessEnv = process.env): NeonQueryFunction<false, false> {
  if (!isDatabaseConfigured(env)) {
    throw new Error('DATABASE_URL is not configured')
  }
  if (!sqlSingleton) {
    sqlSingleton = neon(env.DATABASE_URL!.trim())
  }
  return sqlSingleton
}

/** Test helper: reset cached client between env changes. */
export function resetSqlClientForTests() {
  sqlSingleton = null
}
