/* ==========================================================================
 * mockBackend.js
 * --------------------------------------------------------------------------
 * Pseudo base de datos (fase de pruebas).
 *
 * Cuando el backend esta apagado (o un endpoint responde con error), el
 * servicio frontend (src/services/api.js) cae aca para seguir mostrando la
 * interfaz con datos ficticios pero realistas.
 *
 * Genera de forma DETERMINISTICA (misma semilla = mismos datos):
 *   - 20 tenants de negocio, repartidos en las 4 industrias.
 *     Cada tenant pertenece a un socio (para el filtro "mios" / "todos").
 *   - Entre 1 y 17 customers por tenant, cada uno con su chat estilo
 *     WhatsApp (mensajes del cliente 'user' y del negocio 'bot').
 *   - Metricas por alcance (hoy / semana / mes / anio) por tenant.
 *
 * Formato de campos en snake_case, igual que el modelo del backend
 * (app/db/models.py) para que el futuro switch a la API real sea directo.
 *
 * Importante: es un modulo JS puro (ESM), no necesita dependencias.
 * ========================================================================== */

import { DEMO_ACCOUNTS } from './mockData.js'

/* ----------------------------- PRNG seedeable ---------------------------- */
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------ Constantes ------------------------------- */

// Rubros de negocio. Lista preliminar: se unificará con los socios más adelante.
// La clave (key) es el valor que viaja al backend; el emoji se usa para darle
// identidad visual en las listas (Ver Tenants). Fuente única de verdad: acá.
export const INDUSTRIES = [
  { key: 'centro_medico', label: 'Centro médico / Clínica', emoji: '🩺' },
  { key: 'odontologia', label: 'Odontología', emoji: '🦷' },
  { key: 'estetica', label: 'Estética / Belleza', emoji: '💅' },
  { key: 'gimnasio', label: 'Gimnasio / Fitness', emoji: '🏋️' },
  { key: 'gastronomia', label: 'Restaurante / Bar', emoji: '🍽️' },
  { key: 'cafe', label: 'Cafetería', emoji: '☕' },
  { key: 'tienda', label: 'Tienda / Comercio', emoji: '🛍️' },
  { key: 'servicios', label: 'Servicios', emoji: '🔧' },
]

// Funciones (features) que configuran la respuesta de la IA.
export const FEATURES = [
  { key: 'horarios_atencion', label: 'Horarios de atención comercial', icon: '🕐', description: 'Horarios en que el local atiende' },
  { key: 'obras_sociales', label: 'Obras sociales', icon: '🩺', description: 'Obras sociales y prepagas aceptadas' },
  { key: 'preguntas_frecuentes', label: 'Preguntas frecuentes', icon: '❓', description: 'Respuestas a dudas comunes' },
  { key: 'politicas', label: 'Políticas', icon: '📜', description: 'Políticas de cancelación, cambio, etc.' },
  { key: 'servicio', label: 'Servicio', icon: '🛎️', description: 'Servicios que ofrece el negocio' },
  { key: 'profesionales', label: 'Profesionales', icon: '👨‍⚕️', description: 'Profesionales que atienden en el negocio' },
  { key: 'agenda_turnos', label: 'Agenda de turnos', icon: '📅', description: 'Gestión de turnos con boxes, servicios y profesionales' },
  { key: 'promocion_evento', label: 'Promoción / Evento', icon: '🎉', description: 'Promos y eventos vigentes' },
]

export const FEATURE_BY_KEY = Object.fromEntries(FEATURES.map((f) => [f.key, f]))

/* --------------------------------------------------------------------------
 * Helpers de FEATURES (dict {feature_key: true/false} en el contrato del
 * backend; se soporta el array legacy por compatibilidad).
 * ------------------------------------------------------------------------ */

// Normaliza a un dict {key: bool} completo (todas las features, default false).
export function normalizeFeatures(features) {
  const out = {}
  FEATURES.forEach((f) => {
    out[f.key] = false
  })
  if (Array.isArray(features)) {
    features.forEach((k) => {
      if (k in out) out[k] = true
    })
  } else if (features && typeof features === 'object') {
    Object.keys(out).forEach((k) => {
      out[k] = Boolean(features[k])
    })
  }
  return out
}

// Claves de las features ACTIVAS (para listas, badges y drill-downs).
export function activeFeatureKeys(features) {
  return Object.entries(normalizeFeatures(features))
    .filter(([, on]) => on)
    .map(([key]) => key)
}

