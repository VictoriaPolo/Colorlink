import { useNavigate } from 'react-router-dom'
import { PlusCircle, ChevronRight, Inbox } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useSolicitudes } from '../context/SolicitudesContext'

export default function MisSolicitudes() {
  const navigate = useNavigate()
  const { solicitudes } = useSolicitudes()

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

      {solicitudes.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-14 text-center">
          <Inbox className="text-slate-300" size={40} />
          <p className="text-sm text-slate-400">Aún no tienes solicitudes registradas.</p>
          <Button onClick={() => navigate('/solicitar')}>Crear mi primera solicitud</Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
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
                    className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                    onClick={() => navigate(`/mis-solicitudes/${s.id}`)}
                  >
                    <td className="px-5 py-4 font-semibold text-navy">{s.id}</td>
                    <td className="px-5 py-4 text-body">{s.data.proyecto.tipoObra || '—'}</td>
                    <td className="px-5 py-4 text-body">{s.data.proyecto.ciudad || '—'}</td>
                    <td className="px-5 py-4 text-body">{s.fechaSolicitud}</td>
                    <td className="px-5 py-4">
                      <Badge estado={s.estado} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                        Ver detalle <ChevronRight size={15} />
                      </button>
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
