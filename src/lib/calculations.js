import { CABIN_OPTIONS, EMP_GROUND } from './constants.js'

/**
 * @param {Array<{ km?: number, legs?: number, cabin?: number }>} legs
 */
export function calcFlightLegsCO2(legs) {
  let airCO2 = 0
  for (const l of legs || []) {
    airCO2 += Number(l.km || 0) * Number(l.legs || 1) * Number(l.cabin ?? 0.133)
  }
  return Math.round(airCO2 * 10) / 10
}

/**
 * @param {Array<{ type?: string, km?: number, ef?: number, liters?: number, count?: number, groundEF?: number }>} segments
 */
export function calcOtherTransportsCO2(segments) {
  let total = 0
  for (const s of segments || []) {
    const n = Math.max(1, Number(s.count) || 1)
    const t = s.type || 'ground'
    if (t === 'fuel') {
      total += Number(s.liters || 0) * 2.31 * n
    } else if (t === 'grab') {
      total += Number(s.km || 0) * 0.192 * n
    } else if (t === 'ground' || t === 'car') {
      const ef = Number(s.ef ?? s.groundEF ?? 0.192)
      if (Number(s.liters || 0) > 0) total += Number(s.liters) * 2.31 * n
      else total += Number(s.km || 0) * ef * n
    } else if (t === 'train') {
      total += Number(s.km || 0) * 0.041 * n
    }
  }
  return Math.round(total * 10) / 10
}

/**
 * @param {Array<{ km?: number, legs?: number, cabin?: number }>} legs
 * @param {Array<Record<string, unknown>>} otherTransports
 * @param {number} hotelEF
 * @param {number} nights
 * @param {number} rooms
 */
export function calcEmployeeTrip(legs, otherTransports, hotelEF, nights, rooms) {
  const airCO2 = calcFlightLegsCO2(legs)
  const groundCO2 = calcOtherTransportsCO2(otherTransports)
  const hotelCO2 = Math.round(nights * rooms * hotelEF * 10) / 10
  const total = Math.round((airCO2 + groundCO2 + hotelCO2) * 10) / 10
  return { airCO2, groundCO2, hotelCO2, total }
}

/** Gộp dữ liệu cũ (1 xe + lít) thành mảng phương tiện */
export function migrateTripTransports(trip) {
  if (trip.otherTransports?.length) return trip.otherTransports
  const out = []
  const fuel = Number(trip.fuel || 0)
  const km = Number(trip.groundKm || 0)
  if (fuel > 0) {
    out.push({
      id: `fuel-${trip.id}`,
      type: 'fuel',
      liters: fuel,
      count: 1,
      note: trip.groundType ? String(trip.groundType) : 'Đổ xăng',
    })
  } else if (km > 0) {
    const g = EMP_GROUND.find((x) => String(trip.groundType || '').includes(x.label.split(' (')[0]))
    out.push({
      id: `ground-${trip.id}`,
      type: 'ground',
      km,
      ef: g?.value ?? 0.192,
      count: 1,
      note: trip.groundType || 'Xe mặt đất',
    })
  }
  return out
}

export function defaultCabinLabel(ef) {
  const o = CABIN_OPTIONS.find((c) => c.value === ef)
  return o?.label ?? 'Economy'
}

/** @returns {{ id: string, type: string, km: number, ef: number, liters: number, count: number, note: string }} */
export function newTransportSegment() {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: 'fuel',
    km: 0,
    ef: 0.192,
    liters: 0,
    count: 1,
    note: '',
  }
}

/**
 * @param {number} ef
 * @param {number} km
 * @param {number} days
 * @param {number} months
 * @param {number} wfh
 * @param {number} carpool
 */
export function calcCommute(ef, km, days, months, wfh, carpool) {
  const effectiveDays = Math.max(0, days - wfh)
  const total = (km * 2 * effectiveDays * months * ef) / carpool
  return Math.round(total * 10) / 10
}
