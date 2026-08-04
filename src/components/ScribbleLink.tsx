import {
  useEffect,
  useLayoutEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react'

const FALLBACK_VIEWBOX = '0 0 200 56'
const FALLBACK_PATH =
  'M 100,8 A 92,20 0 1,0 100,48 A 92,20 0 1,0 100,8 A 92,20 0 0,0 54,10.7'
const RING_INSET_X = 26
const RING_INSET_Y = 14
/** Короткий нахлёст по тому же овалу (CCW влево от верха), не второй контур. */
const OVERLAP_DEG = 30
const DRAW_MS = 1365
const PAUSE_MS = 5000

/**
 * Один овал CCW + короткая дуга по тем же rx/ry поверх начала.
 */
function buildScribblePath(width: number, height: number) {
  const cx = width / 2
  const cy = height / 2
  const marginX = 8
  const marginY = 8
  const rx = Math.max(width / 2 - marginX, 1)
  const ry = Math.max(height / 2 - marginY, 1)
  const overlapRad = (OVERLAP_DEG * Math.PI) / 180
  const topY = cy - ry
  const endX = cx + rx * Math.cos(-Math.PI / 2 - overlapRad)
  const endY = cy + ry * Math.sin(-Math.PI / 2 - overlapRad)

  return [
    `M ${cx} ${topY}`,
    `A ${rx} ${ry} 0 1 0 ${cx} ${cy + ry}`,
    `A ${rx} ${ry} 0 1 0 ${cx} ${topY}`,
    `A ${rx} ${ry} 0 0 0 ${endX} ${endY}`,
  ].join(' ')
}

function applyDash(path: SVGPathElement, dash: number, offset: number, opacity: number) {
  const dashText = dash.toFixed(2)
  const offsetText = offset.toFixed(2)
  // И attribute, и style: CSS presentation property иначе перебивает attribute.
  path.setAttribute('stroke-dasharray', `${dashText} ${dashText}`)
  path.setAttribute('stroke-dashoffset', offsetText)
  path.style.strokeDasharray = `${dashText} ${dashText}`
  path.style.strokeDashoffset = offsetText
  path.style.opacity = String(opacity)
}

function measureScribbleDash(host: HTMLElement, path: SVGPathElement, svg: SVGSVGElement) {
  const hostRect = host.getBoundingClientRect()
  const width = Math.max(svg.clientWidth, hostRect.width + RING_INSET_X, 48)
  const height = Math.max(svg.clientHeight, hostRect.height + RING_INSET_Y, 28)

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  path.setAttribute('d', buildScribblePath(width, height))

  const length = path.getTotalLength()
  if (!Number.isFinite(length) || length <= 0) return false

  host.style.setProperty('--scribble-dash', length.toFixed(2))
  path.dataset.scribbleDash = length.toFixed(2)

  // Во время анимации/hold только обновляем геометрию и dasharray, offset не трогаем.
  if (path.dataset.scribbleBusy === '1' || host.classList.contains('scribble-held')) {
    const dashText = length.toFixed(2)
    path.setAttribute('stroke-dasharray', `${dashText} ${dashText}`)
    path.style.strokeDasharray = `${dashText} ${dashText}`
    return true
  }

  applyDash(path, length, length, 0)
  return true
}

function readDash(path: SVGPathElement) {
  const fromData = Number.parseFloat(path.dataset.scribbleDash ?? '')
  if (Number.isFinite(fromData) && fromData > 0) return fromData
  const length = path.getTotalLength()
  return Number.isFinite(length) && length > 0 ? length : 0
}

type StrokeController = {
  cancel: () => void
  run: (fromOffset: number, toOffset: number, duration: number) => Promise<void>
}

function createStrokeController(path: SVGPathElement): StrokeController {
  let raf = 0
  let token = 0
  let settle: (() => void) | null = null

  const cancel = () => {
    token += 1
    if (raf) {
      window.cancelAnimationFrame(raf)
      raf = 0
    }
    path.dataset.scribbleBusy = '0'
    // Без resolve цикл pulse зависает на await stroke.run после hover.
    const done = settle
    settle = null
    done?.()
  }

  const run = (fromOffset: number, toOffset: number, duration: number) =>
    new Promise<void>((resolve) => {
      cancel()
      const current = token
      const dash = readDash(path)
      if (!(dash > 0)) {
        resolve()
        return
      }

      settle = resolve
      path.dataset.scribbleBusy = '1'
      // Линия сразу видна — иначе fade opacity маскирует прорисовку.
      applyDash(path, dash, fromOffset, 0.94)

      const started = performance.now()
      const tick = (now: number) => {
        if (current !== token) {
          return
        }
        const t = Math.min(1, (now - started) / duration)
        // Линейно: прорисовка равномерно по всему времени.
        const offset = fromOffset + (toOffset - fromOffset) * t
        applyDash(path, dash, offset, 0.94)

        if (t < 1) {
          raf = window.requestAnimationFrame(tick)
          return
        }

        path.dataset.scribbleBusy = '0'
        raf = 0
        settle = null
        resolve()
      }

      raf = window.requestAnimationFrame(tick)
    })

  return {cancel, run}
}

function scribbleClassName(compact?: boolean, className?: string) {
  return `scribble-link${compact ? ' compact' : ''}${className ? ` ${className}` : ''}`
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useScribblePulse(
  hostRef: RefObject<HTMLElement | null>,
  pathRef: RefObject<SVGPathElement | null>,
) {
  useEffect(() => {
    const host = hostRef.current
    const path = pathRef.current
    if (!host || !path || prefersReducedMotion()) return

    const stroke = createStrokeController(path)
    let cancelled = false
    let timer = 0
    let held = false
    let wakeSleep: (() => void) | null = null

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = window.setTimeout(() => {
          wakeSleep = null
          resolve()
        }, ms)
        wakeSleep = () => {
          window.clearTimeout(timer)
          timer = 0
          wakeSleep = null
          resolve()
        }
      })

    const clearTimer = () => {
      window.clearTimeout(timer)
      timer = 0
    }

    const wake = () => {
      wakeSleep?.()
    }

    const isHeld = () =>
      held || host.matches(':hover') || host.matches(':focus-visible')

    const holdNow = () => {
      const dash = readDash(path)
      stroke.cancel()
      host.classList.add('scribble-held')
      if (dash > 0) applyDash(path, dash, 0, 0.94)
    }

    const releaseHold = () => {
      held = false
      host.classList.remove('scribble-held')
      stroke.cancel()
      const dash = readDash(path)
      if (dash > 0) applyDash(path, dash, dash, 0)
      wake()
    }

    const onHoldStart = () => {
      held = true
      holdNow()
      wake()
    }

    const onHoldEnd = () => {
      releaseHold()
    }

    host.addEventListener('mouseenter', onHoldStart)
    host.addEventListener('mouseleave', onHoldEnd)
    host.addEventListener('focusin', onHoldStart)
    host.addEventListener('focusout', onHoldEnd)

    const waitForDash = async () => {
      for (let i = 0; i < 40 && !cancelled; i += 1) {
        const dash = readDash(path)
        if (dash > 40) return dash
        await sleep(50)
      }
      return readDash(path)
    }

    const run = async () => {
      await waitForDash()
      await sleep(400)
      while (!cancelled) {
        const dash = readDash(path)
        if (!(dash > 0)) {
          await sleep(250)
          continue
        }

        if (isHeld()) {
          holdNow()
          await sleep(250)
          continue
        }

        await stroke.run(dash, 0, DRAW_MS)
        if (cancelled) break
        if (isHeld()) {
          holdNow()
          continue
        }

        await stroke.run(0, dash, DRAW_MS)
        if (cancelled) break
        if (isHeld()) {
          holdNow()
          continue
        }

        applyDash(path, dash, dash, 0)
        await sleep(PAUSE_MS)
      }
    }

    void run()

    return () => {
      cancelled = true
      wake()
      clearTimer()
      wakeSleep = null
      stroke.cancel()
      host.removeEventListener('mouseenter', onHoldStart)
      host.removeEventListener('mouseleave', onHoldEnd)
      host.removeEventListener('focusin', onHoldStart)
      host.removeEventListener('focusout', onHoldEnd)
      host.classList.remove('scribble-held')
    }
  }, [hostRef, pathRef])
}

