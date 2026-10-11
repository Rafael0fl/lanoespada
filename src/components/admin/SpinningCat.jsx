/* ==========================================================================
 * SpinningCat.jsx
 * --------------------------------------------------------------------------
 * EL GATO PROTAGONISTA DEL PANEL (cat-spin).
 *
 * Usa LA ANIMACION REAL DEL MEME (frame por frame), pero manejable:
 * antes el gato era un GIF y no se podia arrancar/frenar ni sincronizar
 * con la musica. Ahora esta dividido en partes independientes:
 *
 *   1. LOS FRAMES DEL GIF       -> public/cat-spin-sprites.png
 *      Tira horizontal con los 60 frames del meme (19200x320), extraidos
 *      del cat-spin.gif original. Cada frame mide 320x320.
 *   2. LA REPRODUCCION          -> se mueve la tira dentro de un contenedor
 *      con overflow (como un rollo de pelicula) usando Web Animations API
 *      con easing steps(60): 60 frames exactos por ciclo. Es INDEPENDIENTE
 *      de la imagen, asi que arranca/frena con el clic y dura lo que
 *      nosotros digamos.
 *   3. LA MUSICA                -> elemento <audio> en loop, arranca SOLO
 *      con el clic del usuario (regla del navegador: sin gesto no hay sonido).
 *
 * SINCRONIZACION CON EL RITMO:
 *   Un ciclo completo de la animacion (los 60 frames = el giro del meme)
 *   dura duracionAudio / VUELTAS_POR_LOOP. Con VUELTAS_POR_LOOP = 16, el
 *   gato da 16 giros por cada loop de la cancion, arrancando en el mismo
 *   instante (la cancion vuelve a 0 al hacer clic).
 *
 * COMO SE USA:
 *   - Se monta en el centro del panel (AdminDashboard).
 *   - Click en el gato  -> arranca musica + animacion + FIESTA (PartyEffects:
 *     luces, humo, estrobo, laseres y ecualizador mientras gira).
 *   - Click de nuevo    -> frena todo y la fiesta se apaga (fade de 0.7s).
 *   - Boton de mute     -> silencia sin frenar el giro.
 *
 * Si falta la tira o el audio en public/, no se rompe nada: se muestra el
 * frame frontal estatico (cat-spin-front.png) como respaldo y, si no hay
 * audio, el gato igual puede animarse en silencio avisando.
 * ========================================================================== */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

import PartyEffects from './PartyEffects'

/* --------------------------------------------------------------------------
 * RITMO DE LA ANIMACION
 * Cuantos giros completos del meme da el gato por cada loop de la cancion.
 * 16 = cuatro giros por compas.
 * ------------------------------------------------------------------------ */
const VUELTAS_POR_LOOP = 16

/* Cantidad de frames del GIF (largo de la tira de sprites). */
const FRAMES = 60

/* Tira de sprites: los 60 frames del meme en fila (19200x320). */
const SPRITE_STRIP = '/cat-spin-sprites.png'

/* Frame 0 estatico (respaldo si la tira no carga). */
const GATO_FRONTAL = '/cat-spin-front.png'

/* Clave para recordar si el usuario siempre lo quiere muteado. */
const PREF_MUTE = 'lanoespada_gato_mute'

/* Archivos de audio candidatos (en frontend/public/). Se prueba uno por uno. */
const AUDIO_CANDIDATOS = [
  '/cat-spin.mp3',
  '/cat-spin.m4a',
  '/cat-spin.wav',
  '/cat-spin.ogg',
  '/gato-spin.mp3',
  '/gato-spin.m4a',
  '/cat.mp3',
  '/gato.mp3',
]

