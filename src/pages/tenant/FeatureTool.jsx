/* ==========================================================================
 * FeatureTool.jsx (Cliente)
 * --------------------------------------------------------------------------
 * Editor de UNA feature ("herramienta") del tenant. Cada feature tiene su
 * propio formulario (FEATURE_CONTENT_SCHEMA) y al guardar se envía SOLO esa
 * modificación al backend, para que quede guardada en la base de datos.
 *
 * Ruta: /dashboard/settings/:featureKey
 * ========================================================================== */

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, AlertTriangle, Wrench } from 'lucide-react'

import FeatureField from '../../components/forms/FeatureField'
import ScheduleForm from '../../components/forms/ScheduleForm'
import DemoBanner from '../../components/ui/DemoBanner'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import {
  FEATURE_BY_KEY,
  FEATURE_CONTENT_SCHEMA,
  emptyFeatureContent,
  isFeatureEnabled,
} from '../../data/mockBackend'
import { fetchTenant, updateTenant } from '../../services/api'

export default function FeatureTool() {
  const { user } = useAuth()
  const { featureKey } = useParams()

  const tenantId = user?.tenantId ?? ''

  const [tenant, setTenant] = useState(null)
  const [mock, setMock] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    fetchTenant(tenantId).then((res) => {
      if (!alive) return
      setTenant(res.data)
      setMock(res.mock)
      setLoading(false)
    }).catch((err) => {
      if (!alive) return
      console.error('[FeatureTool] No se pudo cargar:', err?.message || err)
      setError(err?.message || 'Error al cargar')
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [tenantId])

  if (error) {
    return (
      <p className="py-10 px-6 text-center text-sm text-rose-500">
        No se pudo cargar la configuración: {error}
      </p>
    )
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-slate-400">Cargando herramienta…</p>
  }

  const schema = FEATURE_CONTENT_SCHEMA[featureKey]
  const feature = FEATURE_BY_KEY[featureKey]

  /* Feature inválida o no habilitada para este negocio. */
  if (!schema || !feature || !isFeatureEnabled(tenant?.features, feature.key)) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <Wrench className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          Esta herramienta no está disponible para tu negocio.
        </p>
        <Link
          to="/dashboard/settings"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Configuración
        </Link>
      </div>
    )
  }

  return (
    <ToolForm
      key={featureKey}
      tenantId={tenantId}
      feature={feature}
      schema={schema}
      initial={tenant?.config?.[featureKey]}
      mock={mock}
      tenant={tenant}
    />
  )
}

function ToolForm({ tenantId, feature, schema, initial, mock, tenant }) {
  const toast = useToast()
  const navigate = useNavigate()

  /* Si la feature es un horario (schedule), se renderiza como card propia y
     su contenido guardado es el valor del schedule directamente. */
  const scheduleField =
    schema.fields.length === 1 && schema.fields[0].type === 'schedule'
      ? schema.fields[0]
      : null

  const [form, setForm] = useState(() =>
    scheduleField
      ? { [scheduleField.key]: initial ?? 'fulltime' }
      : {
          ...emptyFeatureContent(feature.key),
          ...(initial ?? {}),
        },
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Para horarios el contenido es el valor (string/objeto), sin wrapper.
    try {
      const content = scheduleField ? form[scheduleField.key] : form
      const res = await updateTenant(tenantId, { config: { [feature.key]: content } })
      if (res.data) {
        toast.success(`"${feature.label}" se guardó y se envió al servidor.`)
      } else {
        toast.error('No se pudo guardar. Intentá de nuevo.')
      }
    } catch (err) {
      toast.error(err?.message || 'No se pudo guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Encabezado con volver */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate('/dashboard/settings')}
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Configuración
          </button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <span className="text-2xl">{feature.icon}</span>
            {feature.label}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{schema.description}</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700 sm:inline-flex">
          <AlertTriangle className="h-3.5 w-3.5" />
          Solo editás esta función
        </span>
      </div>

      <DemoBanner
        mock={mock}
        message="Al guardar, esta modificación se envía al servidor."
      />

      {/* Formulario */}
      {scheduleField ? (
        <ScheduleForm
          title={scheduleField.title ?? feature.label}
          value={form[scheduleField.key]}
          onChange={(next) => setForm((prev) => ({ ...prev, [scheduleField.key]: next }))}
          onSave={handleSave}
          saving={saving}
        />
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {schema.fields.map((field) => (
            <div key={field.key}>
              {field.type !== 'dynamicList' && field.type !== 'objectList' && field.type !== 'stringList' && field.type !== 'multiselect' && field.type !== 'promoEventList' && field.type !== 'custom' && (
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {field.label}
                </label>
              )}
              <FeatureField
                field={['custom', 'objectList'].includes(field.type) ? { ...field, _tenant: tenant } : field}
                value={form[field.key]}
                onChange={(next) => setForm((prev) => ({ ...prev, [field.key]: next }))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard/settings')}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}