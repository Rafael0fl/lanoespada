/* ==========================================================================
 * AdminDashboard.jsx
 * --------------------------------------------------------------------------
 * Panel del rol 'admin' (ruta /admin).
 *
 * Por ahora el panel es "cat-spin": el gato giratorio como protagonista,
 * centrado y ocupando el 70% del contenedor, mas la asistente Wanwan.
 *
 * TEMA VISUAL (solo aca, solo rol admin):
 *   Paleta de Wanwan (hoja de diseño): pink, light pink, manwoii/maroon,
 *   gold y aqua. Los resplandores de fondo + la tira de cuadros (falda)
 *   son decorativos y no reciben clics (pointer-events-none).
 *
 * El contenido anterior (metricas globales, grafico, backups y tabla de
 * negocios) fue removido a proposito.
 * ========================================================================== */

import SpinningCat from '../../components/admin/SpinningCat'
import WanwanAsistente from '../../components/admin/WanwanAsistente'

export default function AdminDashboard() {
  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6 overflow-hidden md:min-h-[calc(100vh-7rem)]">
      {/* Decoracion Wanwan: resplandores pink/aqua/gold + cuadritos.
          z-0 -> por detras del gato (z-20) y de la fiesta (z-10). */}
      <FondoWanwan />

      {/* El gato: protagonista, centrado, 70% del contenedor.
          SpinningCat maneja su propia animacion + musica + mute. */}
      <SpinningCat />

      {/* La asistente: flota sobre todo (fixed z-50) y saluda al entrar. */}
      <WanwanAsistente />
    </div>
  )
}

/* --------------------------------------------------------------------------
 * Fondo decorativo del panel admin (no interactivo).
 * ------------------------------------------------------------------------ */
function FondoWanwan() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      {/* Tres resplandores suaves con los colores de Wanwan */}
      <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#ee5d97]/25 blur-3xl" />
      <div className="absolute -right-16 top-1/3 h-72 w-72 rounded-full bg-[#8fe3dd]/30 blur-3xl" />
      <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-[#ecd9a0]/40 blur-3xl" />

      {/* Tira de cuadros rosa/blanco abajo: su detalle de falda/obi */}
      <div
        className="absolute inset-x-0 bottom-0 h-3 opacity-70"
        style={{
          backgroundImage: 'repeating-conic-gradient(#f9c7d5 0% 25%, #ffffff 0% 50%)',
          backgroundSize: '14px 14px',
        }}
      />
    </div>
  )
}
