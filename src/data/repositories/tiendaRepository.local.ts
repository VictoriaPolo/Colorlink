import type { Kit, Pedido, Producto } from '@/domain/tienda/types'
import { codigoRetiro, pagoDe, referenciaPago } from '@/domain/pagos/pasarela'
import { readStorage, writeStorage } from './storage'
import type { TiendaRepository } from './tiendaRepository.types'

const STORAGE_KEY = 'colorlink:pedidos'
const STORAGE_VERSION = 2

/** Mismos productos y kits que supabase/seed_tienda.sql — se mantienen
 * sincronizados a mano porque son pocos y cambian poco. */
const PRODUCTOS: Producto[] = [
  {
    id: 1,
    nombre: 'Viniltex',
    categoria: 'Interiores',
    descripcion: 'Pintura vinílica de interior, bajo olor y alta cubrición.',
    precio: 145900,
    unidadMedida: 'Galón',
    destacado: false,
    badge: 'Más vendida en interiores',
    rendimientoM2PorGalon: 30,
  },
  {
    id: 2,
    nombre: 'Koraza 5 Años Protección Total',
    categoria: 'Fachadas y exteriores',
    descripcion: 'Pintura elastomérica exterior antihongos con máxima resistencia a la intemperie y rayos UV.',
    precio: 142900,
    unidadMedida: 'Galón',
    destacado: true,
    badge: 'Más vendido en fachadas',
    rendimientoM2PorGalon: 22,
  },
  {
    id: 3,
    nombre: 'Aquablock Fibratado',
    categoria: 'Impermeabilizantes',
    descripcion: 'Impermeabilizante elastomérico reforzado con fibras para losas, cubiertas y terrazas transitables.',
    precio: 139900,
    unidadMedida: 'Galón',
    destacado: true,
    badge: 'Máxima impermeabilidad',
    rendimientoM2PorGalon: 12,
  },
  {
    id: 4,
    nombre: 'Pintulux 3 en 1 Anticorrosivo + Esmalte',
    categoria: 'Esmaltes y metales',
    descripcion: 'Transforma el óxido, protege el metal y entrega acabado brillante duradero en 1 solo paso.',
    precio: 124900,
    unidadMedida: 'Galón',
    destacado: true,
    badge: 'Directo al óxido',
    rendimientoM2PorGalon: 28,
  },
  {
    id: 5,
    nombre: 'Masilla Elastomérica + Koraza',
    categoria: 'Fachadas y exteriores',
    descripcion: 'Masilla acrílica flexible para sello de fisuras y juntas con movimiento en exteriores.',
    precio: 68900,
    unidadMedida: 'Galón',
    destacado: true,
    badge: null,
    rendimientoM2PorGalon: 15,
  },
  {
    id: 6,
    nombre: 'Madetec Protector para Madera',
    categoria: 'Fachadas y exteriores',
    descripcion: 'Protector y sellador para madera interior y exterior, resistente a la intemperie.',
    precio: 98900,
    unidadMedida: 'Galón',
    destacado: false,
    badge: null,
    rendimientoM2PorGalon: 20,
  },
  {
    id: 7,
    nombre: 'Vinilico Concreto',
    categoria: 'Interiores',
    descripcion: 'Recubrimiento vinílico sellador para superficies de concreto y mampostería.',
    precio: 89900,
    unidadMedida: 'Galón',
    destacado: false,
    badge: null,
    rendimientoM2PorGalon: 25,
  },
  {
    id: 8,
    nombre: 'Viniltex Multiuso',
    categoria: 'Interiores',
    descripcion: 'Pintura multipropósito para interiores, ideal para primeros proyectos.',
    precio: 79900,
    unidadMedida: 'Galón',
    destacado: false,
    badge: null,
    rendimientoM2PorGalon: 30,
  },
]

