import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {Megaphone, Users2, BookOpenCheck, ListChecks, CalendarCheck2} from 'lucide-react'

interface AdvantagesSectionProps {
  currentLang: Locale
}

/**
 * Блок «Переваги участі» на головній (розділ 6.6 ТЗ) — окремий контент від
 * MissionBenefitsSection (Практична користь на /about), щоб не дублювати той самий копірайт.
 */
export default function AdvantagesSection({currentLang}: AdvantagesSectionProps) {
  const t = TRANSLATIONS[currentLang]

  const items = [
    {icon: Megaphone, title: t.advantages_1_title, desc: t.advantages_1_desc},
    {icon: Users2, title: t.advantages_2_title, desc: t.advantages_2_desc},
    {icon: BookOpenCheck, title: t.advantages_3_title, desc: t.advantages_3_desc},
    {icon: ListChecks, title: t.advantages_4_title, desc: t.advantages_4_desc},
    {icon: CalendarCheck2, title: t.advantages_5_title, desc: t.advantages_5_desc},
  ]

  return (
    <section id="advantages" className="scroll-mt-24 py-6 lg:py-8 bg-transparent transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <h2 className="text-xs font-mono font-bold tracking-widest text-brand-blue-500 dark:text-brand-sky-300 uppercase">
            {t.advantages_kicker}
          </h2>
          <p className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
            {t.advantages_title}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {items.map(({icon: Icon, title, desc}) => (
            <div key={title} className="glass-card rounded-2xl p-5 space-y-3">
              <div className="inline-flex items-center justify-center p-2.5 rounded-lg bg-brand-blue-50 dark:bg-brand-blue-950/40 text-brand-blue-500">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-display font-bold text-brand-slate-900 dark:text-white leading-snug">
                {title}
              </h3>
              <p className="text-xs text-brand-slate-600 dark:text-brand-slate-300 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
