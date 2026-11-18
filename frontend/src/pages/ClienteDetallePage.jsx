import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import { Icon } from '../components/Icon'
import { Skeleton, TableSkeleton } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../components/ToastContext'
import { useCliente } from '../hooks/useCliente'
import { useOrdenes } from '../hooks/useOrdenes'
import { deleteCliente } from '../services/clientes'
import {
  formatDate,
  formatMoney,
  initials,
  orderCode,
  telHref,
  tienePresupuesto,
  totalPresupuesto,
} from '../utils/format'

export default function ClienteDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { cliente, loading, error, reload } = useCliente(id)
  const {
    ordenes,
    loading: ordersLoading,
    error: ordersError,
    reload: reloadOrders,
  } = useOrdenes({ cliente: id })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const hasOrders = ordenes.length > 0

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteCliente(id)
      toast.success(`Se eliminó el cliente ${cliente.nombre}.`)
      navigate('/clientes')
    } catch (deleteFailure) {
      setDeleteError(deleteFailure.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="stack">
        <Skeleton className="skeleton--title" />
        <div className="profile-grid">
          <div className="card card--pad">
            <Skeleton className="skeleton--avatar" />
            <Skeleton className="skeleton--line" />
            <Skeleton className="skeleton--line" />
          </div>
          <div className="card">
            <TableSkeleton rows={4} columns={4} />
          </div>
        </div>
      </div>
    )
  }

  if (error || !cliente) {
    return (
      <ErrorState
        error={error}
        onRetry={reload}
        title="No se pudo cargar el cliente"
        notFoundMessage="El cliente solicitado no existe o fue eliminado."
      />
    )
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Ficha del cliente"
        title={cliente.nombre}
        description="Datos de contacto e historial de equipos recibidos."
        backTo="/clientes"
        backLabel="Clientes"
        actions={
          <>
            <Button
              variant="secondary"
              icon="trash"
              onClick={() => {
                setDeleteError('')
                setConfirmOpen(true)
              }}
              disabled={hasOrders || ordersLoading}
              title={
                hasOrders
                  ? 'No se puede eliminar: el cliente tiene órdenes asociadas.'
                  : 'Eliminar cliente'
              }
            >
              Eliminar
            </Button>
            <Button to={`/clientes/${id}/editar`} variant="secondary" icon="edit">
              Editar
            </Button>
            <Button to={`/ordenes/nueva?cliente=${id}`} icon="plus">
              Nueva orden
            </Button>
          </>
        }
      />

      {hasOrders ? (
        <Alert variant="info" title="Este cliente tiene órdenes asociadas">
          Para conservar el historial no se puede eliminar. Puede editar sus datos de contacto en
          cualquier momento.
        </Alert>
      ) : null}

      <div className="profile-grid">
        <section className="card profile-card">
          <div className="profile-card__head">
            <span className="avatar avatar--lg" aria-hidden="true">
              {initials(cliente.nombre)}
            </span>
            <div>
              <h2 className="profile-card__name">{cliente.nombre}</h2>
              <span className="muted">Cliente desde {formatDate(cliente.created)}</span>
            </div>
          </div>

          <dl className="detail-list">
            <div className="detail-list__row">
              <dt>
                <Icon name="phone" size={16} /> Teléfono
              </dt>
              <dd>
                {cliente.telefono ? (
                  <a className="inline-link" href={telHref(cliente.telefono)}>
                    {cliente.telefono}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="detail-list__row">
              <dt>
                <Icon name="map-pin" size={16} /> Dirección
              </dt>
              <dd>{cliente.direccion || '—'}</dd>
            </div>
            <div className="detail-list__row">
              <dt>
                <Icon name="orders" size={16} /> Órdenes
              </dt>
              <dd>{ordersLoading ? '…' : ordenes.length}</dd>
            </div>
            <div className="detail-list__row">
              <dt>
                <Icon name="grid" size={16} /> Identificador
              </dt>
              <dd>
                <code className="code">{cliente.id}</code>
              </dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <header className="card__header">
            <div>
              <h2 className="card__title">Órdenes del cliente</h2>
              <p className="card__subtitle">Equipos recibidos y su etapa actual.</p>
            </div>
            <Link className="text-link" to={`/ordenes/nueva?cliente=${id}`}>
              Nueva orden
              <Icon name="plus" size={16} />
            </Link>
          </header>

          {ordersLoading ? (
            <TableSkeleton rows={3} columns={4} />
          ) : ordersError ? (
            <div className="card__body">
              <ErrorState
                error={ordersError}
                onRetry={reloadOrders}
                title="No se pudieron cargar las órdenes"
              />
            </div>
          ) : ordenes.length === 0 ? (
            <EmptyState
              icon="orders"
              title="Sin órdenes registradas"
              description="Cuando este cliente deje un equipo, cree la primera orden."
              action={
                <Button to={`/ordenes/nueva?cliente=${id}`} icon="plus">
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
                    <th scope="col">Equipo</th>
                    <th scope="col">Etapa</th>
                    <th scope="col" className="align-right">
                      Presupuesto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map((orden) => (
                    <tr key={orden.id}>
                      <td>
                        <Link className="table-link" to={`/ordenes/${orden.id}`}>
                          {orderCode(orden.id)}
                        </Link>
                        <span className="table-subtext">{formatDate(orden.created)}</span>
                      </td>
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
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar cliente"
        description={`¿Confirma que desea eliminar a ${cliente.nombre}?`}
        confirmLabel="Eliminar cliente"
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) {
            setConfirmOpen(false)
            setDeleteError('')
          }
        }}
        loading={deleting}
      >
        {deleteError ? (
          <Alert variant="error" title="No se puede eliminar">
            {deleteError}
          </Alert>
        ) : (
          <p>Esta acción elimina la ficha del cliente. No se puede deshacer.</p>
        )}
      </ConfirmDialog>
    </div>
  )
}
