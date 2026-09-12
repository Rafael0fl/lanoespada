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

import { BookOpen, Check, Plus, Trash2 } from 'lucide-react'

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