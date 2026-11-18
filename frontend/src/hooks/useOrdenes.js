import { useCallback, useEffect, useState } from 'react'
import { listOrdenes } from '../services/ordenes'

export function useOrdenes({ estado = '', search = '', cliente = '', perPage = 100 } = {}) {
  const [version, setVersion] = useState(0)
  const requestKey = [estado, search, cliente, perPage, version].join('::')
  const [state, setState] = useState({
    key: null,
    ordenes: [],
    totalItems: 0,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    listOrdenes({ estado, search, cliente, perPage, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        setState({
          key: requestKey,
          ordenes: result.items,
          totalItems: result.totalItems,
          error: null,
        })
      })
      .catch((err) => {
        if (err.name === 'AbortError' || controller.signal.aborted) return
        setState((current) => ({ ...current, key: requestKey, error: err }))
      })

    return () => controller.abort()
  }, [estado, search, cliente, perPage, requestKey])

  const loading = state.key !== requestKey
  const reload = useCallback(() => setVersion((current) => current + 1), [])

  return {
    ordenes: state.ordenes,
    totalItems: state.totalItems,
    loading,
    error: loading ? null : state.error,
    reload,
  }
}
