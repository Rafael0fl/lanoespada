/* ==========================================================================
 * PromoEventList.jsx
 * --------------------------------------------------------------------------
 * Lista de promociones y/o eventos que crea el tenant.
 *
 * Cada item guarda:
 *   {
 *     id: string,
 *     titulo: string,
 *     tipo: 'promocion' | 'evento',
 *     desde: 'YYYY-MM-DD',
 *     hasta: 'YYYY-MM-DD',
 *     descripcion: string,
 *     activo: boolean,
 *   }
 *
 * Estructura:
 *   - Formulario "Nueva promoción o evento" (título, check promoción/evento,
 *     validez desde/hasta, descripción) + boton "Añadir".
 *   - Filtro Promociones / Eventos / Todos.
 *   - Lista con 4 acciones por fila: activar/desactivar (check), modificar
 *     (engranaje), desplegar info, eliminar.
 *
 * Regla especial: al crearse, el check arranca activado. Si se desactiva y
 * luego se vuelve a activar, hay que reconfigurar la fecha de validez (se
 * limpian desde/hasta y se abre el editor con un aviso).
 * ========================================================================== */

import { useState } from 'react'
import { Calendar, Check, ChevronDown, Plus, Settings, Trash2 } from 'lucide-react'

import FeatureTabs from './FeatureTabs'

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

const TIPO_OPTIONS = [
  { key: 'promocion', label: 'Promoción' },
  { key: 'evento', label: 'Evento' },
]

const FILTERS = [
  { key: 'promociones', label: 'Promociones' },
  { key: 'eventos', label: 'Eventos' },
  { key: 'todos', label: 'Todos' },
]

let uidCounter = 0
function uid() {
  uidCounter += 1
  return `pe-${Date.now().toString(36)}-${uidCounter}-${Math.random().toString(36).slice(2, 7)}`
}

function fmtDate(iso) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

/* --------------------------------------------------------------------------
 * Editor inline de un item (tambien se usa al reactivar para reconfigurar
 * la validez). Componente sin hooks: solo render + callbacks.
 * ------------------------------------------------------------------------ */
