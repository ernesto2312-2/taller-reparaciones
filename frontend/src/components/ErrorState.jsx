import Alert from './Alert'
import Button from './Button'

export default function ErrorState({
  error,
  title = 'No se pudo cargar la información',
  onRetry,
  retryLabel = 'Reintentar',
  notFoundMessage,
}) {
  const notFound = error?.status === 404
  const message = notFound
    ? notFoundMessage || 'El registro solicitado no existe o fue eliminado.'
    : error?.message || 'Ocurrió un error inesperado.'

  return (
    <div className="error-state">
      <Alert variant="error" title={notFound ? 'No encontrado' : title}>
        {message}
      </Alert>
      {onRetry && !notFound ? (
        <div className="error-state__actions">
          <Button variant="secondary" icon="refresh" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
