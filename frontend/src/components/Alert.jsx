import { Icon } from './Icon'

const ICONS = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert',
  error: 'alert',
}

export default function Alert({
  variant = 'info',
  title,
  children,
  action,
  className = '',
}) {
  return (
    <div className={`alert alert--${variant} ${className}`.trim()} role={variant === 'error' ? 'alert' : 'status'}>
      <span className="alert__icon" aria-hidden="true">
        <Icon name={ICONS[variant] || ICONS.info} size={20} />
      </span>
      <div className="alert__content">
        {title ? <p className="alert__title">{title}</p> : null}
        {children ? <div className="alert__text">{children}</div> : null}
      </div>
      {action ? <div className="alert__action">{action}</div> : null}
    </div>
  )
}
