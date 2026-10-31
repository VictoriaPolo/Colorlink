import { normalizar } from '@/domain/texto'
import { readStorage, writeStorage } from '@/data/repositories/storage'
import { dividirEnFrases, limitarFrases, textoParaVoz } from './textoParaVoz'

/**
 * La voz de Coli, solo con la síntesis del navegador (sin claves ni servicios
 * externos). Lo que cambia cuánto suena a persona es la voz que se elige: Edge
 * trae voces neuronales ("Online (Natural)", con Gonzalo y Salomé de Colombia);
 * Chrome en Windows solo trae Raul y Sabina, del sistema. Por eso se elige la
 * mejor voz disponible en vez de la primera en español.
 */

export type Tono = 'natural' | 'jarvis'

export interface PerfilVoz {
  /** `voiceURI` de la voz elegida; null = la mejor que tenga el navegador. */
  voiceURI: string | null
  tono: Tono
}

/** Ritmo y tono de voz. JARVIS: más pausado y algo más grave, como un mayordomo digital sereno. */
export const TONOS: Record<Tono, { nombre: string; descripcion: string; rate: number; pitch: number }> = {
  natural: { nombre: 'Natural', descripcion: 'Cálida y cercana', rate: 1, pitch: 1 },
  jarvis: { nombre: 'JARVIS', descripcion: 'Serena, precisa y con aplomo', rate: 0.96, pitch: 0.92 },
}

export const PERFIL_INICIAL: PerfilVoz = { voiceURI: null, tono: 'jarvis' }
const CLAVE_PERFIL = 'colorlink:voz-coli'

export const leerPerfil = (): PerfilVoz => ({ ...PERFIL_INICIAL, ...readStorage<Partial<PerfilVoz>>(CLAVE_PERFIL, 1) })
export const guardarPerfil = (perfil: PerfilVoz) => writeStorage(CLAVE_PERFIL, 1, perfil)

/** Lo que se usa de una voz (así se prueba con objetos simples). */
export type Voz = Pick<SpeechSynthesisVoice, 'name' | 'lang' | 'voiceURI'>

export const esEspanol = (voz: Voz) => /^es([-_]|$)/i.test(voz.lang)

/** Nombres propios de las voces masculinas más comunes (Windows, Edge, macOS, Android). */
const MASCULINA =
  /\b(gonzalo|tomas|marcelo|lorenzo|juan|manuel|emilio|luis|alvaro|javier|andres|carlos|jorge|federico|roberto|alex|victor|mario|rodrigo|alonso|mateo|sebastian|raul|pablo|diego|antonio|miguel|david|pedro|enrique|fernando|francisco|jose|alberto|ricardo|sergio|hugo|oscar|eddy|reed|rocko|male|hombre)\b/

const textoDeVoz = (voz: Voz) => normalizar(`${voz.name} ${voz.voiceURI}`)

/** Qué tan humana suena: neuronal ("Natural", Premium, Siri), de red (Google) o del sistema. */
export function calidadDeVoz(voz: Voz): 'alta' | 'media' | 'basica' {
  const texto = textoDeVoz(voz)
  if (/natural|neural|premium|enhanced|mejorada|siri/.test(texto)) return 'alta'
  return /google|network/.test(texto) ? 'media' : 'basica'
}

/** Más puntos = mejor voz para Coli: calidad primero, luego el español de Colombia y una voz masculina. */
export function puntajeDeVoz(voz: Voz): number {
  const lang = voz.lang.toLowerCase().replace('_', '-')
  const texto = textoDeVoz(voz)
  let puntos = lang === 'es-co' ? 30 : ['es-mx', 'es-us', 'es-419'].includes(lang) ? 18 : lang === 'es-es' ? 6 : 10
  const calidad = calidadDeVoz(voz)
  puntos += calidad === 'alta' ? (/natural/.test(texto) ? 60 : 50) : calidad === 'media' ? 40 : 0
  if (/espeak/.test(texto)) puntos -= 50
  if (/online/.test(texto)) puntos += 10
  if (MASCULINA.test(texto)) puntos += 30
  return puntos
}

/** Las voces en español, de la mejor a la menos buena. */
export const ordenarVoces = <T extends Voz>(voces: T[]): T[] =>
  voces.filter(esEspanol).sort((a, b) => puntajeDeVoz(b) - puntajeDeVoz(a))

/** La voz guardada si el navegador todavía la tiene; si no, la mejor en español. */
export function elegirVoz<T extends Voz>(voces: T[], preferida: string | null): T | null {
  const espanol = ordenarVoces(voces)
  return espanol.find((v) => v.voiceURI === preferida) ?? espanol[0] ?? null
}

