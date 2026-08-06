import {describe, expect, it} from 'vitest'
import {
  applicantKindLabel,
  localizedFieldLabel,
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

  it('rebuilds content field labels for any locale and keeps the required marker', () => {
    expect(localizedFieldLabel('Заголовок UK *', 'de')).toBe('Заголовок DE *')
    expect(localizedFieldLabel('Короткий опис UK', 'kk')).toBe('Короткий опис KK')
    expect(localizedFieldLabel('Title UK *', 'uk')).toBe('Title UA *')
    expect(localizedFieldLabel('Слоган UK', 'uk')).toBe('Слоган UA')
  })
})
