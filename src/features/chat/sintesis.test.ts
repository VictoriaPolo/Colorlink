import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import {
  calidadDeVoz,
  callar,
  elegirVoz,
  etiquetaVoz,
  guardarPerfil,
  hablarTexto,
  leerPerfil,
  ordenarVoces,
  pistaDeCalidad,
  type PerfilVoz,
} from './sintesis'

const voz = (name: string, lang: string, voiceURI = name) => ({ name, lang, voiceURI })

/** Lo que Edge y Chrome (Windows) ofrecen de verdad en español, medido en un equipo real. */
const GONZALO = voz('Microsoft Gonzalo Online (Natural) - Spanish (Colombia)', 'es-CO')
const SALOME = voz('Microsoft Salome Online (Natural) - Spanish (Colombia)', 'es-CO')
const EDGE = [
  voz('Microsoft Elvira Online (Natural) - Spanish (Spain)', 'es-ES'),
  voz('Microsoft Álvaro Online (Natural) - Spanish (Spain)', 'es-ES'),
  voz('Microsoft Jorge Online (Natural) - Spanish (Mexico)', 'es-MX'),
  voz('Microsoft Dalia Online (Natural) - Spanish (Mexico)', 'es-MX'),
  SALOME,
  GONZALO,
  voz('Microsoft Aria Online (Natural) - English (United States)', 'en-US'),
]
const RAUL = voz('Microsoft Raul - Spanish (Mexico)', 'es-MX')
const SABINA = voz('Microsoft Sabina - Spanish (Mexico)', 'es-MX')
const CHROME_WINDOWS = [SABINA, RAUL]

describe('elegirVoz', () => {
  it('en Edge elige a Gonzalo: neuronal, de Colombia y masculina', () => {
    expect(elegirVoz(EDGE, null)).toBe(GONZALO)
    expect(ordenarVoces(EDGE).slice(0, 3).map((v) => v.name)).toEqual([
      GONZALO.name,
      'Microsoft Jorge Online (Natural) - Spanish (Mexico)',
      'Microsoft Álvaro Online (Natural) - Spanish (Spain)',
    ])
  })

  it('en Chrome para Windows elige a Raul, la única voz masculina', () => {
    expect(elegirVoz(CHROME_WINDOWS, null)).toBe(RAUL)
  })

  it('una voz neuronal gana a una del sistema aunque sea de otro país o femenina', () => {
    expect(elegirVoz([RAUL, voz('Microsoft Dalia Online (Natural) - Spanish (Mexico)', 'es-MX')], null)?.name).toContain('Dalia')
  })

  it('las voces de Google (red) ganan a las del sistema', () => {
    const google = voz('Google español de Estados Unidos', 'es-US')
    expect(elegirVoz([RAUL, google], null)).toBe(google)
  })

  it('respeta la voz que la persona eligió, mientras el navegador la tenga', () => {
    expect(elegirVoz(EDGE, SALOME.voiceURI)).toBe(SALOME)
    expect(elegirVoz(CHROME_WINDOWS, SALOME.voiceURI)).toBe(RAUL)
  })

  it('ignora las voces que no son en español', () => {
    expect(elegirVoz([voz('Microsoft Zira - English (United States)', 'en-US')], null)).toBeNull()
    expect(elegirVoz([], null)).toBeNull()
  })

  it('entiende los códigos de idioma con guion bajo (Android)', () => {
    expect(elegirVoz([voz('Español', 'es_CO'), voz('English', 'en_US')], null)?.name).toBe('Español')
  })
})

describe('calidadDeVoz y etiquetaVoz', () => {
  it('distingue las voces neuronales, las de red y las del sistema', () => {
    expect(calidadDeVoz(GONZALO)).toBe('alta')
    expect(calidadDeVoz(voz('Jorge (Enhanced)', 'es-ES'))).toBe('alta')
    expect(calidadDeVoz(voz('Google español', 'es-ES'))).toBe('media')
    expect(calidadDeVoz(RAUL)).toBe('basica')
    expect(calidadDeVoz(voz('Spanish (Spain) eSpeak', 'es-ES'))).toBe('basica')
  })

  it('muestra un nombre corto con el país', () => {
    expect(etiquetaVoz(GONZALO)).toBe('Gonzalo · Colombia · Natural')
    expect(etiquetaVoz(RAUL)).toBe('Raul · Mexico')
    expect(etiquetaVoz(voz('Microsoft Sabina Desktop - Spanish (Mexico)', 'es-MX'))).toBe('Sabina · Mexico')
    expect(etiquetaVoz(voz('Google español de Estados Unidos', 'es-US'))).toBe('Google español de Estados Unidos · es-US')
  })
})

describe('pistaDeCalidad', () => {
  it('no dice nada si la voz ya es natural', () => {
    expect(pistaDeCalidad(GONZALO, true)).toBeNull()
    expect(pistaDeCalidad(GONZALO, false)).toBeNull()
  })

  it('sugiere abrir la página en Edge si la voz es básica o de red', () => {
    expect(pistaDeCalidad(RAUL, false)).toContain('Microsoft Edge')
    expect(pistaDeCalidad(voz('Google español', 'es-ES'), false)).toContain('aún más natural')
  })

  it('en Edge sin voces naturales pide revisar la conexión', () => {
    expect(pistaDeCalidad(RAUL, true)).toContain('conexión')
  })

  it('sin voces en español avisa que Coli no puede hablar', () => {
    expect(pistaDeCalidad(null, false)).toContain('no puede hablar')
  })
})

