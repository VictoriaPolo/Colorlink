/**
 * Análisis de una foto de pared, techo o piso a partir de sus píxeles (visión
 * por computador clásica, sin modelos entrenados): busca zonas que se salen de
 * la superficie sana por color, brillo y textura. Es lógica pura — recibe los
 * bytes RGBA y devuelve métricas — para poder probarla sin navegador.
 * ponytail: son heurísticas calibradas con fotos reales, no un modelo
 * entrenado; si hace falta más precisión, este mismo contrato (píxeles →
 * métricas) admite cambiarlo por un modelo de visión.
 */

export const CLASES = ['moho', 'humedad', 'grietas', 'oxido', 'descascarado'] as const
export type ClaseDano = (typeof CLASES)[number]

export interface MetricasImagen {
  ancho: number
  alto: number
  /** Fracción del área (0-1) que ocupa cada clase. En `grietas` es la longitud relativa a la diagonal / 4, tope 1. */
  fracciones: Record<ClaseDano, number>
  /** Longitud total de grietas dividida por la diagonal de la imagen. */
  longitudGrietas: number
  /** Líneas rectas y paralelas (juntas de baldosa o ladrillo) que se descartaron como grietas. */
  juntasRectas: number
  /** Fracción de la imagen con líneas finas oscuras (muchas = superficie texturada, no grietas). */
  crestas: number
  /** Fracción de la imagen con textura fuerte (piedra, ladrillo, concreto rugoso o pintura levantada). */
  rugosidad: number
  /** Clase por píxel: 0 = nada, 1..5 = índice + 1 en CLASES. Para dibujar las zonas detectadas. */
  mapa: Uint8Array
  /** Luma media 0-255. */
  brillo: number
  /** Varianza del laplaciano: baja = foto borrosa. */
  nitidez: number
}

/** Imagen integral: suma de cualquier ventana en tiempo constante. */
function integral(valores: ArrayLike<number>, w: number, h: number): Float64Array {
  const I = new Float64Array((w + 1) * (h + 1))
  for (let y = 0; y < h; y++) {
    let fila = 0
    for (let x = 0; x < w; x++) {
      fila += valores[y * w + x]
      I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + fila
    }
  }
  return I
}

function sumaVentana(I: Float64Array, w: number, h: number, x: number, y: number, r: number): [suma: number, celdas: number] {
  const x0 = Math.max(0, x - r)
  const y0 = Math.max(0, y - r)
  const x1 = Math.min(w, x + r + 1)
  const y1 = Math.min(h, y + r + 1)
  const s = I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0]
  return [s, (x1 - x0) * (y1 - y0)]
}

function rgbAHsv(r: number, g: number, b: number): [h: number, s: number, v: number] {
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  const d = mx - mn
  let h = 0
  if (d > 0) {
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, mx === 0 ? 0 : d / mx, mx / 255]
}

/** Dilata o erosiona una máscara binaria con una ventana cuadrada. */
function morfologia(mascara: Uint8Array, w: number, h: number, r: number, modo: 'dilatar' | 'erosionar'): Uint8Array {
  const I = integral(mascara, w, h)
  const salida = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [s, celdas] = sumaVentana(I, w, h, x, y, r)
      salida[y * w + x] = modo === 'dilatar' ? (s > 0 ? 1 : 0) : s === celdas ? 1 : 0
    }
  }
  return salida
}

const cerrar = (m: Uint8Array, w: number, h: number, r: number) => morfologia(morfologia(m, w, h, r, 'dilatar'), w, h, r, 'erosionar')
const abrir = (m: Uint8Array, w: number, h: number, r: number) => morfologia(morfologia(m, w, h, r, 'erosionar'), w, h, r, 'dilatar')

interface Componente {
  pixeles: number[]
  x0: number
  y0: number
  x1: number
  y1: number
}

