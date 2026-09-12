/* ==========================================================================
 * RegisterBusiness.jsx (Socio)
 * --------------------------------------------------------------------------
 * Formulario para registrar un nuevo negocio (Tenant) por parte del rol
 * 'socio' (vendedor).
 *
 * Ruta: /socio/register
 *
 * Que hace:
 *   1. Datos basicos del negocio (nombre, telefono, rubro, estado...).
 *   2. Seleccion del rubro (industry): cambia el conjunto de features.
 *   3. Interruptores para activar/desactivar funciones del rubro
 *      (ej: habilitar inventario, promociones, obras sociales, etc.).
 *   4. Campos dinamicos por feature, que generan el objeto JSONB
 *      (metadata_ / config) que el backend guardara en la columna JSONB.
 *   5. Vista previa en vivo del JSON que se enviara al backend.
 *
 * El JSONB final combina:
 *   - features: { "obras_sociales": true, ... }   (funciones habilitadas)
 *   - metadata_: { ...datos concretos de cada funcion... }
 * ========================================================================== */

import { useMemo, useState } from 'react'
import {
  Check,
  FileCode2,
  Plus,
  Store,
  Trash2,
  BookOpen,
} from 'lucide-react'

import Badge from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { INDUSTRY_SCHEMA } from '../../data/mockData'

/* --------------------------------------------------------------------------
 * Helper: inicializa el objeto de datos de un feature con sus valores por
 * defecto segun los tipos de campo definidos en el schema.
 * ------------------------------------------------------------------------ */
const emptyConfigForFeature = (feature) => {
  const config = {}
  for (const field of feature.fields) {
    if (field.type === 'multiselect') config[field.key] = []
    else if (field.type === 'checkbox') config[field.key] = false
    else if (field.type === 'dynamicList') {
      // Una fila inicial vacia con los campos del item.
      const emptyRow = {}
      field.itemFields.forEach((itemField) => {
        emptyRow[itemField.key] = itemField.type === 'number' ? '' : ''
      })
      config[field.key] = [emptyRow]
    } else config[field.key] = '' // text | textarea | number
  }
  return config
}

/* ==========================================================================
 * Componente principal
 * ========================================================================== */
