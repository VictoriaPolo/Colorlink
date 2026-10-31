import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Download, FastForward, Inbox, LayoutGrid, Search, Table2, UserCheck, X } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Badge from '@/shared/ui/Badge'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import { ESTILO_ESTADO } from '@/shared/ui/estadoEstilos'
import { controlClass } from '@/shared/ui/FormField'
import { fechaCorta } from '@/shared/lib/formato'
import { descargarCSV } from '@/shared/lib/csv'
import { useToast } from '@/shared/lib/toast'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { useContextoAdmin } from '@/features/admin/ContextoAdmin'
import { Asignado, ChipPrioridad, ChipProblema, Miniatura } from '@/features/admin/componentes'
import { useEquipo } from '@/data/repositories/equipoRepository'
import { estaFinalizada, etiquetaSiguienteAccion } from '@/domain/solicitud/estadoMachine'
import {
  evaluarPrioridad,
  filtrarSolicitudes,
  ordenarPorUrgencia,
  PRIORIDADES,
  SIN_FILTROS,
  type FiltrosSolicitud,
} from '@/domain/solicitud/panel'
import { ORDEN_ESTADOS, type EstadoSolicitud, type PatologiaDetectada, type Solicitud } from '@/domain/solicitud/types'

const PROBLEMAS: PatologiaDetectada[] = [
  'Moho y hongos',
  'Humedad y filtración',
  'Fisuras y grietas',
  'Óxido y corrosión',
  'Pintura descascarada',
  'Salitre',
  'Sin daños evidentes',
]