// Si una feature esta habilitada para el tenant (acepta dict o array legacy).
export function isFeatureEnabled(features, key) {
  return Boolean(normalizeFeatures(features)[key])
}

/* --------------------------------------------------------------------------
 * Contenido editable de cada feature ("herramienta" del tenant).
 * Cada feature es una herramienta independiente con sus propios campos.
 * Los tipos de campo coinciden con FeatureField (components/forms).
 *
 * Un itemField puede ser `type: 'select'` con opciones DINAMICAS de otra
 * feature: `optionsSource: '<featureKey>'` (+ `optionsLabel`, default
 * 'nombre'). Las opciones se leen de `tenant.config[<featureKey>].list`
 * (ej: el campo Profesional de Servicios lista los Profesionales). La
 * opcion vacia (value '') muestra el `placeholder` (ej: 'Sin asignar').
 * ------------------------------------------------------------------------ */
export const FEATURE_CONTENT_SCHEMA = {
  horarios_atencion: {
    description: 'Días y horarios en que el local atiende al público.',
    fields: [
      {
        key: 'value',
        type: 'schedule',
        title: 'Horarios de atención comercial',
      },
    ],
  },
  obras_sociales: {
    description: 'Obras sociales y prepagas que aceptás.',
    fields: [
      {
        key: 'list',
        type: 'stringList',
        addLabel: 'Añadir obra social',
        listLabel: 'Obras sociales',
        placeholder: 'Ej: OSDE, Swiss Medical, IOMA…',
      },
    ],
  },
  preguntas_frecuentes: {
    description: 'Dudas comunes de tus clientes con su respuesta.',
    fields: [
      {
        key: 'list',
        type: 'objectList',
        itemTitle: 'pregunta',
        addLabel: 'Añadir pregunta frecuente',
        listLabel: 'Preguntas frecuentes',
        itemFields: [
          {
            key: 'pregunta',
            label: 'Pregunta',
            type: 'text',
            placeholder: 'Ej: ¿Cómo saco un turno?',
            required: true,
          },
          {
            key: 'respuesta',
            label: 'Respuesta',
            type: 'textarea',
            placeholder: 'Ej: Se saca por WhatsApp respondiendo este número…',
            required: true,
          },
        ],
      },
    ],
  },
  politicas: {
    description: 'Políticas de señas, cancelación, tardanza, etc.',
    fields: [
      {
        key: 'list',
        type: 'objectList',
        itemTitle: 'política',
        addLabel: 'Añadir nueva política',
        listLabel: 'Políticas',
        itemFields: [
          {
            key: 'titulo',
            label: 'Título',
            type: 'text',
            placeholder: 'Ej: Señas',
            required: true,
          },
          {
            key: 'descripcion',
            label: 'Descripción',
            type: 'textarea',
            placeholder: 'Ej: Las señas no se reintegran; la cancelación se hace con 24hs de anticipación…',
            required: true,
          },
        ],
      },
    ],
  },
  servicio: {
    description: 'Servicios que ofrecés con su precio (si aplica).',
    fields: [
      {
        key: 'list',
        type: 'objectList',
        itemTitle: 'Servicio',
        addLabel: 'Añadir servicio',
        listLabel: 'Servicios',
        itemFields: [
          { key: 'nombre', label: 'Servicio', type: 'text', placeholder: 'Consulta médica', required: true },
          { key: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Detalle del servicio…', required: true },
          { key: 'precio', label: 'Precio ($)', type: 'number', placeholder: '15000', required: true },
          { key: 'profesional', label: 'Profesional', type: 'select', optionsSource: 'profesionales', optionsLabel: 'nombre', placeholder: 'Sin asignar' },
          { key: 'duracion_min', label: 'Duración', type: 'duration', legacyKey: 'duracion', required: true },
        ],
      },
    ],
  },
  profesionales: {
    description: 'Listado de profesionales que atienden el negocio.',
    fields: [
      {
        key: 'list',
        type: 'objectList',
        itemTitle: 'Profesional',
        addLabel: 'Añadir profesional',
        listLabel: 'Profesionales',
        itemFields: [
          { key: 'nombre', label: 'Nombre completo', type: 'text', placeholder: 'Dr. Juan Pérez', required: true },
          { key: 'descripcion', label: 'Tareas / especialidad', type: 'textarea', placeholder: 'Ej.: Traumatología, kinesio...', required: true },
        ],
      },
    ],
  },
  agenda_turnos: {
    description: 'Configuración de la agenda de turnos (boxes, servicios y profesionales).',
    fields: [
      {
        key: 'config',
        type: 'custom',
        component: 'AgendaTurnos',
      },
    ],
  },
  promocion_evento: {
    description: 'Promos y eventos vigentes.',
    fields: [
      {
        key: 'list',
        type: 'promoEventList',
        addLabel: 'Nueva promoción o evento',
        listLabel: 'Promociones y eventos',
      },
    ],
  },
}

// Valor inicial (vacío) para el contenido de una feature.
export function emptyFeatureContent(featureKey) {
  const schema = FEATURE_CONTENT_SCHEMA[featureKey]
  if (!schema) return {}
  const initial = {}
  schema.fields.forEach((field) => {
    if (['objectList', 'stringList', 'dynamicList', 'multiselect', 'promoEventList'].includes(field.type)) initial[field.key] = []
    else if (field.type === 'checkbox') initial[field.key] = false
    else if (field.type === 'schedule') initial[field.key] = 'fulltime'
    else initial[field.key] = ''
  })
  return initial
}

/* --------------------------------------------------------------------------
 * Duraciones: los campos `type: 'duration'` guardan MINUTOS totales (int).
 * ------------------------------------------------------------------------ */

// "90" -> "1 h 30 min" | "45" -> "45 min" | "60" -> "1 h" | invalido -> ''.
export function formatDuracion(min) {
  const total = Number(min)
  if (!Number.isFinite(total) || total <= 0) return ''
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h && m) return `${h} h ${m} min`
  if (h) return `${h} h`
  return `${m} min`
}

