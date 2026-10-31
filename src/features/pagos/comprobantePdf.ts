import type { jsPDF } from 'jspdf'
import { COLOR, DocumentoPdf, type Rgb } from '@/shared/lib/pdf'
import { descargarArchivo } from '@/shared/lib/descarga'
import { fechaConHora, fechaLarga, formatoCOP } from '@/shared/lib/formato'
import { puntosDeRetiro } from '@/data/puntosDeRetiro'
import { NOMBRE_METODO, type EstadoPago } from '@/domain/pagos/tipos'
import { pagoDe } from '@/domain/pagos/pasarela'
import { calcularTotales } from '@/domain/pagos/totales'
import type { Pedido } from '@/domain/tienda/types'
import { ETAPAS_PEDIDO, etapaDePedido } from './estadoPedido'

const ETIQUETA_PAGO: Record<EstadoPago, { texto: string; fondo: Rgb; color: Rgb }> = {
  Aprobado: { texto: 'Pago aprobado', fondo: COLOR.exitoFondo, color: COLOR.exito },
  Pendiente: { texto: 'Pagas al retirar', fondo: COLOR.alertaFondo, color: COLOR.alerta },
  Rechazado: { texto: 'Pago rechazado', fondo: COLOR.peligroFondo, color: COLOR.peligro },
  Reembolsado: { texto: 'Reembolsado', fondo: COLOR.fondo, color: COLOR.texto },
}

/** El comprobante de un pedido en PDF: dónde va, el código para retirarlo, qué se compró y cómo se pagó. */
export async function construirComprobantePdf(pedido: Pedido, { comprimir = true }: { comprimir?: boolean } = {}): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf')
  const pago = pagoDe(pedido)
  const subtotal = pedido.items.reduce((suma, i) => suma + i.precioUnitario * i.cantidad, 0)
  const totales = calcularTotales(pedido.items, pedido.descuento ?? 0)
  const punto = pedido.puntoRetiro ? puntosDeRetiro.find((p) => p.nombre === pedido.puntoRetiro) : undefined
  const cancelado = pedido.estado === 'Cancelado'

  const pdf = new DocumentoPdf(jsPDF, {
    titulo: `Comprobante del pedido ${pedido.id}`,
    asunto: 'Comprobante de pedido y de pago',
    pie: ['COLORLINK · Distribuidor oficial Pintuco', 'Comprobante de práctica: no es una factura y no se cobró dinero real.'],
    comprimir,
  })

  pdf.encabezado(pedido.id, `Pedido del ${fechaLarga(pedido.fecha)}`)
  pdf.titulo('Comprobante de pedido', ETIQUETA_PAGO[pago.estado])
  pdf.parrafo(`${pedido.clienteNombre}${pedido.clienteEmail ? ` · ${pedido.clienteEmail}` : ''}`, { despues: 0 })

  pdf.seccion('Dónde va tu pedido')
  if (cancelado) {
    pdf.aviso(['Este pedido fue cancelado. Si ya habías pagado, el reembolso lo gestiona la tienda.'], { tono: 'alerta' })
  } else {
    pdf.etapas(ETAPAS_PEDIDO.map((e) => (e === 'Listo para retiro' ? 'Listo para retirar' : e)), etapaDePedido(pedido.estado))
  }
  if (pedido.historial && pedido.historial.length > 0) {
    pdf.filas(pedido.historial.map((h) => ({ etiqueta: h.estado, valor: fechaConHora(h.fecha) })), 3)
  }

  if (!cancelado && pedido.codigoRetiro) {
    pdf.seccion('Retiro en tienda')
    pdf.codigo(pedido.codigoRetiro, 'Tu código de retiro', 'Muéstralo en la tienda junto con tu documento.')
    pdf.filas([
      { etiqueta: 'Tienda', valor: punto ? punto.nombre : (pedido.puntoRetiro ?? 'Sin definir') },
      { etiqueta: 'Dirección', valor: punto ? `${punto.direccion} · ${punto.ciudad}` : '' },
      { etiqueta: 'Horario', valor: punto?.horario ?? '' },
    ], 1)
  }

  pdf.seccion('Productos')
  for (const item of pedido.items) {
    pdf.renglon(`${item.cantidad} × ${item.nombre}`, formatoCOP.format(item.precioUnitario * item.cantidad), { color: COLOR.navy })
  }
  pdf.separador()
  pdf.renglon('Subtotal', formatoCOP.format(subtotal))
  if (pedido.descuento) pdf.renglon(`Descuento${pedido.cupon ? ` (cupón ${pedido.cupon})` : ''}`, `- ${formatoCOP.format(pedido.descuento)}`, { color: COLOR.exito })
  pdf.renglon('Incluye IVA (19%)', formatoCOP.format(totales.ivaIncluido), { tam: 8.5, color: COLOR.tenue })
  pdf.espacio(1)
  pdf.renglon('Total', formatoCOP.format(pedido.total), { tam: 13, estilo: 'bold', color: COLOR.navy })

  pdf.seccion('Pago')
  pdf.filas([
    { etiqueta: 'Medio de pago', valor: NOMBRE_METODO[pago.metodo] },
    { etiqueta: 'Detalle', valor: pago.detalle },
    { etiqueta: 'Referencia', valor: pago.referencia },
    { etiqueta: 'Estado', valor: ETIQUETA_PAGO[pago.estado].texto },
    { etiqueta: 'Monto', valor: formatoCOP.format(pago.monto) },
    { etiqueta: pago.estado === 'Pendiente' ? 'Pedido registrado' : 'Fecha del pago', valor: fechaConHora(pago.fecha) },
  ])

  return pdf.cerrar()
}

export async function descargarComprobantePdf(pedido: Pedido): Promise<void> {
  const pdf = await construirComprobantePdf(pedido)
  descargarArchivo(pdf.output('blob'), `colorlink-${pedido.id}.pdf`)
}

