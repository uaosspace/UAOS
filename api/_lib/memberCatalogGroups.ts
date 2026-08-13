/**
 * Server copy of public catalogue group mapping (keep in sync with src/data/memberCatalogGroups.ts).
 * API must not import from src/.
 */

export type MemberCatalogGroupId =
  | 'consumers'
  | 'suppliers'
  | 'experts'
  | 'institutions'
  | 'gr-partners'
  | 'other'

type GroupDef = {
  id: MemberCatalogGroupId
  enabled: boolean
  participantTypeIds: readonly string[]
  labelUk: string
  labelEn: string
}

export const MEMBER_CATALOG_GROUPS: readonly GroupDef[] = [
  {
    id: 'consumers',
    enabled: true,
    participantTypeIds: ['consumer-enterprise'],
    labelUk: 'Споживачі',
    labelEn: 'Consumers',
  },
  {
    id: 'suppliers',
    enabled: true,
    participantTypeIds: ['producer-supplier'],
    labelUk: 'Постачальники',
    labelEn: 'Suppliers',
  },
  {
    id: 'experts',
    enabled: true,
    participantTypeIds: ['expert-org'],
    labelUk: 'Експерти',
    labelEn: 'Experts',
  },
  {
    id: 'institutions',
    enabled: false,
    participantTypeIds: ['institution'],
    labelUk: 'Інститути',
    labelEn: 'Institutions',
  },
  {
    id: 'gr-partners',
    enabled: false,
    participantTypeIds: ['gr-partner'],
    labelUk: 'GR-партнери',
    labelEn: 'GR partners',
  },
  {
    id: 'other',
    enabled: true,
    participantTypeIds: ['other'],
    labelUk: 'Інше',
    labelEn: 'Other',
  },
]

export function primaryMemberCatalogGroupId(
  participantTypes: readonly string[],
): MemberCatalogGroupId {
  for (const group of MEMBER_CATALOG_GROUPS) {
    if (!group.enabled) continue
    if (participantTypes.some((typeId) => group.participantTypeIds.includes(typeId))) {
      return group.id
    }
  }
  return 'other'
}

export function catalogGroupLabels(groupId: MemberCatalogGroupId): {uk: string; en: string} {
  const group = MEMBER_CATALOG_GROUPS.find((item) => item.id === groupId)
  return group
    ? {uk: group.labelUk, en: group.labelEn}
    : {uk: groupId, en: groupId}
}
