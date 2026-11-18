import { Link } from 'react-router'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import { Icon } from '../components/Icon'
import { StatsSkeleton, TableSkeleton } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import StatusDistribution from '../components/StatusDistribution'
import { useResumenDashboard } from '../hooks/useResumenDashboard'
import {
  formatDate,
  formatMoney,
  orderCode,
  tienePresupuesto,
  totalPresupuesto,
} from '../utils/format'

export default function DashboardPage() {
  const { resumen, recientes, loading, error, reload } = useResumenDashboard()

  const counts = resumen?.porEstado ?? {}
  const pendientes =
    (counts.solicitada ?? 0) + (counts.en_diagnostico ?? 0) + (counts.presupuestada ?? 0)
  const enCurso = (counts.aprobada ?? 0) + (counts.en_reparacion ?? 0)
  const listas = counts.lista ?? 0
  const entregadas = counts.entregada ?? 0

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Resumen general"
        title="Panel del taller"
        description={`Estado del trabajo al ${formatDate(new Date().toISOString())}. Todo lo que necesita saber para arrancar el día.`}
        actions={
          <>
            <Button to="/clientes/nuevo" variant="secondary" icon="user">
              Nuevo cliente
            </Button>
            <Button to="/ordenes/nueva" icon="plus">
              Nueva orden
            </Button>
          </>
        }
      />

      {loading ? (
        <StatsSkeleton count={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <div className="stats-grid">
          <StatCard
            label="Órdenes totales"
            value={resumen?.totalOrdenes ?? 0}
            icon="orders"
            tone="brand"
            hint="Todas las etapas"
            to="/ordenes"
          />
          <StatCard
            label="Pendientes"
            value={pendientes}
            icon="clock"
            tone="amber"
            hint="Solicitadas, diagnóstico o presupuesto"
            to="/ordenes?estado=solicitada"
          />
          <StatCard
            label="En reparación"
            value={enCurso}
            icon="wrench"
            tone="orange"
            hint="Aprobadas o en taller"
            to="/ordenes?estado=en_reparacion"
          />
          <StatCard
            label="Listas para entregar"
            value={listas}
            icon="check-circle"
            tone="teal"
            hint="Esperando al cliente"
            to="/ordenes?estado=lista"
          />
          <StatCard
            label="Clientes"
            value={resumen?.totalClientes ?? 0}
            icon="clients"
            tone="blue"
            hint="Registrados en el taller"
            to="/clientes"
          />
          <StatCard
            label="Presupuesto registrado"
            value={formatMoney(resumen?.totalPresupuestado ?? 0)}
            icon="money"
            tone="green"
            hint={`${resumen?.ordenesPresupuestadas ?? 0} órdenes con presupuesto`}
          />
        </div>
      )}

      {error ? null : (
        <div className="dashboard-grid">
          <section className="card dashboard-recent">
          <header className="card__header">
            <div>
              <h2 className="card__title">Últimas órdenes</h2>
              <p className="card__subtitle">Las más recientes, sin importar la etapa.</p>
            </div>
            <Link to="/ordenes" className="text-link">
              Ver todas
              <Icon name="arrow-right" size={16} />
            </Link>
          </header>

          {loading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : recientes.length === 0 ? (
            <EmptyState
              icon="orders"
              title="Todavía no hay órdenes"
              description="Registre la primera orden cuando llegue un equipo al taller."
              action={
                <Button to="/ordenes/nueva" icon="plus">
                  Crear orden
                </Button>
              }
              compact
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Orden</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Equipo</th>
                    <th scope="col">Etapa</th>
                    <th scope="col" className="align-right">
                      Presupuesto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.map((orden) => (
                    <tr key={orden.id}>
                      <td>
                        <Link className="table-link" to={`/ordenes/${orden.id}`}>
                          {orderCode(orden.id)}
                        </Link>
                        <span className="table-subtext">{formatDate(orden.created)}</span>
                      </td>
                      <td>{orden.expand?.cliente?.nombre || 'Cliente eliminado'}</td>
                      <td>
                        <span className="cell-strong">{orden.equipo}</span>
                        <span className="table-subtext table-subtext--clamp">{orden.problema}</span>
                      </td>
                      <td>
                        <StatusBadge estado={orden.estado} size="sm" />
                      </td>
                      <td className="align-right">
                        {tienePresupuesto(orden) ? (
                          <span className="cell-strong">{formatMoney(totalPresupuesto(orden))}</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="dashboard-side">
          <section className="card">
            <header className="card__header">
              <div>
                <h2 className="card__title">Distribución por etapa</h2>
                <p className="card__subtitle">
                  {resumen?.totalOrdenes ?? 0} órdenes registradas en total.
                </p>
              </div>
            </header>
            <div className="card__body">
              <StatusDistribution
                porEstado={resumen?.porEstado ?? {}}
                total={resumen?.totalOrdenes ?? 0}
              />
            </div>
          </section>

          <section className="card">
            <header className="card__header">
              <div>
                <h2 className="card__title">Atajos</h2>
                <p className="card__subtitle">Acciones frecuentes del mostrador.</p>
              </div>
            </header>
            <div className="card__body">
              <nav className="quick-links">
                <Link to="/ordenes/nueva" className="quick-link">
                  <span className="quick-link__icon quick-link__icon--brand">
                    <Icon name="plus" size={18} />
                  </span>
                  <span>
                    <strong>Recibir equipo</strong>
                    <span>Crear una orden nueva</span>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </Link>
                <Link to="/clientes/nuevo" className="quick-link">
                  <span className="quick-link__icon quick-link__icon--blue">
                    <Icon name="user" size={18} />
                  </span>
                  <span>
                    <strong>Registrar cliente</strong>
                    <span>Nombre y teléfono de contacto</span>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </Link>
                <Link to="/ordenes?estado=lista" className="quick-link">
                  <span className="quick-link__icon quick-link__icon--teal">
                    <Icon name="check-circle" size={18} />
                  </span>
                  <span>
                    <strong>Entregar equipos</strong>
                    <span>{listas} listas, {entregadas} entregadas</span>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </Link>
              </nav>
            </div>
          </section>
        </aside>
        </div>
      )}
    </div>
  )
}
