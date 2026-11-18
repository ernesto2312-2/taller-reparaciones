import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import { Icon } from '../components/Icon'
import { TableSkeleton } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import SearchInput from '../components/SearchInput'
import StatusBadge from '../components/StatusBadge'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useOrdenes } from '../hooks/useOrdenes'
import { ESTADOS, ESTADO_LABELS } from '../utils/estados'
import {
  formatDate,
  formatMoney,
  orderCode,
  tienePresupuesto,
  totalPresupuesto,
} from '../utils/format'

export default function OrdenesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const estadoParam = searchParams.get('estado') ?? ''
  const estado = ESTADOS.includes(estadoParam) ? estadoParam : ''

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { ordenes, totalItems, loading, error, reload } = useOrdenes({
    estado,
    search: debouncedSearch,
  })

  const hasFilters = Boolean(estado || debouncedSearch)
  const noOrdersAtAll = !hasFilters && totalItems === 0

  const changeEstado = (nextEstado) => {
    const nextParams = new URLSearchParams(searchParams)
    if (nextEstado) nextParams.set('estado', nextEstado)
    else nextParams.delete('estado')
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Taller"
        title="Órdenes de reparación"
        description="Cada orden avanza por etapas controladas. El presupuesto se registra una sola vez al pasar a presupuestada."
        actions={
          <Button to="/ordenes/nueva" icon="plus">
            Nueva orden
          </Button>
        }
      />

      <section className="card">
        <div className="filters" role="group" aria-label="Filtrar por etapa">
          <button
            type="button"
            className={`filter-chip ${estado === '' ? 'is-active' : ''}`.trim()}
            onClick={() => changeEstado('')}
            aria-pressed={estado === ''}
          >
            Todas
            {estado === '' && !loading ? <span className="filter-chip__count">{totalItems}</span> : null}
          </button>
          {ESTADOS.map((option) => (
            <button
              type="button"
              key={option}
              className={`filter-chip ${estado === option ? 'is-active' : ''}`.trim()}
              onClick={() => changeEstado(option)}
              aria-pressed={estado === option}
            >
              <span className={`filter-chip__dot filter-chip__dot--${option}`} aria-hidden="true" />
              {ESTADO_LABELS[option]}
            </button>
          ))}
        </div>

        <div className="toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por equipo, problema o cliente…"
            label="Buscar órdenes"
          />
          <div className="toolbar__meta">
            {hasFilters ? (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setSearch('')
                  changeEstado('')
                }}
              >
                Limpiar filtros
              </button>
            ) : null}
            <span className="toolbar__count">
              {loading
                ? 'Actualizando…'
                : `${totalItems} ${totalItems === 1 ? 'orden' : 'órdenes'}`}
            </span>
          </div>
        </div>

        {loading && ordenes.length === 0 ? (
          <TableSkeleton rows={7} columns={6} />
        ) : error ? (
          <div className="card__body">
            <ErrorState
              error={error}
              onRetry={reload}
              title="No se pudieron cargar las órdenes"
            />
          </div>
        ) : ordenes.length === 0 ? (
          <EmptyState
            icon="orders"
            title={
              noOrdersAtAll
                ? 'Todavía no hay órdenes'
                : estado
                  ? `Sin órdenes en “${ESTADO_LABELS[estado]}”`
                  : 'No hay coincidencias'
            }
            description={
              noOrdersAtAll
                ? 'Reciba el primer equipo y registre una orden para comenzar el flujo.'
                : debouncedSearch
                  ? `Ninguna orden coincide con “${debouncedSearch}”.`
                  : 'Pruebe con otra etapa o limpie los filtros.'
            }
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  icon="x"
                  onClick={() => {
                    setSearch('')
                    changeEstado('')
                  }}
                >
                  Limpiar filtros
                </Button>
              ) : (
                <Button to="/ordenes/nueva" icon="plus">
                  Crear orden
                </Button>
              )
            }
          />
        ) : (
          <div className="table-wrap" aria-busy={loading}>
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
                  <th scope="col">Alta</th>
                  <th scope="col" className="align-right">
                    <span className="visually-hidden">Acciones</span>
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
                    </td>
                    <td>
                      {orden.expand?.cliente ? (
                        <Link className="inline-link" to={`/clientes/${orden.expand.cliente.id}`}>
                          {orden.expand.cliente.nombre}
                        </Link>
                      ) : (
                        <span className="muted">Cliente eliminado</span>
                      )}
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
                    <td className="cell-muted">{formatDate(orden.created)}</td>
                    <td>
                      <div className="row-actions">
                        <Link
                          to={`/ordenes/${orden.id}`}
                          className="icon-button"
                          aria-label={`Ver orden ${orderCode(orden.id)}`}
                          title="Ver detalle"
                        >
                          <Icon name="eye" size={17} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