const KITS: Kit[] = [
  {
    id: 1,
    patologia: 'Fachada exterior',
    nombre: 'Fachada Exterior con Fisuras y Lluvia',
    descripcion:
      'Tratamiento integral de sellado elástico y acabado hidrófugo con Koraza 5 Años. Resistente a rayos UV, hongos y polvo.',
    componentes: ['Masilla Elastomérica', 'Sellador Antialcalino', 'Koraza 5 Años'],
    precioEstimado: 1087700,
    descuentoPct: 12,
  },
  {
    id: 2,
    patologia: 'Humedad y moho',
    nombre: 'Control de Humedad y Moho en Muros',
    descripcion:
      'Impermeabilización y tratamiento antihongos para muros con manchas de humedad recurrente, con Aquablock Fibratado.',
    componentes: ['Estuco impermeabilizante', 'Aquablock Fibratado', 'Sellador antihongos'],
    precioEstimado: 620000,
    descuentoPct: 10,
  },
  {
    id: 3,
    patologia: 'Goteras y terrazas',
    nombre: 'Impermeabilización de Terrazas Transitables',
    descripcion:
      'Sistema completo para techos y terrazas con tránsito, resistente a encharcamiento y rayos UV.',
    componentes: ['Imprimante asfáltico', 'Aquablock Fibratado', 'Manto reforzado'],
    precioEstimado: 950000,
    descuentoPct: 8,
  },
  {
    id: 4,
    patologia: 'Metales oxidados',
    nombre: 'Recuperación de Rejas y Metales Oxidados',
    descripcion: 'Convierte el óxido, protege y da acabado brillante duradero en un solo sistema.',
    componentes: ['Convertidor de óxido', 'Pintulux 3 en 1'],
    precioEstimado: 340000,
    descuentoPct: 15,
  },
]

