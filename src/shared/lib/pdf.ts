import type { jsPDF } from 'jspdf'
import { paletaColores } from '@/data/paletaColores'
import { CODIGOS_FRANJA } from '@/shared/brand/franja'

/**
 * Base de los PDF de COLORLINK (resumen de solicitud, comprobante de pedido): el encabezado de la
 * marca y los bloques con los que se arma una página (secciones, datos, listas, barras, fotos).
 * Cada bloque pone lo que dibuja a continuación de lo anterior y pasa a otra hoja cuando no cabe.
 * La librería (jsPDF) se carga solo cuando alguien pide el PDF: quien la pasa es quien la importa.
 */

export type Rgb = [number, number, number]

export function hexARgb(hex: string): Rgb {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const COLOR = {
  primario: [0, 79, 159],
  navy: [10, 37, 64],
  acento: [255, 209, 0],
  texto: [74, 91, 115],
  tenue: [138, 154, 176],
  fondo: [243, 246, 250],
  borde: [226, 232, 240],
  blanco: [255, 255, 255],
  azulClaro: [186, 213, 241],
  exito: [21, 128, 61],
  exitoFondo: [220, 252, 231],
  alerta: [146, 64, 14],
  alertaFondo: [254, 243, 199],
  peligro: [185, 28, 28],
  peligroFondo: [254, 226, 226],
} satisfies Record<string, Rgb>

const COLORES_FRANJA = CODIGOS_FRANJA.map((codigo) => hexARgb(paletaColores.find((p) => p.codigo === codigo)!.hex))

/** Las fuentes estándar de un PDF solo llevan Latin-1: lo que no cabe se cambia por algo parecido o se quita. */
export function textoPdf(texto: string): string {
  return texto
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/→/g, '->')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[•●]/g, '-')
    .replace(/[   ]/g, ' ')
    .replace(/­/g, '')
    .replace(/[^\n -~¡-ÿ]/g, '')
}

const MARGEN = 16
const ANCHO = 210
const ALTO = 297
/** Hasta dónde llega el contenido de cada hoja: debajo va el pie. */
const BASE_PAGINA = ALTO - 20
const MM_POR_PT = 0.3528

export interface FilaDato {
  etiqueta: string
  valor: string
}

export interface FotoDoc {
  dataUrl: string
  ancho: number
  alto: number
  nombre: string
  formato?: 'JPEG' | 'PNG'
  /** Lo que significan los colores marcados sobre la foto. */
  leyenda?: { color: Rgb; texto: string }[]
}

interface OpcionesDocumento {
  titulo: string
  asunto: string
  /** Una o dos líneas que se repiten al pie de cada hoja. */
  pie: string[]
  /** Los PDF se comprimen; las pruebas los dejan sin comprimir para poder leer su texto. */
  comprimir?: boolean
}

export class DocumentoPdf {
  readonly doc: jsPDF
  /** Dónde va lo siguiente que se dibuje (mm desde el borde de arriba de la hoja). */
  y = 0
  readonly anchoUtil = ANCHO - 2 * MARGEN
  private readonly pie: string[]

