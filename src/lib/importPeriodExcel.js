/**
 * Import .xlsx cùng format export (sheet & tiêu đề cột trong periodExcelShared.js).
 */

import { get } from 'svelte/store'
import {
  equipRows,
  empTrips,
  commuteList,
  offSettings,
  setCompanyLocation,
  persistEquip,
  persistEmp,
  persistCommute,
} from './ghg.js'
import {
  EXCEL_SHEET,
  EXCEL_OFFICE_HEADERS,
  EXCEL_TRIP_HEADERS,
  EXCEL_COMMUTE_HEADERS,
  EXCEL_OVERVIEW_COMPANY_LABEL,
  EXCEL_OVERVIEW_LOCATION_LABEL,
} from './periodExcelShared.js'
import { COMMUTE_VEHICLES } from './constants.js'

/** @param {import('exceljs').Cell} cell */
export function cellToString(cell) {
  const v = cell.value
  if (v == null || v === '') return ''
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v).trim()
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'object' && v !== null) {
    if ('result' in v && v.result != null) return cellToString({ value: v.result })
    if ('richText' in v && Array.isArray(/** @type {{ richText: { text: string }[] }} */ (v).richText))
      return /** @type {{ richText: { text: string }[] }} */ (v).richText.map((p) => p.text).join('').trim()
    if ('text' in v && typeof /** @type {{ text?: string }} */ (v).text === 'string')
      return /** @type {{ text: string }} */ (v).text.trim()
  }
  return String(v).trim()
}

/** @param {import('exceljs').Cell} cell */
function cellToNumber(cell) {
  const v = cell.value
  if (v == null || v === '') return 0
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const s = cellToString(cell).replace(/,/g, '').replace(/\u00a0/g, '').trim()
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

/** @param {string} h */
function normHeader(h) {
  return String(h ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFC')
}

/**
 * @param {import('exceljs').Row} row
 * @param {string[]} expected
 * @returns {Record<string, number>}
 */
function headerIndexMap(row, expected) {
  /** @type {Record<string, number>} */
  const map = {}
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const key = normHeader(cellToString(cell))
    if (key) map[key] = colNumber
  })
  for (const h of expected) {
    const n = normHeader(h)
    if (map[n] === undefined) {
      throw new Error(`Thiếu cột bắt buộc: «${h}». Kiểm tra hàng tiêu đề sheet.`)
    }
  }
  return map
}

/** @param {import('exceljs').Worksheet} ws */
function sheetLastUsedRow(ws) {
  let max = 0
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    max = Math.max(max, rowNumber)
  })
  return max
}

/** @param {import('exceljs').Worksheet} sheet @param {number} rowNum */
function rowIsPlaceholder(sheet, rowNum) {
  const t = cellToString(sheet.getRow(rowNum).getCell(1))
  return t.startsWith('(')
}

/**
 * @param {import('exceljs').Worksheet} sheet
 * @param {number} rowNum
 * @param {Record<string, number>} map
 * @param {string[]} keysInOrder
 */
function rowHasAnyValue(sheet, rowNum, map, keysInOrder) {
  for (const h of keysInOrder) {
    const c = sheet.getRow(rowNum).getCell(map[normHeader(h)])
    if (cellToString(c) !== '' || cellToNumber(c) !== 0) return true
  }
  return false
}

