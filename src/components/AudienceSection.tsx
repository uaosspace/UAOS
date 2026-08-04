import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {Factory, Building2, GraduationCap, ArrowRight} from 'lucide-react'

interface AudienceSectionProps {
  currentLang: Locale
  onCtaClick?: () => void
}

/**
 * Блок «Для кого створена UAOS» (розділ 6.3 ТЗ) — спільний для головної та /join,
 * щоб уникнути дублювання окремої моделі даних під ту саму аудиторію (PARTICIPANT_TYPES).
 */
export default function AudienceSection({currentLang, onCtaClick}: AudienceSectionProps) {
  const t = TRANSLATIONS[currentLang]

  const cards = [
    {icon: Factory, title: t.audience_producer_title, desc: t.audience_producer_desc},
    {icon: Building2, title: t.audience_consumer_title, desc: t.audience_consumer_desc},
    {icon: GraduationCap, title: t.audience_expert_title, desc: t.audience_expert_desc},
  ]

  return (
    <section id="audience" className="scroll-mt-24 py-6 lg:py-8 bg-transparent transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <h2 className="text-xs font-mono font-bold tracking-widest text-brand-blue-500 dark:text-brand-sky-300 uppercase">
            {t.audience_kicker}
          </h2>
          <p className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
            {t.audience_title}
          </p>
          <p className="text-sm text-brand-slate-500 dark:text-brand-slate-300">{t.audience_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cards.map(({icon: Icon, title, desc}) => (
            <div key={title} className="glass-card rounded-2xl p-6 text-center space-y-3">
              <div className="inline-flex items-center justify-center p-3 rounded-xl bg-brand-blue-50 dark:bg-brand-blue-950/40 text-brand-blue-500">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-display font-bold text-brand-slate-900 dark:text-white">{title}</h3>
              <p className="text-sm text-brand-slate-600 dark:text-brand-slate-300 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {onCtaClick && (
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={onCtaClick}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-blue-500 hover:text-brand-blue-600 dark:text-brand-sky-300"
            >
              {t.audience_cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
