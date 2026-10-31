import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import ProcessTimeline from '@/shared/ui/ProcessTimeline'
import { fechaCorta } from '@/shared/lib/formato'
import { useToast } from '@/shared/lib/toast'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { DatosProyecto, EvidenciaYDiagnostico, HistorialEstados, SolucionRecomendada } from '@/features/solicitudes/detalle/bloques'
import { descargarResumenPdf } from '@/features/solicitudes/resumenPdf'
import { etapaDelNegocio } from '@/domain/solicitud/estadoMachine'

/** El seguimiento de una solicitud, visto por el cliente. El equipo tiene su propia vista en /admin. */
export default function SolicitudDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { obtenerSolicitud } = useSolicitudes()
  const { mostrarToast } = useToast()
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const solicitud = id ? obtenerSolicitud(id) : undefined

  const descargarResumen = async () => {
    if (!solicitud) return
    setGenerandoPdf(true)
    try {
      await descargarResumenPdf(solicitud)
    } catch {
      mostrarToast('No pudimos generar el PDF. Inténtalo de nuevo.', 'error')
    } finally {
      setGenerandoPdf(false)
    }
  }

  if (!solicitud) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-body">No encontramos la solicitud solicitada.</p>
        <Link to="/mis-solicitudes" className="mt-4 inline-block font-semibold text-primary hover:underline">
          Volver a mis solicitudes
        </Link>
      </div>
    )
  }

  const { data } = solicitud

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/mis-solicitudes')}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft size={16} /> Mis solicitudes
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">{solicitud.id}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {data.proyecto.tipoObra} · {data.proyecto.ciudad} · {fechaCorta(solicitud.fechaSolicitud)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge estado={solicitud.estado} />
          <Button
            variant="secondary"
            size="sm"
            icon={generandoPdf ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
            onClick={descargarResumen}
            disabled={generandoPdf}
          >
            {generandoPdf ? 'Generando PDF…' : 'Descargar PDF'}
          </Button>
        </div>
      </div>

      <Card className="mb-6 p-6">
        <h2 className="mb-6 text-base font-bold text-navy">Progreso de tu solicitud</h2>
        <ProcessTimeline etapaActual={etapaDelNegocio(solicitud.estado)} />
        <div className="mt-8 border-t border-slate-100 pt-6">
          <HistorialEstados solicitud={solicitud} />
        </div>
      </Card>

      <div className="mb-6">
        <EvidenciaYDiagnostico solicitud={solicitud} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <DatosProyecto solicitud={solicitud} />
        <SolucionRecomendada solicitud={solicitud} />
      </div>

      <div className="flex justify-center">
        <Button variant="secondary" onClick={() => navigate('/mis-solicitudes')}>
          Volver al listado
        </Button>
      </div>
    </div>
  )
}
