import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { ToastContext, type Notificacion, type Toast, type ToastTipo } from '@/shared/lib/toast'
import { readStorage, writeStorage } from '@/data/repositories/storage'

const ICONS: Record<ToastTipo, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const STYLES: Record<ToastTipo, string> = {
  success: 'border-green-100 bg-white text-success',
  error: 'border-red-100 bg-white text-red-500',
  info: 'border-brand-100 bg-white text-primary',
}

const STORAGE_KEY = 'colorlink:notificaciones'
const STORAGE_VERSION = 1
const MAX_NOTIFICACIONES = 30

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  useEffect(() => {
    setNotificaciones(readStorage<Notificacion[]>(STORAGE_KEY, STORAGE_VERSION) ?? [])
  }, [])

  const descartarToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const mostrarToast = useCallback(
    (mensaje: string, tipo: ToastTipo = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts((prev) => [...prev, { id, tipo, mensaje }])
      setTimeout(() => descartarToast(id), 3500)

      setNotificaciones((prev) => {
        const siguiente = [{ id, tipo, mensaje, fecha: new Date().toISOString(), leida: false }, ...prev].slice(0, MAX_NOTIFICACIONES)
        writeStorage(STORAGE_KEY, STORAGE_VERSION, siguiente)
        return siguiente
      })
    },
    [descartarToast],
  )

  const marcarNotificacionesLeidas = useCallback(() => {
    setNotificaciones((prev) => {
      const siguiente = prev.map((n) => ({ ...n, leida: true }))
      writeStorage(STORAGE_KEY, STORAGE_VERSION, siguiente)
      return siguiente
    })
  }, [])

  const limpiarNotificaciones = useCallback(() => {
    setNotificaciones([])
    writeStorage(STORAGE_KEY, STORAGE_VERSION, [])
  }, [])

  return (
    <ToastContext.Provider
      value={{ toasts, mostrarToast, descartarToast, notificaciones, marcarNotificacionesLeidas, limpiarNotificaciones }}
    >
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tipo]
          return (
            <div
              key={toast.id}
              className={`shadow-soft-lg pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium animate-slide-up ${STYLES[toast.tipo]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-navy">{toast.mensaje}</p>
              <button
                onClick={() => descartarToast(toast.id)}
                className="text-slate-300 hover:text-slate-500"
                aria-label="Cerrar notificación"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
