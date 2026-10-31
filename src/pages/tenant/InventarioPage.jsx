/* ==========================================================================
 * InventarioPage.jsx
 * --------------------------------------------------------------------------
 * Acceso directo a la feature "Inventario" desde el panel del tenant.
 * Renderiza el mismo FeatureTool pero con la feature pre-seleccionada.
 * ========================================================================== */
import FeatureTool from './FeatureTool'

export default function InventarioPage() {
  return <FeatureTool defaultFeatureKey="inventario" />
}
