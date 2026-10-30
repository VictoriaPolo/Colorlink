import type {
  CondicionActual,
  DiagnosticoImagen,
  PatologiaDetectada,
  Severidad,
  Superficie,
  ZonaAfectada,
} from '@/domain/solicitud/types'
import type { PatologiaKit } from '@/domain/tienda/types'
import { normalizar } from '@/domain/texto'
import type { MetricasImagen } from './analizarPixeles'

type Patologia = Exclude<PatologiaDetectada, 'Sin daños evidentes'>

export interface EntradaDiagnostico {
  zona: ZonaAfectada
  descripcion: string
  superficie?: Superficie | ''
  condicion?: CondicionActual | ''
  /** Una por foto analizada; vacío si el cliente no subió fotos. */
  metricas: MetricasImagen[]
  fecha?: string
}

const PATOLOGIAS: Patologia[] = [
  'Moho y hongos',
  'Humedad y filtración',
  'Fisuras y grietas',
  'Óxido y corrosión',
  'Pintura descascarada',
  'Salitre',
]

/**
 * Cómo se mide cada problema en una foto. `minimo` es el ruido del analizador
 * (por debajo no se cuenta), `seguro` lo que ocupa cuando ya no hay duda y
 * `cortes` donde empieza la severidad moderada y la severa. Calibrado con fotos
 * reales: las de grietas dan longitudes de 1 a 2,5; las de óxido ocupan entre 15 y
 * 98 % del encuadre; las de moho, entre 6 y 27 %.
 */
const ESCALA: Record<Patologia, { medida: (m: MetricasImagen) => number; minimo: number; seguro: number; cortes: [number, number] }> = {
  'Moho y hongos': { medida: (m) => m.fracciones.moho, minimo: 0.03, seguro: 0.08, cortes: [0.06, 0.12] },
  'Humedad y filtración': { medida: (m) => m.fracciones.humedad, minimo: 0.015, seguro: 0.04, cortes: [0.03, 0.07] },
  'Fisuras y grietas': { medida: (m) => m.longitudGrietas, minimo: 0.35, seguro: 1, cortes: [0.9, 1.8] },
  'Óxido y corrosión': { medida: (m) => m.fracciones.oxido, minimo: 0.06, seguro: 0.2, cortes: [0.18, 0.5] },
  // La textura fuerte también es piedra, ladrillo o concreto: se mide lo que pasa del 25 %.
  'Pintura descascarada': { medida: (m) => Math.max(0, m.fracciones.descascarado - 0.25), minimo: 0.05, seguro: 0.4, cortes: [0.3, 0.5] },
  Salitre: { medida: () => 0, minimo: 1, seguro: 1, cortes: [1, 1] },
}

/** Palabras con las que el cliente suele describir cada problema (ya sin tildes). */
const PALABRAS: Record<Patologia, RegExp> = {
  'Moho y hongos': /moho|hongo|manchas? (negr|oscur)|puntos? negros?|verdin|musgo/,
  'Humedad y filtración': /humed|mojad|filtra|gotera|gotea|mancha de agua|manchas? (amarill|cafe|marron)|chorrea|se moja/,
  'Fisuras y grietas': /grieta|fisura|rajad|rajadura|agriet|se abri[oó]|partid/,
  'Óxido y corrosión': /oxid|herrumbr|corros/,
  'Pintura descascarada': /descascar|se cae la pintura|se pela|pelando|ampolla|burbuja|levanta|desprende|escama|se despega/,
  Salitre: /salitre|sal blanca|polvo blanco|eflorescen/,
}

/** Lo que dice la condición que el cliente eligió en el paso técnico. */
const CONDICION_A_PATOLOGIA: Partial<Record<CondicionActual, [Patologia, number]>> = {
  'Con humedad': ['Humedad y filtración', 0.8],
  'Con grietas': ['Fisuras y grietas', 0.8],
  'Con pintura deteriorada': ['Pintura descascarada', 0.7],
  Desgastada: ['Pintura descascarada', 0.3],
}

