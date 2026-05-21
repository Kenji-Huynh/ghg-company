import { CABIN_OPTIONS } from './constants.js'

/**
 * @param {Array<{ km?: number, legs?: number, cabin?: number }>} legs
 * @param {number} groundEF
 * @param {number} groundKm
 * @param {number} fuelLiters
 * @param {number} hotelEF kg per night
 * @param {number} nights
 * @param {number} rooms
 */
export function calcEmployeeTrip(legs, groundEF, groundKm, fuelLiters, hotelEF, nights, rooms) {
  let airCO2 = 0
  for (const l of legs) {
    airCO2 += Number(l.km || 0) * Number(l.legs || 1) * Number(l.cabin ?? 0.133)
  }
  const groundCO2 = fuelLiters > 0 ? fuelLiters * 2.31 : groundKm * groundEF
  const hotelCO2 = nights * rooms * hotelEF
  const total = airCO2 + groundCO2 + hotelCO2
  return {
    airCO2: Math.round(airCO2 * 10) / 10,
    groundCO2: Math.round(groundCO2 * 10) / 10,
    hotelCO2: Math.round(hotelCO2 * 10) / 10,
    total: Math.round(total * 10) / 10,
  }
}

export function defaultCabinLabel(ef) {
  const o = CABIN_OPTIONS.find((c) => c.value === ef)
  return o?.label ?? 'Economy'
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
