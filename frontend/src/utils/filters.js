/** Escapa un valor para usarlo dentro de un filtro de PocketBase. */
export function escapeFilterValue(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
}

/** Construye un filtro OR de búsqueda de texto sobre varios campos. */
export function buildTextFilter(fields, term) {
  const value = String(term ?? '').trim()
  if (!value) return ''
  const escaped = escapeFilterValue(value)
  return `(${fields.map((field) => `${field} ~ "${escaped}"`).join(' || ')})`
}

/** Une condiciones no vacías con el operador AND de PocketBase. */
export function joinFilters(...filters) {
  return filters.filter(Boolean).join(' && ')
}
