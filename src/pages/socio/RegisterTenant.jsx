/* ==========================================================================
 * RegisterTenant.jsx (Socio)
 * --------------------------------------------------------------------------
 * Seccion "Añadir Tenant".
 *
 * Formulario para registrar un negocio (tenant) en el backend:
 *   1. Datos del negocio: nombre, telefono, industria y prompt.
 *   2. Features habilitadas (toggles con icono unico: verde = on, gris = off).
 *
 * Envia al backend (POST /v1/tenants):
 *   name_business, display_phone_number, industry, system_prompt, features
 *   + configuracion inicial: is_active: true, is_hidden: false, store: false,
 *     socio (username del socio logueado), response_time: 'fulltime'.
 *
 * Si el backend no responde, el servicio api.js cae en la pseudo-DB
 * (modo demo) y el tenant se agrega ahi para seguir probando la interfaz.
 *
 * Ruta: /socio/tenant/nuevo
 * ========================================================================== */

import { useState } from 'react'
import { Building2, Check, Save, Sparkles } from 'lucide-react'

import DemoBanner from '../../components/ui/DemoBanner'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import { FEATURES, INDUSTRIES } from '../../data/mockBackend'
import { createTenant } from '../../services/api'

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

export default function RegisterTenant() {
  const { user } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({
    name_business: '',
    display_phone_number: '',
    tenant_username: '',
    tenant_password: '',
    industry: '',
    system_prompt: '',
  })
  const [features, setFeatures] = useState({})
  const [mock, setMock] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [created, setCreated] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // Toggle de una feature (boton con icono unico). Se guarda como
  // dict {feature_key: true/false} (contrato del backend).
  const toggleFeature = (key) =>
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }))

  const validate = () => {
    const next = {}
    if (!form.name_business.trim()) next.name_business = 'El nombre del negocio es obligatorio.'
    if (!form.display_phone_number.trim())
      next.display_phone_number = 'El teléfono del negocio es obligatorio.'
    if (!form.industry) next.industry = 'Seleccioná la industria.'
    if (!form.system_prompt.trim()) next.system_prompt = 'El prompt es obligatorio.'
    const uname = (form.tenant_username ?? '').trim()
    const pass = (form.tenant_password ?? '').trim()
    if (uname && uname.length < 3)
      next.tenant_username = 'El usuario debe tener al menos 3 caracteres.'
    if (pass && pass.length < 4)
      next.tenant_password = 'La contraseña debe tener al menos 4 caracteres.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Completá los campos obligatorios para continuar.')
      return
    }

    setSaving(true)
    const payload = {
      name_business: form.name_business.trim(),
      display_phone_number: form.display_phone_number.trim(),
      tenant_username: (form.tenant_username ?? '').trim() || null,
      tenant_password: (form.tenant_password ?? '').trim() || null,
      industry: form.industry,
      system_prompt: form.system_prompt.trim(),
      features,
      is_active: true,
      is_hidden: false,
      store: false,
      socio: user?.username ?? '',
      response_time: 'fulltime',
    }

    try {
      const { data: tenant, mock: isMock } = await createTenant(payload)
      setMock(isMock)
      setSaving(false)
      toast.success(
        isMock
          ? 'Tenant creado en modo demo (backend sin conexión).'
          : 'Tenant creado correctamente. ¡La recepción del backend lo confirmó!',
      )
      // Guarda info para mostrar la cuenta del Tenant (solo si el backend real respondió).
      setCreated(
        isMock
          ? null
          : {
              name_business: tenant?.name_business ?? form.name_business,
              tenant: tenant?.tenant_account ?? null,
            },
      )
      // Reset para cargar otro negocio.
      setForm({
        name_business: '',
        display_phone_number: '',
        tenant_username: '',
        tenant_password: '',
        industry: '',
        system_prompt: '',
      })
      setFeatures({})
      setErrors({})
    } catch (err) {
      if (err?.status === 409) {
        toast.error('Ese nombre de usuario ya está en uso. Elegí otro.')
      } else {
        toast.error('No se pudo crear el tenant. Revisá los datos e intentá de nuevo.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Añadir Tenant</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registrá un negocio nuevo. Las features que habilites le darán contexto
          a la IA para que no invente información.
        </p>
      </div>

      <DemoBanner
        mock={mock}
        message="El tenant se agrega a la pseudo-DB local y se pierde al recargar la página."
      />

      {/* Tarjeta de éxito: muestra la cuenta Cliente para cargar las features */}
      {created && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Check className="h-4 w-4" />
            {created.name_business} registrado correctamente
          </div>
          {created.tenant_user ? (
            <div className="mt-3 space-y-1.5 rounded-xl bg-white p-4 text-sm ring-1 ring-emerald-200">
              <p className="font-medium text-slate-800">
                Panel del Tenant listo para cargar la información del negocio:
              </p>
              <p className="text-slate-600">
                Usuario: <span className="font-semibold text-slate-900">{created.tenant_user.username}</span>
              </p>
              <p className="text-slate-600">
                Contraseña: <span className="font-semibold text-slate-900">{created.tenant_user.password}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Ingresá con ese usuario en <span className="font-medium">"Ver Tenants → Ingresar"</span>{' '}
                y completá horarios, servicios, promos, etc. Eso es lo que la IA usará para responder.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-emerald-700">
              El negocio ya tenía una cuenta Tenant asociada (no se generan credenciales nuevas).
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============ 1) DATOS DEL NEGOCIO ============ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Building2 className="h-4 w-4 text-brand-600" />
            Datos del negocio
          </h2>
          <p className="mb-5 text-xs text-slate-500">
            Todos los campos son obligatorios.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nombre del negocio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name_business}
                onChange={set('name_business')}
                placeholder="Ej: Clínica Asclepio"
                className={inputClass}
              />
              {errors.name_business && (
                <p className="mt-1 text-xs text-red-500">{errors.name_business}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Teléfono del negocio <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.display_phone_number}
                onChange={set('display_phone_number')}
                placeholder="+54 381 000-0000"
                className={inputClass}
              />
              {errors.display_phone_number && (
                <p className="mt-1 text-xs text-red-500">{errors.display_phone_number}</p>
              )}
              <p className="mt-1.5 text-xs text-slate-400">
                Con el primer mensaje de WhatsApp que llegue a este número, el negocio se
                vincula automáticamente (no hace falta conocer el ID de Meta).
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="mb-1 text-sm font-semibold text-slate-800">
                Acceso del negocio (panel del Tenant)
              </p>
              <p className="mb-3 text-xs text-slate-500">
                Con estas credenciales el dueño entra al sistema y completa la información
                (horarios, servicios, promos…). Si las dejás vacías se generan automáticamente.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Usuario <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.tenant_username ?? ''}
                    onChange={set('tenant_username')}
                    placeholder="Ej: miBarTucuman"
                    className={inputClass}
                  />
                  {errors.tenant_username && (
                    <p className="mt-1 text-xs text-red-500">{errors.tenant_username}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Contraseña <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.tenant_password ?? ''}
                    onChange={set('tenant_password')}
                    placeholder="Mínimo 4 caracteres"
                    className={inputClass}
                  />
                  {errors.tenant_password && (
                    <p className="mt-1 text-xs text-red-500">{errors.tenant_password}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Industria <span className="text-red-500">*</span>
              </label>
              <select
                value={form.industry}
                onChange={set('industry')}
                className={`${inputClass} ${form.industry ? '' : 'text-slate-400'}`}
              >
                <option value="" disabled>
                  Seleccioná la industria…
                </option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind.key} value={ind.key}>
                    {ind.label}
                  </option>
                ))}
              </select>
              {errors.industry && <p className="mt-1 text-xs text-red-500">{errors.industry}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Prompt <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                value={form.system_prompt}
                onChange={set('system_prompt')}
                placeholder="Definí el contexto y la personalidad de la IA para este negocio. Ej: 'Sos el asistente virtual de un consultorio médico. Respondés preguntas sobre turnos, médicos y obras sociales. Nunca inventes información.'"
                className={`${inputClass} resize-y`}
              />
              {errors.system_prompt && (
                <p className="mt-1 text-xs text-red-500">{errors.system_prompt}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                Cuanto más contexto le des, mejor responderá la IA sin inventar datos.
              </p>
            </div>
          </div>
        </section>

        {/* ============ 2) FEATURES ============ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Sparkles className="h-4 w-4 text-brand-600" />
            Funciones del tenant (features)
          </h2>
          <p className="mb-5 text-xs text-slate-500">
            Activá las funciones que tendrá habilitado este negocio. Cada una le
            da contexto a la IA. Podés dejarlas todas apagadas si aún no las definiste.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map((feature) => {
              const active = Boolean(features[feature.key])
              return (
                <button
                  key={feature.key}
                  type="button"
                  onClick={() => toggleFeature(feature.key)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                    active
                      ? 'border-brand-600 bg-brand-50 shadow-sm ring-1 ring-brand-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition ${
                      active ? 'bg-brand-600' : 'bg-slate-100 grayscale'
                    }`}
                  >
                    <span className={active ? '' : 'opacity-70'}>
                      {feature.icon}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`flex items-center gap-1.5 text-sm font-semibold ${
                        active ? 'text-brand-800' : 'text-slate-700'
                      }`}
                    >
                      {feature.label}
                      {active && <Check className="h-3.5 w-3.5 text-brand-600" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {feature.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando…' : 'Registrar tenant'}
          </button>
        </div>
      </form>
    </div>
  )
}