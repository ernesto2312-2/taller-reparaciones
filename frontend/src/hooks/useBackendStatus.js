import { useEffect, useState } from 'react'
import { checkHealth } from '../services/pocketbase'

/**
 * Comprueba la conexión con PocketBase al montar y cada minuto.
 * El problema real de una caída del backend es el aviso al usuario, no la
 * petición puntual: por eso el intervalo y la limpieza son explícitos.
 */
export function useBackendStatus() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true
    let controller = new AbortController()

    const check = async () => {
      controller.abort()
      controller = new AbortController()

      try {
        await checkHealth({ signal: controller.signal })
        if (active) setStatus('online')
      } catch (error) {
        if (error.name !== 'AbortError' && active) setStatus('offline')
      }
    }

    check()
    const interval = setInterval(check, 60_000)

    return () => {
      active = false
      controller.abort()
      clearInterval(interval)
    }
  }, [])

  return status
}