  constructor(JsPDF: typeof jsPDF, { titulo, asunto, pie, comprimir = true }: OpcionesDocumento) {
    this.doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: comprimir })
    this.doc.setProperties({ title: textoPdf(titulo), subject: textoPdf(asunto), author: 'COLORLINK', creator: 'COLORLINK' })
    this.doc.setLineHeightFactor(1.35)
    this.pie = pie.map(textoPdf)
  }

  private relleno(c: Rgb) {
    this.doc.setFillColor(c[0], c[1], c[2])
  }
  private trazo(c: Rgb) {
    this.doc.setDrawColor(c[0], c[1], c[2])
  }
  private tinta(c: Rgb) {
    this.doc.setTextColor(c[0], c[1], c[2])
  }
  private fuente(tam: number, estilo: 'normal' | 'bold' | 'italic' = 'normal') {
    this.doc.setFont('helvetica', estilo)
    this.doc.setFontSize(tam)
  }
  /** Alto de una línea de texto de `tam` puntos, en mm. */
  private altoLinea(tam: number) {
    return tam * MM_POR_PT * 1.35
  }
  /** Y de la línea base del texto de `tam` puntos cuya línea empieza en `this.y`. */
  private base(tam: number) {
    return this.y + tam * MM_POR_PT
  }
  private lineas(texto: string, ancho: number): string[] {
    return this.doc.splitTextToSize(textoPdf(texto), ancho) as string[]
  }

  private franja(y: number, alto: number) {
    const ancho = ANCHO / COLORES_FRANJA.length
    COLORES_FRANJA.forEach((c, i) => {
      this.relleno(c)
      this.doc.rect(i * ancho, y, ancho + 0.1, alto, 'F')
    })
  }

  /** Cuando algo no cabe en lo que queda de la hoja, sigue en una nueva. */
  asegurar(alto: number) {
    if (this.y + alto > BASE_PAGINA) this.paginaNueva()
  }

  paginaNueva() {
    this.doc.addPage()
    this.franja(0, 1.6)
    this.y = 14
  }

  espacio(mm: number) {
    this.y += mm
  }

  /** La primera hoja: franja de colores y banda azul con la marca, la referencia y la fecha. */
  encabezado(referencia: string, detalle: string) {
    const { doc } = this
    this.franja(0, 2.4)
    this.relleno(COLOR.navy)
    doc.rect(0, 2.4, ANCHO, 27, 'F')
    // El logo: un cuadro azul con una gota amarilla.
    this.relleno(COLOR.primario)
    doc.roundedRect(MARGEN, 8, 14, 14, 3, 3, 'F')
    this.relleno(COLOR.acento)
    doc.circle(MARGEN + 7, 16.4, 3.1, 'F')
    doc.triangle(MARGEN + 7, 9.8, MARGEN + 4.3, 14.8, MARGEN + 9.7, 14.8, 'F')

    this.fuente(18, 'bold')
    this.tinta(COLOR.blanco)
    doc.text('COLOR', MARGEN + 18, 15.6)
    const anchoColor = doc.getTextWidth('COLOR')
    this.tinta(COLOR.acento)
    doc.text('LINK', MARGEN + 18 + anchoColor, 15.6)
    this.fuente(6.5, 'bold')
    this.tinta(COLOR.azulClaro)
    doc.text('DISTRIBUIDOR OFICIAL PINTUCO', MARGEN + 18, 20.8, { charSpace: 0.45 })

    this.fuente(15, 'bold')
    this.tinta(COLOR.blanco)
    doc.text(textoPdf(referencia), ANCHO - MARGEN, 15.6, { align: 'right' })
    this.fuente(8)
    this.tinta(COLOR.azulClaro)
    doc.text(textoPdf(detalle), ANCHO - MARGEN, 21, { align: 'right' })
    this.y = 31
  }

  /** Dibuja una etiqueta redondeada (un estado, una gravedad) y devuelve lo que mide de ancho. */
  etiqueta(texto: string, x: number, y: number, fondo: Rgb, color: Rgb): number {
    this.fuente(8, 'bold')
    const t = textoPdf(texto)
    const ancho = this.doc.getTextWidth(t) + 6
    this.relleno(fondo)
    this.doc.roundedRect(x, y, ancho, 6, 3, 3, 'F')
    this.tinta(color)
    this.doc.text(t, x + 3, y + 4.2)
    return ancho
  }

  /** El título de la hoja y, a su lado, una etiqueta (por ejemplo el estado). */
  titulo(texto: string, etiqueta?: { texto: string; fondo: Rgb; color: Rgb }) {
    this.y += 11
    this.fuente(20, 'bold')
    this.tinta(COLOR.navy)
    const t = textoPdf(texto)
    this.doc.text(t, MARGEN, this.y)
    if (etiqueta) this.etiqueta(etiqueta.texto, MARGEN + this.doc.getTextWidth(t) + 4, this.y - 5.1, etiqueta.fondo, etiqueta.color)
    this.y += 3
  }

  seccion(texto: string) {
    this.asegurar(20)
    this.y += 7
    this.relleno(COLOR.acento)
    this.doc.roundedRect(MARGEN, this.y - 4.4, 1.4, 5.8, 0.7, 0.7, 'F')
    this.fuente(12, 'bold')
    this.tinta(COLOR.navy)
    this.doc.text(textoPdf(texto), MARGEN + 4, this.y)
    this.trazo(COLOR.borde)
    this.doc.setLineWidth(0.3)
    this.doc.line(MARGEN, this.y + 2.6, ANCHO - MARGEN, this.y + 2.6)
    this.y += 6
  }

  /** Datos de a pares: la etiqueta chica arriba y el valor debajo, en una o más columnas. */
  filas(filas: FilaDato[], columnas = 2) {
    const hueco = 6
    const ancho = (this.anchoUtil - hueco * (columnas - 1)) / columnas
    for (let i = 0; i < filas.length; i += columnas) {
      const grupo = filas.slice(i, i + columnas)
      this.fuente(10, 'bold')
      const lineas = grupo.map((f) => this.lineas(f.valor || '-', ancho))
      const alto = 4.6 + Math.max(...lineas.map((l) => l.length)) * this.altoLinea(10) + 1.6
      this.asegurar(alto)
      grupo.forEach((f, k) => {
        const x = MARGEN + k * (ancho + hueco)
        this.fuente(7, 'bold')
        this.tinta(COLOR.tenue)
        this.doc.text(textoPdf(f.etiqueta).toUpperCase(), x, this.y + 3, { charSpace: 0.25 })
        this.fuente(10, 'bold')
        this.tinta(COLOR.navy)
        this.doc.text(lineas[k], x, this.y + 7.6, { lineHeightFactor: 1.35 })
      })
      this.y += alto
    }
  }

  parrafo(
    texto: string,
    { tam = 9.5, color = COLOR.texto, estilo = 'normal', sangria = 0, despues = 2 }: { tam?: number; color?: Rgb; estilo?: 'normal' | 'bold' | 'italic'; sangria?: number; despues?: number } = {},
  ) {
    this.fuente(tam, estilo)
    this.tinta(color)
    const alto = this.altoLinea(tam)
    for (const linea of this.lineas(texto, this.anchoUtil - sangria)) {
      this.asegurar(alto)
      this.doc.text(linea, MARGEN + sangria, this.base(tam))
      this.y += alto
    }
    this.y += despues
  }

  lista(items: string[], { numerada = false, tam = 9.5 }: { numerada?: boolean; tam?: number } = {}) {
    const alto = this.altoLinea(tam)
    items.forEach((item, i) => {
      this.fuente(tam)
      const lineas = this.lineas(item, this.anchoUtil - 8)
      this.asegurar(alto * Math.min(lineas.length, 2) + 1)
      if (numerada) {
        this.relleno(COLOR.primario)
        this.doc.circle(MARGEN + 2.6, this.y + 2.1, 2.3, 'F')
        this.fuente(7.5, 'bold')
        this.tinta(COLOR.blanco)
        this.doc.text(String(i + 1), MARGEN + 2.6, this.y + 3.2, { align: 'center' })
      } else {
        this.relleno(COLOR.primario)
        this.doc.circle(MARGEN + 2.2, this.y + 2.1, 0.9, 'F')
      }
      this.fuente(tam)
      this.tinta(COLOR.texto)
      for (const linea of lineas) {
        this.asegurar(alto)
        this.doc.text(linea, MARGEN + 8, this.base(tam))
        this.y += alto
      }
      this.y += 1.3
    })
  }

  /** Una barra de porcentaje con su nombre (lo que encontró el análisis, de más a menos). */
  barra(nombre: string, porcentaje: number, color: Rgb) {
    this.asegurar(10)
    this.fuente(9, 'bold')
    this.tinta(COLOR.navy)
    this.doc.text(textoPdf(nombre), MARGEN, this.y + 3.2)
    this.tinta(COLOR.texto)
    this.doc.text(`${Math.round(porcentaje)}%`, ANCHO - MARGEN, this.y + 3.2, { align: 'right' })
    this.relleno(COLOR.borde)
    this.doc.roundedRect(MARGEN, this.y + 5, this.anchoUtil, 2.2, 1.1, 1.1, 'F')
    const ancho = Math.max(2.2, (this.anchoUtil * Math.min(100, Math.max(0, porcentaje))) / 100)
    this.relleno(color)
    this.doc.roundedRect(MARGEN, this.y + 5, ancho, 2.2, 1.1, 1.1, 'F')
    this.y += 10.5
  }

  /** Un recuadro de color con uno o más avisos (advertencias, o una nota). */
  aviso(textos: string[], { tono = 'alerta', titulo }: { tono?: 'alerta' | 'info' | 'exito'; titulo?: string } = {}) {
    const fondo = tono === 'alerta' ? COLOR.alertaFondo : tono === 'exito' ? COLOR.exitoFondo : COLOR.fondo
    const tinta = tono === 'alerta' ? COLOR.alerta : tono === 'exito' ? COLOR.exito : COLOR.texto
    const tam = 9
    const alto = this.altoLinea(tam)
    this.fuente(tam)
    const bloques = textos.map((t) => this.lineas(t, this.anchoUtil - 12))
    const total = 5 + (titulo ? alto + 0.8 : 0) + bloques.reduce((suma, b) => suma + b.length * alto + 1.2, 0)
    this.asegurar(total)
    this.relleno(fondo)
    this.doc.roundedRect(MARGEN, this.y, this.anchoUtil, total, 2, 2, 'F')
    this.relleno(tinta)
    this.doc.roundedRect(MARGEN, this.y, 1.2, total, 0.6, 0.6, 'F')
    const x = MARGEN + 6
    let y = this.y + 2.6
    this.tinta(tinta)
    if (titulo) {
      this.fuente(tam, 'bold')
      this.doc.text(textoPdf(titulo), x, y + tam * MM_POR_PT)
      y += alto + 0.8
    }
    this.fuente(tam)
    for (const bloque of bloques) {
      for (const linea of bloque) {
        this.doc.text(linea, x, y + tam * MM_POR_PT)
        y += alto
      }
      y += 1.2
    }
    this.y += total + 3
  }

  /** Fotos de dos en dos, cada una con su nombre y la leyenda de lo que se marcó. */
  fotos(fotos: FotoDoc[]) {
    const hueco = 6
    const ancho = (this.anchoUtil - hueco) / 2
    const altoMax = 60
    for (let i = 0; i < fotos.length; i += 2) {
      const par = fotos.slice(i, i + 2)
      const medidas = par.map((f) => {
        const alto = Math.min(altoMax, (ancho * f.alto) / f.ancho)
        return { w: (alto * f.ancho) / f.alto, h: alto }
      })
      const celda = Math.max(...medidas.map((m) => m.h)) + 10
      this.asegurar(celda)
      par.forEach((f, k) => {
        const x = MARGEN + k * (ancho + hueco)
        const { w, h } = medidas[k]
        this.doc.addImage(f.dataUrl, f.formato ?? 'JPEG', x, this.y, w, h, undefined, 'FAST')
        this.trazo(COLOR.borde)
        this.doc.setLineWidth(0.3)
        this.doc.roundedRect(x, this.y, w, h, 1.5, 1.5, 'S')
        this.fuente(7.5)
        this.tinta(COLOR.tenue)
        this.doc.text(this.lineas(f.nombre, ancho)[0] ?? '', x, this.y + h + 4)
        let cx = x
        for (const { color, texto } of f.leyenda ?? []) {
          this.relleno(color)
          this.doc.circle(cx + 1, this.y + h + 7.4, 1, 'F')
          this.tinta(COLOR.navy)
          this.doc.text(textoPdf(texto), cx + 3.2, this.y + h + 8.2)
          cx += 3.2 + this.doc.getTextWidth(textoPdf(texto)) + 4
        }
      })
      this.y += celda + 2
    }
  }

  /** Las etapas de un proceso en fila: las hechas en azul, la actual en amarillo, las que faltan en gris. */
  etapas(nombres: string[], actual: number) {
    this.asegurar(22)
    const paso = this.anchoUtil / nombres.length
    const cy = this.y + 5
    nombres.forEach((nombre, i) => {
      const numero = i + 1
      const hecha = numero < actual
      const enCurso = numero === actual
      const cx = MARGEN + paso * i + paso / 2
      if (i > 0) {
        this.trazo(hecha || enCurso ? COLOR.primario : COLOR.borde)
        this.doc.setLineWidth(0.8)
        this.doc.line(cx - paso + 4.6, cy, cx - 4.6, cy)
      }
      this.relleno(hecha ? COLOR.primario : enCurso ? COLOR.acento : COLOR.borde)
      this.doc.circle(cx, cy, 4, 'F')
      this.fuente(9, 'bold')
      this.tinta(hecha ? COLOR.blanco : enCurso ? COLOR.navy : COLOR.tenue)
      this.doc.text(String(numero), cx, cy + 1.2, { align: 'center' })
      this.fuente(7.5, enCurso ? 'bold' : 'normal')
      this.tinta(enCurso ? COLOR.navy : hecha ? COLOR.primario : COLOR.tenue)
      this.doc.text(textoPdf(nombre), cx, cy + 9, { align: 'center' })
    })
    this.y += 18
  }

  /** Una línea con texto a la izquierda y un valor a la derecha: un producto y su precio, o un total. */
  renglon(
    izquierda: string,
    derecha: string,
    { tam = 9.5, estilo = 'normal', color = COLOR.texto }: { tam?: number; estilo?: 'normal' | 'bold'; color?: Rgb } = {},
  ) {
    const alto = this.altoLinea(tam)
    this.fuente(tam, estilo)
    const reservado = this.doc.getTextWidth(textoPdf(derecha)) + 6
    const lineas = this.lineas(izquierda, this.anchoUtil - reservado)
    this.asegurar(alto * lineas.length)
    this.tinta(color)
    lineas.forEach((linea, i) => this.doc.text(linea, MARGEN, this.base(tam) + i * alto))
    this.doc.text(textoPdf(derecha), ANCHO - MARGEN, this.base(tam), { align: 'right' })
    this.y += alto * lineas.length + 0.8
  }

  separador() {
    this.asegurar(3)
    this.trazo(COLOR.borde)
    this.doc.setLineWidth(0.3)
    this.doc.line(MARGEN, this.y + 1, ANCHO - MARGEN, this.y + 1)
    this.y += 3
  }

  /** Un recuadro con un código grande (el de retiro de un pedido) y, debajo, una línea que explica para qué sirve. */
  codigo(texto: string, etiqueta: string, nota?: string) {
    const alto = nota ? 30 : 26
    this.asegurar(alto)
    this.relleno(COLOR.fondo)
    this.doc.roundedRect(MARGEN, this.y, this.anchoUtil, alto, 3, 3, 'F')
    this.trazo(COLOR.primario)
    this.doc.setLineWidth(0.5)
    this.doc.setLineDashPattern([2, 1.5], 0)
    this.doc.roundedRect(MARGEN + 1.5, this.y + 1.5, this.anchoUtil - 3, alto - 3, 2, 2, 'S')
    this.doc.setLineDashPattern([], 0)
    this.fuente(7, 'bold')
    this.tinta(COLOR.tenue)
    this.doc.text(textoPdf(etiqueta).toUpperCase(), ANCHO / 2, this.y + 7, { align: 'center', charSpace: 0.4 })
    this.doc.setFont('courier', 'bold')
    this.doc.setFontSize(28)
    this.tinta(COLOR.navy)
    this.doc.text(textoPdf(texto), ANCHO / 2, this.y + 18, { align: 'center', charSpace: 2 })
    if (nota) {
      this.fuente(8)
      this.tinta(COLOR.texto)
      this.doc.text(textoPdf(nota), ANCHO / 2, this.y + 25, { align: 'center' })
    }
    this.y += alto + 3
  }

  /** Pone el pie y la numeración en todas las hojas y entrega el PDF terminado. */
  cerrar(): jsPDF {
    const total = this.doc.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i)
      this.trazo(COLOR.borde)
      this.doc.setLineWidth(0.3)
      this.doc.line(MARGEN, ALTO - 17, ANCHO - MARGEN, ALTO - 17)
      this.fuente(7.5)
      this.tinta(COLOR.tenue)
      this.pie.forEach((linea, k) => this.doc.text(linea, MARGEN, ALTO - 12.5 + k * 3.6))
      this.doc.text(`Página ${i} de ${total}`, ANCHO - MARGEN, ALTO - 12.5, { align: 'right' })
    }
    return this.doc
  }
}
