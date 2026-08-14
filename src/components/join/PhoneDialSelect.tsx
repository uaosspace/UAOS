import {useEffect, useRef, useState} from 'react'
import {ChevronDown} from 'lucide-react'
import {PHONE_COUNTRY_CODES, type PhoneCountryCode} from '../../data/phoneCountryCodes'
import LocaleFlag from '../LocaleFlag'

interface PhoneDialSelectProps {
  value: string
  onChange: (dial: string) => void
  label: string
  id?: string
}

function findByDial(dial: string): PhoneCountryCode {
  return PHONE_COUNTRY_CODES.find((item) => item.dial === dial) ?? PHONE_COUNTRY_CODES[0]
}

/** Custom dial picker: flag + ISO + dial (native select cannot render SVG flags). */
export default function PhoneDialSelect({value, onChange, label, id = 'join-phone-code'}: PhoneDialSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = findByDial(value)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
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
    <div ref={rootRef} className="relative shrink-0">
      <button
        id={id}
        type="button"
        className="inline-flex h-full min-h-[2.625rem] min-w-[8.25rem] items-center gap-1.5 px-2.5 py-2.5 rounded-xl glass-pill !text-sm !leading-5 font-normal text-brand-slate-800 dark:text-brand-slate-200 outline-none focus:border-brand-blue-500 dark:focus:border-brand-sky-400"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <LocaleFlag locale={selected.locale} className="shrink-0 rounded-[2px]" />
        <span className="tabular-nums">{selected.iso}</span>
        <span className="tabular-nums">{selected.dial}</span>
        <ChevronDown className="ml-auto shrink-0 opacity-70" size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
      {open ? (
        <ul
          className="absolute left-0 top-[calc(100%+0.35rem)] z-30 min-w-full overflow-hidden rounded-xl border border-brand-slate-200 dark:border-brand-slate-700 bg-white dark:bg-brand-slate-900 shadow-lg"
          role="listbox"
          aria-label={label}
        >
          {PHONE_COUNTRY_CODES.map((item) => {
            const active = item.dial === selected.dial
            return (
              <li key={item.dial} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-1.5 px-2.5 py-2 !text-sm !leading-5 font-normal text-left transition-colors ${
                    active
                      ? 'bg-brand-blue-50 dark:bg-brand-slate-800 text-brand-slate-900 dark:text-white'
                      : 'text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-800/80'
                  }`}
                  onClick={() => {
                    onChange(item.dial)
                    setOpen(false)
                  }}
                >
                  <LocaleFlag locale={item.locale} className="shrink-0 rounded-[2px]" />
                  <span className="tabular-nums">{item.iso}</span>
                  <span className="tabular-nums">{item.dial}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
