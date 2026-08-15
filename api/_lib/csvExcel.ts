/**
 * CSV helpers tuned for Excel on Windows (UA/RU locale):
 * - UTF-8 BOM so Cyrillic is not mojibake
 * - semicolon delimiter (Excel list separator in those locales)
 */

export const CSV_EXCEL_SEP = ';'

/** Escape a single field for semicolon-separated CSV. */
export function csvExcelCell(value: string): string {
  if (/[";\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/** Build a full CSV document Excel opens as columns with correct Cyrillic. */
export function buildExcelCsv(header: string[], rows: string[][]): string {
  const lines = [
    header.map(csvExcelCell).join(CSV_EXCEL_SEP),
    ...rows.map((row) => row.map(csvExcelCell).join(CSV_EXCEL_SEP)),
  ]
  return `\uFEFF${lines.join('\n')}`
}

/** Download name for admin CSV exports: `uaos-<slug>-YYYY-MM-DD.csv`. */
export function csvDownloadFilename(slug: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10)
  const safe = slug.replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return `uaos-${safe || 'export'}-${day}.csv`
}

export function csvContentDisposition(filename: string): string {
  return `attachment; filename="${filename}"`
}

/**
 * Force Excel to treat value as text (phones/IDs), not a number / scientific notation.
 * Leading tab is stripped from display in most Excel versions when opened from CSV.
 */
export function csvExcelText(value: string): string {
  if (!value) return ''
  return `\t${value}`
}

