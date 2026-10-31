import { useEffect, useRef, useState } from 'react'
import { Bell, Trash2 } from 'lucide-react'
import { useToast } from '@/shared/lib/toast'

function hace(fechaISO: string): string {
  const minutos = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 60000)
  if (minutos < 1) return 'ahora'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return `hace ${Math.floor(horas / 24)} d`
}

/** Centro de notificaciones del equipo: lo que antes eran toasts efímeros
 * (3.5s y se pierden) queda aquí con historial — si nadie estaba mirando la
 * pantalla cuando avanzó una solicitud o cambió un pedido, lo ve al entrar. */
export default function NotificationBell() {
  const { notificaciones, marcarNotificacionesLeidas, limpiarNotificaciones } = useToast()
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const sinLeer = notificaciones.filter((n) => !n.leida).length

  useEffect(() => {
    if (!abierto) return
    const alClicAfuera = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false)
    }
    const alEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', alClicAfuera)
    document.addEventListener('keydown', alEscape)
    return () => {
      document.removeEventListener('mousedown', alClicAfuera)
      document.removeEventListener('keydown', alEscape)
    }
  }, [abierto])

  const alternar = () => {
    setAbierto((v) => !v)
    if (!abierto && sinLeer > 0) marcarNotificacionesLeidas()
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        onClick={alternar}
        aria-label={sinLeer > 0 ? `Notificaciones, ${sinLeer} sin leer` : 'Notificaciones'}
        aria-expanded={abierto}
        className="relative rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
      >
        <Bell size={18} />
        {sinLeer > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-extrabold text-navy">
            {sinLeer}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-soft-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-navy">Notificaciones</h3>
            {notificaciones.length > 0 && (
              <button onClick={limpiarNotificaciones} className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-500">
                <Trash2 size={13} /> Borrar
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Sin novedades por ahora.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notificaciones.map((n) => (
                  <li key={n.id} className="px-4 py-3 text-sm">
                    <p className="text-navy">{n.mensaje}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{hace(n.fecha)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
