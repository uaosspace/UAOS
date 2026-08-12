import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useReveal} from '../hooks/useReveal'
import {useSiteSettingsResource} from '../hooks/content/useSiteSettingsResource'

interface StatsSectionProps {
  currentLang: Locale
}

const STATS = [
  {
    icon: 'icon-users',
    valueKey: 'statsMembersValue' as const,
    labelKey: 'stats_members_label' as const,
    fallbackKey: 'stats_members_value' as const,
  },
  {
    icon: 'icon-factory',
    valueKey: 'statsProducersValue' as const,
    labelKey: 'stats_producers_label' as const,
    fallbackKey: 'stats_producers_value' as const,
  },
  {
    icon: 'icon-check',
    valueKey: 'statsProjectsValue' as const,
    labelKey: 'stats_projects_label' as const,
    fallbackKey: 'stats_projects_value' as const,
  },
  {
    icon: 'icon-calendar',
    valueKey: 'statsYearsValue' as const,
    labelKey: 'stats_years_label' as const,
    fallbackKey: 'stats_years_value' as const,
  },
]

export default function StatsSection({currentLang}: StatsSectionProps) {
  const t = TRANSLATIONS[currentLang]
  const revealRef = useReveal<HTMLDivElement>()
  const {data: settings, loading} = useSiteSettingsResource(true)

  if (loading) return null
  if (!settings.statsShowOnSite) return null

  return (
    <section className="section stats" aria-label={t.stats_aria}>
      <div className="container stats-grid reveal" ref={revealRef}>
        {STATS.map((stat) => {
          const fromSettings = settings[stat.valueKey]?.trim()
          const value = fromSettings || t[stat.fallbackKey]
          return (
            <div key={stat.valueKey} className="stat">
              <svg aria-hidden="true">
                <use href={`#${stat.icon}`} />
              </svg>
              <div>
                <strong>{value}</strong>
                <span>{t[stat.labelKey]}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
