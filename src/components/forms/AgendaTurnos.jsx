/* ==========================================================================
 * AgendaTurnos.jsx
 * --------------------------------------------------------------------------
 * Configuración de la Agenda de Turnos. Especificación pedida:
 *   - Dos botones: "Ver" y "Configuración"
 *   - "Ver": por ahora mensaje "pendiente en terminarse"
 *   - "Configuración": Boxes (con layout horizontal de cards)
 * -------------------------------------------------------------------------- */
import { useState } from 'react'
import { Boxes, CalendarCheck, Clock, Plus, Eye, Settings, Trash2, Wrench } from 'lucide-react'

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
            <div className="mt-2 flex items-center gap-2">
              <input
                type="time"
                value={f.start ?? ''}
                onChange={(e) => patch(idx, { ...f, start: e.target.value })}
                className={inputClass}
                aria-label="Hora de inicio"
              />
              <span className="shrink-0 text-sm text-slate-400">→</span>
              <input
                type="time"
                value={f.end ?? ''}
                onChange={(e) => patch(idx, { ...f, end: e.target.value })}
                className={inputClass}
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

function VerSection() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <CalendarCheck className="h-12 w-12 text-slate-400" />
      <p className="mt-3 text-base font-semibold text-slate-700">Vista de agenda pendiente</p>
      <p className="mt-1 text-sm text-slate-500">
        Esta sección está pendiente de terminarse. Se mostrará la grilla de turnos una vez definida la configuración de boxes.
      </p>
    </div>
  )
}

function BoxEditForm({ box, onChange, onSave, onCancel }) {
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

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
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

  // Botón eliminar disponible si se desea en futuro
  // eslint-disable-next-line no-unused-vars
  const removeBox = (idx) => {
    if (editIndex === idx || editIndex === 'new') cancelEdit()
    const nextBoxes = boxes.filter((_, i) => i !== idx)
    update({ ...config, boxes: nextBoxes })
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

      {tab === 'ver' && <VerSection />}
      {tab === 'config' && <ConfigSection value={value} onChange={onChange} tenant={tenant} />}
    </div>
  )
}