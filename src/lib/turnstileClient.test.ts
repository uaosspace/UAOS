import {describe, expect, it, vi, afterEach} from 'vitest'
import {TURNSTILE_SCRIPT_SRC, readTurnstileToken, removeTurnstileWidget} from './turnstileClient'

type GlobalTurnstile = typeof globalThis & {
  turnstile?: {
    getResponse?: (id?: string) => string
    remove?: (id: string) => void
  }
}

describe('turnstileClient', () => {
  afterEach(() => {
    delete (globalThis as GlobalTurnstile).turnstile
    vi.restoreAllMocks()
  })

  it('uses explicit-render script URL', () => {
    expect(TURNSTILE_SCRIPT_SRC).toContain('render=explicit')
    expect(TURNSTILE_SCRIPT_SRC).toContain('challenges.cloudflare.com/turnstile')
  })

  it('readTurnstileToken returns empty without api, on throw, and token when ready', () => {
    expect(readTurnstileToken(null)).toBe('')
    expect(readTurnstileToken('w1')).toBe('')

    ;(globalThis as GlobalTurnstile).turnstile = {
      getResponse: () => {
        throw new Error('[Cloudflare Turnstile] Could not find widget.')
      },
    }
    expect(readTurnstileToken('w1')).toBe('')

    ;(globalThis as GlobalTurnstile).turnstile = {
      getResponse: (id) => (id === 'w1' ? 'abc' : ''),
    }
    expect(readTurnstileToken('w1')).toBe('abc')
  })

  it('removeTurnstileWidget ignores missing api and swallows remove errors', () => {
    expect(() => removeTurnstileWidget(null)).not.toThrow()
    expect(() => removeTurnstileWidget('w1')).not.toThrow()

    const remove = vi.fn(() => {
      throw new Error('stale')
    })
    ;(globalThis as GlobalTurnstile).turnstile = {remove}
    expect(() => removeTurnstileWidget('w1')).not.toThrow()
    expect(remove).toHaveBeenCalledWith('w1')
  })
})
