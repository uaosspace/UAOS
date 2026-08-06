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
      de: 'Satzung des gemeinnützigen Verbands UAOS',
      es: 'Estatuto de la Unión Pública UAOS',
      kk: 'UAOS қоғамдық одағының жарғысы',
      fr: 'Statuts de l’union publique UAOS',
    },
    description: {
      uk: 'Основний установчий документ, що регулює діяльність спілки, права та обов’язки її членів.',
      en: 'The main founding document governing the activities of the Union, rights, and duties of its members.',
      de: 'Das grundlegende Gründungsdokument, das die Tätigkeit des Verbands sowie die Rechte und Pflichten seiner Mitglieder regelt.',
      es: 'El documento fundacional principal que regula la actividad de la unión y los derechos y obligaciones de sus miembros.',
      kk: 'Одақтың қызметін, оның мүшелерінің құқықтары мен міндеттерін реттейтін негізгі құрылтай құжаты.',
      fr: 'Le principal document constitutif qui régit l’activité de l’union ainsi que les droits et obligations de ses membres.',
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
      de: 'Aufnahmeregeln für die Mitgliedschaft',
      es: 'Normas de admisión de miembros',
      kk: 'Қауымдастыққа мүшелікке қабылдау қағидалары',
      fr: 'Règles d’admission des membres',
    },
    description: {
      uk: 'Регламент та вимоги до кандидатів, перелік документів та процедура розгляду заявок.',
      en: 'Regulations and requirements for candidates, document checklist, and application review process.',
      de: 'Regelwerk und Anforderungen an Bewerber, Liste der erforderlichen Dokumente und Verfahren zur Prüfung der Anträge.',
      es: 'Reglamento y requisitos para los candidatos, lista de documentos y procedimiento de revisión de las solicitudes.',
      kk: 'Үміткерлерге қойылатын регламент пен талаптар, құжаттар тізбесі және өтінімдерді қарау тәртібі.',
      fr: 'Règlement et exigences applicables aux candidats, liste des documents et procédure d’examen des demandes.',
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
      de: 'Verhaltenskodex der UAOS-Mitglieder',
      es: 'Código de conducta de los miembros de UAOS',
      kk: 'UAOS қатысушыларының мінез-құлық кодексі',
      fr: 'Code de conduite des membres de l’UAOS',
    },
    description: {
      uk: 'Звід етичних принципів, стандартів доброчесності, відповідальності та якості для всіх партнерів.',
      en: 'A compilation of ethical principles, standards of integrity, responsibility, and quality for all partners.',
      de: 'Eine Zusammenstellung ethischer Grundsätze sowie von Standards der Integrität, Verantwortung und Qualität für alle Partner.',
      es: 'Recopilación de principios éticos y de estándares de integridad, responsabilidad y calidad para todos los socios.',
      kk: 'Барлық серіктестерге арналған этикалық принциптер, адалдық, жауапкершілік және сапа стандарттарының жинағы.',
      fr: 'Recueil des principes éthiques et des standards d’intégrité, de responsabilité et de qualité pour tous les partenaires.',
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
      de: 'Offizielle Präsentation des Verbands UAOS',
      es: 'Presentación oficial de la Asociación UAOS',
      kk: 'UAOS қауымдастығының ресми презентациясы',
      fr: 'Présentation officielle de l’Association UAOS',
    },
    description: {
      uk: 'Коротка презентація про місію, цілі, засновників та практичну користь для учасників ринку.',
      en: 'A brief presentation about the mission, goals, founders, and practical values for market participants.',
      de: 'Eine kurze Präsentation zu Mission, Zielen, Gründern und dem praktischen Nutzen für Marktteilnehmer.',
      es: 'Una breve presentación sobre la misión, los objetivos, los fundadores y el valor práctico para los participantes del mercado.',
      kk: 'Миссия, мақсаттар, құрылтайшылар және нарық қатысушылары үшін практикалық пайда туралы қысқаша презентация.',
      fr: 'Une brève présentation de la mission, des objectifs, des fondateurs et des bénéfices concrets pour les acteurs du marché.',
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
      de: 'Ordnung über die Leitungsorgane',
      es: 'Reglamento de los órganos de gobierno',
      kk: 'Басқару органдары туралы ереже',
      fr: 'Règlement des organes de gouvernance',
    },
    description: {
      uk: 'Документ, що визначає повноваження та порядок роботи Наглядової ради, Загальних зборів та Правління.',
      en: 'Document defining the authority and procedures of the Supervisory Board, General Assembly, and Board of Directors.',
      de: 'Dokument, das die Befugnisse und die Arbeitsweise von Aufsichtsrat, Mitgliederversammlung und Vorstand festlegt.',
      es: 'Documento que define las competencias y el funcionamiento del Consejo de supervisión, la Asamblea general y la Junta directiva.',
      kk: 'Қадағалау кеңесінің, Жалпы жиналыстың және Басқарманың өкілеттіктері мен жұмыс тәртібін айқындайтын құжат.',
      fr: 'Document définissant les compétences et le fonctionnement du Conseil de surveillance, de l’Assemblée générale et du Conseil d’administration.',
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
      de: 'Leitfaden zur Auswahl persönlicher Schutzausrüstung',
      es: 'Guía para la selección de equipos de protección individual',
      kk: 'Жеке қорғаныс құралдарын таңдау бойынша нұсқаулық',
      fr: 'Guide de sélection des équipements de protection individuelle',
    },
    description: {
      uk: 'Практичний матеріал про підбір ЗІЗ під ризики підприємства, підготовлений експертами асоціації.',
      en: 'A practical publication on selecting PPE based on enterprise risks, prepared by association experts.',
      de: 'Ein praxisorientierter Beitrag zur Auswahl von PSA entsprechend den Risiken im Unternehmen, erstellt von Fachleuten des Verbands.',
      es: 'Material práctico sobre la selección de EPI en función de los riesgos de la empresa, elaborado por expertos de la asociación.',
      kk: 'Кәсіпорын тәуекелдеріне сәйкес ЖҚҚ таңдау туралы практикалық материал, қауымдастық сарапшылары дайындаған.',
      fr: 'Publication pratique sur le choix des EPI en fonction des risques de l’entreprise, préparée par les experts de l’association.',
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
      de: 'Überblick über europäische Ansätze der Arbeitssicherheit',
      es: 'Panorama de los enfoques europeos de seguridad laboral',
      kk: 'Еңбек қауіпсіздігіне еуропалық көзқарастарға шолу',
      fr: 'Aperçu des approches européennes de la sécurité au travail',
    },
    description: {
      uk: 'Аналітичний матеріал про сучасні європейські практики та їх застосовність в Україні.',
      en: 'An analytical publication on modern European practices and their applicability in Ukraine.',
      de: 'Ein analytischer Beitrag über moderne europäische Praktiken und ihre Anwendbarkeit in der Ukraine.',
      es: 'Material analítico sobre las prácticas europeas actuales y su aplicabilidad en Ucrania.',
      kk: 'Заманауи еуропалық тәжірибелер және олардың Украинада қолданылу мүмкіндігі туралы талдау материалы.',
      fr: 'Publication analytique sur les pratiques européennes actuelles et leur applicabilité en Ukraine.',
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
