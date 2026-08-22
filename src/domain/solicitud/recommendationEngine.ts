import type { Recomendacion, SolicitudFormData } from '@/domain/solicitud/types'

/**
 * Motor de recomendación basado en reglas (placeholder de IA).
 * Aislado deliberadamente: el objetivo es que en el futuro esta función
 * pueda reemplazarse por una llamada a un modelo/API real sin tocar
 * el resto de la aplicación — misma firma, mismo tipo de salida.
 */
export function generarRecomendacion(data: SolicitudFormData): Recomendacion {
  const { proyecto, tecnica } = data
  const area = Number(proyecto.areaAprox) || 0
  const advertencias: string[] = []

  let tipoSolucion = 'Sistema de recubrimiento general'
  let producto = 'Recubrimiento multipropósito COLORLINK'

  if (tecnica.superficie === 'Exterior' || tecnica.ambiente === 'Exterior') {
    tipoSolucion = 'Sistema de recubrimiento para exterior'
    producto = 'Recubrimiento acrílico de alta resistencia climática'
  } else if (tecnica.ambiente === 'Interior húmedo' || tecnica.condicion === 'Con humedad') {
    tipoSolucion = 'Sistema de recubrimiento con protección contra humedad'
    producto = 'Recubrimiento antihumedad de secado rápido'
  } else if (tecnica.ambiente === 'Industrial' || tecnica.superficie === 'Metal') {
    tipoSolucion = 'Sistema de recubrimiento industrial anticorrosivo'
    producto = 'Esmalte industrial de alto desempeño'
  } else if (tecnica.ambiente === 'Alta exposición' || tecnica.superficie === 'Fachada') {
    tipoSolucion = 'Sistema de recubrimiento de alta exposición'
    producto = 'Recubrimiento elastomérico protector UV'
  } else if (tecnica.superficie === 'Madera') {
    tipoSolucion = 'Sistema de protección y acabado para madera'
    producto = 'Sellador y acabado para madera'
  } else if (tecnica.superficie === 'Concreto') {
    tipoSolucion = 'Sistema de recubrimiento para concreto'
    producto = 'Recubrimiento sellador para concreto'
  } else if (tecnica.ambiente === 'Interior seco' || tecnica.superficie === 'Interior') {
    tipoSolucion = 'Sistema de recubrimiento para interior'
    producto = 'Pintura interior de bajo olor y alta cubrición'
  }

  if (tecnica.condicion === 'Con humedad') {
    advertencias.push(
      'Se detectó humedad en la superficie. Se recomienda un tratamiento previo antihumedad antes de aplicar el recubrimiento.',
    )
  }
  if (tecnica.condicion === 'Con grietas') {
    advertencias.push(
      'Se recomienda validar previamente el estado de la superficie antes de aplicar el recubrimiento.',
    )
  }
  if (tecnica.condicion === 'Requiere reparación' || tecnica.condicion === 'Con pintura deteriorada') {
    advertencias.push(
      'La superficie requiere preparación o reparación previa para asegurar una correcta adherencia del producto.',
    )
  }

  let acabado: string
  if (tecnica.colorAcabado === 'No estoy seguro' || !tecnica.colorAcabado) {
    acabado =
      tecnica.ambiente === 'Exterior' || tecnica.ambiente === 'Alta exposición'
        ? 'Satinado (sugerido para exteriores)'
        : 'Mate (sugerido para interiores)'
  } else {
    acabado = tecnica.colorAcabado
  }

  const unidades = Math.max(1, Math.ceil(area / 15))
  const cantidadEstimada = area > 0 ? `${unidades} unidades (aprox. ${area} m²)` : `${unidades} unidades`

  const aplicacion =
    tecnica.condicion === 'Requiere reparación' ||
    tecnica.condicion === 'Con pintura deteriorada' ||
    tecnica.condicion === 'Con grietas'
      ? '1 capa base + 2 capas de acabado'
      : '2 capas'

  let tiempoEstimado = '1 a 2 días'
  if (area > 200) tiempoEstimado = '5 a 7 días'
  else if (area > 80) tiempoEstimado = '3 a 4 días'
  else if (area > 30) tiempoEstimado = '2 a 3 días'

  return {
    tipoSolucion,
    producto,
    acabado,
    cantidadEstimada,
    aplicacion,
    tiempoEstimado,
    advertencias,
    estadoTexto: 'Recomendación preliminar',
  }
}
