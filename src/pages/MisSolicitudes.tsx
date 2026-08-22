import { useNavigate } from 'react-router-dom'
import { PlusCircle, ChevronRight, Inbox, FastForward } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { useToast } from '@/shared/lib/toast'
import { estaFinalizada } from '@/domain/solicitud/estadoMachine'

export default function MisSolicitudes() {
  const navigate = useNavigate()
  const { solicitudes, cargando, avanzarEstadoSolicitud } = useSolicitudes()
  const { mostrarToast } = useToast()

  const simularAvance = (id: string) => {
    const actualizada = avanzarEstadoSolicitud(id)
    if (actualizada) mostrarToast(`${id} avanzó a "${actualizada.estado}".`)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Mis solicitudes</h1>
          <p className="mt-1 text-sm text-body">Consulta el estado de todas tus solicitudes registradas.</p>
        </div>
        <Button icon={<PlusCircle size={17} />} onClick={() => navigate('/solicitar')}>
          Nueva solicitud
        </Button>
      </div>

      {cargando ? (
        <SkeletonCardList count={3} />
      ) : solicitudes.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-14 text-center">
          <Inbox className="text-slate-300" size={40} />
          <p className="text-sm text-slate-400">Aún no tienes solicitudes registradas.</p>
          <Button onClick={() => navigate('/solicitar')}>Crear mi primera solicitud</Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3.5">ID</th>
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
                      onClick={() => navigate(`/mis-solicitudes/${s.id}`)}
                    >
                      {s.id}
                    </td>
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
                            onClick={() => simularAvance(s.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
                            title="Simular avance de etapa (demo académica)"
                          >
                            <FastForward size={13} /> Avanzar
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/mis-solicitudes/${s.id}`)}
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
      )}
    </div>
  )
}
