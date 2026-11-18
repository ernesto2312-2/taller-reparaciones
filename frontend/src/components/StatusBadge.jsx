import { ESTADO_LABELS, ESTADO_TONOS } from '../utils/estados'

export default function StatusBadge({ estado, size = 'md' }) {
  const label = ESTADO_LABELS[estado] || estado || 'Sin estado'
  const tone = ESTADO_TONOS[estado] || 'slate'

  return (
    <span className={`badge badge--${tone} badge--${size}`}>
      <span className="badge__dot" aria-hidden="true" />
      {label}
    </span>
  )
}
