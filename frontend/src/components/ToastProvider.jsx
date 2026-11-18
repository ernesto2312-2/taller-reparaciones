import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icon'
import { ToastContext } from './ToastContext'

const ICONS = {
  success: 'check-circle',
  error: 'alert',
  info: 'info',
}

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, { type = 'success', title, duration = 4500 } = {}) => {
      const id = ++nextId
      setToasts((current) => [...current, { id, message, type, title }])
      const timer = setTimeout(() => remove(id), duration)
      timers.current.set(id, timer)
      return id
    },
    [remove],
  )

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const value = useMemo(
    () => ({
      push,
      remove,
      success: (message, options) => push(message, { ...options, type: 'success' }),
      error: (message, options) => push(message, { ...options, type: 'error' }),
      info: (message, options) => push(message, { ...options, type: 'info' }),
    }),
    [push, remove],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className={`toast toast--${toast.type}`} key={toast.id} role="status">
            <span className="toast__icon" aria-hidden="true">
              <Icon name={ICONS[toast.type] || ICONS.info} size={20} />
            </span>
            <div className="toast__content">
              {toast.title ? <p className="toast__title">{toast.title}</p> : null}
              <p className="toast__message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="toast__close"
              onClick={() => remove(toast.id)}
              aria-label="Cerrar notificación"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
