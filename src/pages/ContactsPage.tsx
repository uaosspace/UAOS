import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import {useSiteSettingsResource} from '../hooks/content/useSiteSettingsResource'
import {Phone, Mail, MapPin, Share2} from 'lucide-react'

interface ContactsPageProps {
  currentLang: Locale
}

export default function ContactsPage({currentLang}: ContactsPageProps) {
  const t = TRANSLATIONS[currentLang]
  const {data: settings} = useSiteSettingsResource(true)
  useDocumentMeta({
    title: `${t.contacts_title} — ${t.brand_name}`,
    description: t.contacts_subtitle,
  })

  const socials = [
    {key: 'linkedin', label: t.social_linkedin},
    {key: 'facebook', label: t.social_facebook},
    {key: 'youtube', label: t.social_youtube},
    {key: 'telegram', label: t.social_telegram},
  ]

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-10">
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
            {t.contacts_title}
          </h1>
          <p className="text-sm sm:text-base text-brand-slate-600 dark:text-brand-slate-200 leading-relaxed">
            {t.contacts_subtitle}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-brand-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-semibold text-brand-slate-500 dark:text-brand-slate-300 mb-0.5">
                {t.contact_address}
              </span>
              <p className="text-sm text-brand-slate-800 dark:text-white whitespace-pre-line">
                {t.footer_address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-brand-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-semibold text-brand-slate-500 dark:text-brand-slate-300 mb-0.5">
                {t.contact_phone}
              </span>
              <a href={`tel:${t.footer_phone.replace(/\s/g, '')}`} className="text-sm text-brand-slate-800 dark:text-white hover:text-brand-blue-500">
                {t.footer_phone}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-brand-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-semibold text-brand-slate-500 dark:text-brand-slate-300 mb-0.5">
                {t.contact_email}
              </span>
              <a href={`mailto:${t.footer_email}`} className="text-sm text-brand-slate-800 dark:text-white hover:text-brand-blue-500">
                {t.footer_email}
              </a>
            </div>
          </div>

          {settings.socialsShowOnSite ? (
          <div className="flex items-start gap-3">
            <Share2 className="w-5 h-5 text-brand-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-semibold text-brand-slate-500 dark:text-brand-slate-300 mb-1.5">
                {t.contact_social}
              </span>
              <div className="flex flex-wrap gap-2">
                {socials.map((social) => (
                  <a
                    key={social.key}
                    href={`mailto:${t.footer_email}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium glass-pill text-brand-slate-700 dark:text-brand-slate-200 hover:border-brand-blue-500"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
