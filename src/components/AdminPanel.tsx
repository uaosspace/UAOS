import type {Locale} from '../data/locales'
import React from 'react'
import {ExternalLink, Shield} from 'lucide-react'
import {TRANSLATIONS} from '../data/translations'
import {sanityConfigured, sanityStudioUrl} from '../lib/sanity'

interface AdminPanelProps {
  currentLang: Locale
  onNavigate: (route: string) => void
  onRefreshData: () => void
}

/**
 * Admin section is intentionally disabled for the initial public release.
 * Content editing happens in Sanity Studio (authenticated editors only).
 */
export default function AdminPanel({currentLang, onNavigate}: AdminPanelProps) {
  const t = TRANSLATIONS[currentLang]

  return (
    <section className="pt-28 pb-20 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-4 rounded-2xl glass-card p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-blue-50 dark:bg-brand-blue-950 text-brand-blue-500">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-display font-bold text-brand-slate-900 dark:text-white">
            {currentLang === 'uk' ? 'Адмінка вимкнена' : 'Admin is disabled'}
          </h2>
          <p className="text-[10px] text-brand-slate-500 font-mono">
            UAOS · CMS HUB · {sanityConfigured ? 'Sanity connected' : 'Sanity not configured'}
          </p>
        </div>

        <p className="text-sm text-brand-slate-600 dark:text-brand-slate-400 leading-relaxed">
          {currentLang === 'uk'
            ? 'Зараз контент редагується тільки в Sanity Studio. Після Publish зміни з’являються на сайті для всіх відвідувачів.'
            : 'Right now content is editable only in Sanity Studio. After Publish, changes appear on the site for everyone.'}
        </p>

        <a
          href={sanityStudioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-blue-500 hover:bg-brand-blue-600 text-white text-sm font-medium shadow-md shadow-brand-blue-500/15"
        >
          <ExternalLink className="w-4 h-4" />
          {currentLang === 'uk' ? 'Відкрити Sanity Studio' : 'Open Sanity Studio'}
        </a>

        <button
          onClick={() => onNavigate('home')}
          className="w-full py-3 rounded-xl bg-white dark:bg-brand-slate-900 border border-brand-slate-200 dark:border-brand-slate-800 hover:border-brand-blue-500 text-xs font-medium text-brand-slate-700 dark:text-brand-slate-200 transition-all"
        >
          {currentLang === 'uk' ? 'На головну' : 'Back to home'}
        </button>
      </div>
    </section>
  )
}
