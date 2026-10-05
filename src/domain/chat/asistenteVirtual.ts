import type { Pedido } from '@/domain/tienda/types'

export interface RespuestaChat {
  texto: string
  ruta?: string
  etiquetaRuta?: string
  /** La pregunta no era de COLORLINK y se rechazó (el widget vuelve a sugerir preguntas). */
  fueraDeAlcance?: boolean
}

/** Preguntas sugeridas al abrir el chat, iguales en espíritu a las de Pintu
 * (el asistente del sitio de referencia): pedido, qué pintura usar y tienda. */
export const PREGUNTAS_SUGERIDAS = ['¿Dónde va mi pedido?', '¿Qué pintura uso?', '¿Dónde queda la tienda?']

const ALCANCE =
  'pinturas y colores, soluciones para fachadas, humedad, goteras o metal oxidado, cuánta pintura necesitas, tus pedidos y nuestras tiendas'

/** Palabras que solo tienen sentido en la tienda: si aparecen, la pregunta es de
 * COLORLINK aunque mencione otra cosa (ej. "pintar las líneas de una cancha de fútbol"). */
const TEMA_PROPIO =
  /\b(pint\w*|pared\w*|muros?|fachadas?|galon\w*|cunetes?|impermeabiliz\w*|esmaltes?|barniz\w*|sellador\w*|masillas?|estuco\w*|koraza|viniltex|aquablock|pintulux|madetec|vinilico|pintuco|colorlink|pedidos?|carrito|kits?|humedad\w*|moho|hongos?|goteras?|filtracion\w*|oxid\w*|corrosion|fisuras?|grietas?|simulador|calculadora|retiro)\b/

/** Palabras de la tienda que también se usan fuera de ella ("color", "precio",
 * "metro"...): cuentan como tema de la tienda solo si no hay señales de otro tema. */
const TEMA_COMPARTIDO =
  /\b(colou?r\w*|tonos?|precios?|cuest\w*|vale|valor|costos?|metros?|m2|rendimiento|rinde|interior\w*|exterior\w*|salas?|cuartos?|habitacion\w*|cocinas?|alcobas?|banos?|techos?|terrazas?|azoteas?|losas?|madera\w*|concreto|cemento|mamposteria|metal\w*|rejas?|verjas?|superficie\w*|acabados?|mate|brillante|satinado|compras?|envios?|domicilios?|entregas?|sucursal\w*|horarios?|direccion\w*|tiendas?|garantia\w*|productos?|catalogo|recomien\w*|obras?)\b/

/** Señales de temas ajenos a la tienda. No es exhaustiva a propósito: lo que no
 * traiga ninguna palabra de la tienda también se rechaza (ver el final). */
const OTRO_TEMA =
  /\b(futbol\w*|partidos?|gol|goles|mundial\w*|champions|liga|balon\w*|baloncesto|basquet\w*|tenis|beisbol|ciclismo|nba|messi|ronaldo|neymar|presidente\w*|elecciones?|politic\w*|congreso|senado|gobierno|alcalde\w*|guerras?|peliculas?|netflix|canciones?|musica\w*|cantante\w*|actor\w*|actriz|famos\w*|novelas?|anime|videojuegos?|chistes?|clima|llover|lloviendo|noticias?|tareas?|matematica\w*|ecuacion\w*|examen\w*|traduc\w*|programacion|python|javascript|computador\w*|celular\w*|iphone|android|chatgpt|dolar\w*|euros?|bitcoin|cripto\w*|inversion\w*|prestamos?|medicos?|medicinas?|medicamentos?|enfermedad\w*|sintomas?|doctor\w*|dietas?|recetas?|cocinar|comidas?|restaurante\w*|pizzas?|hamburguesas?|viajes?|vuelos?|hotel\w*|turismo|horoscopo|zodiaco|novi[oa]s?|ropa|camisetas?|zapatos?|carros?|motos?)\b/

