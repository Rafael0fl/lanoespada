/* ==========================================================================
 * TenantBars.jsx
 * --------------------------------------------------------------------------
 * Grafico de barras horizontales sin dependencias (CSS puro).
 * Usado en Metricas para comparar tenants por chats / mensajes / tokens.
 *
 * Props:
 *   - items  : [{ label, value }]  (ya ordenados u ordenar por value desc)
 *   - color  : clase de color del relleno (bg-brand-600 | bg-sky-500 | bg-violet-500)
 *   - format : (value) => string  (formateo del numero a la derecha)
 * ========================================================================== */

export default function TenantBars({ items, color = 'bg-brand-600', format }) {
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const max = Math.max(1, ...sorted.map((i) => i.value))

  return (
    <div className="space-y-3">
      {sorted.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          {/* Nombre del tenant */}
          <span className="w-40 shrink-0 truncate text-xs font-medium text-slate-600" title={item.label}>
            {item.label}
          </span>
          {/* Barra */}
          <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-slate-100">
            <div
              className={`flex h-full items-center rounded-lg transition-all duration-500 ${color}`}
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
          {/* Valor */}
          <span className="w-20 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-900">
            {format ? format(item.value) : item.value.toLocaleString('es-AR')}
          </span>
        </div>
      ))}
    </div>
  )
}