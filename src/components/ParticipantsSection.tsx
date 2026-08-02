import type {Locale} from '../data/locales'
import MembersCarousel from './MembersCarousel'
import type {AssociationMember} from '../types'

interface ParticipantsSectionProps {
  currentLang: Locale
  members: AssociationMember[]
  onSelectMember: (slug: string) => void
}

/**
 * Секція учасників industrial-оболонки — інтерактивна карусель зі seed/CMS.
 */
export default function ParticipantsSection({
  currentLang,
  members,
  onSelectMember,
}: ParticipantsSectionProps) {
  return (
    <MembersCarousel
      currentLang={currentLang}
      members={members}
      onSelectMember={onSelectMember}
      variant="industrial"
    />
  )
}
