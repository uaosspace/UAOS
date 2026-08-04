import {useEffect} from 'react'
import type {Locale} from '../data/locales'
import {resolveLocalized} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {ACTIVITY_DIRECTIONS} from '../data/activityDirections'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import {scrollToSection} from '../hooks/useSectionNavigation'

interface ActivityPageProps {
  currentLang: Locale
  anchor?: string
}

export default function ActivityPage({currentLang, anchor}: ActivityPageProps) {
  const t = TRANSLATIONS[currentLang]
  useDocumentMeta({
    title: `${t.nav_activity} — ${t.brand_name}`,
    description: resolveLocalized(
      {uk: 'Чотири напрями діяльності UAOS: представництво, стандарти, експертиза, партнерство.', en: 'Four UAOS activity directions: representation, standards, expertise, partnership.'},
      currentLang,
    ),
  })

  useEffect(() => {
    if (!anchor) return
    const timer = window.setTimeout(() => scrollToSection(anchor), 80)
    return () => window.clearTimeout(timer)
  }, [anchor])

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-10">
        <h1 className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
          {t.nav_activity}
        </h1>
        <p className="text-sm sm:text-base text-brand-slate-600 dark:text-brand-slate-200 leading-relaxed max-w-2xl mx-auto">
          {t.activity_intro}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {ACTIVITY_DIRECTIONS.slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((direction, index) => (
            <section
              key={direction.id}
              id={direction.anchor}
              className="scroll-mt-24 glass-card rounded-2xl p-6 sm:p-8"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-blue-50 dark:bg-brand-blue-950/40 text-brand-blue-500 shrink-0">
                  <svg className="w-6 h-6" aria-hidden="true">
                    <use href={`#${direction.icon}`} />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-brand-slate-400 uppercase tracking-wider">
                    0{index + 1}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-slate-900 dark:text-white leading-snug">
                    {resolveLocalized(direction.title, currentLang)}
                  </h2>
                </div>
              </div>

              <p className="text-sm sm:text-base text-brand-slate-700 dark:text-brand-slate-200 leading-relaxed mb-6">
                {resolveLocalized(direction.description, currentLang)}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-slate-500 dark:text-brand-slate-300 mb-3">
                    {t.activity_goals_label}
                  </h3>
                  <ul className="space-y-2">
                    {direction.goals.map((goal) => (
                      <li
                        key={resolveLocalized(goal, currentLang)}
                        className="flex items-start gap-2 text-sm text-brand-slate-600 dark:text-brand-slate-200"
                      >
                        <span className="flex h-1.5 w-1.5 rounded-full bg-brand-blue-500 mt-1.5 shrink-0" />
                        {resolveLocalized(goal, currentLang)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-slate-500 dark:text-brand-slate-300 mb-3">
                    {t.activity_formats_label}
                  </h3>
                  <ul className="space-y-2">
                    {direction.formats.map((format) => (
                      <li
                        key={resolveLocalized(format, currentLang)}
                        className="flex items-start gap-2 text-sm text-brand-slate-600 dark:text-brand-slate-200"
                      >
                        <span className="flex h-1.5 w-1.5 rounded-full bg-brand-yellow-400 mt-1.5 shrink-0" />
                        {resolveLocalized(format, currentLang)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
      </div>
    </article>
  )
}
