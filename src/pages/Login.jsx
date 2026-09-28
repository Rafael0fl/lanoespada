/* ==========================================================================
 * Login.jsx
 * --------------------------------------------------------------------------
 * Pantalla de acceso (espanol). Simula autenticacion contra DEMO_ACCOUNTS
 * mediante AuthContext.login().
 *
 * Luego del login exitoso redirige:
 *   - A la ruta de inicio del rol (homeRoute) por defecto.
 *   - A location.state?.from si venia de una ruta protegida (RequireAuth).
 *
 * Incluye accesos rápidos con las cuentas demo para probar los 3 roles.
 * ========================================================================== */

import { useEffect, useState } from 'react'
import { LogIn, ShieldCheck, Sword } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { DEMO_ACCOUNTS } from '../data/mockData'

// Etiquetas cortas para el selector rápido por rol.
const QUICK_LABELS = { admin: 'Admin', socio: 'Socio', tenant: 'Tenant' }

export default function Login() {
  const { login, isAuthenticated, homeRoute } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Estado del formulario.
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Si el usuario ya estaba logueado, lo mandamos directo a su panel.
  useEffect(() => {
    if (isAuthenticated) {
      navigate(homeRoute, { replace: true })
    }
  }, [isAuthenticated, homeRoute, navigate])

  /* ------------------------------------------------------------------
   * Maneja el submit del formulario.
   * login() devuelve { ok } o { ok:false, error }.
   * ----------------------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!identifier || !password) {
      setError('Completá tu usuario y contraseña.')
      return
    }

    setLoading(true)
    const result = await login({ identifier, password })
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    // Redirijo a la ruta desde la que venia (si existe) o a su panel.
    const from = location.state?.from
    navigate(from || homeRoute, { replace: true })
  }

  /* ------------------------------------------------------------------
   * Selector rápido: una lista por rol. Al elegir una cuenta se
   * rellenan usuario y contraseña para solo presionar "Ingresar".
   * ----------------------------------------------------------------- */
  const fillQuickAccount = (e) => {
    const username = e.target.value
    const account = DEMO_ACCOUNTS.find((acc) => acc.username === username)
    if (account) {
      setIdentifier(account.username)
      setPassword(account.password)
      setError('')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Marca */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30">
            <Sword className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">La No Espada</h1>
          <p className="mt-1 text-sm text-brand-200">
            Plataforma de atención inteligente por WhatsApp
          </p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-900">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ingresá con tus credenciales para acceder al panel.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Usuario */}
            <div>
              <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-slate-700">
                Usuario
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="tu usuario"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Error de autenticacion */}
            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600 ring-1 ring-inset ring-red-600/10">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Verificando…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Ingresar
                </>
              )}
            </button>
          </form>
        </div>

        {/* Accesos rapidos de prueba */}
        <div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-inset ring-white/10">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-200">
            <ShieldCheck className="h-4 w-4" />
            Cuentas de prueba
          </p>
          <div className="space-y-3">
            {['admin', 'socio', 'tenant'].map((roleKey) => {
              const accounts = DEMO_ACCOUNTS.filter((acc) => acc.role === roleKey)
              return (
                <div key={roleKey}>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-200/80">
                    {QUICK_LABELS[roleKey]}
                  </label>
                  <select
                    defaultValue=""
                    onChange={fillQuickAccount}
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 [&>option]:text-slate-900"
                  >
                    <option value="">Elegí una cuenta…</option>
                    {accounts.map((acc) => (
                      <option key={acc.username} value={acc.username}>
                        {acc.role === 'tenant' ? acc.name : acc.username}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-brand-200/60">
            Elegí una cuenta para rellenar los campos y presioná "Ingresar".
          </p>
        </div>
      </div>
    </div>
  )
}