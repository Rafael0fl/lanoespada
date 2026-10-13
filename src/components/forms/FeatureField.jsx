/* ==========================================================================
 * FeatureField.jsx
 * --------------------------------------------------------------------------
 * Renderizador generico de campos para las funciones (features) de un
 * negocio. Se usa tanto en el registro del socio como en la configuracion
 * del cliente.
 *
 * Props:
 *   - field    : descriptor de campo desde INDUSTRY_SCHEMA
 *                (puede ser text, textarea, number, checkbox, multiselect
 *                o dynamicList).
 *   - value    : valor actual del campo.
 *   - onChange : (nextValue) => void. Recibe el nuevo valor del campo,
 *                dejando que el componente padre lo guarde en su estado.
 *
 * Asi el formulario solo declara el estado una vez y delega el render.
 * ========================================================================== */

import { useState } from 'react'
import { BookOpen, Check, ChevronDown, Plus, Trash2 } from 'lucide-react'

import AgendaTurnos from './AgendaTurnos'
import PromoEventList from './PromoEventList'
import { FEATURE_BY_KEY, formatDuracion } from '../../data/mockBackend'

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

export default function FeatureField({ field, value, onChange }) {
  switch (field.type) {
    /* -------------------------- texto -------------------------- */
    case 'text':
      return (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )

    /* --------------------- area de texto ----------------------- */
    case 'textarea':
      return (
        <textarea
          rows={3}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={`${inputClass} resize-y`}
        />
      )

    /* ------------------------- numerico ------------------------ */
    case 'number':
      return (
        <input
          type="number"
          min="0"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )

    /* ----------------------- checkbox simple ------------------- */
    case 'checkbox':
      return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-brand-600"
          />
          <span className="text-sm text-slate-700">{field.label}</span>
        </div>
      )

    /* --------------- lista simple de strings (libre) ------------- */
    /* La crea el tenant: input + boton "Añadir" y cada item con
       boton para eliminarlo de la lista.                        */
    case 'stringList':
      return <StringListField field={field} value={value} onChange={onChange} />

    /* ------------ lista de objetos (titulo + descripcion) ------ */
    /* Simil stringList pero cada item guarda varios campos.        */
    case 'objectList':
      return <ObjectListField field={field} value={value} onChange={onChange} />

    /* ------- lista de promociones / eventos (titulo, validez) -- */
    case 'promoEventList':
      return <PromoEventList field={field} value={value} onChange={onChange} />

    /* ------------ componente custom (agenda_turnos) ------------ */
    case 'custom': {
      if (field.component === 'AgendaTurnos') {
        return <AgendaTurnos value={value} onChange={onChange} tenant={field._tenant} />
      }
      return (
        <p className="text-xs text-slate-400">Componente no soportado: {field.component}</p>
      )
    }

    /* ------------------- seleccion multiple -------------------- */
    case 'multiselect':
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((option) => {
            const selected = (value ?? []).includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  const next = selected
                    ? (value ?? []).filter((o) => o !== option)
                    : [...(value ?? []), option]
                  onChange(next)
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                  selected
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'
                }`}
              >
                {selected && <Check className="h-3.5 w-3.5" />}
                {option}
              </button>
            )
          })}
        </div>
      )

    /* ---------------------- lista dinamica --------------------- */
    /* Rows: arreglo de objetos. Cada fila edita sus itemFields.   */
    case 'dynamicList': {
      const rows = value ?? []
      const updateRows = (nextRows) => onChange(nextRows)

      return (
        <div className="space-y-3">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="relative rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {field.itemTitle} #{rowIndex + 1}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {field.itemFields.map((itemField) => (
                  <div key={itemField.key}>
                    {itemField.type === 'number' ? (
                      <input
                        type="number"
                        min="0"
                        value={row[itemField.key] ?? ''}
                        onChange={(e) => {
                          const next = rows.map((r, i) =>
                            i === rowIndex
                              ? { ...r, [itemField.key]: e.target.value }
                              : r,
                          )
                          updateRows(next)
                        }}
                        placeholder={itemField.placeholder}
                        className={inputClass}
                      />
                    ) : (
                      <input
                        type="text"
                        value={row[itemField.key] ?? ''}
                        onChange={(e) => {
                          const next = rows.map((r, i) =>
                            i === rowIndex
                              ? { ...r, [itemField.key]: e.target.value }
                              : r,
                          )
                          updateRows(next)
                        }}
                        placeholder={itemField.placeholder}
                        className={inputClass}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Boton quitar fila */}
              <button
                type="button"
                onClick={() => updateRows(rows.filter((_, i) => i !== rowIndex))}
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow transition hover:text-red-500"
                aria-label={`Quitar ${field.itemTitle}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Boton agregar fila */}
          <button
            type="button"
            onClick={() => {
              const emptyRow = {}
              field.itemFields.forEach((item) => {
                emptyRow[item.key] = ''
              })
              updateRows([...rows, emptyRow])
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" />
            Agregar {field.itemTitle.toLowerCase()}
          </button>
        </div>
      )
    }

    /* -------------------- tipo desconocido --------------------- */
    default:
      return (
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <BookOpen className="h-3.5 w-3.5" />
          Tipo de campo no soportado: {field.type}
        </p>
      )
  }
}

