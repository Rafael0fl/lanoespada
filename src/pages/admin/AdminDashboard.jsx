/* ==========================================================================
 * AdminDashboard.jsx
 * --------------------------------------------------------------------------
 * Panel de control del rol 'admin' (ruta /admin).
 *
 * Contenido:
 *   1. Metricas globales del SaaS (tarjetas).
 *   2. Grafico simple de mensajes por dia (barras con div, sin librerias).
 *   3. Listado COMPLETO de negocios: incluye los is_hidden = true
 *      (el admin ve TODO, a diferencia de otros roles).
 *   4. Boton "Backup Manual de Base de Datos" con historial de backups
 *      (simulado con un timeout).
 * ========================================================================== */

import { useState } from 'react'
import {
  Building2,
  DatabaseBackup,
  EyeOff,
  MessageSquareText,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react'

import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { useToast } from '../../components/ui/Toast'
import { BACKUP_HISTORY, GLOBAL_METRICS, INDUSTRY_SCHEMA, TENANTS } from '../../data/mockData'

/* --------------------------------------------------------------------------
 * Helper: resuelve la etiqueta legible de un rubro desde el schema.
 * ------------------------------------------------------------------------ */
const industryLabel = (industryKey) =>
  INDUSTRY_SCHEMA[industryKey]?.label ?? industryKey

export default function AdminDashboard() {
  const toast = useToast()

  // Estado del backup manual (para simular el proceso + listado local).
  const [backingUp, setBackingUp] = useState(false)
  const [lastBackups, setLastBackups] = useState(BACKUP_HISTORY)
  const [backupFilter, setBackupFilter] = useState('all') // all | active | hidden | inactive

  /* ------------------------------------------------------------------
   * Backup manual de la base de datos.
   * En produccion esto llamaria a /v1/admin/backup (POST) en el backend.
   * ----------------------------------------------------------------- */
  const runManualBackup = () => {
    setBackingUp(true)
    setTimeout(() => {
      setBackingUp(false)
      setLastBackups((prev) => [
        {
          id: `b-manual-${Date.now()}`,
          date: new Date().toLocaleString('es-AR'),
          status: 'ok',
          size: '48.5 MB',
          manual: true,
        },
        ...prev,
      ])
      toast.success('Backup manual completado correctamente.')
    }, 1800)
  }

  /* ------------------------------------------------------------------
   * Filtros de la tabla de negocios.
   * ----------------------------------------------------------------- */
  const filteredTenants = TENANTS.filter((tenant) => {
    if (backupFilter === 'hidden') return tenant.is_hidden
    if (backupFilter === 'inactive') return !tenant.is_active
    if (backupFilter === 'active') return tenant.is_active
    return true
  })

  // Valor maximo del grafico (para escalar las barras).
  const maxMessages = Math.max(...GLOBAL_METRICS.messagesByDay.map((d) => d.value))

  return (
    <div className="space-y-6">
      {/* ============================================================
          Encabezado de la pagina
          ============================================================ */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Mi panel de control
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Visión global de la plataforma La No Espada.
        </p>
      </div>

      {/* ============================================================
          1) Metricas globales
          ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Negocios totales"
          value={GLOBAL_METRICS.totalTenants}
          hint={`${GLOBAL_METRICS.activeTenants} activos · ${GLOBAL_METRICS.hiddenTenants} oculto`}
          icon={Building2}
          accent="text-brand-600"
        />
        <StatCard
          label="Clientes únicos"
          value={GLOBAL_METRICS.totalCustomers.toLocaleString('es-AR')}
          hint="Usuarios que escribieron por WhatsApp"
          icon={Users}
          accent="text-sky-600"
        />
        <StatCard
          label="Mensajes mes"
          value={GLOBAL_METRICS.totalMessagesMonth.toLocaleString('es-AR')}
          hint="Mensajes procesados en el mes"
          icon={MessageSquareText}
          accent="text-violet-600"
        />
        <StatCard
          label="Tokens Gemini"
          value={GLOBAL_METRICS.totalTokensMonth.toLocaleString('es-AR')}
          hint="Tokens consumidos en el mes"
          icon={Sparkles}
          accent="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* ============================================================
            2) Grafico de mensajes por dia (semana)
            ============================================================ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Mensajes por día</h2>
              <p className="text-xs text-slate-500">Última semana · todos los negocios</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
              <MessageSquareText className="h-5 w-5 text-brand-600" />
            </span>
          </div>

          {/* Barras horizontales hechas con divs */}
          <div className="mt-6 space-y-3">
            {GLOBAL_METRICS.messagesByDay.map((d) => {
              const percentage = Math.round((d.value / maxMessages) * 100)
              return (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-medium text-slate-500">{d.day}</span>
                  <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
                    <div
                      className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 pr-2 transition-all"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    >
                      <span className="text-[10px] font-semibold text-white">
                        {d.value.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ============================================================
            3) Backup de base de datos
            ============================================================ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Backup de base de datos
              </h2>
              <p className="text-xs text-slate-500">
                Los backups automáticos corren a las 03:00. Podés disparar uno
                manual en cualquier momento.
              </p>
            </div>
            <button
              type="button"
              onClick={runManualBackup}
              disabled={backingUp}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {backingUp ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Generando…
                </>
              ) : (
                <>
                  <DatabaseBackup className="h-4 w-4" />
                  Backup manual
                </>
              )}
            </button>
          </div>

          {/* Historial de backups */}
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fecha
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tamaño
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Origen
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lastBackups.map((b) => (
                  <tr key={b.id} className="bg-white">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{b.date}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{b.size}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge color={b.manual ? 'amber' : 'slate'}>
                        {b.manual ? 'Manual' : 'Automático'}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge color="green" dot>
                        Exitoso
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================
          4) Listado completo de negocios (incluye is_hidden = true)
          ============================================================ */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Wallet className="h-4 w-4 text-brand-600" />
              Negocios en la plataforma
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Como administrador ves todos los negocios, incluidos los ocultos.
            </p>
          </div>

          {/* Filtros de la tabla */}
          <div className="flex gap-1.5">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'active', label: 'Activos' },
              { key: 'inactive', label: 'Inactivos' },
              { key: 'hidden', label: 'Ocultos' },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setBackupFilter(filter.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  backupFilter === filter.key
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla responsive (en mobile se convierte en tarjetas) */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Negocio
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rubro
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  WhatsApp
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mensajes (mes)
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Clientes
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className={`bg-white ${tenant.is_hidden ? 'opacity-80' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/10 text-sm font-bold text-brand-700">
                        {tenant.name_business[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium text-slate-900">
                          <span className="truncate">{tenant.name_business}</span>
                          {tenant.is_hidden && (
                            <Badge color="gray">
                              <span className="flex items-center gap-1">
                                <EyeOff className="h-3 w-3" />
                                Oculto
                              </span>
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">Ingresado el {tenant.created_at}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {industryLabel(tenant.industry)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                    {tenant.display_phone_number}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">
                    {tenant.metrics.messages.month.toLocaleString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{tenant.metrics.customers}</td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <Badge color={tenant.is_active ? 'green' : 'red'} dot>
                      {tenant.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTenants.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No hay negocios con este filtro.
          </p>
        )}
      </div>
    </div>
  )
}