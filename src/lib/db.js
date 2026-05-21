/** @param {string} k */
export function load(k) {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null')
  } catch {
    return null
  }
}

/** @param {string} k @param {unknown} v */
export function save(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* ignore quota */
  }
}

export function keys() {
  try {
    return Object.keys(localStorage)
  } catch {
    return []
  }
}
