/* ==========================================================================
 * DashboardStats.jsx (Cliente)
 * --------------------------------------------------------------------------
 * Vista simple y mobile-first para el rol 'cliente' (el negocio).
 *
 * Ruta: /dashboard/stats
 *
 * Muestra:
 *   1. Tarjetas con metricas basicas de uso (mensajes hoy/semana/mes).
 *   2. Listado de clientes que escribieron por WhatsApp, con su ultimo
 *      mensaje y estado de actividad.
 *
 * Los datos salen del tenant del usuario logueado (mock por ahora; en el
 * futuro vendran de GET /v1/tenants/:id/metrics y /v1/tenants/:id/customers).
 * ========================================================================== */

import { Search, UserRound, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import Badge from '../../components/ui/Badge'
import { useAuth } from '../../context/AuthContext'
import { MOCK_CUSTOMERS, TENANTS } from '../../data/mockData'

export default function DashboardStats() {
  const { user } = useAuth()

  // Como el login demon el usuario con role 'cliente' apunta a un tenant,
  // tomamos esos datos. Si no se encuentra, usamos el primero (fallback).
  const tenant =
    TENANTS.find((t) => t.id === user?.tenantId) ?? TENANTS[0]

  // Estado del buscador de clientes.
  const [query, setQuery] = useState('')

  // Filtra clientes por nombre o numero de WhatsApp.
  const filteredCustomers = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return MOCK_CUSTOMERS
    return MOCK_CUSTOMERS.filter(
      (customer) =>
        customer.name_user.toLowerCase().includes(term) ||
        customer.wa_id.toLowerCase().includes(term),
    )
  }, [query])

  // Total de mensajes recibidos hoy (del tenant mock).
  const messagesToday = tenant.metrics.messages.today

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ============================================================
          Saludo y datos del negocio
          ============================================================ */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-lg">
        <p className="text-sm text-brand-100">Hola, {user?.name?.split(' ')[0]}</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
          {tenant.name_business}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge color="green" dot>
            {tenant.is_active ? 'Bot activo' : 'Bot inactivo'}
          </Badge>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
            {tenant.display_phone_number}
          </span>
        </div>
      </div>

      {/* ============================================================
          1) Metricas basicas de uso
          ============================================================ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hoy', value: tenant.metrics.messages.today.toLocaleString('es-AR') },
          { label: 'Semana', value: tenant.metrics.messages.week.toLocaleString('es-AR') },
          { label: 'Mes', value: tenant.metrics.messages.month.toLocaleString('es-AR') },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
          >
            <p className="text-xs font-medium text-slate-500">{metric.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{metric.value}</p>
            <p className="text-[10px] text-slate-400">mensajes</p>
          </div>
        ))}
      </div>

      {/* ============================================================
          2) Listado de clientes
          ============================================================ */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="h-4 w-4 text-brand-600" />
            Clientes que escribieron
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {filteredCustomers.length}
          </span>
        </div>

        {/* Buscador */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o número…"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Lista de clientes (cards apiladas, pensado para mobile) */}
        <ul className="divide-y divide-slate-100 px-4 pb-2 pt-2">
          {filteredCustomers.map((customer) => (
            <li
              key={customer.id}
              className="flex items-start gap-3 py-3.5"
            >
              {/* Avatar con iniciales */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {customer.initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {customer.name_user}
                  </p>
                  <span className="shrink-0 text-xs text-slate-400">
                    {customer.last_activity}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {customer.last_message}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  {/* Badge de actividad */}
                  <Badge color={customer.is_active ? 'green' : 'gray'} dot>
                    {customer.is_active ? 'Activo hoy' : 'Inactivo'}
                  </Badge>
                  {/* Contador de mensajes del dia */}
                  {customer.messages_today > 0 && (
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-600">
                      {customer.messages_today} mensajes hoy
                    </span>
                  )}
                </div>
              </div>

              {/* Icono de chat */}
              <UserRound className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
            </li>
          ))}

          {filteredCustomers.length === 0 && (
            <li className="py-10 text-center text-sm text-slate-400">
              No se encontraron clientes con ese filtro.
            </li>
          )}
        </ul>

        {/* Pie informativo */}
        <div className="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-400">
          {messagesToday.toLocaleString('es-AR')} mensajes recibidos hoy en total
        </div>
      </section>
    </div>
  )
}