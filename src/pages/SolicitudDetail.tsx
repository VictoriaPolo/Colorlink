import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, AlertTriangle, FastForward, CheckCircle2 } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import ProcessTimeline from '@/shared/ui/ProcessTimeline'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { useToast } from '@/shared/lib/toast'
import { etapaDelNegocio, estaFinalizada } from '@/domain/solicitud/estadoMachine'

export default function SolicitudDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { obtenerSolicitud, avanzarEstadoSolicitud } = useSolicitudes()
  const { mostrarToast } = useToast()
  const solicitud = id ? obtenerSolicitud(id) : undefined

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

  const { data, recomendacion } = solicitud

  const simularAvance = () => {
    const actualizada = avanzarEstadoSolicitud(solicitud.id)
    if (actualizada) mostrarToast(`Tu solicitud avanzó a "${actualizada.estado}".`)
  }

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
            {data.proyecto.tipoObra} · {data.proyecto.ciudad} · {solicitud.fechaSolicitud}
          </p>
        </div>
        <Badge estado={solicitud.estado} />
      </div>

      <Card className="mb-6 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-navy">Progreso de tu solicitud</h2>
          {!estaFinalizada(solicitud.estado) && (
            <button
              onClick={simularAvance}
              className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-50 px-3 py-1.5 text-xs font-semibold text-teal hover:bg-fuchsia-100"
              title="Simular avance de etapa (demo académica)"
            >
              <FastForward size={13} /> Simular avance
            </button>
          )}
        </div>
        <ProcessTimeline etapaActual={etapaDelNegocio(solicitud.estado)} />

        <ul className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6">
          {solicitud.historialEstados.map((h) => (
            <li key={`${h.estado}-${h.fecha}`} className="flex items-center gap-3 text-sm">
              <CheckCircle2 size={16} className="text-success" />
              <span className="font-semibold text-navy">{h.estado}</span>
              <span className="text-slate-400">— {h.fecha}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-base font-bold text-navy">Datos del proyecto</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <Row label="Cliente" value={data.identificacion.cliente} />
            <Row label="Responsable" value={data.identificacion.responsable} />
            <Row label="Ciudad" value={data.proyecto.ciudad} />
            <Row label="Tipo de obra" value={data.proyecto.tipoObra} />
            <Row label="Área aproximada" value={`${data.proyecto.areaAprox} m²`} />
            <Row label="Superficie" value={data.tecnica.superficie} />
            <Row label="Ambiente" value={data.tecnica.ambiente} />
            <Row label="Condición" value={data.tecnica.condicion} />
            <Row label="Color/acabado" value={data.tecnica.colorAcabado} />
          </dl>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center gap-2 bg-navy px-6 py-4 text-white">
            <Sparkles size={17} />
            <h2 className="text-base font-bold">Solución recomendada</h2>
          </div>
          <dl className="flex flex-col gap-3 p-6 text-sm">
            <Row label="Tipo de solución" value={recomendacion.tipoSolucion} />
            <Row label="Producto" value={recomendacion.producto} />
            <Row label="Acabado" value={recomendacion.acabado} />
            <Row label="Cantidad estimada" value={recomendacion.cantidadEstimada} />
            <Row label="Aplicación" value={recomendacion.aplicacion} />
            <Row label="Tiempo estimado" value={recomendacion.tiempoEstimado} />
          </dl>
          {recomendacion.advertencias.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-amber-100 bg-amber-50 px-6 py-4">
              {recomendacion.advertencias.map((a) => (
                <div key={a} className="flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  <p>{a}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {data.evidencia.descripcion && (
        <Card className="mb-6 p-6">
          <h2 className="mb-2 text-base font-bold text-navy">Descripción</h2>
          <p className="text-sm text-body">{data.evidencia.descripcion}</p>
          {data.evidencia.imagenes.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {data.evidencia.imagenes.map((img) => (
                <div key={img.id} className="aspect-square overflow-hidden rounded-lg border border-slate-200">
                  <img src={img.url} alt={img.nombre} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="flex justify-center">
        <Button variant="secondary" onClick={() => navigate('/mis-solicitudes')}>
          Volver al listado
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-navy">{value || '—'}</dd>
    </div>
  )
}
