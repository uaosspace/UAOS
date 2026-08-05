import {describe, expect, it} from 'vitest'
import {
  applicantKindLabel,
  sectorLabel,
  statsKeyLabel,
  statusLabel,
} from './adminLabels'
import {TRANSLATIONS} from '../../data/translations'

describe('adminLabels', () => {
  const tUk = TRANSLATIONS.uk
  const tEn = TRANSLATIONS.en

  it('localizes statuses and reference ids', () => {
    expect(statusLabel(tUk, 'rejected')).toBe('Відхилено')
    expect(statusLabel(tEn, 'rejected')).toBe('Rejected')
    expect(applicantKindLabel('uk', tUk, 'producer-supplier')).toBe('Виробники та постачальники')
    expect(sectorLabel('uk', tUk, 'other-sector')).toBe('Інша галузь')
    expect(statsKeyLabel('status', 'accepted', 'uk', tUk)).toBe('Прийнято')
    expect(statsKeyLabel('sector', 'logistics', 'en', tEn)).toBe('Logistics and transport')
  })
})
