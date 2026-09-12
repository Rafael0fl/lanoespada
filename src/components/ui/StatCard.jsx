/* ==========================================================================
 * StatCard.jsx
 * --------------------------------------------------------------------------
 * Tarjeta de metrica reutilizable. Se usa en todos los dashboards.
 *
 * Props:
 *   - label     : texto del dashboard (espanol).
 *   - value     : valor principal de la metrica.
 *   - icon      : componente de lucide-react.
 *   - hint      : texto secundario opcional (ej: "+12% vs ayer").
 *   - accent    : clase de color para el icono (ej: text-brand-600).
 * ========================================================================== */

export default function StatCard({ label, value, icon: Icon, hint, accent = 'text-brand-600' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Etiqueta de la metrica (texto visible, en espanol) */}
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {/* Icono de lucide */}
        <div className={`rounded-xl bg-slate-50 p-2.5 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}