/* ==========================================================================
 * TenantMetrics.jsx (Cliente)
 * --------------------------------------------------------------------------
 * Seccion "Metricas" del tenant. Filtro por rango (hoy / semana / mes / año)
 * con 2 cards de resumen (clientes atendidos y mensajes respondidos) y una
 * lista por cliente con la cantidad de mensajes que escribió en el rango.
 *
 * Ruta: /dashboard/metrics
 * ========================================================================== */

import { useEffect, useState } from 'react'
import { Users, MessageSquareText } from 'lucide-react'

import DemoBanner from '../../components/ui/DemoBanner'
import { useAuth } from '../../context/AuthContext'
import { fetchTenantMetrics } from '../../services/api'

const RANGE_OPTIONS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'anio', label: 'Año' },
]

export default function TenantMetrics() {
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''

  const [range, setRange] = useState('hoy')
  const [metrics, setMetrics] = useState({ rows: [], atendidos: 0, respondidos: 0 })
  const [mock, setMock] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchTenantMetrics(tenantId, range).then((res) => {
      if (!alive) return
      setMetrics(res.data ?? { rows: [], atendidos: 0, respondidos: 0 })
      setMock(res.mock)
      setLoading(false)
    }).catch((err) => {
      if (!alive) return
      console.error('[TenantMetrics] No se pudo cargar:', err?.message || err)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [tenantId, range])

  const { rows, atendidos, respondidos } = metrics

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Métricas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Atención a tus clientes en el período seleccionado.
        </p>
      </div>

      <DemoBanner mock={mock} message="Las métricas son ficticias para probar la interfaz." />

      {/* Filtro de rango */}
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              if (range !== opt.key) setRange(opt.key)
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              range === opt.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Cargando métricas…</p>
      ) : (
        <>
          {/* Cards de resumen */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Users className="h-5 w-5" />
              </span>
              <span className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
                {atendidos}
              </span>
              <span className="mt-1 text-sm font-medium text-slate-500">
                Se atendieron clientes
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <MessageSquareText className="h-5 w-5" />
              </span>
              <span className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
                {respondidos}
              </span>
              <span className="mt-1 text-sm font-medium text-slate-500">
                Se respondieron mensajes
              </span>
            </div>
          </div>

          {/* Lista cliente - mensajes */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Por cliente</h2>
              <span className="text-xs text-slate-400">{rows.length} con mensajes</span>
            </div>
            {rows.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">
                Nadie escribió en este período.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <li
                    key={row.customerId}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${row.avatarColor ?? 'bg-slate-400'}`}
                    >
                      {row.initials}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                      {row.name_user}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                      <MessageSquareText className="h-3.5 w-3.5 text-slate-300" />
                      {row.messages} {row.messages === 1 ? 'mensaje' : 'mensajes'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}