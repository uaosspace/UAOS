import type {ReactNode} from 'react'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Лёгкий fade/slide при смене публичной страницы без motion-библиотек.
 * Remount запускается ключом снаружи (`key` в App); prefers-reduced-motion — в CSS.
 */
export default function PageTransition({children}: PageTransitionProps) {
  return <div className="page-enter">{children}</div>
}