export default function SpinningCat() {
  const audioRef = useRef(null) // elemento <audio> creado por JS
  const stripRef = useRef(null) // el <img> con la tira de frames (lo que se mueve)
  const animRef = useRef(null) // la Animation de la tira (Web Animations API)

  const [girando, setGirando] = useState(false)
  const [mute, setMute] = useState(() => {
    try {
      return localStorage.getItem(PREF_MUTE) === 'true'
    } catch {
      return false
    }
  })
  const [sinAudio, setSinAudio] = useState(false)
  // Duracion real de la cancion en segundos (la reporta el navegador).
  const [duracionAudio, setDuracionAudio] = useState(0)
  // true si la tira de sprites no cargo -> usamos el frame estatico.
  const [sinTira, setSinTira] = useState(false)
  // true si el frame estatico tampoco cargo -> usamos el SVG de respaldo.
  const [sinImagen, setSinImagen] = useState(false)

  /* ------------------------------------------------------------------
   * Movimiento reducido: si el sistema lo pide, la animacion va lenta.
   * ----------------------------------------------------------------- */
  const [lento, setLento] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const aplicar = () => setLento(mq.matches)
    aplicar()
    mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [])

  /* ------------------------------------------------------------------
   * Crea el elemento de audio UNA vez y prueba los archivos candidatos.
   * preload='auto' para tener la duracion lista antes del primer clic.
   * ----------------------------------------------------------------- */
  useEffect(() => {
    const audio = new Audio()
    audio.loop = true
    audio.preload = 'auto'
    audioRef.current = audio

    let cancelado = false

    const leerDuracion = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuracionAudio(audio.duration)
      }
    }
    audio.addEventListener('loadedmetadata', leerDuracion)

    const probar = async (indice) => {
      if (indice >= AUDIO_CANDIDATOS.length) {
        if (!cancelado) setSinAudio(true)
        return
      }
      audio.src = AUDIO_CANDIDATOS[indice]
      audio.muted = mute
      try {
        await new Promise((resolve, reject) => {
          const ok = () => {
            cleanup()
            resolve()
          }
          const fallo = () => {
            cleanup()
            reject(new Error('no se pudo cargar'))
          }
          const cleanup = () => {
            audio.removeEventListener('canplaythrough', ok)
            audio.removeEventListener('error', fallo)
          }
          audio.addEventListener('canplaythrough', ok, { once: true })
          audio.addEventListener('error', fallo, { once: true })
        })
        if (!cancelado) setSinAudio(false)
      } catch {
        await probar(indice + 1)
      }
    }

    probar(0)

    return () => {
      cancelado = true
      audio.pause()
      audio.removeEventListener('loadedmetadata', leerDuracion)
      audioRef.current = null
    }
    // Solo al montar: cambiar el mute no debe recargar el archivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Persiste la preferencia de mute. */
  useEffect(() => {
    try {
      localStorage.setItem(PREF_MUTE, String(mute))
    } catch {
      /* localStorage bloqueado: no es grave */
    }
  }, [mute])

  /* Al desmontar, cancelamos la animacion. */
  useEffect(() => () => animRef.current?.cancel(), [])

  /* ------------------------------------------------------------------
   * DURACION DE UN CICLO COMPLETO (los 60 frames = 1 giro del meme)
   *   - Con cancion cargada: duracion de la cancion / VUELTAS_POR_LOOP
   *     -> la animacion queda sincronizada con el compas.
   *   - Sin cancion (o antes de que cargue): ritmo fijo de 1.5s por ciclo.
   * Factor extra por "movimiento reducido" (va lenta).
   * ----------------------------------------------------------------- */
  const duracionCiclo = duracionAudio > 0 ? duracionAudio / VUELTAS_POR_LOOP : 1.5
  const factorReducido = lento ? 0.25 : 1

  /* ------------------------------------------------------------------
   * ARRANCAR LA REPRODUCCION (desde el frame 0, junto con la cancion).
   *
   * La tira mide FRAMES contenedores de ancho. Desplazarla -100% (de su
   * propio ancho) recorre EXACTAMENTE los 60 frames. Con easing
   * steps(60, jump-end) el movimiento no es continuo sino frame a frame,
   * mostrando cada uno durante 1/60 del ciclo (como el GIF original).
   *
   * Web Animations API en vez de clase CSS: arranca/frena/cancela sin
   * dejar estados residuales y permite re-sincronizar el timing.
   * ----------------------------------------------------------------- */
  const startAnim = useCallback(() => {
    const el = stripRef.current
    if (!el || sinTira) return
    animRef.current?.cancel()
    animRef.current = el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }], {
      duration: duracionCiclo * 1000,
      iterations: Infinity,
      easing: `steps(${FRAMES}, jump-end)`,
    })
    animRef.current.playbackRate = factorReducido
  }, [duracionCiclo, factorReducido, sinTira])

  /* Si la cancion termina de cargar mientras el gato gira, re-sincronizamos
     la duracion del ciclo (actualiza el timing sin reiniciar la animacion). */
  useEffect(() => {
    if (animRef.current && girando) {
      animRef.current.effect.updateTiming({ duration: duracionCiclo * 1000 })
    }
  }, [duracionCiclo, girando])

  /* ------------------------------------------------------------------
   * CLICK EN EL GATO: animacion + musica, o se para todo.
   * Este click es el "gesto del usuario" que destraba el audio.
   * Al arrancar, la cancion vuelve a 0 para quedar sincronizada.
   * ----------------------------------------------------------------- */
  const toggleGiro = useCallback(() => {
    const audio = audioRef.current
    if (girando) {
      audio?.pause()
      animRef.current?.cancel() // vuelve al frame 0 (tira en posicion inicial)
      setGirando(false)
      return
    }
    if (audio) {
      audio.muted = mute
      try {
        audio.currentTime = 0
      } catch {
        /* aun no hay metadata: se arranca desde donde este */
      }
      // play() puede rechazar si el navegador todavia no lo permite.
      // No rompe nada: el gato se anima igual.
      audio.play().catch(() => {})
    }
    startAnim()
    setGirando(true)
  }, [girando, mute, startAnim])

  const alternarMute = useCallback(() => {
    setMute((prev) => {
      const nuevo = !prev
      if (audioRef.current) audioRef.current.muted = nuevo
      return nuevo
    })
  }, [])

  return (
    /* relative + z-20: el contenido queda POR ENCIMA del overlay de la
       fiesta (PartyEffects es fixed z-10), pero por DEBAJO del header
       mobile (z-30) y del sidebar (z-40) del AppShell. */
    <div className="relative z-20 flex w-full max-w-3xl flex-col items-center gap-5">
      {/* La fiesta: luces, humo, estrobo, laseres y ecualizador.
          Se enciende SOLO mientras el gato gira. */}
      <PartyEffects activo={girando} />

      {/* ============================================================
          EL GATO (protagonista, 70% del contenedor)
          El boton es el marco; adentro, la tira de sprites se desplaza
          frame a frame. La animacion la aplica la Web Animations API
          sobre el <img> (no hay transform en style para no competir).
          ============================================================ */}
      <button
        type="button"
        onClick={toggleGiro}
        title={girando ? 'Frenar al gato' : 'Girar el gato'}
        aria-label={girando ? 'Frenar el gato y la musica' : 'Hacer girar el gato con musica'}
        className={`relative z-20 aspect-square w-[70%] max-w-[540px] cursor-pointer select-none transition ${
          girando
            ? 'drop-shadow-[0_0_50px_rgba(238,93,151,0.55)]'
            : 'hover:scale-[1.02] hover:drop-shadow-[0_0_25px_rgba(216,180,95,0.45)]'
        }`}
      >
        <div className="relative h-full w-full overflow-hidden">
          {!sinTira ? (
            /* Tira animada: ancho = FRAMES contenedores (1 por frame). */
            <img
              ref={stripRef}
              src={SPRITE_STRIP}
              alt="Gato del meme girando"
              draggable={false}
              className="absolute left-0 top-0 h-full max-w-none"
              style={{ width: `${FRAMES * 100}%` }}
              onError={() => setSinTira(true)}
            />
          ) : !sinImagen ? (
            /* Respaldo 1: frame frontal estatico (sin animacion posible). */
            <img
              src={GATO_FRONTAL}
              alt="Gato del meme"
              draggable={false}
              className="h-full w-full object-contain"
              onError={() => setSinImagen(true)}
            />
          ) : (
            /* Respaldo 2: gato dibujado en SVG. */
            <GatoRespaldo className="h-full w-full" />
          )}
        </div>
      </button>

      {/* ============================================================
          CONTROLES: solo mute (el ritmo lo marca la musica)
          ============================================================ */}
      <button
        type="button"
        onClick={alternarMute}
        title={mute ? 'Activar sonido' : 'Silenciar'}
        aria-label={mute ? 'Activar sonido del gato' : 'Silenciar gato'}
        className="relative z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#f9c7d5] bg-white text-[#7d1e3c] shadow-sm transition hover:bg-[#f9c7d5]/40 hover:text-[#ee5d97]"
      >
        {mute ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {/* Hint segun estado (cambia de color: la sala esta oscura en la fiesta) */}
      <p
        className={`relative z-20 text-sm transition-colors ${
          girando ? 'text-[#f9c7d5]' : 'text-[#7d1e3c]/70'
        }`}
      >
        {girando ? 'Tocalo para frenarlo.' : 'Tocalo para arrancar la musica y el giro.'}
      </p>

      {/* Aviso chiquito si no se encontro el audio */}
      {sinAudio && (
        <span className="relative z-20 flex items-center gap-1.5 rounded-full border border-[#ecd9a0] bg-[#f9c7d5]/30 px-3 py-1 text-xs text-[#7d1e3c]">
          <VolumeX className="h-3.5 w-3.5" />
          Sin archivo de audio (se anima igual, en silencio)
        </span>
      )}
    </div>
  )
}

