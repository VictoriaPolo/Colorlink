import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, Download, Inbox, Package, Receipt, Search, Wallet } from 'lucide-react'
import Card from '@/shared/ui/Card'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import { controlClass } from '@/shared/ui/FormField'
import { fechaCorta, formatoCOP } from '@/shared/lib/formato'
import { descargarCSV } from '@/shared/lib/csv'
import { useContextoAdmin } from '@/features/admin/ContextoAdmin'
import { KpiCard } from '@/features/admin/componentes'
import PagoChip from '@/features/pagos/PagoChip'
import { resumenPanel } from '@/domain/solicitud/panel'
import { normalizar } from '@/domain/texto'
import { NOMBRE_METODO } from '@/domain/pagos/tipos'
import { pagoDe } from '@/domain/pagos/pasarela'
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

/** Un pedido cancelado ya no se cobra, aunque su pago siga como pendiente. */
const porCobrar = (p: Pedido) => p.estado !== 'Cancelado' && pagoDe(p).estado === 'Pendiente'

export default function AdminPedidos() {
  const { pedidos, cargandoPedidos, cambiarEstadoPedido } = useContextoAdmin()
  const [params, setParams] = useSearchParams()
  const estado = params.get('estado') ?? ''
  const texto = params.get('texto') ?? ''
  const soloPorCobrar = params.get('pago') === 'pendiente'

  const cambiar = (clave: string, valor: string) => {
    const siguientes = new URLSearchParams(params)
    if (valor) siguientes.set(clave, valor)
    else siguientes.delete(clave)
    setParams(siguientes, { replace: true })
  }

  const resumen = useMemo(() => resumenPanel([], pedidos), [pedidos])
  const vendidos = pedidos.filter((p) => p.estado !== 'Cancelado')
  const ticket = vendidos.length ? vendidos.reduce((suma, p) => suma + p.total, 0) / vendidos.length : 0
  const pendientes = pedidos.filter(porCobrar)
  const montoPorCobrar = pendientes.reduce((suma, p) => suma + p.total, 0)

  const visibles = useMemo(() => {
    const buscado = normalizar(texto)
    return pedidos.filter((p) => {
      if (estado && p.estado !== estado) return false
      if (soloPorCobrar && !porCobrar(p)) return false
      if (!buscado) return true
      // El código de retiro y la referencia del pago se buscan igual: es lo que el cliente dicta en la tienda.
      const { referencia } = pagoDe(p)
      return normalizar([p.id, p.clienteNombre, p.clienteEmail, p.codigoRetiro ?? '', referencia, ...p.items.map((i) => i.nombre)].join(' ')).includes(buscado)
    })
  }, [pedidos, estado, texto, soloPorCobrar])

  if (cargandoPedidos) return <SkeletonCardList count={4} />

  const exportar = () => {
    descargarCSV(
      'pedidos-colorlink',
      ['ID', 'Cliente', 'Correo', 'Productos', 'Total', 'Estado', 'Medio de pago', 'Estado del pago', 'Referencia del pago', 'Código de retiro', 'Punto de retiro', 'Fecha'],
      visibles.map((p) => {
        const pago = pagoDe(p)
        return [
          p.id,
          p.clienteNombre,
          p.clienteEmail,
          resumenItems(p).join(' | '),
          p.total,
          p.estado,
          NOMBRE_METODO[pago.metodo],
          pago.estado,
          pago.referencia,
          p.codigoRetiro ?? '',
          p.puntoRetiro ?? '',
          p.fecha,
        ]
      }),
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Pedidos de la tienda</h1>
          <p className="mt-1 text-sm text-body">Lo que los clientes compraron en el catálogo, para prepararlo y entregarlo.</p>
        </div>
        <button
          onClick={exportar}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy hover:border-primary hover:text-primary"
        >
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <KpiCard icono={Package} etiqueta="Pedidos" valor={pedidos.length} detalle="en total" />
        <KpiCard icono={Receipt} etiqueta="Por atender" valor={resumen.pedidosPorAtender} detalle="recibidos o en preparación" tono={resumen.pedidosPorAtender > 0 ? 'alerta' : 'normal'} />
        <KpiCard icono={Wallet} etiqueta="Ventas del mes" valor={formatoCOP.format(resumen.ventasMes)} detalle={`${resumen.pedidosMes} pedidos sin cancelar`} />
        <KpiCard icono={CheckCircle2} etiqueta="Pedido promedio" valor={formatoCOP.format(ticket)} detalle="sin contar cancelados" />
        <KpiCard
          icono={Clock}
          etiqueta="Por cobrar"
          valor={formatoCOP.format(montoPorCobrar)}
          detalle={pendientes.length === 1 ? '1 pedido se paga al retirar' : `${pendientes.length} pedidos se pagan al retirar`}
          tono={pendientes.length > 0 ? 'alerta' : 'normal'}
        />
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
          <button
            onClick={() => cambiar('pago', soloPorCobrar ? '' : 'pendiente')}
            aria-pressed={soloPorCobrar}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              soloPorCobrar ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Por cobrar <span className={soloPorCobrar ? 'text-white/80' : 'text-amber-600'}>{pendientes.length}</span>
          </button>
          <label className="relative ml-auto w-full sm:w-72">
            <span className="sr-only">Buscar pedidos</span>
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={texto}
              onChange={(e) => cambiar('texto', e.target.value)}
              placeholder="Cliente, producto, código…"
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
            <table className="w-full min-w-[820px] text-left text-sm [&_td]:px-3 [&_th]:px-3">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Productos</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 align-top last:border-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3.5">
                      <Link to={`/admin/pedidos/${p.id}`} className="font-bold whitespace-nowrap text-navy hover:text-primary">
                        {p.id}
                      </Link>
                      <p className="text-xs text-slate-400">{fechaCorta(p.fecha)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-navy">{p.clienteNombre}</p>
                      <p className="max-w-44 truncate text-xs text-slate-400">{p.clienteEmail || 'Sin correo'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <ul className="flex max-w-52 flex-col gap-0.5 text-xs text-body">
                        {resumenItems(p).map((linea) => (
                          <li key={linea} className="truncate">
                            {linea}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-navy tabular-nums">{formatoCOP.format(p.total)}</td>
                    <td className="px-4 py-3.5">
                      <PagoChip estado={pagoDe(p).estado} />
                      <p className="mt-1 text-xs whitespace-nowrap text-slate-400">{NOMBRE_METODO[pagoDe(p).metodo]}</p>
                    </td>
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
                    <td className="px-4 py-3.5 text-right">
                      <Link to={`/admin/pedidos/${p.id}`} className="text-sm font-semibold text-primary hover:underline">
                        Ver
                      </Link>
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
