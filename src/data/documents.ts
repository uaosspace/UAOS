import {DocumentItem} from '../types'
import {getSanityClient, mapLocale, sanityConfigured} from '../lib/sanity'
import {
  isRecord,
  readArray,
  readDocumentLanguage,
  readDocumentType,
  readHttpUrl,
  readString,
  readStringOr,
} from '../lib/contentGuards'

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'statut',
    title: {
      uk: 'Статут Громадської спілки «УАПБ»',
      en: 'Statute of the UAOS Public Union',
    },
    description: {
      uk: 'Основний установчий документ, що регулює діяльність спілки, права та обов’язки її членів.',
      en: 'The main founding document governing the activities of the Union, rights, and duties of its members.',
    },
    type: 'pdf',
    size: '1.2 MB',
    language: 'UA',
    dateUpdated: '2026-03-10',
    fileUrl: '#',
  },
  {
    id: 'rules',
    title: {
      uk: 'Правила вступу до асоціації',
      en: 'Membership Admission Rules',
    },
    description: {
      uk: 'Регламент та вимоги до кандидатів, перелік документів та процедура розгляду заявок.',
      en: 'Regulations and requirements for candidates, document checklist, and application review process.',
    },
    type: 'pdf',
    size: '640 KB',
    language: 'UA/EN',
    dateUpdated: '2026-04-15',
    fileUrl: '#',
  },
  {
    id: 'code-of-conduct',
    title: {
      uk: 'Кодекс поведінки учасників UAOS',
      en: 'UAOS Members Code of Conduct',
    },
    description: {
      uk: 'Звід етичних принципів, стандартів доброчесності, відповідальності та якості для всіх партнерів.',
      en: 'A compilation of ethical principles, standards of integrity, responsibility, and quality for all partners.',
    },
    type: 'pdf',
    size: '820 KB',
    language: 'UA/EN',
    dateUpdated: '2026-05-20',
    fileUrl: '#',
  },
  {
    id: 'presentation',
    title: {
      uk: 'Офіційна презентація асоціації UAOS',
      en: 'Official UAOS Association Presentation',
    },
    description: {
      uk: 'Коротка презентація про місію, цілі, засновників та практичну користь для учасників ринку.',
      en: 'A brief presentation about the mission, goals, founders, and practical values for market participants.',
    },
    type: 'pdf',
    size: '4.5 MB',
    language: 'UA/EN',
    dateUpdated: '2026-06-01',
    fileUrl: '#',
  },
  {
    id: 'board-regulations',
    title: {
      uk: 'Положення про органи управління',
      en: 'Regulations on Governing Bodies',
    },
    description: {
      uk: 'Документ, що визначає повноваження та порядок роботи Наглядової ради, Загальних зборів та Правління.',
      en: 'Document defining the authority and procedures of the Supervisory Board, General Assembly, and Board of Directors.',
    },
    type: 'pdf',
    size: '950 KB',
    language: 'UA',
    dateUpdated: '2026-03-12',
    fileUrl: '#',
  },
]

const DOCS_QUERY = `*[_type == "associationDocument"] | order(dateUpdated desc) {
  _id,
  title,
  description,
  type,
  size,
  language,
  dateUpdated,
  externalUrl,
  "fileUrl": file.asset->url
}`

/**
 * Преобразует Sanity-документ в безопасную карточку публичного раздела документов.
 */
export function mapDoc(doc: unknown): DocumentItem {
  const source = isRecord(doc) ? doc : {}

  return {
    id: readStringOr(source._id, 'document-unknown'),
    title: mapLocale(source.title as {uk?: string; en?: string} | null | undefined),
    description: mapLocale(source.description as {uk?: string; en?: string} | null | undefined),
    type: readDocumentType(source.type),
    size: readString(source.size),
    language: readDocumentLanguage(source.language),
    dateUpdated: readStringOr(source.dateUpdated, new Date().toISOString().slice(0, 10)),
    fileUrl: readHttpUrl(source.fileUrl) || readHttpUrl(source.externalUrl) || '#',
  }
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const client = getSanityClient()
  if (!client || !sanityConfigured) {
    return INITIAL_DOCUMENTS
  }
  try {
    const docs = await client.fetch(DOCS_QUERY)
    const documentDocs = readArray(docs)
    if (documentDocs.length === 0) {
      return INITIAL_DOCUMENTS
    }
    return documentDocs.map(mapDoc)
  } catch (err) {
    console.error('Sanity fetchDocuments failed, using seed:', err)
    return INITIAL_DOCUMENTS
  }
}

export function getDocuments(): DocumentItem[] {
  return INITIAL_DOCUMENTS
}

export function saveDocuments(_docs: DocumentItem[]): void {
  // Content managed in Sanity Studio
}
