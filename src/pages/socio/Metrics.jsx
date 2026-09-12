/* ==========================================================================
 * Metrics.jsx (Socio)
 * --------------------------------------------------------------------------
 * Estadisticas de negocios para el rol 'socio' (vendedor).
 * Muestra mensajes consumidos (dia/semana/mes) y tokens gastados por Gemini.
 *
 * Ruta: /socio/metrics
 *
 * Los datos vienen de TENANTS (mock). En el futuro esto se resuelve con un
 * endpoint del backend tipo GET /v1/socio/metrics.
 * ========================================================================== */

import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  MessageSquareText,
  Sparkles,
} from 'lucide-react'

import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { TENANTS } from '../../data/mockData'

// Suma una metrica de todos los tenants (ej: messages.today).
const sumMetric = (path) =>
  TENANTS.reduce((acc, tenant) => acc + tenant.metrics[path[0]][path[1]], 0)

export default function Metrics() {
  // Totales agregados de todos los negocios del vendedor.
  const totals = {
    messagesToday: sumMetric(['messages', 'today']),
    messagesWeek: sumMetric(['messages', 'week']),
    messagesMonth: sumMetric(['messages', 'month']),
    tokensMonth: sumMetric(['tokens', 'month']),
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Métricas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consumo de mensajes y tokens de tus negocios registrados.
        </p>
      </div>

      {/* Tarjetas de consumo de mensajes (dia / semana / mes) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Mensajes hoy"
          value={totals.messagesToday.toLocaleString('es-AR')}
          hint="Mensajes procesados en el día"
          icon={MessageSquareText}
          accent="text-brand-600"
        />
        <StatCard
          label="Mensajes esta semana"
          value={totals.messagesWeek.toLocaleString('es-AR')}
          hint="Últimos 7 días"
          icon={CalendarDays}
          accent="text-sky-600"
        />
        <StatCard
          label="Mensajes este mes"
          value={totals.messagesMonth.toLocaleString('es-AR')}
          hint="Últimos 30 días"
          icon={CalendarDays}
          accent="text-violet-600"
        />
        <StatCard
          label="Tokens Gemini (mes)"
          value={totals.tokensMonth.toLocaleString('es-AR')}
          hint="Costo estimado de IA"
          icon={Sparkles}
          accent="text-amber-600"
        />
      </div>

      {/* Desglose por negocio */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Building2 className="h-4 w-4 text-brand-600" />
              Desglose por negocio
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Consumo individual de cada negocio a tu cargo.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Negocio
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Hoy
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Semana
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mes
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tokens (mes)
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Clientes
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tendencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TENANTS.map((tenant) => {
                const today = tenant.metrics.messages.today
                const variance = today === 0 ? 0 : Math.round((today / 100) * 10)
                return (
                  <tr key={tenant.id} className="bg-white">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{tenant.name_business}</p>
                      <p className="text-xs text-slate-400">{tenant.metrics.customers} clientes activos</p>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                      {today.toLocaleString('es-AR')}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700">
                      {tenant.metrics.messages.week.toLocaleString('es-AR')}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700">
                      {tenant.metrics.messages.month.toLocaleString('es-AR')}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700">
                      {tenant.metrics.tokens.month.toLocaleString('es-AR')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{tenant.metrics.customers}</td>
                    <td className="px-5 py-3.5">
                      {tenant.is_active ? (
                        <Badge color={variance >= 8 ? 'green' : 'amber'}>
                          <span className="flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            +{variance}%
                          </span>
                        </Badge>
                      ) : (
                        <Badge color="red">
                          <span className="flex items-center gap-1">
                            <ArrowDownRight className="h-3 w-3" />
                            Inactivo
                          </span>
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}