import {describe, expect, it} from 'vitest'
import {buildExcelCsv, csvExcelCell, CSV_EXCEL_SEP} from './csvExcel.js'

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
})
