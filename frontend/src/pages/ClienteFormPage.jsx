import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ErrorState from '../components/ErrorState'
import FormField from '../components/FormField'
import { Icon } from '../components/Icon'
import { Skeleton } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import { useToast } from '../components/ToastContext'
import { useCliente } from '../hooks/useCliente'
import { createCliente, updateCliente } from '../services/clientes'
import { hasErrors, validateCliente } from '../utils/validators'

const EMPTY_VALUES = { nombre: '', telefono: '', direccion: '' }

export default function ClienteFormPage({ mode = 'create' }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { cliente, loading, error, reload } = useCliente(isEdit ? id : null)

  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const firstFieldRef = useRef(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  useEffect(() => {
    if (isEdit && cliente) {
      setValues({
        nombre: cliente.nombre ?? '',
        telefono: cliente.telefono ?? '',
        direccion: cliente.direccion ?? '',
      })
    }
  }, [isEdit, cliente])

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
    const allErrors = validateCliente(values)
    setErrors((current) => {
      const next = { ...current }
      if (allErrors[field]) next[field] = allErrors[field]
      else delete next[field]
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validation = validateCliente(values)
    setErrors(validation)
    if (hasErrors(validation)) return

    setSaving(true)
    setServerError('')

    const payload = {
      nombre: values.nombre.trim(),
      telefono: values.telefono.trim(),
      direccion: values.direccion.trim(),
    }

    try {
      const saved = isEdit
        ? await updateCliente(id, payload)
        : await createCliente(payload)
      toast.success(isEdit ? 'Cliente actualizado correctamente.' : 'Cliente registrado correctamente.')
      navigate(`/clientes/${saved.id}`)
    } catch (saveError) {
      setServerError(saveError.message)
      if (saveError.fieldErrors && Object.keys(saveError.fieldErrors).length > 0) {
        setErrors((current) => ({ ...current, ...saveError.fieldErrors }))
      }
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && loading) {
    return (
      <div className="stack">
        <Skeleton className="skeleton--title" />
        <div className="form-layout">
          <div className="card card--pad">
            <Skeleton className="skeleton--line" />
            <Skeleton className="skeleton--line" />
            <Skeleton className="skeleton--line" />
          </div>
          <div className="card card--pad">
            <Skeleton className="skeleton--line" />
            <Skeleton className="skeleton--block" />
          </div>
        </div>
      </div>
    )
  }

  if (isEdit && error) {
    return (
      <ErrorState
        error={error}
        onRetry={reload}
        title="No se pudo cargar el cliente"
        notFoundMessage="El cliente solicitado no existe o fue eliminado."
      />
    )
  }

  const backTo = isEdit ? `/clientes/${id}` : '/clientes'

  return (
    <div className="stack">
      <PageHeader
        eyebrow={isEdit ? 'Editar ficha' : 'Nuevo registro'}
        title={isEdit ? 'Editar cliente' : 'Registrar cliente'}
        description={
          isEdit
            ? 'Actualice los datos de contacto del cliente.'
            : 'Registre nombre y teléfono antes de recibir un equipo.'
        }
        backTo={backTo}
        backLabel={isEdit ? 'Ficha del cliente' : 'Clientes'}
      />

      {serverError ? (
        <Alert variant="error" title="No se pudo guardar el cliente">
          {serverError}
        </Alert>
      ) : null}

      <form className="form-layout" onSubmit={handleSubmit} noValidate>
        <section className="card">
          <header className="card__header">
            <div>
              <h2 className="card__title">Datos de contacto</h2>
              <p className="card__subtitle">Los campos marcados con * son obligatorios.</p>
            </div>
          </header>

          <div className="card__body">
            <div className="form-grid">
              <FormField
                label="Nombre completo"
                htmlFor="cliente-nombre"
                required
                error={errors.nombre}
                hint="Tal como desea que aparezca en la orden."
                className="form-grid__full"
              >
                <input
                  ref={firstFieldRef}
                  id="cliente-nombre"
                  className="input"
                  value={values.nombre}
                  onChange={updateField('nombre')}
                  onBlur={() => validateField('nombre')}
                  placeholder="Ej. María González"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.nombre)}
                />
              </FormField>

              <FormField
                label="Teléfono"
                htmlFor="cliente-telefono"
                required
                error={errors.telefono}
                hint="Se usa para avisar cuando el equipo esté listo."
              >
                <input
                  id="cliente-telefono"
                  className="input"
                  value={values.telefono}
                  onChange={updateField('telefono')}
                  onBlur={() => validateField('telefono')}
                  placeholder="Ej. +53 5555 1234"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.telefono)}
                />
              </FormField>

              <FormField
                label="Dirección"
                htmlFor="cliente-direccion"
                error={errors.direccion}
                hint="Opcional. Útil para coordinar la entrega."
              >
                <input
                  id="cliente-direccion"
                  className="input"
                  value={values.direccion}
                  onChange={updateField('direccion')}
                  onBlur={() => validateField('direccion')}
                  placeholder="Ej. Calle 12 #34, municipio…"
                  autoComplete="street-address"
                  aria-invalid={Boolean(errors.direccion)}
                />
              </FormField>
            </div>
          </div>

          <footer className="card__footer form-actions">
            <Button to={backTo} variant="secondary">
              Cancelar
            </Button>
            <Button type="submit" icon="save" loading={saving}>
              {isEdit ? 'Guardar cambios' : 'Registrar cliente'}
            </Button>
          </footer>
        </section>

        <aside className="form-aside">
          <section className="card card--pad">
            <span className="form-aside__icon" aria-hidden="true">
              <Icon name="info" size={20} />
            </span>
            <h2 className="form-aside__title">¿Por qué pedimos el teléfono?</h2>
            <p className="muted">
              El taller lo utiliza para confirmar el presupuesto y avisar cuando el equipo está
              listo para entregar. No se comparte con terceros.
            </p>
          </section>

          <section className="card card--pad">
            <h2 className="form-aside__title">Consejo</h2>
            <p className="muted">
              Si el cliente ya existe, búsquelo en el directorio antes de crear una ficha nueva para
              evitar duplicados.
            </p>
          </section>
        </aside>
      </form>
    </div>
  )
}