/* --------------------------------------------------------------------------
 * RESPALDO: gato dibujado en SVG.
 * Solo se dibuja si faltan la tira y el frame frontal (nunca deberia pasar).
 * ------------------------------------------------------------------------ */
function GatoRespaldo({ className }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Gato naranja frente">
      {/* Cola (detrás del cuerpo) */}
      <path
        d="M147 158c30 5 40-22 22-34"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path d="M168 126l6-5" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />

      {/* Cuerpo */}
      <ellipse cx="100" cy="138" rx="46" ry="46" fill="#f59e0b" />
      {/* Panza */}
      <ellipse cx="100" cy="148" rx="27" ry="31" fill="#fde68a" />

      {/* Patas delanteras */}
      <ellipse cx="72" cy="176" rx="17" ry="11" fill="#f59e0b" />
      <ellipse cx="128" cy="176" rx="17" ry="11" fill="#f59e0b" />
      <path
        d="M67 172v8M77 172v8M123 172v8M133 172v8"
        stroke="#d97706"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Orejas */}
      <path d="M64 58L54 14l44 24z" fill="#f59e0b" />
      <path d="M136 58l10-44-44 24z" fill="#f59e0b" />
      <path d="M69 51l-4-23 24 13z" fill="#fbcfe8" />
      <path d="M131 51l4-23-24 13z" fill="#fbcfe8" />

      {/* Cabeza */}
      <circle cx="100" cy="76" r="48" fill="#f59e0b" />

      {/* Rayas en la frente */}
      <path
        d="M92 36v12M100 33v14M108 36v12"
        stroke="#d97706"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Ojos */}
      <ellipse cx="80" cy="78" rx="9" ry="12" fill="#1f2937" />
      <ellipse cx="120" cy="78" rx="9" ry="12" fill="#1f2937" />
      <circle cx="83.5" cy="73" r="3.2" fill="#ffffff" />
      <circle cx="123.5" cy="73" r="3.2" fill="#ffffff" />

      {/* Hocico */}
      <ellipse cx="100" cy="101" rx="26" ry="17" fill="#fffbeb" />

      {/* Nariz */}
      <path d="M93 93h14l-7 8z" fill="#f472b6" />

      {/* Boquita */}
      <path
        d="M100 101v4M100 105c0 4-4 6-8 4M100 105c0 4 4 6 8 4"
        fill="none"
        stroke="#b45309"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Bigotes */}
      <path
        d="M72 96L44 90M72 103L46 107M128 96l28-6M128 103l26 4"
        stroke="#d97706"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Rubores */}
      <circle cx="62" cy="95" r="7" fill="#fca5a5" opacity="0.55" />
      <circle cx="138" cy="95" r="7" fill="#fca5a5" opacity="0.55" />
    </svg>
  )
}
