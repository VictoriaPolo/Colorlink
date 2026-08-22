import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Sparkles, AlertTriangle, Pencil, Download, ListChecks, Home } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import ProcessTimeline from '@/shared/ui/ProcessTimeline'
import type { Solicitud } from '@/domain/solicitud/types'
import { etapaDelNegocio } from '@/domain/solicitud/estadoMachine'

export default function Result({ solicitud, onEditar }: { solicitud: Solicitud; onEditar: () => void }) {
  const navigate = useNavigate()
  const { data, recomendacion, id } = solicitud

  const descargarResumen = () => {
    const contenido = `COLORLINK — Resumen de solicitud ${id}
Fecha: ${solicitud.fechaSolicitud}

CLIENTE
Cliente: ${data.identificacion.cliente}
Responsable: ${data.identificacion.responsable}

PROYECTO
Ciudad: ${data.proyecto.ciudad}
Tipo de obra: ${data.proyecto.tipoObra}
Área aproximada: ${data.proyecto.areaAprox} m²
Superficie: ${data.tecnica.superficie}
Ambiente: ${data.tecnica.ambiente}
Condición: ${data.tecnica.condicion}
Color/acabado: ${data.tecnica.colorAcabado}

SOLUCIÓN RECOMENDADA (preliminar)
Tipo de solución: ${recomendacion.tipoSolucion}
Producto: ${recomendacion.producto}
Acabado: ${recomendacion.acabado}
Cantidad estimada: ${recomendacion.cantidadEstimada}
Aplicación: ${recomendacion.aplicacion}
Tiempo estimado: ${recomendacion.tiempoEstimado}
`
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `colorlink-${id}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const resumenItems = [
    ['Cliente', data.identificacion.cliente],
    ['Ciudad', data.proyecto.ciudad],
    ['Tipo de obra', data.proyecto.tipoObra],
    ['Área', `${data.proyecto.areaAprox} m²`],
    ['Superficie', data.tecnica.superficie],
    ['Ambiente', data.tecnica.ambiente],
    ['Condición', data.tecnica.condicion],
    ['Color/acabado', data.tecnica.colorAcabado],
  ]

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-success">
          <CheckCircle2 size={28} />
        </span>
        <h2 className="text-xl font-bold text-navy sm:text-2xl">¡Hemos analizado tu necesidad!</h2>
        <p className="mt-1 text-sm text-body">
          Esta es una recomendación preliminar basada en la información proporcionada.
        </p>
      </div>

      {/* Solución recomendada */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 bg-navy px-6 py-4">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={18} />
            <h3 className="text-base font-bold">Solución recomendada</h3>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            {recomendacion.estadoTexto}
          </span>
        </div>

        <div className="grid gap-x-6 gap-y-5 p-6 sm:grid-cols-2">
          <ResultItem label="Tipo de solución" value={recomendacion.tipoSolucion} />
          <ResultItem label="Producto / recubrimiento" value={recomendacion.producto} />
          <ResultItem label="Acabado" value={recomendacion.acabado} />
          <ResultItem label="Cantidad estimada" value={recomendacion.cantidadEstimada} />
          <ResultItem label="Aplicación recomendada" value={recomendacion.aplicacion} />
          <ResultItem label="Tiempo estimado" value={recomendacion.tiempoEstimado} />
        </div>

        {recomendacion.advertencias.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-amber-100 bg-amber-50 px-6 py-4">
            {recomendacion.advertencias.map((a) => (
              <div key={a} className="flex items-start gap-2 text-sm text-amber-800">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>{a}</p>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 px-6 py-3">
          <span className="text-xs font-semibold text-slate-400">Generado por COLORLINK</span>
        </div>
      </Card>

      {/* Resumen de la solicitud */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-navy">Resumen de tu solicitud</h3>
          <button
            onClick={onEditar}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Pencil size={14} /> Editar información
          </button>
        </div>
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {resumenItems.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-0.5 text-sm font-medium text-navy">{value || '—'}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Qué sigue */}
      <Card className="p-6">
        <h3 className="mb-6 text-base font-bold text-navy">¿Qué sigue?</h3>
        <ProcessTimeline etapaActual={etapaDelNegocio(solicitud.estado)} />
        <p className="mt-6 text-sm text-body">
          Tu solicitud ha sido registrada. Nuestro sistema continuará con la validación técnica y
          disponibilidad de materiales.
        </p>
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        <Button icon={<ListChecks size={17} />} onClick={() => navigate('/mis-solicitudes')}>
          Ver mis solicitudes
        </Button>
        <Button variant="secondary" icon={<Download size={17} />} onClick={descargarResumen}>
          Descargar resumen
        </Button>
        <Button variant="ghost" icon={<Home size={17} />} onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-navy">{value}</p>
    </div>
  )
}
