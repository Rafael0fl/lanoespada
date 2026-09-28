/* ==========================================================================
 * TenantsList.jsx (Socio)
 * --------------------------------------------------------------------------
 * Seccion "Ver Tenants".
 *
 * - Filtro "Míos" / "Todos" (míos = tenants del socio logueado).
 * - Lista de tenants con boton de configuracion (abre TenantConfigModal).
 * - Al hacer click en un tenant se navega a sus customers (/socio/tenants/:id)
 *   y desde ahi al chat estilo WhatsApp.
 *
 * Ruta: /socio/tenants
 * ========================================================================== */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, MessageSquareText, Settings2, Store } from 'lucide-react'

import Badge from '../../components/ui/Badge'
import DemoBanner from '../../components/ui/DemoBanner'
import TenantConfigModal from '../../components/tenants/TenantConfigModal'
import { useAuth } from '../../context/AuthContext'
import { INDUSTRIES } from '../../data/mockBackend'
import { fetchTenants } from '../../services/api'

const SCOPE_OPTIONS = [
  { key: 'mios', label: 'Míos' },
  { key: 'todos', label: 'Todos' },
]

const industryEmoji = (key) => INDUSTRIES.find((i) => i.key === key)?.emoji ?? '🏢'

export default function TenantsList() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [scope, setScope] = useState('mios')
  const [search, setSearch] = useState('')
  const [tenants, setTenants] = useState([])
  const [mock, setMock] = useState(false)
  const [loading, setLoading] = useState(true)
  const [configTarget, setConfigTarget] = useState(null)

  const socio = user?.username ?? ''

  useEffect(() => {
    let alive = true
    fetchTenants({ scope, socio }).then(({ data, mock: isMock }) => {
      if (!alive) return
      setTenants(Array.isArray(data) ? data : [])
      setMock(isMock)
      setLoading(false)
    }).catch((err) => {
      if (!alive) return
      console.error('[TenantsList] No se pudo cargar:', err?.message || err)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [scope, socio])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tenants
    return tenants.filter(
      (t) =>
        t.name_business?.toLowerCase().includes(q) ||
        (t.industryLabel ?? '').toLowerCase().includes(q),
    )
  }, [tenants, search])

  const applyPatch = (updated) => {
    setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ver Tenants</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tus negocios registrados. Entrá para ver sus conversaciones.
          </p>
        </div>

        {/* Filtro Míos / Todos */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                // Evita quedarse cargando si el filtro ya estaba activo
                // (setScope no cambia nada y el fetch no se vuelve a ejecutar).
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
      </div>

      <DemoBanner mock={mock} />

      {/* Buscador */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre o industria…"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />

      {/* Lista de tenants */}
      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Cargando tenants…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Store className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No hay tenants en esta vista.</p>
          <p className="text-xs text-slate-400">
            {scope === 'mios'
              ? 'Todavía no registraste negocios. Usá la sección "Añadir Tenant".'
              : 'No hay negocio registrados todavía.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((tenant) => (
            <li key={tenant.id}>
              <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md">
                {/* Cuerpo clickeable: abre los customers del tenant */}
                <button
                  type="button"
                  onClick={() => navigate(`/socio/tenants/${tenant.id}`)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                    {industryEmoji(tenant.industry)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {tenant.name_business}
                      </p>
                      {tenant.is_active ? (
                        <Badge color="green" dot>
                          Activo
                        </Badge>
                      ) : (
                        <Badge color="red" dot>
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {tenant.industryLabel} · {tenant.display_phone_number} ·{' '}
                      {tenant.customers_count ?? tenant.customers?.length ?? 0} customers
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
                </button>

                {/* Boton de configuracion */}
                <button
                  type="button"
                  onClick={() => setConfigTarget(tenant)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-brand-400 hover:text-brand-600"
                  aria-label={`Configurar ${tenant.name_business}`}
                  title="Configurar"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <MessageSquareText className="h-3.5 w-3.5" />
        Hacé click en un tenant para ver sus conversaciones con customers.
      </p>

      {configTarget && (
        <TenantConfigModal
          tenant={configTarget}
          onClose={() => setConfigTarget(null)}
          onSaved={applyPatch}
        />
      )}
    </div>
  )
}