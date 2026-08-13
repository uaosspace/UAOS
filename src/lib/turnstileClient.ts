/**
 * Cloudflare Turnstile client helpers (explicit render for SPA remounts).
 */

export const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

export type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {sitekey: string; theme?: 'light' | 'dark' | 'auto'},
  ) => string
  remove: (widgetId: string) => void
  getResponse: (widgetId?: string) => string
  ready?: (callback: () => void) => void
}

type WindowWithTurnstile = typeof globalThis & {turnstile?: TurnstileApi}

export function getTurnstileApi(): TurnstileApi | undefined {
  return (globalThis as WindowWithTurnstile).turnstile
}

export function removeTurnstileWidget(widgetId: string | null): void {
  if (!widgetId) return
  const api = getTurnstileApi()
  if (!api?.remove) return
  try {
    api.remove(widgetId)
  } catch {
    // ignore stale widget ids on unmount
  }
}

/** Load Turnstile script once; safe to call on every join-form mount. */
export function loadTurnstileScript(): Promise<TurnstileApi> {
  const existingApi = getTurnstileApi()
  if (existingApi) return Promise.resolve(existingApi)

  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Turnstile requires a browser document'))
  }

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-uaos-turnstile]')
  if (existingScript) {
    return new Promise((resolve, reject) => {
      const tryResolve = () => {
        const api = getTurnstileApi()
        if (api) resolve(api)
        else reject(new Error('Turnstile API missing after script load'))
      }
      if (getTurnstileApi()) {
        tryResolve()
        return
      }
      existingScript.addEventListener('load', tryResolve, {once: true})
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Turnstile script failed to load')),
        {once: true},
      )
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.dataset.uaosTurnstile = '1'
    script.addEventListener(
      'load',
      () => {
        const finish = () => {
          const api = getTurnstileApi()
          if (api) resolve(api)
          else reject(new Error('Turnstile API missing after script load'))
        }
        const api = getTurnstileApi()
        if (api?.ready) {
          api.ready(finish)
          return
        }
        finish()
      },
      {once: true},
    )
    script.addEventListener('error', () => reject(new Error('Turnstile script failed to load')), {
      once: true,
    })
    document.head.appendChild(script)
  })
}

export function readTurnstileToken(widgetId: string | null): string {
  if (!widgetId) return ''
  const api = getTurnstileApi()
  if (!api?.getResponse) return ''
  try {
    return api.getResponse(widgetId) || ''
  } catch {
    return ''
  }
}
