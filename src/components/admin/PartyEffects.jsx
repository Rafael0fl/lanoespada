/* ==========================================================================
 * PartyEffects.jsx
 * --------------------------------------------------------------------------
 * PLUGIN DE EFECTOS DE FIESTA (estilo boliche / electrónica).
 *
 * Contenedor overlay que se monta DETRAS de la UI (pointer-events-none)
 * y pinta, solo cuando esta activo:
 *
 *   1. Fondo oscuro     -> la "sala" se apaga al empezar la fiesta.
 *   2. Haces de luz      -> 3 reflectores que barren desde el techo
 *                           (aqua, pink y gold de Wanwan) con blend screen.
 *   3. Láseres           -> 2 lineas finas girando 360° (rosa y aqua).
 *   4. Estroboscopio     -> destellos blancos suaves y pausados.
 *   5. Pulso de beat     -> fondo que respira a 120 BPM.
 *   6. Humo              -> 4 nubes de neón que suben desde el piso.
 *   7. Ecualizador       -> barritas de audio en el borde inferior.
 *
 * TODO es CSS puro (sin librerías ni canvas): mas liviano y consistente
 * con el resto del proyecto. Cada efecto lleva su propio @keyframes
 * dentro del <style> de abajo.
 *
 * API:
 *   <PartyEffects activo={girando} />
 *   - activo=true  -> todo encendido y animando.
 *   - activo=false -> opacidad 0 y animaciones EN PAUSA (no consume CPU).
 *
 * ACCESIBILIDAD: con prefers-reduced-motion se apaga el estrobo y los
 * efectos rapidos (riesgo para personas fotosensibles), dejando solo el
 * fondo oscuro y un resplandor fijo.
 *
 * COMO AGREGAR UN EFECTO NUEVO:
 *   1. Agregar el div con su clase fx-* dentro del return.
 *   2. Agregar su @keyframes en el <style>.
 *   3. Listo: hereda la pausa automatica y el fade del contenedor.
 * ========================================================================== */

/* Cantidad de barritas del ecualizador. */
const EQ_BARRAS = 24

