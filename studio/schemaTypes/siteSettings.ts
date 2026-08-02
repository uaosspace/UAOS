import {defineField, defineType} from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      initialValue: '+38 067 585 9110',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      initialValue: 'uaos24h@gmail.com',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'localeString',
    }),
    defineField({
      name: 'brandTagline',
      title: 'Brand tagline',
      type: 'localeString',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Site settings / Contacts'}
    },
  },
})
