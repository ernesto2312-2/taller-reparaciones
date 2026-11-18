import { useState } from 'react'
import { Link } from 'react-router'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import { Icon } from '../components/Icon'
import { TableSkeleton } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import SearchInput from '../components/SearchInput'
import { useToast } from '../components/ToastContext'
import { useClientes } from '../hooks/useClientes'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { deleteCliente } from '../services/clientes'
import { formatDate, initials, telHref } from '../utils/format'

export default function ClientesPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { clientes, totalItems, loading, error, reload } = useClientes(debouncedSearch)
  const toast = useToast()

  const [clientToDelete, setClientToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const openDelete = (cliente) => {
    setDeleteError('')
    setClientToDelete(cliente)
  }

  const closeDelete = () => {
    if (deleting) return
    setClientToDelete(null)
    setDeleteError('')
  }

  const confirmDelete = async () => {
    if (!clientToDelete) return
    setDeleting(true)
    setDeleteError('')

    try {
      await deleteCliente(clientToDelete.id)
      toast.success(`Se eliminó el cliente ${clientToDelete.nombre}.`)
      setClientToDelete(null)
      reload()
    } catch (deleteFailure) {
      setDeleteError(deleteFailure.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Directorio"
        title="Clientes"
        description="Personas que han dejado un equipo en el taller. El cliente solo puede eliminarse si no tiene órdenes asociadas."
        actions={
          <Button to="/clientes/nuevo" icon="plus">
            Nuevo cliente
          </Button>
        }
      />

      <section className="card">
        <div className="toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, teléfono o dirección…"
            label="Buscar clientes"
          />
          <span className="toolbar__count">
            {loading ? 'Buscando…' : `${totalItems} ${totalItems === 1 ? 'cliente' : 'clientes'}`}
          </span>
        </div>

        {loading && clientes.length === 0 ? (
          <TableSkeleton rows={6} columns={5} />
        ) : error ? (
          <div className="card__body">
            <ErrorState error={error} onRetry={reload} title="No se pudieron cargar los clientes" />
          </div>
        ) : clientes.length === 0 ? (
          <EmptyState
            icon="clients"
            title={debouncedSearch ? 'No hay coincidencias' : 'Todavía no hay clientes'}
            description={
              debouncedSearch
                ? `Ningún cliente coincide con “${debouncedSearch}”. Pruebe con otro nombre o teléfono.`
                : 'Registre al cliente antes de recibir un equipo para poder asociarle órdenes.'
            }
            action={
              debouncedSearch ? (
                <Button variant="secondary" icon="x" onClick={() => setSearch('')}>
                  Limpiar búsqueda
                </Button>
              ) : (
                <Button to="/clientes/nuevo" icon="plus">
                  Registrar cliente
                </Button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Cliente</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col">Dirección</th>
                  <th scope="col">Alta</th>
                  <th scope="col" className="align-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <Link to={`/clientes/${cliente.id}`} className="person-cell">
                        <span className="avatar avatar--sm" aria-hidden="true">
                          {initials(cliente.nombre)}
                        </span>
                        <span>
                          <strong>{cliente.nombre}</strong>
                          <span className="table-subtext">ID {cliente.id}</span>
                        </span>
                      </Link>
                    </td>
                    <td>
                      {cliente.telefono ? (
                        <a className="inline-link" href={telHref(cliente.telefono)}>
                          <Icon name="phone" size={15} />
                          {cliente.telefono}
                        </a>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      {cliente.direccion ? (
                        <span className="cell-with-icon">
                          <Icon name="map-pin" size={15} />
                          {cliente.direccion}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="cell-muted">{formatDate(cliente.created)}</td>
                    <td>
                      <div className="row-actions">
                        <Link
                          to={`/clientes/${cliente.id}/editar`}
                          className="icon-button"
                          aria-label={`Editar a ${cliente.nombre}`}
                          title="Editar"
                        >
                          <Icon name="edit" size={17} />
                        </Link>
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          onClick={() => openDelete(cliente)}
                          aria-label={`Eliminar a ${cliente.nombre}`}
                          title="Eliminar"
                        >
                          <Icon name="trash" size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(clientToDelete)}
        title="Eliminar cliente"
        description={
          clientToDelete
            ? `¿Confirma que desea eliminar a ${clientToDelete.nombre}?`
            : undefined
        }
        confirmLabel="Eliminar cliente"
        onConfirm={confirmDelete}
        onCancel={closeDelete}
        loading={deleting}
      >
        {deleteError ? (
          <Alert variant="error" title="No se puede eliminar">
            {deleteError}
          </Alert>
        ) : (
          <p>
            Solo se eliminarán los datos del cliente. Si tiene órdenes asociadas, el servidor
            rechazará la operación para no perder el historial.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}
