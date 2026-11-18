import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { Icon } from '../components/Icon'
import { useBackendStatus } from '../hooks/useBackendStatus'
import { formatDate } from '../utils/format'

const NAV_ITEMS = [
  { to: '/', label: 'Panel', icon: 'dashboard', end: true },
  { to: '/ordenes', label: 'Órdenes', icon: 'orders' },
  { to: '/clientes', label: 'Clientes', icon: 'clients' },
]

const STATUS_TEXT = {
  online: 'PocketBase conectado',
  offline: 'Sin conexión con PocketBase',
  checking: 'Comprobando conexión…',
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const backendStatus = useBackendStatus()

  useEffect(() => {
    if (!sidebarOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'is-visible' : ''}`.trim()}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`.trim()} aria-label="Navegación principal">
        <div className="sidebar__brand">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="wrench" size={22} />
          </span>
          <span>
            <strong>El Taller</strong>
            <span className="sidebar__brand-subtitle">Reparaciones</span>
          </span>
          <button
            type="button"
            className="icon-button sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="sidebar__section">
          <span className="sidebar__section-label">Operación</span>
          <nav className="sidebar__nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`.trim()}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <NavLink to="/ordenes/nueva" className="sidebar__cta" onClick={() => setSidebarOpen(false)}>
          <Icon name="plus" size={18} />
          Nueva orden
        </NavLink>

        <div className="sidebar__footer">
          <span className={`connection connection--${backendStatus}`}>
            <span className="connection__dot" aria-hidden="true" />
            {STATUS_TEXT[backendStatus]}
          </span>
          <a
            className="sidebar__api-link"
            href="http://127.0.0.1:8090/_/"
            target="_blank"
            rel="noreferrer"
          >
            Abrir administración
            <Icon name="external" size={14} />
          </a>
          <span className="sidebar__date">{formatDate(new Date().toISOString())}</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="mobile-topbar">
          <button
            type="button"
            className="icon-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Icon name="menu" size={22} />
          </button>
          <span className="mobile-topbar__brand">
            <span className="brand-mark brand-mark--sm" aria-hidden="true">
              <Icon name="wrench" size={17} />
            </span>
            El Taller
          </span>
          <NavLink to="/ordenes/nueva" className="icon-button" aria-label="Nueva orden">
            <Icon name="plus" size={20} />
          </NavLink>
        </header>

        <main className="page" id="contenido">
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>El Taller · Gestión de reparaciones</span>
          <span>Trabajo práctico · React + PocketBase</span>
        </footer>
      </div>
    </div>
  )
}
