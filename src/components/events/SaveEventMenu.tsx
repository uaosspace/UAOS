import type {Locale} from '../../data/locales'
import {useEffect, useRef, useState} from 'react'
import type {AssociationEvent} from '../../types'
import {TRANSLATIONS} from '../../data/translations'
import {
  copyEventLink,
  downloadIcs,
  getEmailShareUrl,
  getFacebookShareUrl,
  getGoogleCalendarUrl,
  getLinkedInShareUrl,
  getOutlookCalendarUrl,
  getTelegramShareUrl,
  getTwitterShareUrl,
  getViberShareUrl,
  getWhatsAppShareUrl,
  shareEvent,
} from '../../utils/calendarExport'
import {
  Calendar,
  ChevronDown,
  Download,
  Facebook,
  Link as LinkIcon,
  Linkedin,
  Mail,
  MessageCircle,
  Send,
  Share2,
  Twitter,
} from 'lucide-react'

interface SaveEventMenuProps {
  event: AssociationEvent
  currentLang: Locale
}

const menuItemClass =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand-slate-700 transition-colors hover:bg-brand-slate-50 dark:text-brand-slate-200 dark:hover:bg-brand-slate-700/50'

export default function SaveEventMenu({event, currentLang}: SaveEventMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const t = TRANSLATIONS[currentLang]
  const googleUrl = getGoogleCalendarUrl(event, currentLang)
  const canUseWebShare =
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    typeof window.navigator.share === 'function'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleCopyLink = async () => {
    await copyEventLink(event)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setIsOpen(false)
    }, 2000)
  }

  const handleShare = async () => {
    if (!canUseWebShare) return
    await shareEvent(event, currentLang)
    setIsOpen(false)
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row" ref={menuRef}>
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#4285F4] px-6 py-3 font-medium text-white transition-colors hover:bg-[#3367D6] sm:w-auto"
      >
        <Calendar className="h-5 w-5" aria-hidden />
        {t.events_google}
      </a>

      <div className="relative w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-blue-700 sm:w-auto"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {t.events_save}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>

        {isOpen ? (
          <div className="absolute bottom-full left-0 right-0 z-50 mb-2 flex max-h-[min(22rem,50vh)] w-full min-w-[18rem] origin-bottom flex-col overflow-hidden rounded-xl border border-brand-slate-100 bg-white shadow-2xl dark:border-brand-slate-700 dark:bg-brand-slate-800 sm:left-0 sm:right-auto sm:w-72">
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-slate-400">
                {t.events_save}
              </div>
              <a
                href={getOutlookCalendarUrl(event, currentLang)}
                target="_blank"
                rel="noopener noreferrer"
                className={menuItemClass}
                onClick={() => setIsOpen(false)}
              >
                <Mail className="h-4 w-4 text-[#0078D4]" />
                {t.events_outlook}
              </a>
              <button
                type="button"
                className={menuItemClass}
                onClick={() => {
                  downloadIcs(event, currentLang)
                  setIsOpen(false)
                }}
              >
                <Download className="h-4 w-4 text-brand-slate-500" />
                {t.events_download_ics}
              </button>

              <div className="my-1 h-px bg-brand-slate-100 dark:bg-brand-slate-700" />

              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-slate-400">
                {t.events_share_section}
              </div>
              <a
                href={getTelegramShareUrl(event, currentLang)}
                target="_blank"
                rel="noopener noreferrer"
                className={menuItemClass}
                onClick={() => setIsOpen(false)}
              >
                <Send className="h-4 w-4 text-[#0088cc]" />
                Telegram
              </a>
              <a
                href={getViberShareUrl(event, currentLang)}
                target="_blank"
                rel="noopener noreferrer"
                className={menuItemClass}
                onClick={() => setIsOpen(false)}
              >
                <MessageCircle className="h-4 w-4 text-[#7360f2]" />
                Viber
              </a>
              <a
                href={getFacebookShareUrl(event, currentLang)}
                target="_blank"
                rel="noopener noreferrer"
                className={menuItemClass}
                onClick={() => setIsOpen(false)}
              >
                <Facebook className="h-4 w-4 text-[#1877F2]" />
                Facebook
              </a>
              <a
                href={getLinkedInShareUrl(event, currentLang)}
                target="_blank"
                rel="noopener noreferrer"
                className={menuItemClass}
                onClick={() => setIsOpen(false)}
              >
                <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                LinkedIn
              </a>
              <a
                href={getWhatsAppShareUrl(event, currentLang)}
                target="_blank"
                rel="noopener noreferrer"
                className={menuItemClass}
                onClick={() => setIsOpen(false)}
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                WhatsApp
              </a>
              <a
                href={getTwitterShareUrl(event, currentLang)}
                target="_blank"
                rel="noopener noreferrer"
                className={menuItemClass}
                onClick={() => setIsOpen(false)}
              >
                <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                Twitter (X)
              </a>
              <a
                href={getEmailShareUrl(event, currentLang)}
                className={menuItemClass}
                onClick={() => setIsOpen(false)}
              >
                <Mail className="h-4 w-4 text-brand-slate-500" />
                Email
              </a>
              <button type="button" onClick={() => void handleCopyLink()} className={menuItemClass}>
                <LinkIcon className={`h-4 w-4 ${copied ? 'text-emerald-500' : 'text-brand-slate-500'}`} />
                {copied ? t.events_link_copied : t.events_copy_link}
              </button>
              {canUseWebShare ? (
                <button type="button" onClick={() => void handleShare()} className={menuItemClass}>
                  <Share2 className="h-4 w-4 text-brand-slate-500" />
                  {t.events_more_options}
                </button>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-brand-slate-100 bg-brand-slate-50 p-3 text-center text-xs text-brand-slate-500 dark:border-brand-slate-700 dark:bg-brand-slate-900/50 dark:text-brand-slate-300">
              {t.events_save_hint}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
