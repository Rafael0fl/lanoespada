/* ==========================================================================
 * api.js
 * --------------------------------------------------------------------------
 * Capa de servicios del frontend. Cada funcion intenta llamar al backend
 * real (FastAPI) y, si NO responde (apagado, error, timeout), cae en la
 * pseudo base de datos local (data/mockBackend.js) para seguir probando
 * la interfaz en modo demo.
 *
 * Forma de uso:
 *   const { data, mock } = await fetchTenants('mios', socio)
 *   // mock === true  -> se estan mostrando datos ficticios (banner demo)
 *   // mock === false -> respuesta real del backend
 *
 * La URL base se toma de VITE_API_URL (opcional). Si no esta definida,
 * se usa '/v1' y Vite (dev o build) la proxya al backend de produccion.
 * En desarrollo configuramos el proxy hacia http://localhost:8000 en
 * vite.config.js.
 * ========================================================================== */

import * as mock from '../data/mockBackend'

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

// Timeout corto: si el backend no responde rapido, fallamos al modo demo.
const TIMEOUT_MS = 1800

/* --------------------------------------------------------------------------
 * BANDERA DEL MODO DEMO
 * --------------------------------------------------------------------------
 * VITE_DEMO_MODE decide si la app puede caerse a la pseudo-DB cuando el
 * backend esta apagado.
 *
 *   VITE_DEMO_MODE=true   -> HABILITADO (desarrollo): si el backend no
 *                            responde, se muestran datos ficticios para
 *                            poder seguir probando la interfaz.
 *   VITE_DEMO_MODE=false  -> DESHABILITADO (produccion): si el backend no
 *                            responde, se propaga el error y la interfaz
 *                            avisa que no hay conexion con el servidor.
 *   (sin definir)          -> DESHABILITADO (fail-safe: por defecto NO demo).
 *
 * OJO: es opt-in. Se escribe 'true' a proposito (y no '!= false') para que,
 * si alguien olvida configurar la variable al compilar para produccion, el
 * sistema NO muestre datos inventados por error.
 *
 * Se lee de .env.development en desarrollo (Vite lo carga solo con `npm run dev`).
 * -------------------------------------------------------------------------- */
const DEMO_PERMITIDO = import.meta.env.VITE_DEMO_MODE === 'true'

/* Error que se muestra cuando el backend esta apagado y el modo demo esta
 * deshabilitado (produccion). Es el mensaje que ve el usuario final. */
const ERROR_BACKEND_CAIDO =
  'No pudimos conectarnos con el servidor. Revisá tu conexión a internet e intentá de nuevo.'

/* Token de la sesion guardada (AuthContext persiste en 'lanoespada_auth').
   El usuario logueado viaja en Authorization: Bearer <token>. */
function getAuthToken() {
  try {
    const raw = localStorage.getItem('lanoespada_auth')
    const user = raw ? JSON.parse(raw) : null
    return user?.token || ''
  } catch {
    return ''
  }
}

/* Intenta un request real. Lanza error si falla (red / HTTP / timeout). */
async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const token = getAuthToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    if (!res.ok) {
      // Leemos el body como TEXTO para poder distinguir un error REAL del
      // backend de un "backend inalcanzable" (proxy caido / sin backend).
      //
      //   - FastAPI SIEMPRE responde JSON: {"detail": "..."}  -> error real
      //     (401 credenciales, 403 rol, 404, 409, 422 validacion...)
      //   - El proxy de Vite, cuando no encuentra el backend, responde 502
      //     con Content-Type text/plain y cuerpo VACIO. Eso NO es un error
      //     real del backend: es el backend inalcanzable, y corresponde caer
      //     al modo demo.
      //   - En GitHub Pages (sin backend), /v1/* devuelve el 404.html del
      //     truco SPA (HTML, no JSON). Tampoco es un error real del backend.
      let detail = ''
      let esJson = false
      try {
        const raw = await res.text()
        if (raw) {
          const payload = JSON.parse(raw)
          esJson = true
          detail = payload?.detail || ''
        }
      } catch {
        // El body no es JSON (ej: 502 del proxy de Vite); seguimos con status.
      }

      const err = new Error(detail || `HTTP ${res.status}`)
      err.status = res.status // para distinguir "backend respondio con error" vs "apagado"
      // Sin cuerpo JSON = NO respondio FastAPI (que siempre responde JSON).
      // Casos: 5xx vacio del proxy de Vite (backend apagado en dev), o el
      // 404 HTML de GitHub Pages (404.html del truco SPA) cuando /v1/* no
      // existe porque no hay backend. En ambos corresponde el modo demo.
      err.esBackendInalcanzable = !esJson
      throw err
    }
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

