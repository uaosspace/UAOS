import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import ScribbleLink from '../components/ScribbleLink'

interface NotFoundPageProps {
  currentLang: Locale
  onBackHome: () => void
}

export default function NotFoundPage({currentLang, onBackHome}: NotFoundPageProps) {
  const t = TRANSLATIONS[currentLang]
  useDocumentMeta({title: `${t.page_not_found} — ${t.brand_name}`})

  return (
    <div className="container py-32 text-center space-y-4">
      <h2 className="text-2xl font-bold">{t.page_not_found}</h2>
      <ScribbleLink as="button" type="button" onClick={onBackHome} compact>
        <span className="label">{t.back_home}</span>
        <span className="arrow">→</span>
      </ScribbleLink>
    </div>
  )
}
