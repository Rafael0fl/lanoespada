/* ==========================================================================
 * InventarioProductos.jsx
 * --------------------------------------------------------------------------
 * Configuración y gestión del inventario de productos.
 * ========================================================================== */
import { useEffect, useState } from 'react'
import { Package, Plus, Trash2, Eye, Settings, Search, Upload, FileText, Pencil, AlertTriangle } from 'lucide-react'

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

const MOCK_PRODUCTOS = [
  { id: 'p1', name: 'Remera básica', sku: 'REM-BAS-M-AZ', price: 8500, stock: 12, min_stock: 5, category: 'Remeras', image_url: null, attributes: { talle: 'M', color: 'Azul', marca: 'Nike' } },
  { id: 'p2', name: 'Remera básica', sku: 'REM-BAS-S-RO', price: 8500, stock: 3, min_stock: 5, category: 'Remeras', image_url: null, attributes: { talle: 'S', color: 'Rojo', marca: 'Nike' } },
  { id: 'p3', name: 'Jean clásico', sku: 'JEA-CLA-42-AZ', price: 25000, stock: 8, min_stock: 3, category: 'Pantalones', image_url: null, attributes: { talle: '42', color: 'Azul', marca: 'Levi\'s' } },
  { id: 'p4', name: 'Zapatillas urbanas', sku: 'ZAP-URB-40-BL', price: 45000, stock: 0, min_stock: 2, category: 'Calzado', image_url: null, attributes: { talle: '40', color: 'Blanco', marca: 'Adidas' } },
  { id: 'p5', name: 'Gorra snapback', sku: 'GOR-SNA-UN-NE', price: 6000, stock: 15, min_stock: 5, category: 'Accesorios', image_url: null, attributes: { color: 'Negro', marca: 'New Era' } },
  { id: 'p6', name: 'Buzo hoodie', sku: 'BUZ-HOO-L-GR', price: 18000, stock: 2, min_stock: 4, category: 'Buzos', image_url: null, attributes: { talle: 'L', color: 'Gris', marca: 'Puma' } },
]

const MOCK_COLUMNAS = ['talle', 'color', 'marca']
const MOCK_CATEGORIAS = ['Remeras', 'Pantalones', 'Calzado', 'Accesorios', 'Buzos']

