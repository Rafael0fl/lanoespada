/* ==========================================================================
 * Badge.jsx
 * --------------------------------------------------------------------------
 * Etiqueta/badge de estado reutilizable.
 *
 * Props:
 *   - children : texto a mostrar (espanol).
 *   - color    : variante visual:
 *                'green' | 'red' | 'amber' | 'slate' | 'gray'
 *   - dot      : si es true, muestra un puntito del color del estado.
 * ========================================================================== */

const BADGE_STYLES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  gray: 'bg-slate-50 text-slate-500 ring-slate-400/20',
}

const DOT_STYLES = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-400',
  gray: 'bg-slate-300',
}

export default function Badge({ children, color = 'slate', dot = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${BADGE_STYLES[color]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[color]}`} />}
      {children}
    </span>
  )
}