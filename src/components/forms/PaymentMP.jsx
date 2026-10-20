/* ==========================================================================
 * PaymentMP.jsx
 * --------------------------------------------------------------------------
 * Conexión de la cuenta de Mercado Pago del negocio (multi-tenant, OAuth).
 *
 * El negocio CONECTA su propia cuenta de MP (botón "Conectar"). Así, cuando
 * un cliente pague una seña, el dinero llega a la cuenta del negocio (no a
 * la de la plataforma). El Access Token lo obtiene el backend tras el canje
 * del código OAuth; el frontend nunca ve tokens ni secrets.
 *
 * NO hay toggle de "cobrar seña": si el negocio exige seña, eso lo define en
 * su feature de POLÍTICAS. La IA lee las políticas y decide si cobra.
 * ========================================================================== */
import { useCallback, useEffect, useState } from 'react'
import { Link2, Loader2, Info, CheckCircle2, XCircle, Plug } from 'lucide-react'
import { disconnectMPAccount, fetchMPAccount, getMPConnectUrl } from '../../services/api'

export default function PaymentMP({ tenant }) {
  const tenantId = tenant?.id

  // Estado de la conexión OAuth con MP.
  // null = cargando, {connected: bool, ...} = respuesta del backend.
  const [mp, setMp] = useState(null)
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

  const isLoading = connecting || mp === null

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------
          Cuenta de Mercado Pago conectada (OAuth)
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
          {isLoading ? (
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

      {/* Info */}
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Al conectar tu cuenta, la IA puede generar links de pago automáticamente cuando un
          cliente agenda un turno. El dinero va directo a tu cuenta de Mercado Pago
          (no pasa por la plataforma). Si tu negocio cobra seña, dejalo escrito en
          tus <strong>políticas</strong> y la IA lo aplica solo.
        </p>
      </div>
    </div>
  )
}
