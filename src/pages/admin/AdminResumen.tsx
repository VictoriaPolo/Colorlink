import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertOctagon, ArrowRight, Ban, ClipboardList, Inbox, Package, UserX, Users, Wallet } from 'lucide-react'
import Card from '@/shared/ui/Card'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import { ESTILO_ESTADO } from '@/shared/ui/estadoEstilos'
import { fechaCorta, formatoCOP } from '@/shared/lib/formato'
import { useToast } from '@/shared/lib/toast'
import { useAuth } from '@/features/auth/AuthContext'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { useContextoAdmin } from '@/features/admin/ContextoAdmin'
import { Asignado, ChipPrioridad, ChipProblema, KpiCard, Miniatura } from '@/features/admin/componentes'
import { COLOR_PATOLOGIA } from '@/features/diagnostico/imagen'
import { estaFinalizada } from '@/domain/solicitud/estadoMachine'
import {
  actividadReciente,
  clientesDe,
  evaluarPrioridad,
  ordenarPorUrgencia,
  resumenPanel,
  tiempoPromedioPorEtapa,
  type ResumenPanel,
} from '@/domain/solicitud/panel'
import { ORDEN_ESTADOS } from '@/domain/solicitud/types'

function BarrasSemanales({ semanas }: { semanas: ResumenPanel['porSemana'] }) {
  const maximo = Math.max(1, ...semanas.map((s) => s.cantidad))
  const resumen = semanas.map((s) => `${fechaCorta(s.desde)}: ${s.cantidad}`).join(', ')
  return (
    <div className="flex items-end gap-2" role="img" aria-label={`Solicitudes nuevas por semana. ${resumen}`}>
      {semanas.map((s, i) => (
        <div key={s.desde} className="flex flex-1 flex-col items-center gap-1.5" title={`Semana del ${fechaCorta(s.desde)}: ${s.cantidad}`}>
          <span className="h-4 text-xs font-semibold text-navy tabular-nums">{s.cantidad || ''}</span>
          <div className="flex h-24 w-full items-end">
            <div
              className={`w-full rounded-t-md ${s.cantidad === 0 ? 'bg-slate-200' : i === semanas.length - 1 ? 'bg-primary' : 'bg-brand-200'}`}
              style={{ height: s.cantidad === 0 ? 2 : `${Math.max(8, (s.cantidad / maximo) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400">{fechaCorta(s.desde)}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminResumen() {
  const { usuario } = useAuth()
  const { solicitudes, cargando, asignarSolicitud } = useSolicitudes()
  const { pedidos, identidad } = useContextoAdmin()
  const { mostrarToast } = useToast()
  const hoy = useMemo(() => new Date(), [])

  const resumen = useMemo(() => resumenPanel(solicitudes, pedidos, hoy), [solicitudes, pedidos, hoy])
  const urgentes = useMemo(
    () => ordenarPorUrgencia(solicitudes.filter((s) => !estaFinalizada(s.estado) && !s.gestion?.cancelacion), hoy).slice(0, 5),
    [solicitudes, hoy],
  )
  const actividad = useMemo(() => actividadReciente(solicitudes), [solicitudes])
  const totalClientes = useMemo(() => clientesDe(solicitudes, pedidos).length, [solicitudes, pedidos])
  const tiempos = useMemo(() => tiempoPromedioPorEtapa(solicitudes).filter((t) => t.muestras > 0), [solicitudes])
  const maxProblema = Math.max(1, ...resumen.porProblema.map((p) => p.cantidad))
  const maxDias = Math.max(1, ...tiempos.map((t) => t.diasPromedio))

  const tomar = async (id: string) => {
    const actualizada = await asignarSolicitud(id, identidad)
    if (actualizada) mostrarToast(`${id} quedó asignada a ${identidad}.`)
  }

  const fechaTexto = hoy.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  if (cargando) return <SkeletonCardList count={4} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 first-letter:uppercase">{fechaTexto}</p>
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Hola, {usuario?.nombre.split(' ')[0] ?? 'equipo'}</h1>
          <p className="mt-1 text-sm text-body">Esto es lo que hay que mirar hoy en solicitudes, pedidos y clientes.</p>
        </div>
        <Link to="/admin/solicitudes" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-dark">
          Ir a solicitudes <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <KpiCard icono={ClipboardList} etiqueta="Solicitudes activas" valor={resumen.activas} detalle={`de ${resumen.total} en total`} to="/admin/solicitudes" />
        <KpiCard
          icono={UserX}
          etiqueta="Sin asignar"
          valor={resumen.sinAsignar}
          detalle="esperan a alguien del equipo"
          tono={resumen.sinAsignar > 0 ? 'alerta' : 'normal'}
          to="/admin/solicitudes?asignado=sin-asignar"
        />
        <KpiCard
          icono={AlertOctagon}
          etiqueta="Prioridad alta"
          valor={resumen.prioridadAlta}
          detalle="daño severo o fecha límite cerca"
          tono={resumen.prioridadAlta > 0 ? 'peligro' : 'normal'}
          to="/admin/solicitudes?prioridad=Alta"
        />
        <KpiCard icono={Package} etiqueta="Pedidos por atender" valor={resumen.pedidosPorAtender} detalle={`de ${pedidos.length} pedidos`} to="/admin/pedidos" />
        <KpiCard icono={Users} etiqueta="Clientes" valor={totalClientes} detalle="con solicitudes o pedidos" to="/admin/clientes" />
        <KpiCard icono={Wallet} etiqueta="Ventas del mes" valor={formatoCOP.format(resumen.ventasMes)} detalle={`${resumen.pedidosMes} pedidos sin cancelar`} to="/admin/pedidos" />
        {resumen.canceladas > 0 && (
          <KpiCard icono={Ban} etiqueta="Canceladas" valor={resumen.canceladas} detalle="el equipo cerró el caso" to="/admin/solicitudes" />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-bold text-navy">Requieren atención</h2>
            <Link to="/admin/solicitudes" className="text-sm font-semibold text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          {urgentes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <Inbox className="text-slate-300" size={36} />
              <p className="text-sm text-slate-400">No hay solicitudes pendientes. Buen trabajo.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 px-5">
              {urgentes.map((s) => {
                const { prioridad, motivos } = evaluarPrioridad(s, hoy)
                return (
                  <li key={s.id} className="flex items-center gap-3.5 py-3.5">
                    <Miniatura solicitud={s} className="h-14 w-14" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/admin/solicitudes/${s.id}`} className="block truncate text-sm font-bold text-navy hover:text-primary">
                        {s.id} · {s.data.identificacion.cliente}
                      </Link>
                      <div className="mt-0.5">
                        <ChipProblema solicitud={s} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {motivos[0] ?? `${s.data.proyecto.tipoObra} en ${s.data.proyecto.ciudad}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <ChipPrioridad prioridad={prioridad} motivo={motivos.join(' · ')} />
                      {s.gestion?.asignadoA ? (
                        <Asignado nombre={s.gestion.asignadoA} />
                      ) : (
                        <button onClick={() => tomar(s.id)} className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold text-primary hover:bg-brand-100">
                          Tomar
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold text-navy">Dónde están las solicitudes</h2>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="presentation">
              {ORDEN_ESTADOS.map((e) =>
                resumen.porEstado[e] > 0 ? (
                  <span key={e} className={ESTILO_ESTADO[e].barra} style={{ width: `${(resumen.porEstado[e] / Math.max(1, resumen.total)) * 100}%` }} />
                ) : null,
              )}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {ORDEN_ESTADOS.map((e) => (
                <li key={e}>
                  <Link to={`/admin/solicitudes?estado=${encodeURIComponent(e)}`} className="flex items-center gap-2 text-sm text-body hover:text-primary">
                    <span className={`h-2.5 w-2.5 rounded-full ${ESTILO_ESTADO[e].punto}`} />
                    <span className="truncate">{e}</span>
                    <span className="ml-auto font-bold text-navy tabular-nums">{resumen.porEstado[e]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold text-navy">Problemas más frecuentes</h2>
            {resumen.porProblema.length === 0 ? (
              <p className="text-sm text-slate-400">Cuando lleguen solicitudes con foto, aquí verás qué se repite.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {resumen.porProblema.map(({ patologia, cantidad }) => (
                  <li key={patologia}>
                    <Link to={`/admin/solicitudes?problema=${encodeURIComponent(patologia)}`} className="block hover:opacity-80">
                      <span className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-navy">{patologia}</span>
                        <span className="font-bold text-body tabular-nums">{cantidad}</span>
                      </span>
                      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-slate-100">
                        <span className="block h-full rounded-full" style={{ width: `${(cantidad / maxProblema) * 100}%`, background: COLOR_PATOLOGIA[patologia] }} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h2 className="mb-1 text-base font-bold text-navy">Solicitudes nuevas por semana</h2>
          <p className="mb-4 text-xs text-slate-400">Las últimas 8 semanas, de lunes a domingo.</p>
          <BarrasSemanales semanas={resumen.porSemana} />
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-1 text-base font-bold text-navy">Tiempo promedio por etapa</h2>
          <p className="mb-4 text-xs text-slate-400">Cuánto tarda en pasar a la siguiente, en días.</p>
          {tiempos.length === 0 ? (
            <p className="text-sm text-slate-400">Todavía no hay suficientes solicitudes avanzadas para calcularlo.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {tiempos.map(({ estado, diasPromedio, muestras }) => (
                <li key={estado}>
                  <span className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-navy">{estado}</span>
                    <span className="font-bold text-body tabular-nums">
                      {diasPromedio.toFixed(1)} {diasPromedio === 1 ? 'día' : 'días'}
                    </span>
                  </span>
                  <span className="mt-1 block h-2 overflow-hidden rounded-full bg-slate-100">
                    <span className={`block h-full rounded-full ${ESTILO_ESTADO[estado].barra}`} style={{ width: `${(diasPromedio / maxDias) * 100}%` }} />
                  </span>
                  <span className="mt-0.5 block text-[10px] text-slate-400">
                    {muestras} {muestras === 1 ? 'solicitud' : 'solicitudes'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-5">
          <h2 className="mb-4 text-base font-bold text-navy">Actividad reciente</h2>
          {actividad.length === 0 ? (
            <p className="text-sm text-slate-400">Todavía no hay movimientos.</p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {actividad.map((e, i) => (
                <li key={`${e.solicitudId}-${e.fecha}-${i}`} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0 flex-1">
                    <Link to={`/admin/solicitudes/${e.solicitudId}`} className="font-semibold text-navy hover:text-primary">
                      {e.solicitudId}
                    </Link>{' '}
                    <span className="text-body">{e.texto}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{fechaCorta(e.fecha)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
