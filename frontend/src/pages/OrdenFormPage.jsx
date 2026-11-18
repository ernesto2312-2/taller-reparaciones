import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ErrorState from '../components/ErrorState'
import FormField from '../components/FormField'
import { Icon } from '../components/Icon'
import { Skeleton } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import PhotoUploader from '../components/PhotoUploader'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../components/ToastContext'
import { useClientes } from '../hooks/useClientes'
import { useOrden } from '../hooks/useOrden'
import { createOrden, updateOrden } from '../services/ordenes'
import { esEstadoFinal } from '../utils/estados'
import { ESTADO_LABELS } from '../utils/estados'
import { hasErrors, validateOrden } from '../utils/validators'

export default function OrdenFormPage({ mode = 'create' }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const {
    orden,
    loading: ordenLoading,
    error: ordenError,
    reload: reloadOrden,
  } = useOrden(isEdit ? id : null)
  const {
    clientes,
    loading: clientesLoading,
    error: clientesError,
    reload: reloadClientes,
  } = useClientes('')

  const [values, setValues] = useState({
    cliente: searchParams.get('cliente') ?? '',
    equipo: '',
    problema: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [newFiles, setNewFiles] = useState([])
  const [removedFotos, setRemovedFotos] = useState([])
  const firstFieldRef = useRef(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  useEffect(() => {
    if (isEdit && orden) {
      setValues({
        cliente: orden.cliente ?? '',
        equipo: orden.equipo ?? '',
        problema: orden.problema ?? '',
      })
      setNewFiles([])
      setRemovedFotos([])
    }
  }, [isEdit, orden])

  const updateField = (field) => (event) => {
    const value = event.target.value
    setValues((current) => ({ ...current, [field]: value }))
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  const validateField = (field) => {
    const allErrors = validateOrden(values)
    setErrors((current) => {
      const next = { ...current }
      if (allErrors[field]) next[field] = allErrors[field]
      else delete next[field]
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return

    const validation = validateOrden(values)
    setErrors(validation)
    if (hasErrors(validation)) return

    const visibleExisting = (orden?.fotos ?? []).filter(
      (filename) => !removedFotos.includes(filename),
    )
    if (visibleExisting.length + newFiles.length > 3) {
      setErrors((current) => ({
        ...current,
        fotos: 'Puede adjuntar como máximo 3 fotos por orden.',
      }))
      return
    }

    setSaving(true)
    setServerError('')

    const payload = {
      cliente: values.cliente,
      equipo: values.equipo.trim(),
      problema: values.problema.trim(),
    }

    try {
      const saved = isEdit
        ? await updateOrden(id, payload, { files: newFiles, removeFiles: removedFotos })
        : await createOrden(payload, { files: newFiles })

      toast.success(isEdit ? 'Orden actualizada correctamente.' : 'Orden registrada en etapa solicitada.')
      navigate(`/ordenes/${saved.id}`)
    } catch (saveError) {
      if (saveError.fieldErrors && Object.keys(saveError.fieldErrors).length > 0) {
        setErrors((current) => ({ ...current, ...saveError.fieldErrors }))
      } else {
        setServerError(saveError.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const loading = (isEdit && ordenLoading) || (clientesLoading && clientes.length === 0)

  if (loading) {
    return (
      <div className="stack">
        <Skeleton className="skeleton--title" />
        <div className="form-layout">
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
      </div>
    )
  }

  if (isEdit && ordenError) {
    return (
      <ErrorState
        error={ordenError}
        onRetry={reloadOrden}
        title="No se pudo cargar la orden"
        notFoundMessage="La orden solicitada no existe o fue eliminada."
      />
    )
  }

  if (clientesError) {
    return (
      <ErrorState
        error={clientesError}
        onRetry={reloadClientes}
        title="No se pudo cargar la lista de clientes"
      />
    )
  }

  if (isEdit && orden && esEstadoFinal(orden.estado)) {
    return (
      <div className="stack">
        <PageHeader
          eyebrow="Orden cerrada"
          title="No se puede editar"
          description="Las órdenes entregadas, rechazadas o canceladas conservan sus datos sin cambios."
          backTo={`/ordenes/${id}`}
          backLabel="Detalle de la orden"
        />
        <Alert variant="warning" title={`La orden está en etapa “${ESTADO_LABELS[orden.estado]}”`}>
          Para preservar el historial, el servidor bloquea la edición de órdenes cerradas.
        </Alert>
        <div className="card card--pad">
          <p className="muted">
            Puede consultar el detalle y el historial completo de la orden.
          </p>
          <Button to={`/ordenes/${id}`} icon="arrow-left">
            Volver al detalle
          </Button>
        </div>
      </div>
    )
  }

  const selectOptions = [...clientes]
  if (
    isEdit &&
    orden?.expand?.cliente &&
    !selectOptions.some((cliente) => cliente.id === orden.expand.cliente.id)
  ) {
    selectOptions.unshift(orden.expand.cliente)
  }

  const backTo = isEdit ? `/ordenes/${id}` : '/ordenes'
  const existingFotos = isEdit && orden ? orden.fotos ?? [] : []

  return (
    <div className="stack">
      <PageHeader
        eyebrow={isEdit ? 'Editar orden' : 'Recepción de equipo'}
        title={isEdit ? 'Editar orden' : 'Nueva orden'}
        description={
          isEdit
            ? 'Corrija los datos de recepción. La etapa se cambia desde el detalle de la orden.'
            : 'Registre el equipo y el problema reportado. La orden nace en etapa solicitada.'
        }
        backTo={backTo}
        backLabel={isEdit ? 'Detalle de la orden' : 'Órdenes'}
      />

      {clientes.length === 0 ? (
        <Alert
          variant="warning"
          title="No hay clientes registrados"
          action={
            <Button to="/clientes/nuevo" icon="plus" size="sm">
              Registrar cliente
            </Button>
          }
        >
          Para crear una orden primero debe existir el cliente que deja el equipo.
        </Alert>
      ) : null}

      {isEdit && orden ? (
        <Alert variant="info" title={`Etapa actual: ${ESTADO_LABELS[orden.estado]}`}>
          El estado y el presupuesto no se editan aquí. Use el detalle de la orden para avanzar de
          etapa.{' '}
          <Link className="inline-link" to={`/ordenes/${id}`}>
            Ir al detalle
          </Link>
        </Alert>
      ) : null}

      {serverError ? (
        <Alert variant="error" title="No se pudo guardar la orden">
          {serverError}
        </Alert>
      ) : null}

      <form className="form-layout" onSubmit={handleSubmit} noValidate>
        <section className="card">
          <header className="card__header">
            <div>
              <h2 className="card__title">Recepción del equipo</h2>
              <p className="card__subtitle">Los campos marcados con * son obligatorios.</p>
            </div>
          </header>

          <div className="card__body">
            <div className="form-grid">
              <FormField
                label="Cliente"
                htmlFor="orden-cliente"
                required
                error={errors.cliente}
                hint="Persona que deja el equipo en el taller."
                className="form-grid__full"
              >
                <select
                  ref={firstFieldRef}
                  id="orden-cliente"
                  className="select"
                  value={values.cliente}
                  onChange={updateField('cliente')}
                  onBlur={() => validateField('cliente')}
                  disabled={clientes.length === 0}
                  aria-invalid={Boolean(errors.cliente)}
                >
                  <option value="">Seleccione un cliente…</option>
                  {selectOptions.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} · {cliente.telefono}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Equipo recibido"
                htmlFor="orden-equipo"
                required
                error={errors.equipo}
                hint="Marca, modelo o descripción breve. Ej. Laptop Lenovo IdeaPad."
              >
                <input
                  id="orden-equipo"
                  className="input"
                  value={values.equipo}
                  onChange={updateField('equipo')}
                  onBlur={() => validateField('equipo')}
                  placeholder="Ej. Laptop Lenovo IdeaPad 3"
                  maxLength={160}
                  aria-invalid={Boolean(errors.equipo)}
                />
              </FormField>

              <FormField
                label="Problema reportado"
                htmlFor="orden-problema"
                required
                error={errors.problema}
                hint={`Lo que describe el cliente al dejarlo. ${values.problema.length} / 2000 caracteres.`}
                className="form-grid__full"
              >
                <textarea
                  id="orden-problema"
                  className="textarea"
                  rows={5}
                  value={values.problema}
                  onChange={updateField('problema')}
                  onBlur={() => validateField('problema')}
                  placeholder="Ej. No enciende después de un corte de corriente…"
                  maxLength={2000}
                  aria-invalid={Boolean(errors.problema)}
                />
              </FormField>
            </div>

            <div className="form-divider" />

            <PhotoUploader
              ordenId={isEdit ? id : undefined}
              existing={existingFotos}
              removed={removedFotos}
              onRemoveExisting={(filename) =>
                setRemovedFotos((current) =>
                  current.includes(filename) ? current : [...current, filename],
                )
              }
              onRestoreExisting={(filename) =>
                setRemovedFotos((current) => current.filter((item) => item !== filename))
              }
              newFiles={newFiles}
              onAddFiles={(files) => setNewFiles((current) => [...current, ...files])}
              onRemoveNew={(file) =>
                setNewFiles((current) => current.filter((item) => item !== file))
              }
              error={errors.fotos}
            />
          </div>

          <footer className="card__footer form-actions">
            <Button to={backTo} variant="secondary">
              Cancelar
            </Button>
            <Button
              type="submit"
              icon="save"
              loading={saving}
              disabled={clientes.length === 0}
            >
              {isEdit ? 'Guardar cambios' : 'Crear orden'}
            </Button>
          </footer>
        </section>

        <aside className="form-aside">
          <section className="card card--pad">
            <span className="form-aside__icon" aria-hidden="true">
              <Icon name="info" size={20} />
            </span>
            <h2 className="form-aside__title">Cómo avanza una orden</h2>
            <ol className="mini-steps">
              <li>Solicitada</li>
              <li>En diagnóstico</li>
              <li>Presupuestada</li>
              <li>Aprobada o rechazada</li>
              <li>En reparación</li>
              <li>Lista para entregar</li>
              <li>Entregada</li>
            </ol>
            <p className="muted">
              El presupuesto se registra únicamente al pasar de diagnóstico a presupuestada.
            </p>
          </section>

          {isEdit && orden ? (
            <section className="card card--pad">
              <h2 className="form-aside__title">Etapa actual</h2>
              <div className="aside-status">
                <StatusBadge estado={orden.estado} />
                <span className="muted">Los cambios de etapa se hacen desde el detalle.</span>
              </div>
              <Button to={`/ordenes/${id}`} variant="secondary" size="sm" icon="arrow-right">
                Ver detalle
              </Button>
            </section>
          ) : (
            <section className="card card--pad">
              <h2 className="form-aside__title">Sobre las fotos</h2>
              <p className="muted">
                Adjunte hasta tres imágenes del equipo al recibirlo. Sirven como constancia del
                estado en que llegó.
              </p>
            </section>
          )}
        </aside>
      </form>
    </div>
  )
}
