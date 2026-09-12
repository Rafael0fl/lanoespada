/* ==========================================================================
 * DashboardSettings.jsx (Cliente)
 * --------------------------------------------------------------------------
 * Configuracion del negocio para el rol 'cliente' (mobile-first).
 *
 * Ruta: /dashboard/settings
 *
 * Regla clave: el formulario MUESTRA UNICAMENTE las funciones (features)
 * que el socio le dejo habilitadas al negocio en su JSONB (tenant.features).
 * El cliente puede:
 *   - Editar los valores de esas funciones (rellenados con tenant.config).
 *   - Activar o desactivar temporalmente cada funcion habilitada.
 *   - Guardar los cambios (simulado, con toast).
 *
 * No puede activar funciones que el socio no le habilito.
 * ========================================================================== */

import { useMemo, useState } from 'react'
import { Info, Settings2, ShieldAlert, Store } from 'lucide-react'

import FeatureField from '../../components/forms/FeatureField'
import Badge from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { INDUSTRY_SCHEMA, TENANTS } from '../../data/mockData'

export default function DashboardSettings() {
  const { user } = useAuth()
  const toast = useToast()

  // Negocio al que pertenece el usuario logueado.
  const tenant = TENANTS.find((t) => t.id === user?.tenantId) ?? TENANTS[0]

  // Schema del rubro del negocio (definicion de campos por feature).
  const industrySchema = INDUSTRY_SCHEMA[tenant.industry]

  // Lista de features habilitadas por el socio (mismas del JSONB).
  const enabledFeatureKeys = tenant.features

  /* ------------------------------------------------------------------
   * Estado editable. Inicializado a partir de tenant.config (JSONB).
   * Se arma solo con las funciones habilitadas.
   * ----------------------------------------------------------------- */
  const [config, setConfig] = useState(() => {
    const initial = {}
    enabledFeatureKeys.forEach((key) => {
      // toggleOnly -> el JSONB guarda true; si ya viene, lo dejamos.
      initial[key] = tenant.config?.[key] ?? true
    })
    return initial
  })

  // Variaciones guardadas para comparar y toggles de activacion por feature.
  const [savedAt, setSavedAt] = useState(null)

  /* ------------------------------------------------------------------
   * Cambia el valor de un campo de una funcion.
   * ----------------------------------------------------------------- */
  const updateFeature = (featureKey, nextValue) => {
    setConfig((prev) => ({ ...prev, [featureKey]: nextValue }))
  }

  /* ------------------------------------------------------------------
   * Toggle: activa/desactiva temporalmente una funcion para el negocio.
   * - Feature tipo boolean (toggleOnly): se guarda true/false directo.
   * - Feature con datos (objeto): se agrega/quita el flag __active sin
   *   perder la informacion cargada.
   * ----------------------------------------------------------------- */
  const toggleFeature = (featureKey) => {
    setConfig((prev) => {
      const current = prev[featureKey]

      if (typeof current === 'boolean') {
        return { ...prev, [featureKey]: !current }
      }

      // Para objetos: leemos si esta OFF y lo invertimos.
      const isOff = Boolean(current?.__active)
      // Copia del objeto sin el flag __active (no mutamos el estado).
      const rest = { ...(current ?? {}) }
      delete rest.__active
      return { ...prev, [featureKey]: { __active: !isOff, ...rest } }
    })
  }

  // Indica si un feature esta apagado temporalmente (para el switch).
  const isFeatureOff = (featureKey) => {
    const current = config[featureKey]
    if (typeof current === 'boolean') return !current
    return Boolean(current?.__active)
  }

  /* ------------------------------------------------------------------
   * Payload que se enviaria al backend en un PUT /v1/tenants/:id.
   * ----------------------------------------------------------------- */
  const buildPayload = useMemo(() => {
    const metadata = {}
    enabledFeatureKeys.forEach((key) => {
      metadata[key] = config[key]
    })
    return {
      tenant_id: tenant.id,
      name_business: tenant.name_business,
      features: Object.fromEntries(enabledFeatureKeys.map((k) => [k, true])),
      metadata_: metadata,
    }
  }, [config, enabledFeatureKeys, tenant])

  /* ------------------------------------------------------------------
   * Guardado simulado de cambios.
   * ----------------------------------------------------------------- */
  const handleSave = (e) => {
    e.preventDefault()
    console.log('Payload de configuracion:', buildPayload)
    setSavedAt(new Date().toLocaleString('es-AR'))
    toast.success('Configuración guardada correctamente.')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Encabezado + datos basicos */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/10">
            <Store className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {tenant.name_business}
            </h1>
            <p className="text-sm text-slate-500">
              {industrySchema.label} · {tenant.display_phone_number}
            </p>
          </div>
        </div>

        {savedAt && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
            Última actualización: {savedAt}
          </p>
        )}
      </div>

      {/* Aviso de que solo se muestran las funciones habilitadas */}
      <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <p className="text-sm text-sky-800">
          Estas son las funciones que tu asesor comercial habilitó para tu
          negocio. El asistente las aplica automáticamente en las
          conversaciones de WhatsApp.
        </p>
      </div>

      {/* Formulario dinamico (solo features habilitados) */}
      <form onSubmit={handleSave} className="space-y-4">
        {industrySchema.features
          .filter((feature) => enabledFeatureKeys.includes(feature.key))
          .map((feature) => {
            const off = isFeatureOff(feature.key)
            return (
              <section
                key={feature.key}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                  off ? 'border-slate-200 opacity-60' : 'border-slate-200'
                }`}
              >
                {/* Titulo + switch activo/inactivo */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Settings2 className="h-4 w-4 text-brand-600" />
                      {feature.label}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">{feature.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!off}
                    onClick={() => toggleFeature(feature.key)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      off ? 'bg-slate-300' : 'bg-brand-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        off ? 'left-0.5' : 'left-[22px]'
                      }`}
                    />
                  </button>
                </div>

                {/* Campos de la funcion */}
                {!off &&
                  feature.fields.map((field) => (
                    <label
                      key={field.key}
                      className="mt-4 block last:mb-0 [&:has(>span)]:cursor-pointer"
                    >
                      {/* El checkbox ya muestra su propio label dentro del
                          FeatureField, asi evitamos duplicar el texto. */}
                      {field.type !== 'checkbox' && (
                        <span className="mb-1.5 block text-xs font-medium text-slate-600">
                          {field.label}
                        </span>
                      )}
                      <FeatureField
                        field={field}
                        value={
                          typeof config[feature.key] === 'object' &&
                          config[feature.key] !== null
                            ? config[feature.key][field.key]
                            : undefined
                        }
                        onChange={(nextValue) =>
                          updateFeature(feature.key, {
                            ...(typeof config[feature.key] === 'object'
                              ? config[feature.key]
                              : {}),
                            [field.key]: nextValue,
                          })
                        }
                      />
                    </label>
                  ))}

                {off && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Función pausada para tu negocio.
                  </p>
                )}
              </section>
            )
          })}

        {/* Boton guardar */}
        <button
          type="submit"
          className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
        >
          Guardar cambios
        </button>
      </form>

      {/* Hint de como funciona */}
      <p className="pb-2 text-center text-xs text-slate-400">
        <Badge color="slate">¿Necesitás más funciones? Consultá a tu asesor comercial.</Badge>
      </p>
    </div>
  )
}