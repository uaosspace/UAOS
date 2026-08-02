import type {Locale} from '../data/locales'
import PrivacyPage from '../components/PrivacyPage'

interface PrivacyRoutePageProps {
  currentLang: Locale
  onBack: () => void
}

/**
 * Изолирует privacy route как самостоятельный page-level контейнер.
 */
export default function PrivacyRoutePage({currentLang, onBack}: PrivacyRoutePageProps) {
  return <PrivacyPage currentLang={currentLang} onBack={onBack} />
}
