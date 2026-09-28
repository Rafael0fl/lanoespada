/* ==========================================================================
 * DemoBanner.jsx
 * --------------------------------------------------------------------------
 * Aviso "Modo demo" que se muestra cuando el backend no responde y se esta
 * consumiendo la pseudo base de datos (data/mockBackend.js).
 *
 * Props:
 *   - mock   : boolean (true -> backend sin conexion)
 *   - message: texto opcional para contextualizar.
 * ========================================================================== */

import { FlaskConical } from 'lucide-react'

export default function DemoBanner({ mock, message }) {
  if (!mock) return null
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <strong>Modo demo:</strong> el backend no está respondiendo, así que se
        muestran datos ficticios de prueba.
        {message ? ` ${message}` : ''}
      </p>
    </div>
  )
}