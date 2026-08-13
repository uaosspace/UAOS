import {describe, expect, it} from 'vitest'
import {
  groupMembersByCatalogGroup,
  primaryMemberCatalogGroupId,
  resolveMemberCatalogGroupIds,
} from './memberCatalogGroups'

describe('memberCatalogGroups', () => {
  it('maps participant types to catalogue groups', () => {
    expect(resolveMemberCatalogGroupIds(['consumer-enterprise'])).toEqual(['consumers'])
    expect(resolveMemberCatalogGroupIds(['producer-supplier'])).toEqual(['suppliers'])
    expect(resolveMemberCatalogGroupIds(['expert-org'])).toEqual(['experts'])
    expect(resolveMemberCatalogGroupIds(['producer-supplier', 'expert-org'])).toEqual([
      'suppliers',
      'experts',
    ])
    expect(resolveMemberCatalogGroupIds([])).toEqual(['other'])
    expect(resolveMemberCatalogGroupIds(['unknown'])).toEqual(['other'])
  })

  it('ignores reserved (disabled) group type ids for now', () => {
    expect(resolveMemberCatalogGroupIds(['institution'])).toEqual(['other'])
    expect(resolveMemberCatalogGroupIds(['gr-partner'])).toEqual(['other'])
  })

  it('hides empty sections until they have members', () => {
    const sections = groupMembersByCatalogGroup([
      {id: '1', participantTypes: ['expert-org']},
    ])
    expect(sections.map((s) => s.group.id)).toEqual(['experts'])
    expect(sections[0]?.members).toHaveLength(1)
  })

  it('picks stable primary group for export rows', () => {
    expect(primaryMemberCatalogGroupId(['expert-org', 'producer-supplier'])).toBe('suppliers')
  })
})
