import Button from './Button'
import FormField from './FormField'
import { Icon } from './Icon'
import { formatMoney } from '../utils/format'

function newRow() {
  const key =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return { key, descripcion: '', cantidad: '1', precio: '' }
}

function parseNumber(value) {
  const number = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(number) ? number : 0
}

export default function PiezasEditor({ value = [], onChange, errors = {} }) {
  const addRow = () => onChange([...value, newRow()])

  const updateRow = (key, field, fieldValue) => {
    onChange(value.map((row) => (row.key === key ? { ...row, [field]: fieldValue } : row)))
  }

  const removeRow = (key) => {
    onChange(value.filter((row) => row.key !== key))
  }

  const total = value.reduce((sum, row) => {
    return sum + parseNumber(row.cantidad) * parseNumber(row.precio)
  }, 0)

  return (
    <div className="piezas">
      <div className="piezas__header">
        <div>
          <p className="piezas__title">Piezas y repuestos</p>
          <p className="piezas__hint">El subtotal se calcula como cantidad × precio.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" icon="plus" onClick={addRow}>
          Añadir pieza
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="piezas__empty">
          <Icon name="wrench" size={22} aria-hidden="true" />
          <span>Sin piezas. Puede presupuestar solo mano de obra si el trabajo no requiere repuestos.</span>
        </div>
      ) : (
        <div className="piezas__rows">
          {value.map((row, index) => {
            const subtotal = parseNumber(row.cantidad) * parseNumber(row.precio)
            return (
              <div className="pieza-row" key={row.key}>
                <div className="pieza-row__main">
                  <FormField
                    label="Descripción"
                    htmlFor={`pieza-${row.key}-descripcion`}
                    error={errors[`pieza-${index}-descripcion`]}
                  >
                    <input
                      id={`pieza-${row.key}-descripcion`}
                      className="input"
                      value={row.descripcion}
                      onChange={(event) => updateRow(row.key, 'descripcion', event.target.value)}
                      placeholder="Ej. Pantalla LCD 15”"
                    />
                  </FormField>
                  <FormField
                    label="Cantidad"
                    htmlFor={`pieza-${row.key}-cantidad`}
                    error={errors[`pieza-${index}-cantidad`]}
                  >
                    <input
                      id={`pieza-${row.key}-cantidad`}
                      className="input"
                      inputMode="numeric"
                      value={row.cantidad}
                      onChange={(event) => updateRow(row.key, 'cantidad', event.target.value)}
                      placeholder="1"
                    />
                  </FormField>
                  <FormField
                    label="Precio"
                    htmlFor={`pieza-${row.key}-precio`}
                    error={errors[`pieza-${index}-precio`]}
                  >
                    <input
                      id={`pieza-${row.key}-precio`}
                      className="input"
                      inputMode="decimal"
                      value={row.precio}
                      onChange={(event) => updateRow(row.key, 'precio', event.target.value)}
                      placeholder="0,00"
                    />
                  </FormField>
                  <div className="pieza-row__subtotal">
                    <span>Subtotal</span>
                    <strong>{formatMoney(subtotal)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="icon-button icon-button--danger pieza-row__remove"
                  onClick={() => removeRow(row.key)}
                  aria-label={`Eliminar pieza ${index + 1}`}
                >
                  <Icon name="trash" size={17} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="piezas__total">
        <span>Total de piezas</span>
        <strong>{formatMoney(total)}</strong>
      </div>
    </div>
  )
}
