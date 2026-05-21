import { get } from 'svelte/store'
import {
  equipRows,
  empTrips,
  commuteList,
  currentMonth,
  currentYear,
  offSettings,
  periodLabel,
  isEquipInReport,
  currentPK,
  periodTotalsForKey,
} from './ghg.js'
import {
  EXCEL_SHEET,
  EXCEL_OFFICE_HEADERS,
  EXCEL_TRIP_HEADERS,
  EXCEL_COMMUTE_HEADERS,
} from './periodExcelShared.js'

const ACCENT = 'FF1A6B3C'
const HEADER_FG = 'FFFFFFFF'
const ZEBRA = 'FFF5F4F0'
const BORDER = 'FFDDDBD3'

function thinBorder() {
  return {
    top: { style: 'thin', color: { argb: BORDER } },
    left: { style: 'thin', color: { argb: BORDER } },
    bottom: { style: 'thin', color: { argb: BORDER } },
    right: { style: 'thin', color: { argb: BORDER } },
  }
}

/**
 * @param {import('exceljs').Row} row
 * @param {number} colCount
 * @param {Set<number>} [rightCols]
 */
function styleHeaderRow(row, colCount, rightCols = new Set()) {
  row.height = 22
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c)
    cell.font = { bold: true, color: { argb: HEADER_FG }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT } }
    cell.alignment = {
      vertical: 'middle',
      horizontal: rightCols.has(c) ? 'right' : 'left',
      wrapText: true,
    }
    cell.border = thinBorder()
  }
}

/**
 * @param {import('exceljs').Row} row
 * @param {Set<number>} rightCols
 * @param {Set<number>} numFmt000
 * @param {Set<number>} numFmtMany
 */
function styleDataRow(row, rightCols, numFmt000, numFmtMany) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.border = thinBorder()
    if (row.number > 1 && row.number % 2 === 1) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } }
    }
    const v = cell.value
    if (v !== '' && v != null && typeof v === 'number') {
      if (numFmt000.has(colNumber)) cell.numFmt = '#,##0.000'
      else if (numFmtMany.has(colNumber)) cell.numFmt = '#,##0.000000'
      else cell.numFmt = '#,##0.###'
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: rightCols.has(colNumber) ? 'right' : 'left',
      wrapText: true,
    }
  })
}

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {string} pk
 * @param {number} m
 * @param {number} y
 */
function addOverviewSheet(workbook, pk, m, y) {
  const ws = workbook.addWorksheet(EXCEL_SHEET.overview, { properties: { defaultRowHeight: 19 } })
  const os = get(offSettings)
  const totals = periodTotalsForKey(pk)
  const exportedAt = new Date()

  ws.mergeCells('A1:D1')
  const title = ws.getCell('A1')
  title.value = 'GHG Inventory — Báo cáo phát thải theo kỳ'
  title.font = { size: 16, bold: true, color: { argb: 'FF1A1916' } }
  title.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(1).height = 30

  ws.mergeCells('A2:D2')
  const sub = ws.getCell('A2')
  sub.value = periodLabel(m, y)
  sub.font = { size: 13, bold: true, color: { argb: ACCENT } }
  sub.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(2).height = 24

  const pairs = [
    ['Kỳ báo cáo (mã)', pk],
    ['Xuất file lúc', exportedAt.toLocaleString('vi-VN')],
    ['Tên công ty / đơn vị', os.company || '—'],
    ['Địa điểm / cơ sở', os.location || '—'],
    ['Tổng Scope 1 + 2 (tấn CO₂e)', totals.s12],
    ['Tổng Scope 3 — ước tính (tấn CO₂e)', totals.s3],
    ['Tổng toàn kỳ (tấn CO₂e)', totals.total],
  ]

  let r = 4
  for (const [label, val] of pairs) {
    const row = ws.getRow(r)
    row.getCell(1).value = label
    row.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF6B6960' } }
    row.getCell(2).value = val
    if (typeof val === 'number') {
      row.getCell(2).numFmt = '#,##0.000'
      row.getCell(2).font = { size: 12, bold: true, color: { argb: ACCENT } }
    } else {
      row.getCell(2).font = { size: 11, color: { argb: 'FF1A1916' } }
    }
    row.getCell(1).border = thinBorder()
    row.getCell(2).border = thinBorder()
    r++
  }

  ws.getColumn(1).width = 38
  ws.getColumn(2).width = 44
}

