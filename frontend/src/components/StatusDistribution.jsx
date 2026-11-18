import { ESTADOS, ESTADO_LABELS, ESTADO_TONOS } from '../utils/estados'

export default function StatusDistribution({ porEstado = {}, total = 0 }) {
  return (
    <div className="distribution">
      {ESTADOS.map((estado) => {
        const count = Number(porEstado?.[estado] ?? 0)
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0

        return (
          <div className="distribution__row" key={estado}>
            <div className="distribution__meta">
              <span className={`distribution__dot distribution__dot--${ESTADO_TONOS[estado]}`} />
              <span className="distribution__label">{ESTADO_LABELS[estado]}</span>
              <span className="distribution__count">{count}</span>
            </div>
            <div
              className="distribution__track"
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${ESTADO_LABELS[estado]}: ${count} órdenes`}
            >
              <span
                className={`distribution__bar distribution__bar--${ESTADO_TONOS[estado]}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
