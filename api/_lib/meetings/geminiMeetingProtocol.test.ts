import {describe, expect, it} from 'vitest'
import {
  buildProtocolPrompt,
  fallbackDraftFromTranscript,
  normalizeProtocolResponse,
} from './geminiMeetingProtocol.js'

describe('normalizeProtocolResponse', () => {
  it('accepts valid protocol JSON', () => {
    expect(
      normalizeProtocolResponse({
        summary: 'Короткий підсумок',
        topics: ['A', ''],
        decisions: ['Рішення 1'],
        actionItems: ['Зробити X'],
      }),
    ).toEqual({
      summary: 'Короткий підсумок',
      topics: ['A'],
      decisions: ['Рішення 1'],
      actionItems: ['Зробити X'],
    })
  })

  it('rejects missing summary', () => {
    expect(() => normalizeProtocolResponse({topics: []})).toThrow(/summary/i)
  })
})

describe('buildProtocolPrompt', () => {
  it('includes title and transcript', () => {
    const prompt = buildProtocolPrompt({transcriptText: 'hello', meetingTitle: 'Тест'}, 'hello')
    expect(prompt).toContain('Тест')
    expect(prompt).toContain('hello')
    expect(prompt).toContain('"summary"')
  })
})

describe('fallbackDraftFromTranscript', () => {
  it('puts transcript into summary without inventing decisions', () => {
    const draft = fallbackDraftFromTranscript('Текст зустрічі', 'Назва')
    expect(draft.sourceProvider).toBe('manual_transcript')
    expect(draft.summary).toContain('Назва')
    expect(draft.summary).toContain('Текст зустрічі')
    expect(draft.decisions).toEqual([])
  })
})
