import {describe, expect, it} from 'vitest'
import {
  assertTranslateFieldsInput,
  buildTranslatePrompt,
  extractJsonObject,
  normalizeTranslateResponse,
} from './geminiTranslate.js'

describe('geminiTranslate helpers', () => {
  it('rejects empty fields and same source/target', () => {
    expect(() =>
      assertTranslateFieldsInput({
        sourceLocale: 'uk',
        targetLocales: ['uk'],
        fields: {title: 'Привіт'},
      }),
    ).toThrow(/differ/)

    expect(() =>
      assertTranslateFieldsInput({
        sourceLocale: 'uk',
        targetLocales: ['en'],
        fields: {title: '   '},
      }),
    ).toThrow(/empty/)
  })

  it('builds a prompt that lists field keys and locales', () => {
    const prompt = buildTranslatePrompt({
      sourceLocale: 'uk',
      targetLocales: ['en', 'de'],
      fields: {title: 'Новина', body: 'Текст'},
    })
    expect(prompt).toContain('Source language code: uk')
    expect(prompt).toContain('en, de')
    expect(prompt).toContain('### title')
    expect(prompt).toContain('Новина')
  })

  it('parses raw JSON and fenced JSON', () => {
    expect(extractJsonObject('{"a":1}')).toEqual({a: 1})
    expect(extractJsonObject('```json\n{"a":2}\n```')).toEqual({a: 2})
  })

  it('normalizes translations for requested fields and locales', () => {
    const input = {
      sourceLocale: 'uk' as const,
      targetLocales: ['en', 'de'] as Array<'en' | 'de'>,
      fields: {title: 'Привіт'},
    }
    const normalized = normalizeTranslateResponse(
      {
        translations: {
          title: {en: 'Hello', de: 'Hallo'},
        },
      },
      input,
    )
    expect(normalized.title?.en).toBe('Hello')
    expect(normalized.title?.de).toBe('Hallo')
  })

  it('fails when a target locale is missing', () => {
    expect(() =>
      normalizeTranslateResponse(
        {translations: {title: {en: 'Hello'}}},
        {
          sourceLocale: 'uk',
          targetLocales: ['en', 'de'],
          fields: {title: 'Привіт'},
        },
      ),
    ).toThrow(/Missing de/)
  })
})
