/* ==========================================================================
 * Metrics.jsx (Socio)
 * --------------------------------------------------------------------------
 * Seccion "Metricas".
 *
 * - Filtro 1: "Míos" / "Todos" (tenant del socio logueado vs todos).
 * - Filtro 2 (alcance): "Hoy" / "Semana" / "Mes" / "Año".
 * - Tabla con Tenant - chats - mensajes - tokens.
 * - Grafico de barras con selector: chats | mensajes | tokens.
 *
 * Ruta: /socio/metrics
 * ========================================================================== */

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Building2,
  MessageSquareText,
  MessagesSquare,
  Sparkles,
} from 'lucide-react'

import StatCard from '../../components/ui/StatCard'
import DemoBanner from '../../components/ui/DemoBanner'
import TenantBars from '../../components/charts/TenantBars'
import { useAuth } from '../../context/AuthContext'
import { fetchMetrics } from '../../services/api'

const SCOPE_OPTIONS = [
  { key: 'mios', label: 'Míos' },
  { key: 'todos', label: 'Todos' },
]

const RANGE_OPTIONS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'anio', label: 'Año' },
]

const METRIC_OPTIONS = [
  { key: 'chats', label: 'Chats', color: 'bg-brand-600' },
  { key: 'messages', label: 'Mensajes', color: 'bg-sky-500' },
  { key: 'tokens', label: 'Tokens', color: 'bg-violet-500' },
]

const fmtTokens = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export default function Metrics() {
  const { user } = useAuth()

  const [scope, setScope] = useState('todos')
  const [range, setRange] = useState('mes')
  const [chartMetric, setChartMetric] = useState('messages')
  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState({ chats: 0, messages: 0, tokens: 0 })
  const [mock, setMock] = useState(false)
  const [loading, setLoading] = useState(true)

  const socio = user?.username ?? ''

  useEffect(() => {
    let alive = true
    fetchMetrics({ scope, socio, range }).then(({ data, mock: isMock }) => {
      if (!alive) return
      // Normaliza tanto el futuro formato del backend ({ rows, totals }) como
      // el actual de la pseudo-DB.
      const normalized = Array.isArray(data)
        ? { rows: data, totals: { chats: 0, messages: 0, tokens: 0 } }
        : data
      setRows(Array.isArray(normalized.rows) ? normalized.rows : [])
      if (normalized.totals) setTotals(normalized.totals)
      setMock(isMock)
      setLoading(false)
    }).catch((err) => {
      if (!alive) return
      console.error('[Metrics] No se pudo cargar:', err?.message || err)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [scope, socio, range])

  // Items para el grafico segun la metrica elegida.
  const chartItems = useMemo(
    () => rows.map((r) => ({ label: r.name, value: r[chartMetric] ?? 0 })),
    [rows, chartMetric],
  )

  const currentMetric = METRIC_OPTIONS.find((m) => m.key === chartMetric)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Métricas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Actividad de los negocios según alcance: chats, mensajes y consumo de tokens.
        </p>
      </div>

      <DemoBanner mock={mock} />

      {/* ================= FILTROS ================= */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtro Míos / Todos */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                // Evita quedarse cargando si el filtro ya estaba activo.
                if (scope !== opt.key) {
                  setLoading(true)
                  setScope(opt.key)
                }
              }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                scope === opt.key
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filtro Alcance */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                // Evita quedarse cargando si el filtro ya estaba activo.
                if (range !== opt.key) {
                  setLoading(true)
                  setRange(opt.key)
                }
              }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                range === opt.key
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Calculando métricas…</p>
      ) : (
        <>
          {/* ================= TARJETAS RESUMEN ================= */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Chats"
              value={totals.chats.toLocaleString('es-AR')}
              hint={`Conversaciones en el alcance seleccionado`}
              icon={MessagesSquare}
              accent="text-brand-600"
            />
            <StatCard
              label="Mensajes"
              value={totals.messages.toLocaleString('es-AR')}
              hint="Mensajes procesados por la IA"
              icon={MessageSquareText}
              accent="text-sky-600"
            />
            <StatCard
              label="Tokens"
              value={totals.tokens.toLocaleString('es-AR')}
              hint="Consumo estimado de Gemini"
              icon={Sparkles}
              accent="text-violet-600"
            />
          </div>

          {/* ================= GRAFICO DE BARRAS ================= */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <BarChart3 className="h-4 w-4 text-brand-600" />
                  Comparativa por tenant
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  ¿Qué metric querés comparar?
                </p>
              </div>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {METRIC_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setChartMetric(opt.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      chartMetric === opt.key
                        ? 'bg-white text-slate-900 shadow'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {chartItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Sin datos para el alcance seleccionado.
              </p>
            ) : (
              <TenantBars
                items={chartItems}
                color={currentMetric.color}
                format={(n) =>
                  chartMetric === 'tokens' ? fmtTokens(n) : n.toLocaleString('es-AR')
                }
              />
            )}
          </div>

          {/* ================= TABLA ================= */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
              <Building2 className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-slate-900">Detalle por tenant</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tenant
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Chats
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Mensajes
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tokens
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.tenantId ?? row.name} className="bg-white">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{row.name}</p>
                        <p className="text-xs text-slate-400">{row.industry ?? ''}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                        {row.chats.toLocaleString('es-AR')}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                        {row.messages.toLocaleString('es-AR')}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                        {fmtTokens(row.tokens)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">Sin datos.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}