/* ==========================================================================
 * AgendaTurnos.jsx
 * --------------------------------------------------------------------------
 * Configuración de la Agenda de Turnos. Especificación pedida:
 *   - Dos botones: "Ver" y "Configuración"
 *   - "Ver": por ahora mensaje "pendiente en terminarse"
 *   - "Configuración": Boxes (con layout horizontal de cards)
 * -------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { Boxes, CalendarCheck, CalendarX, Clock, Plus, Eye, Settings, Trash2, Wrench } from 'lucide-react'

import { cancelAppointment, createAppointment, fetchAppointments } from '../../services/api'

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

const DIAS = [
  { key: 'lun', label: 'Lun' },
  { key: 'mar', label: 'Mar' },
  { key: 'mie', label: 'Mié' },
  { key: 'jue', label: 'Jue' },
  { key: 'vie', label: 'Vie' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
]

/* Una franja es valida si tiene al menos un dia y un rango con inicio < fin
   (formato HH:MM de <input type="time">, comparable como string). */
function franjaValida(f) {
  return (
    f &&
    Array.isArray(f.dias) &&
    f.dias.length > 0 &&
    typeof f.start === 'string' &&
    typeof f.end === 'string' &&
    f.start !== '' &&
    f.end !== '' &&
    f.start < f.end
  )
}

function franjasValidas(franjas) {
  return (franjas ?? []).every(franjaValida)
}

/* --------------------------------------------------------------------------
 * FranjasHorario: editor de franjas horarias de un box. Cada franja es
 * { dias: ['lun',...], start: 'HH:MM', end: 'HH:MM' }. Con varias franjas
 * se cubre el horario cortado (ej: Lun-Vie 08:00-14:00 + Lun-Vie 17:00-22:00).
 * ------------------------------------------------------------------------ */
