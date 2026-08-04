import type {Locale} from '../data/locales'
import MemberProfile from '../components/MemberProfile'
import type {AssociationMember} from '../types'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'

interface MemberDetailsPageProps {
  currentLang: Locale
  member: AssociationMember
  onBack: () => void
}

/**
 * Отрисовывает страницу публичного профиля выбранного участника.
 */
export default function MemberDetailsPage({currentLang, member, onBack}: MemberDetailsPageProps) {
  const t = TRANSLATIONS[currentLang]
  useDocumentMeta({
    title: `${member.name[currentLang]} — ${t.brand_name}`,
    description: member.shortDescription[currentLang],
    ogImage: member.coverImageUrl || member.logoUrl,
    ogType: 'profile',
  })

  return <MemberProfile currentLang={currentLang} member={member} onBack={onBack} />
}
