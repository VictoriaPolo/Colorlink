import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Solicitud, SolicitudFormData } from '../types'
import { solicitudesIniciales, CLIENTE_ACTUAL } from '../data/mockData'
import { generarRecomendacion } from '../logic/recommendationEngine'

interface SolicitudesContextValue {
  clienteActual: string
  solicitudes: Solicitud[]
  crearSolicitud: (data: SolicitudFormData) => Solicitud
  obtenerSolicitud: (id: string) => Solicitud | undefined
}

const SolicitudesContext = createContext<SolicitudesContextValue | null>(null)

let contador = solicitudesIniciales.length + 1

export function SolicitudesProvider({ children }: { children: ReactNode }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(solicitudesIniciales)

  const crearSolicitud = (data: SolicitudFormData): Solicitud => {
    const nueva: Solicitud = {
      id: `CL-${1000 + contador}`,
      fechaSolicitud: new Date().toISOString().slice(0, 10),
      estado: 'En análisis',
      data,
      recomendacion: generarRecomendacion(data),
    }
    contador += 1
    setSolicitudes((prev) => [nueva, ...prev])
    return nueva
  }

  const obtenerSolicitud = (id: string) => solicitudes.find((s) => s.id === id)

  const value = useMemo(
    () => ({ clienteActual: CLIENTE_ACTUAL, solicitudes, crearSolicitud, obtenerSolicitud }),
    [solicitudes],
  )

  return <SolicitudesContext.Provider value={value}>{children}</SolicitudesContext.Provider>
}

export function useSolicitudes() {
  const ctx = useContext(SolicitudesContext)
  if (!ctx) throw new Error('useSolicitudes debe usarse dentro de SolicitudesProvider')
  return ctx
}
