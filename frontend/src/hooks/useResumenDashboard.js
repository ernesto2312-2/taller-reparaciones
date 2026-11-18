import { useCallback, useEffect, useState } from 'react'
import { getResumen, listOrdenes } from '../services/ordenes'

export function useResumenDashboard() {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState({
    key: null,
    resumen: null,
    recientes: [],
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      getResumen({ signal: controller.signal }),
      listOrdenes({ perPage: 6, signal: controller.signal }),
    ])
      .then(([summary, latest]) => {
        if (controller.signal.aborted) return
        setState({
          key: version,
          resumen: summary,
          recientes: latest.items,
          error: null,
        })
      })
      .catch((err) => {
        if (err.name === 'AbortError' || controller.signal.aborted) return
        setState((current) => ({ ...current, key: version, error: err }))
      })

    return () => controller.abort()
  }, [version])

  const loading = state.key !== version
  const reload = useCallback(() => setVersion((current) => current + 1), [])

  return {
    resumen: state.resumen,
    recientes: state.recientes,
    loading,
    error: loading ? null : state.error,
    reload,
  }
}
