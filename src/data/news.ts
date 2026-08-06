import {LocalizedText} from '../types'
import {ContentApiError, fetchContentItems} from '../lib/contentApi'
import {
  isRecord,
  readArray,
  readHttpUrl,
  readLocalizedText,
  readString,
  readStringOr,
} from '../lib/contentGuards'

export interface NewsItem {
  id: string
  slug: string
  published: boolean
  publishedAt: string
  title: LocalizedText
  excerpt: LocalizedText
  body: LocalizedText
  coverImageUrl?: string
  /** When set, card opens this URL instead of on-site article. */
  externalUrl?: string
}

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'news-eu-ppe-standards-update',
    slug: 'eu-ppe-standards-update',
    published: true,
    publishedAt: '2026-07-18',
    title: {
      uk: 'UAOS взяла участь у консультаціях щодо гармонізації стандартів ЗІЗ з ЄС',
      en: 'UAOS participated in consultations on harmonizing PPE standards with the EU',
      de: 'UAOS beteiligte sich an Konsultationen zur Harmonisierung der PSA-Standards mit der EU',
      es: 'UAOS participó en consultas sobre la armonización de las normas de EPI con la UE',
      kk: 'UAOS ЖҚҚ стандарттарын ЕО-мен үйлестіру жөніндегі консультацияларға қатысты',
      fr: 'L’UAOS a participé aux consultations sur l’harmonisation des normes relatives aux EPI avec l’UE',
    },
    excerpt: {
      uk: 'Представники асоціації презентували позицію українських виробників під час робочої зустрічі з профільним регулятором.',
      en: 'Association representatives presented the position of Ukrainian manufacturers during a working meeting with the sector regulator.',
      de: 'Vertreter des Verbands stellten die Position der ukrainischen Hersteller bei einem Arbeitstreffen mit der zuständigen Aufsichtsbehörde vor.',
      es: 'Los representantes de la asociación presentaron la posición de los fabricantes ucranianos durante una reunión de trabajo con el organismo regulador del sector.',
      kk: 'Қауымдастық өкілдері салалық реттеушімен өткен жұмыс кездесуінде украиналық өндірушілердің ұстанымын таныстырды.',
      fr: 'Les représentants de l’association ont présenté la position des fabricants ukrainiens lors d’une réunion de travail avec le régulateur sectoriel.',
    },
    body: {
      uk: 'UAOS долучилася до робочої групи з адаптації національних стандартів засобів індивідуального захисту до вимог ЄС. У ході зустрічі учасники обговорили терміни перехідного періоду, вимоги до сертифікації та практичні кроки для виробників і постачальників. Асоціація продовжує представляти консолідовану позицію галузі в діалозі з державними органами.',
      en: 'UAOS joined a working group on adapting national personal protective equipment standards to EU requirements. During the meeting, participants discussed transition period timelines, certification requirements, and practical steps for manufacturers and suppliers. The association continues to represent a consolidated industry position in dialogue with state authorities.',
      de: 'UAOS ist einer Arbeitsgruppe zur Anpassung der nationalen Standards für persönliche Schutzausrüstung an die Anforderungen der EU beigetreten. Im Verlauf des Treffens erörterten die Teilnehmenden die Fristen der Übergangsphase, die Anforderungen an die Zertifizierung sowie praktische Schritte für Hersteller und Lieferanten. Der Verband vertritt weiterhin eine konsolidierte Position der Branche im Dialog mit den staatlichen Behörden.',
      es: 'UAOS se ha incorporado al grupo de trabajo para adaptar las normas nacionales de equipos de protección individual a los requisitos de la UE. Durante la reunión, los participantes debatieron los plazos del período transitorio, los requisitos de certificación y los pasos prácticos para fabricantes y proveedores. La asociación sigue representando una posición consolidada del sector en el diálogo con los organismos estatales.',
      kk: 'UAOS жеке қорғаныс құралдарының ұлттық стандарттарын ЕО талаптарына бейімдеу жөніндегі жұмыс тобына қосылды. Кездесу барысында қатысушылар өтпелі кезеңнің мерзімдерін, сертификаттауға қойылатын талаптарды және өндірушілер мен жеткізушілер үшін практикалық қадамдарды талқылады. Қауымдастық мемлекеттік органдармен диалогта саланың біріккен ұстанымын білдіруді жалғастырады.',
      fr: 'L’UAOS a rejoint un groupe de travail consacré à l’adaptation des normes nationales relatives aux équipements de protection individuelle aux exigences de l’UE. Lors de la réunion, les participants ont examiné les délais de la période de transition, les exigences de certification et les démarches concrètes pour les fabricants et les fournisseurs. L’association continue de porter une position consolidée du secteur dans le dialogue avec les autorités publiques.',
    },
  },
  {
    id: 'news-member-training-program',
    slug: 'member-training-program-launch',
    published: true,
    publishedAt: '2026-06-25',
    title: {
      uk: 'Стартувала навчальна програма для підприємств-учасників асоціації',
      en: 'A training program for member enterprises has launched',
      de: 'Schulungsprogramm für Mitgliedsunternehmen des Verbands gestartet',
      es: 'Se ha puesto en marcha un programa de formación para las empresas miembro de la asociación',
      kk: 'Қауымдастыққа қатысушы кәсіпорындар үшін оқу бағдарламасы басталды',
      fr: 'Lancement d’un programme de formation pour les entreprises membres de l’association',
    },
    excerpt: {
      uk: 'Серія практичних семінарів з підбору засобів захисту та оцінки ризиків на робочих місцях для підприємств-споживачів.',
      en: 'A series of practical seminars on selecting protective equipment and assessing workplace risks for consumer enterprises.',
      de: 'Eine Reihe praxisnaher Seminare zur Auswahl von Schutzausrüstung und zur Risikobeurteilung an Arbeitsplätzen für Anwenderunternehmen.',
      es: 'Una serie de seminarios prácticos sobre la selección de equipos de protección y la evaluación de riesgos en los puestos de trabajo para las empresas usuarias.',
      kk: 'Тұтынушы кәсіпорындар үшін қорғаныс құралдарын таңдау және жұмыс орындарындағы тәуекелдерді бағалау бойынша практикалық семинарлар сериясы.',
      fr: 'Une série de séminaires pratiques sur le choix des équipements de protection et l’évaluation des risques sur les postes de travail pour les entreprises utilisatrices.',
    },
    body: {
      uk: 'У межах напряму «Експертиза та навчання» UAOS запустила серію семінарів для підприємств-учасників. Програма охоплює методики оцінки ризиків, підбір засобів індивідуального захисту під конкретні виробничі умови та огляд типових помилок під час впровадження систем охорони праці. Участь безкоштовна для членів асоціації.',
      en: 'As part of the “Expertise and training” direction, UAOS launched a series of seminars for member enterprises. The program covers risk assessment methods, selecting personal protective equipment for specific production conditions, and a review of common mistakes in implementing occupational safety systems. Participation is free for association members.',
      de: 'Im Rahmen des Schwerpunkts „Expertise und Schulung“ hat UAOS eine Reihe von Seminaren für Mitgliedsunternehmen gestartet. Das Programm umfasst Methoden der Risikobeurteilung, die Auswahl persönlicher Schutzausrüstung für konkrete Produktionsbedingungen sowie einen Überblick über typische Fehler bei der Einführung von Arbeitssicherheitssystemen. Für Mitglieder des Verbands ist die Teilnahme kostenlos.',
      es: 'En el marco de la línea de trabajo «Experiencia y formación», UAOS ha puesto en marcha una serie de seminarios para las empresas miembro. El programa abarca métodos de evaluación de riesgos, la selección de equipos de protección individual para condiciones de producción concretas y una revisión de los errores más habituales al implantar sistemas de seguridad laboral. La participación es gratuita para los miembros de la asociación.',
      kk: '«Сараптама және оқыту» бағыты шеңберінде UAOS қатысушы кәсіпорындар үшін семинарлар сериясын бастады. Бағдарлама тәуекелдерді бағалау әдістерін, нақты өндірістік жағдайларға арналған жеке қорғаныс құралдарын таңдауды және еңбек қауіпсіздігі жүйелерін енгізу кезіндегі типтік қателерге шолуды қамтиды. Қауымдастық мүшелері үшін қатысу тегін.',
      fr: 'Dans le cadre de l’axe « Expertise et formation », l’UAOS a lancé une série de séminaires destinés aux entreprises membres. Le programme couvre les méthodes d’évaluation des risques, le choix des équipements de protection individuelle adaptés à des conditions de production précises et un tour d’horizon des erreurs courantes lors de la mise en place de systèmes de sécurité au travail. La participation est gratuite pour les membres de l’association.',
    },
  },
  {
    id: 'news-new-members-welcome',
    slug: 'new-members-summer-2026',
    published: true,
    publishedAt: '2026-06-02',
    title: {
      uk: 'До UAOS долучилися нові учасники з числа виробників та експертних організацій',
      en: 'New members joined UAOS among manufacturers and expert organizations',
      de: 'Neue Mitglieder aus Herstellern und Expertenorganisationen sind UAOS beigetreten',
      es: 'Nuevos miembros se han sumado a UAOS entre fabricantes y organizaciones expertas',
      kk: 'UAOS-қа өндірушілер мен сараптамалық ұйымдар қатарынан жаңа қатысушылар қосылды',
      fr: 'De nouveaux membres, fabricants et organisations expertes, ont rejoint l’UAOS',
    },
    excerpt: {
      uk: 'Каталог учасників асоціації розширився — вітаємо нові компанії та експертні об’єднання у професійній спільноті UAOS.',
      en: 'The association’s member catalog has grown — welcoming new companies and expert unions to the UAOS professional community.',
      de: 'Der Mitgliederkatalog des Verbands ist gewachsen — wir begrüßen neue Unternehmen und Expertenverbände in der professionellen UAOS-Gemeinschaft.',
      es: 'El catálogo de miembros de la asociación se ha ampliado: damos la bienvenida a nuevas empresas y asociaciones de expertos a la comunidad profesional de UAOS.',
      kk: 'Қауымдастық қатысушыларының каталогы кеңейді — UAOS кәсіби қауымдастығындағы жаңа компаниялар мен сараптамалық бірлестіктерді құттықтаймыз.',
      fr: 'Le catalogue des membres de l’association s’est élargi : nous accueillons de nouvelles entreprises et associations d’experts dans la communauté professionnelle UAOS.',
    },
    body: {
      uk: 'Асоціація вітає нових учасників, що долучилися до професійної спільноти UAOS у другому кварталі 2026 року. Серед нових членів — виробники засобів індивідуального захисту та незалежні експертні організації у сфері охорони праці. Це розширює галузеве представництво асоціації та посилює діалог із державними органами й підприємствами-споживачами.',
      en: 'The association welcomes new members who joined the UAOS professional community in Q2 2026. New members include personal protective equipment manufacturers and independent occupational safety expert organizations. This expands the association’s industry representation and strengthens dialogue with state authorities and consumer enterprises.',
      de: 'Der Verband begrüßt die neuen Mitglieder, die der professionellen UAOS-Gemeinschaft im zweiten Quartal 2026 beigetreten sind. Zu den neuen Mitgliedern gehören Hersteller persönlicher Schutzausrüstung sowie unabhängige Expertenorganisationen im Bereich der Arbeitssicherheit. Das erweitert die Branchenvertretung des Verbands und stärkt den Dialog mit staatlichen Behörden und Anwenderunternehmen.',
      es: 'La asociación da la bienvenida a los nuevos miembros que se han incorporado a la comunidad profesional de UAOS en el segundo trimestre de 2026. Entre ellos hay fabricantes de equipos de protección individual y organizaciones expertas independientes en el ámbito de la seguridad laboral. Esto amplía la representación sectorial de la asociación y refuerza el diálogo con los organismos estatales y las empresas usuarias.',
      kk: 'Қауымдастық 2026 жылдың екінші тоқсанында UAOS кәсіби қауымдастығына қосылған жаңа қатысушыларды құттықтайды. Жаңа мүшелер арасында жеке қорғаныс құралдарын өндірушілер және еңбек қауіпсіздігі саласындағы тәуелсіз сараптамалық ұйымдар бар. Бұл қауымдастықтың салалық өкілдігін кеңейтеді және мемлекеттік органдармен, тұтынушы кәсіпорындармен диалогты күшейтеді.',
      fr: 'L’association accueille les nouveaux membres qui ont rejoint la communauté professionnelle UAOS au deuxième trimestre 2026. Parmi eux figurent des fabricants d’équipements de protection individuelle et des organisations expertes indépendantes dans le domaine de la sécurité au travail. Cela élargit la représentation sectorielle de l’association et renforce le dialogue avec les autorités publiques et les entreprises utilisatrices.',
    },
  },
]

