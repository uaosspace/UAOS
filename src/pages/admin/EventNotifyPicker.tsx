import {useMemo, useState} from 'react'
import type {Locale} from '../../data/locales'
import {TRANSLATIONS} from '../../data/translations'
import {accessLevelLabel} from './adminLabels'
import {adminInputClass, adminLabelClass} from './adminUi'

export type NotifyPickerMode = 'by_role' | 'by_members'

export type EventNotifyRecipientDraft = {
  memberUserId: string
  notifyMeeting: boolean
  notifyProtocol: boolean
}

export type CabinetNotifyPerson = {
  id: string
  email: string
  displayName: string
  accessLevel: string
}

const ACCESS_LEVELS = ['partner', 'member', 'staff', 'board'] as const

type Flags = {meeting: boolean; protocol: boolean}

function flagsFromRecipients(recipients: EventNotifyRecipientDraft[]): Record<string, Flags> {
  const map: Record<string, Flags> = {}
  for (const item of recipients) {
    map[item.memberUserId] = {meeting: item.notifyMeeting, protocol: item.notifyProtocol}
  }
  return map
}

function recipientsFromFlags(map: Record<string, Flags>): EventNotifyRecipientDraft[] {
  return Object.entries(map)
    .filter(([, flags]) => flags.meeting || flags.protocol)
    .map(([memberUserId, flags]) => ({
      memberUserId,
      notifyMeeting: flags.meeting,
      notifyProtocol: flags.protocol,
    }))
}

interface EventNotifyPickerProps {
  currentLang: Locale
  people: CabinetNotifyPerson[]
  loading: boolean
  mode: NotifyPickerMode
  filterRole: string
  recipients: EventNotifyRecipientDraft[]
  onModeChange: (mode: NotifyPickerMode) => void
  onFilterRoleChange: (role: string) => void
  onRecipientsChange: (recipients: EventNotifyRecipientDraft[]) => void
}

export default function EventNotifyPicker({
  currentLang,
  people,
  loading,
  mode,
  filterRole,
  recipients,
  onModeChange,
  onFilterRoleChange,
  onRecipientsChange,
}: EventNotifyPickerProps) {
  const t = TRANSLATIONS[currentLang]
  const [query, setQuery] = useState('')
  const flags = flagsFromRecipients(recipients)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return people.filter((person) => {
      if (mode === 'by_role') {
        if (!filterRole) return false
        if (person.accessLevel !== filterRole) return false
      }
      if (!q) return true
      return (
        person.email.toLowerCase().includes(q) ||
        person.displayName.toLowerCase().includes(q)
      )
    })
  }, [people, mode, filterRole, query])

  function setFlag(userId: string, key: keyof Flags, value: boolean) {
    const next = {...flags}
    const current = next[userId] ?? {meeting: false, protocol: false}
    next[userId] = {...current, [key]: value}
    onRecipientsChange(recipientsFromFlags(next))
  }

  function setColumn(key: keyof Flags, value: boolean) {
    const next = {...flags}
    for (const person of visible) {
      const current = next[person.id] ?? {meeting: false, protocol: false}
      next[person.id] = {...current, [key]: value}
    }
    onRecipientsChange(recipientsFromFlags(next))
  }

  const allMeeting = visible.length > 0 && visible.every((person) => flags[person.id]?.meeting)
  const allProtocol = visible.length > 0 && visible.every((person) => flags[person.id]?.protocol)

  return (
    <div className="md:col-span-2 space-y-3 rounded-xl border border-brand-slate-200 p-3 dark:border-brand-slate-700">
      <p className={`${adminLabelClass}`}>{t.admin_event_notify_title}</p>
      <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400">
        {t.admin_event_notify_hint}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={
            mode === 'by_role'
              ? 'rounded-xl bg-brand-blue-500 px-3 py-1.5 text-sm font-medium text-white'
              : 'rounded-xl border border-brand-slate-200 px-3 py-1.5 text-sm font-medium text-brand-slate-600 dark:border-brand-slate-700 dark:text-brand-slate-300'
          }
          onClick={() => onModeChange('by_role')}
        >
          {t.admin_event_notify_by_role}
        </button>
        <button
          type="button"
          className={
            mode === 'by_members'
              ? 'rounded-xl bg-brand-blue-500 px-3 py-1.5 text-sm font-medium text-white'
              : 'rounded-xl border border-brand-slate-200 px-3 py-1.5 text-sm font-medium text-brand-slate-600 dark:border-brand-slate-700 dark:text-brand-slate-300'
          }
          onClick={() => onModeChange('by_members')}
        >
          {t.admin_event_notify_by_members}
        </button>
      </div>

      {mode === 'by_role' ? (
        <label className="block space-y-1.5 text-sm max-w-xs">
          <span className={adminLabelClass}>{t.admin_event_notify_role_filter}</span>
          <select
            className={adminInputClass}
            value={filterRole}
            onChange={(e) => onFilterRoleChange(e.target.value)}
          >
            <option value="">{t.admin_event_notify_role_placeholder}</option>
            {ACCESS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {accessLevelLabel(t, level)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="block space-y-1.5 text-sm max-w-md">
          <span className={adminLabelClass}>{t.admin_event_notify_search}</span>
          <input
            className={adminInputClass}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.admin_event_notify_search_placeholder}
          />
        </label>
      )}

      {loading ? (
        <p className="text-sm text-brand-slate-500">{t.admin_loading}</p>
      ) : mode === 'by_role' && !filterRole ? (
        <p className="text-sm text-brand-slate-500">{t.admin_event_notify_pick_role}</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-brand-slate-500">
          {mode === 'by_role' ? t.admin_event_notify_empty : t.admin_event_notify_empty_all}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-brand-slate-500">
                <th className="py-2 pr-3 font-medium">{t.admin_cabinet_user_email}</th>
                <th className="py-2 pr-3 font-medium">{t.admin_cabinet_user_access_level}</th>
                <th className="py-2 pr-3 font-medium">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allMeeting}
                      onChange={(e) => setColumn('meeting', e.target.checked)}
                    />
                    {t.admin_event_notify_col_meeting}
                  </label>
                </th>
                <th className="py-2 font-medium">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allProtocol}
                      onChange={(e) => setColumn('protocol', e.target.checked)}
                    />
                    {t.admin_event_notify_col_protocol}
                  </label>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((person) => (
                <tr key={person.id} className="border-t border-brand-slate-100 dark:border-brand-slate-800">
                  <td className="py-2 pr-3">
                    <p className="text-brand-slate-900 dark:text-white">{person.email}</p>
                    {person.displayName ? (
                      <p className="text-xs text-brand-slate-500">{person.displayName}</p>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 text-brand-slate-600 dark:text-brand-slate-300">
                    {accessLevelLabel(t, person.accessLevel)}
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={Boolean(flags[person.id]?.meeting)}
                      onChange={(e) => setFlag(person.id, 'meeting', e.target.checked)}
                      aria-label={`${t.admin_event_notify_col_meeting}: ${person.email}`}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(flags[person.id]?.protocol)}
                      onChange={(e) => setFlag(person.id, 'protocol', e.target.checked)}
                      aria-label={`${t.admin_event_notify_col_protocol}: ${person.email}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