export default function RegisterBusiness() {
  const toast = useToast()

  // --- Estado de los datos basicos del formulario ---------------------
  const [form, setForm] = useState({
    name_business: '',
    display_phone_number: '',
    phone_number_id: '',
    industry: 'consultorio_medico',
    is_active: true,
    is_hidden: false,
    system_prompt: '',
  })

  // --- Estado de features habilitados + sus datos (JSONB) -------------
  const initialIndustry = INDUSTRY_SCHEMA.consultorio_medico
  const [enabledFeatures, setEnabledFeatures] = useState(
    initialIndustry.defaultEnabled,
  )
  const [featureData, setFeatureData] = useState(() => {
    // Inicializa los datos de cada feature de entrada por defecto.
    const data = {}
    initialIndustry.features.forEach((feature) => {
      data[feature.key] = emptyConfigForFeature(feature)
    })
    return data
  })

  const [errors, setErrors] = useState({})

  // Rubro actualmente seleccionado (objeto del schema).
  const currentIndustry = INDUSTRY_SCHEMA[form.industry]

  /* ------------------------------------------------------------------
   * Cambio de rubro: resetea features y datos para el nuevo schema.
   * ----------------------------------------------------------------- */
  const handleIndustryChange = (industryKey) => {
    const schema = INDUSTRY_SCHEMA[industryKey]
    setForm((prev) => ({ ...prev, industry: industryKey }))

    // Features habilitadas por defecto para ese rubro.
    setEnabledFeatures(schema.defaultEnabled)

    // Se regeneran todos los datos (JSONB) para el rubro nuevo.
    const data = {}
    schema.features.forEach((feature) => {
      data[feature.key] = emptyConfigForFeature(feature)
    })
    setFeatureData(data)
    setErrors({})
  }

  /* ------------------------------------------------------------------
   * Activa/desactiva un feature (interruptor).
   * ----------------------------------------------------------------- */
  const toggleFeature = (featureKey) => {
    setEnabledFeatures((prev) =>
      prev.includes(featureKey)
        ? prev.filter((k) => k !== featureKey)
        : [...prev, featureKey],
    )
  }

  /* ------------------------------------------------------------------
   * Actualiza un campo simple de un feature (text, number, textarea,
   * checkbox, multiselect).
   * ----------------------------------------------------------------- */
  const updateFeatureField = (featureKey, fieldKey, value) => {
    setFeatureData((prev) => ({
      ...prev,
      [featureKey]: { ...prev[featureKey], [fieldKey]: value },
    }))
  }

  /* ------------------------------------------------------------------
   * Toggle de una opcion de multiselect (arrays de strings).
   * ----------------------------------------------------------------- */
  const toggleMultiOption = (featureKey, fieldKey, option) => {
    setFeatureData((prev) => {
      const current = prev[featureKey][fieldKey] ?? []
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option]
      return { ...prev, [featureKey]: { ...prev[featureKey], [fieldKey]: next } }
    })
  }

  /* ------------------------------------------------------------------
   * Handlers para las listas dinamicas (filas editables).
   * ----------------------------------------------------------------- */
  const updateListRow = (featureKey, fieldKey, rowIndex, itemFieldKey, value) => {
    setFeatureData((prev) => {
      const rows = prev[featureKey][fieldKey].map((row, i) =>
        i === rowIndex ? { ...row, [itemFieldKey]: value } : row,
      )
      return { ...prev, [featureKey]: { ...prev[featureKey], [fieldKey]: rows } }
    })
  }

  const addListRow = (featureKey) => {
    const feature = currentIndustry.features.find((f) => f.key === featureKey)
    const itemField = feature.fields.find((f) => f.type === 'dynamicList')
    const emptyRow = {}
    itemField.itemFields.forEach((item) => {
      emptyRow[item.key] = ''
    })
    setFeatureData((prev) => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        [itemField.key]: [...prev[featureKey][itemField.key], emptyRow],
      },
    }))
  }

  const removeListRow = (featureKey, fieldKey, rowIndex) => {
    setFeatureData((prev) => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        [fieldKey]: prev[featureKey][fieldKey].filter((_, i) => i !== rowIndex),
      },
    }))
  }

  /* ------------------------------------------------------------------
   * Construye el objeto JSONB final (metadata_ + features).
   * Se usa en la vista previa y en el submit.
   * ----------------------------------------------------------------- */
  const buildPayload = useMemo(() => {
    // metadata_ = datos concretos de cada feature habilitado.
    const metadata = {}
    enabledFeatures.forEach((featureKey) => {
      const feature = currentIndustry.features.find((f) => f.key === featureKey)
      if (!feature) return
      metadata[featureKey] = feature.toggleOnly ? true : (featureData[featureKey] ?? {})
    })

    // features = mapa booleano de funciones habilitadas.
    const features = {}
    enabledFeatures.forEach((featureKey) => {
      features[featureKey] = true
    })

    return {
      name_business: form.name_business,
      display_phone_number: form.display_phone_number,
      phone_number_id: form.phone_number_id,
      industry: form.industry,
      is_active: form.is_active,
      is_hidden: form.is_hidden,
      system_prompt: form.system_prompt,
      features,
      metadata_: metadata,
    }
  }, [enabledFeatures, featureData, form, currentIndustry])

  /* ------------------------------------------------------------------
   * Submit del formulario.
   * En produccion esto haria un POST a /v1/tenants (backend FastAPI).
   * ----------------------------------------------------------------- */
  const handleSubmit = (e) => {
    e.preventDefault()

    // Validacion basica de los campos obligatorios.
    const nextErrors = {}
    if (!form.name_business.trim()) nextErrors.name_business = 'El nombre del negocio es obligatorio.'
    if (!form.display_phone_number.trim()) {
      nextErrors.display_phone_number = 'El teléfono comercial es obligatorio.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      toast.error('Completá los campos obligatorios marcados.')
      return
    }

    // Punto de conexion con el backend (cuando este listo):
    //   await fetch('/v1/tenants', { method: 'POST', body: JSON.stringify(buildPayload) })
    console.log('Payload a enviar al backend:', buildPayload)

    setErrors({})
    toast.success(`Negocio "${form.name_business}" registrado correctamente.`)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Registrar negocio
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Cargá un nuevo negocio y configurá las funciones que va a usar su
          asistente de WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ============================================================
            Columna izquierda: formulario
            ============================================================ */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 xl:col-span-2"
        >
          {/* --- Paso 1: datos basicos del negocio ------------------- */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                1
              </span>
              Datos del negocio
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Nombre del negocio */}
              <div className="sm:col-span-2">
                <label htmlFor="name_business" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nombre del negocio <span className="text-red-500">*</span>
                </label>
                <input
                  id="name_business"
                  type="text"
                  value={form.name_business}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name_business: e.target.value }))
                  }
                  placeholder="Ej. Consultorio San Benito"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 ${
                    errors.name_business
                      ? 'border-red-400 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20'
                  }`}
                />
                {errors.name_business && (
                  <p className="mt-1 text-xs text-red-600">{errors.name_business}</p>
                )}
              </div>

              {/* Telefono comercial visible */}
              <div>
                <label htmlFor="display_phone_number" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Teléfono comercial <span className="text-red-500">*</span>
                </label>
                <input
                  id="display_phone_number"
                  type="text"
                  value={form.display_phone_number}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, display_phone_number: e.target.value }))
                  }
                  placeholder="+54 381 555-0101"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 ${
                    errors.display_phone_number
                      ? 'border-red-400 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20'
                  }`}
                />
                {errors.display_phone_number && (
                  <p className="mt-1 text-xs text-red-600">{errors.display_phone_number}</p>
                )}
              </div>

              {/* Phone number ID (Meta) */}
              <div>
                <label htmlFor="phone_number_id" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone Number ID (Meta)
                </label>
                <input
                  id="phone_number_id"
                  type="text"
                  value={form.phone_number_id}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone_number_id: e.target.value }))
                  }
                  placeholder="123456789012345"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Rubro / industria */}
              <div>
                <label htmlFor="industry" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Rubro del negocio
                </label>
                <select
                  id="industry"
                  value={form.industry}
                  onChange={(e) => handleIndustryChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                >
                  {Object.values(INDUSTRY_SCHEMA).map((industry) => (
                    <option key={industry.key} value={industry.key}>
                      {industry.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  {currentIndustry.description}
                </p>
              </div>

              {/* Estado activo */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  Negocio activo (recibe mensajes)
                </label>
              </div>

              {/* Oculto para admin */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  id="is_hidden"
                  type="checkbox"
                  checked={form.is_hidden}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, is_hidden: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 accent-slate-500"
                />
                <label htmlFor="is_hidden" className="text-sm font-medium text-slate-700">
                  Oculto (solo visible para el admin)
                </label>
              </div>

              {/* Prompt del sistema (opcional) */}
              <div className="sm:col-span-2">
                <label htmlFor="system_prompt" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Prompt del asistente (opcional)
                </label>
                <textarea
                  id="system_prompt"
                  rows={3}
                  value={form.system_prompt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, system_prompt: e.target.value }))
                  }
                  placeholder="Definí el rol y las reglas del asistente virtual…"
                  className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </section>

          {/* --- Paso 2: funciones del negocio (features/JSONB) ------- */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                2
              </span>
              Funciones del asistente
              <span className="ml-auto">{/* espacio flexible */}</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Activá las funciones que el negocio usará. La ficha del cliente
              mostrará SOLO lo que dejes habilitado aquí.
            </p>

            <div className="mt-4 space-y-4">
              {currentIndustry.features.map((feature) => {
                const isEnabled = enabledFeatures.includes(feature.key)
                return (
                  <div
                    key={feature.key}
                    className={`rounded-xl border p-4 transition ${
                      isEnabled ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {/* Interruptor del feature */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{feature.label}</p>
                        <p className="text-xs text-slate-500">{feature.description}</p>
                      </div>
                      {/* Switch accesible */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled}
                        onClick={() => toggleFeature(feature.key)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                          isEnabled ? 'bg-brand-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                            isEnabled ? 'left-[22px]' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Campos dinamicos si el feature esta habilitado */}
                    {isEnabled && !feature.toggleOnly && (
                      <div className="mt-4 space-y-4 border-t border-brand-100 pt-4">
                        {feature.fields.map((field) => (
                          <div key={field.key}>
                            {/* El checkbox ya muestra su label dentro del
                                FeatureField; solo rotulamos los demas. */}
                            {field.type !== 'checkbox' && (
                              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                {field.label}
                              </label>
                            )}
                            {/* Render segun tipo de campo */}
                            {renderField(
                              field,
                              feature.key,
                              featureData,
                              updateFeatureField,
                              toggleMultiOption,
                              updateListRow,
                              addListRow,
                              removeListRow,
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {isEnabled && feature.toggleOnly && (
                      <div className="mt-3 border-t border-brand-100 pt-3">
                        <Badge color="green" dot>
                          Función activa
                        </Badge>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* --- Boton de envio ---------------- */}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
          >
            <Store className="h-4 w-4" />
            Registrar negocio
          </button>
        </form>

        {/* ============================================================
            Columna derecha: vista previa del JSONB en vivo
            ============================================================ */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-slate-900 p-5 shadow-lg">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <FileCode2 className="h-4 w-4 text-brand-400" />
              Vista previa JSONB
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Objeto que se guardará en la base de datos (metadata_).
            </p>
            <pre className="mt-4 max-h-[60vh] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-brand-200">
              {JSON.stringify(buildPayload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
 * renderField
 * --------------------------------------------------------------------------
 * Renderiza un campo segun su tipo desde el schema de INDUSTRY_SCHEMA.
 * Mantiene el codigo de los formularios corto y legible.
 *
 * Tipos soportados: text, textarea, number, checkbox, multiselect,
 * dynamicList (listas editables de filas).
 * ========================================================================== */
function renderField(
  field,
  featureKey,
  featureData,
  updateFeatureField,
  toggleMultiOption,
  updateListRow,
  addListRow,
  removeListRow,
) {
  const value = featureData[featureKey]?.[field.key]

  const inputClass =
    'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

  switch (field.type) {
    /* ---------- texto plano ---------- */
    case 'text':
      return (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => updateFeatureField(featureKey, field.key, e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )

    /* ---------- area de texto ---------- */
    case 'textarea':
      return (
        <textarea
          rows={3}
          value={value ?? ''}
          onChange={(e) => updateFeatureField(featureKey, field.key, e.target.value)}
          placeholder={field.placeholder}
          className={`${inputClass} resize-y`}
        />
      )

    /* ---------- numérico ---------- */
    case 'number':
      return (
        <input
          type="number"
          min="0"
          value={value ?? ''}
          onChange={(e) => updateFeatureField(featureKey, field.key, e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )

    /* ---------- checkbox simple ---------- */
    case 'checkbox':
      return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => updateFeatureField(featureKey, field.key, e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-brand-600"
          />
          <span className="text-sm text-slate-700">{field.label}</span>
        </div>
      )

    /* ---------- seleccion multiple (chips) ---------- */
    case 'multiselect':
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((option) => {
            const selected = (value ?? []).includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleMultiOption(featureKey, field.key, option)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                  selected
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'
                }`}
              >
                {selected && <Check className="h-3.5 w-3.5" />}
                {option}
              </button>
            )
          })}
        </div>
      )

    /* ---------- lista dinamica de filas (ej: medicos, menu) ---------- */
    case 'dynamicList': {
      const rows = value ?? []
      return (
        <div className="space-y-3">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="relative rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {field.itemTitle} #{rowIndex + 1}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {field.itemFields.map((itemField) => (
                  <div key={itemField.key}>
                    {itemField.type === 'number' ? (
                      <input
                        type="number"
                        min="0"
                        value={row[itemField.key] ?? ''}
                        onChange={(e) =>
                          updateListRow(featureKey, field.key, rowIndex, itemField.key, e.target.value)
                        }
                        placeholder={itemField.placeholder}
                        className={inputClass}
                      />
                    ) : (
                      <input
                        type="text"
                        value={row[itemField.key] ?? ''}
                        onChange={(e) =>
                          updateListRow(featureKey, field.key, rowIndex, itemField.key, e.target.value)
                        }
                        placeholder={itemField.placeholder}
                        className={inputClass}
                      />
                    )}
                  </div>
                ))}
              </div>
              {/* Boton quitar fila */}
              <button
                type="button"
                onClick={() => removeListRow(featureKey, field.key, rowIndex)}
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow transition hover:text-red-500"
                aria-label={`Quitar ${field.itemTitle}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Boton agregar fila */}
          <button
            type="button"
            onClick={() => addListRow(featureKey)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" />
            Agregar {field.itemTitle.toLowerCase()}
          </button>
        </div>
      )
    }

    /* ---------- tipo desconocido (fallback) ---------- */
    default:
      return (
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <BookOpen className="h-3.5 w-3.5" />
          Tipo de campo no soportado: {field.type}
        </p>
      )
  }
}