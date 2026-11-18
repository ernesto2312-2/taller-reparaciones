import { useCallback, useEffect, useState } from 'react'
import { listClientes } from '../services/clientes'

export function useClientes(search = '') {
  const [version, setVersion] = useState(0)
  const requestKey = `${search}::${version}`
  const [state, setState] = useState({
    key: null,
    clientes: [],
    totalItems: 0,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    listClientes({ search, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        setState({
          key: requestKey,
          clientes: result.items,
          totalItems: result.totalItems,
          error: null,
        })
      })
      .catch((err) => {
        if (err.name === 'AbortError' || controller.signal.aborted) return
        setState((current) => ({ ...current, key: requestKey, error: err }))
      })

    return () => controller.abort()
  }, [search, requestKey])

  const loading = state.key !== requestKey
  const reload = useCallback(() => setVersion((current) => current + 1), [])

  return {
    clientes: state.clientes,
    totalItems: state.totalItems,
    loading,
    error: loading ? null : state.error,
    reload,
  }
}
