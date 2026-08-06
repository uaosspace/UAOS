import {useEffect} from 'react'
import {buildCanonicalUrl, resolveShareImageUrl} from '../lib/documentMeta'

interface DocumentMetaOptions {
  title: string
  description?: string
  /** Open Graph / Twitter: заповнюється для деталей; інакше — дефолтний hero. */
  ogImage?: string
  ogType?: 'website' | 'article' | 'profile'
}

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function upsertLinkRel(rel: string, href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"][data-managed="document-meta"]`)
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', rel)
    link.setAttribute('data-managed', 'document-meta')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

/**
 * Клієнтський SEO-хук: title, description, canonical, Open Graph, Twitter Cards.
 * Без SSR: краулери без JS бачать лише fallback з `index.html`.
 */
export function useDocumentMeta({title, description, ogImage, ogType = 'website'}: DocumentMetaOptions) {
  useEffect(() => {
    const origin = window.location.origin
    const canonical = buildCanonicalUrl(origin, window.location.pathname)
    const imageUrl = resolveShareImageUrl(origin, ogImage)

    document.title = title
    upsertLinkRel('canonical', canonical)

    if (description) {
      upsertMetaTag('name', 'description', description)
      upsertMetaTag('property', 'og:description', description)
      upsertMetaTag('name', 'twitter:description', description)
    }

    upsertMetaTag('property', 'og:title', title)
    upsertMetaTag('property', 'og:type', ogType)
    upsertMetaTag('property', 'og:url', canonical)
    upsertMetaTag('property', 'og:image', imageUrl)

    upsertMetaTag('name', 'twitter:card', 'summary_large_image')
    upsertMetaTag('name', 'twitter:title', title)
    upsertMetaTag('name', 'twitter:image', imageUrl)
  }, [title, description, ogImage, ogType])
}
