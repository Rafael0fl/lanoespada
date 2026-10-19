/* ==========================================================================
 * PaymentMP.jsx
 * --------------------------------------------------------------------------
 * Configuración de cobros a través de Mercado Pago.
 * El negocio ingresa su Access Token y configura si quiere cobrar señas
 * para confirmar turnos.
 * ========================================================================== */
import { useState } from 'react'
import { CreditCard, Key, DollarSign, Info } from 'lucide-react'
import { updateTenant } from '../../services/api'

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 cursor-pointer hover:bg-slate-100 transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
    </label>
  )
}

export default function PaymentMP({ value, onChange, tenant }) {
  const config = value ?? {}
  const [token, setToken] = useState(config.access_token || '')
  const [cobraSeña, setCobraSeña] = useState(config.cobra_seña ?? false)
  const [montoSeña, setMontoSeña] = useState(config.monto_seña || '')
  const [descripcionSeña, setDescripcionSeña] = useState(config.descripcion_seña || 'Seña para confirmar turno')
  const [guardado, setGuardado] = useState(false)

  const handleGuardar = async () => {
    const nextConfig = {
      ...config,
      access_token: token.trim(),
      cobra_seña: cobraSeña,
      monto_seña: montoSeña ? Number(montoSeña) : null,
      descripcion_seña: descripcionSeña.trim(),
    }
    onChange(nextConfig)
    if (tenant?.id) {
      try {
        await updateTenant(tenant.id, { config: { pagos_mp: nextConfig } })
        setGuardado(true)
        setTimeout(() => setGuardado(false), 2000)
      } catch (err) {
        console.error('[PaymentMP] Error al guardar:', err?.message || err)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Access Token */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Key className="h-4 w-4 text-brand-600" />
          Access Token de Mercado Pago
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Ingresá el Access Token de tu cuenta de Mercado Pago. Lo encontrás en el dashboard de MP → Tu app → Credenciales.
        </p>
        <div className="mt-3">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="APP_USR-xxxxxxxxxxxxxxxx-xxxxx"
            className={inputClass}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          El token expira a los ~180 días. Cuando expire, MP te avisará en el dashboard.
        </p>
      </section>

      {/* Configuración de seña */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CreditCard className="h-4 w-4 text-brand-600" />
          Cobra seña para confirmar turnos
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Si está activado, cuando un cliente agende un turno se le pedirá una seña para confirmarlo.
          La IA generará un link de pago automáticamente.
        </p>

        <div className="mt-4 space-y-3">
          <Toggle
            checked={cobraSeña}
            onChange={setCobraSeña}
            label="Cobrar seña"
            description="Los clientes deben pagar una seña para confirmar su turno"
          />
        </div>

        {cobraSeña && (
          <div className="mt-4 space-y-3 rounded-xl bg-brand-50/50 p-4">
            <label className="block text-xs font-medium text-slate-500">
              <DollarSign className="mr-1 inline h-3.5 w-3.5" />
              Monto de seña ($)
              <input
                type="number"
                value={montoSeña}
                onChange={(e) => setMontoSeña(e.target.value)}
                placeholder="Ej: 500"
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Descripción del cobro
              <input
                type="text"
                value={descripcionSeña}
                onChange={(e) => setDescripcionSeña(e.target.value)}
                placeholder="Seña para confirmar turno"
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>
        )}
      </section>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Con este token, la IA puede generar links de pago automáticamente cuando un cliente agenda un turno.
          El dinero va directo a tu cuenta de Mercado Pago.
        </p>
      </div>

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGuardar}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Guardar configuración
        </button>
        {guardado && (
          <span className="text-sm font-medium text-emerald-600">Guardado</span>
        )}
      </div>
    </div>
  )
}