// Migracion best-effort de duraciones legacy en texto ("45 minutos") a minutos.
// "45 minutos" -> 45 | "1 hora 30" / "1:30" -> 90 | ilegible -> null.
export function parseLegacyDuration(text) {
  const s = String(text ?? '').toLowerCase()
  const reloj = s.match(/(\d+)\s*:\s*(\d+)/)
  if (reloj) {
    const total = Number(reloj[1]) * 60 + Number(reloj[2])
    return total > 0 ? total : null
  }
  const nums = s.match(/\d+/g)?.map(Number) ?? []
  if (!nums.length) return null
  if (/hora|hs?\.?\b|h\b/.test(s)) {
    const total = nums[0] * 60 + (nums[1] ?? 0)
    return total > 0 ? total : null
  }
  return nums[0] > 0 ? nums[0] : null // sin unidad: se asumen minutos
}

// Migra el contenido guardado de una feature a la forma actual del schema
// (ej: `duracion` texto -> `duracion_min` minutos). Lo ya guardado bien no
// se toca; lo ilegible se conserva con su key legacy para no perder datos.
export function migrarContenidoLegacy(featureKey, content) {
  const schema = FEATURE_CONTENT_SCHEMA[featureKey]
  if (!schema || !content || typeof content !== 'object') return content
  const next = { ...content }
  for (const field of schema.fields) {
    if (field.type !== 'objectList' || !Array.isArray(next[field.key])) continue
    next[field.key] = next[field.key].map((item) => {
      if (!item || typeof item !== 'object') return item
      let out = item
      for (const f of field.itemFields ?? []) {
        if (f.type === 'duration' && f.legacyKey && out[f.key] == null && out[f.legacyKey] != null) {
          const min = parseLegacyDuration(out[f.legacyKey])
          if (min) {
            out = { ...out, [f.key]: min }
            delete out[f.legacyKey]
          }
        }
      }
      return out
    })
  }
  return next
}

// Usernames de los socios comerciales (para distinguir "míos"/"todos").
// Deben coincidir con DEMO_ACCOUNTS de mockData.js (formato: nombre@socio).
const SOCIOS = [
  'rafael@socio',
  'nahuel@socio',
  'alejandro@socio',
  'eliana@socio',
  'florencia@socio',
  'Zagreo@socio',
]

