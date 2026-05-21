import Swal from 'sweetalert2'

const toastMixin = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
})

/** @param {string} msg */
export function toastOk(msg) {
  return toastMixin.fire({ icon: 'success', title: msg })
}

/** @param {string} msg */
export function toastErr(msg) {
  return toastMixin.fire({ icon: 'error', title: msg })
}

/**
 * @param {string} title
 * @param {string} [text]
 * @param {string} [confirmText]
 */
export async function confirmDanger(title, text = '', confirmText = 'Xóa') {
  const r = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#C0392B',
    cancelButtonColor: '#6B6960',
    reverseButtons: true,
  })
  return r.isConfirmed
}

/**
 * @param {string} title
 * @param {string} [text]
 */
export async function confirmAction(title, text = '') {
  const r = await Swal.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Đồng ý',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#1A6B3C',
    cancelButtonColor: '#6B6960',
    reverseButtons: true,
  })
  return r.isConfirmed
}

/**
 * @param {string} title
 * @param {string} html
 */
export function alertInfo(title, html) {
  return Swal.fire({ icon: 'info', title, html, confirmButtonText: 'Đã hiểu' })
}
