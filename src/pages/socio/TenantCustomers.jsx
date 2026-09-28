/* ==========================================================================
 * TenantCustomers.jsx (Socio)
 * --------------------------------------------------------------------------
 * Vista de los customers que le escribieron a un tenant.
 *
 * - Muestra la lista de conversaciones (avatar, nombre, ultimo mensaje,
 *   mensajes sin leer, hora).
 * - Al hacer click en un customer se abre el chat estilo WhatsApp
 *   (ChatView reutilizable) en /socio/tenants/:id/chats/:customerId.
 *
 * Ruta: /socio/tenants/:tenantId
 * ========================================================================== */

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquareText } from 'lucide-react'

import Badge from '../../components/ui/Badge'
import DemoBanner from '../../components/ui/DemoBanner'
import { fetchCustomers, fetchTenant } from '../../services/api'

export default function TenantCustomers() {
  const { tenantId } = useParams()
  const navigate = useNavigate()

  const [tenant, setTenant] = useState(null)
  const [customers, setCustomers] = useState([])
  const [mock, setMock] = useState(false)
  const [loading, setLoading] = useState(true)

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
      console.error('[TenantCustomers] No se pudo cargar:', err?.message || err)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [tenantId])

  const totalUnread = customers.reduce((acc, c) => acc + (c.unread ?? 0), 0)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Cabecera con datos del tenant */}
      <div>
        <Link
          to="/socio/tenants"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a tenants
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {tenant?.name_business ?? '…'}
          </h1>
          {tenant?.is_active ? (
            <Badge color="green" dot>
              Activo
            </Badge>
          ) : (
            <Badge color="red" dot>
              Inactivo
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {tenant ? `${tenant.industryLabel} · ${tenant.display_phone_number}` : ''}
        </p>
      </div>

      <DemoBanner
        mock={mock}
        message="Estos customers y sus chats son ficticios para probar la interfaz."
      />

      {/* Lista de conversaciones */}
      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Cargando conversaciones…</p>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <MessageSquareText className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">Aún no hay conversaciones.</p>
          <p className="text-xs text-slate-400">
            Cuando los clientes le escriban al negocio, aparecerán acá.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {customers.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => navigate(`/socio/tenants/${tenantId}/chats/${customer.id}`)}
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
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalUnread > 0 && (
        <p className="text-right text-xs text-slate-400">
          {totalUnread} mensaje{totalUnread === 1 ? '' : 's'} sin leer en total.
        </p>
      )}
    </div>
  )
}