// Nombres de negocios por rubro con referencias a la mitología griega.
// Todos los tenants de prueba se llaman "[TEST] Nombre" para distinguirlos
// de los reales que el socio vaya registrando.
const GREEK_BUSINESS_NAMES = {
  centro_medico: [
    '[TEST] Clínica Asclepio',
    '[TEST] Consultorio Atenea',
    '[TEST] Sanatorio Apolo',
  ],
  odontologia: [
    '[TEST] Dental Poseidón',
    '[TEST] Sonrisa Hera',
    '[TEST] Odontología Hades',
  ],
  estetica: [
    '[TEST] Spa Eros',
    '[TEST] Estética Afrodita',
    '[TEST] Belleza Selene',
  ],
  gimnasio: [
    '[TEST] Gym Hércules',
    '[TEST] CrossFit Aquiles',
    '[TEST] Box Perseo',
  ],
  gastronomia: [
    '[TEST] Taberna Dionisio',
    '[TEST] Bar Némesis',
    '[TEST] Restaurante Zeus',
  ],
  cafe: [
    '[TEST] Café Teseo',
    '[TEST] Café Orfeo',
    '[TEST] Tostado Helios',
  ],
  tienda: [
    '[TEST] Tienda Hermes',
    '[TEST] Outlet Prometeo',
    '[TEST] Importadora Atlas',
  ],
  servicios: [
    '[TEST] Servicios Hefesto',
    '[TEST] Taller Ícaro',
    '[TEST] Estudio Deméter',
  ],
}

const INDUSTRY_PROMPT = {
  centro_medico:
    'Sos el asistente virtual de un centro médico. Respondés consultas sobre ' +
    'especialidades, profesionales, turnos y obras sociales. Nunca inventes información.',
  odontologia:
    'Sos el asistente virtual de una clínica odontológica. Respondés consultas sobre ' +
    'tratamientos, turnos y planes de pago. Nunca inventes información.',
  estetica:
    'Sos el asistente virtual de un centro de estética. Respondés consultas sobre ' +
    'tratamientos, turnos y precios. Nunca inventes información.',
  gimnasio:
    'Sos el asistente virtual de un gimnasio. Respondés consultas sobre ' +
    'planes, horarios de clases y promociones para socios. Nunca inventes información.',
  gastronomia:
    'Sos el asistente virtual de un restaurante o bar. Respondés consultas sobre ' +
    'la carta, promos, eventos y reservas. Nunca inventes información.',
  cafe:
    'Sos el asistente virtual de una cafetería. Respondés consultas sobre ' +
    'el menú, horarios y pedidos. Nunca inventes información.',
  tienda:
    'Sos el asistente virtual de una tienda. Respondés consultas sobre productos, ' +
    'stock, precios y envíos. Nunca inventes información.',
  servicios:
    'Sos el asistente virtual de un negocio de servicios. Respondés consultas sobre ' +
    'los servicios ofrecidos, presupuestos y horarios. Nunca inventes información.',
}

const FIRST_NAMES = [
  'Rafael', 'María', 'Carlos', 'Lucía', 'Jorge', 'Ana', 'Martín', 'Sofía',
  'Diego', 'Valentina', 'Pedro', 'Camila', 'Nicolás', 'Florencia', 'Lucas',
  'Micaela', 'Franco', 'Julieta', 'Tomás', 'Agustina',
]

const LAST_NAMES = [
  'Lobo', 'González', 'Tapia', 'Ferreyra', 'Medina', 'Pereyra', 'Suárez',
  'Ríos', 'Paz', 'Castro', 'Benítez', 'Acosta', 'Vega', 'Molina', 'Ferrari',
  'Luna', 'Roldán', 'Giménez', 'Correa', 'Delgado',
]

// Guiones de conversacion (alternan user -> bot). El #0 se repite con variantes.
const SCRIPTS = [
  [
    '¡Hola! Quería hacer una consulta.',
    '¡Hola! Gracias por escribirnos 😊 Contanos, ¿en qué te podemos ayudar?',
    '¿Cuáles son sus horarios de atención?',
    'Atendemos de lunes a viernes de 09:00 a 18:00 y los sábados de 09:00 a 13:00.',
    'Perfecto, gracias por la información.',
    '¡A vos! Cualquier otra duda, aquí estamos.',
  ],
  [
    'Buenas, ¿me pasan la dirección?',
    'Claro, estamos en Av. Siempre Viva 742, a dos cuadras de la plaza central.',
    '¿Y tienen estacionamiento?',
    'Sí, contamos con estacionamiento propio para clientes.',
    '¡Genial, voy para allá!',
    'Te esperamos 🙌',
  ],
  [
    'Hola, ¿tienen algún turno disponible para esta semana?',
    '¡Hola! Hoy tenemos disponibles a las 16:00 y 18:30. ¿Te sirve alguno?',
    'Sí, el de las 16:00 por favor.',
    'Listo, te reservé las 16:00 a nombre de tu teléfono. Te esperamos.',
    'Muchas gracias, ¡perfecto!',
    '¡Gracias a vos! Cualquier cambio, avisanos.',
  ],
  [
    '¿Aceptan pagos con tarjeta?',
    'Sí, aceptamos débito, crédito y transferencia. También Mercado Pago.',
    '¿Y cuotas?',
    'Hasta 3 cuotas sin interés con tarjetas de crédito.',
    'Excelente, gracias.',
    '¡De nada! Quedamos a tu disposición.',
  ],
  [
    '¡Hola! Quería saber si tienen alguna promo esta semana.',
    '¡Sí! Esta semana tenemos 20% de descuento en tu primera compra 🎉',
    'Uh, buenísimo. ¿Aplica también online?',
    'Sí, aplica por WhatsApp también. Solo mencioná que venís de acá.',
    'Dale, gracias.',
    '¡Grande! Cualquier cosa nos escribís.',
  ],
  [
    'Hola, ¿trabajan los feriados?',
    '¡Hola! Los feriados atendemos en horario reducido de 10:00 a 14:00.',
    'Perfecto, gracias por avisar.',
    '¡A vos! Qué tengas buen día.',
  ],
]