function emptyFlightLeg() {
  return {
    id: `leg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    from: '',
    to: '',
    km: 0,
    legs: 1,
    cabin: 0.133,
    cabinLabel: 'Economy',
  }
}

/** @param {unknown} v */
function normKey(v) {
  return String(v ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/** @param {any} r */
function equipSig(r) {
  return [
    normKey(r.equipment),
    normKey(r.source),
    Number(r.scope) || 1,
    normKey(r.unit),
    Number(r.volume) || 0,
    Number(r.ef) || 0,
    normKey(r.efRef),
  ].join('|')
}

/** @param {any} t */
function tripSig(t) {
  return [
    normKey(t.empId),
    normKey(t.trip),
    normKey(t.dateFrom),
    normKey(t.dateTo),
    normKey(t.from),
    normKey(t.to),
  ].join('|')
}

/** @param {any} c */
function commuteSig(c) {
  return [normKey(c.empId), normKey(c.vehicle), Number(c.km) || 0, Number(c.days) || 0, Number(c.wfh) || 0].join('|')
}

/** @param {string} label */
function efFromVehicleLabel(label) {
  const t = label.trim()
  if (!t) return 0
  const hit = COMMUTE_VEHICLES.find(
    (x) => t === x.label || x.label.startsWith(t) || t.startsWith(x.label.split(' (')[0]),
  )
  return hit ? hit.value : 0
}

/**
 * @param {import('exceljs').Workbook} workbook
 * @returns {{ company?: string, location?: string }}
 */
function parseOverview(workbook) {
  const ws = workbook.getWorksheet(EXCEL_SHEET.overview)
  if (!ws) return {}
  /** @type {{ company?: string, location?: string }} */
  const out = {}
  ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber < 4) return
    const label = normHeader(cellToString(row.getCell(1)))
    const valB = cellToString(row.getCell(2))
    if (label === normHeader(EXCEL_OVERVIEW_COMPANY_LABEL) && valB) out.company = valB
    if (label === normHeader(EXCEL_OVERVIEW_LOCATION_LABEL) && valB) out.location = valB
  })
  return out
}

/**
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<{
 *   hasOfficeSheet: boolean,
 *   equip: unknown[],
 *   hasTripSheet: boolean,
 *   trips: unknown[],
 *   hasCommuteSheet: boolean,
 *   commutes: unknown[],
 *   overview: { company?: string, location?: string },
 * }>}
 */
export async function parsePeriodExcel(arrayBuffer) {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const overview = parseOverview(workbook)

  let hasOfficeSheet = false
  /** @type {unknown[]} */
  const equip = []

  const wsO = workbook.getWorksheet(EXCEL_SHEET.office)
  if (wsO) {
    hasOfficeSheet = true
    const hRow = wsO.getRow(1)
    const col = headerIndexMap(hRow, EXCEL_OFFICE_HEADERS)
    const lastRow = sheetLastUsedRow(wsO)
    for (let r = 2; r <= lastRow; r++) {
      if (rowIsPlaceholder(wsO, r)) continue
      if (!rowHasAnyValue(wsO, r, col, EXCEL_OFFICE_HEADERS)) continue
      const row = wsO.getRow(r)
      const g = (/** @param {string} name */ (name) => row.getCell(col[normHeader(name)]))
      let scope = cellToNumber(g('Scope'))
      if (!scope) {
        const st = cellToString(g('Scope'))
        if (st) scope = parseInt(st, 10) || 1
      }
      if (!scope) scope = 1
      equip.push({
        id: `imp_${Date.now()}_${r}_${Math.random().toString(36).slice(2, 7)}`,
        equipment: cellToString(g('Thiết bị')),
        source: cellToString(g('Nguồn phát thải')),
        scope: scope === 2 ? 2 : 1,
        unit: cellToString(g('Đơn vị')),
        volume: cellToNumber(g('Khối lượng')),
        ef: cellToNumber(g('EF (kg CO₂e/đvị)')),
        efRef: cellToString(g('EF Reference')),
        confirmed: true,
      })
    }
  }

  let hasTripSheet = false
  /** @type {unknown[]} */
  const trips = []

  const wsT = workbook.getWorksheet(EXCEL_SHEET.trip)
  if (wsT) {
    hasTripSheet = true
    const hRow = wsT.getRow(1)
    const col = headerIndexMap(hRow, EXCEL_TRIP_HEADERS)
    const lastRow = sheetLastUsedRow(wsT)
    for (let r = 2; r <= lastRow; r++) {
      if (rowIsPlaceholder(wsT, r)) continue
      if (!rowHasAnyValue(wsT, r, col, EXCEL_TRIP_HEADERS)) continue
      const row = wsT.getRow(r)
      const g = (/** @param {string} name */ (name) => row.getCell(col[normHeader(name)]))
      const name = cellToString(g('Họ và tên'))
      const empId = cellToString(g('Mã NV'))
      if (!name && !empId) continue
      const co2Air = cellToNumber(g('CO₂ bay (kg)'))
      const co2Ground = cellToNumber(g('CO₂ mặt đất (kg)'))
      const co2Hotel = cellToNumber(g('CO₂ lưu trú (kg)'))
      let co2Total = cellToNumber(g('Tổng (kg CO₂e)'))
      if (!co2Total && (co2Air || co2Ground || co2Hotel)) co2Total = co2Air + co2Ground + co2Hotel
      trips.push({
        id: `imp_${Date.now()}_${r}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        empId,
        dept: cellToString(g('Phòng ban')),
        trip: cellToString(g('Tên chuyến')),
        purpose: cellToString(g('Mục đích')),
        from: cellToString(g('Điểm xuất phát')),
        to: cellToString(g('Điểm đến')),
        dateFrom: cellToString(g('Ngày đi')),
        dateTo: cellToString(g('Ngày về')),
        proj: '',
        note: '',
        flightLegs: [emptyFlightLeg()],
        groundType: '',
        groundKm: 0,
        fuel: 0,
        hotelLabel: '',
        nights: 0,
        rooms: 1,
        co2Air,
        co2Ground,
        co2Hotel,
        co2Total,
        savedAt: new Date().toISOString(),
      })
    }
  }

  let hasCommuteSheet = false
  /** @type {unknown[]} */
  const commutes = []

  const wsC = workbook.getWorksheet(EXCEL_SHEET.commute)
  if (wsC) {
    hasCommuteSheet = true
    const hRow = wsC.getRow(1)
    const col = headerIndexMap(hRow, EXCEL_COMMUTE_HEADERS)
    const lastRow = sheetLastUsedRow(wsC)
    for (let r = 2; r <= lastRow; r++) {
      if (rowIsPlaceholder(wsC, r)) continue
      if (!rowHasAnyValue(wsC, r, col, EXCEL_COMMUTE_HEADERS)) continue
      const row = wsC.getRow(r)
      const g = (/** @param {string} name */ (name) => row.getCell(col[normHeader(name)]))
      const name = cellToString(g('Họ và tên'))
      const empId = cellToString(g('Mã NV'))
      if (!name && !empId) continue
      const days = cellToNumber(g('Ngày đi làm / tháng'))
      const wfh = cellToNumber(g('WFH (ngày/tháng)'))

      const vehicle = cellToString(g('Phương tiện'))
      const ef = efFromVehicleLabel(vehicle)
      commutes.push({
        id: `imp_${Date.now()}_${r}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        empId,
        dept: cellToString(g('Phòng ban')),
        vehicle,
        ef,
        km: cellToNumber(g('Km một chiều')),
        days,
        months: 1,
        wfh,
        carpool: cellToNumber(g('Carpool (người)')) || 1,
        effectiveDays: Math.max(0, days - wfh),
        co2: cellToNumber(g('CO₂e (kg)')),
        savedAt: new Date().toISOString(),
      })
    }
  }

  return {
    hasOfficeSheet,
    equip,
    hasTripSheet,
    trips,
    hasCommuteSheet,
    commutes,
    overview,
  }
}

/**
 * Ghi đè dữ liệu kỳ hiện tại từ file Excel (giữ các dòng thiết bị nháp chưa ✓).
 * @param {ArrayBuffer} arrayBuffer
 */
export async function importPeriodExcelAndApply(arrayBuffer) {
  const parsed = await parsePeriodExcel(arrayBuffer)
  const currentEquipAll = get(equipRows)
  const drafts = currentEquipAll.filter((r) => r.confirmed === false)
  const currentConfirmedEquip = currentEquipAll.filter((r) => r.confirmed !== false)
  const currentTrips = get(empTrips)
  const currentCommutes = get(commuteList)

  let skippedEquip = 0
  let skippedTrips = 0
  let skippedCommutes = 0

  if (parsed.hasOfficeSheet) {
    const seen = new Set([...drafts, ...currentConfirmedEquip].map(equipSig))
    /** @type {any[]} */
    const uniq = []
    for (const row of /** @type {any[]} */ (parsed.equip)) {
      const sig = equipSig(row)
      if (seen.has(sig)) {
        skippedEquip++
        continue
      }
      seen.add(sig)
      uniq.push(row)
    }
    equipRows.set([...drafts, ...currentConfirmedEquip, ...uniq])
    persistEquip()
  }

  if (parsed.hasTripSheet) {
    const existing = new Set(currentTrips.map(tripSig))
    const seen = new Set()
    /** @type {any[]} */
    const uniq = []
    for (const row of /** @type {any[]} */ (parsed.trips)) {
      const sig = tripSig(row)
      if (existing.has(sig) || seen.has(sig)) {
        skippedTrips++
        continue
      }
      seen.add(sig)
      uniq.push(row)
    }
    empTrips.set([...currentTrips, ...uniq])
    persistEmp()
  }

  if (parsed.hasCommuteSheet) {
    const existing = new Set(currentCommutes.map(commuteSig))
    const seen = new Set()
    /** @type {any[]} */
    const uniq = []
    for (const row of /** @type {any[]} */ (parsed.commutes)) {
      const sig = commuteSig(row)
      if (existing.has(sig) || seen.has(sig)) {
        skippedCommutes++
        continue
      }
      seen.add(sig)
      uniq.push(row)
    }
    commuteList.set([...currentCommutes, ...uniq])
    persistCommute()
  }

  const o = get(offSettings)
  if (parsed.overview.company !== undefined || parsed.overview.location !== undefined) {
    setCompanyLocation(
      parsed.overview.company !== undefined ? parsed.overview.company : (o.company ?? ''),
      parsed.overview.location !== undefined ? parsed.overview.location : (o.location ?? ''),
    )
  }

  return {
    equip: parsed.hasOfficeSheet ? get(equipRows).filter((r) => r.confirmed !== false).length : null,
    trips: parsed.hasTripSheet ? get(empTrips).length : null,
    commutes: parsed.hasCommuteSheet ? get(commuteList).length : null,
    skippedEquip,
    skippedTrips,
    skippedCommutes,
  }
}
