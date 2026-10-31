import type { jsPDF } from 'jspdf'
import { COLOR, DocumentoPdf, hexARgb, type FotoDoc, type Rgb } from '@/shared/lib/pdf'
import { descargarArchivo } from '@/shared/lib/descarga'
import { fechaLarga } from '@/shared/lib/formato'
import { COLOR_CLASE, COLOR_PATOLOGIA, ETIQUETA_CLASE, clasesDeDiagnostico, fotoParaPdf } from '@/features/diagnostico/imagen'
import { ETAPAS_DEL_NEGOCIO, etapaDelNegocio } from '@/domain/solicitud/estadoMachine'
import type { Severidad, Solicitud } from '@/domain/solicitud/types'

const COLOR_GRAVEDAD: Record<Severidad, { fondo: Rgb; color: Rgb }> = {
  Leve: { fondo: COLOR.exitoFondo, color: COLOR.exito },
  Moderada: { fondo: COLOR.alertaFondo, color: COLOR.alerta },
  Severa: { fondo: COLOR.peligroFondo, color: COLOR.peligro },
}

const ETIQUETA_ESTADO = { fondo: [219, 233, 248] as Rgb, color: [0, 59, 119] as Rgb }

interface OpcionesResumen {
  /** Las fotos ya preparadas (ver `prepararFotos`); sin ellas el PDF va sin fotos. */
  fotos?: FotoDoc[]
  /** Las pruebas lo dejan sin comprimir para poder leer su texto. */
  comprimir?: boolean
}

