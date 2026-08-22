import { z } from 'zod'

/**
 * Fuente única de verdad para las reglas de validación de cada paso del
 * wizard. Antes vivían como `if` sueltos dentro de WizardPage; centralizarlas
 * aquí evita reglas duplicadas/ inconsistentes si se agregan más pasos.
 */

const requerido = (mensaje = 'Este campo es obligatorio.') => z.string().trim().min(1, mensaje)

export const identificacionSchema = z.object({
  cliente: requerido(),
  nit: requerido(),
  responsable: requerido(),
  canal: z.enum(['Página web', 'WhatsApp', 'Llamada', 'Punto físico', 'Otro'], {
    message: 'Selecciona un canal.',
  }),
})

export const proyectoSchema = z.object({
  ciudad: requerido('Selecciona una ciudad.'),
  tipoObra: z.enum(
    ['Vivienda', 'Edificio', 'Local comercial', 'Oficina', 'Bodega', 'Proyecto industrial', 'Otro'],
    { message: 'Selecciona un tipo de obra.' },
  ),
  areaAprox: z
    .string()
    .refine((v) => Number(v) > 0, 'Ingresa un área válida.'),
  fechaRequerida: requerido('Selecciona una fecha.').refine((v) => {
    const fecha = new Date(v)
    const hoy = new Date(new Date().toDateString())
    return !Number.isNaN(fecha.getTime()) && fecha >= hoy
  }, 'La fecha debe ser hoy o posterior.'),
})

export const tecnicaSchema = z.object({
  superficie: z.enum(['Interior', 'Exterior', 'Fachada', 'Metal', 'Madera', 'Concreto', 'Otro'], {
    message: 'Selecciona una opción.',
  }),
  ambiente: z.enum(['Interior seco', 'Interior húmedo', 'Exterior', 'Industrial', 'Alta exposición'], {
    message: 'Selecciona una opción.',
  }),
  condicion: z.enum(
    ['Nueva', 'Buen estado', 'Desgastada', 'Con humedad', 'Con grietas', 'Con pintura deteriorada', 'Requiere reparación'],
    { message: 'Selecciona una opción.' },
  ),
  colorAcabado: z.enum(['Mate', 'Satinado', 'Brillante', 'Antideslizante', 'No estoy seguro'], {
    message: 'Selecciona una opción.',
  }),
})

export const evidenciaSchema = z.object({
  descripcion: requerido('Cuéntanos brevemente qué necesitas.'),
  observaciones: z.string(),
  imagenes: z.array(z.object({ id: z.string(), nombre: z.string(), url: z.string() })),
  consentimiento: z.literal(true, { message: 'Debes aceptar el tratamiento de datos.' }),
})

export const wizardSchemas = {
  1: identificacionSchema,
  2: proyectoSchema,
  3: tecnicaSchema,
  4: evidenciaSchema,
} as const

/** Convierte el resultado de zod a { campo: primerMensajeDeError } —
 * mismo formato que ya consumen los componentes Step1..Step4. */
export function primerosErrores(issues: z.ZodIssue[]): Record<string, string> {
  const errores: Record<string, string> = {}
  for (const issue of issues) {
    const campo = String(issue.path[0])
    if (!(campo in errores)) errores[campo] = issue.message
  }
  return errores
}
