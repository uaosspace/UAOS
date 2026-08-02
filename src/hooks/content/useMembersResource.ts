import {fetchMembers, INITIAL_MEMBERS} from '../../data/members'
import {useContentResource} from './useContentResource'

/**
 * Загружает список участников только для экранов, где он реально нужен.
 */
export function useMembersResource(enabled: boolean) {
  return useContentResource(fetchMembers, INITIAL_MEMBERS, enabled)
}
