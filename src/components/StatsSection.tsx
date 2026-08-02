import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useReveal} from '../hooks/useReveal'

interface StatsSectionProps {
  currentLang: Locale
}

const STATS = [
  {icon: 'icon-users', valueKey: 'stats_members_value', labelKey: 'stats_members_label'},
  {icon: 'icon-factory', valueKey: 'stats_producers_value', labelKey: 'stats_producers_label'},
  {icon: 'icon-check', valueKey: 'stats_projects_value', labelKey: 'stats_projects_label'},
  {icon: 'icon-calendar', valueKey: 'stats_years_value', labelKey: 'stats_years_label'},
] as const

export default function StatsSection({currentLang}: StatsSectionProps) {
  const t = TRANSLATIONS[currentLang]
  const revealRef = useReveal<HTMLDivElement>()

  return (
    <section className="section stats" aria-label={t.stats_aria}>
      <div className="container stats-grid reveal" ref={revealRef}>
        {STATS.map((stat) => (
          <div key={stat.valueKey} className="stat">
            <svg aria-hidden="true">
              <use href={`#${stat.icon}`} />
            </svg>
            <div>
              <strong>{t[stat.valueKey]}</strong>
              <span>{t[stat.labelKey]}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
