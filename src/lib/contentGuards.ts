import {LOCALES} from '../data/locales'
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
 * Нормализует локализованный текст: `uk`/`en` всегда строки, остальные локали остаются
 * undefined, если перевода нет — `resolveLocalized` в таком случае даёт fallback.
 */
export function readLocalizedText(value: unknown): LocalizedText {
  const source = isRecord(value) ? value : {}
  const result: LocalizedText = {
    uk: readString(source.uk) ?? '',
    en: readString(source.en) ?? '',
  }

  for (const locale of LOCALES) {
    const text = readString(source[locale])
    if (text) result[locale] = text
  }

  return result
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

/**
 * Возвращает допустимый уровень доступа документа/материала; по умолчанию — публичный.
 */
export function readDocumentAccessLevel(value: unknown): DocumentItem['accessLevel'] {
  return value === 'member' || value === 'internal' ? value : 'public'
}

/**
 * Нормализует массив строковых идентификаторов (например, participantTypes/sectors).
 */
export function readStringArray(value: unknown): string[] {
  return readArray(value)
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item))
}
