/** Danh sách công ty trong tập đoàn */
export const COMPANIES = [
  'ECS',
  'LEONG LEE',
  'MLOG',
  'SPEC HUB',
  'SUNNY AUTO',
  'TREE MARINE',
]

/** Giá trị filter = tất cả công ty */
export const ALL_COMPANIES = ''

/** @param {string | undefined} recordCompany @param {string} filter */
export function matchesCompany(recordCompany, filter) {
  if (!filter) return true
  return String(recordCompany || '').trim() === filter
}
