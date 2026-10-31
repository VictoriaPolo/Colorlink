import { NOMBRE_MARCA, marcaDeTarjeta, soloDigitos, ultimosCuatro, type MarcaTarjeta } from './tarjeta'
import type { EstadoPago, MetodoPago, Pago } from './tipos'

/**
 * Pasarela de pagos de práctica. No habla con ningún banco: decide el resultado
 * según la tarjeta de prueba o la opción que elija la persona, como los entornos
 * de prueba de las pasarelas reales. Por eso solo acepta tarjetas de prueba:
 * nadie debe escribir aquí los datos de una tarjeta de verdad.
 */

export type CodigoRechazo = 'rechazada' | 'sin-fondos' | 'cvv' | 'no-es-de-prueba' | 'cancelada' | 'vencida'

export type SalidaPasarela = { aprobado: true } | { aprobado: false; codigo: CodigoRechazo; motivo: string }

const MOTIVOS: Record<CodigoRechazo, string> = {
  rechazada: 'El banco emisor rechazó la tarjeta. Prueba con otra tarjeta o con otro medio de pago.',
  'sin-fondos': 'La tarjeta no tiene fondos suficientes para esta compra.',
  cvv: 'El código de seguridad no coincide con el de la tarjeta.',
  'no-es-de-prueba': 'Esta es una pasarela de práctica y no acepta tarjetas reales. Usa una de las tarjetas de prueba.',
  cancelada: 'Cancelaste el pago antes de terminarlo.',
  vencida: 'Se acabó el tiempo para aprobar el pago.',
}

const APROBADO: SalidaPasarela = { aprobado: true }
const rechazo = (codigo: CodigoRechazo): SalidaPasarela => ({ aprobado: false, codigo, motivo: MOTIVOS[codigo] })

export interface TarjetaDePrueba {
  numero: string
  marca: MarcaTarjeta
  resultado: 'aprobada' | Exclude<CodigoRechazo, 'no-es-de-prueba' | 'cancelada' | 'vencida'>
  descripcion: string
}

/** Las mismas que usan los entornos de prueba de las pasarelas conocidas. */
export const TARJETAS_DE_PRUEBA: TarjetaDePrueba[] = [
  { numero: '4242424242424242', marca: 'visa', resultado: 'aprobada', descripcion: 'Se aprueba' },
  { numero: '5555555555554444', marca: 'mastercard', resultado: 'aprobada', descripcion: 'Se aprueba' },
  { numero: '378282246310005', marca: 'amex', resultado: 'aprobada', descripcion: 'Se aprueba' },
  { numero: '4000000000000002', marca: 'visa', resultado: 'rechazada', descripcion: 'El banco la rechaza' },
  { numero: '4000000000009995', marca: 'visa', resultado: 'sin-fondos', descripcion: 'Fondos insuficientes' },
  { numero: '4000000000000127', marca: 'visa', resultado: 'cvv', descripcion: 'Código de seguridad incorrecto' },
]

export function pagarConTarjeta(numero: string): SalidaPasarela {
  const digitos = soloDigitos(numero)
  const prueba = TARJETAS_DE_PRUEBA.find((t) => t.numero === digitos)
  if (!prueba) return rechazo('no-es-de-prueba')
  return prueba.resultado === 'aprobada' ? APROBADO : rechazo(prueba.resultado)
}

export const BANCOS_PSE = [
  'Bancolombia',
  'Davivienda',
  'Banco de Bogotá',
  'BBVA Colombia',
  'Banco de Occidente',
  'Banco Popular',
  'Scotiabank Colpatria',
  'Banco Caja Social',
  'Banco AV Villas',
  'Itaú',
]

/** En PSE la persona termina el pago en la página de su banco: aquí, la autoriza o la cancela. */
export const pagarConPse = (decision: 'autorizar' | 'cancelar'): SalidaPasarela =>
  decision === 'autorizar' ? APROBADO : rechazo('cancelada')

/** En Nequi la persona aprueba el pago desde la app de su celular: aquí, lo aprueba, lo rechaza o lo deja vencer. */
export const pagarConNequi = (decision: 'aprobar' | 'rechazar' | 'vencer'): SalidaPasarela =>
  decision === 'aprobar' ? APROBADO : rechazo(decision === 'vencer' ? 'vencida' : 'cancelada')

/** Celular colombiano: 10 dígitos que empiezan por 3. */
export const celularValido = (texto: string) => /^3\d{9}$/.test(soloDigitos(texto))

/** "3001234567" → "300 123 4567". */
export function formatearCelular(texto: string): string {
  const d = soloDigitos(texto).slice(0, 10)
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(' ')
}

export const detalleTarjeta = (numero: string) => `${NOMBRE_MARCA[marcaDeTarjeta(numero)]} ···· ${ultimosCuatro(numero)}`
export const detallePse = (banco: string) => `PSE · ${banco}`
export const detalleNequi = (celular: string) => `Nequi ···· ${ultimosCuatro(celular)}`
export const DETALLE_EFECTIVO = 'Pagas al retirar en la tienda'

// Sin 0, O, 1 ni I: son las que se confunden cuando se dicta una referencia.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const azarSeguro = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32

function cadena(largo: number, azar: () => number): string {
  let texto = ''
  for (let i = 0; i < largo; i++) texto += ALFABETO[Math.floor(azar() * ALFABETO.length)]
  return texto
}

/** PAY-XXXXXXXX: la referencia que identifica un pago. */
export const referenciaPago = (azar = azarSeguro) => `PAY-${cadena(8, azar)}`

/** Seis caracteres que la persona muestra en la tienda para retirar el pedido. */
export const codigoRetiro = (azar = azarSeguro) => cadena(6, azar)

interface EntradaPago {
  metodo: MetodoPago
  monto: number
  detalle: string
  /** Lo que respondió la pasarela; el pago al retirar no pasa por ella. */
  salida?: SalidaPasarela
  ahora?: Date
  referencia?: string
}

/** El pago tal como se guarda: el pago al retirar queda pendiente hasta que la tienda lo cobre. */
export function construirPago({ metodo, monto, detalle, salida, ahora = new Date(), referencia }: EntradaPago): Pago {
  const estado: EstadoPago = metodo === 'efectivo' ? 'Pendiente' : salida?.aprobado ? 'Aprobado' : 'Rechazado'
  return {
    metodo,
    estado,
    referencia: referencia ?? referenciaPago(),
    monto,
    fecha: ahora.toISOString(),
    detalle,
    ...(salida && !salida.aprobado ? { motivo: salida.motivo } : {}),
  }
}

/** Cuánto tarda cada medio en "responder", para que se sienta como una pasarela real. */
export const DURACION_PAGO_MS: Record<MetodoPago, number> = { tarjeta: 2400, pse: 1500, nequi: 1300, efectivo: 900 }

export const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * El pago de un pedido. Los pedidos de antes de que existieran los pagos no lo
 * guardan: se leen como pago al retirar (cobrado cuando el pedido se entregó).
 */
export function pagoDe(pedido: { pago?: Pago; estado: string; total: number; fecha: string }): Pago {
  if (pedido.pago) return pedido.pago
  return {
    metodo: 'efectivo',
    estado: pedido.estado === 'Entregado' ? 'Aprobado' : 'Pendiente',
    referencia: '—',
    monto: pedido.total,
    fecha: pedido.fecha,
    detalle: DETALLE_EFECTIVO,
  }
}
