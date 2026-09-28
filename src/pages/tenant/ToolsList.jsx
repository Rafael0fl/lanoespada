/* ==========================================================================
 * ToolsList.jsx (Cliente)
 * --------------------------------------------------------------------------
 * Seccion "Configuracion" del tenant. Muestra las features que el socio le
 * habilitó al negocio, cada una como una herramienta independiente.
 *
 * Al entrar a una herramienta, el tenant edita SOLO esa feature y el cambio
 * se envía al backend para que quede guardada en la base de datos.
 *
 * Ruta: /dashboard/settings
 * ========================================================================== */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Wrench, Info } from 'lucide-react'

import DemoBanner from '../../components/ui/DemoBanner'
import { useAuth } from '../../context/AuthContext'
import { FEATURES, isFeatureEnabled } from '../../data/mockBackend'
import { fetchTenant } from '../../services/api'

export default function ToolsList() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const tenantId = user?.tenantId ?? ''

  const [tenant, setTenant] = useState(null)
  const [mock, setMock] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchTenant(tenantId).then((res) => {
      if (!alive) return
      setTenant(res.data)
      setMock(res.mock)
      setLoading(false)
    }).catch((err) => {
      if (!alive) return
      console.error('[ToolsList] No se pudo cargar:', err?.message || err)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [tenantId])

  const enabled = FEATURES.filter((f) => isFeatureEnabled(tenant?.features, f.key))

  if (loading) {
    return <p className="py-10 text-center text-sm text-slate-400">Cargando configuración…</p>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">
          Estas son las funciones que tu socio habilitó para tu negocio.
        </p>
      </div>

      <DemoBanner
        mock={mock}
        message="Los cambios se envían al servidor y quedan disponibles desde este panel."
      />

      {enabled.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Wrench className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            Aún no tenés funciones habilitadas.
          </p>
          <p className="text-xs text-slate-400">
            Tu socio comercial puede activarlas desde su panel.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {enabled.map((tool) => (
            <li key={tool.key}>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/settings/${tool.key}`)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                  {tool.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    {tool.label}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {tool.description}
                  </span>
                </span>
                <span className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                  Editar
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-1.5 text-xs text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        ¿Necesitás una función nueva? Consultá a tu socio comercial.
      </p>
    </div>
  )
}