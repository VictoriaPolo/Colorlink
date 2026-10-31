import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Usuario } from './types'
import { authRepository } from '@/data/repositories/authRepository'
import type {
  DatosRegistro,
  IdentidadSocial,
  ProveedorSocial,
  ResultadoAuth,
} from '@/data/repositories/authRepository.types'

interface AuthContextValue {
  usuario: Usuario | null
  cargando: boolean
  /** true si Google/Facebook entran por Supabase Auth (redirección). */
  proveedoresReales: boolean
  login: (email: string, password: string) => Promise<ResultadoAuth>
  registrar: (datos: DatosRegistro) => Promise<ResultadoAuth>
  loginConProveedor: (proveedor: ProveedorSocial, identidad?: IdentidadSocial) => Promise<ResultadoAuth>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    authRepository
      .restaurarSesion()
      .then((restaurado) => vivo && setUsuario(restaurado))
      .catch(() => {})
      .finally(() => vivo && setCargando(false))
    // Volver de Google/Facebook (o una sesión que vence) llega por aquí.
    const dejarDeEscuchar = authRepository.alCambiarSesion?.((nuevo) => vivo && setUsuario(nuevo))
    return () => {
      vivo = false
      dejarDeEscuchar?.()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    /** Si el resultado trae sesión, queda abierta en la app. */
    const abrir = (resultado: ResultadoAuth) => {
      if (resultado.ok && 'usuario' in resultado) setUsuario(resultado.usuario)
      return resultado
    }
    return {
      usuario,
      cargando,
      proveedoresReales: authRepository.proveedoresReales,
      login: async (email, password) => abrir(await authRepository.iniciarSesion(email, password)),
      registrar: async (datos) => abrir(await authRepository.registrar(datos)),
      loginConProveedor: async (proveedor, identidad) => abrir(await authRepository.iniciarConProveedor(proveedor, identidad)),
      logout: async () => {
        await authRepository.cerrarSesion()
        setUsuario(null)
      },
    }
  }, [usuario, cargando])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
