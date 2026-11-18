import { listRecords } from './pocketbase'

export async function listEventosByOrden(ordenId, { signal } = {}) {
  const result = await listRecords('eventos', {
    filter: `orden = "${ordenId}"`,
    sort: 'created',
    perPage: 200,
    signal,
  })

  return result?.items ?? []
}