// Pools de respuestas para las conversaciones generadas.
const BOT_CLOSURES = [
  'Cualquier otra consulta, estamos acá.',
  'Quedamos atentos a cualquier duda.',
  '¡Gracias por escribirnos! 😊',
]

/* ------------------------------ Generadores ------------------------------ */

/* Avatar: iniciales + clase de color (ciclica). */
const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-teal-500',
]

const initialsOf = (name) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

// Numero de telefono ficticio tipo WhatsApp argentino.
function makePhone(rnd) {
  const digits = String(Math.floor(rnd() * 900000) + 100000)
  return `+54 381 ${digits.slice(0, 3)}-${digits.slice(3)}`
}

// Chat de un customer: devuelve { messages, unread }.
function makeConversation(rnd, startMinutesAgo) {
  const script = SCRIPTS[Math.floor(rnd() * SCRIPTS.length)]
  const closure = BOT_CLOSURES[Math.floor(rnd() * BOT_CLOSURES.length)]
  const lines = [...script]
  // A veces se agrega una frase de cierre del bot.
  if (rnd() > 0.5) lines.push(closure)

  const messages = []
  const now = Date.now()
  let elapsed = 0

  lines.forEach((text, i) => {
    const sender = i % 2 === 0 ? 'user' : 'bot' // user empieza siempre
    // Espaciado entre mensajes: 1 a 40 minutos.
    elapsed += 40_000 + Math.floor(rnd() * 2_400_000)
    const m = {
      id: `m-${startMinutesAgo}-${i}`,
      sender,
      text,
      ts: now - startMinutesAgo * 60_000 - elapsed,
      status: sender === 'bot' ? (i === lines.length - 1 ? 'delivered' : 'read') : undefined,
    }
    messages.push(m)
  })

  // Algunos customers tienen mensajes sin leer del cliente (llegan despues).
  // Para que el badge "Ahora" y el filtro "hoy" tengan sentido, esos mensajes
  // "vuelven" recién hoy, aunque la conversación sea vieja.
  let unread = 0
  if (rnd() > 0.55) {
    unread = 1 + Math.floor(rnd() * 3)
    const lastTs = messages[messages.length - 1].ts
    const backAgain = Math.max(lastTs + 60_000, now - 60_000 * (2 + Math.floor(rnd() * 90)))
    for (let u = 0; u < unread; u += 1) {
      messages.push({
        id: `m-${startMinutesAgo}-unread-${u}`,
        sender: 'user',
        text: ['Hola?', '¿Estás ahí?', 'Quedo atento 👍'].slice(u, u + 1)[0],
        ts: backAgain + 120_000 * u,
      })
    }
  }

  return { messages, unread }
}

// Metricas por alcance de un tenant (deterministas por cantidad de customers).
function makeStats(rnd, customersCount) {
  const base = {
    hoy: {
      chats: Math.max(1, Math.round(customersCount * (0.15 + rnd() * 0.15))),
      messages: Math.max(4, Math.round(customersCount * (0.9 + rnd() * 1.2))),
    },
    semana: null,
    mes: null,
    anio: null,
  }
  base.semana = {
    chats: Math.max(2, Math.round(customersCount * (0.55 + rnd() * 0.3))),
    messages: base.hoy.messages * (5 + rnd() * 3),
  }
  base.mes = {
    chats: customersCount,
    messages: base.semana.messages * (4 + rnd() * 2),
  }
  base.anio = {
    chats: Math.round(customersCount * (6 + rnd() * 4)),
    messages: base.mes.messages * (10 + rnd() * 4),
  }
  // Tokens estimados (~19 tokens por mensaje de promedio con Gemini).
  for (const range of Object.keys(base)) {
    base[range].tokens = Math.round(base[range].messages * (16 + rnd() * 10))
    base[range].messages = Math.round(base[range].messages)
    base[range].chats = Math.round(base[range].chats)
  }
  return base
}

