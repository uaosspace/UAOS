/** Pure helpers: single access-level ladder (not multi-role sets). */

export const ACCESS_LEVELS = ['partner', 'member', 'staff', 'board', 'superadmin'] as const
export type AccessLevel = (typeof ACCESS_LEVELS)[number]

/** Levels that can be stored on member_users (superadmin is session-derived). */
export const ASSIGNABLE_ACCESS_LEVELS = ['partner', 'member', 'staff', 'board'] as const
export type AssignableAccessLevel = (typeof ASSIGNABLE_ACCESS_LEVELS)[number]

const RANK: Record<string, number> = {
  partner: 1,
  member: 2,
  staff: 3,
  board: 4,
  superadmin: 5,
}

export function isAccessLevel(value: string): value is AccessLevel {
  return value in RANK
}

export function isAssignableAccessLevel(value: string): value is AssignableAccessLevel {
  return (ASSIGNABLE_ACCESS_LEVELS as readonly string[]).includes(value)
}

export function accessRank(level: string | null | undefined): number {
  if (!level) return 0
  const normalized = level.trim().toLowerCase()
  return RANK[normalized] ?? 0
}

/** Empty minRole means any authenticated level (rank >= 1) is enough. */
export function hasAccessAtLeast(
  userLevel: string | null | undefined,
  minRole: string | null | undefined,
): boolean {
  const userRank = accessRank(userLevel)
  if (userRank <= 0) return false
  const min = (minRole ?? '').trim().toLowerCase()
  if (!min) return true
  return userRank >= accessRank(min)
}

export function canViewEvent(input: {
  visibility: string
  accessMinRole: string
  userLevel: string | null | undefined
}): boolean {
  if (input.visibility !== 'restricted') return true
  return hasAccessAtLeast(input.userLevel, input.accessMinRole)
}

export function canJoinMeeting(input: {
  accessMinRole: string
  userLevel: string | null | undefined
}): boolean {
  return hasAccessAtLeast(input.userLevel, input.accessMinRole)
}

/** Max assignable level among a legacy role list (for backfill helpers / tests). */
export function maxAssignableLevel(roles: readonly string[]): AssignableAccessLevel {
  let best: AssignableAccessLevel = 'partner'
  let bestRank = 0
  for (const raw of roles) {
    const role = raw.trim().toLowerCase()
    const mapped = role === 'other' ? 'partner' : role
    if (!isAssignableAccessLevel(mapped)) continue
    const rank = accessRank(mapped)
    if (rank > bestRank) {
      bestRank = rank
      best = mapped
    }
  }
  return bestRank > 0 ? best : 'member'
}

/**
 * Who should receive meeting notify emails for a given event min role.
 * Empty minRole → all cabinet users; board-only → board; else target level + board.
 */
export function resolveEventNotifyLevels(minRole: string): AssignableAccessLevel[] {
  const min = minRole.trim().toLowerCase()
  if (!min) return [...ASSIGNABLE_ACCESS_LEVELS]
  if (min === 'board') return ['board']
  if (isAssignableAccessLevel(min)) return [min, 'board']
  return ['board']
}

/** Lowest assignable threshold among a legacy role list. Empty → ''. */
export function minAssignableThreshold(roles: readonly string[]): string {
  if (roles.length === 0) return ''
  let best = ''
  let bestRank = Number.POSITIVE_INFINITY
  for (const raw of roles) {
    const role = raw.trim().toLowerCase()
    const mapped = role === 'other' ? 'partner' : role
    if (!isAssignableAccessLevel(mapped)) continue
    const rank = accessRank(mapped)
    if (rank > 0 && rank < bestRank) {
      bestRank = rank
      best = mapped
    }
  }
  return best
}