/* Envuelve una llamada real y devuelve { data, mock } con fallback a mock.
   Un error HTTP REAL (401/403/404/409/422...) NO cae al modo demo: se
   propaga para que la interfaz muestre el error verdadero. Solo backend
   apagado / timeout (error de red) dispara la pseudo-DB. */
async function withFallback(realCall, mockCall) {
  try {
    const data = await realCall()
    return { data, mock: false }
  } catch (err) {
    if (err.status != null && !err.esBackendInalcanzable) throw err
    // El backend esta apagado: si la bandera habilita la demo, seguimos con
    // datos ficticios; si esta deshabilitada (produccion), mostramos error.
    if (!DEMO_PERMITIDO) {
      const errorFinal = new Error(ERROR_BACKEND_CAIDO)
      errorFinal.esBackendInalcanzable = true
      throw errorFinal
    }
    console.warn('[api] Backend no disponible, usando pseudo-DB.', err?.message || err)
    const data = await mockCall()
    return { data, mock: true }
  }
}

/* ------------------------------- AUTH ----------------------------------- */

// Login contra el backend real (POST /v1/auth/login, tabla users).
//
// - Si el backend responde con 401/403 NO se cae al modo demo: esas
//   credenciales fueron rechazadas de verdad y hay que avisar al usuario.
// - Si el backend esta apagado / timeout, se autentica contra las cuentas
//   demo (misma lista que el login falso de antes) para seguir probando.
//
// Retorna:
//   { data, mock }            -> login OK (data: { access_token, user }).
//   { error, status }         -> el backend respondio y rechazo las credenciales.
//   throw                     -> credenciales invalidas en modo demo.
export async function loginUser({ identifier, password } = {}) {
  try {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { identifier, password },
    })
    return { data, mock: false }
  } catch (err) {
    // err.status != null Y no es el proxy caido => el backend respondio y
    // rechazo las credenciales de verdad: se propaga el error real.
    // Con el backend apagado el proxy devuelve 502 sin JSON, y ahi si
    // corresponde caer a las cuentas demo.
    if (err.status != null && !err.esBackendInalcanzable) {
      return {
        error: 'Credenciales incorrectas. Revisá el usuario y la contraseña.',
        status: err.status,
      }
    }
    // Backend apagado. En produccion (bandera apagada) NO autenticamos contra
    // cuentas demo: mostramos el error de conexion real.
    if (!DEMO_PERMITIDO) {
      return { error: ERROR_BACKEND_CAIDO, status: null }
    }
    console.warn('[api] Backend no responde, login contra cuentas demo.', err?.message || err)
    const data = await mock.loginUser({ identifier, password })
    return { data, mock: true }
  }
}

/* ------------------------------ TENANTS --------------------------------- */

// Listado de tenants. scope: 'mios' | 'todos'.
export function fetchTenants({ scope = 'todos', socio = '' } = {}) {
  const qs = `?scope=${encodeURIComponent(scope)}&socio=${encodeURIComponent(socio)}`
  return withFallback(
    () => request(`/tenants${qs}`),
    () => mock.listTenants({ scope, socio }),
  )
}

// Detalle de un tenant (se usa al entrar a "Ver Tenants").
export function fetchTenant(tenantId) {
  return withFallback(
    () => request(`/tenants/${encodeURIComponent(tenantId)}`),
    () => mock.getTenant(tenantId),
  )
}

// Crear un tenant (formulario "Añadir Tenant").
// Un error HTTP real (409 usuario repetido, 422 datos invalidos, 403 rol...)
// NO cae al modo demo: se propaga para mostrar el error verdadero.
// Solo ante backend apagado / timeout se usa la pseudo-DB.
export function createTenant(payload) {
  return withFallback(
    () => request('/tenants', { method: 'POST', body: payload }),
    () => mock.createTenant(payload),
  )
}

// Actualizar configuracion de un tenant (modal de configuracion).
export function updateTenant(tenantId, patch) {
  return withFallback(
    () => request(`/tenants/${encodeURIComponent(tenantId)}`, { method: 'PATCH', body: patch }),
    () => mock.updateTenant(tenantId, patch),
  )
}

/* ----------------------------- CUSTOMERS --------------------------------- */

