/* ==========================================================================
 * ChatPage.jsx (Socio)
 * --------------------------------------------------------------------------
 * Pagina que envuelve el ChatView reutilizable (estilo WhatsApp) para el
 * panel del socio: muestra la conversacion de un customer con un tenant.
 *
 * Ruta: /socio/tenants/:tenantId/chats/:customerId
 * ========================================================================== */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import ChatView from '../../components/chat/ChatView'
import DemoBanner from '../../components/ui/DemoBanner'
import { fetchCustomers, fetchMessages, fetchTenant, sendMessage } from '../../services/api'

export default function ChatPage() {
  const { tenantId, customerId } = useParams()
  const navigate = useNavigate()

  const [tenant, setTenant] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [messages, setMessages] = useState([])
  const [mock, setMock] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([fetchTenant(tenantId), fetchCustomers(tenantId), fetchMessages(tenantId, customerId)]).then(
      ([tenantRes, customersRes, messagesRes]) => {
        if (!alive) return
        setTenant(tenantRes.data)
        setCustomer(
          (customersRes.data ?? []).find((c) => c.id === customerId) ?? null,
        )
        setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : [])
        setMock(tenantRes.mock || customersRes.mock || messagesRes.mock)
        setLoading(false)
      },
    ).catch((err) => {
      if (!alive) return
      console.error('[ChatPage] No se pudo cargar:', err?.message || err)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [tenantId, customerId])

  const handleSend = useCallback(
    async (text) => {
      // Optimista: agrego el mensaje al instante y luego pido el estado real.
      setMessages((prev) => [
        ...prev,
        { id: `tmp-${Date.now()}`, sender: 'bot', text, ts: Date.now(), status: 'sent' },
      ])
      try {
        const { data, mock: isMock } = await sendMessage(tenantId, customerId, text)
        if (data) {
          setMessages((prev) => prev.filter((m) => !m.id.startsWith('tmp-')))
          setMessages((prev) => [...prev, data])
        }
        setMock(isMock)
      } catch (err) {
        console.error('[ChatPage] No se pudo enviar:', err?.message || err)
        setMessages((prev) => prev.filter((m) => !m.id.startsWith('tmp-')))
        setMock(false)
      }
    },
    [tenantId, customerId],
  )

  if (loading) {
    return <p className="py-10 text-center text-sm text-slate-400">Cargando conversación…</p>
  }

  if (!customer) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm font-medium text-slate-600">No se encontró la conversación.</p>
        <button
          type="button"
          onClick={() => navigate(`/socio/tenants/${tenantId}`)}
          className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Volver a los customers
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <DemoBanner
        mock={mock}
        message="Los mensajes se guardan en memoria mientras la página esté abierta."
      />

      <ChatView
        title={customer.name_user}
        subtitle={`${tenant?.name_business ?? ''} · en WhatsApp`}
        avatar={{
          initials: customer.avatarColor ? customer.initials : customer.initials,
          color: customer.avatarColor ?? 'bg-slate-400',
        }}
        messages={messages}
        onSend={handleSend}
        onBack={() => navigate(`/socio/tenants/${tenantId}`)}
        className="h-[calc(100dvh-250px)] min-h-[420px] md:h-[calc(100dvh-190px)]"
      />
    </div>
  )
}