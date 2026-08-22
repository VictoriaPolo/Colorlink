import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Usuario } from './types'
import { validarCredenciales } from './mockUsuarios'
import { readStorage, writeStorage, clearStorage } from '@/data/repositories/storage'

const STORAGE_KEY = 'colorlink:sesion'
const STORAGE_VERSION = 1

export type LoginResultado = { ok: true } | { ok: false; error: string }

interface AuthContextValue {
  usuario: Usuario | null
  cargando: boolean
  login: (email: string, password: string) => LoginResultado
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setUsuario(readStorage<Usuario>(STORAGE_KEY, STORAGE_VERSION))
    setCargando(false)
  }, [])

  const login = (email: string, password: string): LoginResultado => {
    const encontrado = validarCredenciales(email, password)
    if (!encontrado) {
      return { ok: false, error: 'Correo o contraseña incorrectos.' }
    }
    setUsuario(encontrado)
    writeStorage(STORAGE_KEY, STORAGE_VERSION, encontrado)
    return { ok: true }
  }

  const logout = () => {
    setUsuario(null)
    clearStorage(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
