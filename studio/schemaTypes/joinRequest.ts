import {defineField, defineType} from 'sanity'

export const joinRequestType = defineType({
  name: 'joinRequest',
  title: 'Join application',
  type: 'document',
  fields: [
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending', value: 'pending'},
          {title: 'Reviewed', value: 'reviewed'},
          {title: 'Accepted', value: 'accepted'},
          {title: 'Rejected', value: 'rejected'},
        ],
      },
      initialValue: 'pending',
    }),
    defineField({name: 'companyName', title: 'Company', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'website', title: 'Website', type: 'string'}),
    defineField({name: 'activityField', title: 'Activity field', type: 'string'}),
    defineField({name: 'edrpou', title: 'EDRPOU', type: 'string'}),
    defineField({name: 'contactPerson', title: 'Contact person', type: 'string'}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'phone', title: 'Phone', type: 'string'}),
    defineField({name: 'message', title: 'Message', type: 'text'}),
    defineField({
      name: 'privacyConsent',
      title: 'Privacy policy consent',
      type: 'boolean',
      readOnly: true,
      validation: (rule) =>
        rule.required().custom((consent) =>
          consent === true ? true : 'Consent is required'
        ),
    }),
    defineField({
      name: 'consentTimestamp',
      title: 'Consent timestamp',
      type: 'datetime',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'consentIp',
      title: 'Consent IP (audit trail)',
      type: 'string',
      readOnly: true,
    }),
    defineField({name: 'submittedAt', title: 'Submitted at', type: 'datetime', readOnly: true}),
  ],
  preview: {
    select: {
      title: 'companyName',
      subtitle: 'status',
      email: 'email',
    },
    prepare({title, subtitle, email}) {
      return {
        title: title || 'Application',
        subtitle: `${subtitle || 'pending'} · ${email || ''}`,
      }
    },
  },
})
