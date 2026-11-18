import { useCallback, useEffect, useState } from 'react'
import { getOrden } from '../services/ordenes'

export function useOrden(id) {
  const [version, setVersion] = useState(0)
  const requestKey = id ? `${id}::${version}` : ''
  const [state, setState] = useState({ key: null, orden: null, error: null })

  useEffect(() => {
    if (!id) return undefined

    const controller = new AbortController()

    getOrden(id, { signal: controller.signal })
      .then((record) => {
        if (controller.signal.aborted) return
        setState({ key: requestKey, orden: record, error: null })
      })
      .catch((err) => {
        if (err.name === 'AbortError' || controller.signal.aborted) return
        setState((current) => ({ ...current, key: requestKey, error: err }))
      })

    return () => controller.abort()
  }, [id, requestKey])

  const loading = Boolean(id) && state.key !== requestKey
  const reload = useCallback(() => setVersion((current) => current + 1), [])

  return {
    orden: !loading && state.key === requestKey ? state.orden : null,
    loading,
    error: loading ? null : state.error,
    reload,
  }
}
