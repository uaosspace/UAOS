import {describe, expect, it} from 'vitest'
import {markdownishToParagraphs} from './protocolDocx'

describe('markdownishToParagraphs', () => {
  it('maps headings and bullets', () => {
    const paragraphs = markdownishToParagraphs(
      ['# Title', '', '## Section', '- Item one', 'Plain text'].join('\n'),
    )
    expect(paragraphs.length).toBeGreaterThanOrEqual(4)
  })

  it('handles empty input', () => {
    expect(markdownishToParagraphs('').length).toBe(1)
  })
})