export function mapNews(doc: unknown): NewsItem {
  const source = isRecord(doc) ? doc : {}

  return {
    id: readStringOr(source.id, readStringOr(source._id, 'news-unknown')),
    slug: readString(source.slug) || readStringOr(source.id, readStringOr(source._id, 'news-unknown')),
    published: source.published === undefined ? true : Boolean(source.published),
    publishedAt: readStringOr(source.publishedAt, new Date().toISOString()),
    title: readLocalizedText(source.title),
    excerpt: readLocalizedText(source.excerpt),
    body: readLocalizedText(source.body),
    coverImageUrl: readStringOr(source.coverImageUrl, '') || undefined,
    externalUrl: readHttpUrl(source.externalUrl),
  }
}

export async function fetchNews(): Promise<NewsItem[]> {
  try {
    const docs = await fetchContentItems<unknown>('news')
    const mapped = readArray(docs).map(mapNews)
    if (import.meta.env.DEV && mapped.length === 0) {
      console.warn('Content API fetchNews returned empty in DEV, using seed')
      return INITIAL_NEWS
    }
    return mapped
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Content API fetchNews unavailable in DEV, using seed:', err)
      return INITIAL_NEWS
    }
    if (err instanceof ContentApiError) throw err
    throw new ContentApiError('Failed to load news', 500)
  }
}
