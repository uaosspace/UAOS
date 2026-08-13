import {describe, expect, it} from 'vitest'
import {
  buildProtocolPrompt,
  composeProtocolSummary,
  fallbackDraftFromTranscript,
  normalizeProtocolResponse,
} from './geminiMeetingProtocol.js'

describe('composeProtocolSummary', () => {
  it('puts detailed protocol above brief report', () => {
    expect(composeProtocolSummary('Деталі', 'Коротко')).toContain('## Детальний протокол')
    expect(composeProtocolSummary('Деталі', 'Коротко')).toContain('## Короткий звіт')
    expect(composeProtocolSummary('Деталі', 'Коротко').indexOf('Деталі')).toBeLessThan(
      composeProtocolSummary('Деталі', 'Коротко').indexOf('Коротко'),
    )
  })
})

describe('normalizeProtocolResponse', () => {
  it('composes summary from detailedProtocol and briefReport', () => {
    const result = normalizeProtocolResponse({
      detailedProtocol: '## Рішення\n- A',
      briefReport: 'Узгодили A.',
      topics: ['A', ''],
      decisions: ['Рішення 1'],
      actionItems: ['Зробити X'],
    })
    expect(result.summary).toContain('## Детальний протокол')
    expect(result.summary).toContain('## Короткий звіт')
    expect(result.summary).toContain('Узгодили A.')
    expect(result.topics).toEqual(['A'])
    expect(result.decisions).toEqual(['Рішення 1'])
    expect(result.actionItems).toEqual(['Зробити X'])
  })

  it('accepts legacy summary field', () => {
    expect(
      normalizeProtocolResponse({
        summary: 'Короткий підсумок',
        topics: [],
        decisions: [],
        actionItems: [],
      }).summary,
    ).toBe('Короткий підсумок')
  })

  it('rejects missing protocol text', () => {
    expect(() => normalizeProtocolResponse({topics: []})).toThrow(/summary/i)
  })
})

describe('buildProtocolPrompt', () => {
  it('asks for detailed protocol and brief report', () => {
    const prompt = buildProtocolPrompt({transcriptText: 'hello', meetingTitle: 'Тест'}, 'hello')
    expect(prompt).toContain('Тест')
    expect(prompt).toContain('hello')
    expect(prompt).toContain('detailedProtocol')
    expect(prompt).toContain('briefReport')
    expect(prompt).toContain('## Поручення')
    expect(prompt).toContain('short report')
  })
})

describe('fallbackDraftFromTranscript', () => {
  it('puts transcript into detailed section without inventing decisions', () => {
    const draft = fallbackDraftFromTranscript('Текст зустрічі', 'Назва')
    expect(draft.sourceProvider).toBe('manual_transcript')
    expect(draft.summary).toContain('## Детальний протокол')
    expect(draft.summary).toContain('## Короткий звіт')
    expect(draft.summary).toContain('Назва')
    expect(draft.summary).toContain('Текст зустрічі')
    expect(draft.decisions).toEqual([])
  })
})
