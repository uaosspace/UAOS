import type {AnchorHTMLAttributes, ReactNode} from 'react'

interface OutlineLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
}

export default function OutlineLink({children, className = '', ...props}: OutlineLinkProps) {
  return (
    <a className={`outline-link${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </a>
  )
}
