/* ==========================================================================
 * AuthContext.jsx
 * --------------------------------------------------------------------------
 * Contexto de autenticacion de la aplicacion.
 *
 * Este contexto simula el login del backend (que aun no existe). Guarda en
 * localStorage el usuario y un token falso para que la sesion sobreviva a
 * un refresh del navegador.
 *
 * Lo que se guarda por usuario:
 *   { name, email, role, token, tenantId? }
 *
 * Funciones expuestas (via useAuth):
 *   - user            -> objeto del usuario actual (o null si no logueado).
 *   - isAuthenticated -> booleano derivado de 'user'.
 *   - login({email,password}) -> valida contra DEMO_ACCOUNTS y setea sesion.
 *                                Retorna { ok: true } o { ok: false, error }.
 *   - logout()        -> limpia la sesion.
 *
 * IMPORTANTE: cuando el backend tenga /v1/auth/login, este provider se debe
 * conectar a un fetch a esa ruta y guardar el token real + el rol real.
 * ========================================================================== */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { DEMO_ACCOUNTS, ROLES } from '../data/mockData'

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
   * Simula la autenticacion comparando contra las cuentas demo.
   * Cuando exista el backend real, reemplazar por:
   *   const res = await fetch('/v1/auth/login', { method: 'POST', ... })
   * y tomar role/token de la respuesta.
   * ----------------------------------------------------------------- */
  const login = async ({ email, password }) => {
    // Pequeno delay artificial para que se vea el spinner del boton.
    await new Promise((resolve) => setTimeout(resolve, 600))

    const account = DEMO_ACCOUNTS.find(
      (acc) =>
        acc.email.toLowerCase() === email.trim().toLowerCase() &&
        acc.password === password,
    )

    if (!account) {
      return {
        ok: false,
        error: 'Credenciales incorrectas. Revisá el email y la contraseña.',
      }
    }

    // Token falso para simular el JWT que devolveria el backend.
    const fakeToken = `jwt_demo_${account.role}_${Date.now()}`

    setUser({
      name: account.name,
      email: account.email,
      role: account.role,
      token: fakeToken,
      tenantId: account.tenantId ?? null,
    })

    return { ok: true }
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