import {Cookie} from 'lucide-react'
import {TRANSLATIONS} from '../data/translations'
import type {Locale} from '../data/locales'

interface CookieBannerProps {
  currentLang: Locale
  onAccept: () => void
  onNecessaryOnly: () => void
  onOpenPrivacy: () => void
}

/**
 * GDPR cookie consent banner.
 * Analytics load only after "Accept"; "Necessary only" refuses optional trackers.
 */
export default function CookieBanner({
  currentLang,
  onAccept,
  onNecessaryOnly,
  onOpenPrivacy,
}: CookieBannerProps) {
  const t = TRANSLATIONS[currentLang]

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.cookie_dialog}
      className="fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-4 pointer-events-none"
    >
      <div className="max-w-7xl mx-auto pointer-events-auto glass-card rounded-2xl border border-brand-slate-200/60 dark:border-brand-slate-700/60 shadow-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-brand-blue-500/10 text-brand-blue-500 flex items-center justify-center">
            <Cookie className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-left">
            <p className="text-sm font-display font-semibold text-brand-slate-900 dark:text-white">
              {t.cookie_title}
            </p>
            <p className="text-[11px] sm:text-xs text-brand-slate-600 dark:text-brand-slate-400 leading-relaxed">
              {t.cookie_body}{' '}
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-brand-blue-500 hover:underline font-medium"
              >
                {t.cookie_privacy_link}
              </button>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-col xs:flex-row sm:flex-row gap-2 sm:shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onNecessaryOnly}
            className="px-4 py-2.5 rounded-xl text-xs font-medium border border-brand-slate-200 dark:border-brand-slate-700 bg-white dark:bg-brand-slate-900 text-brand-slate-700 dark:text-brand-slate-200 hover:border-brand-blue-500 transition-all"
          >
            {t.cookie_necessary}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-4 py-2.5 rounded-xl text-xs font-medium bg-brand-blue-500 hover:bg-brand-blue-600 text-white shadow-md shadow-brand-blue-500/15 transition-all"
          >
            {t.cookie_accept}
          </button>
        </div>
      </div>
    </div>
  )
}
