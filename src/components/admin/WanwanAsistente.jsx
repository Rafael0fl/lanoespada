/* ==========================================================================
 * WanwanAsistente.jsx
 * --------------------------------------------------------------------------
 * ASISTENTE PERSONAL SUPERPUESTO (plugin estilo Clippy) del panel /admin.
 *
 * Wanwan aparece flotando en la esquina inferior derecha, se mueve suave
 * (bob), SALUDA al entrar a la pagina con una burbuja de texto que se
 * "escribe" sola, y al tocarla responde con frases aleatorias de tips/
 * charla. Se puede minimizar (X) y volver a invocar con el botoncito.
 *
 * COMO ESTA HECHO:
 *   - Sprite: public/wanwan-asistente.png -> recorte de la hoja de diseño
 *     (pose C), con el fondo gris eliminado por flood-fill desde los bordes
 *     (transparencia real, sin librerias).
 *   - Animaciones CSS puro (bob + pop), con soporte reduced-motion.
 *   - Todo vive en fixed z-50: por ENCIMA del header (z-30), sidebar (z-40)
 *     y de la fiesta del gato (z-10), solo en la ruta /admin.
 *
 * Para agregar frases: agregar items a FRASES (la primera es el saludo
 * de bienvenida, se muestra al montar).
 * ========================================================================== */

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

/* Sprite recortado de la hoja de diseño (fondo transparente). */
const WANWAN_IMG = '/wanwan-asistente.png'

/* La primera frase es el saludo al entrar; el resto son respuestas. */
const FRASES = [
  '¡Hola! Soy Wanwan, tu asistente personal 🎀',
  'Tocá al gato y arranca la fiesta 🎶 — ¡yo bailo con vos!',
  'Decoré el panel con mis colores favoritos... ¿te gusta? ✨',
  'Mi skin de Magic Chess es la más linda, ¿sí o sí?',
  'Tip: el botón 🔇 silencia la música sin frenar al giro.',
  'Si algo falla, avisame y lo reviso en un toque 🐾',
  '16 vueltas por canción... ¡hasta yo me marea! 😆',
]

/* Velocidad de la "tecla" al escribir la burbuja (ms). */
const VELOCIDAD_TIPEO_MS = 28

/* Cuanto tiempo queda visible la burbuja despues de terminar de escribir. */
const OCULTAR_DESPUES_MS = 9000

