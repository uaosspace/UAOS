import {useEffect} from 'react'

interface DocumentMetaOptions {
  title: string
  description?: string
  /** Open Graph: заповнюється лише для сторінок-деталей (учасник/новина/подія). */
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

function removeMetaTag(attr: 'name' | 'property', key: string) {
  document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)?.remove()
}

/**
 * Клієнтський SEO-хук: title + meta description + Open Graph без SSR.
 * Кожна сторінка викликає його зі своїм локалізованим заголовком/описом.
 */
export function useDocumentMeta({title, description, ogImage, ogType = 'website'}: DocumentMetaOptions) {
  useEffect(() => {
    document.title = title

    if (description) {
      upsertMetaTag('name', 'description', description)
      upsertMetaTag('property', 'og:description', description)
    }

    upsertMetaTag('property', 'og:title', title)
    upsertMetaTag('property', 'og:type', ogType)

    if (ogImage) {
      upsertMetaTag('property', 'og:image', ogImage)
    } else {
      removeMetaTag('property', 'og:image')
    }
  }, [title, description, ogImage, ogType])
}
