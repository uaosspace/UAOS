import type {Locale} from '../../data/locales'
import {Globe, Mail, Phone} from 'lucide-react'
import {TRANSLATIONS} from '../../data/translations'
import type {AssociationMember} from '../../types'

interface ProfileContactCardProps {
  currentLang: Locale
  member: AssociationMember
}

/**
 * Показывает публичные контактные данные участника и ссылку на его сайт.
 */
export default function ProfileContactCard({currentLang, member}: ProfileContactCardProps) {
  const t = TRANSLATIONS[currentLang]

  return (
    <div className="rounded-2xl glass-card p-6 shadow-md text-left space-y-6">
      <h3 className="text-base font-display font-bold text-brand-slate-900 dark:text-white uppercase tracking-wider font-semibold border-b border-brand-slate-100 dark:border-brand-slate-800 pb-2">
        {currentLang === 'uk' ? 'Контакти учасника' : 'Member Contacts'}
      </h3>

      <div className="space-y-4">
        {member.websiteUrl && (
          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 text-brand-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="block text-brand-slate-400 text-[9px] font-mono uppercase font-bold">
                {currentLang === 'uk' ? 'Офіційний сайт' : 'Official website'}
              </span>
              <a
                href={member.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-brand-blue-500 dark:text-brand-sky-300 hover:underline flex items-center space-x-1"
              >
                <span>{member.websiteUrl.replace('https://', '').replace('/', '')}</span>
              </a>
            </div>
          </div>
        )}

        {member.publicEmail && (
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-brand-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="block text-brand-slate-400 text-[9px] font-mono uppercase font-bold">
                E-mail
              </span>
              <a
                href={`mailto:${member.publicEmail}`}
                className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-300 hover:text-brand-blue-500"
              >
                {member.publicEmail}
              </a>
            </div>
          </div>
        )}

        {member.publicPhone && (
          <div className="flex items-start space-x-3">
            <Phone className="w-5 h-5 text-brand-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="block text-brand-slate-400 text-[9px] font-mono uppercase font-bold">
                {currentLang === 'uk' ? 'Телефон' : 'Phone'}
              </span>
              <a
                href={`tel:${member.publicPhone}`}
                className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-300 hover:text-brand-blue-500"
              >
                {member.publicPhone}
              </a>
            </div>
          </div>
        )}
      </div>

      {member.websiteUrl && (
        <div className="pt-4">
          <a
            href={member.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 rounded-xl bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-medium text-xs text-center shadow-sm hover:shadow transition-all"
          >
            {t.profile_visit_site}
          </a>
        </div>
      )}
    </div>
  )
}
