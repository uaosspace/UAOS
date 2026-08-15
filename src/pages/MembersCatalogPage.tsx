import type {Locale} from '../data/locales'
import {resolveLocalized} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {PARTICIPANT_TYPES, SECTORS} from '../data/referenceLists'
import {groupMembersByCatalogGroup} from '../data/memberCatalogGroups'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import type {AssociationMember} from '../types'
import {ArrowRight} from 'lucide-react'
import {useState} from 'react'

interface MembersCatalogPageProps {
  currentLang: Locale
  members: AssociationMember[]
  onSelectMember: (slug: string) => void
}

function labelFor(list: {id: string; label: {uk: string; en: string}}[], id: string, currentLang: Locale) {
  const item = list.find((entry) => entry.id === id)
  return item ? resolveLocalized(item.label, currentLang) : id
}

/** Логотип учасника з graceful fallback на текстовий бейдж, якщо файлу немає/не завантажився. */
function MemberLogoBadge({logoUrl, shortName, name}: {logoUrl: string; shortName: string; name: string}) {
  const [failed, setFailed] = useState(false)

  if (!logoUrl || failed) {
    return (
      <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-[#b0b0b0] border border-brand-slate-200/50 dark:border-brand-slate-800/50 font-display font-black text-xs tracking-tighter text-brand-blue-600 dark:text-brand-sky-300 shrink-0">
        {shortName || name}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center justify-center h-8 px-2 rounded-lg bg-[#b0b0b0] border border-brand-slate-200/50 dark:border-brand-slate-800/50 shrink-0 overflow-hidden">
      <img
        src={logoUrl}
        alt={shortName || name}
        className="h-6 w-auto max-w-[88px] object-contain"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </span>
  )
}

function MemberCard({
  member,
  currentLang,
  t,
  onSelectMember,
}: {
  member: AssociationMember
  currentLang: Locale
  t: (typeof TRANSLATIONS)[Locale]
  onSelectMember: (slug: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelectMember(member.slug)}
      className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between text-left shadow-sm group"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <MemberLogoBadge
            logoUrl={member.logoUrl}
            shortName={member.shortName}
            name={resolveLocalized(member.name, currentLang)}
          />
          {member.featured && (
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-yellow-500 bg-brand-yellow-50 dark:bg-brand-yellow-950/30 px-2 py-0.5 rounded">
              {t.members_featured_badge}
            </span>
          )}
        </div>

        <h3 className="text-base font-display font-bold text-brand-slate-900 dark:text-white leading-snug group-hover:text-brand-blue-500 dark:group-hover:text-brand-sky-300 transition-colors">
          {resolveLocalized(member.name, currentLang)}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {member.participantTypes.slice(0, 2).map((typeId) => (
            <span
              key={typeId}
              className="text-[10px] font-mono font-semibold uppercase text-brand-blue-600 dark:text-brand-sky-300 bg-brand-blue-50 dark:bg-brand-blue-950/30 px-2 py-0.5 rounded"
            >
              {labelFor(PARTICIPANT_TYPES, typeId, currentLang)}
            </span>
          ))}
          {member.sectors?.slice(0, 1).map((sectorId) => (
            <span
              key={sectorId}
              className="text-[10px] font-mono font-semibold uppercase text-brand-slate-500 dark:text-brand-slate-300 bg-brand-slate-100 dark:bg-brand-slate-800 px-2 py-0.5 rounded"
            >
              {labelFor(SECTORS, sectorId, currentLang)}
            </span>
          ))}
        </div>

        <p className="text-xs text-brand-slate-600 dark:text-brand-slate-200 leading-relaxed line-clamp-3">
          {resolveLocalized(member.shortDescription, currentLang)}
        </p>
      </div>

      <div className="pt-4 mt-4 border-t border-brand-slate-100 dark:border-brand-slate-800 flex items-center justify-between">
        {member.region && (
          <span className="text-[10px] font-mono text-brand-slate-500 dark:text-brand-slate-350 uppercase">
            {member.region}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue-500 group-hover:text-brand-blue-600 dark:text-brand-sky-300">
          {t.btn_read_more}
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  )
}

export default function MembersCatalogPage({currentLang, members, onSelectMember}: MembersCatalogPageProps) {
  const t = TRANSLATIONS[currentLang]
  useDocumentMeta({
    title: `${t.members_title} — ${t.brand_name}`,
    description: t.members_subtitle,
  })

  const publishedMembers = members
    .filter((member) => member.published !== false)
    .sort((a, b) => a.order - b.order)

  const sections = groupMembersByCatalogGroup(publishedMembers)
  const localeKey = currentLang === 'uk' ? 'uk' : 'en'

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
            {t.members_title}
          </h1>
          <p className="text-sm sm:text-base text-brand-slate-600 dark:text-brand-slate-200 leading-relaxed">
            {t.members_subtitle}
          </p>
        </div>

        {publishedMembers.length > 0 ? (
          <div className="space-y-12">
            {sections.map(({group, members: groupMembers}) => (
              <section key={group.id} aria-labelledby={`members-group-${group.id}`}>
                <h2
                  id={`members-group-${group.id}`}
                  className="text-lg sm:text-xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight mb-5"
                >
                  {group.label[localeKey]}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupMembers.map((member) => (
                    <MemberCard
                      key={`${group.id}-${member.id}`}
                      member={member}
                      currentLang={currentLang}
                      t={t}
                      onSelectMember={onSelectMember}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-brand-slate-200 dark:border-brand-slate-800 rounded-2xl max-w-md mx-auto">
            <p className="text-sm font-semibold text-brand-slate-500 dark:text-brand-slate-300 uppercase font-mono">
              {t.docs_empty}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}
