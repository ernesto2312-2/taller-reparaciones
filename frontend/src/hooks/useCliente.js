import { useCallback, useEffect, useState } from 'react'
import { getCliente } from '../services/clientes'

export function useCliente(id) {
  const [version, setVersion] = useState(0)
  const requestKey = id ? `${id}::${version}` : ''
  const [state, setState] = useState({ key: null, cliente: null, error: null })

  useEffect(() => {
    if (!id) return undefined

    const controller = new AbortController()

    getCliente(id, { signal: controller.signal })
      .then((record) => {
        if (controller.signal.aborted) return
        setState({ key: requestKey, cliente: record, error: null })
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
    cliente: !loading && state.key === requestKey ? state.cliente : null,
    loading,
    error: loading ? null : state.error,
    reload,
  }
}
