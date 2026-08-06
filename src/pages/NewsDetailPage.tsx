import type {Locale} from '../data/locales'
import {resolveLocalized} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import type {NewsItem} from '../data/news'
import {ArrowLeft, ExternalLink} from 'lucide-react'

interface NewsDetailPageProps {
  currentLang: Locale
  item: NewsItem
  onBack: () => void
}

function formatDate(iso: string, locale: Locale) {
  try {
    return new Date(iso).toLocaleDateString(locale, {day: 'numeric', month: 'long', year: 'numeric'})
  } catch {
    return iso.slice(0, 10)
  }
}

export default function NewsDetailPage({currentLang, item, onBack}: NewsDetailPageProps) {
  const t = TRANSLATIONS[currentLang]
  const titleText = resolveLocalized(item.title, currentLang)
  const excerptText = resolveLocalized(item.excerpt, currentLang)
  useDocumentMeta({
    title: `${titleText} — ${t.brand_name}`,
    description: excerptText,
    ogImage: item.coverImageUrl,
    ogType: 'article',
  })

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-slate-500 hover:text-brand-blue-500 dark:hover:text-brand-sky-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.events_back_to_list}
        </button>

        {item.coverImageUrl && (
          <div className="rounded-2xl overflow-hidden mb-8 border border-brand-slate-100 dark:border-brand-slate-800">
            <img src={item.coverImageUrl} alt="" className="w-full max-h-[380px] object-cover" />
          </div>
        )}

        <span className="text-xs font-mono text-brand-slate-400 uppercase">{formatDate(item.publishedAt, currentLang)}</span>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-slate-900 dark:text-white leading-tight mt-2 mb-6">
          {titleText}
        </h1>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-lg text-brand-slate-700 dark:text-brand-slate-200 font-medium mb-6">
            {excerptText}
          </p>
          {item.externalUrl ? (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-5 py-3 text-sm font-semibold text-white no-underline hover:bg-brand-blue-700"
            >
              {t.news_open_external}
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          ) : (
            <div className="text-brand-slate-600 dark:text-brand-slate-200 whitespace-pre-line leading-relaxed">
              {resolveLocalized(item.body, currentLang)}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