/* --------------------------- Construccion de DB -------------------------- */

function buildDatabase() {
  const rnd = mulberry32(20260919)
  const tenants = []

  const industryKeys = INDUSTRIES.map((i) => i.key)

  // Reparto aleatorio de tenants entre los socios con semilla fija (queda
  // estable entre recargas). Se garantiza al menos 1 tenant por socio.
  const socioPool = [
    ...SOCIOS,
    ...Array.from({ length: 20 - SOCIOS.length }, () =>
      SOCIOS[Math.floor(rnd() * SOCIOS.length)],
    ),
  ]
  for (let t = socioPool.length - 1; t > 0; t -= 1) {
    const j = Math.floor(rnd() * (t + 1))
    ;[socioPool[t], socioPool[j]] = [socioPool[j], socioPool[t]]
  }

  for (let i = 0; i < 20; i += 1) {
    const industry = industryKeys[i % industryKeys.length]
    const sectorNames = GREEK_BUSINESS_NAMES[industry]
    // Dentro de cada rubro cada tenant usa un nombre distinto (0, 1, 2…)
    // para que nunca haya negocios duplicados en la pseudo-DB.
    const name_business = sectorNames[Math.floor(i / industryKeys.length) % sectorNames.length]

    // El tenant queda asignado al socio sorteado en el pool.
    const socio = socioPool[i]

    // Entre 1 y 17 customers.
    const customersCount = 1 + Math.floor(rnd() * 17)

    // Customers unicos dentro del tenant.
    const nameIndexes = []
    while (nameIndexes.length < customersCount) {
      const idx = Math.floor(rnd() * FIRST_NAMES.length * LAST_NAMES.length)
      if (!nameIndexes.includes(idx)) nameIndexes.push(idx)
    }

    const customers = nameIndexes.map((idx, c) => {
      const first = FIRST_NAMES[Math.floor(idx / LAST_NAMES.length)]
      const last = LAST_NAMES[idx % LAST_NAMES.length]
      const name_user = `${first} ${last}`
      // La mayoría escribe hace horas; algunos hace días o meses, para que
      // los filtros hoy/semana/mes/año de las métricas muestren diferencias.
      const ageRoll = rnd()
      let startMinutes = 5 + c * 37 + i * 3
      if (ageRoll > 0.72) startMinutes += 60 * 24 * (1 + Math.floor(rnd() * 6)) // 1 a 6 días
      else if (ageRoll > 0.5) startMinutes += 60 * 24 * (1 + Math.floor(rnd() * 20)) // 1 a 20 días
      else if (ageRoll > 0.33) startMinutes += 60 * 24 * (30 + Math.floor(rnd() * 60)) // ~1 a 3 meses
      const conv = makeConversation(rnd, startMinutes)
      return {
        id: `cu-${i + 1}-${c + 1}`,
        name_user,
        wa_id: `549381${100000 + Math.floor(rnd() * 899999)}`,
        initials: initialsOf(name_user),
        avatarColor: AVATAR_COLORS[Math.floor(rnd() * AVATAR_COLORS.length)],
        unread: conv.unread,
        messages: conv.messages.sort((a, b) => a.ts - b.ts),
      }
    })

    // Features habilitadas (siempre incluye horarios_atencion en general).
    // Se guardan como dict {feature_key: true/false} (contrato del backend).
    const feats = {}
    FEATURES.forEach((f) => {
      feats[f.key] = rnd() > 0.45
    })
    if (!feats.horarios_atencion && rnd() > 0.2) {
      feats.horarios_atencion = true
    }
    // Spa Eros (t-003): todas habilitadas menos obras_sociales. No consume
    // azar para no alterar al resto de tenants del seed.
    if (i === 2) {
      FEATURES.forEach((f) => {
        feats[f.key] = f.key !== 'obras_sociales'
      })
    }

    const phones = makePhone(rnd)

    tenants.push({
      id: `t-${String(i + 1).padStart(3, '0')}`,
      name_business,
      display_phone_number: phones,
      phone_number_id: `1230353${String(370169000 + i * 11)}`,
      industry,
      industryLabel: INDUSTRIES.find((x) => x.key === industry).label,
      system_prompt: `Eres el asistente de "${name_business}". ${INDUSTRY_PROMPT[industry]}`,
      features: feats,
      is_active: i % 5 !== 4,          // algunos inactivos
      is_hidden: i % 7 === 0,          // algunos ocultos (solo admin)
      store: false,
      socio,
      response_schedule: i % 5 === 4 ? { start: '07:00', end: '17:00' } : 'fulltime',
      response_time: i % 5 === 4 ? 'schedule' : 'fulltime',
      response_hours: { start: '07:00', end: '17:00' },
      created_at: new Date(Date.now() - (90 - i) * 86_400_000).toISOString(),
      stats: makeStats(rnd, customersCount),
      customers,
    })
  }

  return tenants
}

