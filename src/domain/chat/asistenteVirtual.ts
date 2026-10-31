import type { Pedido, Producto } from '@/domain/tienda/types'
import { ORDEN_ESTADOS, type Solicitud } from '@/domain/solicitud/types'
import { precioCunete } from '@/domain/tienda/calculadora'
import { CUPONES } from '@/domain/pagos/cupones'
import { pagoDe } from '@/domain/pagos/pasarela'
import { normalizar } from '@/domain/texto'

export interface RespuestaChat {
  texto: string
  ruta?: string
  etiquetaRuta?: string
  /** La pregunta no era de COLORLINK y se rechazó (el widget vuelve a sugerir preguntas). */
  fueraDeAlcance?: boolean
}

/** Datos del cliente que el asistente usa para responder con lo real (los
 * resuelve quien llama: esta función sigue siendo pura, sin acceso a datos). */
export interface ContextoChat {
  nombreUsuario?: string
  pedidos?: Pedido[]
  solicitudes?: Solicitud[]
  productos?: Producto[]
}

/** Preguntas sugeridas al abrir el chat, iguales en espíritu a las de Pintu
 * (el asistente del sitio de referencia): pedido, qué pintura usar y tienda. */
export const PREGUNTAS_SUGERIDAS = ['¿Dónde va mi pedido?', '¿Qué pintura uso?', '¿Cómo puedo pagar?', '¿Dónde queda la tienda?']

const ALCANCE =
  'pinturas y colores, soluciones para fachadas, humedad, goteras o metal oxidado, cuánta pintura necesitas, tus pedidos y solicitudes, compras, pagos y nuestras tiendas'

/** Palabras que solo tienen sentido en la tienda: si aparecen, la pregunta es de
 * COLORLINK aunque mencione otra cosa (ej. "pintar las líneas de una cancha de fútbol"). */
const TEMA_PROPIO =
  /\b(pint\w*|pared\w*|muros?|fachadas?|galon\w*|cunetes?|impermeabiliz\w*|esmaltes?|barniz\w*|sellador\w*|masillas?|estuco\w*|koraza|viniltex|aquablock|pintulux|madetec|vinilico|pintuco|colorlink|pedidos?|carrito|kits?|humedad\w*|moho|hongos?|goteras?|filtracion\w*|oxid\w*|corrosion|fisuras?|grietas?|simulador|calculadora|retiro|solicitud\w*|diagnostic\w*|cotiza\w*)\b/

/** Palabras de la tienda que también se usan fuera de ella ("color", "precio",
 * "hora"...): cuentan como tema de la tienda solo si no hay señales de otro tema. */
const TEMA_COMPARTIDO =
  /\b(colou?r\w*|tonos?|precios?|cuest\w*|vale|valor|costos?|metros?|m2|rendimiento|rinde|interior\w*|exterior\w*|salas?|cuartos?|habitacion\w*|cocinas?|alcobas?|banos?|techos?|terrazas?|azoteas?|losas?|madera\w*|concreto|cemento|mamposteria|metal\w*|rejas?|verjas?|superficie\w*|acabados?|mate|brillante|satinado|compr\w*|pag\w*|tarjetas?|efectivo|nequi|pse|cupon\w*|comprobante\w*|factura\w*|reembols\w*|rastre\w*|envios?|domicilio\w*|entrega\w*|despacho\w*|sucursal\w*|horarios?|hora|abren|abre|cierran|cierra|atienden|atencion|direccion\w*|tiendas?|garantia\w*|descuentos?|promocion\w*|ofertas?|productos?|catalogo|recomien\w*|obras?|proyectos?|asesor\w*|visita\w*|presupuesto\w*|casas?|apartamentos?|piscinas?|pisos?|puertas?|ventanas?)\b/

/** Señales de temas ajenos a la tienda. No es exhaustiva a propósito: lo que no
 * traiga ninguna palabra de la tienda también se rechaza (ver el final). */
