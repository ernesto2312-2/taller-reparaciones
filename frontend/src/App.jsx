import { Route, Routes } from 'react-router'
import { ToastProvider } from './components/ToastProvider'
import AppLayout from './layouts/AppLayout'
import ClienteDetallePage from './pages/ClienteDetallePage'
import ClienteFormPage from './pages/ClienteFormPage'
import ClientesPage from './pages/ClientesPage'
import DashboardPage from './pages/DashboardPage'
import NoEncontradoPage from './pages/NoEncontradoPage'
import OrdenDetallePage from './pages/OrdenDetallePage'
import OrdenFormPage from './pages/OrdenFormPage'
import OrdenesPage from './pages/OrdenesPage'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="clientes/nuevo" element={<ClienteFormPage mode="create" />} />
          <Route path="clientes/:id" element={<ClienteDetallePage />} />
          <Route path="clientes/:id/editar" element={<ClienteFormPage mode="edit" />} />
          <Route path="ordenes" element={<OrdenesPage />} />
          <Route path="ordenes/nueva" element={<OrdenFormPage mode="create" />} />
          <Route path="ordenes/:id" element={<OrdenDetallePage />} />
          <Route path="ordenes/:id/editar" element={<OrdenFormPage mode="edit" />} />
          <Route path="*" element={<NoEncontradoPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
