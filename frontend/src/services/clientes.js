import { createRecord, deleteRecord, getRecord, listRecords, updateRecord } from './pocketbase'
import { buildTextFilter } from '../utils/filters'

export async function listClientes({ search = '', perPage = 200, signal } = {}) {
  const result = await listRecords('clientes', {
    filter: buildTextFilter(['nombre', 'telefono', 'direccion'], search),
    sort: 'nombre',
    perPage,
    signal,
  })

  return {
    items: result?.items ?? [],
    totalItems: result?.totalItems ?? 0,
  }
}

export async function getCliente(id, { signal } = {}) {
  return getRecord('clientes', id, { signal })
}

export async function createCliente(data, { signal } = {}) {
  return createRecord('clientes', data, { signal })
}

export async function updateCliente(id, data, { signal } = {}) {
  return updateRecord('clientes', id, data, { signal })
}

export async function deleteCliente(id, { signal } = {}) {
  return deleteRecord('clientes', id, { signal })
}
