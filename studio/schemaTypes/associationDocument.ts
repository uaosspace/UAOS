import {defineField, defineType} from 'sanity'

export const associationDocumentType = defineType({
  name: 'associationDocument',
  title: 'Document',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localeText',
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'PDF', value: 'pdf'},
          {title: 'DOC', value: 'doc'},
          {title: 'Link', value: 'link'},
        ],
      },
      initialValue: 'pdf',
    }),
    defineField({name: 'size', title: 'Size label', type: 'string', description: 'e.g. 1.2 MB'}),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          {title: 'UA', value: 'UA'},
          {title: 'EN', value: 'EN'},
          {title: 'UA/EN', value: 'UA/EN'},
        ],
      },
      initialValue: 'UA',
    }),
    defineField({name: 'dateUpdated', title: 'Updated', type: 'date'}),
    defineField({name: 'file', title: 'File', type: 'file'}),
    defineField({name: 'externalUrl', title: 'External URL', type: 'url'}),
  ],
  preview: {
    select: {
      title: 'title.uk',
      subtitle: 'type',
    },
  },
})
