import {describe, expect, it} from 'vitest'
import {
  buildExcelCsv,
  csvContentDisposition,
  csvDownloadFilename,
  csvExcelCell,
  csvExcelText,
  CSV_EXCEL_SEP,
} from './csvExcel.js'

describe('csvExcel', () => {
  it('uses semicolon and UTF-8 BOM for Excel', () => {
    const csv = buildExcelCsv(['groupUk', 'nameUk'], [['Постачальники', 'ТОВ «Тест»']])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain(`groupUk${CSV_EXCEL_SEP}nameUk`)
    expect(csv).toContain('Постачальники')
    expect(csv).not.toMatch(/^[^;]+,[^;]+/m)
  })

  it('escapes quotes and semicolons in cells', () => {
    expect(csvExcelCell('a;b')).toBe('"a;b"')
    expect(csvExcelCell('say "hi"')).toBe('"say ""hi"""')
  })

  it('builds dated download filenames', () => {
    expect(csvDownloadFilename('zayavky', new Date('2026-08-15T12:00:00.000Z'))).toBe(
      'uaos-zayavky-2026-08-15.csv',
    )
    expect(csvContentDisposition('uaos-zayavky-2026-08-15.csv')).toContain(
      'filename="uaos-zayavky-2026-08-15.csv"',
    )
  })

  it('marks phones as Excel text', () => {
    expect(csvExcelText('380955551212')).toBe('\t380955551212')
    expect(csvExcelText('')).toBe('')
  })
})
