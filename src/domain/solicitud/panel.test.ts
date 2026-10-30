import { describe, expect, it } from 'vitest'
import type { Pedido } from '@/domain/tienda/types'
import {
  actividadReciente,
  clientesDe,
  diasHasta,
  evaluarPrioridad,
  filtrarSolicitudes,
  ordenarPorUrgencia,
  prioridadDe,
  resumenPanel,
  SIN_FILTROS,
} from './panel'
import type { EstadoSolicitud, PatologiaDetectada, Severidad, Solicitud } from './types'

// Viernes 30 de octubre de 2026.
const HOY = new Date(2026, 9, 30)

interface Opciones {
  id?: string
  estado?: EstadoSolicitud
  fecha?: string
  requerida?: string
  severidad?: Severidad | null
  patologia?: PatologiaDetectada
  asignadoA?: string
  cliente?: string
  propietario?: string
  ciudad?: string
  descripcion?: string
}

function solicitud(o: Opciones = {}): Solicitud {
  const fecha = o.fecha ?? '2026-10-20'
  return {
    id: o.id ?? 'CL-1',
    fechaSolicitud: fecha,
    estado: o.estado ?? 'En análisis',
    historialEstados: [{ estado: 'Recibida', fecha }],
    propietario: o.propietario,
    data: {
      identificacion: { cliente: o.cliente ?? 'Cliente Demo', nit: '1', responsable: 'Resp', canal: 'Página web' },
      proyecto: { ciudad: o.ciudad ?? 'Cali', tipoObra: 'Vivienda', areaAprox: '20', fechaRequerida: o.requerida ?? '2027-03-01' },
      tecnica: { superficie: 'Interior', ambiente: 'Interior seco', condicion: 'Buen estado', colorAcabado: 'Mate' },
      evidencia: { descripcion: o.descripcion ?? '', imagenes: [], observaciones: '', consentimiento: true },
    },
    recomendacion: { tipoSolucion: '', producto: '', acabado: '', cantidadEstimada: '', aplicacion: '', tiempoEstimado: '', advertencias: [], estadoTexto: '' },
    diagnostico: o.patologia
      ? ({ patologia: o.patologia, severidad: o.severidad ?? null } as unknown as Solicitud['diagnostico'])
      : undefined,
    gestion: o.asignadoA ? { asignadoA: o.asignadoA, notas: [] } : undefined,
  }
}

function pedido(o: Partial<Pedido> = {}): Pedido {
  return { id: 'PED-1', clienteNombre: 'Cliente Demo', clienteEmail: '', items: [], total: 100000, estado: 'Recibido', fecha: '2026-10-10', ...o }
}

describe('diasHasta', () => {
  it('cuenta los días enteros hasta una fecha', () => {
    expect(diasHasta('2026-11-05', HOY)).toBe(6)
    expect(diasHasta('2026-10-30', HOY)).toBe(0)
    expect(diasHasta('2026-10-29', HOY)).toBe(-1)
  })

  it('devuelve null si la fecha no es válida', () => {
    expect(diasHasta('', HOY)).toBeNull()
    expect(diasHasta('mañana', HOY)).toBeNull()
  })
})

describe('evaluarPrioridad', () => {
  it('una fecha vencida o muy cercana es prioridad alta, y dice por qué', () => {
    const vencida = evaluarPrioridad(solicitud({ requerida: '2026-10-27' }), HOY)
    expect(vencida.prioridad).toBe('Alta')
    expect(vencida.motivos[0]).toMatch(/venció hace 3 días/)
    expect(evaluarPrioridad(solicitud({ requerida: '2026-11-05' }), HOY).prioridad).toBe('Alta')
    expect(evaluarPrioridad(solicitud({ requerida: '2026-10-30' }), HOY).motivos[0]).toBe('Se requiere hoy')
  })

  it('un daño severo en la foto es prioridad alta aunque falte tiempo', () => {
    const s = solicitud({ patologia: 'Fisuras y grietas', severidad: 'Severa' })
    expect(prioridadDe(s, HOY)).toBe('Alta')
    expect(evaluarPrioridad(s, HOY).motivos).toContain('Daño severo en la foto')
  })

  it('una fecha a 8-21 días o un daño moderado es prioridad media', () => {
    expect(prioridadDe(solicitud({ requerida: '2026-11-15' }), HOY)).toBe('Media')
    expect(prioridadDe(solicitud({ patologia: 'Moho y hongos', severidad: 'Moderada' }), HOY)).toBe('Media')
  })

  it('sin urgencia ni daño es prioridad baja, y una finalizada siempre lo es', () => {
    expect(prioridadDe(solicitud(), HOY)).toBe('Baja')
    expect(prioridadDe(solicitud({ estado: 'Finalizada', requerida: '2026-09-01', severidad: 'Severa', patologia: 'Moho y hongos' }), HOY)).toBe('Baja')
  })
})

