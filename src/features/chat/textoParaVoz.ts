/**
 * Prepara lo que Coli escribe para leerlo en voz alta: cifras, siglas y horas
 * dichas como las diría una persona, y frases cortas con su pausa. Un motor de
 * voz lee "$ 89.900" como "89 punto 900" y "PED-1006" como "ped guion mil seis":
 * eso, más que la voz, es lo que hace sonar robótico a un asistente.
 */

const UNIDADES = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
  'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno',
  'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
]
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** De 1 a 999. */
function menorDeMil(n: number): string {
  if (n === 100) return 'cien'
  const centenas = Math.floor(n / 100)
  const resto = n % 100
  const partes = centenas ? [CENTENAS[centenas]] : []
  if (resto < 30) {
    if (resto) partes.push(UNIDADES[resto])
  } else {
    const unidad = resto % 10
    partes.push(unidad ? `${DECENAS[Math.floor(resto / 10)]} y ${UNIDADES[unidad]}` : DECENAS[Math.floor(resto / 10)])
  }
  return partes.join(' ')
}

/** "uno" pierde la o delante de un sustantivo: un mil, veintiún mil, treinta y un pesos. */
const apocopar = (s: string) => s.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un')

/** Cantidad con letras, lista para ir delante de un sustantivo ("pesos", "mil"). Hasta 999 999 999. */
export function numeroALetras(n: number): string {
  if (n === 0) return 'cero'
  const millones = Math.floor(n / 1e6)
  const miles = Math.floor((n % 1e6) / 1e3)
  const resto = n % 1e3
  const partes: string[] = []
  if (millones) partes.push(millones === 1 ? 'un millón' : `${apocopar(menorDeMil(millones))} millones`)
  if (miles) partes.push(miles === 1 ? 'mil' : `${apocopar(menorDeMil(miles))} mil`)
  if (resto) partes.push(apocopar(menorDeMil(resto)))
  return partes.join(' ')
}

function pesosEnLetras(cifra: string): string {
  const n = Number(cifra.replace(/\./g, ''))
  if (!Number.isSafeInteger(n) || n >= 1e9) return `${cifra} pesos`
  // "dos millones de pesos", pero "dos millones quinientos mil pesos".
  return `${numeroALetras(n)}${n >= 1e6 && n % 1e6 === 0 ? ' de' : ''} pesos`
}

function horaEnLetras(hora: string, minutos: string, tarde: boolean): string {
  const h = Number(hora)
  const momento = !tarde ? 'de la mañana' : h === 12 ? 'del mediodía' : h < 7 ? 'de la tarde' : 'de la noche'
  return `${h}${minutos === '00' ? '' : ` y ${Number(minutos)}`} ${momento}`
}

const horaDicha = (_: string, h: string, min: string, ap: string) => horaEnLetras(h, min, ap.toLowerCase() === 'p')

const capitalizar = (palabra: string) => palabra[0] + palabra.slice(1).toLowerCase()

