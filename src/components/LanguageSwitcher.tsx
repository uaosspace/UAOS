import {useEffect, useRef, useState} from 'react'
import {LOCALES, LOCALE_META, type Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'

interface LanguageSwitcherProps {
  currentLang: Locale
  setCurrentLang: (lang: Locale) => void
}

export default function LanguageSwitcher({currentLang, setCurrentLang}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const t = TRANSLATIONS[currentLang]

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
        {LOCALE_META[currentLang].label}⌄
      </button>
      {open && (
        <ul className="lang-menu" role="listbox" aria-label={t.lang_switch}>
          {LOCALES.map((locale) => (
            <li key={locale} role="option" aria-selected={locale === currentLang}>
              <button
                type="button"
                className={locale === currentLang ? 'active' : undefined}
                onClick={() => {
                  setCurrentLang(locale)
                  setOpen(false)
                }}
              >
                <span className="lang-code">{LOCALE_META[locale].label}</span>
                <span className="lang-name">{LOCALE_META[locale].nativeName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
