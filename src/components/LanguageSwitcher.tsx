import {useEffect, useRef, useState} from 'react'
import {ChevronDown} from 'lucide-react'
import {LOCALES, LOCALE_META, type Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import LocaleFlag from './LocaleFlag'

interface LanguageSwitcherProps {
  currentLang: Locale
  setCurrentLang: (lang: Locale) => void
}

/**
 * Перемикач мови в хедері: кнопка з прапором/кодом і випадаючий список локалей.
 */
export default function LanguageSwitcher({currentLang, setCurrentLang}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const t = TRANSLATIONS[currentLang]
  const current = LOCALE_META[currentLang]

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={`lang-switcher${open ? ' open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="lang"
        aria-label={t.lang_switch}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <LocaleFlag locale={currentLang} className="lang-flag" />
        <span className="lang-label">{current.label}</span>
        <ChevronDown className="lang-chevron" size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
      {open && (
        <ul className="lang-menu" role="listbox" aria-label={t.lang_switch}>
          {LOCALES.map((locale) => {
            const meta = LOCALE_META[locale]
            const active = locale === currentLang
            return (
              <li key={locale} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={active ? 'active' : undefined}
                  onClick={() => {
                    setCurrentLang(locale)
                    setOpen(false)
                  }}
                >
                  <LocaleFlag locale={locale} className="lang-flag" />
                  <span className="lang-code">{meta.label}</span>
                  <span className="lang-name">{meta.nativeName}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
