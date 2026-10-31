import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AjustesVoz from './AjustesVoz'
import { leerPerfil } from './sintesis'

/** Las dos voces que trae Chrome en Windows sin las de Google. */
const RAUL = { name: 'Microsoft Raul - Spanish (Mexico)', lang: 'es-MX', voiceURI: 'Microsoft Raul - Spanish (Mexico)' }
const SABINA = { name: 'Microsoft Sabina - Spanish (Mexico)', lang: 'es-MX', voiceURI: 'Microsoft Sabina - Spanish (Mexico)' }

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
const esperar = () => new Promise((r) => setTimeout(r, 0))

beforeAll(() => {
  Object.assign(window, { SpeechSynthesisUtterance: FakeDicha })
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      getVoices: () => [SABINA, RAUL],
      speak: (d: FakeDicha) => dichas.push(d),
      cancel: vi.fn(),
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  })
})

beforeEach(() => {
  dichas.length = 0
  window.localStorage.clear()
})

describe('AjustesVoz', () => {
  it('muestra los dos tonos con JARVIS elegido y la mejor voz como automática', () => {
    render(<AjustesVoz />)
    expect(screen.getByRole('radio', { name: /JARVIS/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /Natural/ })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('combobox', { name: /Voz/ })).toHaveDisplayValue('Automática: Raul · Mexico')
  })

  it('cambiar el tono lo guarda y deja oír una muestra con ese tono', async () => {
    render(<AjustesVoz />)
    await userEvent.click(screen.getByRole('radio', { name: /Natural/ }))
    expect(leerPerfil().tono).toBe('natural')
    await esperar()
    expect(dichas[0]).toMatchObject({ text: 'Hola, soy Coli. Así suena mi voz.', rate: 1, pitch: 1 })
    expect(dichas[0].voice).toMatchObject({ name: RAUL.name })
  })

  it('elegir otra voz la guarda y la usa en la muestra', async () => {
    render(<AjustesVoz />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /Voz/ }), SABINA.voiceURI)
    expect(leerPerfil().voiceURI).toBe(SABINA.voiceURI)
    await esperar()
    expect(dichas[0].voice).toMatchObject({ name: SABINA.name })
  })

  it('el botón de probar repite la muestra', async () => {
    render(<AjustesVoz />)
    await userEvent.click(screen.getByRole('button', { name: 'Probar la voz' }))
    await esperar()
    expect(dichas).toHaveLength(1)
    expect(dichas[0].pitch).toBe(0.92) // tono JARVIS por defecto
  })

  it('con voces básicas sugiere abrir la página en Edge', () => {
    render(<AjustesVoz />)
    expect(screen.getByRole('note')).toHaveTextContent('Microsoft Edge')
  })
})
