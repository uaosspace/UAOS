import type {Locale} from '../data/locales'
import TermsPage from '../components/TermsPage'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'

interface TermsRoutePageProps {
  currentLang: Locale
  onBack: () => void
}

/**
 * Ізолює /terms як самостійний page-level контейнер.
 */
export default function TermsRoutePage({currentLang, onBack}: TermsRoutePageProps) {
  const t = TRANSLATIONS[currentLang]
  useDocumentMeta({title: `${t.footer_terms} — ${t.brand_name}`})

  return <TermsPage currentLang={currentLang} onBack={onBack} />
}
