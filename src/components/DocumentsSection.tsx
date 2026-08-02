import type {Locale} from '../data/locales'
import React, { useState } from 'react';
import { Search, FileText, Download, Globe, Calendar, FileType, Check } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';
import { DocumentItem } from '../types';

interface DocumentsSectionProps {
  currentLang: Locale;
  documents: DocumentItem[];
}

export default function DocumentsSection({ currentLang, documents }: DocumentsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openingId, setOpeningId] = useState<string | null>(null);

  const t = TRANSLATIONS[currentLang];

  const filteredDocs = documents.filter((doc) => {
    const titleMatch = doc.title[currentLang]?.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = doc.description[currentLang]?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || descMatch;
  });

  // Проверяет, есть ли у документа реальная публичная ссылка вместо заглушки.
  const hasDocumentUrl = (doc: DocumentItem) => Boolean(doc.fileUrl && doc.fileUrl !== '#');

  // Открывает документ по публичной ссылке и показывает краткий loading-state у CTA.
  const handleOpenDocument = (doc: DocumentItem) => {
    if (!hasDocumentUrl(doc)) return;

    setOpeningId(doc.id);
    window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => {
      setOpeningId(null);
    }, 800);
  };

  return (
    <section id="documents" className="scroll-mt-24 py-6 lg:py-8 bg-transparent border-y border-brand-slate-200/20 dark:border-brand-slate-850/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <h2 className="text-xs font-mono font-bold tracking-widest text-brand-blue-500 dark:text-brand-sky-300 uppercase">
            {t.nav_documents}
          </h2>
          <p className="text-3xl sm:text-4xl font-display font-bold text-brand-slate-900 dark:text-white tracking-tight">
            {t.docs_subtitle}
          </p>
          <div className="h-1 w-12 bg-brand-blue-500 mx-auto rounded-full"></div>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12 relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-brand-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.docs_search_placeholder}
              className="w-full pl-10 pr-4 py-3 rounded-xl glass-pill focus:border-brand-blue-500 dark:focus:border-brand-sky-400 focus:bg-white dark:focus:bg-brand-slate-900 text-sm text-brand-slate-800 dark:text-brand-slate-200 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-brand-slate-400 hover:text-brand-slate-600 dark:hover:text-brand-slate-200 uppercase font-bold"
              >
                {t.docs_clear_search}
              </button>
            )}
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl glass-card glass-card-hover p-6 flex flex-col justify-between shadow-sm group"
              >
                <div className="space-y-4">
                  
                  {/* File Type Icon & Language badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-100/50 dark:border-red-900/10">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-brand-slate-100 dark:bg-brand-slate-800 text-brand-slate-500 dark:text-brand-slate-400 px-2 py-0.5 rounded uppercase">
                        {doc.type}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-brand-slate-400 dark:text-brand-slate-500 font-mono text-[10px] font-semibold">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{doc.language}</span>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div className="space-y-1.5 text-left">
                    <h3 className="text-base font-display font-bold text-brand-slate-900 dark:text-white leading-snug group-hover:text-brand-blue-500 dark:group-hover:text-brand-sky-300 transition-colors">
                      {doc.title[currentLang]}
                    </h3>
                    <p className="text-xs text-brand-slate-600 dark:text-brand-slate-400 leading-relaxed">
                      {doc.description[currentLang]}
                    </p>
                  </div>

                </div>

                {/* Footer with size, update info & CTA */}
                <div className="pt-6 mt-6 border-t border-brand-slate-100 dark:border-brand-slate-800 flex items-center justify-between">
                  <div className="space-y-1 text-left">
                    {doc.size && (
                      <span className="block text-[10px] font-mono text-brand-slate-400 uppercase font-semibold">
                        {t.docs_size}: {doc.size}
                      </span>
                    )}
                    <span className="flex items-center text-[10px] font-mono text-brand-slate-400">
                      <Calendar className="w-3 h-3 mr-1 text-brand-slate-400 shrink-0" />
                      {doc.dateUpdated}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenDocument(doc)}
                    disabled={openingId === doc.id || !hasDocumentUrl(doc)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-250 ${
                      openingId === doc.id
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400'
                        : hasDocumentUrl(doc)
                          ? 'border-brand-slate-200 dark:border-brand-slate-800 text-brand-slate-700 dark:text-brand-slate-300 hover:border-brand-blue-500 dark:hover:border-brand-sky-400 hover:text-brand-blue-500 dark:hover:text-brand-sky-400 hover:bg-brand-blue-50/20 dark:hover:bg-brand-blue-950/10 cursor-pointer'
                          : 'border-brand-slate-200 dark:border-brand-slate-800 text-brand-slate-400 dark:text-brand-slate-500 cursor-not-allowed opacity-70'
                    }`}
                  >
                    {openingId === doc.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 animate-bounce" />
                        <span>{t.docs_opening}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>{hasDocumentUrl(doc) ? t.docs_btn_open : t.docs_btn_unavailable}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-brand-slate-200 dark:border-brand-slate-800 rounded-2xl max-w-md mx-auto">
            <p className="text-sm font-semibold text-brand-slate-500 dark:text-brand-slate-400 uppercase font-mono">
              {t.docs_empty}
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
