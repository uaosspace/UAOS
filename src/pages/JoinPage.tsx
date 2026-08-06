import {useEffect} from 'react'
import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import {scrollToSection} from '../hooks/useSectionNavigation'
import AudienceSection from '../components/AudienceSection'
import JoinApplicationForm from '../components/join/JoinApplicationForm'
import {FileCheck, ClipboardCheck, Mail, BadgeCheck} from 'lucide-react'

interface JoinPageProps {
  currentLang: Locale
  /** Якір з URL (#join-form) — скрол до форми після CTA «Стати учасником». */
  anchor?: string
  onOpenPrivacy: () => void
  onOpenTerms: () => void
}

const STEP_ICONS = [FileCheck, ClipboardCheck, Mail, BadgeCheck]

export default function JoinPage({currentLang, anchor, onOpenPrivacy, onOpenTerms}: JoinPageProps) {
  const t = TRANSLATIONS[currentLang]
  useDocumentMeta({
    title: `${t.join_title_before} ${t.join_title_underlit} — ${t.brand_name}`,
    description: t.join_page_intro,
  })

  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, '')
    const target = anchor || fromHash
    if (target !== 'join-form') return
    const timer = window.setTimeout(() => scrollToSection('join-form'), 100)
    return () => window.clearTimeout(timer)
  }, [anchor])

  const steps = [
    {title: t.join_step_1_title, desc: t.join_step_1_desc},
    {title: t.join_step_2_title, desc: t.join_step_2_desc},
    {title: t.join_step_3_title, desc: t.join_step_3_desc},
    {title: t.join_step_4_title, desc: t.join_step_4_desc},
  ]

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
          {t.join_title_before} {t.join_title_underlit}
        </h1>
        <p className="text-sm sm:text-base text-brand-slate-600 dark:text-brand-slate-200 leading-relaxed max-w-2xl mx-auto">
          {t.join_page_intro}
        </p>
      </div>

      <AudienceSection currentLang={currentLang} />

      <section className="scroll-mt-24 py-6 lg:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xs font-mono font-bold tracking-widest text-brand-blue-500 dark:text-brand-sky-300 uppercase mb-3">
                {t.join_reqs_title}
              </h2>
              <ul className="space-y-2.5">
                {[t.join_req_1, t.join_req_2, t.join_req_3, t.join_req_4].map((req) => (
                  <li key={req} className="flex items-start gap-2 text-sm text-brand-slate-600 dark:text-brand-slate-200">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-brand-blue-500 mt-1.5 shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xs font-mono font-bold tracking-widest text-brand-blue-500 dark:text-brand-sky-300 uppercase mb-3">
                {t.join_benefits_title}
              </h2>
              <ul className="space-y-2.5">
                {[t.join_benefit_1, t.join_benefit_2, t.join_benefit_3, t.join_benefit_4].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm text-brand-slate-600 dark:text-brand-slate-200">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-brand-yellow-400 mt-1.5 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-mt-24 py-6 lg:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-display font-bold text-brand-slate-900 dark:text-white mb-8">
            {t.join_steps_title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, index) => {
              const Icon = STEP_ICONS[index]
              return (
                <div key={step.title} className="glass-card rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-blue-50 dark:bg-brand-blue-950/40 text-brand-blue-500 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-brand-slate-400 uppercase">0{index + 1}</span>
                  </div>
                  <h3 className="text-sm font-display font-bold text-brand-slate-900 dark:text-white">{step.title}</h3>
                  <p className="text-xs text-brand-slate-600 dark:text-brand-slate-300 leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="join-form" className="scroll-mt-24 py-6 lg:py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-display font-bold text-brand-slate-900 dark:text-white mb-6">
            {t.join_form_title}
          </h2>
          <JoinApplicationForm
            currentLang={currentLang}
            onOpenPrivacy={onOpenPrivacy}
            onOpenTerms={onOpenTerms}
          />
        </div>
      </section>
    </article>
  )
}
