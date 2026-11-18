import { useState } from 'react'
import Alert from './Alert'
import Button from './Button'
import FormField from './FormField'
import Modal from './Modal'
import PiezasEditor from './PiezasEditor'
import {
  ACCIONES_TRANSICION,
  ESTADO_DESCRIPCIONES,
  transicionesPermitidas,
} from '../utils/estados'
import { formatMoney, orderCode } from '../utils/format'
import { hasErrors, prepararPresupuesto } from '../utils/validators'

function parseNumber(value) {
  const number = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(number) ? number : 0
}

export default function ChangeStatusDialog({
  open,
  orden,
  onClose,
  onConfirm,
  loading = false,
  serverError,
}) {
  const [target, setTarget] = useState(
    () => transicionesPermitidas(orden?.estado)[0] ?? '',
  )
  const [diagnostico, setDiagnostico] = useState('')
  const [manoObra, setManoObra] = useState('')
  const [piezas, setPiezas] = useState([])
  const [errors, setErrors] = useState({})

  const options = transicionesPermitidas(orden?.estado)

  if (!orden) return null

  const totalEstimado =
    parseNumber(manoObra) +
    piezas.reduce((sum, row) => sum + parseNumber(row.cantidad) * parseNumber(row.precio), 0)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!target || loading) return

    if (target === 'presupuestada') {
      const result = prepararPresupuesto({ diagnostico, manoObra, piezas })
      setErrors(result.errors)
      if (hasErrors(result.errors)) return
      onConfirm({ estado: target, ...result.values })
      return
    }

    onConfirm({ estado: target })
  }

  const selectedAction = ACCIONES_TRANSICION[target]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cambiar etapa de la orden"
      description={`${orderCode(orden.id)} · ${orden.equipo}`}
      size="lg"
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="transition-form"
            variant={target === 'rechazada' || target === 'cancelada' ? 'danger' : 'primary'}
            icon="arrow-right"
            loading={loading}
            disabled={!target}
          >
            {selectedAction?.label || 'Confirmar cambio'}
          </Button>
        </>
      }
    >
      <form id="transition-form" className="transition-form" onSubmit={handleSubmit} noValidate>
        {serverError ? (
          <Alert variant="error" title="No se pudo cambiar la etapa">
            {serverError}
          </Alert>
        ) : null}

        <fieldset className="transition-options">
          <legend className="transition-options__legend">Seleccione la nueva etapa</legend>
          {options.map((option) => {
            const action = ACCIONES_TRANSICION[option] || {}
            return (
              <label
                className={`transition-option ${target === option ? 'is-selected' : ''}`.trim()}
                key={option}
              >
                <input
                  className="visually-hidden"
                  type="radio"
                  name="nueva-etapa"
                  value={option}
                  checked={target === option}
                  onChange={() => {
                    setTarget(option)
                    setErrors({})
                  }}
                />
                <span className="transition-option__radio" aria-hidden="true">
                  <span />
                </span>
                <span className="transition-option__body">
                  <strong>{action.label || option}</strong>
                  <span>{action.description}</span>
                </span>
              </label>
            )
          })}
        </fieldset>

        {target === 'presupuestada' ? (
          <div className="budget-form">
            <Alert variant="info" title="El presupuesto se registra una sola vez">
              El diagnóstico, la mano de obra y las piezas quedarán bloqueados después de este paso.
            </Alert>

            <FormField
              label="Diagnóstico técnico"
              htmlFor="transicion-diagnostico"
              required
              error={errors.diagnostico}
              hint={`${diagnostico.length} / 2000 caracteres`}
            >
              <textarea
                id="transicion-diagnostico"
                className="textarea"
                rows={4}
                value={diagnostico}
                onChange={(event) => setDiagnostico(event.target.value)}
                placeholder="Describa la falla encontrada y el trabajo necesario…"
                aria-invalid={Boolean(errors.diagnostico)}
              />
            </FormField>

            <FormField
              label="Mano de obra"
              htmlFor="transicion-mano-obra"
              error={errors.manoObra}
              hint="Importe en la moneda del taller. Puede dejarlo en 0 si no aplica."
            >
              <input
                id="transicion-mano-obra"
                className="input"
                inputMode="decimal"
                value={manoObra}
                onChange={(event) => setManoObra(event.target.value)}
                placeholder="0,00"
                aria-invalid={Boolean(errors.manoObra)}
              />
            </FormField>

            <PiezasEditor value={piezas} onChange={setPiezas} errors={errors} />

            <div className="budget-total">
              <div>
                <span className="budget-total__label">Total estimado</span>
                <span className="budget-total__hint">Calculado como mano de obra + piezas.</span>
              </div>
              <strong className="budget-total__value">{formatMoney(totalEstimado)}</strong>
            </div>
          </div>
        ) : null}

        {target === 'rechazada' ? (
          <Alert variant="warning" title="La orden quedará cerrada">
            El cliente rechazó el presupuesto. Después de este cambio no se podrá continuar la
            reparación.
          </Alert>
        ) : null}

        {target === 'cancelada' ? (
          <Alert variant="warning" title="La orden quedará cerrada">
            La cancelación solo está permitida antes de iniciar el diagnóstico. Esta acción es
            definitiva.
          </Alert>
        ) : null}

        {target &&
        !['presupuestada', 'rechazada', 'cancelada'].includes(target) ? (
          <Alert variant="info">{ESTADO_DESCRIPCIONES[target]}</Alert>
        ) : null}
      </form>
    </Modal>
  )
}