/** Componentes conexas (8 vecinos) de una máscara binaria. */
function componentes(mascara: Uint8Array, w: number, h: number): Componente[] {
  const visto = new Uint8Array(mascara.length)
  const lista: Componente[] = []
  const pila: number[] = []
  for (let inicio = 0; inicio < mascara.length; inicio++) {
    if (!mascara[inicio] || visto[inicio]) continue
    const c: Componente = { pixeles: [], x0: w, y0: h, x1: 0, y1: 0 }
    pila.push(inicio)
    visto[inicio] = 1
    while (pila.length) {
      const p = pila.pop()!
      const x = p % w
      const y = (p - x) / w
      c.pixeles.push(p)
      if (x < c.x0) c.x0 = x
      if (x > c.x1) c.x1 = x
      if (y < c.y0) c.y0 = y
      if (y > c.y1) c.y1 = y
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          const q = ny * w + nx
          if (mascara[q] && !visto[q]) {
            visto[q] = 1
            pila.push(q)
          }
        }
      }
    }
    lista.push(c)
  }
  return lista
}

/** Elimina las componentes con menos de `minimo` píxeles. */
function limpiar(mascara: Uint8Array, w: number, h: number, minimo: number): Uint8Array {
  const salida = new Uint8Array(mascara.length)
  for (const c of componentes(mascara, w, h)) {
    if (c.pixeles.length >= minimo) for (const p of c.pixeles) salida[p] = 1
  }
  return salida
}

function percentil(valores: ArrayLike<number>, p: number, escala = 1): number {
  const histograma = new Uint32Array(256)
  for (let i = 0; i < valores.length; i++) histograma[Math.min(255, Math.max(0, Math.round(valores[i] * escala)))]++
  const objetivo = valores.length * p
  let acumulado = 0
  for (let i = 0; i < 256; i++) {
    acumulado += histograma[i]
    if (acumulado >= objetivo) return i / escala
  }
  return 255 / escala
}

/** Distancia lateral y media longitud de la recta: grietas finas y gruesas. */
const ESCALAS: [lado: number, largo: number][] = [
  [4, 3],
  [7, 4],
]
/** Por encima de esta fracción de "crestas" la foto es una textura, no una pared con grietas. */
const MAX_CRESTAS = 0.2

/** Direcciones de las rectas del detector de grietas (a lo largo, y perpendicular). */
const RECTAS: { a: [number, number]; p: [number, number] }[] = [
  { a: [1, 0], p: [0, 1] },
  { a: [1, 1], p: [-1, 1] },
  { a: [0, 1], p: [1, 0] },
  { a: [1, -1], p: [1, 1] },
]

