import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'

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
    {title: t.advantages_1_title, desc: t.advantages_1_desc},
    {title: t.advantages_2_title, desc: t.advantages_2_desc},
    {title: t.advantages_3_title, desc: t.advantages_3_desc},
    {title: t.advantages_4_title, desc: t.advantages_4_desc},
    {title: t.advantages_5_title, desc: t.advantages_5_desc},
  ]

  return (
    <section id="advantages" className="scroll-mt-24 py-6 lg:py-8 bg-transparent transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
            {t.advantages_title}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {items.map(({title, desc}) => (
            <div key={title} className="glass-card rounded-2xl p-5 space-y-3">
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
