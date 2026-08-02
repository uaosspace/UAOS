import type {Locale} from '../../data/locales'
import React, { useState, useRef, useEffect } from 'react';
import { AssociationEvent } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { 
  getGoogleCalendarUrl, 
  getOutlookCalendarUrl, 
  shareEvent, 
  copyEventLink, 
  getTelegramShareUrl, 
  getFacebookShareUrl, 
  getLinkedInShareUrl, 
  getViberShareUrl,
  getTwitterShareUrl,
  getWhatsAppShareUrl,
  getEmailShareUrl
} from '../../utils/calendarExport';
import { Calendar, Link as LinkIcon, Share2, Mail, Send, Linkedin, MessageCircle, Facebook, Twitter } from 'lucide-react';

interface SaveEventMenuProps {
  event: AssociationEvent;
  currentLang: Locale;
}

export default function SaveEventMenu({ event, currentLang }: SaveEventMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[currentLang];
  const canUseWebShare =
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    typeof window.navigator.share === 'function';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopyLink = async () => {
    await copyEventLink(event);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setIsOpen(false);
    }, 2000);
  };

  const handleShare = async () => {
    if (!canUseWebShare) {
      return;
    }

    await shareEvent(event, currentLang);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Calendar className="w-5 h-5" />
        {t.events_save}
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full mb-2 w-72 max-w-[calc(100vw-2rem)] right-0 sm:left-0 sm:right-auto bg-white dark:bg-brand-slate-800 rounded-xl shadow-2xl border border-brand-slate-100 dark:border-brand-slate-700 overflow-hidden transform origin-bottom-right sm:origin-bottom-left animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-2 space-y-1">
            <a 
              href={getGoogleCalendarUrl(event, currentLang)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-700/50 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Calendar className="w-4 h-4 text-[#4285F4]" />
              {t.events_google}
            </a>
            
            <a 
              href={getOutlookCalendarUrl(event, currentLang)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-700/50 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Mail className="w-4 h-4 text-[#0078D4]" />
              {t.events_outlook}
            </a>

            <div className="h-px bg-brand-slate-100 dark:bg-brand-slate-700 my-1 mx-2" />

            <div className="px-3 py-1.5 text-xs font-bold text-brand-slate-400 uppercase tracking-wider">
              {t.events_share_section}
            </div>

            <a 
              href={getTelegramShareUrl(event, currentLang)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-700/50 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Send className="w-4 h-4 text-[#0088cc]" />
              Telegram
            </a>

            <a 
              href={getViberShareUrl(event, currentLang)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-700/50 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <MessageCircle className="w-4 h-4 text-[#7360f2]" />
              Viber
            </a>

            <a 
              href={getFacebookShareUrl(event, currentLang)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-700/50 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Facebook className="w-4 h-4 text-[#1877F2]" />
              Facebook
            </a>

            <a 
              href={getLinkedInShareUrl(event, currentLang)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-700/50 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Linkedin className="w-4 h-4 text-[#0A66C2]" />
              LinkedIn
            </a>

            <a 
              href={getWhatsAppShareUrl(event, currentLang)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-700/50 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              WhatsApp
            </a>

            <a 
              href={getTwitterShareUrl(event, currentLang)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-700/50 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Twitter className="w-4 h-4 text-[#1DA1F2]" />
              Twitter (X)
            </a>

            <a 
              href={getEmailShareUrl(event, currentLang)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-700/50 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Mail className="w-4 h-4 text-brand-slate-500" />
              Email
            </a>

            <button 
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-700/50 rounded-lg transition-colors text-left"
            >
              <LinkIcon className={`w-4 h-4 ${copied ? 'text-emerald-500' : 'text-brand-slate-500'}`} />
              {copied ? t.events_link_copied : t.events_copy_link}
            </button>

            {canUseWebShare && (
              <button 
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-slate-700 dark:text-brand-slate-200 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-700/50 rounded-lg transition-colors text-left"
              >
                <Share2 className="w-4 h-4 text-brand-slate-500" />
                {t.events_more_options}
              </button>
            )}
          </div>
          <div className="bg-brand-slate-50 dark:bg-brand-slate-900/50 p-3 text-xs text-brand-slate-500 dark:text-brand-slate-400 text-center border-t border-brand-slate-100 dark:border-brand-slate-700">
            {t.events_save_hint}
          </div>
        </div>
      )}
    </div>
  );
}
