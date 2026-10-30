import { describe, expect, it } from 'vitest'
import { diagnosticar, type EntradaDiagnostico } from './diagnosticar'
import type { ClaseDano, MetricasImagen } from './analizarPixeles'

function foto(parcial: Partial<Omit<MetricasImagen, 'fracciones'>> & { fracciones?: Partial<Record<ClaseDano, number>> } = {}): MetricasImagen {
  const { fracciones, ...resto } = parcial
  return {
    ancho: 320,
    alto: 240,
    fracciones: { moho: 0, humedad: 0, grietas: 0, oxido: 0, descascarado: 0, ...fracciones },
    longitudGrietas: 0,
    juntasRectas: 0,
    crestas: 0,
    rugosidad: 0,
    mapa: new Uint8Array(320 * 240),
    brillo: 140,
    nitidez: 100,
    ...resto,
  }
}

const base: EntradaDiagnostico = { zona: 'Pared', descripcion: '', metricas: [], fecha: '2026-01-01' }
const con = (e: Partial<EntradaDiagnostico>): EntradaDiagnostico => ({ ...base, ...e })

describe('diagnosticar', () => {
  it('detecta moho en la foto y propone el kit de humedad', () => {
    const d = diagnosticar(con({ metricas: [foto({ fracciones: { moho: 0.12 } })] }))
    expect(d.patologia).toBe('Moho y hongos')
    expect(d.origen).toBe('foto')
    expect(d.severidad).toBe('Severa')
    expect(d.tratamiento.kit).toBe('Humedad y moho')
    expect(d.tratamiento.productos).toContain('Aquablock Fibratado')
    expect(d.resumen).toContain('12%')
  })

  it('gradúa la severidad según cuánto de la foto está afectado', () => {
    const leve = diagnosticar(con({ metricas: [foto({ fracciones: { moho: 0.04 } })] }))
    const media = diagnosticar(con({ metricas: [foto({ fracciones: { moho: 0.08 } })] }))
    expect(leve.severidad).toBe('Leve')
    expect(media.severidad).toBe('Moderada')
  })

  it('combina foto y descripción y gana confianza', () => {
    const soloFoto = diagnosticar(con({ metricas: [foto({ fracciones: { humedad: 0.05 } })] }))
    const ambas = diagnosticar(con({ descripcion: 'Hay una mancha de humedad que crece', metricas: [foto({ fracciones: { humedad: 0.05 } })] }))
    expect(ambas.patologia).toBe('Humedad y filtración')
    expect(ambas.origen).toBe('foto y descripción')
    expect(ambas.confianza).toBeGreaterThan(soloFoto.confianza)
  })

  it('sin foto diagnostica con lo que cuenta el cliente, pero con confianza limitada', () => {
    const d = diagnosticar(con({ zona: 'Techo', descripcion: 'Tengo goteras y se moja el techo cuando llueve' }))
    expect(d.patologia).toBe('Humedad y filtración')
    expect(d.origen).toBe('descripción')
    expect(d.confianza).toBeLessThanOrEqual(55)
    expect(d.tratamiento.kit).toBe('Goteras y terrazas')
    expect(d.advertencias.join(' ')).toMatch(/foto/i)
  })

  it('si la foto no muestra el problema pero el cliente lo cuenta, manda la descripción', () => {
    const d = diagnosticar(con({ descripcion: 'Se está descascarando la pintura', metricas: [foto()] }))
    expect(d.patologia).toBe('Pintura descascarada')
    expect(d.origen).toBe('descripción')
    expect(d.confianza).toBeLessThanOrEqual(55)
  })

  it('usa la condición elegida en el formulario cuando no hay más datos', () => {
    const d = diagnosticar(con({ condicion: 'Con grietas' }))
    expect(d.patologia).toBe('Fisuras y grietas')
  })

  it('no confunde un color con un daño: negro no es moho', () => {
    const d = diagnosticar(con({ descripcion: 'Quiero pintar la sala de negro y gris' }))
    expect(d.patologia).toBe('Sin daños evidentes')
    expect(d.severidad).toBeNull()
  })

  it('una pared sana no inventa daños', () => {
    const d = diagnosticar(con({ descripcion: 'Quiero cambiar el color', metricas: [foto()] }))
    expect(d.patologia).toBe('Sin daños evidentes')
    expect(d.tratamiento.kit).toBeNull()
    expect(d.tratamiento.productos.length).toBeGreaterThan(0)
  })

  it('el naranja en una pared no cuenta como óxido, pero en una reja sí', () => {
    const naranja = foto({ fracciones: { oxido: 0.2 } })
    expect(diagnosticar(con({ zona: 'Pared', metricas: [naranja] })).patologia).toBe('Sin daños evidentes')
    const reja = diagnosticar(con({ zona: 'Metal o reja', metricas: [naranja] }))
    expect(reja.patologia).toBe('Óxido y corrosión')
    expect(reja.tratamiento.kit).toBe('Metales oxidados')
  })

  it('la textura fuerte sola no es pintura descascarada, pero con la descripción sí', () => {
    const rugosa = foto({ fracciones: { descascarado: 0.9 }, rugosidad: 0.9 })
    expect(diagnosticar(con({ metricas: [rugosa] })).patologia).toBe('Sin daños evidentes')
    expect(diagnosticar(con({ descripcion: 'la pintura se pela y se levanta', metricas: [rugosa] })).patologia).toBe('Pintura descascarada')
  })

  it('las grietas serias piden revisión estructural; las leves no', () => {
    const seria = diagnosticar(con({ zona: 'Fachada', metricas: [foto({ longitudGrietas: 2.2 })] }))
    expect(seria.patologia).toBe('Fisuras y grietas')
    expect(seria.severidad).toBe('Severa')
    expect(seria.advertencias.join(' ')).toMatch(/estructural/i)
    expect(seria.tratamiento.kit).toBe('Fachada exterior')

    const media = diagnosticar(con({ metricas: [foto({ longitudGrietas: 1.2 })] }))
    expect(media.severidad).toBe('Moderada')

    const leve = diagnosticar(con({ metricas: [foto({ longitudGrietas: 0.5 })] }))
    expect(leve.severidad).toBe('Leve')
    expect(leve.advertencias.join(' ')).not.toMatch(/estructural/i)
  })

  it('en una superficie muy rugosa, las líneas de la foto solas no bastan para decir grietas', () => {
    const rugosa = foto({ longitudGrietas: 0.8, rugosidad: 0.7 })
    expect(diagnosticar(con({ metricas: [foto({ longitudGrietas: 0.8 })] })).patologia).toBe('Fisuras y grietas')
    expect(diagnosticar(con({ metricas: [rugosa] })).patologia).toBe('Sin daños evidentes')
    expect(diagnosticar(con({ descripcion: 'Veo una grieta larga', metricas: [rugosa] })).patologia).toBe('Fisuras y grietas')
  })

  it('muchas líneas finas son textura (molduras, estuco): las grietas pesan menos', () => {
    const limpia = diagnosticar(con({ metricas: [foto({ longitudGrietas: 1.8, crestas: 0.03 })] }))
    const conTextura = diagnosticar(con({ metricas: [foto({ longitudGrietas: 1.8, crestas: 0.2 })] }))
    expect(limpia.severidad).toBe('Severa')
    expect(conTextura.severidad).not.toBe('Severa')
    expect(conTextura.confianza).toBeLessThan(limpia.confianza)
  })

  it('las líneas de un metal oxidado no son grietas', () => {
    const d = diagnosticar(con({ zona: 'Metal o reja', metricas: [foto({ fracciones: { oxido: 0.9 }, longitudGrietas: 2.5 })] }))
    expect(d.patologia).toBe('Óxido y corrosión')
  })

  it('avisa cuando se ven juntas de baldosa o ladrillo', () => {
    const d = diagnosticar(con({ zona: 'Piso', metricas: [foto({ juntasRectas: 6 })] }))
    expect(d.advertencias.join(' ')).toMatch(/juntas/i)
  })

  it('avisa y baja la confianza cuando la foto está muy oscura', () => {
    const clara = diagnosticar(con({ metricas: [foto({ fracciones: { moho: 0.1 } })] }))
    const oscura = diagnosticar(con({ metricas: [foto({ fracciones: { moho: 0.1 }, brillo: 30 })] }))
    expect(oscura.advertencias.join(' ')).toMatch(/oscura/i)
    expect(oscura.confianza).toBeLessThan(clara.confianza)
  })

  it('avisa cuando hay dos problemas distintos y parecidos', () => {
    const d = diagnosticar(con({ metricas: [foto({ fracciones: { moho: 0.1 }, longitudGrietas: 1 })] }))
    expect(d.advertencias.join(' ')).toMatch(/dos problemas/i)
    expect(d.hallazgos.length).toBeGreaterThanOrEqual(2)
  })

  it('moho y humedad juntos no son una duda: una mancha oscura suele ser las dos cosas', () => {
    const d = diagnosticar(con({ descripcion: 'Hay humedad en la pared', metricas: [foto({ fracciones: { moho: 0.07 } })] }))
    expect(d.patologia).toBe('Humedad y filtración')
    expect(d.origen).toBe('foto y descripción')
    expect(d.resumen).toMatch(/moho/i)
    expect(d.advertencias.join(' ')).not.toMatch(/dos problemas/i)
  })

  it('lo que el cliente nombra manda sobre una mancha dudosa de la foto', () => {
    const rugosaConManchas = foto({ fracciones: { moho: 0.1 }, rugosidad: 0.8 })
    const d = diagnosticar(con({ descripcion: 'Tengo grietas en la pared', metricas: [rugosaConManchas] }))
    expect(d.patologia).toBe('Fisuras y grietas')
    expect(d.resumen).toMatch(/moho/i)
  })

  it('pero no cuando la foto lo contradice con fuerza', () => {
    const d = diagnosticar(con({ zona: 'Metal o reja', descripcion: 'Tiene grietas', metricas: [foto({ fracciones: { oxido: 0.9 } })] }))
    expect(d.patologia).toBe('Óxido y corrosión')
  })

  it('sobre una superficie muy rugosa, una mancha oscura sin descripción baja la confianza y avisa', () => {
    const lisa = diagnosticar(con({ metricas: [foto({ fracciones: { moho: 0.1 } })] }))
    const rugosa = diagnosticar(con({ metricas: [foto({ fracciones: { moho: 0.1 }, rugosidad: 0.8 })] }))
    expect(rugosa.confianza).toBeLessThan(lisa.confianza)
    expect(rugosa.advertencias.join(' ')).toMatch(/rugosa/i)
  })

  it('sin foto ni descripción no inventa nada', () => {
    const d = diagnosticar(con({ zona: 'Metal o reja' }))
    expect(d.patologia).toBe('Sin daños evidentes')
    expect(d.confianza).toBeLessThanOrEqual(30)
  })

  it('la zona inclina la balanza: un techo con manchas es más probable humedad', () => {
    const m = foto({ fracciones: { moho: 0.05, humedad: 0.04 } })
    const pared = diagnosticar(con({ zona: 'Pared', metricas: [m] }))
    const techo = diagnosticar(con({ zona: 'Techo', metricas: [m] }))
    const intensidad = (d: typeof pared, p: string) => d.hallazgos.find((h) => h.patologia === p)?.intensidad ?? 0
    expect(intensidad(techo, 'Humedad y filtración') - intensidad(techo, 'Moho y hongos')).toBeGreaterThan(
      intensidad(pared, 'Humedad y filtración') - intensidad(pared, 'Moho y hongos'),
    )
  })

  it('nunca promete certeza total, con o sin foto', () => {
    const fuerte = diagnosticar(con({ descripcion: 'moho negro por todo el muro', metricas: [foto({ fracciones: { moho: 0.5 } })] }))
    expect(fuerte.confianza).toBeLessThan(95)
    expect(fuerte.confianza).toBeGreaterThan(60)
  })

  it('en un exterior recomienda el acabado de fachada; en un interior, el de interiores', () => {
    const exterior = diagnosticar(con({ zona: 'Fachada', descripcion: 'la pintura se descascara' }))
    const interior = diagnosticar(con({ zona: 'Pared', descripcion: 'la pintura se descascara' }))
    expect(exterior.tratamiento.productos).toContain('Koraza 5 Años Protección Total')
    expect(interior.tratamiento.productos).toContain('Viniltex')
  })

  it('toma la mejor evidencia entre varias fotos', () => {
    const d = diagnosticar(con({ metricas: [foto(), foto({ fracciones: { moho: 0.1 } })] }))
    expect(d.patologia).toBe('Moho y hongos')
    expect(d.fotos).toBe(2)
  })
})
