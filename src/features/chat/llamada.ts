import { generarRespuestaChat, type ContextoChat, type RespuestaChat } from '@/domain/chat/asistenteVirtual'
import { MENSAJES_ERROR_VOZ, ReconocedorNativo, crearFrase, type Reconocedor } from './voz'

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
  contexto: ContextoChat
  onEstado: (estado: EstadoLlamada) => void
  onTurno: (turno: TurnoLlamada) => void
  onSegundos: (segundos: number) => void
  /** Lo que el reconocedor va entendiendo mientras hablas ('' cuando no hay nada). */
  onEscuchando: (texto: string) => void
  /** 0 a 1: actividad del micrófono (barras) y de la voz de Coli (boca del avatar). */
  onNivelMicro: (nivel: number) => void
  onNivelVoz: (nivel: number) => void
  /** Avisos al usuario ('' para quitar el aviso). */
  onAviso: (mensaje: string) => void
}

const AVISO_SEGUNDOS = 4 * 60
const LIMITE_SEGUNDOS = 5 * 60
const SILENCIOS_PARA_AVISAR = 3
/** Errores del reconocedor que solo significan "no se oyó nada": se vuelve a escuchar. */
const ERRORES_PASAJEROS: string[] = ['no-speech', 'aborted']

/**
 * Llamada de voz manos libres con Coli, solo con APIs del navegador (sin
 * proveedor externo ni claves): escucha una frase, la responde con el mismo
 * motor del chat —que solo atiende temas de la tienda— y la lee en voz alta;
 * luego vuelve a escuchar, hasta colgar o llegar a los 5 minutos.
 *
 * El micrófono lo abre solo el reconocedor de voz: abrirlo además con
 * getUserMedia (para medir el volumen) puede dejar al reconocedor sin audio en
 * algunos equipos, y la llamada se quedaría "escuchando" sin entender nada.
 */
export function iniciarLlamada(op: OpcionesLlamada): ControlLlamada {
  const Reconocer = ReconocedorNativo
  if (!Reconocer || !('speechSynthesis' in window)) {
    throw new Error('Tu navegador no permite llamadas de voz. Prueba con Chrome o Edge.')
  }

  let activa = true
  let silenciada = false
  let hablando = false
  let reconocedor: Reconocedor | null = null
  let boca: number | undefined
  let actividad: number | undefined
  let pausa: number | undefined
  let avisado = false
  let silencios = 0
  const inicio = Date.now()

  const reloj = window.setInterval(() => {
    const segundos = Math.floor((Date.now() - inicio) / 1000)
    op.onSegundos(segundos)
    if (!avisado && segundos >= AVISO_SEGUNDOS) {
      avisado = true
      op.onAviso('La llamada se cierra en un minuto. Puedes volver a llamar cuando quieras.')
    }
    if (segundos >= LIMITE_SEGUNDOS) colgar()
  }, 1000)

  function colgar(estadoFinal: EstadoLlamada = 'finalizada') {
    if (!activa) return
    activa = false
    window.clearInterval(reloj)
    window.clearInterval(boca)
    window.clearInterval(actividad)
    window.clearTimeout(pausa)
    reconocedor?.abort()
    // Solo calla la voz si la que suena es la de esta llamada.
    if (hablando) window.speechSynthesis.cancel()
    op.onEscuchando('')
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
      // Pausa corta antes de escuchar, para no captar el final de la propia voz.
      if (activa) pausa = window.setTimeout(despues, 250)
    }
    frase.onend = terminar
    frase.onerror = terminar
    window.speechSynthesis.speak(frase)
  }

  function escuchar() {
    if (!activa) return
    op.onEstado('escuchando')
    if (silenciada) return // se retoma al activar el micrófono
    let final = ''
    let parcial = ''
    let fallo = ''
    const nuevo = new Reconocer!()
    nuevo.lang = 'es-CO'
    nuevo.interimResults = true
    nuevo.continuous = false
    nuevo.onresult = (e) => {
      final = ''
      parcial = ''
      for (const r of Array.from(e.results)) {
        if (r.isFinal) final += r[0].transcript
        else parcial += r[0].transcript
      }
      op.onEscuchando(`${final}${parcial}`.trim())
    }
    nuevo.onspeechstart = () => {
      actividad = window.setInterval(() => op.onNivelMicro(0.35 + Math.random() * 0.6), 120)
    }
    nuevo.onspeechend = () => {
      window.clearInterval(actividad)
      op.onNivelMicro(0)
    }
    nuevo.onerror = (e) => {
      if (!ERRORES_PASAJEROS.includes(e.error)) {
        fallo = MENSAJES_ERROR_VOZ[e.error] ?? 'No pudimos usar el micrófono. Intenta llamar de nuevo.'
      }
    }
    nuevo.onend = () => {
      reconocedor = null
      window.clearInterval(actividad)
      op.onNivelMicro(0)
      op.onEscuchando('')
      if (!activa) return
      if (silenciada) return escuchar() // silenciado a mitad de frase: no se responde
      // Si el navegador cortó sin marcar la frase como final, igual se usa lo entendido.
      const dicho = (final || parcial).trim()
      if (fallo) {
        op.onAviso(fallo)
        colgar('error')
      } else if (dicho) {
        silencios = 0
        op.onAviso('')
        responder(dicho)
      } else {
        silencios++
        if (silencios === SILENCIOS_PARA_AVISAR) {
          op.onAviso('No logro escucharte. Revisa que el micrófono correcto esté activo y con permiso para este sitio, y habla cerca de él.')
        }
        escuchar()
      }
    }
    reconocedor = nuevo
    try {
      nuevo.start()
    } catch {
      // Otro reconocimiento (ej. el dictado del chat) aún se está cerrando: reintentar.
      reconocedor = null
      pausa = window.setTimeout(escuchar, 300)
    }
  }

  function responder(texto: string) {
    op.onTurno({ autor: 'usuario', texto })
    op.onEstado('pensando')
    const respuesta = generarRespuestaChat(texto, op.contexto)
    window.setTimeout(() => {
      if (!activa) return
      op.onTurno({ autor: 'coli', texto: respuesta.texto, respuesta })
      decir(respuesta.texto, escuchar)
    }, 700)
  }

  const nombre = op.contexto.nombreUsuario?.split(' ')[0]
  const saludo = `Hola${nombre ? ` ${nombre}` : ''}, soy Coli, el asistente de COLORLINK. ¿En qué te ayudo con tu proyecto?`
  op.onTurno({ autor: 'coli', texto: saludo })
  decir(saludo, escuchar)

  return {
    colgar: () => colgar(),
    silenciar: (silenciado) => {
      silenciada = silenciado
      if (silenciado) reconocedor?.abort()
      else if (activa && !hablando && !reconocedor) escuchar()
    },
  }
}
