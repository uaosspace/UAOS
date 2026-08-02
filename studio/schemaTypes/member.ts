import {defineArrayMember, defineField, defineType} from 'sanity'

export const memberType = defineType({
  name: 'member',
  title: 'Member',
  type: 'document',
  fields: [
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'shortName', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'profileLevel',
      title: 'Profile level',
      type: 'string',
      options: {
        list: [
          {title: 'Basic', value: 'basic'},
          {title: 'Extended', value: 'extended'},
        ],
        layout: 'radio',
      },
      initialValue: 'basic',
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'localeString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'shortName',
      title: 'Short name / abbreviation',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'category', title: 'Category', type: 'localeString'}),
    defineField({name: 'shortDescription', title: 'Short description', type: 'localeText'}),
    defineField({name: 'fullDescription', title: 'Full description', type: 'localeText'}),
    defineField({
      name: 'logoImage',
      title: 'Logo image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'websiteUrl', title: 'Website', type: 'url'}),
    defineField({name: 'publicEmail', title: 'Public email', type: 'string'}),
    defineField({name: 'publicPhone', title: 'Public phone', type: 'string'}),
    defineField({
      name: 'competencies',
      title: 'Competencies',
      type: 'array',
      of: [defineArrayMember({type: 'localeString'})],
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      of: [defineArrayMember({type: 'localeString'})],
    }),
    defineField({
      name: 'certificates',
      title: 'Certificates',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', type: 'localeString', title: 'Title'}),
            defineField({name: 'documentUrl', type: 'url', title: 'Document URL'}),
            defineField({name: 'file', type: 'file', title: 'File'}),
          ],
          preview: {
            select: {title: 'title.uk'},
          },
        }),
      ],
    }),
    defineField({
      name: 'cases',
      title: 'Cases',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', type: 'localeString', title: 'Title'}),
            defineField({name: 'description', type: 'localeText', title: 'Description'}),
            defineField({name: 'image', type: 'image', title: 'Image', options: {hotspot: true}}),
          ],
          preview: {
            select: {title: 'title.uk', media: 'image'},
          },
        }),
      ],
    }),
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'name', type: 'localeString', title: 'Name'}),
            defineField({name: 'description', type: 'localeText', title: 'Description'}),
            defineField({name: 'image', type: 'image', title: 'Image', options: {hotspot: true}}),
            defineField({name: 'price', type: 'string', title: 'Price'}),
          ],
          preview: {
            select: {title: 'name.uk', media: 'image'},
          },
        }),
      ],
    }),
    defineField({name: 'internalNotes', title: 'Internal notes', type: 'text', rows: 3}),
  ],
  orderings: [
    {
      title: 'Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'shortName',
      subtitle: 'name.uk',
      media: 'logoImage',
      published: 'published',
    },
    prepare({title, subtitle, media, published}) {
      return {
        title: title || 'Member',
        subtitle: `${published ? '●' : '○'} ${subtitle || ''}`,
        media,
      }
    },
  },
})
