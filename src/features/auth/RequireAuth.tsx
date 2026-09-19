import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { RolUsuario } from './types'

const HOME_POR_ROL: Record<RolUsuario, string> = {
  admin: '/admin',
  cliente: '/',
}

export default function RequireAuth({ children, rol }: { children: ReactNode; rol?: RolUsuario }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) return null

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (rol && usuario.rol !== rol) {
    return <Navigate to={HOME_POR_ROL[usuario.rol]} replace />
  }

  return <>{children}</>
}
