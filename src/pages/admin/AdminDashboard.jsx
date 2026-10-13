/* ==========================================================================
 * AdminDashboard.jsx
 * --------------------------------------------------------------------------
 * Panel del rol 'admin' (ruta /admin).
 *
 * Estado actual: placeholder. A la izquierda, tarjeta "Pendiente" (el panel
 * real de administracion se construye mas adelante). A la derecha, la
 * fabula "Muerte en Teheran" que Viktor Frankl recoge en
 * "El hombre en busca de sentido".
 * ========================================================================== */

export default function AdminDashboard() {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
      {/* Izquierda: pendiente */}
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
        <p className="text-lg font-bold text-slate-800">Pendiente</p>
        <p className="mt-2 text-sm text-slate-500">
          Acá va el panel de administración: negocios, métricas globales y
          respaldos. Todavía no está construido.
        </p>
      </section>

      {/* Derecha: la fabula */}
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Para leer mientras tanto
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Muerte en Teherán
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Fábula que Viktor Frankl recoge en “El hombre en busca de sentido”.
        </p>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            Un rico persa paseaba una mañana con su criado, cuando este se cruzó
            con la Muerte y sintió que lo amenazaba con la mirada. Temblando,
            el criado le rogó a su amo que le prestara su caballo más veloz
            para huir a Teherán y despedirse de su familia. El amo aceptó.
          </p>
          <p>
            Más tarde, el amo se encontró con la Muerte y le reclamó: “¿Por qué
            asustaste así a mi criado?”. Y la Muerte respondió: “No fue una
            amenaza. Solo me sorprendió verlo aquí esta mañana, cuando tengo
            una cita con él esta noche en Teherán”.
          </p>
          <p className="border-l-2 border-brand-500 pl-3 text-slate-600 italic">
            La ironía: huyendo de su destino, corrió directo hacia él.
          </p>
        </div>
      </article>
    </div>
  )
}
