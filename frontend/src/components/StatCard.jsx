import { Link } from 'react-router'
import { Icon } from './Icon'

export default function StatCard({ label, value, icon, tone = 'brand', hint, to }) {
  const content = (
    <>
      <span className={`stat-card__icon stat-card__icon--${tone}`} aria-hidden="true">
        <Icon name={icon} size={22} />
      </span>
      <div className="stat-card__content">
        <span className="stat-card__label">{label}</span>
        <strong className="stat-card__value">{value}</strong>
        {hint ? <span className="stat-card__hint">{hint}</span> : null}
      </div>
    </>
  )

  if (to) {
    return (
      <Link to={to} className="stat-card stat-card--link">
        {content}
      </Link>
    )
  }

  return <div className="stat-card">{content}</div>
}