function FranjasHorario({ value, onChange }) {
  const franjas = value ?? []

  const patch = (idx, next) => onChange(franjas.map((f, i) => (i === idx ? next : f)))

  const toggleDia = (idx, dia) => {
    const dias = franjas[idx].dias ?? []
    patch(idx, {
      ...franjas[idx],
      dias: dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia],
    })
  }

  return (
    <div className="space-y-2">
      {franjas.map((f, idx) => {
        const ok = franjaValida(f)
        return (
          <div
            key={idx}
            className={`rounded-xl border bg-white p-3 ${ok ? 'border-slate-200' : 'border-amber-300 bg-amber-50/40'}`}
          >
            <div className="flex flex-wrap gap-1.5">
              {DIAS.map((d) => {
                const selected = (f.dias ?? []).includes(d.key)
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDia(idx, d.key)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      selected
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 min-w-0">
              <input
                type="time"
                value={f.start ?? ''}
                onChange={(e) => patch(idx, { ...f, start: e.target.value })}
                className={`${inputClass.replace('w-full ', '').replace('w-full', '')} shrink-0 max-w-xs`}
                aria-label="Hora de inicio"
              />
              <span className="shrink-0 text-sm text-slate-400">→</span>
              <input
                type="time"
                value={f.end ?? ''}
                onChange={(e) => patch(idx, { ...f, end: e.target.value })}
                className={`${inputClass.replace('w-full ', '').replace('w-full', '')} shrink-0 max-w-xs`}
                aria-label="Hora de fin"
              />
              <button
                type="button"
                onClick={() => onChange(franjas.filter((_, i) => i !== idx))}
                className="shrink-0 text-slate-400 transition hover:text-red-500"
                aria-label="Eliminar franja"
                title="Eliminar franja"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {!ok && (
              <p className="mt-1.5 text-[11px] text-amber-600">
                Elegí al menos un día y un rango válido (inicio menor que fin).
              </p>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => onChange([...franjas, { dias: [], start: '', end: '' }])}
        className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-700"
      >
        <Plus className="h-4 w-4" />
        Añadir franja horaria
      </button>
    </div>
  )
}

const DIA_KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']
const DIA_LABEL = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom' }

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function parseISO(iso) {
  return new Date(`${iso}T12:00:00`) // mediodia: evita corrimientos por zona horaria
}
function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function diaKey(date) {
  return DIA_KEYS[date.getDay()]
}

function uidReserva() {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// "09:30" + 45 -> "10:15" (los strings HH:MM se comparan lexicograficamente).
function sumarMinutos(hhmm, min) {
  const [h, m] = String(hhmm).split(':').map(Number)
  const t = h * 60 + m + (Number(min) || 0)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

// Duracion del servicio en minutos (default 30 si no esta cargada).
function duracionServicio(tenant, nombre) {
  const list = tenant?.config?.servicio?.list ?? []
  const d = Number(list.find((s) => s?.nombre === nombre)?.duracion_min)
  return Number.isFinite(d) && d > 0 ? d : 30
}

/* --------------------------------------------------------------------------
 * ReservaForm: alta manual de un turno dentro de una franja del dia.
 * Valida: hora y cliente obligatorios, que entre en la franja segun la
 * duracion del servicio, y que no se superponga con otra reserva del dia.
 * ------------------------------------------------------------------------ */
function ReservaForm({ franja, servicios, tenant, existentes, fechaISO, hoyISO, ahoraHHMM, onSave, onCancel }) {
  const [hora, setHora] = useState('')
  const [servicio, setServicio] = useState(servicios[0] ?? '')
  const [cliente, setCliente] = useState('')
  const [error, setError] = useState('')

  const guardar = () => {
    if (!hora) {
      setError('Elegí la hora del turno.')
      return
    }
    if (fechaISO < hoyISO || (fechaISO === hoyISO && hora <= ahoraHHMM)) {
      setError('Esa hora ya pasó. Elegí un horario futuro.')
      return
    }
    if (!cliente.trim()) {
      setError('Poné el nombre del cliente.')
      return
    }
    const dur = duracionServicio(tenant, servicio)
    const fin = sumarMinutos(hora, dur)
    if (hora < franja.start || fin > franja.end) {
      setError(`No entra en la franja (${franja.start}–${franja.end}) con ${dur} min de duración.`)
      return
    }
    const choque = existentes.find((r) => {
      const rFin = sumarMinutos(r.hora, Number(r.duracion_min) || 30)
      return hora < rFin && r.hora < fin
    })
    if (choque) {
      setError(`Se superpone con el turno de las ${choque.hora}${choque.cliente ? ` (${choque.cliente})` : ''}.`)
      return
    }
    onSave({ id: uidReserva(), hora, duracion_min: dur, servicio, cliente: cliente.trim() })
  }

  return (
    <div className="mt-2 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-slate-500">
          Hora
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        {servicios.length > 0 && (
          <label className="text-xs font-medium text-slate-500">
            Servicio
            <select
              value={servicio}
              onChange={(e) => setServicio(e.target.value)}
              className={`${inputClass} mt-1`}
            >
              {servicios.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <label className="mt-2 block text-xs font-medium text-slate-500">
        Cliente
        <input
          type="text"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          placeholder="Nombre del cliente"
          className={`${inputClass} mt-1`}
        />
      </label>
      {error !== '' && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={guardar}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Guardar reserva
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
 * VerSection: vista de agenda (solo lectura por ahora).
 * Pildoras de box + tira semanal desde hoy + franjas del dia elegido.
 * Cuando exista la tabla appointments, los bloques se reemplazan por el
 * resultado de getSlots(box, fecha) sin tocar esta vista.
 * ------------------------------------------------------------------------ */
function VerSection({ value, tenant }) {
  const boxes = value?.boxes ?? []
  const tenantId = tenant?.id ?? ''
  const hoy = new Date()
  const hoyISO = toISO(hoy)
  const ahoraHHMM = `${String(hoy.getHours()).padStart(2, '0')}:${String(hoy.getMinutes()).padStart(2, '0')}`

  const [boxIdx, setBoxIdx] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [fechaISO, setFechaISO] = useState(hoyISO)
  const [reservaEn, setReservaEn] = useState(null) // indice de franja con form abierto
  const [appointments, setAppointments] = useState([])

  const boxRealIdx = Math.min(boxIdx, boxes.length - 1)
  const box = boxes[boxRealIdx] ?? {}

  // Cargar turnos del backend (o mock) cuando cambia el día o el box.
  useEffect(() => {
    if (!tenantId || !box?.nombre) return
    let alive = true
    fetchAppointments(tenantId, fechaISO, box.nombre)
      .then((res) => {
        if (!alive) return
        setAppointments(res.data || [])
      })
      .catch(() => {
        if (!alive) return
        setAppointments([])
      })
    return () => { alive = false }
  }, [tenantId, fechaISO, box?.nombre])

  if (!boxes || boxes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <CalendarCheck className="h-12 w-12 text-slate-400" />
        <p className="mt-3 text-base font-semibold text-slate-700">Todavía no hay boxes</p>
        <p className="mt-1 text-sm text-slate-500">
          Crealos en la pestaña Configuración para ver la agenda.
        </p>
      </div>
    )
  }

  const enRango = (iso, desde, hasta) => iso >= desde && iso <= hasta
  const excepcionDelDia = (box.excepciones ?? []).find((e) => enRango(fechaISO, e.desde, e.hasta))
  const esPasado = fechaISO < hoyISO
  const excepcionDe = (date) => (box.excepciones ?? []).find((e) => enRango(toISO(date), e.desde, e.hasta))
  const strip = Array.from({ length: 7 }, (_, i) => addDays(hoy, weekOffset * 7 + i))
  const atiende = (date) =>
    (box.franjas ?? []).some((f) => (f.dias ?? []).includes(diaKey(date)))
  const franjasDelDia = (box.franjas ?? []).filter((f) =>
    (f.dias ?? []).includes(diaKey(parseISO(fechaISO))),
  )
  const tituloFecha =
    fechaISO === hoyISO
      ? 'Hoy'
      : parseISO(fechaISO).toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'numeric',
        })

  const refetchAppointments = () => {
    if (!tenantId || !box?.nombre) return
    fetchAppointments(tenantId, fechaISO, box.nombre)
      .then((res) => setAppointments(res.data || []))
      .catch(() => {})
  }

  const agregarReserva = async (reserva) => {
    try {
      await createAppointment(tenantId, {
        box: box.nombre,
        servicio: reserva.servicio || '',
        cliente: reserva.cliente,
        fecha: fechaISO,
        hora: reserva.hora,
        duracionMin: reserva.duracion_min || 30,
        origen: 'manual',
      })
      refetchAppointments()
      setReservaEn(null)
    } catch (err) {
      console.error('[AgendaTurnos] Error al crear turno:', err?.message || err)
    }
  }

  const eliminarReserva = async (id) => {
    try {
      await cancelAppointment(tenantId, id)
      refetchAppointments()
    } catch (err) {
      console.error('[AgendaTurnos] Error al cancelar turno:', err?.message || err)
    }
  }

  // Servicios ofrecibles en este box: los asignados, o todos si no asigno ninguno.
  const serviciosBox = (boxes[boxRealIdx]?.servicios ?? []).filter(Boolean)
  const serviciosTenant = (tenant?.config?.servicio?.list ?? [])
    .map((s) => s?.nombre)
    .filter(Boolean)
  const serviciosElegibles = serviciosBox.length > 0 ? serviciosBox : serviciosTenant

  const moverSemana = (dir) => {
    setReservaEn(null) // al cambiar de dia se cierra el formulario de reserva
    setWeekOffset((o) => o + dir)
    setFechaISO((prev) => toISO(addDays(parseISO(prev), dir * 7)))
  }
  const irAHoy = () => {
    setReservaEn(null)
    setWeekOffset(0)
    setFechaISO(hoyISO)
  }
  const saltarAFecha = (iso) => {
    if (!iso) return
    setReservaEn(null)
    setFechaISO(iso)
    const diff = Math.round((parseISO(iso) - parseISO(hoyISO)) / 86400000)
    setWeekOffset(Math.floor(diff / 7))
  }
  const elegirBox = (idx) => {
    setReservaEn(null)
    setBoxIdx(idx)
  }
  const elegirDia = (iso) => {
    setReservaEn(null)
    setFechaISO(iso)
  }

  return (
    <div className="space-y-4">
      {/* Boxes */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {boxes.map((b, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => elegirBox(idx)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              idx === Math.min(boxIdx, boxes.length - 1)
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {b.nombre || `Box #${idx + 1}`}
          </button>
        ))}
      </div>

      {/* Tira semanal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => moverSemana(-1)}
            className="rounded-lg px-2 py-1 text-lg font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <p className="text-sm font-semibold capitalize text-slate-700">
            {strip[0].toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </p>
          <button
            type="button"
            onClick={() => moverSemana(1)}
            className="rounded-lg px-2 py-1 text-lg font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Semana siguiente"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {strip.map((date) => {
            const iso = toISO(date)
            const selected = iso === fechaISO
            const esHoy = iso === hoyISO
            return (
              <button
                key={iso}
                type="button"
                onClick={() => elegirDia(iso)}
                className={`flex flex-col items-center rounded-xl px-1 py-2 transition ${
                  selected ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-slate-100'
                }`}
              >
                <span className={`text-[11px] font-semibold ${selected ? 'text-white/80' : 'text-slate-400'}`}>
                  {DIA_LABEL[diaKey(date)]}
                </span>
                <span className={`text-base font-bold ${selected ? '' : esHoy ? 'text-brand-700' : 'text-slate-800'}`}>
                  {date.getDate()}
                </span>
                <span
                  className={`mt-1 h-1.5 w-1.5 rounded-full ${excepcionDe(date) ? 'bg-rose-400' : atiende(date) ? 'bg-emerald-500' : selected ? 'bg-white/40' : 'bg-slate-200'}`}
                  title={
                    excepcionDe(date)
                      ? `Cerrado${excepcionDe(date).motivo ? `: ${excepcionDe(date).motivo}` : ''}`
                      : atiende(date)
                        ? 'El box atiende este día'
                        : 'El box no atiende este día'
                  }
                />
              </button>
            )
          })}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={irAHoy}
            className="text-xs font-semibold text-brand-700 transition hover:text-brand-800"
          >
            Volver a hoy
          </button>
          <input
            type="date"
            value={fechaISO}
            onChange={(e) => saltarAFecha(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600"
            aria-label="Saltar a una fecha"
          />
        </div>
      </div>

      {/* Franjas del dia */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold capitalize text-slate-800">
          {tituloFecha} · {box.nombre || 'Box'}
        </p>
        {excepcionDelDia ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <CalendarX className="h-5 w-5 shrink-0 text-rose-500" />
            <div>
              <p className="text-sm font-semibold text-rose-700">Cerrado</p>
              {excepcionDelDia.motivo && (
                <p className="text-xs text-rose-600">{excepcionDelDia.motivo}</p>
              )}
            </div>
          </div>
        ) : franjasDelDia.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Este box no atiende este día.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {franjasDelDia.map((f, i) => {
              const reservas = (appointments ?? [])
                .filter(
                  (r) =>
                    r.box === box.nombre &&
                    r.hora >= f.start &&
                    (r.hora_fin || sumarMinutos(r.hora, Number(r.duracion_min) || 30)) <= f.end,
                )
                .sort((a, b) => (a.hora < b.hora ? -1 : 1))
              return (
                <li
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <Clock className="h-4 w-4 text-brand-600" />
                      {f.start} – {f.end}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          reservas.length === 0
                            ? 'bg-slate-200/70 text-slate-500'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {reservas.length === 0
                          ? 'Sin turnos'
                          : `${reservas.length} turno${reservas.length !== 1 ? 's' : ''}`}
                      </span>
                      {!esPasado && !excepcionDelDia && (
                        <button
                          type="button"
                          onClick={() => setReservaEn(reservaEn === i ? null : i)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-brand-500 hover:text-brand-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Reservar
                        </button>
                      )}
                    </div>
                  </div>

                  {reservas.length > 0 && (
                    <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      {reservas.map((r) => (
                        <li key={r.id} className="flex items-center gap-2 px-3 py-2">
                          <span className="shrink-0 text-sm font-bold text-slate-800">{r.hora}</span>
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                            {r.cliente}
                            {r.servicio ? ` · ${r.servicio}` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => eliminarReserva(r.id)}
                            className="shrink-0 text-slate-400 transition hover:text-red-500"
                            aria-label={`Eliminar reserva de ${r.cliente}`}
                            title="Eliminar reserva"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {reservaEn === i && (
                    <ReservaForm
                      franja={f}
                      servicios={serviciosElegibles}
                      tenant={tenant}
                      existentes={(appointments ?? []).filter((r) => r.box === box.nombre && r.fecha === fechaISO)}
                      fechaISO={fechaISO}
                      hoyISO={hoyISO}
                      ahoraHHMM={ahoraHHMM}
                      onSave={agregarReserva}
                      onCancel={() => setReservaEn(null)}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-slate-400">
          Acordate de guardar la feature para que las reservas queden registradas.
          Los turnos agendados por la IA aparecerán acá.
        </p>
      </div>
    </div>
  )
}

function BoxEditForm({ box, onChange, onSave, onCancel, onDelete }) {
  const [confirmaEliminar, setConfirmaEliminar] = useState(false)
  const [excDesde, setExcDesde] = useState('')
  const [excHasta, setExcHasta] = useState('')
  const [excMotivo, setExcMotivo] = useState('')

  const boxExcepciones = box.excepciones ?? []

  const saveExcepciones = (lista) => {
    onChange({ ...box, excepciones: lista })
  }

  const addExcepcion = () => {
    if (!excDesde || !excHasta) return
    if (excDesde > excHasta) {
      setExcDesde('')
      setExcHasta('')
      return
    }
    if (
      boxExcepciones.some((e) => e.desde <= excHasta && excDesde <= e.hasta) // solapamiento
    ) {
      return
    }
    saveExcepciones([
      ...boxExcepciones,
      {
        id: crypto.randomUUID(),
        desde: excDesde,
        hasta: excHasta,
        motivo: excMotivo.trim(),
      },
    ])
    setExcDesde('')
    setExcHasta('')
    setExcMotivo('')
  }

  const removeExcepcion = (id) => {
    saveExcepciones(boxExcepciones.filter((e) => e.id !== id))
  }

  const fmtFechaCorta = (iso) => {
    const [y, m, d] = String(iso).split('-')
    return `${d}/${m}/${y}`
  }
  const fmtRango = (desde, hasta) => {
    if (!desde || !hasta) return ''
    if (desde === hasta) return fmtFechaCorta(desde)
    return `${fmtFechaCorta(desde)} al ${fmtFechaCorta(hasta)}`
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Nombre del box</label>
          <input
            type="text"
            value={box.nombre ?? ''}
            onChange={(e) => onChange({ ...box, nombre: e.target.value })}
            placeholder="Ej.: Gabinete 1, Consultorio Hnos. Peña"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Franjas horarias de este box
          </label>
          <FranjasHorario
            value={box.franjas ?? []}
            onChange={(franjas) => onChange({ ...box, franjas })}
          />
          {typeof box.horarios === 'string' && box.horarios.trim() !== '' && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700 ring-1 ring-inset ring-amber-600/10">
              Horario anterior en texto (ya no se usa para calcular): “{box.horarios.trim()}”.
              Se reemplaza al guardar con las franjas de arriba.
            </p>
          )}
          <p className="mt-1 text-[11px] text-slate-400">
            Para horario cortado añadí dos franjas (ej: 08:00-14:00 y 17:00-22:00).
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Servicios que pueden atenderse en este box</label>
          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 p-3">
            {box._serviciosDisponibles?.length === 0 ? (
              <p className="text-xs text-slate-400">
                No hay servicios cargados aún. Creá los servicios en la feature "Servicio" para asignarlos a este box.
              </p>
            ) : (
              box._serviciosDisponibles.map((servicio) => {
                const nombre = servicio.nombre
                const selected = (box.servicios ?? []).includes(nombre)
                return (
                  <button
                    key={nombre}
                    type="button"
                    onClick={() => {
                      const actuales = box.servicios ?? []
                      const next = selected
                        ? actuales.filter((s) => s !== nombre)
                        : [...actuales, nombre]
                      onChange({ ...box, servicios: next })
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                      selected
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'
                    }`}
                  >
                    {nombre || '(Sin nombre)'}
                  </button>
                )
              })
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Solo los servicios seleccionados podrán agendarse en este gabinete/consultorio.
          </p>
        </div>
      </div>

      {/* ---- Días cerrados de este box ---- */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
          <CalendarX className="h-4 w-4 text-slate-500" />
          Días cerrados de este box
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <label className="text-[10px] font-medium text-slate-500 text-center">
              Desde
            </label>
            <input
              type="date"
              value={excDesde}
              onChange={(e) => setExcDesde(e.target.value)}
              className="w-[150px] rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              aria-label="Fecha desde"
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <label className="text-[10px] font-medium text-slate-500 text-center">
              Hasta
            </label>
            <input
              type="date"
              value={excHasta}
              onChange={(e) => setExcHasta(e.target.value)}
              className="w-[150px] rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              aria-label="Fecha hasta"
            />
          </div>
          <div className="flex flex-col items-center gap-1 min-w-[140px]">
            <label className="text-[10px] font-medium text-slate-500 text-center">
              Motivo
            </label>
            <input
              type="text"
              value={excMotivo}
              onChange={(e) => setExcMotivo(e.target.value)}
              placeholder="Motivo (ej: Feriado)"
              className="w-[180px] rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <button
            type="button"
            onClick={addExcepcion}
            disabled={!excDesde || !excHasta}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Añadir
          </button>
        </div>
        {boxExcepciones.length > 0 && (
          <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {boxExcepciones.map((e) => (
              <li key={e.id} className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {fmtRango(e.desde, e.hasta)}
                  {e.motivo ? ` · ${e.motivo}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => removeExcepcion(e.id)}
                  className="shrink-0 text-slate-400 transition hover:text-red-500"
                  aria-label={`Quitar cierre del ${fmtRango(e.desde, e.hasta)}`}
                  title="Quitar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-slate-400">
          Los días cerrados de este box se respetan en la vista de agenda.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {onDelete &&
          (confirmaEliminar ? (
            <span className="mr-auto inline-flex items-center gap-2">
              <span className="text-xs font-semibold text-rose-600">
                Se borran franjas y reservas del box. ¿Seguro?
              </span>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmaEliminar(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                No
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmaEliminar(true)}
              className="mr-auto inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar box
            </button>
          ))}
        {!franjasValidas(box.franjas ?? []) && (
          <span className="mr-auto text-xs text-amber-600">
            Revisá las franjas: cada una necesita días y un rango válido.
          </span>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!franjasValidas(box.franjas ?? [])}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          Guardar box
        </button>
      </div>
    </div>
  )
}

function ConfigSection({ value, onChange, tenant }) {
  const config = value ?? {}
  const boxes = config.boxes ?? []
  const serviciosDisponibles = tenant?.config?.servicio?.list ?? []

  const [editIndex, setEditIndex] = useState(null)
  const [draft, setDraft] = useState(null)

  const startAdd = () => {
    setDraft({ nombre: '', franjas: [], servicios: [], _serviciosDisponibles: serviciosDisponibles })
    setEditIndex('new')
  }

  const startEdit = (idx) => {
    const box = boxes[idx] ?? {}
    setDraft({
      ...box,
      // Normaliza: franjas siempre array (boxes viejos traen `horarios` texto,
      // que se muestra como aviso y se reemplaza al guardar).
      franjas: Array.isArray(box.franjas) ? box.franjas : [],
      _serviciosDisponibles: serviciosDisponibles,
    })
    setEditIndex(idx)
  }

  const cancelEdit = () => {
    setDraft(null)
    setEditIndex(null)
  }

  const saveDraft = () => {
    const { _serviciosDisponibles, ...clean } = draft // eslint-disable-line no-unused-vars
    // Si ya hay franjas, el `horarios` texto legacy queda reemplazado.
    if ((clean.franjas ?? []).length > 0) delete clean.horarios
    if (editIndex === 'new') {
      update({ ...config, boxes: [...boxes, clean] })
    } else {
      const nextBoxes = boxes.map((b, i) => (i === editIndex ? clean : b))
      update({ ...config, boxes: nextBoxes })
    }
    cancelEdit()
  }

  const update = (next) => onChange(next)

  const removeBox = (idx) => {
    const nextBoxes = boxes.filter((_, i) => i !== idx)
    update({ ...config, boxes: nextBoxes })
  }

  const deleteEditBox = () => {
    if (editIndex !== 'new') removeBox(editIndex)
    cancelEdit()
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Boxes className="h-4 w-4 text-brand-600" />
              Boxes (gabinetes / consultorios)
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Cada box tiene su propia agenda. Asignale qué servicios puede atender y sus horarios.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-4">
            {boxes.length === 0 ? (
              <button
                type="button"
                onClick={startAdd}
                className="flex h-28 w-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white text-slate-500 transition hover:border-brand-500 hover:text-brand-700"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">Añadir nuevo box</span>
              </button>
            ) : (
              <>
                {boxes.map((box, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => startEdit(idx)}
                    className="flex h-28 w-56 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-500 hover:shadow"
                  >
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                      {box.nombre || `Box #${idx + 1}`}
                    </p>
                    <p className="text-xs text-slate-400">{(box.servicios ?? []).length} servicio{(box.servicios ?? []).length !== 1 ? 's' : ''} asignado{(box.servicios ?? []).length !== 1 ? 's' : ''} · {(box.franjas ?? []).length} franja{(box.franjas ?? []).length !== 1 ? 's' : ''}</p>
                  </button>
                ))}

                {boxes.length < 100 && (
                  <button
                    type="button"
                    onClick={startAdd}
                    className="flex h-28 w-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white text-slate-500 transition hover:border-brand-500 hover:text-brand-700"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-sm font-medium">Añadir nuevo box</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {editIndex !== null && draft && (
          <div className="mt-6">
            <BoxEditForm
              box={draft}
              onChange={setDraft}
              onSave={saveDraft}
              onCancel={cancelEdit}
              onDelete={editIndex === 'new' ? null : deleteEditBox}
            />
          </div>
        )}
      </section>
    </div>
  )
}

export default function AgendaTurnos({ value, onChange, tenant }) {
  const [tab, setTab] = useState('config')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5">
        <button
          type="button"
          onClick={() => setTab('ver')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            tab === 'ver'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Eye className="h-4 w-4" />
          Ver
        </button>
        <button
          type="button"
          onClick={() => setTab('config')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            tab === 'config'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Settings className="h-4 w-4" />
          Configuración
        </button>
        <div className="ml-auto flex items-center gap-1 text-xs text-slate-400">
          <Wrench className="h-3.5 w-3.5" />
          Vista previa del frontend
        </div>
      </div>

      {tab === 'ver' && <VerSection value={value} tenant={tenant} />}
      {tab === 'config' && <ConfigSection value={value} onChange={onChange} tenant={tenant} />}
    </div>
  )
}