import { createContext, useContext } from 'react'

export type ToastTipo = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  tipo: ToastTipo
  mensaje: string
}

export interface ToastContextValue {
  toasts: Toast[]
  mostrarToast: (mensaje: string, tipo?: ToastTipo) => void
  descartarToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
