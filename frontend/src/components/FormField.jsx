export default function FormField({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
  className = '',
}) {
  return (
    <div className={`field ${error ? 'field--invalid' : ''} ${className}`.trim()}>
      {label ? (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {required ? (
            <span className="field__required" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  )
}
