import { useNavigate } from 'react-router-dom'
import { ChevronRight, FastForward } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Badge from '@/shared/ui/Badge'
import type { Solicitud } from '@/domain/solicitud/types'
import { estaFinalizada, etiquetaSiguienteAccion } from '@/domain/solicitud/estadoMachine'

interface SolicitudesTableProps {
  solicitudes: Solicitud[]
  detalleBasePath: string
  mostrarCliente?: boolean
  onAvanzar: (id: string) => void
}

export default function SolicitudesTable({
  solicitudes,
  detalleBasePath,
  mostrarCliente,
  onAvanzar,
}: SolicitudesTableProps) {
  const navigate = useNavigate()

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3.5">ID</th>
              {mostrarCliente && <th className="px-5 py-3.5">Cliente</th>}
              <th className="px-5 py-3.5">Proyecto</th>
              <th className="px-5 py-3.5">Ciudad</th>
              <th className="px-5 py-3.5">Fecha</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr
                key={s.id}
                className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
              >
                <td
                  className="cursor-pointer px-5 py-4 font-semibold text-navy"
                  onClick={() => navigate(`${detalleBasePath}/${s.id}`)}
                >
                  {s.id}
                </td>
                {mostrarCliente && (
                  <td className="px-5 py-4 text-body">{s.data.identificacion.cliente || '—'}</td>
                )}
                <td className="px-5 py-4 text-body">{s.data.proyecto.tipoObra || '—'}</td>
                <td className="px-5 py-4 text-body">{s.data.proyecto.ciudad || '—'}</td>
                <td className="px-5 py-4 text-body">{s.fechaSolicitud}</td>
                <td className="px-5 py-4">
                  <Badge estado={s.estado} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-3">
                    {!estaFinalizada(s.estado) && (
                      <button
                        onClick={() => onAvanzar(s.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
                        title={etiquetaSiguienteAccion(s.estado).larga}
                      >
                        <FastForward size={13} /> {etiquetaSiguienteAccion(s.estado).corta}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`${detalleBasePath}/${s.id}`)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      Ver detalle <ChevronRight size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
