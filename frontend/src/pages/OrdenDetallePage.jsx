import { useState } from 'react'
import { Link, useParams } from 'react-router'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ChangeStatusDialog from '../components/ChangeStatusDialog'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import { Icon } from '../components/Icon'
import { Skeleton } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import PhotoGallery from '../components/PhotoGallery'
import ProgressFlow from '../components/ProgressFlow'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../components/ToastContext'
import { useOrdenDetalle } from '../hooks/useOrdenDetalle'
import { transicionarOrden } from '../services/ordenes'
import {
  ESTADO_LABELS,
  ESTADO_TONOS,
  esEstadoFinal,
  transicionesPermitidas,
} from '../utils/estados'
import {
  formatDate,
  formatDateTime,
  formatMoney,
  initials,
  orderCode,
  piezasDeOrden,
  telHref,
  tienePresupuesto,
  totalPresupuesto,
} from '../utils/format'

export default function OrdenDetallePage() {
  const { id } = useParams()
  const toast = useToast()
  const { orden, eventos, loading, error, reload } = useOrdenDetalle(id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [transitionLoading, setTransitionLoading] = useState(false)
  const [transitionError, setTransitionError] = useState('')

  const handleTransition = async (payload) => {
    setTransitionLoading(true)
    setTransitionError('')

    try {
      await transicionarOrden(id, payload)
      toast.success(`La orden pasó a “${ESTADO_LABELS[payload.estado]}”.`)
      setDialogOpen(false)
      await reload()
    } catch (transitionFailure) {
      setTransitionError(transitionFailure.message)
    } finally {
      setTransitionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="stack">
        <Skeleton className="skeleton--title" />
        <Skeleton className="skeleton--block" />
        <div className="detail-grid">
          <div className="stack">
            <div className="card card--pad">
              <Skeleton className="skeleton--line" />
              <Skeleton className="skeleton--line" />
              <Skeleton className="skeleton--block" />
            </div>
            <div className="card card--pad">
              <Skeleton className="skeleton--line" />
              <Skeleton className="skeleton--block" />
            </div>
          </div>
          <div className="stack">
            <div className="card card--pad">
              <Skeleton className="skeleton--avatar" />
              <Skeleton className="skeleton--line" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !orden) {
    return (
      <ErrorState
        error={error}
        onRetry={reload}
        title="No se pudo cargar la orden"
        notFoundMessage="La orden solicitada no existe o fue eliminada."
      />
    )
  }

  const options = transicionesPermitidas(orden.estado)
  const isFinal = esEstadoFinal(orden.estado)
  const piezas = piezasDeOrden(orden)
  const total = totalPresupuesto(orden)
  const fotos = orden.fotos ?? []
  const cliente = orden.expand?.cliente
  const presupuestada = tienePresupuesto(orden)

  const history = [
    {
      key: 'creation',
      created: orden.created,
      de: null,
      a: 'solicitada',
      synthetic: true,
    },
    ...eventos.map((evento) => ({
      key: evento.id,
      created: evento.created,
      de: evento.de,
      a: evento.a,
      synthetic: false,
    })),
  ]

  const openDialog = () => {
    setTransitionError('')
    setDialogOpen(true)
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow={`Orden de reparación · ${formatDate(orden.created)}`}
        title={orderCode(orden.id)}
        description={orden.equipo}
        backTo="/ordenes"
        backLabel="Órdenes"
        actions={
          <>
            <StatusBadge estado={orden.estado} />
            {!isFinal ? (
              <Button to={`/ordenes/${id}/editar`} variant="secondary" icon="edit">
                Editar
              </Button>
            ) : null}
            {options.length > 0 ? (
              <Button icon="arrow-right" onClick={openDialog}>
                Cambiar etapa
              </Button>
            ) : null}
          </>
        }
      />

      {isFinal ? (
        <Alert
          variant={orden.estado === 'entregada' ? 'success' : 'warning'}
          title={`La orden está cerrada: ${ESTADO_LABELS[orden.estado]}`}
        >
          {orden.estado === 'entregada'
            ? 'El equipo fue entregado al cliente. No se permiten más ediciones ni cambios de etapa.'
            : 'No se permiten más ediciones ni cambios de etapa. El historial se conserva para consulta.'}
        </Alert>
      ) : (
        <Alert variant="info" title={`Siguiente paso posible`}>
          {options
            .map((option) => ESTADO_LABELS[option])
            .join(' o ')}
          {'. '}
          Use “Cambiar etapa” para registrar la transición; el servidor valida el flujo completo.
        </Alert>
      )}

      <section className="card flow-card">
        <ProgressFlow estado={orden.estado} />
      </section>

      <div className="detail-grid">
        <div className="stack">
          <section className="card">
            <header className="card__header">
              <div>
                <h2 className="card__title">Equipo y problema</h2>
                <p className="card__subtitle">Datos registrados al recibir el equipo.</p>
              </div>
            </header>
            <div className="card__body">
              <dl className="info-grid">
                <div>
                  <dt>Equipo</dt>
                  <dd>{orden.equipo}</dd>
                </div>
                <div>
                  <dt>Recibida</dt>
                  <dd>{formatDate(orden.created)}</dd>
                </div>
                <div>
                  <dt>Última actualización</dt>
                  <dd>{formatDateTime(orden.updated)}</dd>
                </div>
                <div className="info-grid__full">
                  <dt>Problema reportado</dt>
                  <dd className="pre-line">{orden.problema}</dd>
                </div>
              </dl>

              <div className="form-divider" />

              <div className="section-heading">
                <h3>
                  <Icon name="image" size={18} /> Fotos del equipo
                </h3>
                <span className="muted">
                  {fotos.length} de 3
                </span>
              </div>
              <PhotoGallery ordenId={orden.id} fotos={fotos} />
            </div>
          </section>

          <section className="card">
            <header className="card__header">
              <div>
                <h2 className="card__title">Presupuesto</h2>
                <p className="card__subtitle">
                  Se registra una sola vez al pasar a presupuestada y queda bloqueado.
                </p>
              </div>
              {presupuestada ? (
                <span className="locked-pill">
                  <Icon name="lock" size={14} />
                  Registrado
                </span>
              ) : null}
            </header>

            <div className="card__body">
              {!presupuestada ? (
                <EmptyState
                  icon="money"
                  title="Presupuesto pendiente"
                  description={
                    orden.estado === 'solicitada'
                      ? 'Inicie el diagnóstico para poder preparar el presupuesto.'
                      : 'Al cambiar a presupuestada se registran el diagnóstico, la mano de obra y las piezas.'
                  }
                  compact
                />
              ) : (
                <div className="budget-detail">
                  <div className="budget-diagnostico">
                    <h3>Diagnóstico técnico</h3>
                    <p className="pre-line">{orden.diagnostico || 'Sin diagnóstico registrado.'}</p>
                  </div>

                  {piezas.length > 0 ? (
                    <div className="table-wrap">
                      <table className="data-table budget-table">
                        <thead>
                          <tr>
                            <th scope="col">Pieza</th>
                            <th scope="col" className="align-right">
                              Cantidad
                            </th>
                            <th scope="col" className="align-right">
                              Precio
                            </th>
                            <th scope="col" className="align-right">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {piezas.map((pieza, index) => (
                            <tr key={`${pieza.descripcion}-${index}`}>
                              <td>{pieza.descripcion}</td>
                              <td className="align-right">{pieza.cantidad}</td>
                              <td className="align-right">{formatMoney(pieza.precio)}</td>
                              <td className="align-right">
                                {formatMoney(Number(pieza.cantidad) * Number(pieza.precio))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="muted">Esta orden no lleva piezas; solo mano de obra.</p>
                  )}

                  <div className="budget-summary">
                    <div className="budget-summary__row">
                      <span>Mano de obra</span>
                      <span>{formatMoney(orden.manoObra)}</span>
                    </div>
                    <div className="budget-summary__row">
                      <span>Total de piezas</span>
                      <span>{formatMoney(total - Number(orden.manoObra || 0))}</span>
                    </div>
                    <div className="budget-summary__row budget-summary__row--total">
                      <span>Total del presupuesto</span>
                      <strong>{formatMoney(total)}</strong>
                    </div>
                  </div>

                  <p className="field__hint">
                    El total se calcula como mano de obra + cantidad × precio de cada pieza. No se
                    almacena en la base de datos.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <header className="card__header">
              <div>
                <h2 className="card__title">Historial de etapas</h2>
                <p className="card__subtitle">
                  Cada cambio de etapa queda registrado automáticamente.
                </p>
              </div>
              <Icon name="history" size={20} className="muted" />
            </header>
            <div className="card__body">
              <ol className="timeline">
                {history.map((item, index) => (
                  <li className="timeline__item" key={item.key}>
                    <span
                      className={`timeline__dot timeline__dot--${ESTADO_TONOS[item.a] || 'slate'}`}
                      aria-hidden="true"
                    />
                    <div className="timeline__content">
                      <div className="timeline__head">
                        {item.synthetic ? (
                          <strong>Orden registrada</strong>
                        ) : (
                          <strong>
                            {ESTADO_LABELS[item.de] || item.de}
                            <span className="timeline__arrow" aria-hidden="true">
                              →
                            </span>
                            {ESTADO_LABELS[item.a] || item.a}
                          </strong>
                        )}
                        {index === history.length - 1 ? (
                          <span className="timeline__current">Etapa actual</span>
                        ) : null}
                      </div>
                      <time dateTime={item.created}>{formatDateTime(item.created)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>

        <aside className="stack">
          <section className="card card--pad">
            <h2 className="card__title">Cliente</h2>
            {cliente ? (
              <>
                <div className="client-summary">
                  <span className="avatar" aria-hidden="true">
                    {initials(cliente.nombre)}
                  </span>
                  <div>
                    <Link className="table-link" to={`/clientes/${cliente.id}`}>
                      {cliente.nombre}
                    </Link>
                    <span className="table-subtext">Ver ficha del cliente</span>
                  </div>
                </div>
                <dl className="detail-list detail-list--compact">
                  <div className="detail-list__row">
                    <dt>
                      <Icon name="phone" size={15} /> Teléfono
                    </dt>
                    <dd>
                      <a className="inline-link" href={telHref(cliente.telefono)}>
                        {cliente.telefono || '—'}
                      </a>
                    </dd>
                  </div>
                  <div className="detail-list__row">
                    <dt>
                      <Icon name="map-pin" size={15} /> Dirección
                    </dt>
                    <dd>{cliente.direccion || '—'}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="muted">El cliente asociado ya no existe.</p>
            )}
          </section>

          <section className="card card--pad">
            <h2 className="card__title">Resumen</h2>
            <dl className="summary-list">
              <div>
                <dt>Etapa</dt>
                <dd>
                  <StatusBadge estado={orden.estado} size="sm" />
                </dd>
              </div>
              <div>
                <dt>Presupuesto</dt>
                <dd>{presupuestada ? formatMoney(total) : 'Pendiente'}</dd>
              </div>
              <div>
                <dt>Fotos</dt>
                <dd>{fotos.length} de 3</dd>
              </div>
              <div>
                <dt>Identificador</dt>
                <dd>
                  <code className="code">{orden.id}</code>
                </dd>
              </div>
            </dl>
          </section>

          <section className="card card--pad next-step">
            <span className={`next-step__icon ${isFinal ? 'is-locked' : ''}`.trim()} aria-hidden="true">
              <Icon name={isFinal ? 'lock' : 'arrow-right'} size={20} />
            </span>
            <h2 className="card__title">{isFinal ? 'Orden cerrada' : 'Siguiente paso'}</h2>
            {isFinal ? (
              <p className="muted">
                Esta orden no admite más cambios. Su historial permanece disponible para consulta.
              </p>
            ) : (
              <>
                <p className="muted">
                  {options.map((option) => ESTADO_LABELS[option]).join(' o ')}.
                </p>
                <Button onClick={openDialog} icon="arrow-right" size="sm">
                  Cambiar etapa
                </Button>
              </>
            )}
          </section>
        </aside>
      </div>

      {dialogOpen ? (
        <ChangeStatusDialog
          open
          orden={orden}
          onClose={() => {
            if (!transitionLoading) {
              setDialogOpen(false)
              setTransitionError('')
            }
          }}
          onConfirm={handleTransition}
          loading={transitionLoading}
          serverError={transitionError}
        />
      ) : null}

    </div>
  )
}