const OTRO_TEMA =
  /\b(futbol\w*|partidos?|gol|goles|mundial\w*|champions|liga|balon\w*|baloncesto|basquet\w*|tenis|beisbol|ciclismo|nba|messi|ronaldo|neymar|jueg\w*|jugar|presidente\w*|elecciones?|politic\w*|congreso|senado|gobierno|alcalde\w*|guerras?|peliculas?|netflix|canciones?|musica\w*|cantante\w*|actor\w*|actriz|famos\w*|novelas?|anime|videojuegos?|chistes?|clima|llover|lloviendo|noticias?|tareas?|matematica\w*|ecuacion\w*|examen\w*|traduc\w*|programacion|python|javascript|computador\w*|celular\w*|iphone|android|chatgpt|dolar\w*|euros?|bitcoin|cripto\w*|inversion\w*|prestamos?|medicos?|medicinas?|medicamentos?|enfermedad\w*|sintomas?|doctor\w*|dietas?|recetas?|cocinar|comidas?|restaurante\w*|pizzas?|hamburguesas?|viajes?|vuelos?|hotel\w*|turismo|horoscopo|zodiaco|novi[oa]s?|ropa|camisetas?|zapatos?|carros?|motos?)\b/

/** Qué producto conviene a cada superficie (para corregir con amabilidad, ej.
 * "¿el Pintulux sirve para madera?"). */