export default function WanwanAsistente() {
  const [oculto, setOculto] = useState(false) // minimizada (solo botoncito)
  // Estado inicial = saludo visible (sin effect: evita renders en cascada).
  const [burbuja, setBurbuja] = useState(true)
  const [fraseIdx, setFraseIdx] = useState(0) // frase actual
  const [escrito, setEscrito] = useState(0) // cuantos caracteres llevo
  const temporizadores = useRef([]) // timeouts de auto-ocultar

  /* Guardar/limpiar timeouts. */
  const programar = (fn, ms) => {
    const id = setTimeout(fn, ms)
    temporizadores.current.push(id)
    return id
  }
  useEffect(() => () => temporizadores.current.forEach(clearTimeout), [])

  /* Teclear la frase actual letra por letra.
     El reset de `escrito` (a 0) ocurre en los handlers (charlar) y en el
     estado inicial, nunca dentro del effect. */
  useEffect(() => {
    if (!burbuja) return undefined
    const id = setInterval(() => {
      setEscrito((n) => {
        if (n >= FRASES[fraseIdx].length) {
          clearInterval(id)
          return n
        }
        return n + 1
      })
    }, VELOCIDAD_TIPEO_MS)
    return () => clearInterval(id)
  }, [fraseIdx, burbuja])

  /* Cuando termino de escribir: auto-ocultar (y limpiar lo anterior). */
  useEffect(() => {
    if (!burbuja || escrito < FRASES[fraseIdx].length) return undefined
    temporizadores.current.forEach(clearTimeout)
    temporizadores.current = []
    programar(() => setBurbuja(false), OCULTAR_DESPUES_MS)
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escrito, burbuja])

  /* Click en Wanwan: siguiente frase (distinta a la actual). */
  const charlar = () => {
    // Cancelar cualquier auto-ocultar pendiente de la frase anterior.
    temporizadores.current.forEach(clearTimeout)
    temporizadores.current = []
    setFraseIdx((prev) => {
      let n = prev
      while (n === prev) n = Math.floor(Math.random() * FRASES.length)
      return n
    })
    setEscrito(0) // reinicia el tipeo (aqui, en el handler)
    setBurbuja(true)
  }

  const frase = FRASES[fraseIdx]
  const escribiendo = escrito < frase.length

  return (
    <div className="fixed bottom-20 right-3 z-50 flex items-end gap-2 md:bottom-6 md:right-6 md:gap-3">
      {/* ============================================================
          BURBUJA DE HABLA (se escribe sola, se auto-oculta)
          ============================================================ */}
      {burbuja && !oculto && (
        <div
          role="status"
          className="ww-pop relative max-w-[230px] rounded-2xl border-2 border-[#ecd9a0] bg-white px-4 py-2.5 text-sm leading-snug text-[#42101f] shadow-[0_8px_24px_rgba(125,30,60,0.25)] md:max-w-[280px]"
        >
          {frase.slice(0, escrito)}
          {escribiendo && <span className="animate-pulse text-[#ee5d97]">▍</span>}
          {/* Colita de la burbuja (apuntando a Wanwan) */}
          <span className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rotate-45 border-b-2 border-r-2 border-[#ecd9a0] bg-white" />
          {/* Cerrar solo la burbuja */}
          <button
            type="button"
            onClick={() => setBurbuja(false)}
            aria-label="Cerrar mensaje de Wanwan"
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#7d1e3c] text-white transition hover:bg-[#ee5d97]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ============================================================
          WANWAN (el sprite flotante que "saluda" con bob + pop)
          ============================================================ */}
      {!oculto ? (
        <div className="relative">
          <img
            src={WANWAN_IMG}
            alt="Wanwan saludando con dos piñas de paz"
            draggable={false}
            onClick={charlar}
            title="Wanwan, tu asistente"
            className="ww-bob h-28 w-auto max-w-[92px] cursor-pointer select-none drop-shadow-[0_6px_14px_rgba(125,30,60,0.35)] transition hover:scale-105 md:h-40 md:max-w-none"
          />
          {/* Boton minimizar */}
          <button
            type="button"
            onClick={() => setOculto(true)}
            aria-label="Minimizar a Wanwan"
            className="absolute -right-1 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#7d1e3c] text-white transition hover:bg-[#ee5d97]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        /* ============================================================
            MINIMIZADA: botoncito para volver a llamarla
            ============================================================ */
        <button
          type="button"
          onClick={() => {
            setOculto(false)
            charlar()
          }}
          aria-label="Invocar a Wanwan"
          title="Wanwan, tu asistente"
          className="ww-pop flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#ecd9a0] bg-gradient-to-br from-[#f9c7d5] to-[#ee5d97] text-xl shadow-lg transition hover:scale-110"
        >
          🎀
        </button>
      )}

      {/* ============================================================
          KEYFRAMES (prefijo ww- para no chocar con otros estilos)
          ============================================================ */}
      <style>{`
        /* Respiracion suave: la hace "viva" mientras esta flotando. */
        @keyframes ww-bob {
          0%, 100% { transform: translateY(0) rotate(-1.5deg); }
          50%      { transform: translateY(-9px) rotate(1.5deg); }
        }
        .ww-bob { animation: ww-bob 3.4s ease-in-out infinite; }

        /* Aparicion de la burbuja / botoncito (con rebote). */
        @keyframes ww-pop {
          from { opacity: 0; transform: translateY(10px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ww-pop { animation: ww-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

        @media (prefers-reduced-motion: reduce) {
          .ww-bob, .ww-pop { animation: none; }
        }
      `}</style>
    </div>
  )
}
