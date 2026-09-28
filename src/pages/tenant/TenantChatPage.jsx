/* ==========================================================================
 * TenantChatPage.jsx (Cliente)
 * --------------------------------------------------------------------------
 * Chat del tenant con un customer: envuelve ChatView (estilo WhatsApp).
 * Es el mismo chat que usa el socio, pero el tenant solo ve a sus clientes:
 * por ahora SOLO LECTURA (la respuesta manual se habilitara cuando el
 * backend tenga la ruta para enviar el mensaje al WhatsApp del customer).
 *
 * Ruta: /dashboard/customers/:customerId
 * ========================================================================== */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import ChatView from '../../components/chat/ChatView'
import DemoBanner from '../../components/ui/DemoBanner'
import { useAuth } from '../../context/AuthContext'
import { fetchCustomers, fetchMessages, fetchTenant } from '../../services/api'

export default function TenantChatPage() {
  const { user } = useAuth()
  const { customerId } = useParams()
  const navigate = useNavigate()

  const tenantId = user?.tenantId ?? ''

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
      console.error('[TenantChatPage] No se pudo cargar:', err?.message || err)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [tenantId, customerId])

  if (loading) {
    return <p className="py-10 text-center text-sm text-slate-400">Cargando conversación…</p>
  }

  if (!customer) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm font-medium text-slate-600">No se encontró la conversación.</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/customers')}
          className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Volver a tus clientes
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <DemoBanner
        mock={mock}
        message="Solo lectura por ahora: podrás responder cuando se habilite el envío al WhatsApp."
      />

      <ChatView
        title={customer.name_user}
        subtitle={`${tenant?.name_business ?? ''} · en WhatsApp`}
        avatar={{
          initials: customer.initials,
          color: customer.avatarColor ?? 'bg-slate-400',
        }}
        messages={messages}
        readOnly
        onBack={() => navigate('/dashboard/customers')}
        className="h-[calc(100dvh-250px)] min-h-[420px] md:h-[calc(100dvh-190px)]"
      />
    </div>
  )
}