/** Cuánto pesa cada problema según el lugar: un techo se moja, un piso se agrieta, un metal se oxida. */
const PESO_POR_ZONA: Record<ZonaAfectada, Partial<Record<Patologia, number>>> = {
  Pared: { 'Óxido y corrosión': 0.35 },
  Techo: { 'Humedad y filtración': 1.25, 'Moho y hongos': 1.1, 'Óxido y corrosión': 0.3 },
  Piso: { 'Fisuras y grietas': 1.15, 'Óxido y corrosión': 0.3, 'Moho y hongos': 0.8 },
  Fachada: { 'Fisuras y grietas': 1.1, 'Pintura descascarada': 1.1, 'Moho y hongos': 1.1, 'Óxido y corrosión': 0.35 },
  'Metal o reja': { 'Óxido y corrosión': 2, 'Humedad y filtración': 0.2, 'Moho y hongos': 0.2, 'Fisuras y grietas': 0.2 },
  Otra: {},
}

/** Una mancha oscura es moho o es humedad: si el cliente nombra uno, la foto del otro lo respalda. */
const APOYO_CRUZADO: Partial<Record<Patologia, Patologia>> = {
  'Humedad y filtración': 'Moho y hongos',
  'Moho y hongos': 'Humedad y filtración',
}

const acotar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
const vacio = (): Record<Patologia, number> => Object.fromEntries(PATOLOGIAS.map((p) => [p, 0])) as Record<Patologia, number>

interface EvidenciaFoto {
  /** 0-1: qué tan presente está el problema en la mejor foto. */
  ev: Record<Patologia, number>
  /** Medida física del problema (fracción de la foto o longitud), ya corregida por lo poco fiable que sea. */
  medida: Record<Patologia, number>
}

function evidenciaDeFotos(metricas: MetricasImagen[], metalDeclarado: boolean): EvidenciaFoto {
  const ev = vacio()
  const medida = vacio()
  for (const m of metricas) {
    for (const p of PATOLOGIAS) {
      const { medida: medir, minimo, seguro } = ESCALA[p]
      let valor = medir(m)
      let confiable = 1
      if (p === 'Fisuras y grietas') {
        // Las líneas se confunden con texturas rugosas, con las vetas de un metal y, si hay muchas
        // líneas finas, con molduras, estuco o piedra.
        valor *= (m.rugosidad > 0.6 ? 0.35 : m.rugosidad > 0.35 ? 0.6 : 1) * (m.fracciones.oxido > 0.4 ? 0.3 : 1) * (m.crestas > 0.15 ? 0.5 : 1)
      }
      // Un naranja con textura en una pared, techo o piso casi nunca es óxido (suele ser madera o teja).
      if (p === 'Óxido y corrosión' && !metalDeclarado) confiable = 0.4
      // La textura sola no prueba pintura levantada.
      if (p === 'Pintura descascarada') confiable = 0.5
      const e = valor < minimo ? 0 : acotar(valor / seguro) * confiable
      if (e > ev[p]) {
        ev[p] = e
        medida[p] = valor
      }
    }
  }
  return { ev, medida }
}

function evidenciaDeTexto(e: EntradaDiagnostico): Record<Patologia, number> {
  const texto = normalizar(e.descripcion)
  const ev = vacio()
  for (const p of PATOLOGIAS) if (PALABRAS[p].test(texto)) ev[p] = 1
  const porCondicion = e.condicion ? CONDICION_A_PATOLOGIA[e.condicion] : undefined
  if (porCondicion) ev[porCondicion[0]] = Math.max(ev[porCondicion[0]], porCondicion[1])
  return ev
}

interface Ficha {
  causa: string
  kit: (esInterior: boolean, zona: ZonaAfectada) => PatologiaKit | null
  productos: (esInterior: boolean) => string[]
  pasos: string[]
  frase: (pct: number) => string
}

