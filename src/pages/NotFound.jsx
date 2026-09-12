/* ==========================================================================
 * NotFound.jsx
 * --------------------------------------------------------------------------
 * Pagina 404 (ruta "catch-all"). Muestra un mensaje en espanol y un boton
 * para volver al panel del rol logueado (o al login si no hay sesion).
 * ========================================================================== */

import { Compass } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export default function NotFound() {
  const { isAuthenticated, homeRoute } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <Compass className="h-7 w-7 text-brand-600" />
        </div>
        <p className="text-6xl font-black tracking-tight text-slate-900">404</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">
          La página que buscás no existe
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Verificá la dirección o volvé a tu panel de control.
        </p>
        <button
          type="button"
          onClick={() => navigate(isAuthenticated ? homeRoute : '/login', { replace: true })}
          className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {isAuthenticated ? 'Volver a mi panel' : 'Ir a iniciar sesión'}
        </button>
      </div>
    </div>
  )
}