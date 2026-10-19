/* ==========================================================================
 * PaymentMP.jsx
 * --------------------------------------------------------------------------
 * Configuración de cobros a través de Mercado Pago (multi-tenant).
 *
 * El negocio CONECTA su propia cuenta de MP vía OAuth (botón "Conectar").
 * Así, cuando un cliente pague una seña, el dinero llega a la cuenta del
 * negocio (no a la de la plataforma). El Access Token lo obtiene el backend
 * tras el canje del código; el frontend nunca ve tokens ni secrets.
 *
 * Además hay un toggle "Cobra seña" que activa el cobro de señas para
 * confirmar turnos.
 * ========================================================================== */
import { useCallback, useEffect, useState } from 'react'
import { CreditCard, Link2, Loader2, Info, CheckCircle2, XCircle, Plug } from 'lucide-react'
import { disconnectMPAccount, fetchMPAccount, getMPConnectUrl, updateTenant } from '../../services/api'

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
  const [cobraSeña, setCobraSeña] = useState(config.cobra_seña ?? false)
  const [guardado, setGuardado] = useState(false)

  // Estado de la conexión OAuth con MP
  const tenantId = tenant?.id
  const [mp, setMp] = useState(null)   // null = cargando, {connected:bool, ...}
  const [connecting, setConnecting] = useState(false)
  const [actionError, setActionError] = useState('')

  const loadMP = useCallback(async () => {
    if (!tenantId) return
    try {
      const res = await fetchMPAccount(tenantId)
      setMp(res)
    } catch {
      setMp({ connected: false })
    }
  }, [tenantId])

  useEffect(() => {
    loadMP()
  }, [loadMP])

  const handleGuardar = async () => {
    const nextConfig = { ...config, cobra_seña: cobraSeña }
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

  const handleConnect = async () => {
    setActionError('')
    setConnecting(true)
    try {
      const res = await getMPConnectUrl(tenantId)
      if (res?.url) {
        // Navegamos a la URL de autorización de MP. El negocio loguea su
        // cuenta y MP lo devuelve al callback del backend.
        window.location.href = res.url
      } else {
        setActionError('No se pudo obtener la URL de conexión.')
        setConnecting(false)
      }
    } catch (err) {
      setActionError(err?.message || 'Error al iniciar la conexión con Mercado Pago.')
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('¿Desconectar la cuenta de Mercado Pago? Los cobros dejarán de funcionar.')) return
    setActionError('')
    try {
      await disconnectMPAccount(tenantId)
      setMp({ connected: false })
    } catch (err) {
      setActionError(err?.message || 'Error al desconectar.')
    }
  }

  const isConnecting = connecting || (mp === null)

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------
          Sección 1: Cuenta de Mercado Pago conectada (OAuth)
      --------------------------------------------------------------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Link2 className="h-4 w-4 text-brand-600" />
          Cuenta de Mercado Pago
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Conectá la cuenta de MP de tu negocio para que los cobros (señas) se acrediten
          directamente en tu cuenta. Mercado Pago te va a pedir que inicies sesión y autorices.
        </p>

        <div className="mt-4">
          {isConnecting ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando conexión…
            </div>
          ) : mp?.connected ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Cuenta conectada</p>
                  <p className="text-xs">
                    {mp.nickname || (mp.mp_user_id ? `Mercado Pago ID: ${mp.mp_user_id}` : 'Cuenta vinculada')}
                    {mp.is_test && ' · cuenta de PRUEBAS'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Desconectar cuenta
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <Plug className="h-4 w-4" />
              Conectar Mercado Pago
            </button>
          )}

          {actionError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{actionError}</p>
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------
          Sección 2: Cobro de seña (toggle)
      --------------------------------------------------------------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CreditCard className="h-4 w-4 text-brand-600" />
          Cobra seña para confirmar turnos
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Si está activado, cuando un cliente agende un turno se le pedirá una seña para confirmarlo.
          La IA calcula el monto según tus <strong>políticas</strong> y el <strong>precio del servicio</strong>,
          genera el link de pago automáticamente y solo confirma el turno cuando el pago se acredita.
        </p>

        <div className="mt-4 space-y-3">
          <Toggle
            checked={cobraSeña}
            onChange={setCobraSeña}
            label="Cobrar seña para confirmar turnos"
            description="Los turnos quedan pendientes de pago hasta que el cliente abone la seña"
          />
        </div>
      </section>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Al conectar tu cuenta, la IA puede generar links de pago automáticamente cuando un cliente
          agenda un turno. El dinero va directo a tu cuenta de Mercado Pago (no pasa por la plataforma).
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