/** El texto del chat, dicho en voz alta tal como lo diría una persona. */
export function textoParaVoz(texto: string): string {
  return (
    texto
      .replace(/\p{Extended_Pictographic}|️/gu, '')
      .replace(/[*_`#>~"“”«»]+/g, '')
      // "producto(s)" se dice "productos", no "producto, s".
      .replace(/(\p{L})\((s|es)\)/gu, '$1$2')
      // El código de retiro y los números de tarjeta se dictan carácter por carácter: "Visa ···· 4242" → "Visa terminada en 4 2 4 2".
      .replace(/(c[oó]digo de retiro:?\s+)([A-Z0-9]{6})\b/g, (_, antes: string, codigo: string) => antes + [...codigo].join(' '))
      .replace(/\s*·{3,}\s*(\d{4})\b/g, (_, ultimos: string) => ` terminada en ${[...ultimos].join(' ')}`)
      .replace(/\b\d{4}(?: \d{4}){3}\b/g, (numero: string) => numero.split(' ').map((grupo) => [...grupo].join(' ')).join(', '))
      // Códigos: "PED-1006" → "P E D 1006" (letra por letra, como se dictan).
      .replace(/\b([A-Z]{2,4})-(\d+)\b/g, (_, letras: string, numero: string) => `${[...letras].join(' ')} ${numero}`)
      .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (fecha, anio: string, mes: string, dia: string) =>
        MESES[Number(mes) - 1] ? `${Number(dia)} de ${MESES[Number(mes) - 1]} de ${anio}` : fecha,
      )
      .replace(/\$\s*(\d{1,3}(?:\.\d{3})+|\d+)/g, (_, cifra: string) => pesosEnLetras(cifra))
      // El punto de "p. m." también cerraba la frase: si sigue otra (o es el final), se lo devuelve.
      .replace(/(\d{1,2}):(\d{2})\s*([apAP])\.\s?[mM]\.(?=\s+\p{Lu}|\s*$)/gu, (m: string, h: string, min: string, ap: string) => `${horaDicha(m, h, min, ap)}.`)
      .replace(/(\d{1,2}):(\d{2})\s*([apAP])\.\s?[mM]\./gu, horaDicha)
      .replace(/(\d+(?:[.,]\d+)?)\s*%/g, '$1 por ciento')
      .replace(/m²|\bm2\b/g, 'metros cuadrados')
      // Que no deletree la marca ni los nombres escritos en mayúsculas.
      .replace(/COLORLINK/g, 'Color link')
      .replace(/(^|[^\p{L}])(\p{Lu}{4,})(?![\p{L}])/gu, (_, antes: string, palabra: string) => antes + capitalizar(palabra))
      // La puntuación decide dónde respira la voz.
      .replace(/\s*[—–·]\s*/g, ', ')
      .replace(/\s*→\s*/g, ' ')
      .replace(/\s*[()]\s*/g, ', ')
      .replace(/,(\s*,)+/g, ',')
      .replace(/,\s*([.!?:;])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/** Un motor de voz corta o se equivoca con frases muy largas: ~12 segundos es lo máximo seguro. */
const MAX_FRASE = 180
const MIN_FRASE = 28

/** Parte una frase larga en la coma, el punto y coma o los dos puntos más cercanos al límite. */
function partirLarga(frase: string): string[] {
  const trozos: string[] = []
  let resto = frase
  while (resto.length > MAX_FRASE) {
    const ventana = resto.slice(0, MAX_FRASE)
    const corte = Math.max(ventana.lastIndexOf(', '), ventana.lastIndexOf('; '), ventana.lastIndexOf(': '))
    const donde = corte > MIN_FRASE ? corte + 1 : ventana.lastIndexOf(' ')
    trozos.push(resto.slice(0, donde > 0 ? donde : MAX_FRASE).trim())
    resto = resto.slice(donde > 0 ? donde : MAX_FRASE).trim()
  }
  if (resto) trozos.push(resto)
  return trozos
}

/** Frases para leer una a una: cada punto es una pausa natural, y las muy cortas se unen a la siguiente. */
export function dividirEnFrases(texto: string): string[] {
  const crudas = texto.match(/\S[\s\S]*?(?:[.!?…]+(?=\s|$)|$)/g) ?? []
  const frases: string[] = []
  let pendiente = ''
  for (const cruda of crudas.flatMap((c) => partirLarga(c.trim()))) {
    const union = pendiente ? `${pendiente} ${cruda}` : cruda
    if (union.length < MIN_FRASE) pendiente = union
    else {
      frases.push(union)
      pendiente = ''
    }
  }
  if (pendiente) frases.push(pendiente)
  return frases
}

/** Una respuesta larga se dice entera solo si cabe: lo demás queda escrito. */
export function limitarFrases(frases: string[], maxFrases = 4, maxCaracteres = 380): { frases: string[]; recortado: boolean } {
  const elegidas: string[] = []
  let largo = 0
  for (const frase of frases) {
    if (elegidas.length >= maxFrases || (elegidas.length > 0 && largo + frase.length > maxCaracteres)) break
    elegidas.push(frase)
    largo += frase.length
  }
  return { frases: elegidas, recortado: elegidas.length < frases.length }
}
