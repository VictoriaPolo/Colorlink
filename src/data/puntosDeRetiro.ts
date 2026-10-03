export interface PuntoDeRetiro {
  nombre: string
  ciudad: string
  direccion: string
  horario: string
}

export const puntosDeRetiro: PuntoDeRetiro[] = [
  {
    nombre: 'Centro de Pinturas Colorlink - El Prado',
    ciudad: 'Barranquilla',
    direccion: 'Cra. 54 #72-30, El Prado',
    horario: 'Lun a sáb: 8:00 a. m. - 6:00 p. m.',
  },
  {
    nombre: 'Centro de Pinturas Colorlink - Chapinero',
    ciudad: 'Bogotá',
    direccion: 'Cra. 13 #63-42, Chapinero',
    horario: 'Lun a sáb: 8:00 a. m. - 6:00 p. m.',
  },
  {
    nombre: 'Centro de Pinturas Colorlink - Poblado',
    ciudad: 'Medellín',
    direccion: 'Cra. 43A #6-15, El Poblado',
    horario: 'Lun a sáb: 8:00 a. m. - 6:00 p. m.',
  },
  {
    nombre: 'Centro de Pinturas Colorlink - Sur',
    ciudad: 'Cali',
    direccion: 'Av. Roosevelt #24-50',
    horario: 'Lun a vie: 8:00 a. m. - 5:30 p. m. · Sáb: 8:00 a. m. - 1:00 p. m.',
  },
]
