import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Inbox, Package, Receipt, Search, Wallet } from 'lucide-react'
import Card from '@/shared/ui/Card'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import { controlClass } from '@/shared/ui/FormField'
import { fechaCorta, formatoCOP } from '@/shared/lib/formato'
import { useContextoAdmin } from '@/features/admin/ContextoAdmin'
import { KpiCard } from '@/features/admin/componentes'
import { resumenPanel } from '@/domain/solicitud/panel'
import { normalizar } from '@/domain/texto'
import { ESTADOS_PEDIDO } from '@/domain/tienda/types'
import type { Pedido } from '@/domain/tienda/types'

const ESTILO_PEDIDO: Record<string, string> = {
  Recibido: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  'En preparación': 'bg-amber-50 text-amber-800 ring-amber-600/30',
  'Listo para retiro': 'bg-cyan-50 text-cyan-800 ring-cyan-600/30',
  Entregado: 'bg-green-50 text-green-700 ring-green-600/25',
  Cancelado: 'bg-red-50 text-red-700 ring-red-600/25',
}

const resumenItems = (p: Pedido) => p.items.map((i) => `${i.cantidad}× ${i.nombre}`)

export default function AdminPedidos() {
  const { pedidos, cargandoPedidos, cambiarEstadoPedido } = useContextoAdmin()
  const [params, setParams] = useSearchParams()
  const estado = params.get('estado') ?? ''
  const texto = params.get('texto') ?? ''

  const cambiar = (clave: string, valor: string) => {
    const siguientes = new URLSearchParams(params)
    if (valor) siguientes.set(clave, valor)
    else siguientes.delete(clave)
    setParams(siguientes, { replace: true })
  }

  const resumen = useMemo(() => resumenPanel([], pedidos), [pedidos])
  const vendidos = pedidos.filter((p) => p.estado !== 'Cancelado')
  const ticket = vendidos.length ? vendidos.reduce((suma, p) => suma + p.total, 0) / vendidos.length : 0

  const visibles = useMemo(() => {
    const buscado = normalizar(texto)
    return pedidos.filter((p) => {
      if (estado && p.estado !== estado) return false
      if (!buscado) return true
      return normalizar([p.id, p.clienteNombre, p.clienteEmail, ...p.items.map((i) => i.nombre)].join(' ')).includes(buscado)
    })
  }, [pedidos, estado, texto])

  if (cargandoPedidos) return <SkeletonCardList count={4} />

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Pedidos de la tienda</h1>
        <p className="mt-1 text-sm text-body">Lo que los clientes compraron en el catálogo, para prepararlo y entregarlo.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 2xl:grid-cols-4">
        <KpiCard icono={Package} etiqueta="Pedidos" valor={pedidos.length} detalle="en total" />
        <KpiCard icono={Receipt} etiqueta="Por atender" valor={resumen.pedidosPorAtender} detalle="recibidos o en preparación" tono={resumen.pedidosPorAtender > 0 ? 'alerta' : 'normal'} />
        <KpiCard icono={Wallet} etiqueta="Ventas del mes" valor={formatoCOP.format(resumen.ventasMes)} detalle={`${resumen.pedidosMes} pedidos sin cancelar`} />
        <KpiCard icono={CheckCircle2} etiqueta="Pedido promedio" valor={formatoCOP.format(ticket)} detalle="sin contar cancelados" />
      </div>

      <Card className="p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {['', ...ESTADOS_PEDIDO].map((e) => {
            const cantidad = e ? pedidos.filter((p) => p.estado === e).length : pedidos.length
            return (
              <button
                key={e || 'todos'}
                onClick={() => cambiar('estado', e)}
                aria-pressed={estado === e}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  estado === e ? 'bg-navy text-white' : 'bg-slate-100 text-body hover:bg-slate-200'
                }`}
              >
                {e || 'Todos'} <span className={estado === e ? 'text-white/70' : 'text-slate-400'}>{cantidad}</span>
              </button>
            )
          })}
          <label className="relative ml-auto w-full sm:w-72">
            <span className="sr-only">Buscar pedidos</span>
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={texto}
              onChange={(e) => cambiar('texto', e.target.value)}
              placeholder="Cliente, correo, producto…"
              className={`${controlClass(false)} pl-9`}
            />
          </label>
        </div>
      </Card>

      {visibles.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-14 text-center">
          <Inbox className="text-slate-300" size={40} />
          <p className="text-sm text-slate-400">{pedidos.length === 0 ? 'Todavía no hay pedidos.' : 'Ningún pedido coincide con la búsqueda.'}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Productos</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 align-top last:border-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-navy">{p.id}</p>
                      <p className="text-xs text-slate-400">{fechaCorta(p.fecha)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-navy">{p.clienteNombre}</p>
                      <p className="text-xs text-slate-400">{p.clienteEmail || 'Sin correo'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <ul className="flex max-w-80 flex-col gap-0.5 text-xs text-body">
                        {resumenItems(p).map((linea) => (
                          <li key={linea} className="truncate">
                            {linea}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-navy tabular-nums">{formatoCOP.format(p.total)}</td>
                    <td className="px-4 py-3.5">
                      <select
                        aria-label={`Estado de ${p.id}`}
                        value={p.estado}
                        onChange={(e) => cambiarEstadoPedido(p.id, e.target.value)}
                        className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-bold ring-1 ring-inset outline-none focus:ring-2 focus:ring-primary ${ESTILO_PEDIDO[p.estado] ?? ESTILO_PEDIDO.Recibido}`}
                      >
                        {ESTADOS_PEDIDO.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
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
