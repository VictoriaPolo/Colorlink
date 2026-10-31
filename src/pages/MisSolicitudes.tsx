import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PlusCircle, Inbox, Search, LayoutGrid, Table2, ChevronRight, Package } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import Badge from '@/shared/ui/Badge'
import { ESTILO_ESTADO } from '@/shared/ui/estadoEstilos'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import SolicitudesTable from '@/features/solicitudes/SolicitudesTable'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { useAuth } from '@/features/auth/AuthContext'
import TarjetaPedido from '@/features/pagos/TarjetaPedido'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import type { EstadoSolicitud, Superficie } from '@/domain/solicitud/types'
import type { Pedido } from '@/domain/tienda/types'

const ESTADOS: EstadoSolicitud[] = [
  'Recibida',
  'En análisis',
  'Solución propuesta',
  'En abastecimiento',
  'Servicio programado',
  'Finalizada',
]
const SUPERFICIES: Superficie[] = ['Interior', 'Exterior', 'Fachada', 'Metal', 'Madera', 'Concreto', 'Otro']

export default function MisSolicitudes() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { solicitudes, cargando } = useSolicitudes()
  // La pestaña vive en la dirección (?seccion=pedidos): así el carrito, la cabecera y Coli pueden llevar directo a los pedidos.
  const [parametros, setParametros] = useSearchParams()
  const seccion: 'solicitudes' | 'pedidos' = parametros.get('seccion') === 'pedidos' ? 'pedidos' : 'solicitudes'
  const setSeccion = (nueva: 'solicitudes' | 'pedidos') => setParametros(nueva === 'pedidos' ? { seccion: 'pedidos' } : {}, { replace: true })
  const [busqueda, setBusqueda] = useState('')
  const [superficie, setSuperficie] = useState<Superficie | 'Todas'>('Todas')
  const [estado, setEstado] = useState<EstadoSolicitud | 'Todos'>('Todos')
  const [vista, setVista] = useState<'tabla' | 'cuadricula'>('tabla')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargandoPedidos, setCargandoPedidos] = useState(true)

  useEffect(() => {
    if (!usuario) return
    let vivo = true
    const cargar = () =>
      tiendaRepository
        .listarPedidosPorEmail(usuario.email)
        .then((data) => vivo && setPedidos(data))
        .catch(() => {})
        .finally(() => vivo && setCargandoPedidos(false))
    void cargar()
    // Si el equipo avanzó un pedido mientras la persona estaba en otra ventana, lo ve al volver.
    window.addEventListener('focus', cargar)
    return () => {
      vivo = false
      window.removeEventListener('focus', cargar)
    }
  }, [usuario])

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return solicitudes.filter((s) => {
      if (superficie !== 'Todas' && s.data.tecnica.superficie !== superficie) return false
      if (estado !== 'Todos' && s.estado !== estado) return false
      if (q) {
        const texto = `${s.id} ${s.data.proyecto.ciudad} ${s.data.proyecto.tipoObra} ${s.data.identificacion.cliente}`.toLowerCase()
        if (!texto.includes(q)) return false
      }
      return true
    })
  }, [solicitudes, busqueda, superficie, estado])

  const limpiarFiltros = () => {
    setBusqueda('')
    setSuperficie('Todas')
    setEstado('Todos')
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Mis solicitudes</h1>
          <p className="mt-1 text-sm text-body">
            Historial y seguimiento de todas tus solicitudes, especificaciones técnicas y pedidos.
          </p>
        </div>
        {seccion === 'solicitudes' ? (
          <Button icon={<PlusCircle size={17} />} onClick={() => navigate('/solicitar')}>
            Nueva solicitud
          </Button>
        ) : (
          <Button icon={<PlusCircle size={17} />} onClick={() => navigate('/catalogo')}>
            Ir al catálogo
          </Button>
        )}
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setSeccion('solicitudes')}
          className={`border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
            seccion === 'solicitudes' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-navy'
          }`}
        >
          Solicitudes de diagnóstico
        </button>
        <button
          onClick={() => setSeccion('pedidos')}
          className={`border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
            seccion === 'pedidos' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-navy'
          }`}
        >
          Pedidos de la tienda
          {pedidos.length > 0 && <span className="ml-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-primary">{pedidos.length}</span>}
        </button>
      </div>

      {seccion === 'pedidos' ? (
        cargandoPedidos ? (
          <SkeletonCardList count={3} />
        ) : pedidos.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-14 text-center">
            <Package className="text-slate-300" size={40} />
            <p className="text-sm text-slate-400">Aún no tienes pedidos registrados.</p>
            <Button onClick={() => navigate('/catalogo')}>Ir al catálogo</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {pedidos.map((p) => (
              <TarjetaPedido key={p.id} pedido={p} />
            ))}
          </div>
        )
      ) : (
        <>
      {solicitudes.length > 0 && (
        <div className="mb-5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por ID, ciudad, tipo de obra o cliente..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3.5 pl-10 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-brand-100"
              />
            </div>
            <div className="flex shrink-0 gap-1 rounded-xl border border-slate-200 bg-white p-1">
              <button
                onClick={() => setVista('cuadricula')}
                aria-label="Vista en cuadrícula"
                title="Vista en cuadrícula"
                className={`rounded-lg p-1.5 transition-colors ${vista === 'cuadricula' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <LayoutGrid size={17} />
              </button>
              <button
                onClick={() => setVista('tabla')}
                aria-label="Vista en tabla"
                title="Vista en tabla"
                className={`rounded-lg p-1.5 transition-colors ${vista === 'tabla' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <Table2 size={17} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSuperficie('Todas')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                superficie === 'Todas' ? 'bg-navy text-white' : 'bg-slate-100 text-body hover:bg-slate-200'
              }`}
            >
              Todas las superficies
            </button>
            {SUPERFICIES.map((s) => (
              <button
                key={s}
                onClick={() => setSuperficie(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  superficie === s ? 'bg-navy text-white' : 'bg-slate-100 text-body hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEstado('Todos')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                estado === 'Todos' ? 'bg-primary text-white' : 'bg-slate-100 text-body hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            {ESTADOS.map((e) => (
              <button
                key={e}
                onClick={() => setEstado(e)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  estado === e ? 'bg-primary text-white' : 'bg-slate-100 text-body hover:bg-slate-200'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${estado === e ? 'bg-white' : ESTILO_ESTADO[e].punto}`} />
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {cargando ? (
        <SkeletonCardList count={3} />
      ) : solicitudes.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-14 text-center">
          <Inbox className="text-slate-300" size={40} />
          <p className="text-sm text-slate-400">Aún no tienes solicitudes registradas.</p>
          <Button onClick={() => navigate('/solicitar')}>Crear mi primera solicitud</Button>
        </Card>
      ) : filtradas.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-14 text-center">
          <Inbox className="text-slate-300" size={40} />
          <p className="text-sm text-slate-400">No se encontraron solicitudes con los filtros seleccionados.</p>
          <button onClick={limpiarFiltros} className="text-sm font-semibold text-primary hover:underline">
            Limpiar filtros
          </button>
        </Card>
      ) : vista === 'cuadricula' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((s) => (
            <Card key={s.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-navy">{s.id}</p>
                  <p className="text-xs text-slate-400">{s.fechaSolicitud}</p>
                </div>
                <Badge estado={s.estado} />
              </div>
              <p className="text-sm text-body">
                {s.data.proyecto.tipoObra || '—'} · {s.data.proyecto.ciudad || '—'}
              </p>
              <div className="mt-auto flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  onClick={() => navigate(`/mis-solicitudes/${s.id}`)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Ver detalle <ChevronRight size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <SolicitudesTable solicitudes={filtradas} detalleBasePath="/mis-solicitudes" />
      )}
        </>
      )}
    </div>
  )
}