function EditPanel({ draft, onDraft, onSave, onCancel, hint }) {
  const canSave =
    Boolean(draft?.titulo?.trim()) &&
    Boolean(draft?.tipo) &&
    Boolean(draft?.desde?.trim()) &&
    Boolean(draft?.hasta?.trim()) &&
    Boolean(draft?.descripcion?.trim())

  return (
    <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 px-3 py-3">
      {hint && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-inset ring-amber-600/10">
          {hint}
        </p>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Título</label>
        <input
          type="text"
          value={draft?.titulo ?? ''}
          onChange={(e) => onDraft((prev) => ({ ...prev, titulo: e.target.value }))}
          placeholder="Ej: Descuento 2x1, Jornada de salud…"
          className={inputClass}
        />
      </div>

      <div className="flex gap-6">
        {TIPO_OPTIONS.map((opt) => (
          <label
            key={opt.key}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={draft?.tipo === opt.key}
              onChange={() => onDraft((prev) => ({ ...prev, tipo: opt.key }))}
              className="h-4 w-4 rounded border-slate-300 accent-brand-600"
            />
            {opt.label}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Validez desde</label>
          <input
            type="date"
            value={draft?.desde ?? ''}
            onChange={(e) => onDraft((prev) => ({ ...prev, desde: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Validez hasta</label>
          <input
            type="date"
            value={draft?.hasta ?? ''}
            onChange={(e) => onDraft((prev) => ({ ...prev, hasta: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Descripción</label>
        <textarea
          rows={2}
          value={draft?.descripcion ?? ''}
          onChange={(e) => onDraft((prev) => ({ ...prev, descripcion: e.target.value }))}
          placeholder="Detalle de la promo o evento…"
          className={`${inputClass} resize-y`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex shrink-0 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
        {!canSave && (
          <span className="text-xs text-slate-400">
            Completá título, validez y descripción.
          </span>
        )}
      </div>
    </div>
  )
}

export default function PromoEventList({ field, value, onChange }) {
  const items = value ?? []

  const [draft, setDraft] = useState({
    titulo: '',
    tipo: 'promocion',
    desde: '',
    hasta: '',
    descripcion: '',
  })
  const [filter, setFilter] = useState('todos')
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [fromReactivate, setFromReactivate] = useState(false)

  const addLabel = field.addLabel ?? 'Nueva promoción o evento'
  const listLabel = field.listLabel ?? 'Promociones y eventos'

  const filtered = items.filter((item) => {
    if (filter === 'promociones') return item.tipo === 'promocion'
    if (filter === 'eventos') return item.tipo === 'evento'
    return true
  })

  const canAdd =
    Boolean(draft.titulo.trim()) &&
    Boolean(draft.tipo) &&
    Boolean(draft.desde.trim()) &&
    Boolean(draft.hasta.trim()) &&
    Boolean(draft.descripcion.trim())

  const add = () => {
    if (!canAdd) return
    onChange([
      ...items,
      {
        id: uid(),
        titulo: draft.titulo.trim(),
        tipo: draft.tipo,
        desde: draft.desde,
        hasta: draft.hasta,
        descripcion: draft.descripcion.trim(),
        activo: true, // arranca activada
      },
    ])
    setDraft({ titulo: '', tipo: 'promocion', desde: '', hasta: '', descripcion: '' })
  }

  const patchItem = (id, patch) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  const removeItem = (id) => onChange(items.filter((item) => item.id !== id))

  /* Activar/desactivar con la regla de reconfigurar la validez. */
  const toggleActivo = (item) => {
    if (item.activo) {
      patchItem(item.id, { activo: false })
      return
    }
    // Se vuelve a activar: se reinicia la validez y se abre el editor.
    patchItem(item.id, { activo: true, desde: '', hasta: '' })
    setEditDraft({ ...item, desde: '', hasta: '' })
    setEditingId(item.id)
    setExpandedId(null)
    setFromReactivate(true)
  }

  const startEdit = (item) => {
    setEditDraft({ ...item })
    setEditingId(item.id)
    setExpandedId(null)
    setFromReactivate(false)
  }

  const saveEdit = (id) => {
    const d = editDraft
    if (!d || !d.titulo.trim() || !d.tipo || !d.desde.trim() || !d.hasta.trim() || !d.descripcion.trim())
      return
    patchItem(id, {
      titulo: d.titulo.trim(),
      tipo: d.tipo,
      desde: d.desde,
      hasta: d.hasta,
      descripcion: d.descripcion.trim(),
    })
    setEditingId(null)
    setEditDraft(null)
    setFromReactivate(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(null)
    setFromReactivate(false)
  }

  return (
    <FeatureTabs
      count={items.length}
      renderForm={() => (
        <div>
          {/* ---- Formulario de alta ---- */}
          <p className="text-sm font-semibold text-slate-700">{addLabel}</p>

      <div className="mt-3 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Título</label>
          <input
            type="text"
            value={draft.titulo}
            onChange={(e) => setDraft((prev) => ({ ...prev, titulo: e.target.value }))}
            placeholder="Ej: Descuento 2x1, Jornada de salud…"
            className={inputClass}
          />
        </div>

        <div className="flex gap-6">
          {TIPO_OPTIONS.map((opt) => (
            <label
              key={opt.key}
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={draft.tipo === opt.key}
                onChange={() => setDraft((prev) => ({ ...prev, tipo: opt.key }))}
                className="h-4 w-4 rounded border-slate-300 accent-brand-600"
              />
              {opt.label}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Validez desde</label>
            <input
              type="date"
              value={draft.desde}
              onChange={(e) => setDraft((prev) => ({ ...prev, desde: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Validez hasta</label>
            <input
              type="date"
              value={draft.hasta}
              onChange={(e) => setDraft((prev) => ({ ...prev, hasta: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Descripción</label>
          <textarea
            rows={3}
            value={draft.descripcion}
            onChange={(e) => setDraft((prev) => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Detalle de la promo o evento…"
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={add}
          disabled={!canAdd}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Añadir
        </button>
        {!canAdd && (
          <span className="text-xs text-slate-400">
            Completá título, validez y descripción para añadir.
          </span>
        )}
      </div>

      </div>
      )}
      renderList={() => (
        <div>
          {/* ---- Lista + filtro ---- */}
          <p className="text-sm font-semibold text-slate-700">{listLabel}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              filter === f.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Todavía no agregaste ninguna.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {filtered.map((item) => {
            const isEditing = editingId === item.id
            const isOpen = expandedId === item.id
            return (
              <li key={item.id} className={item.activo ? '' : 'opacity-60'}>
                {isEditing ? (
                  <EditPanel
                    draft={editDraft}
                    onDraft={setEditDraft}
                    onSave={() => saveEdit(item.id)}
                    onCancel={cancelEdit}
                    hint={
                      fromReactivate
                        ? 'Al volver a activar, configurá la nueva validez.'
                        : null
                    }
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 px-3 py-2.5">
                      {/* Check activar/desactivar */}
                      <input
                        type="checkbox"
                        checked={item.activo}
                        onChange={() => toggleActivo(item)}
                        className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand-600"
                        title={item.activo ? 'Desactivar' : 'Activar'}
                        aria-label={item.activo ? 'Desactivar' : 'Activar'}
                      />

                      <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-brand-700">
                        {item.tipo}
                      </span>

                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                        {item.titulo}
                      </span>

                      {/* Engranaje: modificar */}
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="shrink-0 text-slate-400 transition hover:text-slate-700"
                        title="Modificar datos"
                        aria-label={`Modificar ${item.tipo}`}
                      >
                        <Settings className="h-4 w-4" />
                      </button>

                      {/* Desplegar info */}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : item.id)}
                        className="shrink-0 text-slate-400 transition hover:text-slate-600"
                        title={isOpen ? 'Ocultar información' : 'Desplegar información'}
                        aria-label="Desplegar información"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 text-slate-400 transition hover:text-red-500"
                        title="Eliminar de la lista"
                        aria-label={`Eliminar ${item.tipo}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {isOpen && (
                      <div className="border-t border-slate-100 px-3 py-2.5 pl-[52px]">
                        <p className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          Validez: {fmtDate(item.desde) || '—'} → {fmtDate(item.hasta) || '—'}
                        </p>
                        <p className="whitespace-pre-line text-sm text-slate-600">
                          {item.descripcion}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </li>
            )
          })}
            </ul>
          )}
        </div>
      )}
    />
  )
}