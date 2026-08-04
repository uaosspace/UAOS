import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import DocumentsSection from '../components/DocumentsSection'
import {isMaterialDocument} from '../data/documents'
import type {DocumentItem} from '../types'

interface KnowledgePageProps {
  currentLang: Locale
  documents: DocumentItem[]
}

export default function KnowledgePage({currentLang, documents}: KnowledgePageProps) {
  const t = TRANSLATIONS[currentLang]
  useDocumentMeta({
    title: `${t.nav_knowledge} — ${t.brand_name}`,
    description: t.docs_subtitle,
  })

  const publicDocuments = documents.filter((doc) => doc.accessLevel === 'public')
  const materials = publicDocuments.filter(isMaterialDocument)
  const officialDocuments = publicDocuments.filter((doc) => !isMaterialDocument(doc))

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
          {t.nav_knowledge}
        </h1>
        <p className="text-sm sm:text-base text-brand-slate-600 dark:text-brand-slate-200 leading-relaxed max-w-2xl mx-auto">
          {t.knowledge_intro}
        </p>
      </div>

      <DocumentsSection
        currentLang={currentLang}
        documents={materials}
        sectionId="materials"
        titleOverride={t.knowledge_materials_kicker}
        subtitleOverride={t.knowledge_materials_title}
      />

      <DocumentsSection
        currentLang={currentLang}
        documents={officialDocuments}
        sectionId="documents"
        titleOverride={t.nav_documents}
        subtitleOverride={t.docs_subtitle}
      />
    </article>
  )
}