export function ScribbleRing({hostRef}: {hostRef: RefObject<HTMLElement | null>}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useLayoutEffect(() => {
    const path = pathRef.current
    const svg = svgRef.current
    const host = hostRef.current
    if (!path || !svg || !host) return

    const update = () => {
      if (measureScribbleDash(host, path, svg)) return
      window.requestAnimationFrame(() => {
        measureScribbleDash(host, path, svg)
      })
    }

    update()

    const ro = new ResizeObserver(update)
    ro.observe(host)

    if (document.fonts?.ready) {
      void document.fonts.ready.then(update)
    }

    return () => ro.disconnect()
  }, [hostRef])

  useScribblePulse(hostRef, pathRef)

  return (
    <svg
      ref={svgRef}
      className="scribble-ring"
      aria-hidden="true"
      viewBox={FALLBACK_VIEWBOX}
      preserveAspectRatio="none"
    >
      <path ref={pathRef} className="scribble-ring-stroke" d={FALLBACK_PATH} fill="none" />
    </svg>
  )
}

type ScribbleLinkCommonProps = {
  compact?: boolean
  children: ReactNode
  className?: string
}

type ScribbleAnchorProps = ScribbleLinkCommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    as?: 'a'
  }

type ScribbleButtonProps = ScribbleLinkCommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    as: 'button'
  }

type ScribbleLinkProps = ScribbleAnchorProps | ScribbleButtonProps

export default function ScribbleLink(props: ScribbleLinkProps) {
  const {compact, children, className = ''} = props
  const hostRef = useRef<HTMLElement | null>(null)
  const cn = scribbleClassName(compact, className)
  const content = (
    <>
      <ScribbleRing hostRef={hostRef} />
      {children}
    </>
  )

  if (props.as === 'button') {
    const {as: _as, compact: _compact, className: _className, children: _children, type, ...buttonProps} = props
    return (
      <button
        ref={hostRef as RefObject<HTMLButtonElement>}
        type={type ?? 'button'}
        className={cn}
        {...buttonProps}
      >
        {content}
      </button>
    )
  }

  const {as: _as, compact: _compact, className: _className, children: _children, ...anchorProps} = props
  return (
    <a ref={hostRef as RefObject<HTMLAnchorElement>} className={cn} {...anchorProps}>
      {content}
    </a>
  )
}
