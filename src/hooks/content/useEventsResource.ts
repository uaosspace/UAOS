import {fetchEvents} from '../../data/events'
import {INITIAL_EVENTS} from '../../data/events'
import {useContentResource} from './useContentResource'

/**
 * Загружает события только для сценариев домашней страницы и календаря.
 */
export function useEventsResource(enabled: boolean) {
  return useContentResource(fetchEvents, INITIAL_EVENTS, enabled)
}
