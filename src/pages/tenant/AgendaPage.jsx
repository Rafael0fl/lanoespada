/* ==========================================================================
 * AgendaPage.jsx
 * --------------------------------------------------------------------------
 * Acceso directo a la feature "Agenda de turnos" desde el panel del tenant.
 * Renderiza el mismo FeatureTool pero con la feature pre-seleccionada.
 * ========================================================================== */
import FeatureTool from './FeatureTool'

export default function AgendaPage() {
  return <FeatureTool defaultFeatureKey="agenda_turnos" />
}
