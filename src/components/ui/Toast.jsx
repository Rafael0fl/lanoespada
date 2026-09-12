/* ==========================================================================
 * Toast.jsx
 * --------------------------------------------------------------------------
 * Sistema de notificaciones (toasts) ligero y sin dependencias externas.
 *
 * Uso:
 *   const toast = useToast()
 *   toast.success('Negocio creado correctamente')
 *   toast.error('Ocurrió un error')
 *
 * Internamente mantiene una pila de avisos y los renderiza fijos abajo.
 * ========================================================================== */

import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

// Duracion en ms antes de que un toast se cierre solo.
const TOAST_DURATION = 4000

// Configuracion visual de cada tipo de toast.
const TOAST_STYLES = {
  success: { icon: CheckCircle2, ring: 'border-emerald-500/40', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, ring: 'border-red-500/40', iconColor: 'text-red-500' },
  info: { icon: Info, ring: 'border-slate-300', iconColor: 'text-slate-500' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  /* Agrega un toast a la pila y lo programa para autodestruirse. */
  const push = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION)
  }, [])

  /* API publica del contexto. */
  const toast = {
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
    info: (msg) => push(msg, 'info'),
  }

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Contenedor fijo de toasts (abajo a la derecha, responsive). */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const { icon: Icon, ring, iconColor } = TOAST_STYLES[t.type]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border bg-white p-4 shadow-lg ${ring}`}
              role="status"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
              <p className="flex-1 text-sm text-slate-700">{t.message}</p>
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

/* Hook de acceso: const toast = useToast() */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>')
  }
  return context
}