export function analizarPixeles(rgba: Uint8ClampedArray, w: number, h: number): MetricasImagen {
  const n = w * h
  const L = new Float32Array(n)
  const H = new Float32Array(n)
  const S = new Float32Array(n)
  const V = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const r = rgba[i * 4]
    const g = rgba[i * 4 + 1]
    const b = rgba[i * 4 + 2]
    L[i] = 0.299 * r + 0.587 * g + 0.114 * b
    ;[H[i], S[i], V[i]] = rgbAHsv(r, g, b)
  }

  // Textura local (desviación estándar de la luma en una ventana de 9x9).
  const IL = integral(L, w, h)
  const IL2 = integral(L.map((v) => v * v), w, h)
  const sd = new Float32Array(n)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [s, c] = sumaVentana(IL, w, h, x, y, 4)
      const [s2] = sumaVentana(IL2, w, h, x, y, 4)
      const media = s / c
      sd[y * w + x] = Math.sqrt(Math.max(0, s2 / c - media * media))
    }
  }

  // Tono "de la pared": luma mediana y saturación de los píxeles cercanos a ella.
  const base = percentil(L, 0.5)
  const cercanas: number[] = []
  for (let i = 0; i < n; i++) if (Math.abs(L[i] - base) <= 15) cercanas.push(S[i])
  const saturacionBase = percentil(Float32Array.from(cercanas), 0.5, 100)
  const brillo = L.reduce((a, v) => a + v, 0) / n

  // Nitidez: varianza del laplaciano.
  let sumaLap = 0
  let sumaLap2 = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const lap = L[i - 1] + L[i + 1] + L[i - w] + L[i + w] - 4 * L[i]
      sumaLap += lap
      sumaLap2 += lap * lap
    }
  }
  const celdasLap = (w - 2) * (h - 2)
  const nitidez = sumaLap2 / celdasLap - (sumaLap / celdasLap) ** 2

  const tono = (i: number, min: number, max: number) => H[i] >= min && H[i] <= max

  // ---- Óxido: naranja/marrón saturado y con textura (una pared lisa naranja es pintura) ----
  let naranjas = 0
  let sdNaranja = 0
  for (let i = 0; i < n; i++) {
    if (tono(i, 5, 42) && S[i] >= 0.42 && V[i] >= 0.18) {
      naranjas++
      sdNaranja += sd[i]
    }
  }
  const superficieNaranjaLisa = naranjas / n > 0.8 && sdNaranja / Math.max(1, naranjas) < 6
  const oxido = new Uint8Array(n)
  if (!superficieNaranjaLisa) {
    for (let i = 0; i < n; i++) {
      if (tono(i, 5, 42) && S[i] >= 0.42 && V[i] >= 0.18 && V[i] <= 0.95 && sd[i] >= 4) oxido[i] = 1
    }
  }

  // ---- Moho: zonas oscuras con textura (las sombras son lisas), grises, negras o verdosas ----
  const moho = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    if (oxido[i]) continue
    const dL = L[i] - base
    const verdoso = tono(i, 60, 170) && S[i] >= 0.12
    const oscuro = dL <= -38 || V[i] <= 0.2 || (dL <= -26 && verdoso)
    if (oscuro && sd[i] >= 5 && (S[i] <= 0.4 || verdoso)) moho[i] = 1
  }

  // ---- Humedad / filtración: manchas lisas, más oscuras y más "té" (saturadas) que la pared ----
  const humedad = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    if (oxido[i] || moho[i]) continue
    const dL = L[i] - base
    const calido = tono(i, 12, 60) && S[i] >= Math.max(0.1, saturacionBase + 0.05) && S[i] <= 0.7
    if (dL <= -6 && dL >= -75 && sd[i] <= 8 && calido) humedad[i] = 1
  }

  // ---- Grietas: líneas finas y oscuras (detector de crestas, 4 orientaciones y 2 grosores) ----
  const crestas = new Uint8Array(n)
  const margen = 10
  for (let y = margen; y < h - margen; y++) {
    for (let x = margen; x < w - margen; x++) {
      if (L[y * w + x] > base - 8) continue
      let mejor = 0
      for (const { a, p } of RECTAS) {
        for (const [lado, largo] of ESCALAS) {
          let enLinea = 0
          for (let k = -largo; k <= largo; k++) enLinea += L[(y + a[1] * k) * w + x + a[0] * k]
          enLinea /= 2 * largo + 1
          let lados = 0
          for (let k = -2; k <= 2; k++) {
            lados += L[(y + a[1] * k + p[1] * lado) * w + x + a[0] * k + p[0] * lado]
            lados += L[(y + a[1] * k - p[1] * lado) * w + x + a[0] * k - p[0] * lado]
          }
          const contraste = lados / 10 - enLinea
          if (contraste > mejor) mejor = contraste
        }
      }
      if (mejor >= 18) crestas[y * w + x] = 1
    }
  }
  // Una grieta es una línea aislada sobre una superficie lisa: si las crestas ocupan buena parte
  // de la foto (moho, piedra, concreto rugoso) es textura, no una grieta.
  let totalCrestas = 0
  for (let i = 0; i < n; i++) totalCrestas += crestas[i]
  const fraccionCrestas = totalCrestas / n
  const IC = integral(crestas, w, h)
  const aisladas = new Uint8Array(n)
  if (fraccionCrestas <= MAX_CRESTAS) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!crestas[y * w + x]) continue
        const [s, c] = sumaVentana(IC, w, h, x, y, 12)
        if (s / c <= 0.32) aisladas[y * w + x] = 1
      }
    }
  }
  const grietas = new Uint8Array(n)
  const diagonal = Math.hypot(w, h)
  const lineas: { c: Componente; alineada: boolean }[] = []
  for (const c of componentes(aisladas, w, h)) {
    const tam = c.pixeles.length
    const largo = Math.max(c.x1 - c.x0, c.y1 - c.y0) + 1
    if (tam < 16 || largo < 18 || tam > n * 0.06) continue
    // Una línea es alargada: el lado mayor del rectángulo es mucho más que la raíz del área.
    if (largo / Math.sqrt(tam) < 2.2) continue
    // Eje principal: ¿recta y horizontal/vertical, como una junta de baldosa o ladrillo?
    let mx = 0
    let my = 0
    for (const p of c.pixeles) {
      mx += p % w
      my += Math.floor(p / w)
    }
    mx /= tam
    my /= tam
    let sxx = 0
    let syy = 0
    let sxy = 0
    for (const p of c.pixeles) {
      const dx = (p % w) - mx
      const dy = Math.floor(p / w) - my
      sxx += dx * dx
      syy += dy * dy
      sxy += dx * dy
    }
    const angulo = (0.5 * Math.atan2(2 * sxy, sxx - syy) * 180) / Math.PI
    const media = (sxx + syy) / 2
    const raiz = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy ** 2)
    const rectitud = (media + raiz) / Math.max(1e-6, media - raiz)
    const alineada = (Math.abs(angulo) < 7 || Math.abs(Math.abs(angulo) - 90) < 7) && rectitud > 40
    lineas.push({ c, alineada })
  }
  // Una o dos líneas rectas pueden ser una grieta vertical; tres o más rectas y paralelas son una
  // cuadrícula de juntas (ladrillo, bloque o baldosa) y entonces nada de eso es una grieta.
  const juntasRectas = lineas.filter((l) => l.alineada).length >= 3 ? lineas.length : 0
  let pixelesGrieta = 0
  if (!juntasRectas) {
    for (const { c } of lineas) {
      for (const p of c.pixeles) grietas[p] = 1
      pixelesGrieta += c.pixeles.length
    }
  }
  const longitudGrietas = pixelesGrieta / 2.5 / diagonal

  // ---- Descascarado: grandes zonas con textura fuerte, lejos de grietas, moho y óxido ----
  let rugosos = 0
  for (let i = 0; i < n; i++) if (sd[i] >= 13) rugosos++
  const cercaDeGrietas = morfologia(grietas, w, h, 6, 'dilatar')
  const descascarado = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    if (oxido[i] || moho[i] || humedad[i] || cercaDeGrietas[i]) continue
    if (sd[i] >= 13) descascarado[i] = 1
  }

  // Quita ruido suelto y une vecinos, y compone el mapa con prioridad (la última escribe encima).
  const minimo = Math.max(12, Math.round(n * 0.0015))
  const mapa = new Uint8Array(n)
  const capas: [ClaseDano, Uint8Array][] = [
    ['descascarado', limpiar(cerrar(descascarado, w, h, 2), w, h, Math.round(n * 0.01))],
    ['humedad', limpiar(cerrar(humedad, w, h, 2), w, h, minimo * 8)],
    ['moho', limpiar(abrir(moho, w, h, 1), w, h, minimo)],
    ['oxido', limpiar(oxido, w, h, minimo)],
    ['grietas', grietas],
  ]
  for (const [clase, mascara] of capas) {
    const id = CLASES.indexOf(clase) + 1
    for (let i = 0; i < n; i++) if (mascara[i]) mapa[i] = id
  }

  const fracciones = Object.fromEntries(CLASES.map((c) => [c, 0])) as Record<ClaseDano, number>
  const cuentas = new Uint32Array(CLASES.length + 1)
  for (let i = 0; i < n; i++) cuentas[mapa[i]]++
  CLASES.forEach((clase, idx) => {
    fracciones[clase] = cuentas[idx + 1] / n
  })
  fracciones.grietas = Math.min(1, longitudGrietas / 4)

  return { ancho: w, alto: h, fracciones, longitudGrietas, juntasRectas, crestas: fraccionCrestas, rugosidad: rugosos / n, mapa, brillo, nitidez }
}
