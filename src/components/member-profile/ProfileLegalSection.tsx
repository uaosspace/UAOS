import type {Locale} from '../../data/locales'
import {ChevronDown, ChevronUp} from 'lucide-react'
import {TRANSLATIONS} from '../../data/translations'
import type {AssociationMember} from '../../types'

interface ProfileLegalSectionProps {
  currentLang: Locale
  member: AssociationMember
  legalOpen: boolean
  onToggle: () => void
}

/**
 * Показывает сворачиваемый юридический блок профиля участника.
 */
export default function ProfileLegalSection({
  currentLang,
  member,
  legalOpen,
  onToggle,
}: ProfileLegalSectionProps) {
  const t = TRANSLATIONS[currentLang]

  return (
    <div className="pt-4 border-t border-brand-slate-100 dark:border-brand-slate-800">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 rounded-xl glass-pill hover:border-brand-blue-500 dark:hover:border-brand-sky-300 transition-all text-xs font-mono font-bold text-brand-slate-600 dark:text-brand-slate-300 uppercase cursor-pointer"
      >
        <span>{t.profile_legal_title}</span>
        {legalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {legalOpen && (
        <div className="p-4 glass-card rounded-b-xl text-left space-y-3">
          <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 italic">
            * {t.profile_legal_disclaimer}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-brand-slate-500 dark:text-brand-slate-400 font-mono">
            <div>
              <span className="block text-brand-slate-400 text-[10px] uppercase font-bold">
                {currentLang === 'uk' ? 'Юридичний статус' : 'Legal status'}
              </span>
              <span className="font-semibold">{member.name.uk}</span>
            </div>
            <div>
              <span className="block text-brand-slate-400 text-[10px] uppercase font-bold">
                {currentLang === 'uk' ? 'Оновлено адміністрацією' : 'Updated by administration'}
              </span>
              <span className="font-semibold">{member.lastUpdated || '2026-07'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
