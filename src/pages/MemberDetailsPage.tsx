import type {Locale} from '../data/locales'
import MemberProfile from '../components/MemberProfile'
import type {AssociationMember} from '../types'

interface MemberDetailsPageProps {
  currentLang: Locale
  member: AssociationMember
  onBack: () => void
}

/**
 * Отрисовывает страницу публичного профиля выбранного участника.
 */
export default function MemberDetailsPage({currentLang, member, onBack}: MemberDetailsPageProps) {
  return <MemberProfile currentLang={currentLang} member={member} onBack={onBack} />
}
