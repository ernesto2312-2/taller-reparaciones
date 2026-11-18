const dateFormatterShort = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateFormatterLong = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const moneyFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function parsePocketBaseDate(value) {
  if (!value) return null
  const normalized = String(value).replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value, { time = false, empty = '—' } = {}) {
  const date = parsePocketBaseDate(value)
  if (!date) return empty
  return (time ? dateFormatterLong : dateFormatterShort).format(date)
}

export function formatDateTime(value, { empty = '—' } = {}) {
  return formatDate(value, { time: true, empty })
}

export function formatNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return moneyFormatter.format(number)
}

export function formatMoney(value) {
  return `${formatNumber(value)}`
}

export function orderCode(id) {
  if (!id) return 'ORD-—'
  return `ORD-${String(id).slice(-6).toUpperCase()}`
}

export function initials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
  if (parts.length === 0) return '?'
  return parts.map((part) => part[0].toUpperCase()).join('')
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function truncate(text, max = 80) {
  const value = String(text ?? '').trim()
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export function telHref(telefono) {
  const clean = String(telefono ?? '').replace(/[^\d+]/g, '')
  return clean ? `tel:${clean}` : ''
}

export function piezasDeOrden(orden) {
  return Array.isArray(orden?.piezas) ? orden.piezas : []
}

export function totalPresupuesto(orden) {
  const manoObra = Number(orden?.manoObra)
  const base = Number.isFinite(manoObra) && manoObra > 0 ? manoObra : 0
  const totalPiezas = piezasDeOrden(orden).reduce((total, pieza) => {
    const cantidad = Number(pieza?.cantidad)
    const precio = Number(pieza?.precio)
    if (!Number.isFinite(cantidad) || !Number.isFinite(precio)) return total
    return total + cantidad * precio
  }, 0)
  return Math.round((base + totalPiezas) * 100) / 100
}

export function tienePresupuesto(orden) {
  if (!orden) return false
  const diagnostico = String(orden.diagnostico ?? '').trim()
  const manoObra = Number(orden.manoObra)
  return Boolean(diagnostico) || piezasDeOrden(orden).length > 0 || (Number.isFinite(manoObra) && manoObra > 0)
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
