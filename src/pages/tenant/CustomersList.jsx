/* ==========================================================================
 * CustomersList.jsx (Cliente)
 * --------------------------------------------------------------------------
 * Seccion "Ver clientes" del tenant. Es la lista de customers del propio
 * negocio (igual que la del socio, pero SIN poder cambiar de tenant).
 *
 * Al hacer click en un customer se abre el chat estilo WhatsApp (ChatView).
 *
 * Ruta: /dashboard/customers
 * ========================================================================== */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquareText, Search, Users } from 'lucide-react'

import DemoBanner from '../../components/ui/DemoBanner'
import { useAuth } from '../../context/AuthContext'
import { INDUSTRIES } from '../../data/mockBackend'
import { fetchCustomers, fetchTenant } from '../../services/api'

const industryEmoji = (key) => INDUSTRIES.find((i) => i.key === key)?.emoji ?? '🏢'

export default function CustomersList() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const tenantId = user?.tenantId ?? ''

  const [tenant, setTenant] = useState(null)
  const [customers, setCustomers] = useState([])
  const [mock, setMock] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([fetchTenant(tenantId), fetchCustomers(tenantId)]).then(
      ([tenantRes, customersRes]) => {
        if (!alive) return
        setTenant(tenantRes.data)
        setCustomers(Array.isArray(customersRes.data) ? customersRes.data : [])
        setMock(tenantRes.mock || customersRes.mock)
        setLoading(false)
      },
    ).catch((err) => {
      if (!alive) return
      console.error('[CustomersList] No se pudo cargar:', err?.message || err)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [tenantId])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return customers
    return customers.filter(
      (c) =>
        c.name_user?.toLowerCase().includes(term) ||
        (c.wa_id ?? '').toLowerCase().includes(term),
    )
  }, [customers, query])

  if (loading) {
    return <p className="py-10 text-center text-sm text-slate-400">Cargando clientes…</p>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Encabezado del negocio */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tus clientes</h1>
        <p className="mt-1 text-sm text-slate-500">
          {tenant
            ? `${industryEmoji(tenant.industry)} ${tenant.name_business} · ${tenant.display_phone_number}`
            : 'Cargando negocio…'}
        </p>
      </div>

      <DemoBanner
        mock={mock}
        message="Estos customers y sus chats son ficticios para probar la interfaz."
      />

      {/* Buscador */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o número…"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {/* Lista de conversaciones */}
      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">Aún no hay clientes.</p>
          <p className="text-xs text-slate-400">
            Cuando te escriban por WhatsApp, aparecerán acá.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-600">No se encontraron clientes con ese filtro.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filtered.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
              >
                {/* Avatar */}
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${customer.avatarColor ?? 'bg-slate-400'}`}
                >
                  {customer.initials}
                </span>
                {/* Info */}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {customer.name_user}
                    </span>
                    {customer.unread > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                        {customer.unread}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {customer.last_time_label ?? ''}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {customer.last_message ?? ''}
                  </span>
                </span>
                <MessageSquareText className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <MessageSquareText className="h-3.5 w-3.5" />
        Hacé click en un cliente para abrir la conversación de WhatsApp.
      </p>
    </div>
  )
}