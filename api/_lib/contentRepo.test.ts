import {describe, expect, it} from 'vitest'
import {readLocalizedColumn} from './contentRepo'

describe('readLocalizedColumn', () => {
  it('prefers the JSONB value over the legacy text columns', () => {
    expect(
      readLocalizedColumn({uk: 'Назва', en: 'Name', de: 'Name (DE)'}, 'stale uk', 'stale en'),
    ).toEqual({uk: 'Назва', en: 'Name', de: 'Name (DE)'})
  })

  it('falls back to legacy columns for rows written before the migration', () => {
    expect(readLocalizedColumn({}, 'Назва', 'Name')).toEqual({uk: 'Назва', en: 'Name'})
    expect(readLocalizedColumn(null, 'Назва', '')).toEqual({uk: 'Назва', en: ''})
  })

  it('falls back per locale when JSONB holds only some locales', () => {
    expect(readLocalizedColumn({de: 'Hallo'}, 'Привіт', 'Hello')).toEqual({
      uk: 'Привіт',
      en: 'Hello',
      de: 'Hallo',
    })
  })

  it('ignores blank and non-string JSONB entries', () => {
    expect(readLocalizedColumn({uk: '   ', en: 'Name', de: 42}, 'legacy uk', 'legacy en')).toEqual({
      uk: 'legacy uk',
      en: 'Name',
    })
  })

  it('accepts a JSON string, as some drivers return jsonb unparsed', () => {
    expect(readLocalizedColumn('{"uk":"Назва","fr":"Nom"}', '', '')).toEqual({
      uk: 'Назва',
      en: '',
      fr: 'Nom',
    })
  })
})
