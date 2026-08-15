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