/** El PDF de una solicitud: datos del proyecto, diagnóstico con sus fotos, solución recomendada y seguimiento. */
export async function construirResumenPdf(solicitud: Solicitud, { fotos = [], comprimir = true }: OpcionesResumen = {}): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf')
  const { data, recomendacion, diagnostico: d } = solicitud
  const { identificacion, proyecto, tecnica, evidencia } = data

  const pdf = new DocumentoPdf(jsPDF, {
    titulo: `Resumen de solicitud ${solicitud.id}`,
    asunto: 'Diagnóstico y solución recomendada',
    pie: ['COLORLINK · Distribuidor oficial Pintuco', 'Recomendación preliminar: un asesor técnico la revisa antes de ejecutar la obra.'],
    comprimir,
  })

  pdf.encabezado(solicitud.id, `Generado el ${fechaLarga(new Date().toISOString())}`)
  pdf.titulo('Resumen de solicitud', { texto: solicitud.estado, ...ETIQUETA_ESTADO })
  pdf.parrafo(
    `Registrada el ${fechaLarga(solicitud.fechaSolicitud)} · ${proyecto.tipoObra || 'Proyecto'}${proyecto.ciudad ? ` en ${proyecto.ciudad}` : ''}`,
    { despues: 0 },
  )

  // El estado va arriba, como resumen: en qué etapa está y cuándo pasó por cada una.
  pdf.seccion('Estado de tu solicitud')
  pdf.etapas(ETAPAS_DEL_NEGOCIO, etapaDelNegocio(solicitud.estado))
  pdf.parrafo('Tu solicitud ha sido registrada. Nuestro sistema continuará con la validación técnica y la disponibilidad de materiales.', { tam: 8.5, color: COLOR.tenue })
  pdf.filas(solicitud.historialEstados.map((h) => ({ etiqueta: h.estado, valor: fechaLarga(h.fecha) })), 3)

  pdf.seccion('Cliente y proyecto')
  pdf.filas([
    { etiqueta: 'Cliente', valor: identificacion.cliente },
    { etiqueta: 'Responsable', valor: identificacion.responsable },
    { etiqueta: 'Ciudad', valor: proyecto.ciudad },
    { etiqueta: 'Tipo de obra', valor: proyecto.tipoObra },
    { etiqueta: 'Área aproximada', valor: proyecto.areaAprox ? `${proyecto.areaAprox} m²` : '' },
    { etiqueta: 'Se requiere para el', valor: proyecto.fechaRequerida ? fechaLarga(proyecto.fechaRequerida) : '' },
    { etiqueta: 'Zona del problema', valor: evidencia.zona ?? '' },
    { etiqueta: 'Superficie', valor: tecnica.superficie },
    { etiqueta: 'Ambiente', valor: tecnica.ambiente },
    { etiqueta: 'Condición actual', valor: tecnica.condicion },
    { etiqueta: 'Color / acabado', valor: tecnica.colorAcabado },
  ])

  if (evidencia.descripcion.trim() || evidencia.observaciones.trim()) {
    pdf.seccion('Lo que nos contaste')
    if (evidencia.descripcion.trim()) pdf.parrafo(evidencia.descripcion.trim(), { estilo: 'italic' })
    if (evidencia.observaciones.trim()) pdf.parrafo(`Observaciones: ${evidencia.observaciones.trim()}`)
  }

  if (d) {
    pdf.seccion('Diagnóstico por imagen')
    pdf.parrafo(d.patologia, { tam: 15, color: COLOR.navy, estilo: 'bold', despues: 1.5 })
    pdf.asegurar(9)
    let x = 16
    const gravedad = d.severidad ? COLOR_GRAVEDAD[d.severidad] : { fondo: COLOR.exitoFondo, color: COLOR.exito }
    x += pdf.etiqueta(d.severidad ? `Gravedad ${d.severidad.toLowerCase()}` : 'Sin daños evidentes', x, pdf.y, gravedad.fondo, gravedad.color) + 3
    x += pdf.etiqueta(`Confianza del análisis ${d.confianza}%`, x, pdf.y, COLOR.fondo, COLOR.texto) + 3
    pdf.etiqueta(`Zona: ${d.zona}`, x, pdf.y, COLOR.fondo, COLOR.texto)
    pdf.espacio(9)
    pdf.parrafo(d.resumen)
    pdf.filas([{ etiqueta: 'Causa probable', valor: d.causaProbable }, { etiqueta: 'Cómo se obtuvo', valor: `${d.origen} (${d.fotos} foto${d.fotos === 1 ? '' : 's'})` }])

    if (d.hallazgos.length > 0) {
      pdf.espacio(1)
      pdf.parrafo('LO QUE ENCONTRÓ EL ANÁLISIS', { tam: 7, estilo: 'bold', color: COLOR.tenue, despues: 1.5 })
      for (const h of d.hallazgos.slice(0, 5)) pdf.barra(h.patologia, h.intensidad, hexARgb(COLOR_PATOLOGIA[h.patologia]))
    }
    if (fotos.length > 0) {
      pdf.espacio(2)
      pdf.fotos(fotos)
    }

    if (d.tratamiento.pasos.length > 0 || d.tratamiento.productos.length > 0) {
      pdf.seccion('Tratamiento recomendado')
      if (d.tratamiento.productos.length > 0) {
        pdf.parrafo('PRODUCTOS DEL SISTEMA', { tam: 7, estilo: 'bold', color: COLOR.tenue, despues: 1.5 })
        pdf.lista(d.tratamiento.productos)
        pdf.espacio(2)
      }
      if (d.tratamiento.pasos.length > 0) {
        pdf.parrafo('PASO A PASO', { tam: 7, estilo: 'bold', color: COLOR.tenue, despues: 1.5 })
        pdf.lista(d.tratamiento.pasos, { numerada: true })
      }
    }
    if (d.advertencias.length > 0) {
      pdf.espacio(2)
      pdf.aviso(d.advertencias, { titulo: 'Ten en cuenta' })
    }
  } else if (fotos.length > 0) {
    pdf.seccion('Fotos')
    pdf.fotos(fotos)
  }

  pdf.seccion('Solución recomendada')
  pdf.filas([
    { etiqueta: 'Tipo de solución', valor: recomendacion.tipoSolucion },
    { etiqueta: 'Producto / recubrimiento', valor: recomendacion.producto },
    { etiqueta: 'Acabado', valor: recomendacion.acabado },
    { etiqueta: 'Cantidad estimada', valor: recomendacion.cantidadEstimada },
    { etiqueta: 'Aplicación recomendada', valor: recomendacion.aplicacion },
    { etiqueta: 'Tiempo estimado', valor: recomendacion.tiempoEstimado },
  ])
  if (recomendacion.advertencias.length > 0) pdf.aviso(recomendacion.advertencias)

  return pdf.cerrar()
}

/** Las fotos de la solicitud, listas para el PDF: reducidas y con las zonas del diagnóstico marcadas. */
async function prepararFotos(solicitud: Solicitud): Promise<FotoDoc[]> {
  const clases = solicitud.diagnostico ? clasesDeDiagnostico(solicitud.diagnostico) : undefined
  const listas = await Promise.all(
    solicitud.data.evidencia.imagenes.slice(0, 4).map(async (img): Promise<FotoDoc | null> => {
      try {
        const foto = await fotoParaPdf(img.url, clases)
        return {
          dataUrl: foto.dataUrl,
          ancho: foto.ancho,
          alto: foto.alto,
          nombre: img.nombre,
          leyenda: foto.leyenda.map((c) => ({ color: COLOR_CLASE[c].rgb, texto: ETIQUETA_CLASE[c] })),
        }
      } catch {
        return null // una foto que no carga no impide bajar el resumen
      }
    }),
  )
  return listas.filter((f): f is FotoDoc => f !== null)
}

export async function descargarResumenPdf(solicitud: Solicitud): Promise<void> {
  const pdf = await construirResumenPdf(solicitud, { fotos: await prepararFotos(solicitud) })
  descargarArchivo(pdf.output('blob'), `colorlink-${solicitud.id}.pdf`)
}
