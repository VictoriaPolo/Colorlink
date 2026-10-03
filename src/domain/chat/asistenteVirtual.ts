import type { Pedido } from '@/domain/tienda/types'

export interface RespuestaChat {
  texto: string
  ruta?: string
  etiquetaRuta?: string
}

/** Preguntas sugeridas al abrir el chat, iguales en espíritu a las de Pintu
 * (el asistente del sitio de referencia): pedido, qué pintura usar y tienda. */
export const PREGUNTAS_SUGERIDAS = ['¿Dónde va mi pedido?', '¿Qué pintura uso?', '¿Dónde queda la tienda?']

function saludoSegunHora(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/**
 * Asistente conversacional basado en reglas (mismo enfoque "placeholder de IA"
 * que recommendationEngine.ts): interpreta palabras clave del mensaje y responde
 * con el producto, kit o página de COLORLINK correspondiente. Aislado a propósito
 * para que en el futuro pueda reemplazarse por una llamada a un modelo real sin
 * tocar el componente de UI — misma firma, misma forma de salida.
 *
 * `pedidos` es opcional y lo resuelve quien llama (el widget, con el email del
 * usuario autenticado): esta función se mantiene pura y sin acceso a datos,
 * igual que el resto de domain/.
 */
export function generarRespuestaChat(mensajeUsuario: string, pedidos: Pedido[] = [], nombreUsuario?: string): RespuestaChat {
  const m = mensajeUsuario.toLowerCase()

  const contiene = (...palabras: string[]) => palabras.some((p) => m.includes(p))

  if (contiene('hola', 'buenas', 'buenos días', 'buenos dias', 'buenas tardes', 'buenas noches')) {
    const nombre = nombreUsuario ? `, ${nombreUsuario.split(' ')[0].toUpperCase()}` : ''
    return {
      texto:
        `${saludoSegunHora()}${nombre}. Soy Coli, el asistente de COLORLINK. Te ayudo con tus pedidos, con qué pintura usar y con cuánta necesitas. Reviso lo que tengo disponible, así que si algo no lo sé te lo digo y te oriento con la persona indicada.`,
    }
  }

  if (contiene('pedido', 'orden de compra', 'mi compra', 'envío', 'envio', 'donde va')) {
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

  if (contiene('fachada', 'exterior', 'muro exterior')) {
    return {
      texto:
        'Para fachadas exteriores recomendamos Koraza 5 Años Protección Total, con resistencia UV y antihongos. Si además tiene fisuras, el Kit de Fachada Exterior incluye Masilla Elastomérica + Sellador Antialcalino + Koraza.',
      ruta: '/',
      etiquetaRuta: 'Ver kits de solución',
    }
  }

  if (contiene('humedad', 'moho', 'filtracion', 'filtración', 'mancha')) {
    return {
      texto:
        'Para humedad y moho en muros te recomiendo Aquablock Fibratado, un impermeabilizante elastomérico. Tenemos un kit completo con estuco impermeabilizante y sellador antihongos.',
      ruta: '/',
      etiquetaRuta: 'Ver kits de solución',
    }
  }

  if (contiene('gotera', 'terraza', 'techo', 'azotea', 'losa')) {
    return {
      texto:
        'Para goteras y terrazas transitables, Aquablock Fibratado con manto reforzado resuelve el encharcamiento y protege contra rayos UV.',
      ruta: '/',
      etiquetaRuta: 'Ver kits de solución',
    }
  }

  if (contiene('oxido', 'óxido', 'metal', 'reja', 'verja', 'oxidado')) {
    return {
      texto:
        'Para metales oxidados, Pintulux 3 en 1 Anticorrosivo + Esmalte convierte el óxido y da acabado brillante en un solo paso.',
      ruta: '/',
      etiquetaRuta: 'Ver kits de solución',
    }
  }

  if (contiene('madera')) {
    return { texto: 'Para madera (interior o exterior) usa Madetec Protector para Madera, resistente a la intemperie.' }
  }

  if (contiene('concreto', 'cemento', 'mampostería', 'mamposteria')) {
    return { texto: 'Para superficies de concreto o mampostería, Vinilico Concreto es el sellador recomendado.' }
  }

  if (contiene('interior', 'sala', 'cuarto', 'habitación', 'habitacion', 'cocina', 'alcoba')) {
    return {
      texto: 'Para interiores, Viniltex es nuestra pintura vinílica de bajo olor y alta cubrición. Viniltex Multiuso es una opción más económica para primeros proyectos.',
      ruta: '/catalogo',
      etiquetaRuta: 'Ver catálogo de interiores',
    }
  }

  if (contiene('precio', 'cuesta', 'vale', 'costo')) {
    return {
      texto: 'Los precios van desde $68.900 (Masilla Elastomérica) hasta $145.900 por galón, según el producto. Puedes ver todos los precios en el catálogo.',
      ruta: '/catalogo',
      etiquetaRuta: 'Ir al catálogo',
    }
  }

  if (contiene('galon', 'galón', 'cuanto necesito', 'cuánto necesito', 'metro', 'm2', 'm²', 'rendimiento')) {
    return {
      texto: 'Calculamos 35 m² de cubrimiento por galón. Dime el área de tu espacio en la calculadora y te digo exactamente cuántos galones necesitas.',
      ruta: '/calculadora',
      etiquetaRuta: 'Abrir calculadora',
    }
  }

  if (contiene('color', 'tono', 'simular', 'simulador', 'paleta')) {
    return {
      texto: 'Puedes probar en vivo cómo se vería tu espacio (interior o exterior) con distintos tonos Pintuco en el simulador de color.',
      ruta: '/simulador',
      etiquetaRuta: 'Abrir simulador',
    }
  }

  if (contiene('retiro', 'tienda física', 'tienda fisica', 'dónde', 'donde recojo', 'sucursal')) {
    return {
      texto: 'Tenemos puntos de retiro con entrega en 2 horas. Consulta la dirección y horario más cercano a ti.',
      ruta: '/puntos-de-retiro',
      etiquetaRuta: 'Ver puntos de retiro',
    }
  }

  if (contiene('gracias')) {
    return { texto: '¡Con gusto! Si necesitas otra recomendación aquí estoy.' }
  }

  return {
    texto:
      'Cuéntame más: ¿es fachada, humedad, goteras, metal oxidado, madera, concreto o interior? También puedo ayudarte con precios, galones o el simulador de color.',
  }
}
