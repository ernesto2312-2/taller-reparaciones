import Button from '../components/Button'

export default function NoEncontradoPage() {
  return (
    <div className="not-found">
      <p className="not-found__code">404</p>
      <h1>Página no encontrada</h1>
      <p className="muted">
        La dirección que intentó abrir no existe dentro del taller. Puede volver al panel y
        continuar desde allí.
      </p>
      <Button to="/" icon="arrow-left">
        Volver al panel
      </Button>
    </div>
  )
}