/** Qué decirle a quien tiene una voz poco humana: la solución es el navegador, no la página. */
export function pistaDeCalidad(voz: Voz | null, enEdge: boolean): string | null {
  if (!voz) return 'Este navegador no trae voces en español, así que Coli no puede hablar aquí. Prueba con Microsoft Edge o Chrome.'
  const calidad = calidadDeVoz(voz)
  if (calidad === 'alta') return null
  if (enEdge) return 'No encontramos voces naturales. Edge las descarga por internet: revisa tu conexión y recarga la página.'
  return calidad === 'media'
    ? 'Para una voz aún más natural, abre COLORLINK en Microsoft Edge: trae voces como la de Gonzalo, de Colombia.'
    : 'Tu navegador solo trae voces básicas. En Microsoft Edge, Coli habla con voces naturales, como la de Gonzalo, de Colombia.'
}

/** "Gonzalo · Colombia · Natural", a partir de "Microsoft Gonzalo Online (Natural) - Spanish (Colombia)". */
export function etiquetaVoz(voz: Pick<Voz, 'name' | 'lang'>): string {
  const [izquierda, derecha = ''] = voz.name.replace(/^Microsoft\s+/i, '').split(' - ')
  const nombre = izquierda.replace(/\s*Online\s*\(Natural\)|\s*\(Natural\)|\s+Desktop/gi, '').trim()
  const pais = derecha.match(/\(([^)]+)\)/)?.[1] ?? voz.lang
  return `${nombre} · ${pais}${/natural|neural/i.test(voz.name) ? ' · Natural' : ''}`
}

const sintetizador = () => ('speechSynthesis' in window ? window.speechSynthesis : null)

/** Las voces del navegador llegan en diferido: espera a que aparezca alguna en español (o se rinde y usa lo que haya). */
export function cargarVoces(espera = 800): Promise<SpeechSynthesisVoice[]> {
  const sintesis = sintetizador()
  if (!sintesis) return Promise.resolve([])
  if (sintesis.getVoices().some(esEspanol)) return Promise.resolve(sintesis.getVoices())
  return new Promise((resolve) => {
    const plazo = window.setTimeout(terminar, espera)
    function alCambiar() {
      if (sintesis!.getVoices().some(esEspanol)) terminar()
    }
    function terminar() {
      window.clearTimeout(plazo)
      sintesis!.removeEventListener('voiceschanged', alCambiar)
      resolve(sintesis!.getVoices())
    }
    sintesis.addEventListener('voiceschanged', alCambiar)
  })
}

export interface OpcionesHabla {
  /** Si la respuesta es larga, dice solo el principio y avisa que el resto quedó escrito (llamada). */
  resumir?: boolean
  /** Voz y tono a usar; por defecto, los que guardó la persona. */
  perfil?: PerfilVoz
  /** Terminó de hablar (no se llama si se canceló). */
  onFin?: () => void
  /** Cada palabra que la voz va diciendo (no todas las voces lo avisan). */
  onPalabra?: () => void
}

export interface HablaEnCurso {
  cancelar: () => void
}

/** Cuenta cada vez que algo empieza o se corta la voz: una lectura vieja no debe hablar ni avisar que terminó. */
let generacion = 0

/** Lee el texto en voz alta, frase por frase. Reemplaza lo que se estuviera diciendo. */
export function hablarTexto(texto: string, op: OpcionesHabla = {}): HablaEnCurso {
  const sintesis = sintetizador()
  const mia = ++generacion
  let cancelada = false
  const habla: HablaEnCurso = {
    cancelar() {
      cancelada = true
      sintesis?.cancel()
    },
  }
  if (!sintesis) {
    op.onFin?.()
    return habla
  }
  sintesis.cancel()

  void cargarVoces().then((voces) => {
    if (cancelada || generacion !== mia) return
    const perfil = op.perfil ?? leerPerfil()
    const voz = elegirVoz(voces, perfil.voiceURI)
    const { rate, pitch } = TONOS[perfil.tono]
    let frases = dividirEnFrases(textoParaVoz(texto))
    if (op.resumir) {
      const corta = limitarFrases(frases)
      frases = corta.recortado ? [...corta.frases, 'El resto quedó escrito en la conversación.'] : corta.frases
    }
    if (frases.length === 0) return op.onFin?.()

    const fin = () => {
      if (!cancelada && generacion === mia) op.onFin?.()
    }
    frases.forEach((frase, i) => {
      const dicha = new SpeechSynthesisUtterance(frase)
      dicha.lang = voz?.lang ?? 'es-CO'
      dicha.voice = voz
      dicha.rate = rate
      dicha.pitch = pitch
      dicha.onboundary = () => op.onPalabra?.()
      if (i === frases.length - 1) {
        dicha.onend = fin
        dicha.onerror = fin
      }
      sintesis.speak(dicha)
    })
  })
  return habla
}

/** Lee la respuesta en voz alta. */
export const hablar = (texto: string) => void hablarTexto(texto)

export function callar() {
  generacion++
  sintetizador()?.cancel()
}
