import {useDocumentsResource} from './content/useDocumentsResource'
import {useEventsResource} from './content/useEventsResource'
import {useMembersResource} from './content/useMembersResource'
import {useNewsResource} from './content/useNewsResource'
import {useSiteSettingsResource} from './content/useSiteSettingsResource'
import {APP_ROUTES, type AppRoute} from '../routes/appRoutes'

/**
 * Координирует загрузку контента по зонам экрана, а не одним глобальным батчем.
 */
export function useSiteContent(currentRoute: AppRoute) {
  const needsHomeContent = currentRoute === APP_ROUTES.home
  const needsMembers = currentRoute === APP_ROUTES.home || currentRoute === APP_ROUTES.memberDetails

  const siteSettings = useSiteSettingsResource(true)
  const members = useMembersResource(needsMembers)
  const events = useEventsResource(needsHomeContent)
  const documents = useDocumentsResource(needsHomeContent)
  const news = useNewsResource(needsHomeContent)

  const contentLoading = needsHomeContent
    ? siteSettings.loading || members.loading || events.loading || documents.loading || news.loading
    : currentRoute === APP_ROUTES.memberDetails
      ? siteSettings.loading || members.loading
      : siteSettings.loading

  return {
    members: members.data,
    documents: documents.data,
    events: events.data,
    news: news.data,
    siteSettings: siteSettings.data,
    contentLoading,
    refreshContentData: async () => {
      await Promise.all([
        siteSettings.refresh(),
        needsMembers ? members.refresh() : Promise.resolve(),
        needsHomeContent ? events.refresh() : Promise.resolve(),
        needsHomeContent ? documents.refresh() : Promise.resolve(),
        needsHomeContent ? news.refresh() : Promise.resolve(),
      ])
    },
  }
}