const FICHAS: Record<Patologia, Ficha> = {
  'Moho y hongos': {
    causa: 'Humedad constante y poca ventilación: el moho aparece donde el agua se queda (condensación, filtraciones o muros fríos).',
    kit: () => 'Humedad y moho',
    productos: () => ['Aquablock Fibratado', 'Viniltex'],
    pasos: [
      'Encuentra y corrige la fuente de humedad (fuga, bajante o falta de ventilación).',
      'Lava el moho con cloro diluido (1 parte en 3 de agua) y un cepillo, con guantes y mascarilla; nunca lo mezcles con otros limpiadores. Deja secar 48 horas.',
      'Raspa la pintura suelta, lija y retira el polvo.',
      'Aplica 2 manos de Aquablock Fibratado para frenar la humedad.',
      'Termina con 2 manos de Viniltex.',
    ],
    frase: (pct) => `Hay manchas oscuras y granuladas compatibles con moho en cerca del ${pct}% de la foto.`,
  },
  'Humedad y filtración': {
    causa: 'Agua que entra por la cubierta, una tubería o sube desde el suelo por capilaridad.',
    kit: (_i, zona) => (zona === 'Techo' || zona === 'Fachada' ? 'Goteras y terrazas' : 'Humedad y moho'),
    productos: () => ['Aquablock Fibratado', 'Viniltex'],
    pasos: [
      'Localiza el origen del agua (cubierta, tubería, bajante) y repáralo primero.',
      'Deja secar la zona por completo: pintar sobre un muro húmedo repite el daño.',
      'Raspa lo suelto y sella con Aquablock Fibratado, 2 manos.',
      'Termina con 2 manos de Viniltex.',
    ],
    frase: (pct) => `Hay manchas más oscuras que la pared, típicas de una filtración de agua (cerca del ${pct}% de la foto).`,
  },
  'Fisuras y grietas': {
    causa: 'Movimientos de la estructura, cambios de temperatura o un revoque mal curado.',
    kit: (esInterior) => (esInterior ? null : 'Fachada exterior'),
    productos: (esInterior) => ['Masilla Elastomérica + Koraza', esInterior ? 'Viniltex' : 'Koraza 5 Años Protección Total'],
    pasos: [
      'Abre la fisura en forma de V con una espátula y limpia el polvo.',
      'Si es más ancha que 3 mm, atraviesa el muro o hay desnivel, pide primero una revisión estructural.',
      'Rellena con Masilla Elastomérica, que acompaña el movimiento, y deja secar.',
      'Lija suave y aplica 2 manos de acabado.',
    ],
    frase: () => 'Se distinguen líneas oscuras y finas compatibles con fisuras o grietas.',
  },
  'Óxido y corrosión': {
    causa: 'Humedad y oxígeno sobre el metal sin una protección adecuada.',
    kit: () => 'Metales oxidados',
    productos: () => ['Pintulux 3 en 1 Anticorrosivo + Esmalte'],
    pasos: [
      'Retira el óxido suelto con cepillo de alambre o lija.',
      'Desengrasa y limpia el polvo.',
      'Aplica 2 manos de Pintulux 3 en 1, que se puede aplicar directo sobre el óxido firme.',
    ],
    frase: (pct) => `Predominan los tonos naranja y marrón con textura de óxido en cerca del ${pct}% de la foto.`,
  },
  'Pintura descascarada': {
    causa: 'La pintura no se adhirió: humedad detrás de la capa, superficie sucia o una pintura incompatible.',
    kit: (esInterior) => (esInterior ? null : 'Fachada exterior'),
    productos: (esInterior) => [esInterior ? 'Viniltex' : 'Koraza 5 Años Protección Total'],
    pasos: [
      'Raspa toda la pintura suelta hasta llegar a una base firme.',
      'Revisa si hay humedad detrás: si la hay, trátala primero.',
      'Lija, retira el polvo y resana los huecos.',
      'Aplica 2 manos de acabado.',
    ],
    frase: () => 'La superficie muestra una textura irregular fuerte, posible pintura levantada o descascarada.',
  },
  Salitre: {
    causa: 'Sales que el agua arrastra desde el muro o el piso y quedan como polvo blanco al evaporarse.',
    kit: () => 'Humedad y moho',
    productos: () => ['Aquablock Fibratado', 'Vinilico Concreto'],
    pasos: [
      'Cepilla el salitre en seco, con mascarilla, y retira el polvo.',
      'Corrige la fuente de humedad (filtración o humedad que sube del suelo).',
      'Aplica Aquablock Fibratado y deja secar.',
      'Termina con 2 manos de Vinilico Concreto o Viniltex.',
    ],
    frase: () => 'Según lo que describes, podría tratarse de salitre (sales que afloran con la humedad).',
  },
}

