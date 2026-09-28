/* ==========================================================================
 * AuthContext.jsx
 * --------------------------------------------------------------------------
 * Contexto de autenticacion de la aplicacion.
 *
 * El login va contra el backend real (POST /v1/auth/login, tabla users).
 * Si el backend esta apagado, el servicio api.js resuelve contra las cuentas
 * demo y seguimos probando la interfaz (modo demo).
 *
 * Lo que se guarda por usuario:
 *   { name, username, email, role, token, tenantId? }
 *
 * Funciones expuestas (via useAuth):
 *   - user            -> objeto del usuario actual (o null si no logueado).
 *   - isAuthenticated -> booleano derivado de 'user'.
 *   - login({identifier,password}) -> valida contra el backend (o demo) y
 *                                setea la sesion. Retorna { ok } o { ok:false,error }.
 *   - logout()        -> limpia la sesion.
 * ========================================================================== */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { loginUser } from '../services/api'
import { ROLES } from '../data/mockData'

// Clave elegida para persistir la sesion en localStorage.
const STORAGE_KEY = 'lanoespada_auth'

// Creamos el contexto (null por defecto: el provider lo llena).
const AuthContext = createContext(null)

/* --------------------------------------------------------------------------
 * AuthProvider
 * Componente que envuelve toda la aplicacion (se monta en main.jsx).
 * ------------------------------------------------------------------------ */
export function AuthProvider({ children }) {
  // Estado del usuario logueado. Se inicializa leyendo localStorage para
  // recuperar la sesion si el usuario recargo la pagina.
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      // Si el JSON guardado esta corrupto, simplemente se ignora.
      return null
    }
  })

  // Cada vez que cambia 'user' persistimos (o limpiamos) localStorage.
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  /* ------------------------------------------------------------------
   * login
   * Llama al servicio api.loginUser (backend real con fallback a las
   * cuentas demo si el backend esta apagado).
   * ----------------------------------------------------------------- */
  const login = async ({ identifier, password }) => {
    // Pequeno delay para que se vea el spinner del boton (real o demo).
    await new Promise((resolve) => setTimeout(resolve, 300))

    let res
    try {
      res = await loginUser({ identifier, password })
    } catch {
      return {
        ok: false,
        error: 'Credenciales incorrectas. Revisá el usuario y la contraseña.',
      }
    }

    if (res.error) {
      return { ok: false, error: res.error }
    }

    const u = res.data?.user ?? {}

    setUser({
      id: u.id ?? null,
      name: u.name ?? identifier,
      username: u.username ?? identifier,
      email: u.email ?? null,
      role: u.role,
      token: res.data?.access_token ?? '',
      tenantId: u.tenantId ?? null,
    })

    return { ok: true, mock: Boolean(res.mock ?? false) }
  }

  /* -------------------- logout: cierra la sesion ------------------ */
  const logout = () => setUser(null)

  /* -------------------- ruta de inicio del rol -------------------- */
  // Usado por RequireAuth y por el redirect del home.
  const homeRoute = user ? ROLES[user.role]?.home ?? '/login' : '/login'

  /* Valores expuestos al resto de la app (memoizados para evitar renders
     innecesarios). */
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      roleLabel: user ? (ROLES[user.role]?.label ?? user.role) : '',
      login,
      logout,
      homeRoute,
    }),
    [user, homeRoute],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* --------------------------------------------------------------------------
 * useAuth
 * Hook de acceso al contexto. Se importa en cualquier componente asi:
 *   import { useAuth } from '../context/AuthContext'
 *   const { user, logout } = useAuth()
 * ------------------------------------------------------------------------ */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return context
}