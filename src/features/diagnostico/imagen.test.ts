import { describe, expect, it } from 'vitest'
import type { ClaseDano, MetricasImagen } from '@/domain/diagnostico/analizarPixeles'
import { clasesDeDiagnostico, clasesVisibles } from './imagen'

function foto(fracciones: Partial<Record<ClaseDano, number>>): MetricasImagen {
  return {
    ancho: 10,
    alto: 10,
    fracciones: { moho: 0, humedad: 0, grietas: 0, oxido: 0, descascarado: 0, ...fracciones },
    longitudGrietas: 0,
    juntasRectas: 0,
    crestas: 0,
    rugosidad: 0,
    mapa: new Uint8Array(100),
    brillo: 140,
    nitidez: 100,
  }
}

describe('clasesDeDiagnostico', () => {
  it('la humedad reclama las manchas de agua y también las oscuras', () => {
    const clases = clasesDeDiagnostico({ patologia: 'Humedad y filtración', hallazgos: [] })
    expect(clases).toEqual(expect.arrayContaining(['humedad', 'moho']))
    expect(clases).not.toContain('oxido')
  })

  it('suma lo demás que el diagnóstico encontró', () => {
    const clases = clasesDeDiagnostico({
      patologia: 'Óxido y corrosión',
      hallazgos: [
        { patologia: 'Óxido y corrosión', intensidad: 100 },
        { patologia: 'Pintura descascarada', intensidad: 70 },
      ],
    })
    expect(clases.sort()).toEqual(['descascarado', 'oxido'])
  })

  it('sin daños no reclama ninguna zona', () => {
    expect(clasesDeDiagnostico({ patologia: 'Sin daños evidentes', hallazgos: [] })).toEqual([])
  })
})

describe('clasesVisibles', () => {
  it('descarta lo que ocupa tan poco que es ruido del análisis', () => {
    expect(clasesVisibles(foto({ moho: 0.01, oxido: 0.04 }))).toEqual([])
    expect(clasesVisibles(foto({ moho: 0.03, oxido: 0.06 }))).toEqual(['moho', 'oxido'])
  })

  it('por defecto no muestra la textura fuerte, porque también la tienen la piedra y el ladrillo', () => {
    expect(clasesVisibles(foto({ descascarado: 0.9 }))).toEqual([])
  })

  it('con las zonas que reclama el diagnóstico, solo esas', () => {
    const m = foto({ moho: 0.1, oxido: 0.3, descascarado: 0.8 })
    expect(clasesVisibles(m, ['oxido', 'descascarado'])).toEqual(['oxido', 'descascarado'])
    expect(clasesVisibles(m, [])).toEqual([])
  })
})
