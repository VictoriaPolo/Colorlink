import { describe, expect, it } from 'vitest'
import { puedeVerSolicitud, type Observador } from './visibilidad'
import type { Solicitud } from './types'

const solicitud = (propietario?: string): Solicitud =>
  ({ id: 'CL-1', propietario }) as unknown as Solicitud

const cliente: Observador = { email: 'ana@correo.com', rol: 'cliente' }
const demo: Observador = { email: 'laura@colorlink.com', rol: 'cliente', demo: true }
const equipo: Observador = { email: 'admin@colorlink.com', rol: 'admin', demo: true }

describe('puedeVerSolicitud', () => {
  it('el equipo ve todas, tengan dueño o no', () => {
    expect(puedeVerSolicitud(solicitud('ana@correo.com'), equipo)).toBe(true)
    expect(puedeVerSolicitud(solicitud(), equipo)).toBe(true)
  })

  it('un cliente ve las suyas, sin importar mayúsculas ni espacios', () => {
    expect(puedeVerSolicitud(solicitud('ana@correo.com'), cliente)).toBe(true)
    expect(puedeVerSolicitud(solicitud(' Ana@Correo.com '), cliente)).toBe(true)
  })

  it('un cliente no ve las de otro', () => {
    expect(puedeVerSolicitud(solicitud('otra@correo.com'), cliente)).toBe(false)
  })

  it('las de ejemplo sin dueño solo las ven las cuentas de demostración', () => {
    expect(puedeVerSolicitud(solicitud(), cliente)).toBe(false)
    expect(puedeVerSolicitud(solicitud(), demo)).toBe(true)
  })

  it('sin sesión no se ve nada', () => {
    expect(puedeVerSolicitud(solicitud('ana@correo.com'), null)).toBe(false)
    expect(puedeVerSolicitud(solicitud(), undefined)).toBe(false)
  })
})
