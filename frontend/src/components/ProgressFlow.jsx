import { ESTADO_LABELS, construirFlujo } from '../utils/estados'
import { Icon } from './Icon'

export default function ProgressFlow({ estado }) {
  const steps = construirFlujo(estado)
  const currentIndex = steps.indexOf(estado)

  return (
    <ol className="flow" aria-label="Progreso de la orden">
      {steps.map((step, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        const isTerminal = ['rechazada', 'cancelada'].includes(step) && isCurrent

        return (
          <li
            key={step}
            className={[
              'flow__step',
              isDone ? 'is-done' : '',
              isCurrent ? 'is-current' : '',
              isTerminal ? `is-${step}` : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="flow__marker" aria-hidden="true">
              {isDone ? <Icon name="check" size={14} strokeWidth={2.6} /> : <span>{index + 1}</span>}
            </span>
            <span className="flow__label">{ESTADO_LABELS[step]}</span>
          </li>
        )
      })}
    </ol>
  )
}
