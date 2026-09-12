/* ==========================================================================
 * mockData.js
 * --------------------------------------------------------------------------
 * Datos de ejemplo (mock) usados para maquetar el frontend y simular el
 * backend mientras se refactoriza. Todo esto deberia llegarse a reemplazar
 * por llamadas reales a la API REST (FastAPI) en el futuro.
 *
 * Contenido:
 *   1. ROLES          -> definicion de roles y su ruta de inicio.
 *   2. DEMO_ACCOUNTS  -> cuentas de acceso simuladas para el login.
 *   3. INDUSTRY_SCHEMA-> esquema de features/JSONB por rubro (definicion
 *                        del formulario dinamico del socio y de la config
 *                        del cliente).
 *   4. TENANTS        -> listado de negocios de ejemplo (incluye varios
 *                        con is_hidden = true para el panel admin).
 *   5. GLOBAL_METRICS -> metricas globales para el dashboard admin.
 * --------------------------------------------------------------------------
 * NOTA: los nombres de variables/campos estan en ingles para mantener la
 * convencion, pero representan conceptos del modelo backend.
 * ========================================================================== */

/* --------------------------------------------------------------------------
 * 1) ROLES y su ruta de destino.
 * 'home' es la primera pantalla a la que se redirige cada rol tras loguearse.
 * ------------------------------------------------------------------------ */
export const ROLES = {
  admin: {
    key: 'admin',
    label: 'Administrador',
    home: '/admin',
  },
  socio: {
    key: 'socio',
    label: 'Socio comercial',
    home: '/socio/metrics',
  },
  cliente: {
    key: 'cliente',
    label: 'Cliente / Negocio',
    home: '/dashboard/stats',
  },
}

/* --------------------------------------------------------------------------
 * 2) Cuentas de acceso demo.
 * Simulan la autenticacion. En el futuro esto lo resuelve /v1/auth/login.
 * El campo tenantId solo se usa para el rol 'cliente', apuntando al negocio
 * que ese usuario administra.
 * ------------------------------------------------------------------------ */
export const DEMO_ACCOUNTS = [
  {
    email: 'admin@lanoespada.com',
    password: 'admin123',
    name: 'Equipo La No Espada',
    role: 'admin',
  },
  {
    email: 'socio@lanoespada.com',
    password: 'socio123',
    name: 'Agustina Díaz',
    role: 'socio',
  },
  {
    email: 'negocio@lanoespada.com',
    password: 'negocio123',
    name: 'Consultorio San Benito',
    role: 'cliente',
    tenantId: 't-001',
  },
]

/* --------------------------------------------------------------------------
 * 3) INDUSTRY_SCHEMA
 * Define, por rubro del negocio, que "features" se pueden habilitar y como
 * se configuran (JSONB). Este esquema alimenta:
 *   - El formulario dinamico de registro del socio (RegisterBusiness).
 *   - La ficha de configuracion del cliente (DashboardSettings), que solo
 *     muestra los features habilitados por el socio.
 *
 * Estructura de cada feature:
 *   key          -> identificador (inglés).
 *   label        -> texto visible en espanol.
 *   description  -> texto de ayuda.
 *   fields       -> lista de campos a renderizar:
 *                     { type: 'text', ... }
 *                     { type: 'textarea', ... }
 *                     { type: 'number', ... }
 *                     { type: 'checkbox', ... }
 *                     { type: 'multiselect', options: [...] }
 *                     { type: 'dynamicList', itemTitle, itemFields: [...] }
 *   toggleOnly   -> true si el feature solo es un interruptor (sin campos).
 * ------------------------------------------------------------------------ */
export const OBRAS_SOCIALES_OPTIONS = [
  'OSDE',
  'Swiss Medical',
  'Galeno',
  'FSalud',
  'IOMA',
  'PAMI',
  'Omint',
  'Medife',
]

export const FORMAS_PAGO_OPTIONS = [
  'Efectivo',
  'Débito',
  'Crédito',
  'Transferencia',
  'Mercado Pago',
]

