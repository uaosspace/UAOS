import {defineField, defineType} from 'sanity'

export const localeString = defineType({
  name: 'localeString',
  title: 'Localized string',
  type: 'object',
  fields: [
    defineField({name: 'uk', title: 'Українська', type: 'string'}),
    defineField({name: 'en', title: 'English', type: 'string'}),
  ],
})

export const localeText = defineType({
  name: 'localeText',
  title: 'Localized text',
  type: 'object',
  fields: [
    defineField({name: 'uk', title: 'Українська', type: 'text', rows: 4}),
    defineField({name: 'en', title: 'English', type: 'text', rows: 4}),
  ],
})