/** Con foto, la severidad sale de cuánto muestra la imagen; sin ella, de cómo lo cuenta el cliente. */
function severidad(p: Patologia, medida: number, texto: string): Severidad {
  const t = normalizar(texto)
  const [moderada, severa] = ESCALA[p].cortes
  let nivel: Severidad
  if (medida > 0) nivel = medida < moderada ? 'Leve' : medida < severa ? 'Moderada' : 'Severa'
  else if (/toda|todo|enorme|muy grande|extens|por todos|se cae|cada vez peor/.test(t)) nivel = 'Severa'
  else if (/peque|poco|poquit|leve|ligera|chiquit/.test(t)) nivel = 'Leve'
  else nivel = 'Moderada'
  // Una grieta que atraviesa el muro o desnivela es seria aunque se vea corta.
  if (p === 'Fisuras y grietas' && nivel === 'Leve' && /atraviesa|cruza|escalon|desnivel|ancha|profunda|larga/.test(t)) nivel = 'Moderada'
  return nivel
}

/**
 * Diagnóstico a partir de la foto (si hay) y de lo que cuenta el cliente. La foto
 * dice qué se ve y cuánto; la descripción, la zona y la condición que eligió
 * confirman o corrigen lo que una foto sola no puede distinguir (una pared de
 * ladrillo, una teja o una madera pueden parecer daño). Es preliminar: un asesor
 * lo valida. ponytail: reglas, no un modelo entrenado.
 */