describe('ordenarPorUrgencia', () => {
  it('pone lo más urgente primero y las finalizadas al final', () => {
    const lista = [
      solicitud({ id: 'baja', fecha: '2026-10-25' }),
      solicitud({ id: 'final', estado: 'Finalizada', fecha: '2026-10-29' }),
      solicitud({ id: 'alta', requerida: '2026-11-01' }),
      solicitud({ id: 'media', requerida: '2026-11-15' }),
    ]
    expect(ordenarPorUrgencia(lista, HOY).map((s) => s.id)).toEqual(['alta', 'media', 'baja', 'final'])
  })

  it('a igual urgencia, la más reciente primero, y no modifica la lista original', () => {
    const lista = [solicitud({ id: 'vieja', fecha: '2026-10-01' }), solicitud({ id: 'nueva', fecha: '2026-10-28' })]
    expect(ordenarPorUrgencia(lista, HOY).map((s) => s.id)).toEqual(['nueva', 'vieja'])
    expect(lista.map((s) => s.id)).toEqual(['vieja', 'nueva'])
  })
})

describe('filtrarSolicitudes', () => {
  const lista = [
    solicitud({ id: 'CL-1', estado: 'En análisis', patologia: 'Moho y hongos', severidad: 'Leve', asignadoA: 'Camila Vargas', ciudad: 'Bogotá', cliente: 'Hotel Vista Verde' }),
    solicitud({ id: 'CL-2', estado: 'Finalizada', patologia: 'Humedad y filtración', ciudad: 'Cali', descripcion: 'Gotera en el techo' }),
    solicitud({ id: 'CL-3', estado: 'En análisis', ciudad: 'Medellín', requerida: '2026-11-02' }),
  ]
  const ids = (f: Partial<typeof SIN_FILTROS>) => filtrarSolicitudes(lista, { ...SIN_FILTROS, ...f }, HOY).map((s) => s.id)

  it('sin filtros devuelve todo', () => {
    expect(ids({})).toEqual(['CL-1', 'CL-2', 'CL-3'])
  })

  it('filtra por estado, problema y prioridad', () => {
    expect(ids({ estado: 'En análisis' })).toEqual(['CL-1', 'CL-3'])
    expect(ids({ problema: 'Moho y hongos' })).toEqual(['CL-1'])
    expect(ids({ prioridad: 'Alta' })).toEqual(['CL-3'])
  })

  it('filtra por quién la atiende o por las que no tienen a nadie', () => {
    expect(ids({ asignado: 'Camila Vargas' })).toEqual(['CL-1'])
    expect(ids({ asignado: 'sin-asignar' })).toEqual(['CL-2', 'CL-3'])
  })

  it('busca por texto sin importar tildes ni mayúsculas', () => {
    expect(ids({ texto: 'bogota' })).toEqual(['CL-1'])
    expect(ids({ texto: 'VISTA verde' })).toEqual(['CL-1'])
    expect(ids({ texto: 'gotera' })).toEqual(['CL-2'])
    expect(ids({ texto: 'filtracion' })).toEqual(['CL-2'])
    expect(ids({ texto: 'cl-3' })).toEqual(['CL-3'])
  })

  it('combina los filtros', () => {
    expect(ids({ estado: 'En análisis', asignado: 'sin-asignar' })).toEqual(['CL-3'])
    expect(ids({ estado: 'Finalizada', texto: 'bogota' })).toEqual([])
  })
})

