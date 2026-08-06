import {describe, expect, it} from 'vitest'
import {mapDoc} from './documents'
import {mapEvent} from './events'
import {resolveLocalized} from './locales'
import {mapMember} from './members'
import {mapNews} from './news'

describe('Content API data mappers', () => {
  it('maps member documents into safe public models', () => {
    const member = mapMember({
      _id: 'member-1',
      slug: 'acme',
      order: 2,
      published: true,
      profileLevel: 'extended',
      name: {uk: 'Acme', en: 'Acme'},
      shortName: 'ACME',
      category: {uk: 'Категорія', en: 'Category'},
      shortDescription: {uk: 'Коротко', en: 'Short'},
      fullDescription: {uk: 'Повний опис', en: 'Full description'},
      websiteUrl: 'https://acme.example',
      certificates: [{title: {uk: 'Cert', en: 'Cert'}, documentUrl: 'https://files.example/cert.pdf'}],
    })

    expect(member.slug).toBe('acme')
    expect(member.profileLevel).toBe('extended')
    expect(member.websiteUrl).toBe('https://acme.example/')
    expect(member.certificates?.[0].documentUrl).toBe('https://files.example/cert.pdf')
  })

  it('maps event data with safe fallbacks', () => {
    const event = mapEvent({
      _id: 'evt-1',
      title: {uk: 'Подія', en: 'Event'},
      shortDescription: {uk: 'Коротко', en: 'Short'},
      fullDescription: {uk: 'Повний', en: 'Full'},
      type: 'invalid',
      format: 'hybrid',
      startAt: '2026-01-01T10:00:00.000Z',
      endAt: '2026-01-01T11:00:00.000Z',
    })

    expect(event.type).toBe('meeting')
    expect(event.format).toBe('hybrid')
    expect(event.title.uk).toBe('Подія')
  })

  it('maps documents and news with normalized urls', () => {
    const document = mapDoc({
      _id: 'doc-1',
      title: {uk: 'Документ', en: 'Document'},
      description: {uk: 'Опис', en: 'Description'},
      type: 'link',
      language: 'EN',
      externalUrl: 'https://docs.example/file.pdf',
    })

    const news = mapNews({
      _id: 'news-1',
      slug: 'update',
      published: true,
      publishedAt: '2026-07-28',
      title: {uk: 'Новина', en: 'News'},
      excerpt: {uk: 'Коротко', en: 'Short'},
      body: {uk: 'Тіло', en: 'Body'},
      coverImageUrl: 'https://cdn.example/cover.jpg',
      externalUrl: 'https://partner.example/article',
    })

    expect(document.type).toBe('link')
    expect(document.fileUrl).toBe('https://docs.example/file.pdf')
    expect(news.slug).toBe('update')
    expect(news.title.en).toBe('News')
    expect(news.coverImageUrl).toBe('https://cdn.example/cover.jpg')
    expect(news.externalUrl).toBe('https://partner.example/article')
  })

  it('keeps content-API locales beyond uk/en and resolves them per locale', () => {
    const member = mapMember({
      _id: 'member-2',
      slug: 'acme',
      name: {uk: 'Acme', en: 'Acme'},
      category: {uk: 'Виробник ЗІЗ', en: 'PPE manufacturer', de: 'PSA-Hersteller'},
      shortDescription: {uk: 'Коротко', en: 'Short', kk: 'Қысқаша'},
      competencies: [{uk: 'Захист рук', en: 'Hand protection', fr: 'Protection des mains'}],
    })

    expect(resolveLocalized(member.category, 'de')).toBe('PSA-Hersteller')
    expect(resolveLocalized(member.shortDescription, 'kk')).toBe('Қысқаша')
    expect(resolveLocalized(member.competencies?.[0] ?? {uk: '', en: ''}, 'fr')).toBe(
      'Protection des mains',
    )
  })

  it('falls back to English for locales the CMS has not translated yet', () => {
    const news = mapNews({
      _id: 'news-2',
      slug: 'partial',
      title: {uk: 'Новина', en: 'News', de: 'Nachricht'},
      excerpt: {uk: 'Коротко', en: 'Short'},
      body: {uk: 'Тіло', en: 'Body'},
    })

    expect(resolveLocalized(news.title, 'de')).toBe('Nachricht')
    expect(resolveLocalized(news.excerpt, 'de')).toBe('Short')
    expect(news.excerpt.de).toBeUndefined()
  })

  it('reads localized event location coming from the JSONB column', () => {
    const event = mapEvent({
      _id: 'evt-2',
      title: {uk: 'Подія', en: 'Event'},
      startAt: '2026-01-01T10:00:00.000Z',
      location: {uk: 'Київ', en: 'Kyiv', de: 'Kiew'},
      organizer: {uk: 'УАПБ', en: 'UAOS'},
    })

    expect(resolveLocalized(event.location ?? {uk: '', en: ''}, 'de')).toBe('Kiew')
    expect(resolveLocalized(event.organizer ?? {uk: '', en: ''}, 'es')).toBe('UAOS')
  })
})
