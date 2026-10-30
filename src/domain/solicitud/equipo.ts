/** Personas del equipo que atienden solicitudes (datos de demostración). */
export const EQUIPO = [
  { nombre: 'Camila Vargas', cargo: 'Asesora técnica' },
  { nombre: 'Andrés Moreno', cargo: 'Asesor técnico' },
  { nombre: 'Daniela Ortiz', cargo: 'Coordinadora de obra' },
] as const

export type MiembroEquipo = (typeof EQUIPO)[number]
