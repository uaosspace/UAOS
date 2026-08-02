import {defineField, defineType} from 'sanity'

export const newsType = defineType({
  name: 'news',
  title: 'News',
  type: 'document',
  fields: [
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title.uk', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'localeText',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'localeText',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
  orderings: [
    {
      title: 'Published date',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title.uk',
      subtitle: 'publishedAt',
      media: 'coverImage',
      published: 'published',
    },
    prepare({title, subtitle, media, published}) {
      return {
        title: title || 'News',
        subtitle: `${published ? '●' : '○'} ${subtitle ? String(subtitle).slice(0, 10) : ''}`,
        media,
      }
    },
  },
})
