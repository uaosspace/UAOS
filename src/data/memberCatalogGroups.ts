/**
 * Public members catalogue groups (витрина /members), not join-form labels.
 * Maps PARTICIPANT_TYPES ids → short catalogue sections.
 * Reserved groups stay disabled until content/types exist.
 */

export type MemberCatalogGroupId =
  | 'consumers'
  | 'suppliers'
  | 'experts'
  | 'institutions'
  | 'gr-partners'
  | 'other'

export type MemberCatalogGroupDef = {
  id: MemberCatalogGroupId
  /** When false, omitted from public catalogue (reserved for later). */
  enabled: boolean
  participantTypeIds: readonly string[]
  label: {uk: string; en: string}
}

export const MEMBER_CATALOG_GROUPS: readonly MemberCatalogGroupDef[] = [
  {
    id: 'consumers',
    enabled: true,
    participantTypeIds: ['consumer-enterprise'],
    label: {uk: 'Споживачі', en: 'Consumers'},
  },
  {
    id: 'suppliers',
    enabled: true,
    participantTypeIds: ['producer-supplier'],
    label: {uk: 'Постачальники', en: 'Suppliers'},
  },
  {
    id: 'experts',
    enabled: true,
    participantTypeIds: ['expert-org'],
    label: {uk: 'Експерти', en: 'Experts'},
  },
  {
    id: 'institutions',
    enabled: false,
    participantTypeIds: ['institution'],
    label: {uk: 'Інститути', en: 'Institutions'},
  },
  {
    id: 'gr-partners',
    enabled: false,
    participantTypeIds: ['gr-partner'],
    label: {uk: 'GR-партнери', en: 'GR partners'},
  },
  {
    id: 'other',
    enabled: true,
    participantTypeIds: ['other'],
    label: {uk: 'Інше', en: 'Other'},
  },
]

export function resolveMemberCatalogGroupIds(
  participantTypes: readonly string[],
): MemberCatalogGroupId[] {
  const matched: MemberCatalogGroupId[] = []
  for (const group of MEMBER_CATALOG_GROUPS) {
    if (!group.enabled) continue
    if (participantTypes.some((typeId) => group.participantTypeIds.includes(typeId))) {
      matched.push(group.id)
    }
  }
  if (matched.length === 0) return ['other']
  return matched
}

export function primaryMemberCatalogGroupId(
  participantTypes: readonly string[],
): MemberCatalogGroupId {
  return resolveMemberCatalogGroupIds(participantTypes)[0] ?? 'other'
}

/** Only groups that currently have at least one member (empty sections stay hidden). */
export function groupMembersByCatalogGroup<T extends {participantTypes: readonly string[]}>(
  members: readonly T[],
): {group: MemberCatalogGroupDef; members: T[]}[] {
  const enabled = MEMBER_CATALOG_GROUPS.filter((group) => group.enabled)
  return enabled
    .map((group) => ({
      group,
      members: members.filter((member) =>
        resolveMemberCatalogGroupIds(member.participantTypes).includes(group.id),
      ),
    }))
    .filter((section) => section.members.length > 0)
}

export function catalogGroupLabel(
  groupId: MemberCatalogGroupId,
  locale: 'uk' | 'en',
): string {
  const group = MEMBER_CATALOG_GROUPS.find((item) => item.id === groupId)
  return group ? group.label[locale] : groupId
}
