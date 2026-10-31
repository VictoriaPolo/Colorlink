import { useCallback, useState } from 'react'
import { EQUIPO } from '@/domain/solicitud/equipo'
import { readStorage, writeStorage } from './storage'

const KEY = 'colorlink:equipo-extra'
const VERSION = 1

export interface PersonaEquipo {
  nombre: string
  cargo: string
}

function cargarExtra(): PersonaEquipo[] {
  return readStorage<PersonaEquipo[]>(KEY, VERSION) ?? []
}

/** El roster del equipo: las personas de ejemplo (fijas, no se pueden quitar)
 * más las que el propio equipo agregue desde /admin/equipo (persistidas en
 * el navegador — mismo alcance que el resto del prototipo sin Supabase). */
export function listarEquipo(): PersonaEquipo[] {
  return [...EQUIPO, ...cargarExtra()]
}

export function esMiembroFijo(nombre: string): boolean {
  return EQUIPO.some((m) => m.nombre === nombre)
}

export function agregarMiembro(nombre: string, cargo: string): PersonaEquipo[] {
  const limpio = nombre.trim()
  const extra = cargarExtra()
  if (!limpio || listarEquipo().some((m) => m.nombre === limpio)) return extra
  const siguiente = [...extra, { nombre: limpio, cargo: cargo.trim() || 'Asesor técnico' }]
  writeStorage(KEY, VERSION, siguiente)
  return siguiente
}

export function quitarMiembro(nombre: string): PersonaEquipo[] {
  const siguiente = cargarExtra().filter((m) => m.nombre !== nombre)
  writeStorage(KEY, VERSION, siguiente)
  return siguiente
}

/** El roster reactivo: se vuelve a leer de localStorage cada vez que se agrega o quita a alguien. */
export function useEquipo() {
  const [, forzarActualizacion] = useState(0)

  const agregar = useCallback((nombre: string, cargo: string) => {
    agregarMiembro(nombre, cargo)
    forzarActualizacion((v) => v + 1)
  }, [])

  const quitar = useCallback((nombre: string) => {
    quitarMiembro(nombre)
    forzarActualizacion((v) => v + 1)
  }, [])

  return { equipo: listarEquipo(), agregar, quitar }
}
