import { describe, it, expect } from 'vitest'
import { dividirEnFrases, limitarFrases, numeroALetras, textoParaVoz } from './textoParaVoz'

describe('numeroALetras', () => {
  it.each([
    [0, 'cero'],
    [1, 'un'],
    [15, 'quince'],
    [21, 'veintiún'],
    [100, 'cien'],
    [101, 'ciento un'],
    [1000, 'mil'],
    [1001, 'mil un'],
    [21_000, 'veintiún mil'],
    [89_900, 'ochenta y nueve mil novecientos'],
    [1_250_000, 'un millón doscientos cincuenta mil'],
    [2_000_000, 'dos millones'],
    [999_999_999, 'novecientos noventa y nueve millones novecientos noventa y nueve mil novecientos noventa y nueve'],
  ])('%i se dice "%s"', (n, letras) => {
    expect(numeroALetras(n)).toBe(letras)
  })
})

describe('textoParaVoz', () => {
  it('dice los precios en pesos y con letras, con o sin espacio tras el signo', () => {
    expect(textoParaVoz('Cuesta $ 89.900 el galón')).toBe('Cuesta ochenta y nueve mil novecientos pesos el galón')
    expect(textoParaVoz('Cuesta $89.900.')).toBe('Cuesta ochenta y nueve mil novecientos pesos.')
    expect(textoParaVoz('$1.500.000')).toBe('un millón quinientos mil pesos')
    expect(textoParaVoz('$2.000.000')).toBe('dos millones de pesos')
    expect(textoParaVoz('$45')).toBe('cuarenta y cinco pesos')
  })

  it('dice las unidades, los porcentajes y las horas como una persona', () => {
    expect(textoParaVoz('rinde 30 m² por galón')).toBe('rinde 30 metros cuadrados por galón')
    expect(textoParaVoz('hasta 15% de descuento')).toBe('hasta 15 por ciento de descuento')
    expect(textoParaVoz('de 8:00 a. m. a 6:00 p. m. todos los días')).toBe('de 8 de la mañana a 6 de la tarde todos los días')
    expect(textoParaVoz('cierran a las 7:30 p. m.')).toBe('cierran a las 7 y 30 de la noche.')
  })

  it('el punto de "p. m." sigue cerrando la frase cuando viene otra después', () => {
    expect(textoParaVoz('de 8:00 a. m. a 6:00 p. m. Revisa el horario')).toBe('de 8 de la mañana a 6 de la tarde. Revisa el horario')
    expect(textoParaVoz('abren a las 8:00 a. m. y cierran a las 6:00 p. m.')).toBe('abren a las 8 de la mañana y cierran a las 6 de la tarde.')
  })

  it('dice "productos" y no deletrea la s de "producto(s)"', () => {
    expect(textoParaVoz('2 producto(s) por un total')).toBe('2 productos por un total')
    expect(textoParaVoz('varias opcion(es) y un ejemplo (nota)')).toBe('varias opciones y un ejemplo, nota,')
  })

  it('deletrea los códigos y dice las fechas completas', () => {
    expect(textoParaVoz('Tu pedido PED-1006 salió el 2026-10-29')).toBe('Tu pedido P E D 1006 salió el 29 de octubre de 2026')
    expect(textoParaVoz('Tu solicitud CL-1002')).toBe('Tu solicitud C L 1002')
  })

  it('no deletrea la marca ni los nombres en mayúsculas', () => {
    expect(textoParaVoz('Buenos días, LAURA. Soy Coli, el asistente de COLORLINK.')).toBe(
      'Buenos días, Laura. Soy Coli, el asistente de Color link.',
    )
    expect(textoParaVoz('Habla ÁLVARO')).toBe('Habla Álvaro')
  })

  it('quita emojis, comillas y símbolos, y convierte los paréntesis en pausas', () => {
    expect(textoParaVoz('Hola 👋 está "En preparación" → listo')).toBe('Hola está En preparación listo')
    expect(textoParaVoz('el galón (cuñete de 5 galones: $ 400.000) y rinde')).toBe(
      'el galón, cuñete de 5 galones: cuatrocientos mil pesos, y rinde',
    )
  })
})

describe('dividirEnFrases', () => {
  it('lee frase por frase y no corta los decimales', () => {
    expect(dividirEnFrases('Tu pedido P E D 1006 está en preparación. Queda listo para retirar en tu tienda dos horas después.')).toEqual([
      'Tu pedido P E D 1006 está en preparación.',
      'Queda listo para retirar en tu tienda dos horas después.',
    ])
    expect(dividirEnFrases('El rendimiento es 4.5 metros por galón. Listo.')).toEqual(['El rendimiento es 4.5 metros por galón.', 'Listo.'])
  })

  it('une las frases muy cortas con la siguiente', () => {
    expect(dividirEnFrases('Hola. ¿Cómo estás? Muy bien, gracias por preguntar.')).toEqual([
      'Hola. ¿Cómo estás? Muy bien, gracias por preguntar.',
    ])
  })

  it('parte las frases largas en una coma, sin perder nada', () => {
    const larga = `${Array.from({ length: 12 }, (_, i) => `la parte número ${i + 1} del proceso`).join(', ')}.`
    const frases = dividirEnFrases(larga)
    expect(frases.length).toBeGreaterThan(1)
    expect(frases.every((f) => f.length <= 180)).toBe(true)
    expect(frases.join(' ')).toBe(larga)
  })

  it('un texto vacío no da frases', () => {
    expect(dividirEnFrases('')).toEqual([])
    expect(dividirEnFrases('   ')).toEqual([])
  })
})

describe('limitarFrases', () => {
  const frase = (n: number) => `Esta es la frase número ${n} de la respuesta de Coli.`

  it('deja pasar lo corto', () => {
    expect(limitarFrases([frase(1), frase(2)])).toEqual({ frases: [frase(1), frase(2)], recortado: false })
  })

  it('corta a las 4 frases y avisa que se recortó', () => {
    const seis = [1, 2, 3, 4, 5, 6].map(frase)
    expect(limitarFrases(seis)).toEqual({ frases: seis.slice(0, 4), recortado: true })
  })

  it('corta por largo, pero siempre dice al menos la primera', () => {
    const larga = 'x'.repeat(170)
    expect(limitarFrases([larga, larga, larga]).frases).toHaveLength(2)
    expect(limitarFrases(['y'.repeat(500), 'corta']).frases).toEqual(['y'.repeat(500)])
    expect(limitarFrases([])).toEqual({ frases: [], recortado: false })
  })
})
