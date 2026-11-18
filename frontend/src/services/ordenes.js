import { POCKETBASE_URL, request } from './api'
import { createRecord, getRecord, listRecords, updateRecord } from './pocketbase'
import { buildTextFilter, joinFilters } from '../utils/filters'

export async function listOrdenes({
  estado = '',
  search = '',
  cliente = '',
  page = 1,
  perPage = 100,
  expand = 'cliente',
  signal,
} = {}) {
  const filter = joinFilters(
    estado ? `estado = "${estado}"` : '',
    cliente ? `cliente = "${cliente}"` : '',
    buildTextFilter(['equipo', 'problema', 'cliente.nombre'], search),
  )

  const result = await listRecords('ordenes', {
    filter,
    sort: '-created',
    expand,
    page,
    perPage,
    signal,
  })

  return {
    items: result?.items ?? [],
    totalItems: result?.totalItems ?? 0,
    totalPages: result?.totalPages ?? 0,
  }
}

export async function getOrden(id, { expand = 'cliente', signal } = {}) {
  return getRecord('ordenes', id, { expand, signal })
}

function appendCommonFields(formData, { cliente, equipo, problema }) {
  formData.append('cliente', cliente)
  formData.append('equipo', equipo)
  formData.append('problema', problema)
}

export async function createOrden(values, { files = [], signal } = {}) {
  const formData = new FormData()
  appendCommonFields(formData, values)
  files.forEach((file) => formData.append('fotos', file, file.name))

  return createRecord('ordenes', formData, { signal })
}

export async function updateOrden(id, values, { files = [], removeFiles = [], signal } = {}) {
  const formData = new FormData()
  appendCommonFields(formData, values)
  files.forEach((file) => formData.append('fotos', file, file.name))
  removeFiles.forEach((filename) => formData.append('fotos-', filename))

  return updateRecord('ordenes', id, formData, { signal })
}

/**
 * Cambio de etapa con reglas de negocio en el servidor. Es la única vía para
 * modificar `estado`; un PATCH directo es rechazado por los hooks.
 */
export async function transicionarOrden(id, { estado, diagnostico, manoObra, piezas }, { signal } = {}) {
  return request(`/api/taller/ordenes/${encodeURIComponent(id)}/transicion`, {
    method: 'POST',
    body: { estado, diagnostico, manoObra, piezas },
    signal,
  })
}

export async function getResumen({ signal } = {}) {
  return request('/api/taller/resumen', { signal })
}

export function getFotoUrl(ordenId, filename, { thumb } = {}) {
  const url = `${POCKETBASE_URL}/api/files/ordenes/${encodeURIComponent(ordenId)}/${encodeURIComponent(filename)}`
  return thumb ? `${url}?thumb=${encodeURIComponent(thumb)}` : url
}
