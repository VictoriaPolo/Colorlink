import { useNavigate } from 'react-router-dom'
import { PlusCircle, Inbox } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import SolicitudesTable from '@/features/solicitudes/SolicitudesTable'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { useToast } from '@/shared/lib/toast'

export default function MisSolicitudes() {
  const navigate = useNavigate()
  const { solicitudes, cargando, avanzarEstadoSolicitud } = useSolicitudes()
  const { mostrarToast } = useToast()

  const simularAvance = async (id: string) => {
    const actualizada = await avanzarEstadoSolicitud(id)
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
        <SolicitudesTable
          solicitudes={solicitudes}
          detalleBasePath="/mis-solicitudes"
          onAvanzar={simularAvance}
        />
      )}
    </div>
  )
}
