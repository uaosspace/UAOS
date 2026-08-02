import {fetchNews, type NewsItem} from '../../data/news'
import {useContentResource} from './useContentResource'

/**
 * Загружает новости независимо от остальных коллекций домашней страницы.
 */
export function useNewsResource(enabled: boolean) {
  return useContentResource<NewsItem[]>(fetchNews, [], enabled)
}
