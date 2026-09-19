import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Solicitud, SolicitudFormData } from '@/domain/solicitud/types'
import { solicitudesRepository } from '@/data/repositories/solicitudesRepository'

interface SolicitudesContextValue {
  solicitudes: Solicitud[]
  cargando: boolean
  crearSolicitud: (data: SolicitudFormData) => Promise<Solicitud>
  obtenerSolicitud: (id: string) => Solicitud | undefined
  avanzarEstadoSolicitud: (id: string) => Promise<Solicitud | undefined>
}

const SolicitudesContext = createContext<SolicitudesContextValue | null>(null)

export function SolicitudesProvider({ children }: { children: ReactNode }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelado = false
    solicitudesRepository.listar().then((datos) => {
      if (cancelado) return
      setSolicitudes(datos)
      setCargando(false)
    })
    return () => {
      cancelado = true
    }
  }, [])

  const crearSolicitud = async (data: SolicitudFormData): Promise<Solicitud> => {
    const nueva = await solicitudesRepository.crear(data)
    setSolicitudes((prev) => [nueva, ...prev])
    return nueva
  }

  const obtenerSolicitud = (id: string) => solicitudes.find((s) => s.id === id)

  const avanzarEstadoSolicitud = async (id: string): Promise<Solicitud | undefined> => {
    const actualizada = await solicitudesRepository.avanzar(id)
    if (!actualizada) return undefined
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? actualizada : s)))
    return actualizada
  }

  const value = useMemo(
    () => ({ solicitudes, cargando, crearSolicitud, obtenerSolicitud, avanzarEstadoSolicitud }),
    [solicitudes, cargando],
  )

  return <SolicitudesContext.Provider value={value}>{children}</SolicitudesContext.Provider>
}

export function useSolicitudes() {
  const ctx = useContext(SolicitudesContext)
  if (!ctx) throw new Error('useSolicitudes debe usarse dentro de SolicitudesProvider')
  return ctx
}