describe('perfil de voz', () => {
  beforeEach(() => window.localStorage.clear())

  it('por defecto: la mejor voz y el tono JARVIS', () => {
    expect(leerPerfil()).toEqual({ voiceURI: null, tono: 'jarvis' })
  })

  it('recuerda lo que se eligió', () => {
    guardarPerfil({ voiceURI: SALOME.voiceURI, tono: 'natural' })
    expect(leerPerfil()).toEqual({ voiceURI: SALOME.voiceURI, tono: 'natural' })
  })
})

describe('hablarTexto', () => {
  class FakeDicha {
    text: string
    lang = ''
    voice: unknown = null
    rate = 1
    pitch = 1
    onend: (() => void) | null = null
    onerror: (() => void) | null = null
    onboundary: (() => void) | null = null
    constructor(text: string) {
      this.text = text
    }
  }
  const dichas: FakeDicha[] = []
  const oyentes = new Set<() => void>()
  let voces: unknown[] = []

  beforeAll(() => {
    Object.assign(window, { SpeechSynthesisUtterance: FakeDicha })
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => voces,
        speak: (d: FakeDicha) => dichas.push(d),
        cancel: vi.fn(),
        addEventListener: (_: string, f: () => void) => oyentes.add(f),
        removeEventListener: (_: string, f: () => void) => oyentes.delete(f),
      },
    })
  })

  beforeEach(() => {
    dichas.length = 0
    oyentes.clear()
    voces = EDGE
    window.localStorage.clear()
    callar()
  })

  afterEach(() => vi.useRealTimers())

  const esperar = () => new Promise((r) => setTimeout(r, 0))

  it('lee frase por frase, con la mejor voz y el ritmo de JARVIS', async () => {
    hablarTexto('Tu pedido PED-1006 está en preparación. Queda listo en dos horas, con el color ya mezclado.')
    await esperar()
    expect(dichas.map((d) => d.text)).toEqual([
      'Tu pedido P E D 1006 está en preparación.',
      'Queda listo en dos horas, con el color ya mezclado.',
    ])
    expect((dichas[0].voice as { name: string }).name).toBe(GONZALO.name)
    expect(dichas[0]).toMatchObject({ lang: 'es-CO', rate: 0.96, pitch: 0.92 })
  })

  it('con el tono natural no cambia el ritmo ni el tono, y usa la voz elegida', async () => {
    const perfil: PerfilVoz = { voiceURI: SALOME.voiceURI, tono: 'natural' }
    hablarTexto('Hola, ¿en qué te puedo ayudar hoy con tu proyecto?', { perfil })
    await esperar()
    expect((dichas[0].voice as { name: string }).name).toBe(SALOME.name)
    expect(dichas[0]).toMatchObject({ rate: 1, pitch: 1 })
  })

  it('avisa una sola vez, al terminar la última frase', async () => {
    const onFin = vi.fn()
    hablarTexto('Primera frase de la respuesta. Segunda frase de la respuesta.', { onFin })
    await esperar()
    dichas[0].onend?.()
    expect(onFin).not.toHaveBeenCalled()
    dichas[1].onend?.()
    expect(onFin).toHaveBeenCalledTimes(1)
  })

  it('avisa cada palabra que dice, para animar la boca', async () => {
    const onPalabra = vi.fn()
    hablarTexto('Una frase lo bastante larga para decirla.', { onPalabra })
    await esperar()
    dichas[0].onboundary?.()
    dichas[0].onboundary?.()
    expect(onPalabra).toHaveBeenCalledTimes(2)
  })

  it('una respuesta larga se resume y avisa que el resto quedó escrito', async () => {
    const larga = [1, 2, 3, 4, 5, 6].map((n) => `Esta es la frase número ${n} de una respuesta muy larga de Coli.`).join(' ')
    hablarTexto(larga, { resumir: true })
    await esperar()
    expect(dichas).toHaveLength(5)
    expect(dichas.at(-1)?.text).toBe('El resto quedó escrito en la conversación.')
    expect(dichas[0].text).toContain('frase número 1')
  })

  it('al cancelar no habla ni avisa que terminó', async () => {
    const onFin = vi.fn()
    const habla = hablarTexto('Esta frase se corta antes de empezar.', { onFin })
    habla.cancelar()
    await esperar()
    expect(dichas).toHaveLength(0)

    const otra = hablarTexto('Esta frase se corta mientras suena.', { onFin })
    await esperar()
    otra.cancelar()
    dichas[0].onerror?.()
    expect(onFin).not.toHaveBeenCalled()
  })

  it('una lectura nueva calla a la anterior, que no avisa que terminó', async () => {
    const primera = vi.fn()
    hablarTexto('Esta es la primera lectura completa.', { onFin: primera })
    await esperar()
    const vieja = dichas[0]
    hablarTexto('Esta es la segunda lectura completa.')
    await esperar()
    vieja.onerror?.() // el navegador la interrumpe
    expect(primera).not.toHaveBeenCalled()
  })

  it('espera a que el navegador cargue las voces', async () => {
    voces = []
    hablarTexto('Hola, esto se dice cuando lleguen las voces.')
    await esperar()
    expect(dichas).toHaveLength(0)
    voces = EDGE
    oyentes.forEach((f) => f())
    await esperar()
    expect((dichas[0].voice as { name: string }).name).toBe(GONZALO.name)
  })

  it('si las voces nunca llegan, habla igual con la voz del navegador', async () => {
    vi.useFakeTimers()
    voces = []
    hablarTexto('Hola, esto se dice sin voces cargadas.')
    await vi.advanceTimersByTimeAsync(900)
    expect(dichas).toHaveLength(1)
    expect(dichas[0]).toMatchObject({ voice: null, lang: 'es-CO' })
  })
})