export default function PartyEffects({ activo = false }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-700 ${
        activo ? 'opacity-100' : 'opacity-0'
      } ${activo ? '' : 'fx-pausado'}`}
    >
      {/* ============================================================
          1) LA SALA SE APAGA (fondo oscuro de la fiesta)
          ============================================================ */}
      <div className="absolute inset-0 bg-slate-950/70" />

      {/* ============================================================
          2) HACES DE LUZ: 3 reflectores que barren desde el techo.
          clip-path dibuja el cono que se abre hacia abajo.
          ============================================================ */}
      <div
        className="fx-haz"
        style={{ left: '22%', '--c': '#8fe3dd', '--d': '4.6s', animationDelay: '0s' }}
      />
      <div
        className="fx-haz"
        style={{ left: '50%', '--c': '#ee5d97', '--d': '3.8s', animationDirection: 'alternate-reverse' }}
      />
      <div
        className="fx-haz"
        style={{ left: '78%', '--c': '#d8b45f', '--d': '5.4s', animationDelay: '0.8s' }}
      />

      {/* ============================================================
          3) LASERES: lineas finas girando 360° desde el techo.
          ============================================================ */}
      <div className="fx-laser" style={{ '--c': '#e0246e', '--d': '4s' }} />
      <div
        className="fx-laser"
        style={{ '--c': '#8fe3dd', '--d': '5.3s', animationDirection: 'reverse' }}
      />

      {/* ============================================================
          5) PULSO DEL BEAT: resplandor que respira a 120 BPM.
          ============================================================ */}
      <div className="fx-pulso" />

      {/* ============================================================
          6) HUMO: nubes de neón que suben desde el piso.
          --dx controla cuanto se desvian hacia un lado al subir.
          ============================================================ */}
      <div
        className="fx-humo"
        style={{ left: '4%', width: 420, height: 420, '--dx': '80px', '--d': '18s', animationDelay: '0s' }}
      />
      <div
        className="fx-humo"
        style={{ left: '32%', width: 520, height: 520, '--dx': '-70px', '--d': '23s', animationDelay: '6s' }}
      />
      <div
        className="fx-humo"
        style={{ left: '58%', width: 460, height: 460, '--dx': '60px', '--d': '20s', animationDelay: '11s' }}
      />
      <div
        className="fx-humo"
        style={{ left: '80%', width: 400, height: 400, '--dx': '-50px', '--d': '26s', animationDelay: '3s' }}
      />

      {/* ============================================================
          4) ESTROBOSCOPIO: destellos blancos suaves (pocos por ciclo).
          ============================================================ */}
      <div className="fx-estrobo" />

      {/* ============================================================
          7) ECUALIZADOR: barritas en el piso, cada una con su ritmo.
          ============================================================ */}
      <div className="fx-eq">
        {Array.from({ length: EQ_BARRAS }, (_, i) => (
          <span
            key={i}
            style={{
              animationDuration: `${0.55 + ((i * 7) % 5) * 0.15}s`,
              animationDelay: `${((i * 13) % 10) * 0.06}s`,
            }}
          />
        ))}
      </div>

      {/* ============================================================
          ESTILOS (keyframes de todos los efectos)
          ============================================================ */}
      <style>{`
        /* Pausa total cuando la fiesta no esta activa (ahorra CPU). */
        .fx-pausado,
        .fx-pausado * {
          animation-play-state: paused !important;
        }

        /* -------- HACES DE LUZ -------- */
        .fx-haz {
          position: absolute;
          top: -15%;
          width: 150px;
          height: 135vh;
          transform-origin: top center;
          clip-path: polygon(44% 0, 56% 0, 100% 100%, 0 100%);
          background: linear-gradient(to bottom, var(--c, #fff), transparent 78%);
          filter: blur(16px);
          opacity: 0.26;
          mix-blend-mode: screen;
          animation: fx-barrido var(--d, 5s) ease-in-out infinite alternate;
        }
        @keyframes fx-barrido {
          from { transform: rotate(-30deg); }
          to   { transform: rotate(30deg); }
        }

        /* -------- LASERES -------- */
        .fx-laser {
          position: absolute;
          top: -5%;
          left: 50%;
          width: 3px;
          height: 115%;
          transform-origin: top center;
          background: linear-gradient(to bottom, var(--c, #fff), transparent 92%);
          box-shadow: 0 0 10px 2px var(--c, #fff);
          opacity: 0.4;
          animation: fx-giro var(--d, 4s) linear infinite;
        }
        @keyframes fx-giro {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* -------- PULSO DEL BEAT (120 BPM = 0.5s por pulso) -------- */
        .fx-pulso {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 65%, rgba(238, 93, 151, 0.28), transparent 55%),
            radial-gradient(circle at 15% 30%, rgba(143, 227, 221, 0.18), transparent 50%),
            radial-gradient(circle at 85% 30%, rgba(216, 180, 95, 0.18), transparent 50%);
          animation: fx-beat 0.5s ease-in-out infinite alternate;
        }
        @keyframes fx-beat {
          from { opacity: 0.3; transform: scale(1); }
          to   { opacity: 0.6; transform: scale(1.03); }
        }

        /* -------- HUMO -------- */
        .fx-humo {
          position: absolute;
          bottom: -30%;
          border-radius: 9999px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.28) 0%,
            rgba(249, 199, 213, 0.18) 35%,
            transparent 70%
          );
          filter: blur(45px);
          opacity: 0;
          animation: fx-subir var(--d, 20s) linear infinite;
        }
        @keyframes fx-subir {
          0%   { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0; }
          15%  { opacity: 0.3; }
          85%  { opacity: 0.2; }
          100% { transform: translate3d(var(--dx, 60px), -130vh, 0) scale(1.7); opacity: 0; }
        }

        /* -------- ESTROBOSCOPIO (muy suave: max 0.16 de opacidad) -------- */
        .fx-estrobo {
          position: absolute;
          inset: 0;
          background: #ffffff;
          opacity: 0;
          animation: fx-estrobo 3.2s steps(1, end) infinite;
        }
        @keyframes fx-estrobo {
          0%, 100% { opacity: 0; }
          3%       { opacity: 0.16; }
          5%       { opacity: 0; }
          9%       { opacity: 0.1; }
          11%      { opacity: 0; }
          46%      { opacity: 0; }
          48%      { opacity: 0.13; }
          50%      { opacity: 0; }
        }

        /* -------- ECUALIZADOR -------- */
        .fx-eq {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 16vh;
          display: flex;
          align-items: flex-end;
          gap: 6px;
          padding: 0 8px;
          opacity: 0.32;
        }
        .fx-eq span {
          flex: 1;
          border-radius: 6px 6px 0 0;
          background: linear-gradient(to top, #ee5d97, #d8b45f);
          transform-origin: bottom;
          animation: fx-eq ease-in-out infinite alternate;
        }
        @keyframes fx-eq {
          from { transform: scaleY(0.12); }
          to   { transform: scaleY(1); }
        }

        /* -------- ACCESIBILIDAD: sin destellos rapidos -------- */
        @media (prefers-reduced-motion: reduce) {
          .fx-estrobo,
          .fx-laser,
          .fx-pulso {
            animation: none;
            opacity: 0;
          }
          .fx-haz {
            animation: none;
            transform: rotate(0deg);
            opacity: 0.25;
          }
          .fx-eq span {
            animation: none;
            transform: scaleY(0.5);
          }
          .fx-humo {
            animation: none;
            opacity: 0.25;
            transform: translateY(-20vh);
          }
        }
      `}</style>
    </div>
  )
}