// Customers que le escribieron a un tenant.
export function fetchCustomers(tenantId) {
  return withFallback(
    () => request(`/tenants/${encodeURIComponent(tenantId)}/customers`),
    () => mock.getCustomers(tenantId),
  )
}

// Mensajes del chat de un customer.
export function fetchMessages(tenantId, customerId) {
  const qs = `?tenantId=${encodeURIComponent(tenantId)}`
  return withFallback(
    () => request(`/customers/${encodeURIComponent(customerId)}/messages${qs}`),
    () => mock.getMessages(tenantId, customerId),
  )
}

// Enviar un mensaje del negocio al customer (mock: lo persiste en memoria).
export function sendMessage(tenantId, customerId, text) {
  return withFallback(
    () => request(`/customers/${encodeURIComponent(customerId)}/messages`, { method: 'POST', body: { text, tenantId } }),
    () => mock.sendMessage(tenantId, customerId, text),
  )
}

/* ------------------------------ METRICS ---------------------------------- */

// Disponibilidad de un box para una fecha y duración de servicio.
export function fetchDisponibilidad({ tenantId, box, fecha, duracionMin = 30 }) {
  const qs = `?box=${encodeURIComponent(box)}&fecha=${encodeURIComponent(fecha)}&duracion_min=${encodeURIComponent(duracionMin)}`
  return withFallback(
    () => request(`/tenants/${encodeURIComponent(tenantId)}/disponibilidad${qs}`),
    () => mock.getDisponibilidad({ tenantId, box, fecha, duracionMin }),
  )
}

// Appointments (turnos agendados) del tenant.
export function fetchAppointments(tenantId, fecha, box) {
  const qs = `?fecha=${encodeURIComponent(fecha)}${box ? `&box=${encodeURIComponent(box)}` : ''}`
  return withFallback(
    () => request(`/tenants/${encodeURIComponent(tenantId)}/appointments${qs}`),
    () => mock.listAppointments({ tenantId, fecha, box }),
  )
}

export function createAppointment(tenantId, payload) {
  return withFallback(
    () => request(`/tenants/${encodeURIComponent(tenantId)}/appointments`, { method: 'POST', body: payload }),
    () => mock.createAppointment({ tenantId, ...payload }),
  )
}

export function cancelAppointment(tenantId, appointmentId) {
  return withFallback(
    () => request(`/tenants/${encodeURIComponent(tenantId)}/appointments/${encodeURIComponent(appointmentId)}`, { method: 'DELETE' }),
    () => mock.cancelAppointment({ tenantId, appointmentId }),
  )
}

// scope: 'mios' | 'todos' |  range: 'hoy' | 'semana' | 'mes' | 'anio'
export function fetchMetrics({ scope = 'todos', socio = '', range = 'mes' } = {}) {
  const qs = `?scope=${encodeURIComponent(scope)}&socio=${encodeURIComponent(socio)}&alcance=${encodeURIComponent(range)}`
  return withFallback(
    () => request(`/metrics${qs}`),
    () => mock.getMetrics({ scope, socio, range }),
  )
}

// Metricas del propio tenant (rol cliente). range: 'hoy' | 'semana' | 'mes' | 'anio'.
export function fetchTenantMetrics(tenantId, range = 'hoy') {
  const qs = `?alcance=${encodeURIComponent(range)}`
  return withFallback(
    () => request(`/tenants/${encodeURIComponent(tenantId)}/metrics${qs}`),
    () => mock.getTenantMetrics(tenantId, range),
  )
}

/* --------------------------- MERCADO PAGO (OAuth) ------------------------- */
// Nota: estos endpoints NO usan withFallback (no hay modo demo para OAuth).
// Devuelven la cruda respuesta del backend.

// Estado de la cuenta MP conectada del negocio.
export async function fetchMPAccount(tenantId) {
  return request(`/tenants/${encodeURIComponent(tenantId)}/mp/account`)
}

// Obtiene la URL de autorización de MP para conectar la cuenta del negocio.
// El backend devuelve { url, tenant_id }; el frontend navega a `url`.
export async function getMPConnectUrl(tenantId) {
  return request(`/tenants/${encodeURIComponent(tenantId)}/mp/connect`)
}

// Desconecta la cuenta MP del negocio.
export async function disconnectMPAccount(tenantId) {
  return request(`/tenants/${encodeURIComponent(tenantId)}/mp/account`, { method: 'DELETE' })
}