/** Sin tildes ni mayúsculas, para comparar palabras sin importar cómo se escriban. */
function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/²/g, '2')
}

function saludoSegunHora(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/**
 * Asistente conversacional basado en reglas (mismo enfoque "placeholder de IA"
 * que recommendationEngine.ts): interpreta palabras del mensaje y responde con
 * el producto, kit o página de COLORLINK correspondiente. Solo atiende temas de
 * la tienda: lo demás (fútbol, política, etc.) se rechaza antes de buscar una
 * respuesta, para que una palabra suelta como "vale" o "color" no dispare una
 * recomendación fuera de lugar. Aislado a propósito para que en el futuro pueda
 * reemplazarse por un modelo real sin tocar el componente de UI.
 *
 * `pedidos` es opcional y lo resuelve quien llama (el widget, con el email del
 * usuario autenticado): esta función se mantiene pura y sin acceso a datos,
 * igual que el resto de domain/.
 */
export function generarRespuestaChat(mensajeUsuario: string, pedidos: Pedido[] = [], nombreUsuario?: string): RespuestaChat {
  const t = normalizar(mensajeUsuario)
  const tiene = (patron: RegExp) => patron.test(t)
  const temaPropio = tiene(TEMA_PROPIO)

  if (tiene(OTRO_TEMA) && !temaPropio) {
    return {
      texto: `Esa pregunta no tiene que ver con COLORLINK, así que no puedo responderla. Puedo ayudarte con ${ALCANCE}. ¿Qué necesitas para tu proyecto?`,
      fueraDeAlcance: true,
    }
  }

  if (tiene(/\b(pedidos?|ordenes? de compra|mi compra|envios?|donde va)\b/)) {
    if (pedidos.length === 0) {
      return {
        texto: 'No encuentro pedidos asociados a tu cuenta todavía. Puedes armar uno desde el catálogo.',
        ruta: '/catalogo',
        etiquetaRuta: 'Ir al catálogo',
      }
    }
    const ultimo = pedidos[0]
    const totalTexto = ultimo.total.toLocaleString('es-CO')
    return {
      texto: `Tu pedido ${ultimo.id} está "${ultimo.estado}" — ${ultimo.items.length} producto(s) por un total de $${totalTexto}, del ${ultimo.fecha}.`,
    }
  }

  if (tiene(/\b(fachadas?|exterior\w*)\b/)) {
    return {
      texto:
        'Para fachadas exteriores recomendamos Koraza 5 Años Protección Total, con resistencia UV y antihongos. Si además tiene fisuras, el Kit de Fachada Exterior incluye Masilla Elastomérica + Sellador Antialcalino + Koraza.',
      ruta: '/',
      etiquetaRuta: 'Ver kits de solución',
    }
  }

  if (tiene(/\b(humedad\w*|moho|hongos?|filtracion\w*|manchas?)\b/)) {
    return {
      texto:
        'Para humedad y moho en muros te recomiendo Aquablock Fibratado, un impermeabilizante elastomérico. Tenemos un kit completo con estuco impermeabilizante y sellador antihongos.',
      ruta: '/',
      etiquetaRuta: 'Ver kits de solución',
    }
  }

  if (tiene(/\b(goteras?|terrazas?|techos?|azoteas?|losas?)\b/)) {
    return {
      texto:
        'Para goteras y terrazas transitables, Aquablock Fibratado con manto reforzado resuelve el encharcamiento y protege contra rayos UV.',
      ruta: '/',
      etiquetaRuta: 'Ver kits de solución',
    }
  }

  if (tiene(/\b(oxid\w*|metal\w*|rejas?|verjas?|corrosion)\b/)) {
    return {
      texto:
        'Para metales oxidados, Pintulux 3 en 1 Anticorrosivo + Esmalte convierte el óxido y da acabado brillante en un solo paso.',
      ruta: '/',
      etiquetaRuta: 'Ver kits de solución',
    }
  }

  if (tiene(/\bmadera\w*/)) {
    return { texto: 'Para madera (interior o exterior) usa Madetec Protector para Madera, resistente a la intemperie.' }
  }

  if (tiene(/\b(concreto|cemento|mamposteria)\b/)) {
    return { texto: 'Para superficies de concreto o mampostería, Vinilico Concreto es el sellador recomendado.' }
  }

  if (tiene(/\b(interior\w*|salas?|cuartos?|habitacion\w*|cocinas?|alcobas?|banos?)\b/)) {
    return {
      texto: 'Para interiores, Viniltex es nuestra pintura vinílica de bajo olor y alta cubrición. Viniltex Multiuso es una opción más económica para primeros proyectos.',
      ruta: '/catalogo',
      etiquetaRuta: 'Ver catálogo de interiores',
    }
  }

  if (tiene(/\b(precios?|cuest\w*|vale|valor|costos?)\b/)) {
    return {
      texto: 'Los precios van desde $68.900 (Masilla Elastomérica) hasta $145.900 por galón, según el producto. Puedes ver todos los precios en el catálogo.',
      ruta: '/catalogo',
      etiquetaRuta: 'Ir al catálogo',
    }
  }

  if (tiene(/\b(galon\w*|cunetes?|cuanto necesito|cuanta pintura|metros?|m2|rendimiento|rinde)\b/)) {
    return {
      texto: 'Cada pintura rinde distinto: por ejemplo, Viniltex cubre unos 30 m² por galón y Koraza unos 22 m², a una mano. Dime el área en la calculadora y te digo exactamente cuántos galones y cuñetes necesitas.',
      ruta: '/calculadora',
      etiquetaRuta: 'Abrir calculadora',
    }
  }

  if (tiene(/\b(colou?r\w*|tonos?|simula\w*|paleta\w*)\b/)) {
    return {
      texto: 'Puedes probar en vivo cómo se vería tu espacio (interior o exterior) con distintos tonos Pintuco en el simulador de color.',
      ruta: '/simulador',
      etiquetaRuta: 'Abrir simulador',
    }
  }

  if (tiene(/\b(retiro|tiendas?|sucursal\w*|donde (queda|quedan|esta|estan|recojo)|horarios?|direccion\w*)\b/)) {
    return {
      texto: 'Tenemos puntos de retiro con entrega en 2 horas. Consulta la dirección y horario más cercano a ti.',
      ruta: '/puntos-de-retiro',
      etiquetaRuta: 'Ver puntos de retiro',
    }
  }

  if (tiene(/\b(quien eres|que eres|que (puedes|sabes) hacer|ayudame|ayuda|como funcionas)\b/)) {
    return { texto: `Soy Coli, el asistente de COLORLINK. Puedo ayudarte con ${ALCANCE}. Escríbeme o háblame por el micrófono.` }
  }

  if (tiene(/^\W*(hola|buen[oa]s|saludos|hey)\b/)) {
    const nombre = nombreUsuario ? `, ${nombreUsuario.split(' ')[0].toUpperCase()}` : ''
    return {
      texto: `${saludoSegunHora()}${nombre}. Soy Coli, el asistente de COLORLINK. Te ayudo con tus pedidos, con qué pintura usar y con cuánta necesitas. Solo respondo temas de la tienda; si algo no lo sé, te lo digo y te oriento con la persona indicada.`,
    }
  }

  if (tiene(/\b(gracias|muy amable)\b/)) {
    return { texto: '¡Con gusto! Si necesitas otra recomendación aquí estoy.' }
  }

  if (temaPropio || tiene(TEMA_COMPARTIDO)) {
    return {
      texto:
        'Cuéntame más: ¿es fachada, humedad, goteras, metal oxidado, madera, concreto o interior? También puedo ayudarte con precios, galones o el simulador de color.',
    }
  }

  return {
    texto: `Solo puedo responder preguntas sobre COLORLINK: ${ALCANCE}. ¿En qué te ayudo?`,
    fueraDeAlcance: true,
  }
}
