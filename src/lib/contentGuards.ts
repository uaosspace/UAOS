import type {DocumentItem, EventFormat, EventType, LocalizedText, MemberProfileLevel} from '../types'

type UnknownRecord = Record<string, unknown>

/**
 * Проверяет, что значение похоже на объект и может читаться как record.
 */
export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

/**
 * Возвращает строку только для непустых текстовых значений.
 */
export function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/**
 * Возвращает строку или fallback, когда входное значение отсутствует.
 */
export function readStringOr(value: unknown, fallback: string): string {
  return readString(value) ?? fallback
}

/**
 * Нормализует локализованный текст в безопасную структуру с двумя языками.
 */
export function readLocalizedText(value: unknown): LocalizedText {
  if (!isRecord(value)) {
    return {uk: '', en: ''}
  }

  return {
    uk: readString(value.uk) ?? '',
    en: readString(value.en) ?? '',
  }
}

/**
 * Возвращает массив только для корректных списков.
 */
export function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

/**
 * Пропускает только допустимые URL для публичного использования.
 */
export function readHttpUrl(value: unknown): string | undefined {
  const raw = readString(value)
  if (!raw) return undefined

  try {
    const url = new URL(raw)
    return /^https?:$/i.test(url.protocol) ? url.toString() : undefined
  } catch {
    return undefined
  }
}

/**
 * Возвращает безопасный тип события из ограниченного набора.
 */
export function readEventType(value: unknown): EventType {
  return value === 'training' || value === 'meeting' || value === 'conference' ? value : 'meeting'
}

/**
 * Возвращает безопасный формат события из ограниченного набора.
 */
export function readEventFormat(value: unknown): EventFormat {
  return value === 'online' || value === 'offline' || value === 'hybrid' ? value : 'online'
}

/**
 * Возвращает безопасный уровень профиля участника.
 */
export function readMemberProfileLevel(value: unknown): MemberProfileLevel {
  return value === 'extended' ? 'extended' : 'basic'
}

/**
 * Возвращает допустимый тип документа.
 */
export function readDocumentType(value: unknown): DocumentItem['type'] {
  return value === 'pdf' || value === 'doc' || value === 'link' ? value : 'pdf'
}

/**
 * Возвращает допустимую языковую метку документа.
 */
export function readDocumentLanguage(value: unknown): DocumentItem['language'] {
  return value === 'EN' || value === 'UA/EN' ? value : 'UA'
}
