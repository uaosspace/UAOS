import {defineField, defineType} from 'sanity'

export const eventType = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short description',
      type: 'localeText',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'fullDescription',
      title: 'Full description',
      type: 'localeText',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Training', value: 'training'},
          {title: 'Meeting', value: 'meeting'},
          {title: 'Conference', value: 'conference'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'format',
      title: 'Format',
      type: 'string',
      options: {
        list: [
          {title: 'Online', value: 'online'},
          {title: 'Offline', value: 'offline'},
          {title: 'Hybrid', value: 'hybrid'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'startAt',
      title: 'Start (UTC)',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'endAt',
      title: 'End (UTC)',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'timeZone',
      title: 'Time zone',
      type: 'string',
      initialValue: 'Europe/Kyiv',
    }),
    defineField({name: 'location', title: 'Location', type: 'localeString'}),
    defineField({name: 'onlineUrl', title: 'Online URL', type: 'url'}),
    defineField({name: 'registrationUrl', title: 'Registration URL', type: 'url'}),
    defineField({name: 'organizer', title: 'Organizer', type: 'localeString'}),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {
      titleUk: 'title.uk',
      titleEn: 'title.en',
      startAt: 'startAt',
      published: 'published',
      media: 'coverImage',
    },
    prepare({titleUk, titleEn, startAt, published, media}) {
      return {
        title: titleUk || titleEn || 'Event',
        subtitle: `${published ? '●' : '○'} ${startAt ? startAt.slice(0, 10) : ''}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Start date',
      name: 'startAtAsc',
      by: [{field: 'startAt', direction: 'asc'}],
    },
  ],
})