function TarjetaKanban({ s, hoy, onAvanzar }: { s: Solicitud; hoy: Date; onAvanzar: (id: string) => void }) {
  const { prioridad, motivos } = evaluarPrioridad(s, hoy)
  const siguiente = etiquetaSiguienteAccion(s.estado)
  return (
    <article
      className={`flex flex-col gap-2.5 rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-soft ${
        s.gestion?.cancelacion ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <Link to={`/admin/solicitudes/${s.id}`} className="text-sm font-bold text-navy hover:text-primary">
          {s.id}
        </Link>
        {s.gestion?.cancelacion ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">Cancelada</span>
        ) : (
          !estaFinalizada(s.estado) && <ChipPrioridad prioridad={prioridad} motivo={motivos.join(' · ')} />
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <Miniatura solicitud={s} className="h-11 w-11" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy">{s.data.identificacion.cliente}</p>
          <p className="truncate text-xs text-slate-500">
            {s.data.proyecto.tipoObra} · {s.data.proyecto.ciudad}
          </p>
        </div>
      </div>
      <ChipProblema solicitud={s} />
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
        <Asignado nombre={s.gestion?.asignadoA} />
        <span className="text-[11px] text-slate-400" title="Fecha en que el cliente la necesita">
          Para el {fechaCorta(s.data.proyecto.fechaRequerida)}
        </span>
      </div>
      {!estaFinalizada(s.estado) && !s.gestion?.cancelacion && (
        <button
          onClick={() => onAvanzar(s.id)}
          title={siguiente.larga}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand-50 py-1.5 text-xs font-bold text-primary hover:bg-brand-100"
        >
          <FastForward size={13} /> {siguiente.corta}
        </button>
      )}
    </article>
  )
}

export default function AdminSolicitudes() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { solicitudes, cargando, avanzarEstadoSolicitud, asignarSolicitud } = useSolicitudes()
  const { mostrarToast } = useToast()
  const { identidad } = useContextoAdmin()
  const { equipo } = useEquipo()
  const hoy = useMemo(() => new Date(), [])
  const [seleccionados, setSeleccionados] = useState<string[]>([])

  const filtros: FiltrosSolicitud = {
    texto: params.get('texto') ?? '',
    estado: (params.get('estado') ?? '') as FiltrosSolicitud['estado'],
    problema: (params.get('problema') ?? '') as FiltrosSolicitud['problema'],
    prioridad: (params.get('prioridad') ?? '') as FiltrosSolicitud['prioridad'],
    asignado: params.get('asignado') ?? '',
  }
  const vista = params.get('vista') === 'tabla' ? 'tabla' : 'tablero'
  const hayFiltros = (Object.keys(SIN_FILTROS) as (keyof FiltrosSolicitud)[]).some((k) => filtros[k] !== SIN_FILTROS[k])

  const cambiar = (clave: string, valor: string) => {
    const siguientes = new URLSearchParams(params)
    if (valor) siguientes.set(clave, valor)
    else siguientes.delete(clave)
    setParams(siguientes, { replace: true })
  }
  const limpiar = () => setParams(vista === 'tabla' ? { vista: 'tabla' } : {}, { replace: true })

  const visibles = useMemo(
    () => ordenarPorUrgencia(filtrarSolicitudes(solicitudes, filtros, hoy), hoy),
    // `filtros` se arma de `params` en cada render; la cadena es la dependencia estable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [solicitudes, params.toString(), hoy],
  )

  const avanzar = async (id: string) => {
    const actualizada = await avanzarEstadoSolicitud(id)
    if (actualizada) mostrarToast(`${id} avanzó a "${actualizada.estado}".`)
  }

  const alternarSeleccion = (id: string) => {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const seleccionablesVisibles = visibles.filter((s) => !estaFinalizada(s.estado) && !s.gestion?.cancelacion)
  const todoSeleccionado = seleccionablesVisibles.length > 0 && seleccionablesVisibles.every((s) => seleccionados.includes(s.id))

  const alternarSeleccionTodas = () => {
    setSeleccionados(todoSeleccionado ? [] : seleccionablesVisibles.map((s) => s.id))
  }

  const avanzarSeleccionadas = async () => {
    const ids = [...seleccionados]
    setSeleccionados([])
    const resultados = await Promise.all(ids.map((id) => avanzarEstadoSolicitud(id)))
    const avanzadas = resultados.filter(Boolean).length
    mostrarToast(`${avanzadas} ${avanzadas === 1 ? 'solicitud avanzó' : 'solicitudes avanzaron'} de etapa.`)
  }

  const asignarSeleccionadas = async (responsable: string) => {
    const ids = [...seleccionados]
    setSeleccionados([])
    await Promise.all(ids.map((id) => asignarSolicitud(id, responsable || undefined)))
    const singular = ids.length === 1
    const sujeto = `${ids.length} ${singular ? 'solicitud' : 'solicitudes'}`
    const verbo = singular ? 'quedó' : 'quedaron'
    mostrarToast(responsable ? `${sujeto} ${verbo} con ${responsable}.` : `${sujeto} ${verbo} sin asignar.`)
  }

  const exportar = () => {
    descargarCSV(
      'solicitudes-colorlink',
      ['ID', 'Cliente', 'Ciudad', 'Tipo de obra', 'Estado', 'Problema', 'Asignado a', 'Cancelada', 'Fecha requerida', 'Fecha de solicitud'],
      visibles.map((s) => [
        s.id,
        s.data.identificacion.cliente,
        s.data.proyecto.ciudad,
        s.data.proyecto.tipoObra,
        s.estado,
        s.diagnostico?.patologia ?? '',
        s.gestion?.asignadoA ?? '',
        s.gestion?.cancelacion ? 'Sí' : 'No',
        s.data.proyecto.fechaRequerida,
        s.fechaSolicitud,
      ]),
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Solicitudes</h1>
          <p className="mt-1 text-sm text-body">
            {visibles.length === solicitudes.length
              ? `${solicitudes.length} solicitudes de clientes`
              : `${visibles.length} de ${solicitudes.length} solicitudes`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy hover:border-primary hover:text-primary"
          >
            <Download size={15} /> Exportar CSV
          </button>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Vista">
            {(
              [
                ['tablero', 'Tablero', LayoutGrid],
                ['tabla', 'Tabla', Table2],
              ] as const
            ).map(([valor, etiqueta, Icono]) => (
              <button
                key={valor}
                onClick={() => cambiar('vista', valor === 'tablero' ? '' : valor)}
                aria-pressed={vista === valor}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  vista === valor ? 'bg-navy text-white' : 'text-body hover:bg-slate-100'
                }`}
              >
                <Icono size={15} /> {etiqueta}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="p-3.5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative sm:col-span-2 lg:col-span-4">
            <span className="sr-only">Buscar solicitudes</span>
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filtros.texto}
              onChange={(e) => cambiar('texto', e.target.value)}
              placeholder="Buscar por cliente, ciudad, ID, problema…"
              className={`${controlClass(false)} pl-9`}
            />
          </label>
          {(
            [
              ['estado', 'Estado', 'Todos los estados', ORDEN_ESTADOS.map((e) => [e, e])],
              ['problema', 'Problema', 'Todos los problemas', PROBLEMAS.map((p) => [p, p])],
              ['prioridad', 'Prioridad', 'Toda prioridad', PRIORIDADES.map((p) => [p, p])],
              ['asignado', 'Asignado a', 'Todo el equipo', [['sin-asignar', 'Sin asignar'], ...equipo.map((m) => [m.nombre, m.nombre] as const)]],
            ] as const
          ).map(([clave, etiqueta, todos, opciones]) => (
            <label key={clave}>
              <span className="sr-only">{etiqueta}</span>
              <select value={filtros[clave]} onChange={(e) => cambiar(clave, e.target.value)} className={controlClass(false)}>
                <option value="">{todos}</option>
                {opciones.map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {hayFiltros && (
          <button onClick={limpiar} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            <X size={13} /> Quitar filtros
          </button>
        )}
      </Card>

      {cargando ? (
        <SkeletonCardList count={3} />
      ) : visibles.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-14 text-center">
          <Inbox className="text-slate-300" size={40} />
          <p className="text-sm text-slate-400">
            {solicitudes.length === 0 ? 'Todavía no ha llegado ninguna solicitud.' : 'Ninguna solicitud coincide con esos filtros.'}
          </p>
        </Card>
      ) : vista === 'tablero' ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <div className="flex gap-4">
            {ORDEN_ESTADOS.map((estado: EstadoSolicitud) => {
              const columna = visibles.filter((s) => s.estado === estado)
              return (
                <section key={estado} aria-label={estado} className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-200/50 p-2.5">
                  <header className="mb-2.5 flex items-center gap-2 px-1.5 pt-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${ESTILO_ESTADO[estado].punto}`} />
                    <h2 className="text-sm font-bold text-navy">{estado}</h2>
                    <span className="ml-auto rounded-full bg-white px-2 py-px text-xs font-bold text-body tabular-nums">{columna.length}</span>
                  </header>
                  <div className="flex flex-col gap-2.5">
                    {columna.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">Sin solicitudes</p>
                    ) : (
                      columna.map((s) => <TarjetaKanban key={s.id} s={s} hoy={hoy} onAvanzar={avanzar} />)
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      ) : (
        <>
          {seleccionados.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
              <span className="text-sm font-bold text-navy">
                {seleccionados.length} {seleccionados.length === 1 ? 'seleccionada' : 'seleccionadas'}
              </span>
              <button
                onClick={avanzarSeleccionadas}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-primary ring-1 ring-inset ring-brand-200 hover:bg-brand-100"
              >
                <FastForward size={13} /> Avanzar
              </button>
              <button
                onClick={() => asignarSeleccionadas(identidad)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-primary ring-1 ring-inset ring-brand-200 hover:bg-brand-100"
              >
                <UserCheck size={13} /> Tomar todas
              </button>
              <select
                aria-label="Asignar seleccionadas a"
                defaultValue=""
                onChange={(e) => e.target.value && asignarSeleccionadas(e.target.value)}
                className="rounded-lg border-0 bg-white px-3 py-1.5 text-xs font-bold text-navy ring-1 ring-inset ring-brand-200"
              >
                <option value="" disabled>
                  Asignar a…
                </option>
                {equipo.map((m) => (
                  <option key={m.nombre} value={m.nombre}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <button onClick={() => setSeleccionados([])} className="ml-auto text-xs font-semibold text-slate-500 hover:underline">
                Cancelar selección
              </button>
            </div>
          )}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todas"
                        checked={todoSeleccionado}
                        onChange={alternarSeleccionTodas}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </th>
                    <th className="px-4 py-3">Solicitud</th>
                    <th className="px-4 py-3">Problema</th>
                    <th className="px-4 py-3">Prioridad</th>
                    <th className="px-4 py-3">Asignado a</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Para el</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
              </thead>
              <tbody>
                {visibles.map((s) => {
                  const { prioridad, motivos } = evaluarPrioridad(s, hoy)
                  const seleccionable = !estaFinalizada(s.estado) && !s.gestion?.cancelacion
                  return (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/40">
                      <td className="px-4 py-3">
                        {seleccionable && (
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar ${s.id}`}
                            checked={seleccionados.includes(s.id)}
                            onChange={() => alternarSeleccion(s.id)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Miniatura solicitud={s} className="h-10 w-10" />
                          <div className="min-w-0">
                            <Link to={`/admin/solicitudes/${s.id}`} className="font-bold text-navy hover:text-primary">
                              {s.id}
                            </Link>
                            <p className="max-w-52 truncate text-xs text-slate-500">
                              {s.data.identificacion.cliente} · {s.data.proyecto.ciudad}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ChipProblema solicitud={s} />
                      </td>
                      <td className="px-4 py-3">{estaFinalizada(s.estado) ? <span className="text-xs text-slate-400">—</span> : <ChipPrioridad prioridad={prioridad} motivo={motivos.join(' · ')} />}</td>
                      <td className="px-4 py-3">
                        <Asignado nombre={s.gestion?.asignadoA} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge estado={s.estado} cancelada={!!s.gestion?.cancelacion} />
                      </td>
                      <td className="px-4 py-3 text-body">{fechaCorta(s.data.proyecto.fechaRequerida)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          {!estaFinalizada(s.estado) && !s.gestion?.cancelacion && (
                            <button
                              onClick={() => avanzar(s.id)}
                              title={etiquetaSiguienteAccion(s.estado).larga}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-sky hover:underline"
                            >
                              <FastForward size={13} /> {etiquetaSiguienteAccion(s.estado).corta}
                            </button>
                          )}
                          <button onClick={() => navigate(`/admin/solicitudes/${s.id}`)} className="text-sm font-semibold text-primary hover:underline">
                            Abrir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
        </>
      )}
    </div>
  )
}