const SUPERFICIES: { patron: RegExp; superficie: string; producto: string }[] = [
  { patron: /\bmadera\w*/, superficie: 'madera', producto: 'Madetec Protector para Madera' },
  { patron: /\b(metal\w*|rejas?|verjas?|oxid\w*)\b/, superficie: 'metal', producto: 'Pintulux 3 en 1 Anticorrosivo + Esmalte' },
  { patron: /\b(interior\w*|salas?|cuartos?|habitacion\w*|cocinas?|alcobas?|banos?)\b/, superficie: 'interiores', producto: 'Viniltex' },
  { patron: /\b(fachadas?|exterior\w*)\b/, superficie: 'fachadas', producto: 'Koraza 5 Años Protección Total' },
  { patron: /\b(techos?|terrazas?|goteras?|humedad\w*)\b/, superficie: 'techos y humedad', producto: 'Aquablock Fibratado' },
  { patron: /\b(concreto|cemento|mamposteria)\b/, superficie: 'concreto', producto: 'Vinilico Concreto' },
]

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export function saludoSegunHora(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Productos que la pregunta nombra por su marca ("koraza", "viniltex multiuso"...). */
function productosMencionados(t: string, productos: Producto[]): Producto[] {
  return productos.filter((p) => {
    const nombre = normalizar(p.nombre)
    if (nombre.includes('multiuso')) return /\bmultiuso\b/.test(t)
    const marca = nombre.split(' ')[0]
    if (marca === 'viniltex') return /\bviniltex\b/.test(t) && !/\bmultiuso\b/.test(t)
    return new RegExp(`\\b${marca}\\b`).test(t)
  })
}

const enCurso = (p: Pedido) => p.estado !== 'Entregado' && p.estado !== 'Cancelado'

/** Dónde va un pedido, dicho como lo diría alguien de la tienda: la etapa, qué sigue y cómo va el pago. */
function situacionDePedido(p: Pedido): string {
  const cuantos = p.items.length
  const resumen = `Tu pedido ${p.id} está "${p.estado}": ${cuantos} ${cuantos === 1 ? 'producto' : 'productos'} por un total de ${formatoCOP.format(p.total)}.`
  const queSigue: Record<string, string> = {
    Recibido: 'Ya lo recibimos y en breve empezamos a prepararlo; queda listo para retirar unas 2 horas después de recibido.',
    'En preparación': 'Estamos mezclando tus colores y alistando todo; queda listo unas 2 horas después de recibido.',
    'Listo para retiro': `¡Ya está listo! Pasa por ${p.puntoRetiro ?? 'tu tienda'}${p.codigoRetiro ? ` con tu código de retiro ${p.codigoRetiro}` : ''}.`,
    Entregado: 'Ya lo retiraste. ¡Gracias por tu compra!',
    Cancelado: 'Fue cancelado; si ya habías pagado, la tienda gestiona el reembolso.',
  }
  const pago = pagoDe(p)
  const sobreElPago = !enCurso(p)
    ? ''
    : pago.estado === 'Pendiente'
      ? ' Lo pagas al retirar.'
      : pago.estado === 'Aprobado'
        ? ` El pago ya está aprobado (${pago.detalle}).`
        : ''
  return `${resumen} ${queSigue[p.estado] ?? ''}${sobreElPago}`.replace(/\s+/g, ' ').trim()
}

function fichaProducto(p: Producto): string {
  return `${p.nombre}: ${p.descripcion} Cuesta ${formatoCOP.format(p.precio)} el galón (cuñete de 5 galones: ${formatoCOP.format(precioCunete(p.precio))}) y rinde unos ${p.rendimientoM2PorGalon} m² por galón a una mano.`
}

/**
 * Asistente conversacional basado en reglas (mismo enfoque "placeholder de IA"
 * que recommendationEngine.ts): interpreta palabras del mensaje y responde con
 * los datos reales del cliente (pedidos, solicitudes) y del catálogo. Solo
 * atiende temas de la tienda: lo demás (fútbol, política, etc.) se rechaza
 * antes de buscar una respuesta, para que una palabra suelta como "vale" o
 * "hora" no dispare una respuesta fuera de lugar. Aislado a propósito para que
 * en el futuro pueda reemplazarse por un modelo real sin tocar la UI.
 */
export function generarRespuestaChat(mensajeUsuario: string, contexto: ContextoChat = {}): RespuestaChat {
  const { nombreUsuario, pedidos = [], solicitudes = [], productos = [] } = contexto
  const t = normalizar(mensajeUsuario)
  const tiene = (patron: RegExp) => patron.test(t)
  const temaPropio = tiene(TEMA_PROPIO)

  if (tiene(OTRO_TEMA) && !temaPropio) {
    return {
      texto: `Esa pregunta no tiene que ver con COLORLINK, así que no puedo responderla. Puedo ayudarte con ${ALCANCE}. ¿Qué necesitas para tu proyecto?`,
      fueraDeAlcance: true,
    }
  }

  // Los pagos y el comprobante se preguntan junto con "mi pedido": se atienden antes para que no los gane el rastreo.
  if (tiene(/\b(comprobante\w*|factura\w*)\b/)) {
    const reciente = pedidos[0]
    return {
      texto: 'En el detalle de tu pedido descargas el comprobante en PDF, con el código de retiro, los productos y el pago. Es un comprobante de práctica: no es una factura.',
      ruta: reciente ? `/pedidos/${reciente.id}` : '/mis-solicitudes?seccion=pedidos',
      etiquetaRuta: reciente ? 'Abrir mi pedido' : 'Ver mis pedidos',
    }
  }

  if (tiene(/\b(cupon\w*|codigo (de|para) descuento|codigo promocional)\b/)) {
    return {
      // Una frase por cupón: así la voz respira entre uno y otro en vez de cortar a media descripción.
      texto: `Tenemos estos cupones. ${CUPONES.map((c) => `${c.codigo}: ${c.descripcion}.`).join(' ')} Los escribes en el carrito, antes de pagar.`,
      ruta: '/carrito',
      etiquetaRuta: 'Ir al carrito',
    }
  }

  if (tiene(/\b(rechaz\w*|declin\w*|no pasa|no paso|fondos|no me deja pagar)\b/) && tiene(/\b(pago|pagar|tarjeta\w*|compra)\b/)) {
    return {
      texto: 'Esta es una pasarela de práctica: solo acepta tarjetas de prueba y rechaza las reales. Prueba con la Visa 4242 4242 4242 4242, cualquier fecha futura y cualquier código de 3 números, o paga con PSE, Nequi o al retirar.',
      ruta: '/carrito',
      etiquetaRuta: 'Ir al carrito',
    }
  }

  if (tiene(/\b(seguro|segura|seguridad|guardan|almacenan)\b/) && tiene(/\b(pag\w*|tarjeta\w*|datos)\b/)) {
    return {
      texto: 'No guardamos el número de tu tarjeta ni el código de seguridad: de cada pago solo queda la marca, los últimos cuatro dígitos y la referencia. Además, esta pasarela es de práctica y no cobra dinero real.',
    }
  }

  if (tiene(/\b(cancel\w*|anular|reembols\w*|devolu\w*|devuelv\w*)\b/) && tiene(/\b(pedido|compra|orden|pago)\b/)) {
    return {
      texto: 'Para cancelar un pedido o pedir un reembolso, avísale al equipo de la tienda donde lo retiras antes de que esté listo. Ellos lo cancelan y registran la devolución del pago, y lo ves en el detalle de tu pedido.',
      ruta: '/puntos-de-retiro',
      etiquetaRuta: 'Ver tiendas',
    }
  }

  if (tiene(/\b(formas?|medios?|metodos?) de pago\b|\bcomo (puedo |se |lo )?pag\w*|\bpuedo pagar\b|\baceptan (tarjeta\w*|nequi|pse|efectivo|pagos?|debito|credito)\b|\b(pago|pagar|paga) (con|por) (tarjeta|nequi|pse|efectivo|debito|credito)\b/)) {
    return {
      texto: 'Puedes pagar con tarjeta, PSE o Nequi, o dejar el pedido para pagarlo al retirar en la tienda. Es una pasarela de práctica: no se cobra dinero real ni guardamos tu tarjeta. Si tienes un cupón, lo aplicas en el carrito.',
      ruta: '/carrito',
      etiquetaRuta: 'Ir al carrito',
    }
  }

  if (tiene(/\b(mis? pedidos?|el pedido|estado del pedido|donde va|cuando llega|ya llego|mi compra|mi orden|mi envio|rastre\w*|codigo de retiro)\b/)) {
    if (pedidos.length === 0) {
      return {
        texto: 'No encuentro pedidos asociados a tu cuenta todavía. Cuando confirmes uno, queda listo para retirar en tu tienda en 2 horas y lo puedes rastrear paso a paso.',
        ruta: '/catalogo',
        etiquetaRuta: 'Ir al catálogo',
      }
    }
    const pedido = pedidos.find(enCurso) ?? pedidos[0]
    const otros = pedidos.filter((p) => enCurso(p) && p !== pedido).length
    return {
      texto: `${otros > 0 ? `Tienes ${otros + 1} pedidos en curso; este es el más reciente. ` : ''}${situacionDePedido(pedido)}`,
      ruta: `/pedidos/${pedido.id}`,
      etiquetaRuta: enCurso(pedido) ? 'Rastrear mi pedido' : 'Ver mi pedido',
    }
  }

  if (tiene(/\b(mis? solicitud\w*|mis? proyectos?|mi obra|mi diagnostico|estado de (la|mi) solicitud|como va|en que va|seguimiento|avance)\b/)) {
    const proyecto = solicitudes.find((s) => s.estado !== 'Finalizada') ?? solicitudes[0]
    if (!proyecto) {
      return {
        texto: 'Aún no tienes solicitudes. Si quieres, haz el diagnóstico de superficie y te damos la solución recomendada con cantidades.',
        ruta: '/solicitar',
        etiquetaRuta: 'Iniciar diagnóstico',
      }
    }
    const activas = solicitudes.filter((s) => s.estado !== 'Finalizada').length
    const paso = ORDEN_ESTADOS.indexOf(proyecto.estado) + 1
    return {
      texto: `${activas > 1 ? `Tienes ${activas} solicitudes activas. La más reciente, ` : 'Tu solicitud '}${proyecto.id} (${proyecto.data.proyecto.tipoObra} en ${proyecto.data.proyecto.ciudad}) está "${proyecto.estado}", paso ${paso} de ${ORDEN_ESTADOS.length}. El sistema recomendado es ${proyecto.recomendacion.producto}.`,
      ruta: `/mis-solicitudes/${proyecto.id}`,
      etiquetaRuta: 'Ver mi solicitud',
    }
  }

  if (tiene(/\b(diagnostic\w*|asesor\w*|cotiza\w*|visita\w*|presupuesto\w*)\b/)) {
    return {
      texto: 'Para una solución a tu medida, haz el diagnóstico de superficie (toma unos minutos): describes la superficie y el problema, recibes la recomendación con cantidades y un asesor técnico la revisa y te contacta.',
      ruta: '/solicitar',
      etiquetaRuta: 'Iniciar diagnóstico',
    }
  }

  const mencionados = productosMencionados(t, productos)
  if (mencionados.length > 0) {
    const sugerencia = SUPERFICIES.find((s) => tiene(s.patron) && !mencionados.some((p) => p.nombre === s.producto))
    const texto = [
      ...mencionados.slice(0, 2).map(fichaProducto),
      sugerencia ? `Para ${sugerencia.superficie} te recomiendo ${sugerencia.producto}.` : '',
    ]
      .filter(Boolean)
      .join(' ')
    return mencionados.length === 1
      ? { texto, ruta: `/catalogo?q=${encodeURIComponent(mencionados[0].nombre)}`, etiquetaRuta: `Ver ${mencionados[0].nombre}` }
      : { texto, ruta: '/catalogo', etiquetaRuta: 'Comparar en el catálogo' }
  }

  if (tiene(/\b(grietas?|fisuras?|agrietad\w*)\b/)) {
    return {
      texto: 'Para grietas y fisuras, primero sella con Masilla Elastomérica (es flexible y acompaña el movimiento) y luego pinta con Koraza. El Kit de Fachada Exterior trae todo: Masilla Elastomérica + Sellador Antialcalino + Koraza.',
      ruta: '/?kit=Fachada exterior',
      etiquetaRuta: 'Ver kit de fachada',
    }
  }

  if (tiene(/\b(fachadas?|exterior\w*)\b/)) {
    return {
      texto:
        'Para fachadas exteriores recomendamos Koraza 5 Años Protección Total, con resistencia UV y antihongos. Si además tiene fisuras, el Kit de Fachada Exterior incluye Masilla Elastomérica + Sellador Antialcalino + Koraza.',
      ruta: '/?kit=Fachada exterior',
      etiquetaRuta: 'Ver kit de fachada',
    }
  }

  if (tiene(/\b(humedad\w*|moho|hongos?|filtracion\w*|manchas?|salitre)\b/)) {
    return {
      texto:
        'Para humedad y moho en muros te recomiendo Aquablock Fibratado, un impermeabilizante elastomérico. Tenemos un kit completo con estuco impermeabilizante y sellador antihongos.',
      ruta: '/?kit=Humedad y moho',
      etiquetaRuta: 'Ver kit de humedad',
    }
  }

  if (tiene(/\b(goteras?|terrazas?|techos?|azoteas?|losas?|impermeabiliz\w*)\b/)) {
    return {
      texto:
        'Para goteras, techos y terrazas transitables, Aquablock Fibratado con manto reforzado resuelve el encharcamiento y protege contra rayos UV.',
      ruta: '/?kit=Goteras y terrazas',
      etiquetaRuta: 'Ver kit de techos',
    }
  }

  if (tiene(/\b(oxid\w*|metal\w*|rejas?|verjas?|corrosion|portones?)\b/)) {
    return {
      texto:
        'Para metal y rejas, Pintulux 3 en 1 Anticorrosivo + Esmalte convierte el óxido y da acabado brillante en un solo paso, sin base previa.',
      ruta: '/?kit=Metales oxidados',
      etiquetaRuta: 'Ver kit de metales',
    }
  }

  if (tiene(/\bmadera\w*/)) {
    return { texto: 'Para madera (interior o exterior) usa Madetec Protector para Madera, resistente a la intemperie.', ruta: '/catalogo?q=Madetec', etiquetaRuta: 'Ver Madetec' }
  }

  if (tiene(/\b(concreto|cemento|mamposteria)\b/)) {
    return { texto: 'Para superficies de concreto o mampostería, Vinilico Concreto es el sellador recomendado.', ruta: '/catalogo?q=Vinilico', etiquetaRuta: 'Ver Vinilico Concreto' }
  }

  if (tiene(/\b(interior\w*|salas?|cuartos?|habitacion\w*|cocinas?|alcobas?|banos?)\b/)) {
    return {
      texto: 'Para interiores, Viniltex es nuestra pintura vinílica de bajo olor y alta cubrición. Viniltex Multiuso es una opción más económica para primeros proyectos.',
      ruta: '/catalogo?q=interior',
      etiquetaRuta: 'Ver pinturas de interior',
    }
  }

  if (tiene(/\bkits?\b/)) {
    return {
      texto: 'Tenemos kits de solución para fachadas con fisuras, humedad y moho, goteras y terrazas, y rejas oxidadas, con hasta 15% de descuento. Cada kit trae todos los productos del sistema.',
      ruta: '/?kit=Fachada exterior',
      etiquetaRuta: 'Ver kits de solución',
    }
  }

  if (tiene(/\b(pagar|pago\w*|tarjetas?|efectivo|nequi|pse|debito|credito)\b/)) {
    return {
      texto: 'Puedes pagar con tarjeta, PSE o Nequi, o dejar el pedido para pagarlo al retirar en la tienda. Es una pasarela de práctica: no se cobra dinero real ni guardamos tu tarjeta.',
      ruta: '/carrito',
      etiquetaRuta: 'Ir al carrito',
    }
  }

  if (tiene(/\b(compr\w*|carrito)\b/)) {
    return {
      texto: 'Para comprar: agrega los productos al carrito desde el catálogo (en galón o cuñete), paga con tarjeta, PSE, Nequi o al retirar, y sigue tu pedido paso a paso hasta que lo retires en tu tienda en 2 horas.',
      ruta: '/catalogo',
      etiquetaRuta: 'Ir al catálogo',
    }
  }

  if (tiene(/\b(domicilio\w*|envios?|enviar|envian|despacho\w*|entrega\w*|llevan)\b/)) {
    return {
      texto: 'Por ahora trabajamos con retiro en tienda: tu pedido queda listo en 2 horas en el punto que elijas, con el color ya mezclado.',
      ruta: '/puntos-de-retiro',
      etiquetaRuta: 'Elegir tienda de retiro',
    }
  }

  if (tiene(/\b(descuentos?|promocion\w*|ofertas?|rebaja\w*|barat\w*|economic\w*)\b/)) {
    return {
      texto: 'Los kits de solución tienen hasta 15% de descuento y el cuñete de 5 galones sale 12% más barato que 5 galones sueltos. Si buscas algo económico, Viniltex Multiuso es la opción de entrada.',
      ruta: '/?kit=Fachada exterior',
      etiquetaRuta: 'Ver kits con descuento',
    }
  }

  if (tiene(/\bgarantia\w*/)) {
    return {
      texto: 'Las pinturas tienen garantía directa de fábrica Pintuco, de 5 a 8 años según el sistema: por ejemplo, Koraza 5 Años Protección Total cubre 5 años en fachadas.',
    }
  }

  if (tiene(/\b(precios?|cuest\w*|vale|valor|costos?)\b/)) {
    const desde = productos.length > 0 ? Math.min(...productos.map((p) => p.precio)) : 0
    return {
      texto: desde
        ? `Los galones van desde ${formatoCOP.format(desde)} según el producto, y el cuñete de 5 galones sale 12% más barato. Dime cuál te interesa (Koraza, Viniltex, Aquablock...) y te doy su precio exacto.`
        : 'Dime qué producto te interesa (Koraza, Viniltex, Aquablock...) y te doy su precio; también puedes verlos todos en el catálogo.',
      ruta: '/catalogo',
      etiquetaRuta: 'Ver precios en el catálogo',
    }
  }

  if (tiene(/\b(galon\w*|cunetes?|cuanto necesito|cuanta pintura|metros?|m2|rendimiento|rinde|calcul\w*)\b/)) {
    return {
      texto: 'Cada pintura rinde distinto: por ejemplo, Viniltex cubre unos 30 m² por galón y Koraza unos 22 m², a una mano. Dime el área en la calculadora y te digo exactamente cuántos galones y cuñetes necesitas.',
      ruta: '/calculadora',
      etiquetaRuta: 'Abrir calculadora',
    }
  }

  if (tiene(/\b(colou?r\w*|tonos?|simula\w*|paleta\w*)\b/)) {
    return {
      texto: 'Puedes probar en vivo cómo se vería tu espacio (interior o exterior) con distintos tonos Pintuco en el simulador de color, incluida la colección Tendencias 2026.',
      ruta: '/simulador',
      etiquetaRuta: 'Abrir simulador',
    }
  }

  if (tiene(/\b(horarios?|hora|abren|abre|cierran|cierra|atienden|atencion)\b/)) {
    return {
      texto: 'La mayoría de nuestras tiendas atiende de lunes a sábado, de 8:00 a. m. a 6:00 p. m. Revisa el horario exacto de cada una en los puntos de retiro.',
      ruta: '/puntos-de-retiro',
      etiquetaRuta: 'Ver horarios',
    }
  }

  if (tiene(/\b(retiro|tiendas?|sucursal\w*|donde (queda|quedan|esta|estan|recojo)|direccion\w*)\b/)) {
    return {
      texto: 'Tenemos puntos de retiro en Barranquilla, Bogotá, Medellín y Cali, con tu pedido listo en 2 horas. Ahí ves la dirección y el horario de cada uno.',
      ruta: '/puntos-de-retiro',
      etiquetaRuta: 'Ver puntos de retiro',
    }
  }

  if (tiene(/\b(productos?|catalogo|que (venden|tienen|manejan)|marcas?)\b/)) {
    const nombres = productos.map((p) => p.nombre)
    return {
      texto: nombres.length
        ? `Manejamos estas líneas Pintuco: ${nombres.join(', ')}. ¿Te cuento de alguna?`
        : 'Manejamos líneas Pintuco para interiores, fachadas, impermeabilización, metal y madera. ¿Te cuento de alguna?',
      ruta: '/catalogo',
      etiquetaRuta: 'Ver catálogo',
    }
  }

  if (tiene(/\bpint\w*/)) {
    return {
      texto: '¡Claro! Para interiores te recomiendo Viniltex y para fachadas Koraza 5 Años. Si es una superficie especial (madera, metal, techos o con humedad), dime cuál y te digo el sistema; con los m² te calculo los galones.',
      ruta: '/calculadora',
      etiquetaRuta: 'Calcular cuánta pintura necesito',
    }
  }

  if (tiene(/\b(quien eres|que eres|que (puedes|sabes) hacer|ayudame|ayuda|como funcionas)\b/)) {
    return { texto: `Soy Coli, el asistente de COLORLINK. Puedo ayudarte con ${ALCANCE}. Escríbeme, háblame por el micrófono o llámame.` }
  }

  if (tiene(/^\W*(hola|buen[oa]s|saludos|hey)\b/)) {
    const nombre = nombreUsuario ? `, ${nombreUsuario.split(' ')[0].toUpperCase()}` : ''
    return {
      texto: `${saludoSegunHora()}${nombre}. Soy Coli, el asistente de COLORLINK. Te ayudo con tus pedidos y solicitudes, con qué pintura usar y con cuánta necesitas. Solo respondo temas de la tienda; si algo no lo sé, te oriento con un asesor.`,
    }
  }

  if (tiene(/\b(gracias|muy amable)\b/)) {
    return { texto: '¡Con gusto! Si necesitas otra recomendación aquí estoy.' }
  }

  if (temaPropio || tiene(TEMA_COMPARTIDO)) {
    return {
      texto: 'No tengo ese dato exacto. Puedo ayudarte con pinturas para interiores, fachadas, humedad, techos, metal y madera, o un asesor técnico puede revisar tu caso con el diagnóstico de superficie.',
      ruta: '/solicitar',
      etiquetaRuta: 'Pedir diagnóstico',
    }
  }

  return {
    texto: `Solo puedo responder preguntas sobre COLORLINK: ${ALCANCE}. ¿En qué te ayudo?`,
    fueraDeAlcance: true,
  }
}
