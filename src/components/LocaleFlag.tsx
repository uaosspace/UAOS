import type {Locale} from '../data/locales'

interface LocaleFlagProps {
  locale: Locale
  className?: string
}

const FLAG_VIEW = '0 0 20 14'

/** Компактні SVG-прапори для перемикача мови (emoji на Windows часто рендеряться як літери). */
export default function LocaleFlag({locale, className}: LocaleFlagProps) {
  return (
    <svg
      className={className}
      viewBox={FLAG_VIEW}
      width={18}
      height={13}
      aria-hidden="true"
      focusable="false"
    >
      {flagContent(locale)}
    </svg>
  )
}

function flagContent(locale: Locale) {
  switch (locale) {
    case 'uk':
      return (
        <>
          <rect width="20" height="7" fill="#0057b7" />
          <rect y="7" width="20" height="7" fill="#ffd700" />
        </>
      )
    case 'en':
      return (
        <>
          <rect width="20" height="14" fill="#012169" />
          <path d="M0 0 L20 14 M20 0 L0 14" stroke="#fff" strokeWidth="2.4" />
          <path d="M0 0 L20 14 M20 0 L0 14" stroke="#c8102e" strokeWidth="1.2" />
          <path d="M10 0 V14 M0 7 H20" stroke="#fff" strokeWidth="4" />
          <path d="M10 0 V14 M0 7 H20" stroke="#c8102e" strokeWidth="2.2" />
        </>
      )
    case 'de':
      return (
        <>
          <rect width="20" height="4.67" fill="#000" />
          <rect y="4.67" width="20" height="4.66" fill="#dd0000" />
          <rect y="9.33" width="20" height="4.67" fill="#ffce00" />
        </>
      )
    case 'es':
      return (
        <>
          <rect width="20" height="14" fill="#aa151b" />
          <rect y="3.5" width="20" height="7" fill="#f1bf00" />
        </>
      )
    case 'kk':
      return (
        <>
          <rect width="20" height="14" fill="#00afca" />
          <circle cx="10" cy="7" r="2.4" fill="#fec50c" />
          <path
            d="M10 2.2 L10.5 4.2 H12.6 L10.9 5.4 L11.5 7.4 L10 6.2 L8.5 7.4 L9.1 5.4 L7.4 4.2 H9.5 Z"
            fill="#fec50c"
          />
        </>
      )
    case 'fr':
      return (
        <>
          <rect width="6.67" height="14" fill="#002395" />
          <rect x="6.67" width="6.66" height="14" fill="#fff" />
          <rect x="13.33" width="6.67" height="14" fill="#ed2939" />
        </>
      )
  }
}
