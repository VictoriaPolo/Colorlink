import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import type { EstadoLlamada, TurnoLlamada } from './llamada'

/** Navegador simulado: micrófono, reconocedor de voz y síntesis sin audio real. */
const reconocedores: FakeReconocedor[] = []
const hablado: string[] = []

class FakeReconocedor {
  lang = ''
  interimResults = false
  continuous = false
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  onend: (() => void) | null = null
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
  voice = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

/** El usuario dice una frase al reconocedor que está escuchando. */
function oir(texto: string) {
  const r = reconocedores[reconocedores.length - 1]
  r.onresult?.({ results: [Object.assign([{ transcript: texto }], { isFinal: true })] })
  r.onend?.()
}

let iniciarLlamada: typeof import('./llamada').iniciarLlamada

beforeAll(async () => {
  Object.assign(window, { webkitSpeechRecognition: FakeReconocedor, SpeechSynthesisUtterance: FakeFrase })
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      getVoices: () => [],
      cancel: vi.fn(),
      speak: (frase: FakeFrase) => {
        hablado.push(frase.text)
        setTimeout(() => frase.onend?.(), 50)
      },
    },
  })
  const pista = { stop: vi.fn(), enabled: true }
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: async () => ({ getTracks: () => [pista], getAudioTracks: () => [pista] }) },
  })
  Object.assign(window, {
    AudioContext: class {
      resume = async () => {}
      close = async () => {}
      createAnalyser = () => ({ fftSize: 0, getByteTimeDomainData: (a: Uint8Array) => a.fill(128) })
      createMediaStreamSource = () => ({ connect: () => {} })
    },
  })
  // voz.ts lee el reconocedor al importarse: se importa después de simularlo.
  ;({ iniciarLlamada } = await import('./llamada'))
})

beforeEach(() => {
  vi.useFakeTimers()
  reconocedores.length = 0
  hablado.length = 0
})

afterEach(() => vi.useRealTimers())

async function llamar() {
  const estados: EstadoLlamada[] = []
  const turnos: TurnoLlamada[] = []
  const control = await iniciarLlamada({
    nombre: 'Laura Polo',
    pedidos: [],
    signal: new AbortController().signal,
    onEstado: (e) => estados.push(e),
    onTurno: (t) => turnos.push(t),
    onSegundos: () => {},
    onNivelMicro: () => {},
    onNivelVoz: () => {},
    onAviso: () => {},
  })
  return { control, estados, turnos }
}

describe('iniciarLlamada', () => {
  it('saluda, responde lo que se dice y vuelve a escuchar', async () => {
    const { control, estados, turnos } = await llamar()
    expect(hablado[0]).toContain('Hola Laura, soy Coli')

    await vi.advanceTimersByTimeAsync(60)
    expect(estados.at(-1)).toBe('escuchando')

    oir('Necesito pintar la fachada de mi casa')
    expect(estados.at(-1)).toBe('pensando')
    await vi.advanceTimersByTimeAsync(710)
    expect(turnos.at(-1)?.texto).toContain('Koraza')
    expect(hablado.at(-1)).toContain('Koraza')

    await vi.advanceTimersByTimeAsync(60)
    expect(estados.at(-1)).toBe('escuchando')
    control.colgar()
    expect(estados.at(-1)).toBe('finalizada')
  })

  it('en la llamada también rechaza temas ajenos a la tienda', async () => {
    const { control, turnos } = await llamar()
    await vi.advanceTimersByTimeAsync(60)
    oir('¿Quién ganó el partido de fútbol?')
    await vi.advanceTimersByTimeAsync(710)
    expect(turnos.at(-1)?.respuesta?.fueraDeAlcance).toBe(true)
    control.colgar()
  })

  it('si hay silencio sigue escuchando, y en silencio no abre el micrófono', async () => {
    const { control, estados } = await llamar()
    await vi.advanceTimersByTimeAsync(60)
    reconocedores.at(-1)?.onend?.() // terminó sin oír nada
    expect(reconocedores).toHaveLength(2)

    control.silenciar(true)
    expect(reconocedores).toHaveLength(2)
    expect(estados.at(-1)).toBe('escuchando')
    control.silenciar(false)
    expect(reconocedores).toHaveLength(3)
    control.colgar()
  })
})
