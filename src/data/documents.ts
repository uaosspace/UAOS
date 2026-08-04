import {DocumentItem} from '../types'
import {ContentApiError, fetchContentItems} from '../lib/contentApi'
import {
  isRecord,
  readArray,
  readDocumentAccessLevel,
  readDocumentLanguage,
  readDocumentType,
  readHttpUrl,
  readLocalizedText,
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
    accessLevel: 'public',
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
    accessLevel: 'public',
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
    accessLevel: 'public',
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
    accessLevel: 'public',
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
    accessLevel: 'public',
  },
  {
    id: 'material-ppe-selection-guide',
    title: {
      uk: 'Гід із вибору засобів індивідуального захисту',
      en: 'Guide to Selecting Personal Protective Equipment',
    },
    description: {
      uk: 'Практичний матеріал про підбір ЗІЗ під ризики підприємства, підготовлений експертами асоціації.',
      en: 'A practical publication on selecting PPE based on enterprise risks, prepared by association experts.',
    },
    type: 'link',
    language: 'UA/EN',
    dateUpdated: '2026-06-15',
    fileUrl: '#',
    accessLevel: 'public',
  },
  {
    id: 'material-eu-safety-standards-overview',
    title: {
      uk: 'Огляд європейських підходів до безпеки праці',
      en: 'Overview of European Occupational Safety Approaches',
    },
    description: {
      uk: 'Аналітичний матеріал про сучасні європейські практики та їх застосовність в Україні.',
      en: 'An analytical publication on modern European practices and their applicability in Ukraine.',
    },
    type: 'link',
    language: 'UA/EN',
    dateUpdated: '2026-07-01',
    fileUrl: '#',
    accessLevel: 'public',
  },
]

/** У публічному UI "матеріали" — це type === 'link' (зовнішні публікації), решта — офіційні документи. */
export function isMaterialDocument(doc: DocumentItem): boolean {
  return doc.type === 'link'
}

/**
 * Преобразует документ базы знаний (public API) в UI-модель.
 */
export function mapDoc(doc: unknown): DocumentItem {
  const source = isRecord(doc) ? doc : {}

  return {
    id: readStringOr(source.id, readStringOr(source._id, 'document-unknown')),
    title: readLocalizedText(source.title),
    description: readLocalizedText(source.description),
    type: readDocumentType(source.type),
    size: readString(source.size),
    language: readDocumentLanguage(source.language),
    dateUpdated: readStringOr(source.dateUpdated, new Date().toISOString().slice(0, 10)),
    fileUrl: readHttpUrl(source.fileUrl) || readHttpUrl(source.externalUrl) || '#',
    accessLevel: readDocumentAccessLevel(source.accessLevel),
  }
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  try {
    const docs = await fetchContentItems<unknown>('documents')
    return readArray(docs).map(mapDoc)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Content API fetchDocuments unavailable in DEV, using seed:', err)
      return INITIAL_DOCUMENTS
    }
    if (err instanceof ContentApiError) throw err
    throw new ContentApiError('Failed to load documents', 500)
  }
}

export function getDocuments(): DocumentItem[] {
  return INITIAL_DOCUMENTS
}

export function saveDocuments(_docs: DocumentItem[]): void {
  // Content managed via /admin + Neon
}
