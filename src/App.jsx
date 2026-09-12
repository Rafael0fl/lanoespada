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
 *   /socio/metrics                -> SOLO rol 'socio'  (estadisticas)
 *   /socio/register               -> SOLO rol 'socio'  (registro de negocios)
 *   /dashboard/stats              -> SOLO rol 'cliente' (metricas del negocio)
 *   /dashboard/settings           -> SOLO rol 'cliente' (config del negocio)
 *   *                             -> NotFound (404)
 *
 * Como se protegen las rutas:
 *   Cada grupo esta envuelto en una ruta "layout" cuyo element es
 *   <RequireAuth roles={[...]} />. RequireAuth valida la sesion (useAuth)
 *   y el rol, y si pasa, renderiza <Outlet /> con las rutas hijas.
 *   Ademas, dentro de cada grupo montamos <AppShell> (el layout visual
 *   con sidebar + nav items del rol) que tambien renderiza <Outlet />.
 * ========================================================================== */

import { BarChart3, LayoutDashboard, Settings, Store } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'

import RequireAuth, { HomeRedirect } from './components/RequireAuth'
import AppShell from './components/layouts/AppShell'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/admin/AdminDashboard'
import Metrics from './pages/socio/Metrics'
import RegisterBusiness from './pages/socio/RegisterBusiness'
import DashboardStats from './pages/cliente/DashboardStats'
import DashboardSettings from './pages/cliente/DashboardSettings'

/* --------------------------------------------------------------------------
 * Navegacion de cada rol.
 * Cada item: { to, label, icon } -> se pinta en AppShell (sidebar + navbar).
 * ------------------------------------------------------------------------ */
const adminNavItems = [
  { to: '/admin', label: 'Mi panel de control', icon: LayoutDashboard },
]

const partnerNavItems = [
  { to: '/socio/metrics', label: 'Métricas', icon: BarChart3 },
  { to: '/socio/register', label: 'Registrar negocio', icon: Store },
]

const clientNavItems = [
  { to: '/dashboard/stats', label: 'Estadísticas', icon: BarChart3 },
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
          <Route path="/socio/metrics" element={<Metrics />} />
          <Route path="/socio/register" element={<RegisterBusiness />} />
        </Route>
      </Route>

      {/* ================== ROL: CLIENTE ================== */}
      <Route element={<RequireAuth roles={['cliente']} />}>
        <Route element={<AppShell navItems={clientNavItems} />}>
          <Route path="/dashboard" element={<Navigate to="/dashboard/stats" replace />} />
          <Route path="/dashboard/stats" element={<DashboardStats />} />
          <Route path="/dashboard/settings" element={<DashboardSettings />} />
        </Route>
      </Route>

      {/* ================== 404 ================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}