/**
 * Sheet tổng quan trống cho file mẫu.
 * @param {import('exceljs').Workbook} workbook
 */
function addOverviewSheetTemplate(workbook) {
  const ws = workbook.addWorksheet(EXCEL_SHEET.overview, { properties: { defaultRowHeight: 19 } })

  ws.mergeCells('A1:D1')
  const title = ws.getCell('A1')
  title.value = 'GHG Inventory — Báo cáo phát thải theo kỳ (mẫu)'
  title.font = { size: 16, bold: true, color: { argb: 'FF1A1916' } }
  title.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(1).height = 30

  ws.mergeCells('A2:D2')
  const sub = ws.getCell('A2')
  sub.value = 'Điền công ty / cơ sở ở bảng dưới; chi tiết ở các sheet Văn phòng / Chuyến CT / Đi làm.'
  sub.font = { size: 12, bold: true, color: { argb: ACCENT } }
  sub.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(2).height = 22

  const pairs = [
    ['Kỳ báo cáo (mã)', '(vd: 2026-05)'],
    ['Xuất file lúc', '—'],
    ['Tên công ty / đơn vị', ''],
    ['Địa điểm / cơ sở', ''],
    ['Tổng Scope 1 + 2 (tấn CO₂e)', 0],
    ['Tổng Scope 3 — ước tính (tấn CO₂e)', 0],
    ['Tổng toàn kỳ (tấn CO₂e)', 0],
  ]

  let r = 4
  for (const [label, val] of pairs) {
    const row = ws.getRow(r)
    row.getCell(1).value = label
    row.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF6B6960' } }
    row.getCell(2).value = val
    if (typeof val === 'number') {
      row.getCell(2).numFmt = '#,##0.000'
      row.getCell(2).font = { size: 11, color: { argb: 'FF1A1916' } }
    } else {
      row.getCell(2).font = { size: 11, color: { argb: 'FF1A1916' } }
    }
    row.getCell(1).border = thinBorder()
    row.getCell(2).border = thinBorder()
    r++
  }

  ws.getColumn(1).width = 38
  ws.getColumn(2).width = 44
}

/** @param {import('exceljs').Worksheet} ws @param {number[]} widths */
function setColWidths(ws, widths) {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w
  })
}

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {any[]} rows
 * @param {{ forTemplate?: boolean }} [opts]
 */
