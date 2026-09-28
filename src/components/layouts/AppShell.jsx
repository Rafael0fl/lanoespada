/* ==========================================================================
 * AppShell.jsx
 * --------------------------------------------------------------------------
 * Layout "cascarón" compartido por todas las vistas autenticadas.
 *
 * Responsabilidades:
 *   - Sidebar de navegación en desktop (oculto en pantallas chicas).
 *   - Barra de navegación inferior en mobile (UX mobile-first para el rol
 *     'tenant', pero disponible para todos los roles).
 *   - Header superior con el rol y los datos del usuario + botón Salir.
 *   - Renderiza el contenido de la pagina hija con <Outlet />.
 *
 * Props:
 *   - navItems : arreglo con { to, label, icon } para pintar los links.
 *
 * El contenido de cada ruta se inyecta por React Router v7 (Outlet).
 * ========================================================================== */

import { LogOut, Sword } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

export default function AppShell({ navItems }) {
  const { user, roleLabel, logout } = useAuth()

  /* helpers que devuelven las clases CSS para NavLink activo */
  const desktopLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-600 text-white shadow'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`

  const mobileLinkClass = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
      isActive ? 'text-brand-600' : 'text-slate-400'
    }`

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ============================================================
          SIDEBAR (desktop). Visibilidad: md:hidden/md:flex
          ============================================================ */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-900 md:flex">
        {/* Marca */}
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
            <Sword className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">La No Espada</p>
            <p className="text-[11px] text-slate-400">B2B SaaS · WhatsApp IA</p>
          </div>
        </div>

        {/* Rol actual */}
        <div className="mx-4 mb-4 rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-300">
          Panel: <span className="font-semibold text-brand-400">{roleLabel}</span>
        </div>

        {/* Navegacion del rol */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Usuario + Salir */}
        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-3">
            {/* Avatar con la inicial del nombre */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/20 text-sm font-bold text-brand-400">
              {user?.name?.[0] ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ============================================================
          HEADER (mobile). Solo visible en pantallas chicas.
          ============================================================ */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Sword className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">La No Espada</span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Salir
        </button>
      </header>

      {/* ============================================================
          CONTENIDO PRINCIPAL + padding para no pisar la barra inferior
          ============================================================ */}
      <main className="px-4 pb-24 pt-6 md:ml-64 md:px-8 md:pb-10 md:pt-8">
        <Outlet />
      </main>

      {/* ============================================================
          NAVEGACION INFERIOR (mobile). Con layout-dashboard para que
          el primer item siempre sea "Panel".
          ============================================================ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === navItems[0].to}
            className={mobileLinkClass}
          >
            <item.icon className="h-5 w-5" />
            <span className="line-clamp-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}