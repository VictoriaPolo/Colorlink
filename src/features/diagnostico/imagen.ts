import { analizarPixeles, CLASES, type ClaseDano, type MetricasImagen } from '@/domain/diagnostico/analizarPixeles'
import type { DiagnosticoImagen, PatologiaDetectada } from '@/domain/solicitud/types'

/** Lado mayor (px) al que se reduce la foto para analizarla: suficiente para ver el daño y rápido. */
const LADO_ANALISIS = 320

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const img = new Image()
    // Las fotos de ejemplo vienen de otro dominio: sin esto el canvas no deja leer sus píxeles.
    img.crossOrigin = 'anonymous'
    img.onload = () => resolver(img)
    img.onerror = () => rechazar(new Error('No se pudo cargar la imagen.'))
    img.src = url
  })
}

const cache = new Map<string, Promise<MetricasImagen>>()

/** Analiza una foto (URL o data URL). El resultado se guarda para no repetir el trabajo. */
export function analizarImagenUrl(url: string): Promise<MetricasImagen> {
  let resultado = cache.get(url)
  if (!resultado) {
    resultado = cargarImagen(url).then((img) => {
      const escala = Math.min(1, LADO_ANALISIS / Math.max(img.naturalWidth, img.naturalHeight))
      const ancho = Math.max(1, Math.round(img.naturalWidth * escala))
      const alto = Math.max(1, Math.round(img.naturalHeight * escala))
      const canvas = document.createElement('canvas')
      canvas.width = ancho
      canvas.height = alto
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0, ancho, alto)
      return analizarPixeles(ctx.getImageData(0, 0, ancho, alto).data, ancho, alto)
    })
    cache.set(url, resultado)
    resultado.catch(() => cache.delete(url))
  }
  return resultado
}

/** Reduce y comprime la foto que sube el cliente. Se guarda como data URL (no como
 * blob:, que se pierde al recargar la página) para que el equipo también pueda verla. */
export async function comprimirFoto(archivo: File, ladoMax = 960, calidad = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(archivo)
  const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', calidad)
}

/** Color con el que se resalta cada tipo de daño sobre la foto. El óxido va en verde porque
 * un naranja sobre un metal oxidado no se vería. */
export const COLOR_CLASE: Record<ClaseDano, { rgb: [number, number, number]; css: string }> = {
  moho: { rgb: [220, 38, 38], css: '#dc2626' },
  humedad: { rgb: [37, 99, 235], css: '#2563eb' },
  grietas: { rgb: [219, 39, 119], css: '#db2777' },
  oxido: { rgb: [22, 163, 74], css: '#16a34a' },
  descascarado: { rgb: [124, 58, 237], css: '#7c3aed' },
}

/** Lo que el análisis sabe de verdad de cada zona: una mancha oscura puede ser moho o humedad. */
export const ETIQUETA_CLASE: Record<ClaseDano, string> = {
  moho: 'Manchas oscuras',
  humedad: 'Mancha de agua',
  grietas: 'Líneas (grietas)',
  oxido: 'Óxido',
  descascarado: 'Pintura levantada',
}

/** Mismo color para el problema que para su zona en la foto, de modo que la leyenda y las barras coincidan. */
export const COLOR_PATOLOGIA: Record<PatologiaDetectada, string> = {
  'Moho y hongos': COLOR_CLASE.moho.css,
  'Humedad y filtración': COLOR_CLASE.humedad.css,
  'Fisuras y grietas': COLOR_CLASE.grietas.css,
  'Óxido y corrosión': COLOR_CLASE.oxido.css,
  'Pintura descascarada': COLOR_CLASE.descascarado.css,
  Salitre: '#64748b',
  'Sin daños evidentes': '#15803d',
}

/** Cuánto de la foto debe ocupar una clase para mostrarse: por debajo es ruido del análisis. */
const MINIMO_VISIBLE: Record<ClaseDano, number> = { moho: 0.02, humedad: 0.01, grietas: 0.12, oxido: 0.05, descascarado: 0.3 }

/** Qué zonas del análisis respaldan a cada problema (una mancha oscura es moho o humedad). */
const CLASES_DE_PATOLOGIA: Record<PatologiaDetectada, ClaseDano[]> = {
  'Moho y hongos': ['moho', 'humedad'],
  'Humedad y filtración': ['humedad', 'moho'],
  'Fisuras y grietas': ['grietas'],
  'Óxido y corrosión': ['oxido'],
  'Pintura descascarada': ['descascarado'],
  Salitre: [],
  'Sin daños evidentes': [],
}

/** Las zonas que el diagnóstico reclama: las del problema principal y las de lo demás que encontró. */
export function clasesDeDiagnostico(d: Pick<DiagnosticoImagen, 'patologia' | 'hallazgos'>): ClaseDano[] {
  const problemas = [d.patologia, ...d.hallazgos.map((h) => h.patologia)]
  return CLASES.filter((c) => problemas.some((p) => CLASES_DE_PATOLOGIA[p].includes(c)))
}

/**
 * Las clases que vale la pena mostrar sobre una foto. Con `permitidas` (lo que reclama el diagnóstico) solo
 * esas; sin ellas, todas menos la textura fuerte, que también la tienen la piedra y el ladrillo.
 */
export function clasesVisibles(metricas: MetricasImagen, permitidas?: ClaseDano[]): ClaseDano[] {
  return CLASES.filter((c) => metricas.fracciones[c] >= MINIMO_VISIBLE[c] && (permitidas ? permitidas.includes(c) : c !== 'descascarado'))
}

/** Dibuja las zonas detectadas (semitransparentes) sobre un canvas del tamaño del análisis. */
export function dibujarZonas(canvas: HTMLCanvasElement, metricas: MetricasImagen, permitidas?: ClaseDano[]): void {
  const visibles = new Set(clasesVisibles(metricas, permitidas))
  canvas.width = metricas.ancho
  canvas.height = metricas.alto
  const ctx = canvas.getContext('2d')!
  const imagen = ctx.createImageData(metricas.ancho, metricas.alto)
  for (let i = 0; i < metricas.mapa.length; i++) {
    const clase = metricas.mapa[i]
    if (!clase || !visibles.has(CLASES[clase - 1])) continue
    const [r, g, b] = COLOR_CLASE[CLASES[clase - 1]].rgb
    imagen.data.set([r, g, b, 150], i * 4)
  }
  ctx.putImageData(imagen, 0, 0)
}

/** La foto lista para un PDF: reducida, en JPEG y con las zonas del diagnóstico marcadas encima
 * (igual que en pantalla). Si la foto no se puede analizar, va sola. */
export async function fotoParaPdf(
  url: string,
  clases?: ClaseDano[],
  ladoMax = 900,
): Promise<{ dataUrl: string; ancho: number; alto: number; leyenda: ClaseDano[] }> {
  const img = await cargarImagen(url)
  const escala = Math.min(1, ladoMax / Math.max(img.naturalWidth, img.naturalHeight))
  const ancho = Math.max(1, Math.round(img.naturalWidth * escala))
  const alto = Math.max(1, Math.round(img.naturalHeight * escala))
  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ancho, alto)
  ctx.drawImage(img, 0, 0, ancho, alto)
  let leyenda: ClaseDano[] = []
  try {
    const metricas = await analizarImagenUrl(url)
    const zonas = document.createElement('canvas')
    dibujarZonas(zonas, metricas, clases)
    ctx.drawImage(zonas, 0, 0, ancho, alto)
    leyenda = clasesVisibles(metricas, clases)
  } catch {
    // Sin análisis, va la foto sola.
  }
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.82), ancho, alto, leyenda }
}
