import { generarRespuestaChat, type RespuestaChat } from '@/domain/chat/asistenteVirtual'
import type { Pedido } from '@/domain/tienda/types'
import { ReconocedorNativo, crearFrase, type Reconocedor } from './voz'

export type EstadoLlamada = 'conectando' | 'escuchando' | 'pensando' | 'hablando' | 'finalizada' | 'error'

export interface TurnoLlamada {
  autor: 'coli' | 'usuario'
  texto: string
  /** Respuesta completa (con su enlace) para dejarla en el chat al colgar. */
  respuesta?: RespuestaChat
}

export interface ControlLlamada {
  colgar: () => void
  silenciar: (silenciado: boolean) => void
}

interface OpcionesLlamada {
  nombre: string
  pedidos: Pedido[]
  /** Al abortar (ej. se cierra el panel) la llamada se cuelga sola. */
  signal: AbortSignal
  onEstado: (estado: EstadoLlamada) => void
  onTurno: (turno: TurnoLlamada) => void
  onSegundos: (segundos: number) => void
  /** 0 a 1: volumen del micrófono (barras) y de la voz de Coli (boca del avatar). */
  onNivelMicro: (nivel: number) => void
  onNivelVoz: (nivel: number) => void
  onAviso: (mensaje: string) => void
}

const AVISO_SEGUNDOS = 4 * 60
const LIMITE_SEGUNDOS = 5 * 60
/** Errores del reconocedor que solo significan "no se oyó nada": se vuelve a escuchar. */
const ERRORES_PASAJEROS: string[] = ['no-speech', 'aborted']

/**
 * Llamada de voz manos libres con Coli, solo con APIs del navegador (sin
 * proveedor externo ni claves): escucha una frase, la responde con el mismo
 * motor del chat —que solo atiende temas de la tienda— y la lee en voz alta;
 * luego vuelve a escuchar, hasta colgar o llegar a los 5 minutos.
 */
export async function iniciarLlamada(op: OpcionesLlamada): Promise<ControlLlamada> {
  const Reconocer = ReconocedorNativo
  if (!Reconocer) throw new Error('Tu navegador no permite llamadas de voz. Prueba con Chrome o Edge.')

  let microfono: MediaStream
  try {
    microfono = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    throw new Error('Permite el acceso al micrófono para llamar a Coli.')
  }
  if (op.signal.aborted) {
    microfono.getTracks().forEach((pista) => pista.stop())
    throw new DOMException('Llamada cancelada', 'AbortError')
  }

  // Volumen del micrófono para las barras del panel.
  const audio = new AudioContext()
  void audio.resume()
  const analizador = audio.createAnalyser()
  analizador.fftSize = 512
  audio.createMediaStreamSource(microfono).connect(analizador)
  const muestras = new Uint8Array(analizador.fftSize)

  let activa = true
  let silenciada = false
  let hablando = false
  let reconocedor: Reconocedor | null = null
  let boca: number | undefined
  let avisado = false
  const inicio = Date.now()

  const medirMicrofono = window.setInterval(() => {
    analizador.getByteTimeDomainData(muestras)
    let suma = 0
    for (const m of muestras) suma += ((m - 128) / 128) ** 2
    op.onNivelMicro(silenciada ? 0 : Math.min(1, Math.sqrt(suma / muestras.length) * 5))
  }, 80)

  const reloj = window.setInterval(() => {
    const segundos = Math.floor((Date.now() - inicio) / 1000)
    op.onSegundos(segundos)
    if (!avisado && segundos >= AVISO_SEGUNDOS) {
      avisado = true
      op.onAviso('La llamada se cierra en un minuto. Puedes volver a llamar cuando quieras.')
    }
    if (segundos >= LIMITE_SEGUNDOS) colgar()
  }, 1000)

  op.signal.addEventListener('abort', () => colgar())

  function colgar(estadoFinal: EstadoLlamada = 'finalizada') {
    if (!activa) return
    activa = false
    window.clearInterval(reloj)
    window.clearInterval(medirMicrofono)
    window.clearInterval(boca)
    reconocedor?.abort()
    // Solo calla la voz si la que suena es la de esta llamada.
    if (hablando) window.speechSynthesis.cancel()
    microfono.getTracks().forEach((pista) => pista.stop())
    void audio.close()
    op.onNivelMicro(0)
    op.onNivelVoz(0)
    op.onEstado(estadoFinal)
  }

  function decir(texto: string, despues: () => void) {
    op.onEstado('hablando')
    hablando = true
    // La síntesis de voz no expone su volumen: la boca se anima mientras habla.
    boca = window.setInterval(() => op.onNivelVoz(0.25 + Math.random() * 0.6), 110)
    const frase = crearFrase(texto)
    // Chrome a veces no dispara `end` en frases largas: no dejar la llamada colgada.
    const respaldo = window.setTimeout(terminar, Math.max(5000, texto.split(/\s+/).length * 550))
    function terminar() {
      if (!hablando) return
      hablando = false
      window.clearInterval(boca)
      window.clearTimeout(respaldo)
      op.onNivelVoz(0)
      if (activa) despues()
    }
    frase.onend = terminar
    frase.onerror = terminar
    window.speechSynthesis.speak(frase)
  }

  function escuchar() {
    if (!activa) return
    op.onEstado('escuchando')
    if (silenciada) return // se retoma al activar el micrófono
    let entendido = ''
    let fallo = ''
    const nuevo = new Reconocer!()
    nuevo.lang = 'es-CO'
    nuevo.interimResults = false
    nuevo.continuous = false
    nuevo.onresult = (e) => {
      entendido = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('')
        .trim()
    }
    nuevo.onerror = (e) => {
      if (ERRORES_PASAJEROS.includes(e.error)) return
      fallo =
        e.error === 'network'
          ? 'El reconocimiento de voz necesita conexión a internet.'
          : 'No pudimos usar el micrófono. Intenta llamar de nuevo.'
    }
    nuevo.onend = () => {
      reconocedor = null
      if (!activa) return
      if (fallo) {
        op.onAviso(fallo)
        colgar('error')
      } else if (entendido) {
        responder(entendido)
      } else {
        escuchar() // silencio: sigue escuchando
      }
    }
    reconocedor = nuevo
    nuevo.start()
  }

  function responder(texto: string) {
    op.onTurno({ autor: 'usuario', texto })
    op.onEstado('pensando')
    const respuesta = generarRespuestaChat(texto, op.pedidos, op.nombre)
    window.setTimeout(() => {
      if (!activa) return
      op.onTurno({ autor: 'coli', texto: respuesta.texto, respuesta })
      decir(respuesta.texto, escuchar)
    }, 700)
  }

  const saludo = `Hola ${op.nombre.split(' ')[0]}, soy Coli, el asistente de COLORLINK. ¿En qué te ayudo con tu proyecto?`
  op.onTurno({ autor: 'coli', texto: saludo })
  decir(saludo, escuchar)

  return {
    colgar: () => colgar(),
    silenciar: (silenciado) => {
      silenciada = silenciado
      microfono.getAudioTracks().forEach((pista) => (pista.enabled = !silenciado))
      if (silenciado) reconocedor?.abort()
      else if (activa && !hablando && !reconocedor) escuchar()
    },
  }
}
