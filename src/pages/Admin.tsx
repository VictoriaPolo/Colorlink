import { Inbox, ShieldCheck } from 'lucide-react'
import Card from '@/shared/ui/Card'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import SolicitudesTable from '@/features/solicitudes/SolicitudesTable'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { useToast } from '@/shared/lib/toast'
import { estaFinalizada } from '@/domain/solicitud/estadoMachine'

export default function Admin() {
  const { solicitudes, cargando, avanzarEstadoSolicitud } = useSolicitudes()
  const { mostrarToast } = useToast()

  const ejecutarAvance = async (id: string) => {
    const actualizada = await avanzarEstadoSolicitud(id)
    if (actualizada) mostrarToast(`${id} avanzó a "${actualizada.estado}".`)
  }

  const pendientes = solicitudes.filter((s) => !estaFinalizada(s.estado)).length

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck size={13} /> Panel de administrador
          </span>
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Solicitudes de clientes</h1>
          <p className="mt-1 text-sm text-body">
            Aquí llega todo lo que los clientes envían para que el equipo ejecute la solución.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy shadow-soft">
          Pendientes: <span className="text-primary">{pendientes}</span>
        </span>
      </div>

      {cargando ? (
        <SkeletonCardList count={3} />
      ) : solicitudes.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-14 text-center">
          <Inbox className="text-slate-300" size={40} />
          <p className="text-sm text-slate-400">Todavía no ha llegado ninguna solicitud.</p>
        </Card>
      ) : (
        <SolicitudesTable
          solicitudes={solicitudes}
          detalleBasePath="/admin"
          mostrarCliente
          onAvanzar={ejecutarAvance}
        />
      )}
    </div>
  )
}