/* --------------------------------------------------------------------------
 * stringList: lista de textos libre que crea el tenant.
 * Rendering propio (con su estado local) para respetar las reglas de hooks.
 * ------------------------------------------------------------------------ */
function StringListField({ field, value, onChange }) {
  const [draft, setDraft] = useState('')

  const addLabel = field.addLabel ?? 'Añadir'
  const listLabel = field.listLabel ?? 'Lista'
  const items = value ?? []

  const add = () => {
    const name = draft.trim()
    if (!name || items.includes(name)) return
    onChange([...items, name])
    setDraft('')
  }

  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{addLabel}</p>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={field.placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Añadir
        </button>
      </div>

      <hr className="my-4 border-slate-100" />

      <p className="text-sm font-semibold text-slate-700">{listLabel}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">Todavía no agregaste ninguna.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {items.map((item) => (
            <li key={item} className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="min-w-0 truncate text-sm text-slate-700">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x !== item))}
                className="shrink-0 text-slate-400 transition hover:text-red-500"
                aria-label={`Eliminar ${item}`}
                title="Eliminar de la lista"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* --------------------------------------------------------------------------
 * objectList: lista de objetos que crea el tenant. Cada item tiene un campo
 * "titulo" visible en la fila y campos restantes que se despliegan al tocar
 * la flecha. Ej: políticas (titulo + descripcion).
 * ------------------------------------------------------------------------ */
