import type { Kit, Pedido, Producto } from '@/domain/tienda/types'
import { readStorage, writeStorage } from './storage'
import type { TiendaRepository } from './tiendaRepository.types'

const STORAGE_KEY = 'colorlink:pedidos'
const STORAGE_VERSION = 1

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

  async crearPedido(items, clienteNombre, clienteEmail) {
    const pedidos = readStorage<Pedido[]>(STORAGE_KEY, STORAGE_VERSION) ?? []
    const total = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0)
    const nuevo: Pedido = {
      id: siguienteIdPedido(pedidos),
      clienteNombre,
      clienteEmail,
      items,
      total,
      estado: 'Recibido',
      fecha: new Date().toISOString().slice(0, 10),
    }
    writeStorage(STORAGE_KEY, STORAGE_VERSION, [nuevo, ...pedidos])
    return nuevo
  },

  async listarPedidosPorEmail(clienteEmail) {
    const pedidos = readStorage<Pedido[]>(STORAGE_KEY, STORAGE_VERSION) ?? []
    return pedidos.filter((p) => p.clienteEmail === clienteEmail)
  },
}