/* --------------------------- DB en memoria ------------------------------- */
// La DB se arma UNA vez y queda mutable (los cambios del modal de config /
// chat se reflejan al navegar) hasta que se recargue la pagina.
const dbTenants = buildDatabase()

/* ------------------------------ ToString time ---------------------------- */
const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

/* ------------------------------- API mock -------------------------------- */

function pickSocioTenants(socio) {
  return socio ? dbTenants.filter((t) => t.socio === socio) : dbTenants
}

export function listTenants({ scope = 'todos', socio = '' } = {}) {
  if (scope === 'mios') return pickSocioTenants(socio)
  return dbTenants
}

export function getTenant(tenantId) {
  return dbTenants.find((t) => t.id === tenantId) ?? null
}

export function getCustomers(tenantId) {
  const tenant = getTenant(tenantId)
  if (!tenant) return []
  return tenant.customers.map((c) => {
    const last = c.messages[c.messages.length - 1]
    const lastUnread = c.unread > 0
    return {
      id: c.id,
      name_user: c.name_user,
      wa_id: c.wa_id,
      initials: c.initials,
      avatarColor: c.avatarColor,
      unread: c.unread,
      last_message: last ? last.text : '',
      last_ts: last ? last.ts : null,
      last_time_label: c.unread > 0 ? 'Ahora' : last ? fmtTime(last.ts) : '',
      active: lastUnread,
    }
  })
}

export function getMessages(tenantId, customerId) {
  const tenant = getTenant(tenantId)
  if (!tenant) return []
  const customer = tenant.customers.find((c) => c.id === customerId)
  return customer ? customer.messages : []
}

export function getMetrics({ scope = 'todos', socio = '', range = 'mes' } = {}) {
  const tenants = scope === 'mios' ? pickSocioTenants(socio) : dbTenants
  const rows = tenants.map((t) => ({
    tenantId: t.id,
    name: t.name_business,
    industry: t.industryLabel,
    is_active: t.is_active,
    chats: t.stats[range].chats,
    messages: t.stats[range].messages,
    tokens: t.stats[range].tokens,
  }))
  const totals = rows.reduce(
    (acc, r) => ({
      chats: acc.chats + r.chats,
      messages: acc.messages + r.messages,
      tokens: acc.tokens + r.tokens,
    }),
    { chats: 0, messages: 0, tokens: 0 },
  )
  return { rows, totals, count: rows.length }
}

/* Metricas propias del tenant (rol tenant) por rango.
 * range: 'hoy' | 'semana' | 'mes' | 'anio'.
 * - rows: por customer la cantidad de mensajes que escribió en el rango.
 * - atendidos: customers con al menos 1 mensaje en el rango.
 * - respondidos: mensajes enviados por el bot/negocio en el rango.
 */
const RANGE_START = {
  hoy: () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  },
  semana: () => Date.now() - 7 * 86_400_000,
  mes: () => Date.now() - 30 * 86_400_000,
  anio: () => Date.now() - 365 * 86_400_000,
}

export function getTenantMetrics(tenantId, range = 'hoy') {
  const tenant = getTenant(tenantId)
  if (!tenant) return { rows: [], atendidos: 0, respondidos: 0, range }
  const start = RANGE_START[range] ? RANGE_START[range]() : RANGE_START.hoy()
  const rows = []
  let respondidos = 0
  tenant.customers.forEach((c) => {
    let userMsgs = 0
    c.messages.forEach((m) => {
      if (m.ts < start) return
      if (m.sender === 'user') userMsgs += 1
      else respondidos += 1
    })
    if (userMsgs > 0) {
      rows.push({
        customerId: c.id,
        name_user: c.name_user,
        initials: c.initials,
        avatarColor: c.avatarColor,
        messages: userMsgs,
      })
    }
  })
  rows.sort((a, b) => b.messages - a.messages)
  return { rows, atendidos: rows.length, respondidos, range }
}

