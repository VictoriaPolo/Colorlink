import { describe, it, expect } from 'vitest'
import type { jsPDF } from 'jspdf'
import { solicitudesIniciales } from '@/data/solicitudesSemilla'
import { construirResumenPdf } from './resumenPdf'

/** El PDF sin comprimir, leído byte a byte (Latin-1) para buscar su texto. */
const leer = (doc: jsPDF) => new TextDecoder('latin1').decode(doc.output('arraybuffer'))

const PNG_UN_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const conDiagnostico = solicitudesIniciales.find((s) => s.diagnostico)!

describe('construirResumenPdf', () => {
  it('genera un PDF con los datos de cada solicitud de ejemplo', async () => {
    for (const s of solicitudesIniciales) {
      const texto = leer(await construirResumenPdf(s, { comprimir: false }))
      expect(texto.startsWith('%PDF-')).toBe(true)
      expect(texto).toContain(s.id)
      expect(texto).toContain('Resumen de solicitud')
      expect(texto).toContain('Cliente y proyecto')
      expect(texto).toContain('Solución recomendada')
      expect(texto).toContain('Estado de tu solicitud')
    }
  })

  it('con diagnóstico, lo incluye: problema, confianza, hallazgos y tratamiento', async () => {
    const solicitud = solicitudesIniciales.find((s) => s.diagnostico && s.diagnostico.hallazgos.length > 0 && s.diagnostico.tratamiento.pasos.length > 0)!
    const d = solicitud.diagnostico!
    const texto = leer(await construirResumenPdf(solicitud, { comprimir: false }))
    expect(texto).toContain('Diagnóstico por imagen')
    expect(texto).toContain(`Confianza del análisis ${d.confianza}%`)
    expect(texto).toContain('LO QUE ENCONTRÓ EL ANÁLISIS')
    expect(texto).toContain('Tratamiento recomendado')
    expect(texto).toContain('PASO A PASO')
  })

  it('sin diagnóstico, esa sección no aparece', async () => {
    const sin = { ...conDiagnostico, diagnostico: undefined }
    const texto = leer(await construirResumenPdf(sin, { comprimir: false }))
    expect(texto).not.toContain('Diagnóstico por imagen')
    expect(texto).toContain('Cliente y proyecto')
  })

  it('las fotos van dentro del PDF', async () => {
    const foto = { dataUrl: PNG_UN_PIXEL, ancho: 4, alto: 3, nombre: 'pared.png', formato: 'PNG' as const }
    const texto = leer(await construirResumenPdf(conDiagnostico, { fotos: [foto], comprimir: false }))
    expect(texto).toContain('/Subtype /Image')
    expect(texto).toContain('pared.png')
  })

  it('una solicitud con textos larguísimos sigue en otra hoja y no se corta', async () => {
    const larga = {
      ...conDiagnostico,
      data: { ...conDiagnostico.data, evidencia: { ...conDiagnostico.data.evidencia, descripcion: 'Humedad que sube por el muro de la sala. '.repeat(120) } },
    }
    const doc = await construirResumenPdf(larga, { comprimir: false })
    expect(doc.getNumberOfPages()).toBeGreaterThan(1)
    expect(leer(doc)).toContain(`Página 2 de ${doc.getNumberOfPages()}`)
  })

  it('no falla con símbolos que una fuente estándar no tiene', async () => {
    const raro = { ...conDiagnostico, data: { ...conDiagnostico.data, proyecto: { ...conDiagnostico.data.proyecto, ciudad: 'Bogotá → “centro” 👋' } } }
    const texto = leer(await construirResumenPdf(raro, { comprimir: false }))
    expect(texto).toContain('Bogotá -> "centro"')
  })
})