export function diagnosticar(e: EntradaDiagnostico): DiagnosticoImagen {
  const hayFoto = e.metricas.length > 0
  const textoNormal = normalizar(e.descripcion)
  const metalDeclarado = e.zona === 'Metal o reja' || e.superficie === 'Metal' || PALABRAS['Óxido y corrosión'].test(textoNormal)
  const fotos = evidenciaDeFotos(e.metricas, metalDeclarado)
  const txt = evidenciaDeTexto(e)

  // Si el cliente nombra un problema y la foto muestra su "gemelo", la foto también lo respalda.
  const img = { ...fotos.ev }
  const medida = { ...fotos.medida }
  for (const p of PATOLOGIAS) {
    const gemelo = APOYO_CRUZADO[p]
    if (gemelo && txt[p] > 0 && fotos.ev[gemelo] * 0.6 > img[p]) {
      img[p] = fotos.ev[gemelo] * 0.6
      medida[p] = fotos.medida[gemelo]
    }
  }

  const puntaje = vacio()
  for (const p of PATOLOGIAS) {
    // La textura sola no prueba pintura descascarada: necesita que el cliente lo confirme.
    const fotoEfectiva = p === 'Pintura descascarada' && txt[p] === 0 ? Math.min(img[p], 0.15) : img[p]
    const base = hayFoto ? 0.7 * fotoEfectiva + 0.5 * txt[p] : 0.9 * txt[p]
    puntaje[p] = base * (PESO_POR_ZONA[e.zona][p] ?? 1)
  }

  const ordenados = [...PATOLOGIAS].sort((a, b) => puntaje[b] - puntaje[a])
  // Lo que el cliente nombra manda sobre lo que la foto sugiere, salvo que la foto lo contradiga con fuerza.
  const nombrado = ordenados.find((p) => txt[p] >= 0.7)
  if (nombrado && nombrado !== ordenados[0] && puntaje[nombrado] >= puntaje[ordenados[0]] * 0.6) {
    ordenados.splice(ordenados.indexOf(nombrado), 1)
    ordenados.unshift(nombrado)
  }
  const mejor = ordenados[0]
  const hayDano = puntaje[mejor] >= 0.2
  const advertencias: string[] = []
  const brilloBajo = e.metricas.some((m) => m.brillo < 50)
  if (brilloBajo) advertencias.push('La foto está muy oscura: toma otra con más luz para un diagnóstico más preciso.')
  if (e.metricas.some((m) => m.juntasRectas > 0)) {
    advertencias.push('Se ven juntas de baldosa, ladrillo o bloque: la foto sola no sirve para saber si hay fisuras; descríbelas.')
  }
  if (!hayFoto) advertencias.push('Sin foto el diagnóstico es menos preciso: agrega una imagen del problema.')

  const hallazgos = ordenados
    .filter((p) => puntaje[p] >= 0.2)
    .map((p) => ({ patologia: p as PatologiaDetectada, intensidad: Math.round(acotar(puntaje[p]) * 100) }))

  const esInterior = e.zona !== 'Fachada' && e.superficie !== 'Exterior' && e.superficie !== 'Fachada'
  const origen: DiagnosticoImagen['origen'] =
    !hayFoto || (img[mejor] <= 0.1 && txt[mejor] > 0) ? 'descripción' : txt[mejor] > 0 ? 'foto y descripción' : 'foto'
  const fecha = e.fecha ?? new Date().toISOString().slice(0, 10)

  if (!hayDano) {
    return {
      generadoEn: fecha,
      zona: e.zona,
      patologia: 'Sin daños evidentes',
      severidad: null,
      confianza: hayFoto ? 60 : 30,
      origen: hayFoto ? 'foto' : 'descripción',
      fotos: e.metricas.length,
      resumen: hayFoto
        ? 'No se ven daños claros en la foto: la superficie parece en buen estado.'
        : 'Con lo que cuentas no identificamos un problema concreto.',
      causaProbable: 'No se detectó una causa; si hay algo que no se ve en la foto, descríbelo y vuelve a analizar.',
      hallazgos,
      tratamiento: {
        kit: null,
        productos: [esInterior ? 'Viniltex' : 'Koraza 5 Años Protección Total'],
        pasos: ['Limpia el polvo y lava suavemente la superficie.', 'Si solo quieres renovar el color, aplica 2 manos de acabado.'],
      },
      advertencias,
    }
  }

  const ficha = FICHAS[mejor]
  const sev = severidad(mejor, origen === 'descripción' ? 0 : medida[mejor], e.descripcion)
  const segundo = ordenados[1]
  const cercano = puntaje[segundo] >= Math.max(0.2, puntaje[mejor] * 0.7)
  // Moho y humedad juntos son lo normal (una mancha oscura suele ser las dos cosas): no es una duda.
  const compiten = cercano && segundo !== APOYO_CRUZADO[mejor]
  let confianza = 35 + 35 * acotar(puntaje[mejor])
  if (origen === 'foto y descripción') confianza += 12
  if (brilloBajo) confianza -= 12
  if (compiten) confianza -= 10
  // Sobre piedra, ladrillo o concreto rugoso, una mancha oscura puede ser sombra o suciedad.
  const dudaPorTextura = (mejor === 'Moho y hongos' || mejor === 'Humedad y filtración') && txt[mejor] === 0 && e.metricas.some((m) => m.rugosidad >= 0.7)
  if (dudaPorTextura) confianza -= 10
  confianza = Math.round(acotar(confianza, 20, origen === 'descripción' ? 55 : 92))

  const pct = Math.max(1, Math.round(medida[mejor] * 100))
  const resumen = origen === 'descripción' ? `Según tu descripción, el problema podría ser ${mejor.toLowerCase()}. ` : `${ficha.frase(pct)} `
  const extra = cercano ? `También hay señales de ${segundo.toLowerCase()}. ` : ''
  if (compiten) advertencias.push(`Hay dos problemas posibles (${mejor.toLowerCase()} y ${segundo.toLowerCase()}): un asesor lo confirmará.`)
  if (dudaPorTextura) {
    advertencias.push('La superficie es muy rugosa: las manchas oscuras pueden ser sombras o suciedad. Descríbelas para confirmarlo.')
  }
  if (mejor === 'Fisuras y grietas' && sev !== 'Leve') {
    advertencias.push('Si la grieta atraviesa el muro, es ancha o hay desnivel entre los bordes, pide una revisión estructural antes de reparar.')
  }

  return {
    generadoEn: fecha,
    zona: e.zona,
    patologia: mejor,
    severidad: sev,
    confianza,
    origen,
    fotos: e.metricas.length,
    resumen: `${resumen}${extra}Nivel estimado: ${sev.toLowerCase()}.`,
    causaProbable: ficha.causa,
    hallazgos,
    tratamiento: { kit: ficha.kit(esInterior, e.zona), productos: ficha.productos(esInterior), pasos: ficha.pasos },
    advertencias,
  }
}
