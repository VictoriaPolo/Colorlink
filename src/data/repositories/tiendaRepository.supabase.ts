import type { CategoriaProducto, ItemCarrito, Kit, Pedido, PatologiaKit, Producto } from '@/domain/tienda/types'
import { supabase } from '@/data/supabaseClient'
import type { TiendaRepository } from './tiendaRepository.types'

function requireClient() {
  if (!supabase) throw new Error('Supabase no está configurado (faltan VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY).')
  return supabase
}

interface ProductoRow {
  id: number
  nombre: string
  categoria: string
  descripcion: string
  precio: number
  unidad_medida: string
  destacado: boolean
  badge: string | null
  rendimiento_m2_por_galon: number
}

function mapProducto(row: ProductoRow): Producto {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria as CategoriaProducto,
    descripcion: row.descripcion,
    precio: row.precio,
    unidadMedida: row.unidad_medida,
    destacado: row.destacado,
    badge: row.badge,
    rendimientoM2PorGalon: row.rendimiento_m2_por_galon,
  }
}

interface KitRow {
  id: number
  patologia: string
  nombre: string
  descripcion: string
  componentes: string[]
  precio_estimado: number
  descuento_pct: number
}

function mapKit(row: KitRow): Kit {
  return {
    id: row.id,
    patologia: row.patologia as PatologiaKit,
    nombre: row.nombre,
    descripcion: row.descripcion,
    componentes: row.componentes,
    precioEstimado: row.precio_estimado,
    descuentoPct: row.descuento_pct,
  }
}

interface NotaPedidoRow {
  id: string
  autor: string
  texto: string
  fecha: string
}

interface PedidoRow {
  id: string
  cliente_nombre: string
  cliente_email: string | null
  items: { producto_id: number; nombre: string; cantidad: number; precio_unitario: number }[]
  total: number
  estado: string
  created_at: string
  punto_retiro: string | null
  notas: NotaPedidoRow[] | null
}

function mapPedido(row: PedidoRow): Pedido {
  return {
    id: row.id,
    clienteNombre: row.cliente_nombre,
    clienteEmail: row.cliente_email ?? '',
    items: row.items.map((i) => ({
      productoId: i.producto_id,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.precio_unitario,
    })),
    total: row.total,
    estado: row.estado,
    fecha: row.created_at.slice(0, 10),
    puntoRetiro: row.punto_retiro ?? undefined,
    notas: row.notas ?? [],
  }
}

export const tiendaRepositorySupabase: TiendaRepository = {
  async listarProductos() {
    const { data, error } = await requireClient().from('productos').select('*').order('id', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapProducto)
  },

  async listarKits() {
    const { data, error } = await requireClient().from('kits').select('*').order('id', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapKit)
  },

  async crearPedido(items: ItemCarrito[], clienteNombre: string, clienteEmail: string, puntoRetiro?: string): Promise<Pedido> {
    const total = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0)
    const { data, error } = await requireClient()
      .from('pedidos')
      .insert({
        cliente_nombre: clienteNombre,
        cliente_email: clienteEmail || null,
        items: items.map((i) => ({
          producto_id: i.productoId,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio_unitario: i.precioUnitario,
        })),
        total,
        punto_retiro: puntoRetiro ?? null,
      })
      .select('id, created_at')
      .single()
    if (error) throw error

    return {
      id: data.id as string,
      clienteNombre,
      clienteEmail,
      items,
      total,
      estado: 'Recibido',
      fecha: String(data.created_at).slice(0, 10),
      puntoRetiro,
      notas: [],
    }
  },

  async listarPedidosPorEmail(clienteEmail) {
    const { data, error } = await requireClient()
      .from('pedidos')
      .select('*')
      .eq('cliente_email', clienteEmail)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapPedido)
  },

  async listarPedidos() {
    const { data, error } = await requireClient().from('pedidos').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapPedido)
  },

  async obtenerPedido(id) {
    const { data, error } = await requireClient().from('pedidos').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapPedido(data) : undefined
  },

  async actualizarEstadoPedido(id, estado) {
    const { data, error } = await requireClient().from('pedidos').update({ estado }).eq('id', id).select('*').maybeSingle()
    if (error) throw error
    return data ? mapPedido(data) : undefined
  },

  async agregarNotaPedido(id, autor, texto) {
    const { data: actual, error: errorLectura } = await requireClient().from('pedidos').select('notas').eq('id', id).maybeSingle()
    if (errorLectura) throw errorLectura
    if (!actual) return undefined
    const nota: NotaPedidoRow = { id: `${id}-n${Date.now()}`, autor, texto: texto.trim(), fecha: new Date().toISOString() }
    const notas = [...((actual.notas as NotaPedidoRow[] | null) ?? []), nota]
    const { data, error } = await requireClient().from('pedidos').update({ notas }).eq('id', id).select('*').maybeSingle()
    if (error) throw error
    return data ? mapPedido(data) : undefined
  },
}