export function createTenant(data) {
  const now = Date.now()
  const id = `t-${String(dbTenants.length + 1).padStart(3, '0')}`
  const industryLabel = INDUSTRIES.find((x) => x.key === data.industry)?.label ?? data.industry
  const tenant = {
    id,
    name_business: data.name_business,
    display_phone_number: data.display_phone_number,
    phone_number_id: data.phone_number_id ?? null,
    industry: data.industry,
    industryLabel,
    system_prompt: data.system_prompt,
    features: normalizeFeatures(data.features),
    is_active: data.is_active ?? true,
    is_hidden: data.is_hidden ?? false,
    store: data.store ?? false,
    socio: data.socio ?? '',
    response_schedule:
      data.response_schedule ??
      (data.response_time === 'schedule'
        ? { start: data.response_hours?.start ?? '07:00', end: data.response_hours?.end ?? '17:00' }
        : 'fulltime'),
    response_time: data.response_time ?? 'fulltime',
    response_hours: data.response_hours ?? { start: '07:00', end: '17:00' },
    created_at: new Date(now).toISOString(),
    stats: makeStats(mulberry32(now % 100000), 0),
    customers: [],
  }
  dbTenants.push(tenant)
  return tenant
}

export function updateTenant(tenantId, patch) {
  const tenant = getTenant(tenantId)
  if (!tenant) return null
  // El patch de config (JSONB de features) hace merge: no pisa otras features.
  if (patch.config) {
    const rest = { ...patch }
    delete rest.config
    Object.assign(tenant, rest)
    tenant.config = { ...(tenant.config ?? {}), ...patch.config }
  } else {
    Object.assign(tenant, patch)
  }
  if (patch.industry) {
    tenant.industryLabel = INDUSTRIES.find((x) => x.key === patch.industry)?.label ?? patch.industry
  }
  // response_schedule es el campo nuevo de horarios de la IA. Sincronizamos
  // los legacy (response_time / response_hours) para no romper lecturas viejas.
  if (patch.response_schedule) {
    const s = patch.response_schedule
    if (typeof s === 'string') {
      tenant.response_time = 'fulltime'
      tenant.response_hours = { start: '00:00', end: '00:00' }
    } else if (s.days) {
      tenant.response_time = 'per_day'
      tenant.response_hours = s.days.lunes ?? { start: '08:00', end: '17:00' }
    } else {
      tenant.response_time = 'schedule'
      tenant.response_hours = { start: s.start ?? '08:00', end: s.end ?? '17:00' }
    }
  }
  return tenant
}

export function sendMessage(tenantId, customerId, text) {
  const tenant = getTenant(tenantId)
  if (!tenant) return null
  const customer = tenant.customers.find((c) => c.id === customerId)
  if (!customer) return null
  const msg = {
    id: `m-${Date.now()}`,
    sender: 'bot',
    text,
    ts: Date.now(),
    status: 'sent',
  }
  customer.messages.push(msg)
  customer.unread = 0
  return msg
}

/* --------------------------------------------------------------------------
 * AUTH (modo demo)
 * ------------------------------------------------------------------------ */

// Login contra las cuentas demo (backend apagado). Misma lista y reglas que
// el login falso historico: username (o email legacy) + password.
export async function loginUser({ identifier, password } = {}) {
  await new Promise((resolve) => setTimeout(resolve, 400))

  const id = (identifier ?? '').trim().toLowerCase()
  const account = DEMO_ACCOUNTS.find(
    (acc) =>
      ((acc.username ?? '').toLowerCase() === id ||
        (acc.email ?? '').toLowerCase() === id) &&
      acc.password === password,
  )

  if (!account) {
    throw new Error('Credenciales incorrectas (demo)')
  }

  const token = `jwt_demo_${account.role}_${Date.now()}`
  return {
    access_token: token,
    token_type: 'bearer',
    user: {
      id: account.tenantId ?? account.username,
      name: account.name,
      username: account.username,
      email: account.email ?? null,
      role: account.role,
      tenantId: account.tenantId ?? null,
    },
  }
}