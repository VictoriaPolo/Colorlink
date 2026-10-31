import { describe, it, expect } from 'vitest'
import type { jsPDF } from 'jspdf'
import { COLOR, DocumentoPdf, hexARgb, textoPdf } from './pdf'

/** El PDF sin comprimir, leído byte a byte (Latin-1) para buscar su texto. */
const leer = (doc: jsPDF) => new TextDecoder('latin1').decode(doc.output('arraybuffer'))

// Un PNG de 1×1 píxel: lo mínimo para probar que una foto entra al documento.
const PNG_UN_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

async function nuevo() {
  const { jsPDF: JsPDF } = await import('jspdf')
  return new DocumentoPdf(JsPDF, { titulo: 'Prueba', asunto: 'Prueba', pie: ['COLORLINK · Distribuidor oficial Pintuco'], comprimir: false })
}

describe('textoPdf', () => {
  it('cambia lo que una fuente estándar no puede mostrar y conserva las tildes y la ñ', () => {
    expect(textoPdf('Solución — “lista” → 22 m² · ≥ 5…')).toBe('Solución - "lista" -> 22 m² · >= 5...')
    expect(textoPdf('ñandú ¿qué?')).toBe('ñandú ¿qué?')
    expect(textoPdf('a b')).toBe('a b')
    expect(textoPdf('Hola 👋 mundo')).toBe('Hola  mundo')
  })
})

describe('hexARgb', () => {
  it('convierte un color hexadecimal', () => {
    expect(hexARgb('#004f9f')).toEqual([0, 79, 159])
    expect(hexARgb('FFD100')).toEqual([255, 209, 0])
  })
})

describe('DocumentoPdf', () => {
  it('arma la primera hoja con la marca, el título y los datos, con sus tildes', async () => {
    const pdf = await nuevo()
    pdf.encabezado('CL-1001', 'Generado el 31 de octubre de 2026')
    pdf.titulo('Resumen de solicitud', { texto: 'Recibida', fondo: COLOR.fondo, color: COLOR.primario })
    pdf.seccion('Cliente y proyecto')
    pdf.filas([
      { etiqueta: 'Cliente', valor: 'Ana Gómez' },
      { etiqueta: 'Ciudad', valor: 'Medellín' },
    ])
    const texto = leer(pdf.cerrar())

    expect(texto.startsWith('%PDF-')).toBe(true)
    for (const fragmento of ['COLOR', 'LINK', 'CL-1001', 'Resumen de solicitud', 'Ana Gómez', 'Medellín', 'COLORLINK']) {
      expect(texto).toContain(fragmento)
    }
  })

  it('pasa a otra hoja cuando no cabe y numera todas', async () => {
    const pdf = await nuevo()
    pdf.encabezado('CL-1', 'hoy')
    for (let i = 0; i < 70; i++) pdf.parrafo(`Párrafo número ${i + 1} con texto suficiente para ocupar una línea completa o dos de la hoja.`)
    const doc = pdf.cerrar()
    const paginas = doc.getNumberOfPages()
    expect(paginas).toBeGreaterThan(1)
    const texto = leer(doc)
    expect(texto).toContain(`Página 1 de ${paginas}`)
    expect(texto).toContain(`Página ${paginas} de ${paginas}`)
  })

  it('las listas, barras, avisos y etapas se dibujan sin fallar, aunque el texto sea larguísimo', async () => {
    const pdf = await nuevo()
    pdf.encabezado('CL-1', 'hoy')
    pdf.lista(['Primero', 'Segundo ' + 'palabra '.repeat(80)], { numerada: true })
    pdf.lista(['Una viñeta'])
    pdf.barra('Moho y hongos', 72, COLOR.peligro)
    pdf.barra('Sin intensidad', 0, COLOR.primario)
    pdf.aviso(['Cuidado con la humedad.', 'Otra advertencia ' + 'larga '.repeat(60)], { titulo: 'Ten en cuenta' })
    pdf.etapas(['Necesidad', 'Solución técnica', 'Abastecimiento', 'Servicio', 'Calidad'], 2)
    const texto = leer(pdf.cerrar())
    expect(texto).toContain('Ten en cuenta')
    expect(texto).toContain('Moho y hongos')
    expect(texto).toContain('72%')
  })

  it('incluye las fotos como imágenes, con su leyenda', async () => {
    const pdf = await nuevo()
    pdf.encabezado('CL-1', 'hoy')
    pdf.fotos([
      { dataUrl: PNG_UN_PIXEL, ancho: 4, alto: 3, nombre: 'pared.png', formato: 'PNG', leyenda: [{ color: COLOR.peligro, texto: 'Manchas oscuras' }] },
      { dataUrl: PNG_UN_PIXEL, ancho: 3, alto: 4, nombre: 'techo.png', formato: 'PNG' },
      { dataUrl: PNG_UN_PIXEL, ancho: 1, alto: 1, nombre: 'otra.png', formato: 'PNG' },
    ])
    const texto = leer(pdf.cerrar())
    expect(texto).toContain('/Subtype /Image')
    expect(texto).toContain('pared.png')
    expect(texto).toContain('Manchas oscuras')
  })
})