/** Pedidos de ejemplo para que el panel del equipo tenga con qué trabajar desde el primer día. */
const PEDIDOS_INICIALES: Pedido[] = [
  {
    id: 'PED-1006',
    clienteNombre: 'Hotel Vista Verde',
    clienteEmail: 'compras@vistaverde.co',
    items: [{ productoId: 8, nombre: 'Viniltex Multiuso', precioUnitario: 79900, cantidad: 4 }],
    total: 319600,
    estado: 'Cancelado',
    fecha: '2026-09-30',
    puntoRetiro: 'Centro de Pinturas Colorlink - Poblado',
    pago: { metodo: 'tarjeta', estado: 'Reembolsado', referencia: 'PAY-K7M2QX4R', monto: 319600, fecha: '2026-10-01T15:10:00.000Z', detalle: 'Mastercard ···· 4444' },
    historial: [
      { estado: 'Recibido', fecha: '2026-09-30T14:20:00.000Z' },
      { estado: 'Cancelado', fecha: '2026-10-01T15:10:00.000Z' },
    ],
  },
  {
    id: 'PED-1005',
    clienteNombre: 'Ferretería El Maestro',
    clienteEmail: 'pedidos@elmaestro.co',
    items: [
      { productoId: 3, nombre: 'Aquablock Fibratado', precioUnitario: 139900, cantidad: 5 },
      { productoId: 7, nombre: 'Vinilico Concreto', precioUnitario: 89900, cantidad: 2 },
    ],
    total: 879300,
    estado: 'Entregado',
    fecha: '2026-10-05',
    puntoRetiro: 'Centro de Pinturas Colorlink - Chapinero',
    codigoRetiro: '9RT4WB',
    pago: { metodo: 'pse', estado: 'Aprobado', referencia: 'PAY-9RT4WB6H', monto: 879300, fecha: '2026-10-05T16:05:00.000Z', detalle: 'PSE · Bancolombia' },
    historial: [
      { estado: 'Recibido', fecha: '2026-10-05T16:05:00.000Z' },
      { estado: 'En preparación', fecha: '2026-10-05T16:40:00.000Z' },
      { estado: 'Listo para retiro', fecha: '2026-10-05T18:10:00.000Z' },
      { estado: 'Entregado', fecha: '2026-10-06T15:20:00.000Z' },
    ],
  },
  {
    id: 'PED-1004',
    clienteNombre: 'Valentina Ruiz',
    clienteEmail: 'valentina.ruiz@gmail.com',
    items: [{ productoId: 4, nombre: 'Pintulux 3 en 1 Anticorrosivo + Esmalte', precioUnitario: 124900, cantidad: 1 }],
    total: 124900,
    estado: 'Recibido',
    fecha: '2026-10-29',
    puntoRetiro: 'Centro de Pinturas Colorlink - El Prado',
    codigoRetiro: 'D3F8LN',
    pago: { metodo: 'nequi', estado: 'Aprobado', referencia: 'PAY-D3F8LN5C', monto: 124900, fecha: '2026-10-29T13:41:00.000Z', detalle: 'Nequi ···· 4821' },
    historial: [{ estado: 'Recibido', fecha: '2026-10-29T13:41:00.000Z' }],
  },
  {
    id: 'PED-1003',
    clienteNombre: 'Constructora Andina S.A.S.',
    clienteEmail: 'compras@constructoraandina.co',
    items: [
      { productoId: 2, nombre: 'Koraza 5 Años Protección Total', precioUnitario: 142900, cantidad: 6 },
      { productoId: 5, nombre: 'Masilla Elastomérica + Koraza', precioUnitario: 68900, cantidad: 4 },
    ],
    total: 1133000,
    estado: 'En preparación',
    fecha: '2026-10-27',
    puntoRetiro: 'Centro de Pinturas Colorlink - Chapinero',
    codigoRetiro: 'X2H7PQ',
    pago: { metodo: 'tarjeta', estado: 'Aprobado', referencia: 'PAY-X2H7PQ9M', monto: 1133000, fecha: '2026-10-27T15:30:00.000Z', detalle: 'Visa ···· 4242' },
    historial: [
      { estado: 'Recibido', fecha: '2026-10-27T15:30:00.000Z' },
      { estado: 'En preparación', fecha: '2026-10-27T16:05:00.000Z' },
    ],
  },
  {
    id: 'PED-1002',
    clienteNombre: 'Carlos Restrepo',
    clienteEmail: 'carlos@colorlink.com',
    items: [{ productoId: 1, nombre: 'Viniltex', precioUnitario: 145900, cantidad: 3 }],
    total: 437700,
    estado: 'Listo para retiro',
    fecha: '2026-10-22',
    puntoRetiro: 'Centro de Pinturas Colorlink - Sur',
    codigoRetiro: 'Q6V3TZ',
    pago: { metodo: 'efectivo', estado: 'Pendiente', referencia: 'PAY-Q6V3TZ8J', monto: 437700, fecha: '2026-10-22T11:12:00.000Z', detalle: 'Pagas al retirar en la tienda' },
    historial: [
      { estado: 'Recibido', fecha: '2026-10-22T11:12:00.000Z' },
      { estado: 'En preparación', fecha: '2026-10-22T11:35:00.000Z' },
      { estado: 'Listo para retiro', fecha: '2026-10-22T13:05:00.000Z' },
    ],
  },
  {
    id: 'PED-1001',
    clienteNombre: 'Laura Polo',
    clienteEmail: 'laura@colorlink.com',
    items: [
      { productoId: 2, nombre: 'Koraza 5 Años Protección Total', precioUnitario: 142900, cantidad: 2 },
      { productoId: 5, nombre: 'Masilla Elastomérica + Koraza', precioUnitario: 68900, cantidad: 1 },
    ],
    total: 354700,
    estado: 'Entregado',
    fecha: '2026-08-20',
    puntoRetiro: 'Centro de Pinturas Colorlink - El Prado',
    codigoRetiro: 'M4C9RK',
    pago: { metodo: 'tarjeta', estado: 'Aprobado', referencia: 'PAY-M4C9RK2W', monto: 354700, fecha: '2026-08-20T17:45:00.000Z', detalle: 'Visa ···· 4242' },
    historial: [
      { estado: 'Recibido', fecha: '2026-08-20T17:45:00.000Z' },
      { estado: 'En preparación', fecha: '2026-08-20T18:10:00.000Z' },
      { estado: 'Listo para retiro', fecha: '2026-08-20T19:30:00.000Z' },
      { estado: 'Entregado', fecha: '2026-08-21T14:00:00.000Z' },
    ],
  },
]

