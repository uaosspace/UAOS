import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import StatsSection from '../components/StatsSection'
import AudienceSection from '../components/AudienceSection'
import ParticipantsSection from '../components/ParticipantsSection'
import NewsSection from '../components/NewsSection'
import AdvantagesSection from '../components/AdvantagesSection'
import JoinSection from '../components/JoinSection'
import type {AssociationMember, AssociationEvent} from '../types'
import type {NewsItem} from '../data/news'
import {APP_ROUTES, type AppRoute} from '../routes/appRoutes'

interface HomePageProps {
  currentLang: Locale
  members: AssociationMember[]
  news: NewsItem[]
  events: AssociationEvent[]
  onNavigate: (route: AppRoute, options?: {anchor?: string}) => void
  onSelectMember: (slug: string, originRoute: AppRoute) => void
  onSelectNews: (slug: string) => void
  onSelectEvent: (eventId: string) => void
}

/**
 * Домашня сторінка — порядок секцій за розділом 6 ТЗ.
 */
export default function HomePage({
  currentLang,
  members,
  news,
  events,
  onNavigate,
  onSelectMember,
  onSelectNews,
  onSelectEvent,
}: HomePageProps) {
  const t = TRANSLATIONS[currentLang]
  useDocumentMeta({title: t.brand_name, description: t.hero_lead})

  return (
    <>
      <HeroSection currentLang={currentLang} onNavigate={onNavigate} />
      <FeaturesSection currentLang={currentLang} onNavigate={onNavigate} />
      <AudienceSection currentLang={currentLang} onCtaClick={() => onNavigate(APP_ROUTES.join, {anchor: 'join-form'})} />
      <StatsSection currentLang={currentLang} />
      <ParticipantsSection
        currentLang={currentLang}
        members={members}
        onSelectMember={(slug) => onSelectMember(slug, APP_ROUTES.home)}
        onViewAllMembers={() => onNavigate(APP_ROUTES.membersCatalog)}
      />
      <NewsSection
        currentLang={currentLang}
        news={news}
        events={events}
        onSelectNews={onSelectNews}
        onSelectEvent={onSelectEvent}
        onNavigate={onNavigate}
      />
      <AdvantagesSection currentLang={currentLang} />
      <JoinSection currentLang={currentLang} onCtaClick={() => onNavigate(APP_ROUTES.join, {anchor: 'join-form'})} />
    </>
  )
}