function ObjectListField({ field, value, onChange }) {
  const [draft, setDraft] = useState({})
  const [expanded, setExpanded] = useState(null)

  const items = value ?? []
  const itemTitle = field.itemTitle ?? 'elemento'
  const { itemFields = [] } = field
  const addLabel = field.addLabel ?? `Añadir ${itemTitle}`
  const listLabel = field.listLabel ?? 'Lista'
  const [titleField, ...restFields] = itemFields

  /* Opciones de un sub-campo `select`: estaticas (`f.options`) o dinamicas
     de otra feature (`f.optionsSource` -> tenant.config[source].list,
     ej: Profesionales). Sin tenant (registro del socio) la lista es vacia. */
  const optionsFor = (f) => {
    if (!f.optionsSource) return f.options ?? []
    const list = field._tenant?.config?.[f.optionsSource]?.list ?? []
    const labelKey = f.optionsLabel ?? 'nombre'
    return list.map((item) => String(item?.[labelKey] ?? '').trim()).filter(Boolean)
  }
  const sourceLabel = (key) => FEATURE_BY_KEY[key]?.label ?? key

  const requiredFilled = itemFields.every((f) =>
    f.required
      ? f.type === 'duration'
        ? (Number(draft[f.key]) || 0) > 0
        : String(draft[f.key] ?? '').trim() !== ''
      : true,
  )

  const setDraftField = (key, next) => setDraft((prev) => ({ ...prev, [key]: next }))

  const add = () => {
    if (!requiredFilled) return
    const item = {}
    itemFields.forEach((f) => {
      // duration se guarda como minutos (int), no como texto.
      item[f.key] = f.type === 'duration' ? (Number(draft[f.key]) || 0) : String(draft[f.key] ?? '').trim()
    })
    onChange([...items, item])
    setDraft({})
  }

  // Como se muestra un sub-campo en la vista expandida del item guardado.
  const displayItemValue = (f, item) => {
    if (f.type === 'duration') {
      return (
        formatDuracion(item[f.key]) ||
        (f.legacyKey && item[f.legacyKey] ? String(item[f.legacyKey]) : '')
      )
    }
    return String(item[f.key] ?? '').trim()
  }

  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{addLabel}</p>

      <div className="mt-3 space-y-3">
        {itemFields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              {f.label}
              {f.required ? ' *' : ''}
            </label>
            {f.type === 'textarea' ? (
              <textarea
                rows={2}
                value={draft[f.key] ?? ''}
                onChange={(e) => setDraftField(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={`${inputClass} resize-y`}
              />
            ) : f.type === 'duration' ? (
              <DurationDraft
                value={draft[f.key]}
                onChange={(min) => setDraftField(f.key, min)}
              />
            ) : f.type === 'select' ? (
              <div>
                <select
                  value={draft[f.key] ?? ''}
                  onChange={(e) => setDraftField(f.key, e.target.value)}
                  className={inputClass}
                >
                  <option value="">{f.placeholder ?? 'Seleccionar...'}</option>
                  {optionsFor(f).map((opt) => (
                    <option key={opt.value ?? opt} value={opt.value ?? opt}>
                      {opt.label ?? opt}
                    </option>
                  ))}
                </select>
                {f.optionsSource && optionsFor(f).length === 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    Todavía no cargaste nada en {sourceLabel(f.optionsSource)} — hacelo
                    primero y después volvé acá.
                  </p>
                )}
              </div>
            ) : (
              <input
                type={f.type === 'number' ? 'number' : 'text'}
                min={f.type === 'number' ? '0' : undefined}
                value={draft[f.key] ?? ''}
                onChange={(e) => setDraftField(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={inputClass}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={add}
          disabled={!requiredFilled}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Añadir
        </button>
        {!requiredFilled && (
          <span className="text-xs text-slate-400">
            Los campos marcados con * son obligatorios.
          </span>
        )}
      </div>

      <hr className="my-4 border-slate-100" />

      <p className="text-sm font-semibold text-slate-700">{listLabel}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">Todavía no agregaste ninguna.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {items.map((item, index) => {
            const title = titleField
              ? String(item[titleField.key] ?? '').trim() || `#${index + 1}`
              : `#${index + 1}`
            const isOpen = expanded === index
            return (
              <li key={index}>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : index)}
                    className="shrink-0 text-slate-400 transition hover:text-slate-600"
                    aria-label={`Ver descripción de ${title}`}
                    title={isOpen ? 'Ocultar descripción' : 'Ver descripción'}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                    {title}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                    className="shrink-0 text-slate-400 transition hover:text-red-500"
                    aria-label={`Eliminar ${title}`}
                    title="Eliminar de la lista"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {isOpen && restFields.length > 0 && (
                  <div className="border-t border-slate-100 px-3 py-2.5 pl-9">
                    {restFields.map((f) => (
                      <div key={f.key} className="mb-2 last:mb-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {f.label}
                        </p>
                        <p className="whitespace-pre-line text-sm text-slate-600">
                          {displayItemValue(f, item) || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* --------------------------------------------------------------------------
 * DurationDraft: editor de duracion en horas + minutos para el draft de un
 * objectList. Guarda minutos totales (int). Minutos se acota a 0-59.
 * ------------------------------------------------------------------------ */
function DurationDraft({ value, onChange }) {
  const total = Number(value) || 0
  const horas = Math.floor(total / 60)
  const minutos = total % 60

  const set = (h, m) => onChange(h * 60 + m)

  const numClass = `${inputClass} mt-1`
  return (
    <div>
      <div className="flex gap-2">
        <label className="flex-1 text-xs font-medium text-slate-500">
          Horas
          <input
            type="number"
            min="0"
            max="12"
            value={horas}
            onChange={(e) => set(Math.max(0, Number(e.target.value) || 0), minutos)}
            className={numClass}
          />
        </label>
        <label className="flex-1 text-xs font-medium text-slate-500">
          Minutos
          <input
            type="number"
            min="0"
            max="59"
            value={minutos}
            onChange={(e) => {
              const m = Number(e.target.value) || 0
              set(horas, Math.min(59, Math.max(0, m)))
            }}
            className={numClass}
          />
        </label>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Total: {formatDuracion(total) || '—'}
      </p>
    </div>
  )
}