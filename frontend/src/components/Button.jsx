import { Link } from 'react-router'
import { Icon } from './Icon'
import { Spinner } from './Loader'

export default function Button({
  children,
  to,
  href,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, className].filter(Boolean).join(' ')
  const content = (
    <>
      {loading ? <Spinner size="sm" /> : icon ? <Icon name={icon} size={18} /> : null}
      {children !== undefined && children !== null ? <span>{children}</span> : null}
      {iconRight && !loading ? <Icon name={iconRight} size={18} /> : null}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault()
            return
          }
          onClick?.(event)
        }}
        {...rest}
      >
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    )
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {content}
    </button>
  )
}
