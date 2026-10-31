import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DiagnosticoImagen, Solicitud, SolicitudFormData } from '@/domain/solicitud/types'
import { puedeVerSolicitud } from '@/domain/solicitud/visibilidad'
import { solicitudesRepository } from '@/data/repositories/solicitudesRepository'
import { useAuth } from '@/features/auth/AuthContext'

interface SolicitudesContextValue {
  /** Las que la sesión actual puede ver: todas para el equipo, solo las propias para un cliente. */
  solicitudes: Solicitud[]
  /** La más reciente sin finalizar (o la más reciente, si todas lo están). */
  proyectoActivo: Solicitud | undefined
  cargando: boolean
  crearSolicitud: (data: SolicitudFormData, diagnostico?: DiagnosticoImagen) => Promise<Solicitud>
  obtenerSolicitud: (id: string) => Solicitud | undefined
  avanzarEstadoSolicitud: (id: string) => Promise<Solicitud | undefined>
  /** Equipo: quién atiende la solicitud (sin responsable la deja sin asignar). */
  asignarSolicitud: (id: string, responsable: string | undefined) => Promise<Solicitud | undefined>
  /** Equipo: nota interna firmada con el nombre de quien escribe (por defecto,
   * la cuenta con sesión; pásalo si el equipo usa una identidad activa distinta). */
  agregarNotaSolicitud: (id: string, texto: string, autor?: string) => Promise<Solicitud | undefined>
  /** Equipo: cierra el caso sin avanzarlo más. */
  cancelarSolicitud: (id: string, motivo: string, autor?: string) => Promise<Solicitud | undefined>
  /** Equipo: deshace una cancelación. */
  reactivarSolicitud: (id: string) => Promise<Solicitud | undefined>
}

const SolicitudesContext = createContext<SolicitudesContextValue | null>(null)

export function SolicitudesProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const [todas, setTodas] = useState<Solicitud[]>([])
  const [cargando, setCargando] = useState(true)

  // Se vuelve a leer al entrar o salir una cuenta: con Supabase Auth, lo que se puede leer depende de la sesión.
  const idUsuario = usuario?.id
  useEffect(() => {
    let cancelado = false
    solicitudesRepository
      .listar()
      .then((datos) => {
        if (!cancelado) setTodas(datos)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [idUsuario])

  const value = useMemo<SolicitudesContextValue>(() => {
    const solicitudes = todas.filter((s) => puedeVerSolicitud(s, usuario))

    /** Deja en pantalla la versión nueva de una solicitud que acaba de cambiar. */
    const reemplazar = (actualizada: Solicitud | undefined) => {
      if (actualizada) setTodas((prev) => prev.map((s) => (s.id === actualizada.id ? actualizada : s)))
      return actualizada
    }

    return {
      solicitudes,
      proyectoActivo: solicitudes.find((s) => s.estado !== 'Finalizada') ?? solicitudes[0],
      cargando,
      crearSolicitud: async (data, diagnostico) => {
        const nueva = await solicitudesRepository.crear(data, { propietario: usuario?.email, diagnostico })
        setTodas((prev) => [nueva, ...prev])
        return nueva
      },
      obtenerSolicitud: (id) => solicitudes.find((s) => s.id === id),
      avanzarEstadoSolicitud: async (id) => reemplazar(await solicitudesRepository.avanzar(id)),
      asignarSolicitud: async (id, responsable) => reemplazar(await solicitudesRepository.asignar(id, responsable)),
      agregarNotaSolicitud: async (id, texto, autor) =>
        reemplazar(await solicitudesRepository.agregarNota(id, autor ?? usuario?.nombre ?? 'Equipo COLORLINK', texto)),
      cancelarSolicitud: async (id, motivo, autor) =>
        reemplazar(await solicitudesRepository.cancelar(id, autor ?? usuario?.nombre ?? 'Equipo COLORLINK', motivo)),
      reactivarSolicitud: async (id) => reemplazar(await solicitudesRepository.reactivar(id)),
    }
  }, [todas, cargando, usuario])

  return <SolicitudesContext.Provider value={value}>{children}</SolicitudesContext.Provider>
}

export function useSolicitudes() {
  const ctx = useContext(SolicitudesContext)
  if (!ctx) throw new Error('useSolicitudes debe usarse dentro de SolicitudesProvider')
  return ctx
}