export const INDUSTRY_SCHEMA = {
  consultorio_medico: {
    key: 'consultorio_medico',
    label: 'Consultorio médico',
    description: 'Centros de salud, consultorios, clínicas.',
    defaultEnabled: ['horarios', 'medicos', 'obras_sociales', 'formas_pago'],
    features: [
      {
        key: 'horarios',
        label: 'Horarios de atención',
        description: 'Días y horarios de atención al público.',
        fields: [
          { key: 'lunes_a_viernes', label: 'Lunes a viernes', type: 'text', placeholder: '08:00 - 20:00' },
          { key: 'sabados', label: 'Sábados', type: 'text', placeholder: '08:00 - 14:00' },
          { key: 'domingos', label: 'Domingos', type: 'text', placeholder: 'Cerrado' },
        ],
      },
      {
        key: 'medicos',
        label: 'Médicos / Profesionales',
        description: 'Equipo profesional que atiende en el consultorio.',
        fields: [
          {
            key: 'list',
            label: 'Médicos',
            type: 'dynamicList',
            itemTitle: 'Médico',
            itemFields: [
              { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Dr. José Pérez' },
              { key: 'especialidad', label: 'Especialidad', type: 'text', placeholder: 'Ginecología' },
              { key: 'horarios', label: 'Horario', type: 'text', placeholder: 'Lunes y Miércoles 09:00 - 14:00' },
            ],
          },
        ],
      },
      {
        key: 'obras_sociales',
        label: 'Obras sociales',
        description: 'Obras sociales y prepagas aceptadas.',
        fields: [
          { key: 'value', label: 'Seleccioná las aceptadas', type: 'multiselect', options: OBRAS_SOCIALES_OPTIONS },
        ],
      },
      {
        key: 'formas_pago',
        label: 'Formas de pago',
        description: 'Medios de pago habilitados.',
        fields: [
          { key: 'value', label: 'Seleccioná las disponibles', type: 'multiselect', options: FORMAS_PAGO_OPTIONS },
        ],
      },
      {
        key: 'turnos',
        label: 'Reserva de turnos online',
        description: 'Si está activo, el asistente puede coordinar turnos con recepción.',
        toggleOnly: true,
        fields: [],
      },
    ],
  },
  restaurante: {
    key: 'restaurante',
    label: 'Restaurante',
    description: 'Restaurantes, bares y locales gastronómicos.',
    defaultEnabled: ['horarios', 'menu', 'promociones', 'envios'],
    features: [
      {
        key: 'horarios',
        label: 'Horarios de atención',
        description: 'Días y horarios del local.',
        fields: [
          { key: 'lunes_a_viernes', label: 'Lunes a viernes', type: 'text', placeholder: '11:00 - 15:00 / 20:00 - 00:00' },
          { key: 'sabados', label: 'Sábados', type: 'text', placeholder: '11:00 - 00:00' },
        ],
      },
      {
        key: 'menu',
        label: 'Menú / Carta',
        description: 'Platos disponibles (se muestra al cliente por WhatsApp).',
        fields: [
          {
            key: 'list',
            label: 'Platos',
            type: 'dynamicList',
            itemTitle: 'Plato',
            itemFields: [
              { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Milanesa napolitana' },
              { key: 'precio', label: 'Precio ($)', type: 'number', placeholder: '12000' },
            ],
          },
        ],
      },
      {
        key: 'promociones',
        label: 'Promociones',
        description: 'Ofertas vigentes del comercio.',
        fields: [
          { key: 'titulo', label: 'Título', type: 'text', placeholder: 'Menú ejecutivo del día' },
          { key: 'descuento', label: 'Descuento (%)', type: 'number', placeholder: '20' },
        ],
      },
      {
        key: 'envios',
        label: 'Envíos / Delivery',
        description: 'Configuración de reparto a domicilio.',
        fields: [
          { key: 'disponible', label: 'Hacer envíos', type: 'checkbox' },
          { key: 'zona', label: 'Zona de cobertura', type: 'text', placeholder: 'Centro y alrededores' },
          { key: 'costo', label: 'Costo del envío ($)', type: 'number', placeholder: '2500' },
        ],
      },
      {
        key: 'reservas',
        label: 'Reservas de mesa',
        description: 'Permite reservar mesas desde WhatsApp.',
        toggleOnly: true,
        fields: [],
      },
    ],
  },
  tienda: {
    key: 'tienda',
    label: 'Tienda / Comercio',
    description: 'Tiendas, kioscos y comercios en general.',
    defaultEnabled: ['horarios', 'inventario', 'promociones', 'envios'],
    features: [
      {
        key: 'horarios',
        label: 'Horarios de atención',
        description: 'Días y horarios del local.',
        fields: [
          { key: 'lunes_a_viernes', label: 'Lunes a viernes', type: 'text', placeholder: '09:00 - 18:00' },
          { key: 'sabados', label: 'Sábados', type: 'text', placeholder: '09:00 - 13:00' },
        ],
      },
      {
        key: 'inventario',
        label: 'Inventario',
        description: 'Productos y stock disponible.',
        fields: [
          {
            key: 'list',
            label: 'Productos',
            type: 'dynamicList',
            itemTitle: 'Producto',
            itemFields: [
              { key: 'producto', label: 'Producto', type: 'text', placeholder: 'Remera algodón' },
              { key: 'stock', label: 'Stock', type: 'number', placeholder: '10' },
              { key: 'precio', label: 'Precio ($)', type: 'number', placeholder: '18000' },
            ],
          },
        ],
      },
      {
        key: 'promociones',
        label: 'Promociones',
        description: 'Ofertas vigentes.',
        fields: [
          { key: 'titulo', label: 'Título', type: 'text', placeholder: '2x1 en remeras' },
          { key: 'descuento', label: 'Descuento (%)', type: 'number', placeholder: '25' },
        ],
      },
      {
        key: 'envios',
        label: 'Envíos',
        description: 'Envíos a domicilio o retiro en local.',
        fields: [
          { key: 'disponible', label: 'Hacer envíos', type: 'checkbox' },
          { key: 'zona', label: 'Zona de cobertura', type: 'text', placeholder: 'Zona céntrica' },
        ],
      },
    ],
  },
  barberia: {
    key: 'barberia',
    label: 'Barbería / Salón',
    description: 'Barberías, peluquerías y salones de estética.',
    defaultEnabled: ['horarios', 'servicios', 'turnos', 'promociones'],
    features: [
      {
        key: 'horarios',
        label: 'Horarios de atención',
        description: 'Días y horarios del local.',
        fields: [
          { key: 'lunes_a_viernes', label: 'Lunes a viernes', type: 'text', placeholder: '09:00 - 21:00' },
          { key: 'sabados', label: 'Sábados', type: 'text', placeholder: '09:00 - 18:00' },
        ],
      },
      {
        key: 'servicios',
        label: 'Servicios',
        description: 'Servicios ofrecidos y su duración.',
        fields: [
          {
            key: 'list',
            label: 'Servicios',
            type: 'dynamicList',
            itemTitle: 'Servicio',
            itemFields: [
              { key: 'nombre', label: 'Servicio', type: 'text', placeholder: 'Corte clásico' },
              { key: 'duracion', label: 'Duración (min)', type: 'number', placeholder: '40' },
              { key: 'precio', label: 'Precio ($)', type: 'number', placeholder: '8000' },
            ],
          },
        ],
      },
      {
        key: 'turnos',
        label: 'Agenda de turnos',
        description: 'Los clientes pueden reservar horario.',
        toggleOnly: true,
        fields: [],
      },
      {
        key: 'promociones',
        label: 'Promociones',
        description: 'Ofertas del salón.',
        fields: [
          { key: 'titulo', label: 'Título', type: 'text', placeholder: 'Corte + barba' },
          { key: 'descuento', label: 'Descuento (%)', type: 'number', placeholder: '15' },
        ],
      },
    ],
  },
}

/* --------------------------------------------------------------------------
 * 4) TENANTS (negocios) de ejemplo.
 * Incluye varios con is_hidden = true para comprobar que el admin los ve.
 * 'features' resume qué funciones tiene habilitado el negocio y 'config'
 * contiene los datos concretos de cada feature (JSONB).
 * ------------------------------------------------------------------------ */
export const TENANTS = [
  {
    id: 't-001',
    name_business: 'Consultorio San Benito',
    display_phone_number: '+54 381 346-5304',
    phone_number_id: '1230353370169065',
    industry: 'consultorio_medico',
    is_active: true,
    is_hidden: false,
    created_at: '2026-01-12',
    metrics: {
      messages: { today: 148, week: 1032, month: 4180 },
      tokens: { today: 121400, week: 812000, month: 3401000 },
      customers: 342,
    },
    features: ['horarios', 'medicos', 'obras_sociales', 'formas_pago', 'turnos'],
    config: {
      horarios: {
        lunes_a_viernes: '08:00 - 20:00',
        sabados: '08:00 - 14:00',
        domingos: 'Cerrado',
      },
      medicos: [
        { nombre: 'Dr. José Pérez', especialidad: 'Ginecología y Obstetricia', horarios: 'Lun y Mié 09:00 - 14:00' },
        { nombre: 'Dra. María Benicio', especialidad: 'Urología', horarios: 'Mar y Jue 10:00 - 16:00' },
      ],
      obras_sociales: ['OSDE', 'Swiss Medical', 'Galeno', 'FSalud'],
      formas_pago: ['Efectivo', 'Débito', 'Crédito'],
      turnos: true,
    },
  },
  {
    id: 't-002',
    name_business: 'Las Empanadas de Juana',
    display_phone_number: '+54 381 400-2233',
    phone_number_id: '1230353370169077',
    industry: 'restaurante',
    is_active: true,
    is_hidden: false,
    created_at: '2026-02-03',
    metrics: {
      messages: { today: 96, week: 640, month: 2800 },
      tokens: { today: 82000, week: 520000, month: 2200000 },
      customers: 187,
    },
    features: ['horarios', 'menu', 'promociones', 'envios'],
    config: {
      horarios: {
        lunes_a_viernes: '11:00 - 15:00 / 20:00 - 00:00',
        sabados: '11:00 - 00:00',
        domingos: '11:00 - 22:00',
      },
      menu: [
        { nombre: 'Docena de empanadas', precio: 12000 },
        { nombre: 'Lomo completo', precio: 16000 },
        { nombre: 'Milanesa napolitana', precio: 13500 },
      ],
      promociones: { titulo: 'Docena + gaseosa', descuento: 10 },
      envios: { disponible: true, zona: 'Centro y Barrio Norte', costo: 2000 },
    },
  },
  {
    id: 't-003',
    name_business: 'Motion Fit Store',
    display_phone_number: '+54 381 550-0101',
    phone_number_id: '1230353370169088',
    industry: 'tienda',
    is_active: true,
    is_hidden: true,
    created_at: '2026-03-18',
    metrics: {
      messages: { today: 12, week: 95, month: 340 },
      tokens: { today: 9800, week: 74100, month: 295000 },
      customers: 64,
    },
    features: ['horarios', 'inventario', 'promociones', 'envios'],
    config: {
      horarios: {
        lunes_a_viernes: '09:00 - 18:00',
        sabados: '09:00 - 13:00',
        domingos: 'Cerrado',
      },
      inventario: [
        { producto: 'Remera algodón', stock: 24, precio: 18000 },
        { producto: 'Short running', stock: 8, precio: 24000 },
      ],
      promociones: { titulo: '2x1 en accesorios', descuento: 50 },
      envios: { disponible: true, zona: 'Zona céntrica', costo: 0 },
    },
  },
  {
    id: 't-004',
    name_business: 'Barba & Tijera Club',
    display_phone_number: '+54 381 512-9090',
    phone_number_id: '1230353370169099',
    industry: 'barberia',
    is_active: false,
    is_hidden: false,
    created_at: '2026-04-25',
    metrics: {
      messages: { today: 0, week: 18, month: 145 },
      tokens: { today: 0, week: 12000, month: 98000 },
      customers: 22,
    },
    features: ['horarios', 'servicios', 'turnos'],
    config: {
      horarios: {
        lunes_a_viernes: '09:00 - 21:00',
        sabados: '09:00 - 18:00',
        domingos: 'Cerrado',
      },
      servicios: [
        { nombre: 'Corte clásico', duracion: 40, precio: 8000 },
        { nombre: 'Corte + barba', duracion: 60, precio: 11000 },
      ],
      turnos: true,
    },
  },
]

/* --------------------------------------------------------------------------
 * 5) GLOBAL_METRICS
 * Valores agregados usados por el panel del admin.
 * ------------------------------------------------------------------------ */
export const GLOBAL_METRICS = {
  totalTenants: 4,
  activeTenants: 3,
  hiddenTenants: 1,
  totalCustomers: 615,
  totalMessagesMonth: 7465,
  totalTokensMonth: 5998000,
  messagesByDay: [
    { day: 'Lun', value: 980 },
    { day: 'Mar', value: 1150 },
    { day: 'Mié', value: 1040 },
    { day: 'Jue', value: 1210 },
    { day: 'Vie', value: 1330 },
    { day: 'Sáb', value: 1120 },
    { day: 'Dom', value: 635 },
  ],
}

/* --------------------------------------------------------------------------
 * 6) MOCK_CUSTOMERS
 * Conversaciones de ejemplo de un negocio (para la vista del rol 'cliente').
 * Cada item es un Customer que le escribio al negocio por WhatsApp.
 * ------------------------------------------------------------------------ */
export const MOCK_CUSTOMERS = [
  {
    id: 'c-1',
    name_user: 'Rafael Lobo',
    wa_id: '5493813465304',
    initials: 'RL',
    last_message: '¿Los martes atiende la Dra. Benicio?',
    last_activity: 'Hace 5 min',
    messages_today: 4,
    is_active: true,
  },
  {
    id: 'c-2',
    name_user: 'María González',
    wa_id: '5493815120987',
    initials: 'MG',
    last_message: '¡Hola! Quiero sacar turno con el Dr. Pérez.',
    last_activity: 'Hace 12 min',
    messages_today: 9,
    is_active: true,
  },
  {
    id: 'c-3',
    name_user: 'Carlos Tapia',
    wa_id: '5493814773344',
    initials: 'CT',
    last_message: '¿Cuánto sale una consulta particular?',
    last_activity: 'Hace 31 min',
    messages_today: 2,
    is_active: true,
  },
  {
    id: 'c-4',
    name_user: 'Lucía Ferreyra',
    wa_id: '5493816001122',
    initials: 'LF',
    last_message: 'Gracias, quedó confirmado. 👍',
    last_activity: 'Hace 1 h',
    messages_today: 3,
    is_active: true,
  },
  {
    id: 'c-5',
    name_user: 'Jorge Medina',
    wa_id: '5493813228899',
    initials: 'JM',
    last_message: '¿Aceptan OSDE?',
    last_activity: 'Ayer',
    messages_today: 0,
    is_active: false,
  },
  {
    id: 'c-6',
    name_user: 'Ana Pereyra',
    wa_id: '5493817331212',
    initials: 'AP',
    last_message: 'Necesito un informe clínico.',
    last_activity: 'Ayer',
    messages_today: 0,
    is_active: false,
  },
]

/* --------------------------------------------------------------------------
 * 7) HISTORIAL DE BACKUPS (mock del boton "Backup Manual de Base de Datos").
 * ------------------------------------------------------------------------ */
export const BACKUP_HISTORY = [
  { id: 'b-3', date: '2026-09-08 03:00', status: 'ok', size: '48.2 MB', manual: false },
  { id: 'b-2', date: '2026-09-07 03:00', status: 'ok', size: '47.9 MB', manual: false },
  { id: 'b-1', date: '2026-09-06 03:00', status: 'ok', size: '47.1 MB', manual: false },
]