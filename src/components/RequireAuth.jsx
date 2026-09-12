/* ==========================================================================
 * RequireAuth.jsx
 * --------------------------------------------------------------------------
 * Guard (proteccion) de rutas por autenticacion y por rol.
 *
 * Se usa como elemento de una ruta "layout" y renderiza <Outlet /> si el
 * usuario tiene acceso. Casos de uso:
 *
 *   <Route element={<RequireAuth roles={['admin']} />}>
 *     <Route path="/admin" element={<AdminDashboard />} />
 *   </Route>
 *
 * Comportamiento:
 *   1. Si NO hay usuario logueado -> redirige a /login y recuerda desde
 *      dónde venia (state.from) para volver luego del login.
 *   2. Si el rol del usuario NO esta en 'roles' -> muestra una pantalla
 *      "Acceso denegado" con un boton para ir a su panel.
 *
 * Como se conecta con AuthContext:
 *   - useAuth() nos da { user, isAuthenticated, homeRoute }.
 *   - useLocation() nos da la ruta actual para redirigir de vuelta.
 *   - useNavigate() permite navegar al panel del rol.
 * ========================================================================== */

import { ShieldX } from 'lucide-react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ roles }) {
  const { isAuthenticated, user, roleLabel, homeRoute } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  /* ------------------ Caso 1: no autenticado ------------------ */
  // Redirigimos al login guardando la ruta actual; tras loguearnos,
  // Login.jsx puede redirigir de vuelta con location.state?.from.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  /* ------------------ Caso 2: rol no autorizado ------------------ */
  if (!roles.includes(user.role)) {
    // Pantalla visual de "acceso denegado" en lugar de un redirect ciego,
    // asi el usuario entiende por qué no entra.
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <ShieldX className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Acceso denegado</h1>
          <p className="mt-2 text-sm text-slate-500">
            Tu rol <strong>({roleLabel})</strong> no tiene permisos para acceder a esta
            sección.
          </p>
          <button
            type="button"
            onClick={() => navigate(homeRoute, { replace: true })}
            className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Ir a mi panel
          </button>
        </div>
      </div>
    )
  }

  /* ------------------ Caso 3: acceso OK ------------------ */
  return <Outlet />
}

/* ==========================================================================
 * HomeRedirect.jsx
 * --------------------------------------------------------------------------
 * Componente para la ruta raiz "/". Si el usuario está logueado lo lleva a
 * la ruta de inicio de su rol; si no, al login.
 * ========================================================================== */
export function HomeRedirect() {
  const { isAuthenticated, homeRoute } = useAuth()
  return <Navigate to={isAuthenticated ? homeRoute : '/login'} replace />
}