function VistaTabla({ productos }) {
  if (!productos || productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <Package className="h-12 w-12 text-slate-400" />
        <p className="mt-3 text-base font-semibold text-slate-700">Sin productos</p>
        <p className="mt-1 text-sm text-slate-500">Agregá productos en la pestaña Configuración.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Producto</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">SKU</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Categoría</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Atributos</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-600">Precio</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-600">Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {productos.map((p) => {
            const bajoStock = p.stock <= (p.min_stock ?? 0)
            return (
              <tr key={p.id} className={bajoStock ? 'bg-rose-50/40' : ''}>
                <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono">{p.sku || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{p.category || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.attributes && Object.entries(p.attributes).map(([k, v]) => (
                      <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                        {k}: {v || '—'}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  ${p.price.toLocaleString('es-AR')}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    p.stock === 0 ? 'bg-rose-100 text-rose-700' :
                    bajoStock ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {p.stock}
                  </span>
                </td>
              </tr>
            )
          })}
          {productos.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                Sin productos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function VistaCatalogo({ productos }) {
  if (!productos || productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <Package className="h-12 w-12 text-slate-400" />
        <p className="mt-3 text-base font-semibold text-slate-700">Sin productos</p>
        <p className="mt-1 text-sm text-slate-500">Agregá productos en la pestaña Configuración.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {productos.map((p) => {
        const bajoStock = p.stock <= (p.min_stock ?? 0)
        return (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
            <div className="flex h-40 items-center justify-center bg-slate-100">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-12 w-12 text-slate-300" />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.category || 'Sin categoría'}</p>
                </div>
                {bajoStock && (
                  <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    Stock bajo
                  </span>
                )}
              </div>
              {p.attributes && Object.keys(p.attributes).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(p.attributes).map(([k, v]) => (
                    <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                      {k}: {v || '—'}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">
                  ${p.price.toLocaleString('es-AR')}
                </span>
                <span className={`text-sm font-bold ${p.stock === 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  Stock: {p.stock}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProductoForm({ producto, onSave, onCancel, columnas = [], categorias = [] }) {
  const [form, setForm] = useState(() => {
    const attrs = { ...(producto?.attributes ?? {}) }
    columnas.forEach((col) => {
      if (!(col in attrs)) attrs[col] = ''
    })
    return {
      name: producto?.name ?? '',
      sku: producto?.sku ?? '',
      price: producto?.price ?? '',
      stock: producto?.stock ?? 0,
      min_stock: producto?.min_stock ?? 0,
      category: producto?.category ?? '',
      image_url: producto?.image_url ?? '',
      attributes: attrs,
    }
  })
  const [nuevoAttr, setNuevoAttr] = useState('')
  const [mostrarInputAttr, setMostrarInputAttr] = useState(false)

  const updateAttr = (key, value) => {
    setForm((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }))
  }

  const removeAttr = (key) => {
    setForm((prev) => {
      const attrs = { ...prev.attributes }
      delete attrs[key]
      return { ...prev, attributes: attrs }
    })
  }

  const addAttr = () => {
    if (nuevoAttr.trim()) {
      const key = nuevoAttr.trim().toLowerCase()
      if (!form.attributes[key]) {
        setForm((prev) => ({
          ...prev,
          attributes: { ...prev.attributes, [key]: '' },
        }))
      }
      setNuevoAttr('')
      setMostrarInputAttr(false)
    }
  }

  const guardar = () => {
    if (!form.name.trim()) return
    if (!form.price || Number(form.price) <= 0) return
    onSave({
      id: producto?.id ?? `p-${Date.now()}`,
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      min_stock: Number(form.min_stock) || 0,
      category: form.category.trim(),
      image_url: form.image_url.trim() || null,
      attributes: form.attributes,
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">
        {producto ? 'Editar producto' : 'Nuevo producto'}
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-500">
          Nombre *
          <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ej: Remera básica" className={`${inputClass} mt-1`} onBlur={guardar} />
        </label>
        <label className="text-xs font-medium text-slate-500">
          SKU (código único)
          <input type="text" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} placeholder="Ej: REM-BAS-M-AZ" className={`${inputClass} mt-1`} onBlur={guardar} />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Categoría
          <div className="mt-1 flex items-center gap-2">
            <select
              value={form.category && categorias.includes(form.category) ? form.category : ''}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              onBlur={guardar}
              className={`${inputClass} flex-1`}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Precio ($) *
          <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="8500" className={`${inputClass} mt-1`} onBlur={guardar} />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Stock actual
          <input type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} placeholder="0" className={`${inputClass} mt-1`} onBlur={guardar} />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Stock mínimo (alerta)
          <input type="number" value={form.min_stock} onChange={(e) => setForm((p) => ({ ...p, min_stock: e.target.value }))} placeholder="5" className={`${inputClass} mt-1`} onBlur={guardar} />
        </label>
        <label className="text-xs font-medium text-slate-500">
          URL de imagen
          <input type="text" value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." className={`${inputClass} mt-1`} onBlur={guardar} />
        </label>
      </div>

      {/* Atributos */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Atributos</span>
          <button type="button" onClick={() => setMostrarInputAttr(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700">
            <Plus className="h-3.5 w-3.5" />
            Añadir atributo
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(form.attributes).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-24 shrink-0 rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-600">
                {key}
              </span>
              <input
                type="text"
                value={val}
                onChange={(e) => updateAttr(key, e.target.value)}
                placeholder={`Valor de ${key}`}
                className={`${inputClass} flex-1`}
              />
              <button type="button" onClick={() => removeAttr(key)} className="shrink-0 text-slate-400 transition hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {mostrarInputAttr && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nuevoAttr}
                onChange={(e) => setNuevoAttr(e.target.value)}
                placeholder="Nombre del atributo (ej: talle, color)"
                className={`${inputClass} flex-1`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addAttr()
                  if (e.key === 'Escape') { setMostrarInputAttr(false); setNuevoAttr('') }
                }}
              />
              <button type="button" onClick={addAttr} className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700">
                Añadir
              </button>
              <button type="button" onClick={() => { setMostrarInputAttr(false); setNuevoAttr('') }} className="shrink-0 text-slate-400 transition hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {Object.keys(form.attributes).length === 0 && !mostrarInputAttr && (
            <p className="text-xs text-slate-400">Sin atributos. Hacé clic en "Añadir atributo" o definí atributos predefinidos arriba.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfigSection({ productos, setProductos, columnas, setColumnas, categorias, setCategorias, onEliminarCategoria }) {
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState("")
  const [duplicado, setDuplicado] = useState(null)
  const [pendiente, setPendiente] = useState(null)
  const [configTab, setConfigTab] = useState(null)
  const [nuevaCategoria, setNuevaCategoria] = useState("")
  const [nuevoAtributo, setNuevoAtributo] = useState("")

  const buscarDuplicado = (prod) => {
    return productos.find((p) =>
      p.id !== prod.id &&
      p.name.toLowerCase() === prod.name.toLowerCase() &&
      JSON.stringify(p.attributes || {}) === JSON.stringify(prod.attributes || {})
    )
  }

  const guardarProducto = (prod) => {
    const existe = productos.some((p) => p.id === prod.id)
    if (existe) {
      const next = productos.map((p) => (p.id === prod.id ? prod : p))
      setProductos(next)
      setEditando(null)
      return
    }

    const dup = buscarDuplicado(prod)
    if (dup) {
      setDuplicado(dup)
      setPendiente(prod)
      return
    }

    const next = [...productos, prod]
    setProductos(next)
    setEditando(null)
  }

  const eliminarProducto = (id) => {
    const next = productos.filter((p) => p.id !== id)
    setProductos(next)
  }

  const confirmarDuplicado = () => {
    if (!duplicado || !pendiente) return
    const next = productos.map((p) =>
      p.id === duplicado.id
        ? { ...p, stock: p.stock + pendiente.stock, price: pendiente.price || p.price }
        : p
    )
    setProductos(next)
    setDuplicado(null)
    setPendiente(null)
    setEditando(null)
  }

  const cancelarDuplicado = () => {
    if (pendiente) {
      const next = [...productos, pendiente]
      setProductos(next)
    }
    setDuplicado(null)
    setPendiente(null)
    setEditando(null)
  }

  const filtrados = productos.filter((p) =>
    p.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Configuracion basica: Categorias y Atributos */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Configuracion basica</h3>
          <p className="text-xs text-slate-500">Gestiona las categorias y atributos de tus productos.</p>
        </div>

        {/* Botones horizontales */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfigTab(configTab === 'categorias' ? null : 'categorias')}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              configTab === 'categorias'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Categorias
          </button>
          <button
            type="button"
            onClick={() => setConfigTab(configTab === 'atributos' ? null : 'atributos')}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              configTab === 'atributos'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Atributos
          </button>
        </div>

        {configTab === 'categorias' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                placeholder="Nueva categoria (ej: Remeras, Pantalones)"
                className={`${inputClass} flex-1`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = nuevaCategoria.trim()
                    if (val && !categorias.includes(val)) {
                      setCategorias([...categorias, val])
                      setNuevaCategoria('')
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const val = nuevaCategoria.trim()
                  if (val && !categorias.includes(val)) {
                    setCategorias([...categorias, val])
                    setNuevaCategoria('')
                  }
                }}
                disabled={!nuevaCategoria.trim()}
                className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                Anadir
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categorias.map((cat) => (
                <span key={cat} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {cat}
                  <button
                    type="button"
                    onClick={() => onEliminarCategoria(cat)}
                    className="text-slate-400 transition hover:text-slate-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              {categorias.length === 0 && (
                <p className="text-xs text-slate-400">Sin categorias. Agrega una arriba.</p>
              )}
            </div>
          </div>
        )}

        {configTab === 'atributos' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nuevoAtributo}
                onChange={(e) => setNuevoAtributo(e.target.value)}
                placeholder="Nuevo atributo (ej: talle, color, marca)"
                className={`${inputClass} flex-1`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = nuevoAtributo.trim().toLowerCase()
                    if (val && !columnas.includes(val)) {
                      const next = [...columnas, val]
                      setColumnas(next)
                      handleColumnasChange(next)
                      setNuevoAtributo('')
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const val = nuevoAtributo.trim().toLowerCase()
                  if (val && !columnas.includes(val)) {
                    const next = [...columnas, val]
                    setColumnas(next)
                    handleColumnasChange(next)
                    setNuevoAtributo('')
                  }
                }}
                disabled={!nuevoAtributo.trim()}
                className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                Anadir
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {columnas.map((col) => (
                <span key={col} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                  {col}
                  <button
                    type="button"
                    onClick={() => {
                      const next = columnas.filter((c) => c !== col)
                      setColumnas(next)
                      handleColumnasChange(next)
                    }}
                    className="text-brand-400 transition hover:text-brand-700"
                  >
                    x
                  </button>
                </span>
              ))}
              {columnas.length === 0 && (
                <p className="text-xs text-slate-400">Sin atributos. Agrega uno arriba.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Busqueda + boton agregar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto..." className={`${inputClass} pl-10`} />
        </div>
        <button type="button" onClick={() => setEditando('new')} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {/* Dialogo de duplicado */}
        {duplicado && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Ya existe un producto con estos datos
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  <strong>{duplicado.name}</strong>
                  {duplicado.attributes && Object.keys(duplicado.attributes).length > 0 && (
                    <> ({Object.entries(duplicado.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')})</>
                  )}
                  - Stock actual: {duplicado.stock} unidades.
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  El nuevo producto tiene {pendiente ? pendiente.stock : 0} unidades. Queres sumar el stock al producto existente?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={cancelarDuplicado} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                No, crear igual
              </button>
              <button type="button" onClick={confirmarDuplicado} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">
                Si, sumar stock
              </button>
            </div>
          </div>
        )}

        {/* Formulario de edicion */}
        {editando && !duplicado && (
          <ProductoForm
            producto={editando === 'new' ? null : editando}
            onSave={guardarProducto}
            onCancel={() => setEditando(null)}
            columnas={columnas}
            categorias={categorias}
          />
        )}

        {/* Tabla de productos */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Producto</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">SKU</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Categoria</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Atributos</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Precio</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Stock</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((p) => {
                const bajoStock = p.stock <= (p.min_stock ?? 0)
                return (
                  <tr key={p.id} className={bajoStock ? 'bg-rose-50/40' : '' }>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">{p.sku || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{p.category || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.attributes && Object.entries(p.attributes).map(([k, v]) => (
                          <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                            {k}: {v || '—'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      ${p.price.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        p.stock === 0 ? 'bg-rose-100 text-rose-700' :
                        bajoStock ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => setEditando(p)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100"><Pencil className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => eliminarProducto(p.id)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-rose-400 transition hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                    {busqueda ? 'No se encontraron productos.' : 'Sin productos. Hace clic en "Nuevo producto".'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Zona de carga masiva y catalogo PDF */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-700">Carga masiva (Excel)</p>
            <p className="mt-1 text-xs text-slate-500">Subi un archivo .xlsx con tus productos. Las columnas se mapean automaticamente.</p>
            <button type="button" className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              <Upload className="h-4 w-4" />
              Subir Excel
            </button>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-700">Catalogo PDF</p>
            <p className="mt-1 text-xs text-slate-500">Subi tu catalogo en PDF. La IA lo enviara a los clientes que lo pidan.</p>
            <button type="button" className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              <Upload className="h-4 w-4" />
              Subir PDF
            </button>
          </div>
        </div>
      </div>
  )
}

function VerSection({ productos }) {
  const [vista, setVista] = useState('tabla')
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const categorias = [...new Set(productos.map((p) => p.category).filter(Boolean))]

  const filtrados = productos.filter((p) => {
    const matchBusqueda = p.name.toLowerCase().includes(busqueda.toLowerCase())
    const matchCat = !filtroCategoria || p.category === filtroCategoria
    return matchBusqueda && matchCat
  })

  const totalStock = productos.reduce((sum, p) => sum + p.stock, 0)
  const bajoStock = productos.filter((p) => p.stock <= (p.min_stock ?? 0)).length
  const sinStock = productos.filter((p) => p.stock === 0).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{productos.length}</p>
          <p className="text-xs text-slate-500">Productos</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{totalStock}</p>
          <p className="text-xs text-slate-500">Unidades totales</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className={`text-2xl font-bold ${bajoStock > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{bajoStock}</p>
          <p className="text-xs text-slate-500">Stock bajo</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className={`text-2xl font-bold ${sinStock > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{sinStock}</p>
          <p className="text-xs text-slate-500">Sin stock</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto..." className={`${inputClass} pl-10`} />
        </div>
        {categorias.length > 0 && (
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className={`${inputClass} w-auto`}>
            <option value="">Todas las categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          <button type="button" onClick={() => setVista('tabla')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${vista === 'tabla' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            Tabla
          </button>
          <button type="button" onClick={() => setVista('catalogo')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${vista === 'catalogo' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            Catalogo
          </button>
        </div>
      </div>

      {vista === 'tabla' ? (
        <VistaTabla productos={filtrados} />
      ) : (
        <VistaCatalogo productos={filtrados} />
      )}
    </div>
  )
}

export default function InventarioProductos({ value, onChange, tenant }) {
  const [tab, setTab] = useState('ver')
  const [productos, setProductos] = useState(MOCK_PRODUCTOS)
  const [columnas, setColumnas] = useState(MOCK_COLUMNAS)
  const [categorias, setCategorias] = useState(MOCK_CATEGORIAS)

  useEffect(() => {
    if (Array.isArray(value?.productos)) {
      setProductos(value.productos)
    }
    if (Array.isArray(value?.columnas)) {
      setColumnas(value.columnas)
    }
    if (Array.isArray(value?.categorias)) {
      setCategorias(value.categorias)
    }
  }, [value])

  const handleProductosChange = (next) => {
    setProductos(next)
    onChange({ ...(value ?? {}), productos: next, columnas, categorias })
  }

  const handleColumnasChange = (next) => {
    setColumnas(next)
    onChange({ ...(value ?? {}), productos, columnas: next, categorias })
  }

  const handleCategoriasChange = (next) => {
    setCategorias(next)
    onChange({ ...(value ?? {}), productos, columnas, categorias: next })
  }

  const handleEliminarCategoria = (cat) => {
    const nextProductos = productos.map((p) =>
      p.category === cat ? { ...p, category: '' } : p
    )
    const nextCategorias = categorias.filter((c) => c !== cat)
    setProductos(nextProductos)
    setCategorias(nextCategorias)
    onChange({
      ...(value ?? {}),
      productos: nextProductos,
      columnas,
      categorias: nextCategorias,
    })
  }

  const handleStockChange = (id, delta) => {
    const next = productos.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    setProductos(next)
    handleProductosChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5">
        <button type="button" onClick={() => setTab('ver')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === 'ver' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
          <Eye className="h-4 w-4" />
          Ver inventario
        </button>
        <button type="button" onClick={() => setTab('config')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === 'config' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
          <Settings className="h-4 w-4" />
          Configuracion
        </button>
        <div className="ml-auto flex items-center gap-1 text-xs text-slate-400">
          <Package className="h-3.5 w-3.5" />
          Inventario
        </div>
      </div>

      {tab === 'ver' && (
        <VerSection productos={productos} />
      )}
      {tab === 'config' && (
        <ConfigSection
          productos={productos}
          setProductos={handleProductosChange}
          columnas={columnas}
          setColumnas={handleColumnasChange}
          categorias={categorias}
          setCategorias={handleCategoriasChange}
          onEliminarCategoria={handleEliminarCategoria}
        />
      )}
    </div>
  )
}