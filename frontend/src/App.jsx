
import { Link, Outlet, Route, Routes, useParams } from 'react-router'

// Estructura compartida de las páginas
function Layout() {
  return (
    <>
      <header>
        <h1>El Taller</h1>

        <nav>
          <Link to="/">Inicio</Link>
          {' | '}
          <Link to="/ordenes">Órdenes</Link>
          {' | '}
          <Link to="/clientes">Clientes</Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  )
}

// Pantalla principal
function Dashboard() {
  return <h2>Panel principal del taller</h2>
}

// Listado de órdenes
function Ordenes() {
  return (
    <>
      <h2>Órdenes de reparación</h2>
      <p>Aquí mostraremos las órdenes del taller.</p>
      <Link to="/ordenes/1">Consultar orden de prueba</Link>
    </>
  )
}

// Detalle de una orden
function DetalleOrden() {
  const { id } = useParams()

  return <h2>Detalle de la orden: {id}</h2>
}

// Listado de clientes
function Clientes() {
  return <h2>Clientes del taller</h2>
}

// Página para rutas inexistentes
function NoEncontrado() {
  return (
    <>
      <h2>404 - Página no encontrada</h2>
      <Link to="/">Volver al inicio</Link>
    </>
  )
}

// Configuración de las rutas
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="ordenes" element={<Ordenes />} />
        <Route path="ordenes/:id" element={<DetalleOrden />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  )
}

export default App
