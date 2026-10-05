import { useEffect, useRef, useState } from 'react'

/** El reconocedor no viene en lib.dom (solo sus eventos): tipo mínimo de lo que se usa. */
export interface Reconocedor {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

const ventana = window as unknown as {
  SpeechRecognition?: new () => Reconocedor
  webkitSpeechRecognition?: new () => Reconocedor
}
// Chrome, Edge y Safari lo traen (con prefijo webkit); Firefox no.
export const ReconocedorNativo = ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition

/** La llamada necesita reconocer voz, hablar y medir el micrófono. */
export const llamadaSoportada =
  Boolean(ReconocedorNativo) && 'speechSynthesis' in window && Boolean(navigator.mediaDevices?.getUserMedia)

const MENSAJES_ERROR: Partial<Record<SpeechRecognitionErrorCode, string>> = {
  'not-allowed': 'Permite el acceso al micrófono para hablar con Coli.',
  'service-not-allowed': 'Permite el acceso al micrófono para hablar con Coli.',
  'no-speech': 'No te escuché. Toca el micrófono e intenta de nuevo.',
  'audio-capture': 'No encontramos un micrófono conectado.',
  network: 'El dictado por voz necesita conexión a internet.',
}

/** Dictado por voz (Web Speech API, sin librerías): muestra lo que va
 * entendiendo y entrega la frase final a `onFrase`. */
export function useDictado(onFrase: (texto: string) => void) {
  const [escuchando, setEscuchando] = useState(false)
  const [parcial, setParcial] = useState('')
  const [error, setError] = useState('')
  const reconocedorRef = useRef<Reconocedor | null>(null)
  const onFraseRef = useRef(onFrase)

  useEffect(() => {
    onFraseRef.current = onFrase
  })

  useEffect(() => {
    // Chrome carga las voces en diferido: pedirlas al montar deja lista la
    // voz en español para la primera respuesta leída.
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices()
    return () => reconocedorRef.current?.abort()
  }, [])

  const escuchar = () => {
    if (!ReconocedorNativo || escuchando) return
    callar() // que Coli no se escuche a sí misma
    const reconocedor = new ReconocedorNativo()
    reconocedor.lang = 'es-CO'
    reconocedor.interimResults = true
    reconocedor.continuous = false
    reconocedor.onresult = (e) => {
      const resultados = Array.from(e.results)
      const texto = resultados.map((r) => r[0].transcript).join('').trim()
      setParcial(texto)
      if (texto && resultados.every((r) => r.isFinal)) onFraseRef.current(texto)
    }
    reconocedor.onerror = (e) => setError(MENSAJES_ERROR[e.error] ?? 'No pudimos usar el micrófono. Intenta de nuevo.')
    reconocedor.onend = () => {
      setEscuchando(false)
      setParcial('')
    }
    reconocedorRef.current = reconocedor
    setError('')
    setEscuchando(true)
    reconocedor.start()
  }

  const detener = () => reconocedorRef.current?.stop()

  return { soportado: Boolean(ReconocedorNativo), escuchando, parcial, error, escuchar, detener }
}

/** Frase lista para leer con una voz en español (colombiana si existe). */
export function crearFrase(texto: string): SpeechSynthesisUtterance {
  const frase = new SpeechSynthesisUtterance(
    texto.replace(/\$\s?([\d.]+)/g, '$1 pesos').replace(/m²/g, 'metros cuadrados'),
  )
  frase.lang = 'es-CO'
  const voces = window.speechSynthesis.getVoices()
  frase.voice = voces.find((v) => v.lang === 'es-CO') ?? voces.find((v) => v.lang.startsWith('es')) ?? null
  return frase
}

/** Lee la respuesta en voz alta. */
export function hablar(texto: string) {
  if (!('speechSynthesis' in window)) return
  callar()
  window.speechSynthesis.speak(crearFrase(texto))
}

export function callar() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
