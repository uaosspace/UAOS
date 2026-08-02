import {describe, expect, it} from 'vitest'
import {mapDoc} from './documents'
import {mapEvent} from './events'
import {mapMember} from './members'
import {mapNews} from './news'

describe('Sanity data mappers', () => {
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
    })

    expect(document.type).toBe('link')
    expect(document.fileUrl).toBe('https://docs.example/file.pdf')
    expect(news.slug).toBe('update')
    expect(news.title.en).toBe('News')
  })
})
