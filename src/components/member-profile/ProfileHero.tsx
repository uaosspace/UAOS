import type {Locale} from '../../data/locales'
import {resolveLocalized} from '../../data/locales'
import {renderMemberName} from '../MembersCarousel'
import type {AssociationMember} from '../../types'

interface ProfileHeroProps {
  currentLang: Locale
  member: AssociationMember
}

/**
 * Показывает обложку, название и короткий брендовый блок профиля участника.
 */
export default function ProfileHero({currentLang, member}: ProfileHeroProps) {
  return (
    <div className="relative rounded-3xl overflow-hidden h-64 md:h-80 shadow-lg mb-8 border border-brand-slate-100 dark:border-brand-slate-800/40">
      {member.coverImageUrl ? (
        <img
          src={member.coverImageUrl}
          alt={resolveLocalized(member.name, currentLang)}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="eager"
          sizes="(min-width: 1024px) 1152px, 100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-grid-pattern opacity-50 bg-brand-slate-100 dark:bg-brand-slate-950" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-slate-950 via-brand-slate-950/40 to-transparent" />

      <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 flex flex-col md:flex-row md:items-end justify-between gap-6 text-left">
        <div className="space-y-2">
          <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider bg-brand-blue-500 text-white">
            {resolveLocalized(member.category, currentLang)}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white leading-tight">
            {renderMemberName(resolveLocalized(member.name, currentLang))}
          </h1>
        </div>

        <div className="shrink-0 self-start md:self-end bg-white dark:bg-brand-slate-900 p-3 rounded-2xl shadow-xl border border-white/20">
          <span className="block font-display font-black text-lg tracking-tighter text-brand-blue-600 dark:text-brand-sky-300">
            {member.shortName}
          </span>
        </div>
      </div>
    </div>
  )
}
