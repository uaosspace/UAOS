import type {Locale} from '../../data/locales'
import {resolveLocalized} from '../../data/locales'
import {Award, Briefcase, CheckCircle, FileText, Tag} from 'lucide-react'
import {TRANSLATIONS} from '../../data/translations'
import type {AssociationMember} from '../../types'

interface ProfileExtendedContentProps {
  currentLang: Locale
  member: AssociationMember
}

/**
 * Рендерит расширенные доменные секции профиля участника.
 */
export default function ProfileExtendedContent({
  currentLang,
  member,
}: ProfileExtendedContentProps) {
  const t = TRANSLATIONS[currentLang]

  if (member.profileLevel !== 'extended') return null

  return (
    <>
      {member.competencies && member.competencies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-brand-blue-500 shrink-0" />
            <span>{t.profile_competencies}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {member.competencies.map((competency, index) => (
              <div
                key={index}
                className="p-4 rounded-xl glass-pill flex items-start space-x-3"
              >
                <CheckCircle className="w-4 h-4 text-brand-blue-500 mt-0.5 shrink-0" />
                <span className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-200">
                  {resolveLocalized(competency, currentLang)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {member.services && member.services.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-brand-blue-500 shrink-0" />
            <span>{t.profile_services}</span>
          </h2>
          <ul className="space-y-2.5">
            {member.services.map((service, index) => (
              <li key={index} className="flex items-start space-x-2.5 text-xs text-brand-slate-600 dark:text-brand-slate-200">
                <span className="flex h-1.5 w-1.5 rounded-full bg-brand-blue-500 mt-1.5 shrink-0" />
                <span className="font-sans leading-relaxed">{resolveLocalized(service, currentLang)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {member.products && member.products.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white flex items-center space-x-2">
            <Tag className="w-5 h-5 text-brand-blue-500 shrink-0" />
            <span>{t.profile_products}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {member.products.map((product) => (
              <div
                key={product.id}
                className="p-5 rounded-2xl glass-card flex flex-col justify-between hover:border-brand-blue-500/30 transition-all duration-200 text-left"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-brand-slate-900 dark:text-white">
                    {resolveLocalized(product.name, currentLang)}
                  </h3>
                  <p className="text-xs text-brand-slate-500 dark:text-brand-slate-300">
                    {resolveLocalized(product.description, currentLang)}
                  </p>
                </div>
                {product.price && (
                  <div className="mt-4 pt-2 border-t border-brand-slate-100 dark:border-brand-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-mono text-brand-slate-500 dark:text-brand-slate-350 uppercase font-semibold">
                      {currentLang === 'uk' ? 'Вартість' : 'Price'}
                    </span>
                    <span className="text-xs font-mono font-bold text-brand-blue-500 dark:text-brand-sky-300">
                      {product.price}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {member.cases && member.cases.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-brand-blue-500 shrink-0" />
            <span>{t.profile_cases}</span>
          </h2>
          <div className="space-y-4">
            {member.cases.map((memberCase) => (
              <div
                key={memberCase.id}
                className="p-5 rounded-2xl glass-card shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-4 text-left"
              >
                {memberCase.imageUrl && (
                  <div className="sm:col-span-4 aspect-[4/3] rounded-xl overflow-hidden bg-brand-slate-100">
                    <img
                      src={memberCase.imageUrl}
                      alt={resolveLocalized(memberCase.title, currentLang)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      sizes="(min-width: 640px) 320px, 100vw"
                    />
                  </div>
                )}
                <div className={`space-y-2 ${memberCase.imageUrl ? 'sm:col-span-8' : 'sm:col-span-12'}`}>
                  <h3 className="text-sm font-bold text-brand-slate-900 dark:text-white">
                    {resolveLocalized(memberCase.title, currentLang)}
                  </h3>
                  <p className="text-xs text-brand-slate-500 dark:text-brand-slate-200 leading-relaxed">
                    {resolveLocalized(memberCase.description, currentLang)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {member.certificates && member.certificates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-brand-blue-500 shrink-0" />
            <span>{t.profile_certificates}</span>
          </h2>
          <div className="space-y-2">
            {member.certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="p-3.5 rounded-xl glass-pill flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-brand-blue-500" />
                  <span className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-200">
                    {resolveLocalized(certificate.title, currentLang)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
