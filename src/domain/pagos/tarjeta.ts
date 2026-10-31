/** Datos de una tarjeta: formato, validación y marca. Todo puro, sin red ni almacenamiento. */

export type MarcaTarjeta = 'visa' | 'mastercard' | 'amex' | 'diners' | 'desconocida'

export const NOMBRE_MARCA: Record<MarcaTarjeta, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  diners: 'Diners Club',
  desconocida: 'Tarjeta',
}

export const soloDigitos = (texto: string) => texto.replace(/\D/g, '')

/** Algoritmo de Luhn: detecta los errores de digitación más comunes del número. */
export function luhnValido(numero: string): boolean {
  const digitos = soloDigitos(numero)
  if (digitos.length < 12) return false
  let suma = 0
  for (let i = 0; i < digitos.length; i++) {
    let digito = Number(digitos[digitos.length - 1 - i])
    if (i % 2 === 1) {
      digito *= 2
      if (digito > 9) digito -= 9
    }
    suma += digito
  }
  return suma % 10 === 0
}

export function marcaDeTarjeta(numero: string): MarcaTarjeta {
  const digitos = soloDigitos(numero)
  if (/^4/.test(digitos)) return 'visa'
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digitos)) return 'mastercard'
  if (/^3[47]/.test(digitos)) return 'amex'
  if (/^3(0[0-5]|[68])/.test(digitos)) return 'diners'
  return 'desconocida'
}

/** Agrupa los dígitos como en la tarjeta: 4-4-4-4, y 4-6-5 en American Express. */
export function formatearNumero(texto: string): string {
  const digitos = soloDigitos(texto)
  const marca = marcaDeTarjeta(digitos)
  const largo = marca === 'amex' ? 15 : marca === 'diners' ? 14 : 16
  const grupos = marca === 'amex' ? [4, 6, 5] : marca === 'diners' ? [4, 6, 4] : [4, 4, 4, 4]
  const corto = digitos.slice(0, largo)
  const partes: string[] = []
  let desde = 0
  for (const grupo of grupos) {
    if (desde >= corto.length) break
    partes.push(corto.slice(desde, desde + grupo))
    desde += grupo
  }
  return partes.join(' ')
}

/** "1" → "1", "3" → "03", "122" → "12/2", "1226" → "12/26". */
export function formatearVencimiento(texto: string): string {
  let digitos = soloDigitos(texto).slice(0, 4)
  if (digitos.length === 1 && digitos > '1') digitos = `0${digitos}`
  return digitos.length <= 2 ? digitos : `${digitos.slice(0, 2)}/${digitos.slice(2)}`
}

export type EstadoVencimiento = 'ok' | 'formato' | 'vencida'

/** La tarjeta sirve hasta el final del mes que dice (MM/AA). */
export function estadoVencimiento(texto: string, hoy = new Date()): EstadoVencimiento {
  const m = /^(\d{2})\/(\d{2})$/.exec(texto)
  if (!m) return 'formato'
  const mes = Number(m[1])
  const anio = 2000 + Number(m[2])
  if (mes < 1 || mes > 12 || anio > hoy.getFullYear() + 20) return 'formato'
  return anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1) ? 'vencida' : 'ok'
}

export const longitudCvv = (marca: MarcaTarjeta) => (marca === 'amex' ? 4 : 3)

/** "···· 4242": lo único del número que se guarda y se muestra. */
export const ultimosCuatro = (numero: string) => soloDigitos(numero).slice(-4)

export interface DatosTarjeta {
  numero: string
  titular: string
  vencimiento: string
  cvv: string
}

export type ErroresTarjeta = Partial<Record<keyof DatosTarjeta, string>>

/** Errores de digitación (no de la pasarela): campo por campo, con el mensaje para la persona. */
export function validarTarjeta(d: DatosTarjeta, hoy = new Date()): ErroresTarjeta {
  const errores: ErroresTarjeta = {}
  if (!soloDigitos(d.numero)) errores.numero = 'Escribe el número de la tarjeta.'
  else if (!luhnValido(d.numero)) errores.numero = 'El número no es válido: revísalo.'

  if (d.titular.trim().length < 3) errores.titular = 'Escribe el nombre como aparece en la tarjeta.'

  const vencimiento = estadoVencimiento(d.vencimiento, hoy)
  if (vencimiento === 'formato') errores.vencimiento = 'Usa el formato MM/AA.'
  else if (vencimiento === 'vencida') errores.vencimiento = 'La tarjeta está vencida.'

  const largo = longitudCvv(marcaDeTarjeta(d.numero))
  if (soloDigitos(d.cvv).length !== largo) errores.cvv = `El código tiene ${largo} dígitos.`
  return errores
}
