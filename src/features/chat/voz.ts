import { useEffect, useRef, useState } from 'react'
import { callar, cargarVoces } from './sintesis'

/** El reconocedor no viene en lib.dom (solo sus eventos): tipo mínimo de lo que se usa. */
export interface Reconocedor {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onspeechstart: (() => void) | null
  onspeechend: (() => void) | null
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

/** Opera (incluido Opera GX) y Brave traen el reconocedor pero no el servicio
 * que convierte la voz en texto: parece escuchar y nunca entiende nada. */
const navegadorSinServicioDeVoz = /\bOPR\//.test(navigator.userAgent)
  ? 'Opera'
  : 'brave' in navigator
    ? 'Brave'
    : null

/** Por qué no se puede hablar con Coli en este navegador, o null si se puede. */
export const MOTIVO_SIN_VOZ: string | null =
  !ReconocedorNativo || !('speechSynthesis' in window)
    ? 'Tu navegador no permite hablar con Coli. Abre la página en Chrome o Edge.'
    : navegadorSinServicioDeVoz
      ? `${navegadorSinServicioDeVoz} no trae reconocimiento de voz, así que Coli no puede entenderte aquí. Abre la página en Chrome o Edge.`
      : null

export const MENSAJE_MICROFONO_BLOQUEADO =
  'Este navegador tiene bloqueado el micrófono para la página, así que Coli no puede oírte. Ábrela en Chrome o Edge y permite el micrófono (en el candado junto a la dirección).'

/** true si el navegador ya tiene el micrófono bloqueado para la página (sin preguntar nada). */
export async function microfonoBloqueado(): Promise<boolean> {
  try {
    return (await navigator.permissions.query({ name: 'microphone' as PermissionName })).state === 'denied'
  } catch {
    return false // el navegador no deja consultarlo: se sabrá al intentar escuchar
  }
}

export const MENSAJES_ERROR_VOZ: Partial<Record<SpeechRecognitionErrorCode, string>> = {
  'not-allowed': MENSAJE_MICROFONO_BLOQUEADO,
  'service-not-allowed': 'Este navegador no ofrece reconocimiento de voz. Abre la página en Chrome o Edge.',
  'no-speech': 'No te escuché. Toca el micrófono e intenta de nuevo.',
  'audio-capture': 'No encontramos un micrófono conectado.',
  network: 'El servicio de voz de este navegador no respondió. Abre la página en Chrome o Edge.',
}

/** Dictado por voz (Web Speech API, sin librerías): muestra lo que va
 * entendiendo y entrega la frase final a `onFrase`. */
export function useDictado(onFrase: (texto: string) => void) {
  const [escuchando, setEscuchando] = useState(false)
  const [parcial, setParcial] = useState('')
  const [error, setError] = useState('')
  const [bloqueado, setBloqueado] = useState(false)
  const reconocedorRef = useRef<Reconocedor | null>(null)
  const onFraseRef = useRef(onFrase)
  /** Si no se puede usar la voz aquí, el porqué (el botón lo muestra en vez de escuchar). */
  const motivo = MOTIVO_SIN_VOZ ?? (bloqueado ? MENSAJE_MICROFONO_BLOQUEADO : null)

  useEffect(() => {
    onFraseRef.current = onFrase
  })

  useEffect(() => {
    // Chrome carga las voces en diferido: pedirlas al montar deja lista la
    // voz en español para la primera respuesta leída.
    void cargarVoces()
    // Saber desde ya si el micrófono está bloqueado, para avisarlo en el botón.
    let vivo = true
    microfonoBloqueado().then((b) => vivo && setBloqueado(b))
    return () => {
      vivo = false
      reconocedorRef.current?.abort()
    }
  }, [])

  const escuchar = () => {
    if (escuchando) return
    if (motivo || !ReconocedorNativo) return setError(motivo ?? '')
    callar() // que Coli no se escuche a sí misma
    let ultimo = ''
    let enviado = false
    const reconocedor = new ReconocedorNativo()
    reconocedor.lang = 'es-CO'
    reconocedor.interimResults = true
    reconocedor.continuous = false
    reconocedor.onresult = (e) => {
      const resultados = Array.from(e.results)
      ultimo = resultados.map((r) => r[0].transcript).join('').trim()
      setParcial(ultimo)
      if (ultimo && resultados.every((r) => r.isFinal)) {
        enviado = true
        onFraseRef.current(ultimo)
      }
    }
    reconocedor.onerror = (e) => {
      if (e.error === 'not-allowed') setBloqueado(true)
      setError(MENSAJES_ERROR_VOZ[e.error] ?? 'No pudimos usar el micrófono. Intenta de nuevo.')
    }
    reconocedor.onend = () => {
      setEscuchando(false)
      setParcial('')
      // Si el navegador cortó sin marcar la frase como final, igual se envía lo entendido.
      if (!enviado && ultimo) onFraseRef.current(ultimo)
    }
    reconocedorRef.current = reconocedor
    setError('')
    setEscuchando(true)
    reconocedor.start()
  }

  const detener = () => reconocedorRef.current?.stop()

  return { motivo, escuchando, parcial, error, escuchar, detener }
}
