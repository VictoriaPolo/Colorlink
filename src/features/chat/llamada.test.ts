import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import type { EstadoLlamada, TurnoLlamada } from './llamada'

/** Navegador simulado: reconocedor de voz y síntesis sin micrófono ni audio real. */
const reconocedores: FakeReconocedor[] = []
const hablado: string[] = []
const frasesDichas: FakeFrase[] = []

class FakeReconocedor {
  lang = ''
  interimResults = false
  continuous = false
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  onspeechstart: (() => void) | null = null
  onspeechend: (() => void) | null = null
  start() {
    reconocedores.push(this)
  }
  stop() {
    this.onend?.()
  }
  abort() {
    this.onerror?.({ error: 'aborted' })
    this.onend?.()
  }
}

class FakeFrase {
  text: string
  lang = ''
  voice: { name: string } | null = null
  rate = 1
  pitch = 1
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  onboundary: (() => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

/** El usuario dice una frase al reconocedor que está escuchando. */
function oir(texto: string, { final = true } = {}) {
  const r = reconocedores[reconocedores.length - 1]
  r.onresult?.({ results: [Object.assign([{ transcript: texto }], { isFinal: final })] })
  r.onend?.()
}

let iniciarLlamada: typeof import('./llamada').iniciarLlamada

beforeAll(async () => {
  Object.assign(window, { webkitSpeechRecognition: FakeReconocedor, SpeechSynthesisUtterance: FakeFrase })
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      getVoices: () => [{ name: 'Microsoft Gonzalo Online (Natural) - Spanish (Colombia)', lang: 'es-CO', voiceURI: 'gonzalo' }],
      cancel: vi.fn(),
      addEventListener: () => {},
      removeEventListener: () => {},
      speak: (frase: FakeFrase) => {
        hablado.push(frase.text)
        frasesDichas.push(frase)
        setTimeout(() => frase.onend?.(), 50)
      },
    },
  })
  // voz.ts lee el reconocedor al importarse: se importa después de simularlo.
  ;({ iniciarLlamada } = await import('./llamada'))
})

beforeEach(() => {
  vi.useFakeTimers()
  reconocedores.length = 0
  hablado.length = 0
  frasesDichas.length = 0
  window.localStorage.clear()
})

afterEach(() => vi.useRealTimers())

function llamar() {
  const estados: EstadoLlamada[] = []
  const turnos: TurnoLlamada[] = []
  const avisos: string[] = []
  const control = iniciarLlamada({
    contexto: { nombreUsuario: 'Laura Polo' },
    onEstado: (e) => estados.push(e),
    onTurno: (t) => turnos.push(t),
    onSegundos: () => {},
    onEscuchando: () => {},
    onNivelMicro: () => {},
    onNivelVoz: () => {},
    onAviso: (a) => avisos.push(a),
  })
  return { control, estados, turnos, avisos }
}

/** Termina de hablar (50 ms simulados) y pasa la pausa antes de escuchar. */
const terminarDeHablar = () => vi.advanceTimersByTimeAsync(320)

describe('iniciarLlamada', () => {
  it('saluda, responde lo que se dice y vuelve a escuchar', async () => {
    const { control, estados, turnos } = llamar()
    await vi.advanceTimersByTimeAsync(0) // la voz se elige en cuanto el navegador la tiene lista
    expect(hablado.join(' ')).toMatch(/, Laura\. Soy Coli, tu asistente de Color link\./)

    await terminarDeHablar()
    expect(estados.at(-1)).toBe('escuchando')

    oir('Necesito pintar la fachada de mi casa')
    expect(estados.at(-1)).toBe('pensando')
    await vi.advanceTimersByTimeAsync(710)
    expect(turnos.at(-1)?.texto).toContain('Koraza')
    expect(hablado.at(-1)).toContain('Koraza')

    await terminarDeHablar()
    expect(estados.at(-1)).toBe('escuchando')
    control.colgar()
    expect(estados.at(-1)).toBe('finalizada')
  })

  it('habla con la mejor voz disponible y el tono JARVIS', async () => {
    const { control } = llamar()
    await vi.advanceTimersByTimeAsync(0)
    expect(frasesDichas[0].voice?.name).toContain('Gonzalo')
    expect(frasesDichas[0]).toMatchObject({ lang: 'es-CO', rate: 0.96, pitch: 0.92 })
    control.colgar()
  })

  it('al interrumpir, Coli calla y pasa a escuchar', async () => {
    const { control, estados } = llamar()
    await vi.advanceTimersByTimeAsync(10) // ya empezó a hablar y todavía no termina
    expect(estados.at(-1)).toBe('hablando')
    control.interrumpir()
    await vi.advanceTimersByTimeAsync(260)
    expect(estados.at(-1)).toBe('escuchando')
    expect(reconocedores).toHaveLength(1)
    control.colgar()
  })

  it('usa lo entendido aunque el navegador no marque la frase como final', async () => {
    const { control, turnos } = llamar()
    await terminarDeHablar()
    oir('¿Cómo compro?', { final: false })
    await vi.advanceTimersByTimeAsync(710)
    expect(turnos.at(-1)?.respuesta?.ruta).toBe('/catalogo')
    control.colgar()
  })

  it('en la llamada también rechaza temas ajenos a la tienda', async () => {
    const { control, turnos } = llamar()
    await terminarDeHablar()
    oir('¿Quién ganó el partido de fútbol?')
    await vi.advanceTimersByTimeAsync(710)
    expect(turnos.at(-1)?.respuesta?.fueraDeAlcance).toBe(true)
    control.colgar()
  })

  it('si hay silencio sigue escuchando y, tras varios intentos, avisa', async () => {
    const { control, avisos } = llamar()
    await terminarDeHablar()
    for (let i = 0; i < 3; i++) reconocedores.at(-1)?.onend?.() // terminó sin oír nada
    expect(reconocedores).toHaveLength(4)
    expect(avisos.at(-1)).toContain('No logro escucharte')
    control.colgar()
  })

  it('en silencio no abre el micrófono ni responde frases a medias', async () => {
    const { control, estados, turnos } = llamar()
    await terminarDeHablar()
    reconocedores.at(-1)?.onresult?.({ results: [Object.assign([{ transcript: 'necesito' }], { isFinal: false })] })
    control.silenciar(true)
    expect(reconocedores).toHaveLength(1)
    expect(estados.at(-1)).toBe('escuchando')
    expect(turnos.some((t) => t.autor === 'usuario')).toBe(false)
    control.silenciar(false)
    expect(reconocedores).toHaveLength(2)
    control.colgar()
  })
})
