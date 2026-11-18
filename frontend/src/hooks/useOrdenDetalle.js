import { useCallback, useEffect, useState } from 'react'
import { getOrden } from '../services/ordenes'
import { listEventosByOrden } from '../services/eventos'

/**
 * Carga en paralelo la orden y su historial. Un único reload permite
 * refrescar ambos después de una transición de etapa.
 */
export function useOrdenDetalle(id) {
  const [version, setVersion] = useState(0)
  const requestKey = id ? `${id}::${version}` : ''
  const [state, setState] = useState({
    key: null,
    orden: null,
    eventos: [],
    error: null,
  })

  useEffect(() => {
    if (!id) return undefined

    const controller = new AbortController()

    Promise.all([
      getOrden(id, { signal: controller.signal }),
      listEventosByOrden(id, { signal: controller.signal }),
    ])
      .then(([record, history]) => {
        if (controller.signal.aborted) return
        setState({ key: requestKey, orden: record, eventos: history, error: null })
      })
      .catch((err) => {
        if (err.name === 'AbortError' || controller.signal.aborted) return
        setState((current) => ({ ...current, key: requestKey, error: err }))
      })

    return () => controller.abort()
  }, [id, requestKey])

  const loading = Boolean(id) && state.key !== requestKey
  const current = !loading && state.key === requestKey

  const reload = useCallback(() => setVersion((currentVersion) => currentVersion + 1), [])

  return {
    orden: current ? state.orden : null,
    eventos: current ? state.eventos : [],
    loading,
    error: loading ? null : state.error,
    reload,
  }
}
