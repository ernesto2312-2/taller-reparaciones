export function Spinner({ size = 'md', label = 'Cargando' }) {
  return <span className={`spinner spinner--${size}`} role="status" aria-label={label} />
}

export function LoadingState({ label = 'Cargando información…' }) {
  return (
    <div className="loading-state">
      <Spinner size="lg" label={label} />
      <p>{label}</p>
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <span className={`skeleton ${className}`.trim()} aria-hidden="true" />
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="table-skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="table-skeleton__row" key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton key={columnIndex} className="skeleton--line" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton({ count = 5 }) {
  return (
    <div className="stats-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="stat-card stat-card--skeleton" key={index}>
          <Skeleton className="skeleton--icon" />
          <div className="stat-card__content">
            <Skeleton className="skeleton--label" />
            <Skeleton className="skeleton--value" />
          </div>
        </div>
      ))}
    </div>
  )
}