function addOfficeSheet(workbook, rows, opts = {}) {
  const { forTemplate = false } = opts
  const ws = workbook.addWorksheet(EXCEL_SHEET.office, {
    views: [{ state: 'frozen', ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  })
  const hdr = ws.addRow([...EXCEL_OFFICE_HEADERS])
  styleHeaderRow(hdr, 8, new Set([3, 5, 6, 8]))

  for (const r of rows) {
    const tot = r.volume && r.ef ? (r.volume * r.ef) / 1000 : 0
    const row = ws.addRow([
      r.equipment || '',
      r.source || '',
      r.scope ?? '',
      r.unit || '',
      Number(r.volume) || 0,
      Number(r.ef) || 0,
      r.efRef || '',
      tot,
    ])
    styleDataRow(row, new Set([3, 5, 6, 8]), new Set([8]), new Set([6]))
  }

  if (!forTemplate && rows.length === 0) {
    const row = ws.addRow(['(Chưa có dòng đã xác nhận trong tổng hợp)', '', '', '', '', '', '', ''])
    row.getCell(1).font = { italic: true, color: { argb: 'FF9A9890' } }
    ws.mergeCells('A2:H2')
  }

  setColWidths(ws, [26, 30, 10, 12, 14, 16, 28, 18])
}

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {unknown[]} trips
 * @param {{ forTemplate?: boolean }} [opts]
 */
function addTripSheet(workbook, trips, opts = {}) {
  const { forTemplate = false } = opts
  const ws = workbook.addWorksheet(EXCEL_SHEET.trip, {
    views: [{ state: 'frozen', ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  })
  const hdr = ws.addRow([...EXCEL_TRIP_HEADERS])
  styleHeaderRow(hdr, 13, new Set([10, 11, 12, 13]))

  for (const t of trips) {
    const rowObj = /** @type {Record<string, unknown>} */ (t)
    const row = ws.addRow([
      rowObj.name ?? '',
      rowObj.empId ?? '',
      rowObj.dept ?? '',
      rowObj.trip ?? '',
      rowObj.purpose ?? '',
      rowObj.from ?? '',
      rowObj.to ?? '',
      rowObj.dateFrom ?? '',
      rowObj.dateTo ?? '',
      Number(rowObj.co2Air) || 0,
      Number(rowObj.co2Ground) || 0,
      Number(rowObj.co2Hotel) || 0,
      Number(rowObj.co2Total) || 0,
    ])
    styleDataRow(row, new Set([10, 11, 12, 13]), new Set([10, 11, 12, 13]), new Set())
  }

  if (!forTemplate && trips.length === 0) {
    const row = ws.addRow(['(Chưa có chuyến công tác trong kỳ)', '', '', '', '', '', '', '', '', '', '', '', ''])
    row.getCell(1).font = { italic: true, color: { argb: 'FF9A9890' } }
    ws.mergeCells('A2:M2')
  }

  setColWidths(ws, [18, 12, 16, 26, 18, 16, 16, 12, 12, 14, 16, 16, 16])
}

/**
 * @param {import('exceljs').Workbook} workbook
 * @param {unknown[]} list
 * @param {{ forTemplate?: boolean }} [opts]
 */
function addCommuteSheet(workbook, list, opts = {}) {
  const { forTemplate = false } = opts
  const ws = workbook.addWorksheet(EXCEL_SHEET.commute, {
    views: [{ state: 'frozen', ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  })
  const hdr = ws.addRow([...EXCEL_COMMUTE_HEADERS])
  styleHeaderRow(hdr, 9, new Set([5, 6, 7, 8, 9]))

  for (const c of list) {
    const rowObj = /** @type {Record<string, unknown>} */ (c)
    const row = ws.addRow([
      rowObj.name ?? '',
      rowObj.empId ?? '',
      rowObj.dept ?? '',
      rowObj.vehicle ?? '',
      Number(rowObj.km) || 0,
      Number(rowObj.days) || 0,
      Number(rowObj.wfh) || 0,
      Number(rowObj.carpool) || 1,
      Number(rowObj.co2) || 0,
    ])
    styleDataRow(row, new Set([5, 6, 7, 8, 9]), new Set([9]), new Set())
  }

  if (!forTemplate && list.length === 0) {
    const row = ws.addRow(['(Chưa có bản ghi đi làm trong kỳ)', '', '', '', '', '', '', '', ''])
    row.getCell(1).font = { italic: true, color: { argb: 'FF9A9890' } }
    ws.mergeCells('A2:I2')
  }

  setColWidths(ws, [18, 12, 16, 28, 14, 18, 16, 14, 14])
}

/**
 * Tạo workbook .xlsx cho kỳ hiện tại: sheet tổng quan + dữ liệu có định dạng.
 * @returns {Promise<{ buffer: ArrayBuffer, filename: string }>}
 */
export async function exportCurrentPeriodExcel() {
  const ExcelJS = (await import('exceljs')).default
  const pk = currentPK()
  const m = get(currentMonth)
  const y = get(currentYear)
  const $e = get(equipRows).filter(isEquipInReport)
  const $t = get(empTrips)
  const $c = get(commuteList)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'GHG Inventory'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.properties.date1904 = false

  addOverviewSheet(workbook, pk, m, y)
  addOfficeSheet(workbook, $e)
  addTripSheet(workbook, $t)
  addCommuteSheet(workbook, $c)

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `ghg_${pk}_${new Date().toISOString().slice(0, 10)}.xlsx`
  return { buffer, filename }
}

/**
 * File mẫu cùng cấu trúc sheet / cột với export (dữ liệu trống, không dòng placeholder).
 * @returns {Promise<{ buffer: ArrayBuffer, filename: string }>}
 */
export async function exportPeriodExcelTemplate() {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'GHG Inventory'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.properties.date1904 = false

  addOverviewSheetTemplate(workbook)
  addOfficeSheet(workbook, [], { forTemplate: true })
  addTripSheet(workbook, [], { forTemplate: true })
  addCommuteSheet(workbook, [], { forTemplate: true })

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `ghg_mau_nhap_lieu_${new Date().toISOString().slice(0, 10)}.xlsx`
  return { buffer, filename }
}
