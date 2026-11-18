import { request } from './api'

export const COLLECTIONS = {
  clientes: 'clientes',
  ordenes: 'ordenes',
  eventos: 'eventos',
}

function recordsPath(collection) {
  return `/api/collections/${collection}/records`
}

/**
 * Listado genérico de registros de PocketBase.
 * Devuelve también la metadata de paginación de la API.
 */
export async function listRecords(
  collection,
  { filter, sort, expand, fields, page = 1, perPage = 50, skipTotal, signal } = {},
) {
  return request(recordsPath(collection), {
    query: {
      filter,
      sort,
      expand,
      fields,
      page,
      perPage,
      skipTotal: skipTotal ? 1 : undefined,
    },
    signal,
  })
}

export async function getRecord(collection, id, { expand, signal } = {}) {
  return request(`${recordsPath(collection)}/${encodeURIComponent(id)}`, {
    query: { expand },
    signal,
  })
}

export async function createRecord(collection, data, { signal } = {}) {
  return request(recordsPath(collection), { method: 'POST', body: data, signal })
}

export async function updateRecord(collection, id, data, { signal } = {}) {
  return request(`${recordsPath(collection)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: data,
    signal,
  })
}

export async function deleteRecord(collection, id, { signal } = {}) {
  return request(`${recordsPath(collection)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    signal,
  })
}

export async function countRecords(collection, filter) {
  const result = await listRecords(collection, { filter, perPage: 1, fields: 'id' })
  return result?.totalItems ?? 0
}

export async function checkHealth({ signal } = {}) {
  return request('/api/health', { signal })
}
