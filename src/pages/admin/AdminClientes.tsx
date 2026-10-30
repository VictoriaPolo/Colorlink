import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Inbox, Search, UserRound, Users, Wallet } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Avatar from '@/shared/ui/Avatar'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import { controlClass } from '@/shared/ui/FormField'
import { fechaCorta, formatoCOP } from '@/shared/lib/formato'
import { useContextoAdmin } from '@/features/admin/ContextoAdmin'
import { KpiCard } from '@/features/admin/componentes'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { clientesDe } from '@/domain/solicitud/panel'
import { normalizar } from '@/domain/texto'

export default function AdminClientes() {
  const { solicitudes, cargando } = useSolicitudes()
  const { pedidos, cargandoPedidos } = useContextoAdmin()
  const [params, setParams] = useSearchParams()
  const texto = params.get('texto') ?? ''

  const clientes = useMemo(() => clientesDe(solicitudes, pedidos), [solicitudes, pedidos])
  const visibles = useMemo(() => {
    const buscado = normalizar(texto)
    return buscado ? clientes.filter((c) => normalizar(`${c.nombre} ${c.email} ${c.ciudad}`).includes(buscado)) : clientes
  }, [clientes, texto])

  if (cargando || cargandoPedidos) return <SkeletonCardList count={4} />

  const conCuenta = clientes.filter((c) => c.email).length
  const comprado = clientes.reduce((suma, c) => suma + c.comprado, 0)

  const buscar = (valor: string) => {
    const siguientes = new URLSearchParams(params)
    if (valor) siguientes.set('texto', valor)
    else siguientes.delete('texto')
    setParams(siguientes, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Clientes</h1>
        <p className="mt-1 text-sm text-body">Quién pidió soluciones y quién compró en la tienda, todo junto.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icono={Users} etiqueta="Clientes" valor={clientes.length} detalle="con solicitudes o pedidos" />
        <KpiCard icono={UserRound} etiqueta="Con cuenta" valor={conCuenta} detalle="identificados por su correo" />
        <KpiCard icono={Wallet} etiqueta="Comprado" valor={formatoCOP.format(comprado)} detalle="sin contar pedidos cancelados" />
      </div>

      <Card className="p-3.5">
        <label className="relative block sm:max-w-sm">
          <span className="sr-only">Buscar clientes</span>
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={texto}
            onChange={(e) => buscar(e.target.value)}
            placeholder="Nombre, correo o ciudad…"
            className={`${controlClass(false)} pl-9`}
          />
        </label>
      </Card>

      {visibles.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-14 text-center">
          <Inbox className="text-slate-300" size={40} />
          <p className="text-sm text-slate-400">{clientes.length === 0 ? 'Todavía no hay clientes.' : 'Ningún cliente coincide con la búsqueda.'}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Ciudad</th>
                  <th className="px-4 py-3">Solicitudes</th>
                  <th className="px-4 py-3">Pedidos</th>
                  <th className="px-4 py-3 text-right">Comprado</th>
                  <th className="px-4 py-3">Última actividad</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((c) => (
                  <tr key={c.clave} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={c.nombre} className="h-9 w-9 text-xs" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy">{c.nombre}</p>
                          <p className="truncate text-xs text-slate-400">{c.email || 'Sin cuenta'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-body">{c.ciudad || '—'}</td>
                    <td className="px-4 py-3.5">
                      {c.solicitudes > 0 ? (
                        <Link to={`/admin/solicitudes?texto=${encodeURIComponent(c.nombre)}`} className="font-semibold text-primary hover:underline">
                          {c.solicitudes}
                          {c.activas > 0 && <span className="ml-1.5 font-normal text-slate-400">({c.activas} activas)</span>}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {c.pedidos > 0 ? (
                        <Link to={`/admin/pedidos?texto=${encodeURIComponent(c.email || c.nombre)}`} className="font-semibold text-primary hover:underline">
                          {c.pedidos}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-navy tabular-nums">{c.comprado ? formatoCOP.format(c.comprado) : '—'}</td>
                    <td className="px-4 py-3.5 text-body">{c.ultimaActividad ? fechaCorta(c.ultimaActividad) : '—'}</td>
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
