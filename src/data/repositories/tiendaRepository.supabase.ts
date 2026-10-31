import type { CategoriaProducto, ItemCarrito, Kit, Pedido, PatologiaKit, Producto } from '@/domain/tienda/types'
import type { Pago } from '@/domain/pagos/tipos'
import { codigoRetiro, pagoDe, referenciaPago } from '@/domain/pagos/pasarela'
import { supabase } from '@/data/supabaseClient'
import type { ExtrasPedido, TiendaRepository } from './tiendaRepository.types'

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
  /** Las cuatro siguientes las agrega supabase/schema_pagos.sql. */
  pago?: Pago | null
  cupon?: string | null
  descuento?: number | null
  codigo_retiro?: string | null
  historial?: { estado: string; fecha: string }[] | null
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
    cupon: row.cupon ?? undefined,
    descuento: row.descuento || undefined,
    pago: row.pago ?? undefined,
    codigoRetiro: row.codigo_retiro ?? undefined,
    historial: row.historial ?? undefined,
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

  async crearPedido(
    items: ItemCarrito[],
    clienteNombre: string,
    clienteEmail: string,
    puntoRetiro?: string,
    extras?: ExtrasPedido,
  ): Promise<Pedido> {
    const subtotal = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0)
    const descuento = Math.min(Math.max(0, extras?.descuento ?? 0), subtotal)
    const total = subtotal - descuento
    const codigo = extras?.codigoRetiro ?? codigoRetiro()
    const base = {
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
    }
    const conPago = {
      ...base,
      pago: extras?.pago ?? null,
      cupon: descuento > 0 ? (extras?.cupon ?? null) : null,
      descuento,
      codigo_retiro: codigo,
      historial: [{ estado: 'Recibido', fecha: new Date().toISOString() }],
    }
    let respuesta = await requireClient().from('pedidos').insert(conPago).select('id, created_at').single()
    // Si todavía no se corrió supabase/schema_pagos.sql, el pedido se guarda igual, sin los datos del pago.
    if (respuesta.error && /pago|cupon|descuento|codigo_retiro|historial|schema cache/i.test(respuesta.error.message)) {
      respuesta = await requireClient().from('pedidos').insert(base).select('id, created_at').single()
    }
    if (respuesta.error) throw respuesta.error
    const data = respuesta.data

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
      ...(descuento > 0 ? { cupon: extras?.cupon, descuento } : {}),
      pago: extras?.pago,
      codigoRetiro: codigo,
      historial: [{ estado: 'Recibido', fecha: new Date().toISOString() }],
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
    const actual = await tiendaRepositorySupabase.obtenerPedido(id)
    if (!actual) return undefined
    const previo = actual.historial ?? []
    const historial = previo.at(-1)?.estado === estado ? previo : [...previo, { estado, fecha: new Date().toISOString() }]
    let respuesta = await requireClient().from('pedidos').update({ estado, historial }).eq('id', id).select('*').maybeSingle()
    // Si todavía no se corrió supabase/schema_pagos.sql, el estado cambia igual, sin el historial.
    if (respuesta.error && /historial|schema cache/i.test(respuesta.error.message)) {
      respuesta = await requireClient().from('pedidos').update({ estado }).eq('id', id).select('*').maybeSingle()
    }
    if (respuesta.error) throw respuesta.error
    return respuesta.data ? mapPedido(respuesta.data) : undefined
  },

  async actualizarPagoPedido(id, estado) {
    const actual = await tiendaRepositorySupabase.obtenerPedido(id)
    if (!actual) return undefined
    const pago = pagoDe(actual)
    const referencia = pago.referencia === '—' ? referenciaPago() : pago.referencia
    const nuevo: Pago = { ...pago, estado, referencia, fecha: new Date().toISOString() }
    const { data, error } = await requireClient().from('pedidos').update({ pago: nuevo }).eq('id', id).select('*').maybeSingle()
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
