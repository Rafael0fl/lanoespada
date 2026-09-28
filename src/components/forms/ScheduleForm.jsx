/* ==========================================================================
 * ScheduleForm.jsx
 * --------------------------------------------------------------------------
 * Card reutilizable de horarios con 3 modos:
 *   1. "24 hs"        -> el valor es el string 'fulltime'.
 *   2. "Mismo horario"-> { start: 'HH:MM', end: 'HH:MM' }.
 *   3. "Por día"      -> { days: { lunes: { start, end }, ... } } (7 días).
 *
 * Se usa para DOS features con el mismo diseño:
 *   - "Horarios de atención comercial" (feature del tenant).
 *   - "Horarios de respuesta de IA" (config que edita el socio).
 *
 * Props:
 *   - value       : valor actual en el formato de arriba.
 *   - onChange    : (nextValue) => void  (componente controlado).
 *   - onSave      : () => void. Se dispara con el boton "Guardar" de la card.
 *   - saving      : bool para deshabilitar mientras guarda.
 *   - title       : titulo que se muestra dentro de la card.
 *   - fulltimeText: texto de la seccion "24 hs".
 * ========================================================================== */

import { Clock, Save } from 'lucide-react'

const DAYS = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

const MODES = [
  { key: 'fulltime', label: '24 hs' },
  { key: 'schedule', label: 'Mismo horario' },
  { key: 'daily', label: 'Por día' },
]

const DEFAULT_START = '08:00'
const DEFAULT_END = '17:00'

const inputTimeClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

/* Deduce en que modo estamos segun el valor guardado. */
function modeOf(value) {
  if (value && typeof value === 'object' && value.days) return 'daily'
  if (value && typeof value === 'object' && value.start) return 'schedule'
  return 'fulltime'
}

/* Rango de horario "base": sirve para precargar al cambiar de modo. */
function toRange(value) {
  if (modeOf(value) === 'schedule') {
    return {
      start: value.start || DEFAULT_START,
      end: value.end || DEFAULT_END,
    }
  }
  if (modeOf(value) === 'daily') {
    const day = DAYS.find((d) => value.days[d.key]?.start)
    return day
      ? { start: value.days[day.key].start, end: value.days[day.key].end }
      : { start: DEFAULT_START, end: DEFAULT_END }
  }
  return { start: DEFAULT_START, end: DEFAULT_END }
}

export default function ScheduleForm({
  title = 'Horarios',
  value,
  onChange,
  onSave,
  saving = false,
  fulltimeText = 'Las 24 horas, todos los días.',
}) {
  const mode = modeOf(value)
  const days = value && typeof value === 'object' && value.days ? value.days : {}

  const switchTo = (nextMode) => {
    if (nextMode === mode) return
    if (nextMode === 'fulltime') {
      onChange('fulltime')
      return
    }
    const range = toRange(value)
    if (nextMode === 'schedule') {
      onChange({ start: range.start, end: range.end })
      return
    }
    const nextDays = {}
    DAYS.forEach((d) => {
      nextDays[d.key] = days[d.key]
        ? { ...days[d.key] }
        : { start: range.start, end: range.end }
    })
    onChange({ days: nextDays })
  }

  const setRangeField = (field, val) => {
    onChange({ ...value, [field]: val })
  }

  const setDayField = (dayKey, field, val) => {
    onChange({
      days: {
        ...days,
        [dayKey]: { ...(days[dayKey] ?? {}), [field]: val },
      },
    })
  }

  const isValid =
    mode === 'fulltime' ||
    (mode === 'schedule' &&
      Boolean(value?.start) &&
      Boolean(value?.end)) ||
    (mode === 'daily' &&
      DAYS.every((d) => Boolean(days[d.key]?.start) && Boolean(days[d.key]?.end)))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5">
        {/* Titulo */}
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Clock className="h-4 w-4 text-brand-600" />
          {title}
        </h3>

        <hr className="my-4 border-slate-100" />

        {/* Selector de modo */}
        <div className="flex flex-wrap gap-2">
          {MODES.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => switchTo(opt.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === opt.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <hr className="my-4 border-slate-100" />

        {/* Seccion segun modo */}
        {mode === 'fulltime' && (
          <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
            {fulltimeText}
          </p>
        )}

        {mode === 'schedule' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Hora de inicio
              </label>
              <input
                type="time"
                value={value?.start ?? ''}
                onChange={(e) => setRangeField('start', e.target.value)}
                className={inputTimeClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Hora de fin
              </label>
              <input
                type="time"
                value={value?.end ?? ''}
                onChange={(e) => setRangeField('end', e.target.value)}
                className={inputTimeClass}
              />
            </div>
          </div>
        )}

        {mode === 'daily' && (
          <div className="space-y-2">
            {DAYS.map((d) => (
              <div
                key={d.key}
                className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[120px_1fr_auto_1fr]"
              >
                <span className="col-span-2 text-sm font-medium text-slate-700 sm:col-span-1">
                  {d.label}
                </span>
                <input
                  type="time"
                  value={days[d.key]?.start ?? ''}
                  onChange={(e) => setDayField(d.key, 'start', e.target.value)}
                  className={inputTimeClass}
                  aria-label={`Hora de inicio ${d.label}`}
                />
                <span className="hidden text-xs text-slate-400 sm:block">a</span>
                <input
                  type="time"
                  value={days[d.key]?.end ?? ''}
                  onChange={(e) => setDayField(d.key, 'end', e.target.value)}
                  className={inputTimeClass}
                  aria-label={`Hora de fin ${d.label}`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Guardar (solo si onSave viene definido) */}
        {onSave && (
          <>
            <hr className="my-4 border-slate-100" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {!isValid && (
                <span className="text-xs text-slate-500">
                  Completá los horarios para guardar.
                </span>
              )}
              <button
                type="button"
                onClick={onSave}
                disabled={!isValid || saving}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}