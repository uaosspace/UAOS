import type {PointerEvent} from 'react'

/**
 * Оновлює CSS-змінні --mx/--my для spotlight-карток з макету.
 */
export function useSpotlightHandler() {
  return (event: PointerEvent<HTMLElement>) => {
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
    card.style.setProperty('--my', `${event.clientY - rect.top}px`)
  }
}