function cargarPedidos(): Pedido[] {
  return readStorage<Pedido[]>(STORAGE_KEY, STORAGE_VERSION) ?? PEDIDOS_INICIALES
}

/** El historial con la etapa nueva al final, salvo que el pedido ya estuviera en ella. */
function conEtapa(historial: Pedido['historial'], estado: string): NonNullable<Pedido['historial']> {
  const previo = historial ?? []
  return previo.at(-1)?.estado === estado ? previo : [...previo, { estado, fecha: new Date().toISOString() }]
}

function siguienteIdPedido(pedidos: Pedido[]): string {
  const maximo = pedidos.reduce((max, p) => {
    const n = Number(p.id.replace('PED-', ''))
    return Number.isFinite(n) && n > max ? n : max
  }, 1000)
  return `PED-${maximo + 1}`
}

export const tiendaRepositoryLocal: TiendaRepository = {
  async listarProductos() {
    return PRODUCTOS
  },

  async listarKits() {
    return KITS
  },

  async crearPedido(items, clienteNombre, clienteEmail, puntoRetiro, extras) {
    const pedidos = cargarPedidos()
    const subtotal = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0)
    const descuento = Math.min(Math.max(0, extras?.descuento ?? 0), subtotal)
    const nuevo: Pedido = {
      id: siguienteIdPedido(pedidos),
      clienteNombre,
      clienteEmail,
      items,
      total: subtotal - descuento,
      estado: 'Recibido',
      fecha: new Date().toISOString().slice(0, 10),
      puntoRetiro,
      ...(descuento > 0 ? { cupon: extras?.cupon, descuento } : {}),
      pago: extras?.pago,
      codigoRetiro: extras?.codigoRetiro ?? codigoRetiro(),
      historial: [{ estado: 'Recibido', fecha: new Date().toISOString() }],
    }
    writeStorage(STORAGE_KEY, STORAGE_VERSION, [nuevo, ...pedidos])
    return nuevo
  },

  async listarPedidosPorEmail(clienteEmail) {
    return cargarPedidos().filter((p) => p.clienteEmail === clienteEmail)
  },

  async listarPedidos() {
    return cargarPedidos()
  },

  async obtenerPedido(id) {
    return cargarPedidos().find((p) => p.id === id)
  },

  async actualizarEstadoPedido(id, estado) {
    const pedidos = cargarPedidos()
    const actual = pedidos.find((p) => p.id === id)
    if (!actual) return undefined
    const actualizado = { ...actual, estado, historial: conEtapa(actual.historial, estado) }
    writeStorage(STORAGE_KEY, STORAGE_VERSION, pedidos.map((p) => (p.id === id ? actualizado : p)))
    return actualizado
  },

  async actualizarPagoPedido(id, estado) {
    const pedidos = cargarPedidos()
    const actual = pedidos.find((p) => p.id === id)
    if (!actual) return undefined
    const pago = pagoDe(actual)
    // Al cobrar un pedido que se paga al retirar, el pago queda con su referencia como cualquier otro.
    const referencia = pago.referencia === '—' ? referenciaPago() : pago.referencia
    const actualizado = { ...actual, pago: { ...pago, estado, referencia, fecha: new Date().toISOString() } }
    writeStorage(STORAGE_KEY, STORAGE_VERSION, pedidos.map((p) => (p.id === id ? actualizado : p)))
    return actualizado
  },

  async agregarNotaPedido(id, autor, texto) {
    const pedidos = cargarPedidos()
    const actual = pedidos.find((p) => p.id === id)
    if (!actual) return undefined
    const nota = { id: `${id}-n${Date.now()}`, autor, texto: texto.trim(), fecha: new Date().toISOString() }
    const actualizado = { ...actual, notas: [...(actual.notas ?? []), nota] }
    writeStorage(STORAGE_KEY, STORAGE_VERSION, pedidos.map((p) => (p.id === id ? actualizado : p)))
    return actualizado
  },
}
