import type {Locale} from '../data/locales'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import StatsSection from '../components/StatsSection'
import ParticipantsSection from '../components/ParticipantsSection'
import NewsSection from '../components/NewsSection'
import JoinSection from '../components/JoinSection'
import type {AssociationMember} from '../types'
import type {AppRoute} from '../routes/appRoutes'

interface HomePageProps {
  currentLang: Locale
  currentRoute?: AppRoute
  members: AssociationMember[]
  onNavigate: (route: AppRoute | 'admin', options?: {skipScrollToTop?: boolean}) => void
  onSelectMember: (slug: string) => void
}

/**
 * Домашня сторінка — заготовка за Industrial Neon макетом.
 */
export default function HomePage({
  currentLang,
  currentRoute = 'home',
  members,
  onNavigate,
  onSelectMember,
}: HomePageProps) {
  return (
    <>
      <HeroSection currentLang={currentLang} currentRoute={currentRoute} onNavigate={onNavigate} />
      <FeaturesSection currentLang={currentLang} currentRoute={currentRoute} onNavigate={onNavigate} />
      <StatsSection currentLang={currentLang} />
      <ParticipantsSection
        currentLang={currentLang}
        members={members}
        onSelectMember={onSelectMember}
      />
      <NewsSection currentLang={currentLang} currentRoute={currentRoute} onNavigate={onNavigate} />
      <JoinSection currentLang={currentLang} />
    </>
  )
}