describe('resumenPanel', () => {
  const solicitudes = [
    solicitud({ id: 'a', estado: 'En análisis', fecha: '2026-10-28', patologia: 'Moho y hongos', severidad: 'Severa' }),
    solicitud({ id: 'b', estado: 'En análisis', fecha: '2026-10-26', patologia: 'Moho y hongos', severidad: 'Leve', asignadoA: 'Camila Vargas' }),
    solicitud({ id: 'c', estado: 'Finalizada', fecha: '2026-10-05', patologia: 'Fisuras y grietas', severidad: 'Leve' }),
    solicitud({ id: 'd', estado: 'Servicio programado', fecha: '2026-09-02', patologia: 'Sin daños evidentes' }),
    solicitud({ id: 'e', estado: 'Solución propuesta', fecha: '2026-08-31' }),
  ]
  const pedidos = [
    pedido({ id: 'P1', fecha: '2026-10-29', total: 300000, estado: 'Recibido' }),
    pedido({ id: 'P2', fecha: '2026-10-12', total: 200000, estado: 'En preparación' }),
    pedido({ id: 'P3', fecha: '2026-10-02', total: 50000, estado: 'Cancelado' }),
    pedido({ id: 'P4', fecha: '2026-09-20', total: 700000, estado: 'Entregado' }),
  ]
  const r = resumenPanel(solicitudes, pedidos, HOY)

  it('cuenta las solicitudes por estado, activas y sin asignar', () => {
    expect(r.total).toBe(5)
    expect(r.activas).toBe(4)
    expect(r.finalizadas).toBe(1)
    expect(r.porEstado['En análisis']).toBe(2)
    expect(r.porEstado.Recibida).toBe(0)
    expect(r.sinAsignar).toBe(3)
    expect(r.prioridadAlta).toBe(1)
  })

  it('cuenta los problemas diagnosticados, sin incluir los "sin daños", del más al menos frecuente', () => {
    expect(r.porProblema).toEqual([
      { patologia: 'Moho y hongos', cantidad: 2 },
      { patologia: 'Fisuras y grietas', cantidad: 1 },
    ])
  })

  it('reparte las solicitudes en las últimas 8 semanas, de lunes a domingo', () => {
    expect(r.porSemana).toHaveLength(8)
    expect(r.porSemana.at(-1)).toEqual({ desde: '2026-10-26', cantidad: 2 })
    expect(r.porSemana.at(-2)).toEqual({ desde: '2026-10-19', cantidad: 0 })
    expect(r.porSemana.at(-4)).toEqual({ desde: '2026-10-05', cantidad: 1 })
    expect(r.porSemana[0].desde).toBe('2026-09-07')
    expect(r.porSemana.reduce((suma, s) => suma + s.cantidad, 0)).toBe(3)
  })

  it('suma las ventas del mes sin los pedidos cancelados ni los de otros meses', () => {
    expect(r.pedidosMes).toBe(2)
    expect(r.ventasMes).toBe(500000)
    expect(r.pedidosPorAtender).toBe(2)
  })
})

describe('actividadReciente', () => {
  const a = solicitud({ id: 'CL-A', cliente: 'Hotel Sol', fecha: '2026-10-20' })
  a.historialEstados = [
    { estado: 'Recibida', fecha: '2026-10-20' },
    { estado: 'En análisis', fecha: '2026-10-21' },
  ]
  a.gestion = { notas: [{ id: 'n1', autor: 'Camila Vargas', texto: 'Llamé', fecha: '2026-10-22T15:00:00Z' }] }
  const b = solicitud({ id: 'CL-B', cliente: '', fecha: '2026-10-25' })

  it('junta solicitudes nuevas, cambios de estado y notas, lo más reciente primero', () => {
    const eventos = actividadReciente([a, b])
    expect(eventos.map((e) => `${e.solicitudId}: ${e.texto}`)).toEqual([
      'CL-B: Nueva solicitud de un cliente',
      'CL-A: Camila Vargas dejó una nota',
      'CL-A: Pasó a "En análisis"',
      'CL-A: Nueva solicitud de Hotel Sol',
    ])
  })

  it('respeta el límite', () => {
    expect(actividadReciente([a, b], 2)).toHaveLength(2)
  })
})

describe('clientesDe', () => {
  const solicitudes = [
    solicitud({ id: 'a', propietario: 'ana@correo.com', cliente: 'Ana Pérez', fecha: '2026-10-01', ciudad: 'Cali' }),
    solicitud({ id: 'b', propietario: 'ANA@correo.com', cliente: 'Ana Pérez', fecha: '2026-10-20', estado: 'Finalizada' }),
    solicitud({ id: 'c', cliente: 'Constructora Norte', fecha: '2026-10-25', ciudad: 'Bogotá' }),
  ]
  const pedidos = [
    pedido({ id: 'P1', clienteEmail: 'ana@correo.com', clienteNombre: 'Ana Pérez', total: 120000, fecha: '2026-10-28' }),
    pedido({ id: 'P2', clienteEmail: 'ana@correo.com', clienteNombre: 'Ana Pérez', total: 80000, estado: 'Cancelado', fecha: '2026-10-29' }),
    pedido({ id: 'P3', clienteEmail: 'luis@correo.com', clienteNombre: 'Luis Gómez', total: 50000, fecha: '2026-09-01' }),
  ]
  const clientes = clientesDe(solicitudes, pedidos)

  it('junta lo que pidió y lo que compró cada cliente por correo', () => {
    const ana = clientes.find((c) => c.email === 'ana@correo.com')
    expect(ana).toMatchObject({ solicitudes: 2, activas: 1, pedidos: 2, comprado: 120000, ciudad: 'Cali' })
  })

  it('reconoce a quien solo compró y a quien solo pidió, sin correo', () => {
    expect(clientes.find((c) => c.email === 'luis@correo.com')).toMatchObject({ solicitudes: 0, pedidos: 1, comprado: 50000 })
    expect(clientes.find((c) => c.nombre === 'Constructora Norte')).toMatchObject({ solicitudes: 1, pedidos: 0, email: '' })
  })

  it('ordena por la actividad más reciente', () => {
    expect(clientes.map((c) => c.nombre)).toEqual(['Ana Pérez', 'Constructora Norte', 'Luis Gómez'])
    expect(clientes[0].ultimaActividad).toBe('2026-10-29')
  })
})
