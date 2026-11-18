import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
}) {
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusPanel = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector(FOCUSABLE)
      focusable?.focus()
    }, 0)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && dismissible) {
        event.preventDefault()
        closeRef.current?.()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusables = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      )
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(focusPanel)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [open, dismissible])

  if (!open) return null

  return createPortal(
    <div className="modal">
      <div
        className="modal__backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && dismissible) onClose?.()
        }}
      />
      <div
        className={`modal__panel modal__panel--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
      >
        <div className="modal__header">
          <div>
            <h2 className="modal__title" id={titleId}>
              {title}
            </h2>
            {description ? <p className="modal__description">{description}</p> : null}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={!dismissible}
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
