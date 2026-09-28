/* ==========================================================================
 * ChatView.jsx
 * --------------------------------------------------------------------------
 * Chat estilo WhatsApp, REUTILIZABLE.
 *
 * Se usa en el panel del socio para ver la conversacion de un customer con
 * el negocio, y sera reutilizado cuando el perfil de los tenants muestre sus
 * chats. Tambien podria reutilizarse para el rol 'tenant'.
 *
 * Props:
 *   - title       : nombre del tenant o del customer (cabecera).
 *   - subtitle    : texto secundario de la cabecera (ej: "en línea").
 *   - avatar      : { initials, color } para el avatar; opcional.
 *   - messages    : arreglo de mensajes:
 *                     { id, sender: 'user'|'bot', text, ts, status }
 *   - onSend      : (text) => void  (respuesta del negocio).
 *   - readOnly    : si es true, oculta la barra de escritura (solo lectura).
 *   - onBack      : () => void | undefined  (boton volver, opcional).
 *   - className   : clases extra para el contenedor (alto, etc).
 *
 * El locale y el formato (es-AR) estan hardcodeados: siempre espanol.
 * ========================================================================== */

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, CheckCheck, Mic, Phone, Plus, Search, Send } from 'lucide-react'

const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

const dayLabel = (ts) => {
  const now = new Date()
  const d = new Date(ts)
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((startToday - startDay) / 86_400_000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const StatusTicks = ({ status }) => {
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-sky-400" />
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
  return <Check className="h-3.5 w-3.5 text-slate-400" />
}

export default function ChatView({
  title,
  subtitle,
  avatar,
  messages = [],
  onSend,
  readOnly = false,
  onBack,
  className = '',
}) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)

  // Agrupar mensajes por separador de dia.
  const groups = useMemo(() => {
    const sorted = [...messages].sort((a, b) => a.ts - b.ts)
    const out = []
    for (const m of sorted) {
      const label = dayLabel(m.ts)
      const last = out[out.length - 1]
      if (last && last.label === label) last.items.push(m)
      else out.push({ label, items: [m] })
    }
    return out
  }, [messages])

  // Auto scroll al final cuando cambian los mensajes.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, groups])

  const submit = () => {
    const text = draft.trim()
    if (!text || !onSend) return
    onSend(text)
    setDraft('')
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {/* ===================== CABECERA verde oscuro ===================== */}
      <header className="flex items-center gap-3 bg-[#075e54] px-3 py-2.5 text-white">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-2 transition hover:bg-white/10"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {avatar ? (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatar.color ?? 'bg-slate-500'}`}
          >
            {avatar.initials}
          </div>
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-full bg-white/20" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate text-xs text-white/80">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1 text-white/90">
          <button type="button" className="rounded-full p-2 transition hover:bg-white/10" aria-label="Buscar">
            <Search className="h-5 w-5" />
          </button>
          <button type="button" className="rounded-full p-2 transition hover:bg-white/10" aria-label="Llamar">
            <Phone className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ===================== ZONA DE MENSAJES ========================== */}
      <div ref={scrollRef} className="wa-chat-bg wa-scroll flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {groups.map((group) => (
          <div key={group.label}>
            {/* Separador de dia */}
            <div className="my-3 flex justify-center">
              <span className="rounded-lg bg-[#f0f2f5] px-3 py-1 text-xs font-medium capitalize text-slate-500 shadow-sm">
                {group.label}
              </span>
            </div>

            {group.items.map((m) => {
              const fromUser = m.sender === 'user'
              return (
                <div key={m.id} className={`flex ${fromUser ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`wa-bubble relative mx-2 my-0.5 max-w-[80%] px-2.5 py-1.5 sm:max-w-[65%] ${
                      fromUser ? 'wa-tail-recv bg-white' : 'wa-tail-sent bg-[#d9fdd3]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-[13.5px] leading-snug text-slate-800">
                      {m.text}
                    </p>
                    <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                      {fmtTime(m.ts)}
                      {!fromUser && <StatusTicks status={m.status} />}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Aún no hay mensajes en esta conversación.
          </p>
        )}
      </div>

      {/* ===================== BARRA DE ESCRITURA ======================== */}
      {readOnly ? (
        <footer className="flex items-center justify-center bg-[#f0f2f5] px-3 py-3">
          <p className="text-center text-xs text-slate-500">
            Respuesta manual desactivada por ahora — la IA atiende automáticamente a este cliente.
          </p>
        </footer>
      ) : (
      <footer className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-2.5">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200"
          aria-label="Adjuntar"
        >
          <Plus className="h-5 w-5" />
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Escribí un mensaje"
          className="h-11 flex-1 rounded-full border border-transparent bg-white px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-400"
        />
        {draft.trim() ? (
          <button
            type="button"
            onClick={submit}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#008069] text-white transition hover:brightness-110"
            aria-label="Enviar mensaje"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200"
            aria-label="Nota de voz"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </footer>
      )}
    </div>
  )
}