import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, FastForward, NotebookPen, UserCheck } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import Avatar from '@/shared/ui/Avatar'
import { controlClass } from '@/shared/ui/FormField'
import { fechaConHora, fechaCorta } from '@/shared/lib/formato'
import { useToast } from '@/shared/lib/toast'
import { useAuth } from '@/features/auth/AuthContext'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { ChipPrioridad, ChipProblema } from '@/features/admin/componentes'
import { DatosProyecto, EvidenciaYDiagnostico, SolucionRecomendada } from '@/features/solicitudes/detalle/bloques'
import { estaFinalizada, etiquetaSiguienteAccion } from '@/domain/solicitud/estadoMachine'
import { EQUIPO } from '@/domain/solicitud/equipo'
import { evaluarPrioridad } from '@/domain/solicitud/panel'
import { ORDEN_ESTADOS, type Solicitud } from '@/domain/solicitud/types'

/** Las seis etapas en vertical: cuáles ya pasaron (con su fecha), cuál es la actual y cuáles faltan. */
function EtapasVerticales({ solicitud }: { solicitud: Solicitud }) {
  const actual = ORDEN_ESTADOS.indexOf(solicitud.estado)
  return (
    <ol className="flex flex-col">
      {ORDEN_ESTADOS.map((estado, i) => {
        const fecha = solicitud.historialEstados.find((h) => h.estado === estado)?.fecha
        const hecha = i < actual
        const enCurso = i === actual
        return (
          <li key={estado} className="relative flex items-start gap-3 pb-4 last:pb-0">
            {i < ORDEN_ESTADOS.length - 1 && <span className={`absolute top-6 bottom-0 left-[11px] w-0.5 ${hecha ? 'bg-primary' : 'bg-slate-200'}`} />}
            <span
              className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                hecha ? 'bg-primary text-white' : enCurso ? 'bg-accent text-navy ring-4 ring-accent/30' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {hecha ? <Check size={13} /> : i + 1}
            </span>
            <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2 pt-0.5">
              <span className={`text-sm ${enCurso ? 'font-bold text-navy' : hecha ? 'font-medium text-navy' : 'text-slate-400'}`}>{estado}</span>
              {fecha && <span className="text-xs text-slate-400">{fechaCorta(fecha)}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default function AdminSolicitudDetalle() {
  const { id } = useParams<{ id: string }>()
  const { usuario } = useAuth()
  const { obtenerSolicitud, avanzarEstadoSolicitud, asignarSolicitud, agregarNotaSolicitud } = useSolicitudes()
  const { mostrarToast } = useToast()
  const [nota, setNota] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)
  const hoy = useMemo(() => new Date(), [])
  const solicitud = id ? obtenerSolicitud(id) : undefined

  if (!solicitud) {
    return (
      <div className="py-16 text-center">
        <p className="text-body">No encontramos esa solicitud.</p>
        <Link to="/admin/solicitudes" className="mt-4 inline-block font-semibold text-primary hover:underline">
          Volver a solicitudes
        </Link>
      </div>
    )
  }

  const { prioridad, motivos } = evaluarPrioridad(solicitud, hoy)
  const siguiente = etiquetaSiguienteAccion(solicitud.estado)
  const asignado = solicitud.gestion?.asignadoA
  const esMia = !!usuario && asignado === usuario.nombre
  // Quien tomó la solicitud puede no estar en la lista del equipo (por ejemplo, la cuenta de administración).
  const personas = [...EQUIPO.map((m) => m.nombre), ...(asignado && !EQUIPO.some((m) => m.nombre === asignado) ? [asignado] : [])]
  const notas = [...(solicitud.gestion?.notas ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha))

  const avanzar = async () => {
    const actualizada = await avanzarEstadoSolicitud(solicitud.id)
    if (actualizada) mostrarToast(`${actualizada.id} avanzó a "${actualizada.estado}".`)
  }

  const asignar = async (responsable: string | undefined) => {
    const actualizada = await asignarSolicitud(solicitud.id, responsable)
    if (actualizada) mostrarToast(responsable ? `${solicitud.id} quedó con ${responsable}.` : `${solicitud.id} quedó sin asignar.`)
  }

  const agregarNota = async (e: FormEvent) => {
    e.preventDefault()
    if (!nota.trim()) return
    setGuardandoNota(true)
    try {
      const actualizada = await agregarNotaSolicitud(solicitud.id, nota)
      if (actualizada) {
        setNota('')
        mostrarToast('Nota agregada.')
      }
    } catch {
      mostrarToast('No se pudo guardar la nota. Inténtalo de nuevo.', 'error')
    } finally {
      setGuardandoNota(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/admin/solicitudes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft size={16} /> Solicitudes
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">
              {solicitud.id} <span className="font-semibold text-slate-400">· {solicitud.data.identificacion.cliente}</span>
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <Badge estado={solicitud.estado} />
              {!estaFinalizada(solicitud.estado) && <ChipPrioridad prioridad={prioridad} motivo={motivos.join(' · ')} />}
              <ChipProblema solicitud={solicitud} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {solicitud.data.proyecto.tipoObra} en {solicitud.data.proyecto.ciudad} · recibida el {fechaCorta(solicitud.fechaSolicitud)}
              {motivos.length > 0 && !estaFinalizada(solicitud.estado) && <> · {motivos.join(' · ')}</>}
            </p>
          </div>
          {!estaFinalizada(solicitud.estado) && (
            <Button icon={<FastForward size={16} />} onClick={avanzar}>
              {siguiente.larga}
            </Button>
          )}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <EvidenciaYDiagnostico solicitud={solicitud} />
          <div className="grid gap-6 xl:grid-cols-2">
            <DatosProyecto solicitud={solicitud} conContacto />
            <SolucionRecomendada solicitud={solicitud} />
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold text-navy">Gestión</h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Atiende</span>
              <select value={asignado ?? ''} onChange={(e) => asignar(e.target.value || undefined)} className={controlClass(false)}>
                <option value="">Sin asignar</option>
                {personas.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </select>
            </label>
            {usuario && !esMia && (
              <button
                onClick={() => asignar(usuario.nombre)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-50 py-2 text-sm font-semibold text-primary hover:bg-brand-100"
              >
                <UserCheck size={15} /> Tomar esta solicitud
              </button>
            )}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <EtapasVerticales solicitud={solicitud} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy">
              <NotebookPen size={17} /> Notas internas
            </h2>
            <p className="mt-0.5 mb-4 text-xs text-slate-400">Solo las ve el equipo, no el cliente.</p>
            {notas.length === 0 ? (
              <p className="mb-4 rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">Todavía no hay notas.</p>
            ) : (
              <ul className="mb-4 flex flex-col gap-4">
                {notas.map((n) => (
                  <li key={n.id} className="flex items-start gap-3">
                    <Avatar nombre={n.autor} className="h-8 w-8 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-400">
                        <span className="font-semibold text-navy">{n.autor}</span> · {fechaConHora(n.fecha)}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-body">{n.texto}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={agregarNota} className="flex flex-col gap-2.5">
              <label>
                <span className="sr-only">Nueva nota</span>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Qué se habló, qué falta, qué sigue…"
                  className={`${controlClass(false)} min-h-20 resize-y`}
                />
              </label>
              <Button type="submit" size="sm" disabled={!nota.trim() || guardandoNota}>
                {guardandoNota ? 'Guardando…' : 'Agregar nota'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
