/* ==========================================================================
 * FeatureTabs.jsx
 * --------------------------------------------------------------------------
 * Pestañas Ver / Configuración para las features de lista: en "Ver" está
 * lo creado, en "Configuración" el formulario de alta. Al añadir un item
 * salta solo a Ver; si no hay nada creado, arranca en Configuración.
 *
 * Props:
 *   - count      : cantidad de items (badge en la pestaña Ver).
 *   - renderForm : () => JSX del formulario de alta.
 *   - renderList : () => JSX de la lista creada.
 * ========================================================================== */

import { useEffect, useRef, useState } from 'react'

export default function FeatureTabs({ count = 0, renderForm, renderList }) {
  const [tab, setTab] = useState(count > 0 ? 'ver' : 'config')
  const prevCount = useRef(count)

  // Al añadir (el conteo sube), mostrar el resultado en Ver.
  useEffect(() => {
    if (count > prevCount.current) setTab('ver')
    prevCount.current = count
  }, [count])

  const btn = (active) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'ver'}
          onClick={() => setTab('ver')}
          className={btn(tab === 'ver')}
        >
          Ver
          {count > 0 && (
            <span className="ml-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
              {count}
            </span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'config'}
          onClick={() => setTab('config')}
          className={btn(tab === 'config')}
        >
          Configuración
        </button>
      </div>
      {tab === 'ver' ? renderList() : renderForm()}
    </div>
  )
}
