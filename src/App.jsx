/* ==========================================================================
 * App.jsx
 * --------------------------------------------------------------------------
 * Definicion de rutas de la aplicacion con React Router (v7 instalada,
 * compatible con la API de v6: BrowserRouter / Routes / Route / Outlet).
 *
 * Estructura de rutas protegidas por rol:
 *
 *   /login                        -> Login.jsx (publica)
 *   /admin                        -> SOLO rol 'admin'  (mi panel de control)
 *   /socio/tenant/nuevo           -> SOLO rol 'socio'  (Añadir Tenant)
 *   /socio/tenants                -> SOLO rol 'socio'  (Ver Tenants)
 *   /socio/tenants/:tenantId      -> SOLO rol 'socio'  (customers del tenant)
 *   /socio/tenants/.../chats/:id  -> SOLO rol 'socio'  (chat estilo WhatsApp)
 *   /socio/metrics                -> SOLO rol 'socio'  (metricas)
 *   /dashboard/customers          -> SOLO rol 'tenant' (sus clientes)
 *   /dashboard/customers/:id      -> SOLO rol 'tenant' (chat con un cliente)
 *   /dashboard/metrics            -> SOLO rol 'tenant' (metricas del negocio)
 *   /dashboard/settings           -> SOLO rol 'tenant' (config: herramientas)
 *   /dashboard/settings/:feature  -> SOLO rol 'tenant' (editor de una feature)
 *   *                             -> NotFound (404)
 *
 * Como se protegen las rutas:
 *   Cada grupo esta envuelto en una ruta "layout" cuyo element es
 *   <RequireAuth roles={[...]} />. RequireAuth valida la sesion (useAuth)
 *   y el rol, y si pasa, renderiza <Outlet /> con las rutas hijas.
 *   Ademas, dentro de cada grupo montamos <AppShell> (el layout visual
 *   con sidebar + nav items del rol) que tambien renderiza <Outlet />.
 * ========================================================================== */

import { BarChart3, LayoutDashboard, LayoutList, Settings, Store, Users } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'

import RequireAuth, { HomeRedirect } from './components/RequireAuth'
import AppShell from './components/layouts/AppShell'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/admin/AdminDashboard'
import Metrics from './pages/socio/Metrics'
import RegisterTenant from './pages/socio/RegisterTenant'
import TenantsList from './pages/socio/TenantsList'
import TenantCustomers from './pages/socio/TenantCustomers'
import ChatPage from './pages/socio/ChatPage'
import CustomersList from './pages/tenant/CustomersList'
import TenantChatPage from './pages/tenant/TenantChatPage'
import TenantMetrics from './pages/tenant/TenantMetrics'
import ToolsList from './pages/tenant/ToolsList'
import FeatureTool from './pages/tenant/FeatureTool'

/* --------------------------------------------------------------------------
 * Navegacion de cada rol.
 * Cada item: { to, label, icon } -> se pinta en AppShell (sidebar + navbar).
 * ------------------------------------------------------------------------ */
const adminNavItems = [
  { to: '/admin', label: 'Pendiente', icon: LayoutDashboard },
]

const partnerNavItems = [
  { to: '/socio/tenant/nuevo', label: 'Añadir Tenant', icon: Store },
  { to: '/socio/tenants', label: 'Ver Tenants', icon: LayoutList },
  { to: '/socio/metrics', label: 'Métricas', icon: BarChart3 },
]

const clientNavItems = [
  { to: '/dashboard/customers', label: 'Ver clientes', icon: Users },
  { to: '/dashboard/metrics', label: 'Métricas', icon: BarChart3 },
  { to: '/dashboard/settings', label: 'Configuración', icon: Settings },
]

export default function App() {
  return (
    <Routes>
      {/* ================== PUBLICAS ================== */}
      <Route path="/login" element={<Login />} />

      {/* Raiz "/": redirige al panel del rol o al login. */}
      <Route path="/" element={<HomeRedirect />} />

      {/* ================== ROL: ADMIN ================== */}
      <Route element={<RequireAuth roles={['admin']} />}>
        <Route element={<AppShell navItems={adminNavItems} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* ================== ROL: SOCIO ================== */}
      <Route element={<RequireAuth roles={['socio']} />}>
        <Route element={<AppShell navItems={partnerNavItems} />}>
          {/* La raiz /socio cae directo en metricas */}
          <Route path="/socio" element={<Navigate to="/socio/metrics" replace />} />
          <Route path="/socio/tenant/nuevo" element={<RegisterTenant />} />
          <Route path="/socio/tenants" element={<TenantsList />} />
          <Route path="/socio/tenants/:tenantId" element={<TenantCustomers />} />
          <Route path="/socio/tenants/:tenantId/chats/:customerId" element={<ChatPage />} />
          <Route path="/socio/metrics" element={<Metrics />} />
        </Route>
      </Route>

      {/* ================== ROL: TENANT ================== */}
      <Route element={<RequireAuth roles={['tenant']} />}>
        <Route element={<AppShell navItems={clientNavItems} />}>
          <Route path="/dashboard" element={<Navigate to="/dashboard/customers" replace />} />
          <Route path="/dashboard/customers" element={<CustomersList />} />
          <Route path="/dashboard/customers/:customerId" element={<TenantChatPage />} />
          <Route path="/dashboard/metrics" element={<TenantMetrics />} />
          <Route path="/dashboard/settings" element={<ToolsList />} />
          <Route path="/dashboard/settings/:featureKey" element={<FeatureTool />} />
        </Route>
      </Route>

      {/* ================== 404 ================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}