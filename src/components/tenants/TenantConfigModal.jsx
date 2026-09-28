/* ==========================================================================
 * TenantConfigModal.jsx
 * --------------------------------------------------------------------------
 * Modal de configuracion de un tenant (boton de ajustes en "Ver Tenants").
 *
 * Permite modificar:
 *   - Estados: is_active, is_hidden, store (toogles).
 *   - Informacion basica: nombre, telefono, industria y prompt.
 *   - Horario de respuesta de la IA: card con 3 modos (24 hs / mismo horario /
 *     por día). Se guarda en response_schedule ('fulltime' | { start, end } |
 *     { days: { dia: { start, end }, ... } }).
 *   - Features habilitadas (mismo criterio visual que el formulario).
 *
 * Al guardar llama a PATCH /v1/tenants/{id} (o actualiza la pseudo-DB en
 * modo demo) y notifica al padre con el tenant actualizado.
 *
 * Props:
 *   - tenant  : objeto tenant con la forma del backend / mock.
 *   - onClose : () => void
 *   - onSaved : (updatedTenant) => void
 * ========================================================================== */

import { useState } from 'react'
import { Check, Save, X } from 'lucide-react'

import Toggle from '../ui/Toggle'
import { useToast } from '../ui/Toast'
import DemoBanner from '../ui/DemoBanner'
import ScheduleForm from '../forms/ScheduleForm'
import { FEATURES, INDUSTRIES, normalizeFeatures } from '../../data/mockBackend'
import { updateTenant } from '../../services/api'

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

export default function TenantConfigModal({ tenant, onClose, onSaved }) {
  const toast = useToast()

  const [form, setForm] = useState({
    name_business: tenant.name_business ?? '',
    display_phone_number: tenant.display_phone_number ?? '',
    industry: tenant.industry ?? '',
    system_prompt: tenant.system_prompt ?? '',
    is_active: tenant.is_active ?? true,
    store: tenant.store ?? false,
    response_schedule:
      tenant.response_schedule ??
      (tenant.response_time === 'schedule'
        ? {
            start: tenant.response_hours?.start ?? '07:00',
            end: tenant.response_hours?.end ?? '17:00',
          }
        : 'fulltime'),
    features: normalizeFeatures(tenant.features),
  })
  const [mock, setMock] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const toggleFeature = (key) =>
    setForm((f) => ({
      ...f,
      features: { ...f.features, [key]: !f.features[key] },
    }))

  const handleSave = async () => {
    if (!form.name_business.trim() || !form.display_phone_number.trim()) {
      toast.error('El nombre y el teléfono no pueden quedar vacíos.')
      return
    }

    setSaving(true)
    try {
      const { data, mock: isMock } = await updateTenant(tenant.id, {
        name_business: form.name_business.trim(),
        display_phone_number: form.display_phone_number.trim(),
        industry: form.industry,
        system_prompt: form.system_prompt,
        is_active: form.is_active,
        store: form.store,
        response_schedule: form.response_schedule,
        features: form.features,
      })
      setMock(isMock)
      if (data) onSaved(data)
      toast.success(
        isMock
          ? 'Configuración actualizada (modo demo).'
          : 'Configuración guardada correctamente.',
      )
      onClose()
    } catch {
      toast.error('No se pudo guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Configuración de {tenant.name_business}
            </h2>
            <p className="text-xs text-slate-500">Configurá el estado y la respuesta de la IA.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <DemoBanner mock={mock} message="Los cambios se aplican solo en la pseudo-DB local." />

        <div className="mt-4 space-y-5">
          {/* ---- Estados ---- */}
          <div className="space-y-2">
            <Toggle
              checked={form.is_active}
              onChange={set('is_active')}
              label="Activo"
              description="Si está desactivado, la IA deja de responder a este negocio."
            />
            <Toggle
              checked={form.store}
              onChange={set('store')}
              label="Tienda / stock"
              description="Preparado para la futura feature de productos y stock."
            />
          </div>

          {/* ---- Info basica ---- */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Información básica
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Nombre del negocio</label>
                <input value={form.name_business} onChange={(e) => set('name_business')(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Teléfono</label>
                <input value={form.display_phone_number} onChange={(e) => set('display_phone_number')(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Número vinculado</label>
                {tenant.phone_number_id ? (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 text-xs text-slate-600">
                    <span className="font-semibold text-emerald-700">Vinculado</span>
                    {' '}· {tenant.phone_number_id}
                  </p>
                ) : (
                  <p className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-slate-500">
                    Sin vincular todavía: se vincula solo con el primer mensaje de WhatsApp
                    que llegue al teléfono del negocio.
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Industria</label>
                <select value={form.industry} onChange={(e) => set('industry')(e.target.value)} className={inputClass}>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.key} value={ind.key}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Prompt</label>
                <textarea
                  rows={4}
                  value={form.system_prompt}
                  onChange={(e) => set('system_prompt')(e.target.value)}
                  className={`${inputClass} resize-y`}
                />
              </div>
            </div>
          </div>

          {/* ---- Horario de respuesta de la IA ---- */}
          <ScheduleForm
            title="Horarios de respuesta de IA"
            value={form.response_schedule}
            onChange={set('response_schedule')}
            onSave={handleSave}
            saving={saving}
          />

          {/* ---- Features ---- */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Features habilitadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map((feature) => {
                const active = Boolean(form.features[feature.key])
                return (
                  <button
                    key={feature.key}
                    type="button"
                    onClick={() => toggleFeature(feature.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-300 bg-white text-slate-500 hover:border-brand-400 hover:text-brand-700'
                    }`}
                  >
                    <span>{feature.icon}</span>
                    {feature.label}
                    {active && <Check className="h-3 w-3" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ---- Acciones ---- */}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}