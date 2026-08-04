import type {Locale} from '../data/locales'
import PrivacyPage from '../components/PrivacyPage'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'

interface PrivacyRoutePageProps {
  currentLang: Locale
  onBack: () => void
}

/**
 * Изолирует privacy route как самостоятельный page-level контейнер.
 */
export default function PrivacyRoutePage({currentLang, onBack}: PrivacyRoutePageProps) {
  const t = TRANSLATIONS[currentLang]
  useDocumentMeta({title: `${t.footer_privacy} — ${t.brand_name}`})

  return <PrivacyPage currentLang={currentLang} onBack={onBack} />
}
