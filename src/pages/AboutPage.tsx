import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import {useSiteSettingsResource} from '../hooks/content/useSiteSettingsResource'
import MissionBenefitsSection from '../components/MissionBenefitsSection'
import DirectionsSection from '../components/DirectionsSection'
import FoundersSection from '../components/FoundersSection'
import {Handshake} from 'lucide-react'

interface AboutPageProps {
  currentLang: Locale
}

const ABOUT_INTRO = {
  uk: 'Громадська спілка «Українська Асоціація Професійної Безпеки» (UAOS) об’єднує виробників, постачальників засобів індивідуального захисту, підприємства-споживачі та незалежних експертів з охорони праці. Ми працюємо для того, щоб безпека праці в Україні була не формальністю, а реальним стандартом якості.',
  en: 'The Public Union “Ukrainian Association of Occupational Safety” (UAOS) brings together PPE manufacturers and suppliers, consumer enterprises, and independent occupational safety experts. We work to make workplace safety in Ukraine a real quality standard, not a formality.',
}

const ABOUT_VISION = {
  uk: 'Бачимо Україну як країну з розвиненою культурою безпеки праці, де підприємства обирають перевірених партнерів, а стандарти якості засобів захисту відповідають найкращим європейським практикам.',
  en: 'We envision Ukraine as a country with a mature occupational safety culture, where enterprises choose verified partners and protective equipment quality standards match the best European practices.',
}

const ABOUT_PARTNERS_NOTE = {
  uk: 'Перелік партнерських організацій формується — інформація буде доповнена після підтвердження офіційних домовленостей.',
  en: 'The list of partner organizations is being compiled — information will be added once official agreements are confirmed.',
}

export default function AboutPage({currentLang}: AboutPageProps) {
  const t = TRANSLATIONS[currentLang]
  const {data: settings} = useSiteSettingsResource(true)
  useDocumentMeta({
    title: `${t.nav_about} — ${t.brand_name}`,
    description: ABOUT_INTRO[currentLang],
  })

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 mb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
          {t.nav_about}
        </h1>
        <p className="text-sm sm:text-base text-brand-slate-600 dark:text-brand-slate-200 leading-relaxed max-w-3xl mx-auto">
          {ABOUT_INTRO[currentLang]}
        </p>
      </div>

      <MissionBenefitsSection currentLang={currentLang} />

      <section className="scroll-mt-24 py-6 lg:py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-xs font-mono font-bold tracking-widest text-brand-blue-500 dark:text-brand-sky-300 uppercase mb-3">
          {currentLang === 'uk' ? 'Бачення' : 'Vision'}
        </h2>
        <p className="text-lg sm:text-xl font-display font-medium text-brand-slate-800 dark:text-white leading-relaxed">
          {ABOUT_VISION[currentLang]}
        </p>
      </section>

      {settings.aboutGoalsShowOnSite ? <DirectionsSection currentLang={currentLang} /> : null}

      <FoundersSection currentLang={currentLang} />

      <section id="partners" className="scroll-mt-24 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-brand-blue-50 dark:bg-brand-blue-950/40 text-brand-blue-500">
              <Handshake className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
              {currentLang === 'uk' ? 'Партнери' : 'Partners'}
            </h2>
            <p className="text-sm text-brand-slate-500 dark:text-brand-slate-300 leading-relaxed max-w-xl mx-auto">
              {ABOUT_PARTNERS_NOTE[currentLang]}
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
