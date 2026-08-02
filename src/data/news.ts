import {LocalizedText} from '../types'
import {getSanityClient, sanityConfigured, urlForImage} from '../lib/sanity'
import {
  isRecord,
  readArray,
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
}

const NEWS_QUERY = `*[_type == "news" && published == true] | order(publishedAt desc)[0...6] {
  _id,
  "slug": slug.current,
  published,
  publishedAt,
  title,
  excerpt,
  body,
  coverImage
}`

/**
 * Преобразует Sanity-новость в безопасную карточку публичной ленты.
 */
export function mapNews(doc: unknown): NewsItem {
  const source = isRecord(doc) ? doc : {}

  return {
    id: readStringOr(source._id, 'news-unknown'),
    slug: readString(source.slug) || readStringOr(source._id, 'news-unknown'),
    published: Boolean(source.published),
    publishedAt: readStringOr(source.publishedAt, new Date().toISOString()),
    title: readLocalizedText(source.title),
    excerpt: readLocalizedText(source.excerpt),
    body: readLocalizedText(source.body),
    coverImageUrl: urlForImage(source.coverImage, 'newsCover') || undefined,
  }
}

export async function fetchNews(): Promise<NewsItem[]> {
  const client = getSanityClient()
  if (!client || !sanityConfigured) {
    return []
  }
  try {
    const docs = await client.fetch(NEWS_QUERY)
    return readArray(docs).map(mapNews)
  } catch (err) {
    console.error('Sanity fetchNews failed:', err)
    return []
  }
}
