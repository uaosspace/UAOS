import type {AnchorHTMLAttributes, ReactNode} from 'react'

interface ScribbleLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  compact?: boolean
  children: ReactNode
}

export default function ScribbleLink({compact, children, className = '', ...props}: ScribbleLinkProps) {
  return (
    <a className={`scribble-link${compact ? ' compact' : ''}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </a>
  )
}
