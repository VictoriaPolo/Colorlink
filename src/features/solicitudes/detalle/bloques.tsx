import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import Card from '@/shared/ui/Card'
import { fechaCorta } from '@/shared/lib/formato'
import DiagnosticoCard from '@/features/diagnostico/DiagnosticoCard'
import FotoAnalizada from '@/features/diagnostico/FotoAnalizada'
import { clasesDeDiagnostico } from '@/features/diagnostico/imagen'
import type { Solicitud } from '@/domain/solicitud/types'

/** Una línea "etiqueta … valor" de las fichas de la solicitud. */
export function FilaDato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-50 pb-3 text-sm last:border-0 last:pb-0">
      <dt className="shrink-0 text-slate-400">{etiqueta}</dt>
      <dd className="text-right font-medium text-navy">{valor || '—'}</dd>
    </div>
  )
}

export function DatosProyecto({ solicitud, conContacto = false }: { solicitud: Solicitud; conContacto?: boolean }) {
  const { identificacion, proyecto, tecnica, evidencia } = solicitud.data
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-base font-bold text-navy">{conContacto ? 'Cliente y proyecto' : 'Datos del proyecto'}</h2>
      <dl className="flex flex-col gap-3">
        <FilaDato etiqueta="Cliente" valor={identificacion.cliente} />
        {conContacto && <FilaDato etiqueta="NIT / documento" valor={identificacion.nit} />}
        <FilaDato etiqueta="Responsable" valor={identificacion.responsable} />
        {conContacto && <FilaDato etiqueta="Correo de la cuenta" valor={solicitud.propietario ?? 'Solicitud de ejemplo'} />}
        {conContacto && <FilaDato etiqueta="Llegó por" valor={identificacion.canal} />}
        <FilaDato etiqueta="Ciudad" valor={proyecto.ciudad} />
        <FilaDato etiqueta="Tipo de obra" valor={proyecto.tipoObra} />
        <FilaDato etiqueta="Área aproximada" valor={proyecto.areaAprox ? `${proyecto.areaAprox} m²` : ''} />
        <FilaDato etiqueta="Se requiere para el" valor={proyecto.fechaRequerida ? fechaCorta(proyecto.fechaRequerida) : ''} />
        <FilaDato etiqueta="Zona del problema" valor={evidencia.zona ?? ''} />
        <FilaDato etiqueta="Superficie" valor={tecnica.superficie} />
        <FilaDato etiqueta="Ambiente" valor={tecnica.ambiente} />
        <FilaDato etiqueta="Condición" valor={tecnica.condicion} />
        <FilaDato etiqueta="Color/acabado" valor={tecnica.colorAcabado} />
      </dl>
    </Card>
  )
}

export function SolucionRecomendada({ solicitud }: { solicitud: Solicitud }) {
  const { recomendacion } = solicitud
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-2 bg-navy px-6 py-4 text-white">
        <Sparkles size={17} />
        <h2 className="text-base font-bold">Solución recomendada</h2>
      </div>
      <dl className="flex flex-col gap-3 p-6">
        <FilaDato etiqueta="Tipo de solución" valor={recomendacion.tipoSolucion} />
        <FilaDato etiqueta="Producto" valor={recomendacion.producto} />
        <FilaDato etiqueta="Acabado" valor={recomendacion.acabado} />
        <FilaDato etiqueta="Cantidad estimada" valor={recomendacion.cantidadEstimada} />
        <FilaDato etiqueta="Aplicación" valor={recomendacion.aplicacion} />
        <FilaDato etiqueta="Tiempo estimado" valor={recomendacion.tiempoEstimado} />
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
  )
}

/** Lo que el cliente contó y mostró: el diagnóstico, las fotos con las zonas marcadas y su descripción. */
export function EvidenciaYDiagnostico({ solicitud }: { solicitud: Solicitud }) {
  const { evidencia } = solicitud.data
  const d = solicitud.diagnostico
  return (
    <div className="flex flex-col gap-6">
      {d && <DiagnosticoCard diagnostico={d} />}
      {evidencia.imagenes.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {evidencia.imagenes.map((img) => (
            <FotoAnalizada key={img.id} url={img.url} nombre={img.nombre} clases={d ? clasesDeDiagnostico(d) : undefined} />
          ))}
        </div>
      )}
      {(evidencia.descripcion || evidencia.observaciones) && (
        <Card className="p-6">
          <h2 className="mb-2 text-base font-bold text-navy">Lo que contó el cliente</h2>
          {evidencia.descripcion && <p className="text-sm leading-relaxed text-body">{evidencia.descripcion}</p>}
          {evidencia.observaciones && (
            <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-body">
              <span className="font-semibold text-navy">Observaciones: </span>
              {evidencia.observaciones}
            </p>
          )}
        </Card>
      )}
    </div>
  )
}

export function HistorialEstados({ solicitud }: { solicitud: Solicitud }) {
  return (
    <ul className="flex flex-col gap-3">
      {solicitud.historialEstados.map((h, i) => (
        <li key={`${h.estado}-${i}`} className="flex items-center gap-3 text-sm">
          <CheckCircle2 size={16} className="shrink-0 text-success" />
          <span className="font-semibold text-navy">{h.estado}</span>
          <span className="ml-auto text-slate-400">{fechaCorta(h.fecha)}</span>
        </li>
      ))}
    </ul>
  )
}
