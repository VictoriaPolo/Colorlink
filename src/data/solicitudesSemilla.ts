import { diagnosticar } from '@/domain/diagnostico/diagnosticar'
import type { MetricasImagen } from '@/domain/diagnostico/analizarPixeles'
import { generarRecomendacion } from '@/domain/solicitud/recommendationEngine'
import {
  ORDEN_ESTADOS,
  type CanalEntrada,
  type EstadoSolicitud,
  type NotaInterna,
  type Solicitud,
  type TecnicaData,
  type TipoObra,
  type ZonaAfectada,
} from '@/domain/solicitud/types'

/**
 * Solicitudes de ejemplo para el modo sin Supabase: el panel del equipo y la
 * vista del cliente tienen con qué trabajar desde el primer día. Las fotos son
 * de Unsplash y los diagnósticos salen del mismo motor que usa la aplicación,
 * a partir de lo que el analizador midió en cada foto.
 */

const foto = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=75`

/** Lo que el analizador midió en una foto (fracciones del encuadre, longitud de grietas en diagonales). */
interface Medidas {
  moho?: number
  humedad?: number
  oxido?: number
  descascarado?: number
  grietas?: number
  rugosidad?: number
  juntas?: number
  brillo?: number
}

function metricas(m: Medidas): MetricasImagen {
  const grietas = m.grietas ?? 0
  return {
    ancho: 320,
    alto: 240,
    fracciones: {
      moho: m.moho ?? 0,
      humedad: m.humedad ?? 0,
      grietas: Math.min(1, grietas / 4),
      oxido: m.oxido ?? 0,
      descascarado: m.descascarado ?? 0,
    },
    longitudGrietas: grietas,
    juntasRectas: m.juntas ?? 0,
    crestas: 0,
    rugosidad: m.rugosidad ?? 0,
    mapa: new Uint8Array(0),
    brillo: m.brillo ?? 140,
    nitidez: 100,
  }
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

interface Semilla {
  id: string
  propietario: string
  fecha: string
  estado: EstadoSolicitud
  cliente: string
  nit: string
  responsable: string
  canal?: CanalEntrada
  ciudad: string
  tipoObra: TipoObra
  area: string
  requerida: string
  tecnica: TecnicaData
  zona: ZonaAfectada
  descripcion: string
  fotos?: { id: string; nombre: string; medidas: Medidas }[]
  asignadoA?: string
  notas?: Omit<NotaInterna, 'id'>[]
}

function crear(s: Semilla): Solicitud {
  const fotos = s.fotos ?? []
  const data: Solicitud['data'] = {
    identificacion: { cliente: s.cliente, nit: s.nit, responsable: s.responsable, canal: s.canal ?? 'Página web' },
    proyecto: { ciudad: s.ciudad, tipoObra: s.tipoObra, areaAprox: s.area, fechaRequerida: s.requerida },
    tecnica: s.tecnica,
    evidencia: {
      descripcion: s.descripcion,
      imagenes: fotos.map((f, i) => ({ id: `${s.id}-${i + 1}`, nombre: f.nombre, url: foto(f.id) })),
      observaciones: '',
      consentimiento: true,
      zona: s.zona,
    },
  }
  const diagnostico = diagnosticar({
    zona: s.zona,
    descripcion: s.descripcion,
    superficie: s.tecnica.superficie,
    condicion: s.tecnica.condicion,
    metricas: fotos.map((f) => metricas(f.medidas)),
    fecha: sumarDias(s.fecha, 0),
  })
  const hasta = ORDEN_ESTADOS.indexOf(s.estado)
  return {
    id: s.id,
    fechaSolicitud: s.fecha,
    estado: s.estado,
    data,
    recomendacion: generarRecomendacion(data, diagnostico),
    historialEstados: ORDEN_ESTADOS.slice(0, hasta + 1).map((estado, i) => ({ estado, fecha: sumarDias(s.fecha, i) })),
    propietario: s.propietario,
    diagnostico,
    gestion: {
      asignadoA: s.asignadoA,
      notas: (s.notas ?? []).map((n, i) => ({ ...n, id: `${s.id}-n${i + 1}` })),
    },
  }
}

const original: Solicitud = {
  id: 'CL-1001',
  fechaSolicitud: '2026-08-15',
  estado: 'En análisis',
  historialEstados: [
    { estado: 'Recibida', fecha: '2026-08-15' },
    { estado: 'En análisis', fecha: '2026-08-16' },
  ],
  propietario: 'laura@colorlink.com',
  data: {
    identificacion: {
      cliente: 'Constructora Andina S.A.S.',
      nit: '900123456-7',
      responsable: 'Laura Polo',
      canal: 'Página web',
    },
    proyecto: {
      ciudad: 'Bogotá',
      tipoObra: 'Edificio',
      areaAprox: '120',
      fechaRequerida: '2026-09-10',
    },
    tecnica: {
      superficie: 'Exterior',
      ambiente: 'Exterior',
      condicion: 'Buen estado',
      colorAcabado: 'Satinado',
    },
    evidencia: {
      descripcion: 'Fachada de edificio residencial de 6 pisos, requiere renovación de pintura exterior.',
      imagenes: [],
      observaciones: '',
      consentimiento: true,
      zona: 'Fachada',
    },
  },
  recomendacion: {
    tipoSolucion: 'Sistema de recubrimiento para exterior',
    producto: 'Koraza 5 Años Protección Total',
    acabado: 'Satinado',
    cantidadEstimada: '8 unidades (aprox. 120 m²)',
    aplicacion: '2 capas',
    tiempoEstimado: '3 a 4 días',
    advertencias: [],
    estadoTexto: 'Recomendación preliminar',
  },
  gestion: {
    asignadoA: 'Andrés Moreno',
    notas: [
      {
        id: 'CL-1001-n1',
        autor: 'Andrés Moreno',
        texto: 'Llamé al responsable: el edificio se pinta en temporada seca. Falta confirmar si hay andamios certificados.',
        fecha: '2026-08-17T15:10:00Z',
      },
    ],
  },
}

export const solicitudesIniciales: Solicitud[] = [
  crear({
    id: 'CL-1008',
    propietario: 'carlos@colorlink.com',
    fecha: '2026-10-20',
    estado: 'Solución propuesta',
    cliente: 'Carlos Restrepo',
    nit: '71234567-8',
    responsable: 'Carlos Restrepo',
    ciudad: 'Medellín',
    tipoObra: 'Vivienda',
    area: '30',
    requerida: '2026-11-15',
    tecnica: { superficie: 'Interior', ambiente: 'Interior seco', condicion: 'Buen estado', colorAcabado: 'Mate' },
    zona: 'Pared',
    descripcion: 'Quiero cambiar el color de la sala por un tono cálido y que quede bien protegida.',
    asignadoA: 'Camila Vargas',
    notas: [{ autor: 'Camila Vargas', texto: 'Le envié 3 opciones de color de la paleta cálida. Espera decidir con su familia.', fecha: '2026-10-22T09:30:00Z' }],
  }),
  crear({
    id: 'CL-1007',
    propietario: 'compras@constructoraandina.co',
    fecha: '2026-10-28',
    estado: 'En análisis',
    cliente: 'Constructora Andina S.A.S.',
    nit: '900123456-7',
    responsable: 'Mateo Jaramillo',
    canal: 'Llamada',
    ciudad: 'Bogotá',
    tipoObra: 'Edificio',
    area: '150',
    requerida: '2026-12-10',
    tecnica: { superficie: 'Concreto', ambiente: 'Interior húmedo', condicion: 'Con humedad', colorAcabado: 'Mate' },
    zona: 'Pared',
    descripcion: 'Muros del sótano con humedad que sube desde el piso y una capa blanca como polvo (salitre).',
    fotos: [{ id: '1528459010029-4d4cb68b11e3', nombre: 'muro-sotano.jpg', medidas: { humedad: 0.031, grietas: 0.14, brillo: 170 } }],
  }),
  crear({
    id: 'CL-1006',
    propietario: 'pedidos@elmaestro.co',
    fecha: '2026-09-14',
    estado: 'Finalizada',
    cliente: 'Ferretería El Maestro',
    nit: '890456123-2',
    responsable: 'Rosa Elena Pardo',
    canal: 'Punto físico',
    ciudad: 'Barranquilla',
    tipoObra: 'Bodega',
    area: '90',
    requerida: '2026-10-05',
    tecnica: { superficie: 'Concreto', ambiente: 'Interior seco', condicion: 'Con grietas', colorAcabado: 'Antideslizante' },
    zona: 'Piso',
    descripcion: 'Una grieta larga cruza el piso de la bodega y se va abriendo con el paso de los montacargas.',
    fotos: [{ id: '1706660143732-c1d14701114e', nombre: 'piso-bodega.jpg', medidas: { grietas: 2.49, descascarado: 0.624, rugosidad: 0.75, moho: 0.002 } }],
    asignadoA: 'Camila Vargas',
    notas: [
      { autor: 'Camila Vargas', texto: 'Visita técnica: la grieta no atraviesa la losa. Se rellena con masilla elástica y se sella el piso.', fecha: '2026-09-17T14:00:00Z' },
      { autor: 'Camila Vargas', texto: 'Trabajo terminado y recibido a satisfacción por el cliente.', fecha: '2026-10-02T17:45:00Z' },
    ],
  }),
  crear({
    id: 'CL-1005',
    propietario: 'compras@vistaverde.co',
    fecha: '2026-10-08',
    estado: 'Servicio programado',
    cliente: 'Hotel Vista Verde',
    nit: '900765432-1',
    responsable: 'Juliana Cárdenas',
    canal: 'WhatsApp',
    ciudad: 'Cartagena',
    tipoObra: 'Edificio',
    area: '240',
    requerida: '2026-11-20',
    tecnica: { superficie: 'Interior', ambiente: 'Interior húmedo', condicion: 'Con humedad', colorAcabado: 'Mate' },
    zona: 'Pared',
    descripcion: 'Moho negro en las paredes y en la esquina del techo de los baños de las habitaciones del segundo piso.',
    fotos: [
      { id: '1708895240122-418c6902685e', nombre: 'bano-hab-204.jpg', medidas: { moho: 0.104, descascarado: 0.84, rugosidad: 0.94 } },
      { id: '1649777882133-525e923fd5d7', nombre: 'esquina-techo.jpg', medidas: { moho: 0.057, descascarado: 0.297, rugosidad: 0.36 } },
    ],
    asignadoA: 'Daniela Ortiz',
    notas: [
      { autor: 'Daniela Ortiz', texto: 'Se programa la obra por pisos para no cerrar el hotel. Primera tanda: habitaciones 201 a 208.', fecha: '2026-10-21T11:20:00Z' },
    ],
  }),
  crear({
    id: 'CL-1004',
    propietario: 'valentina.ruiz@gmail.com',
    fecha: '2026-10-26',
    estado: 'En análisis',
    cliente: 'Valentina Ruiz',
    nit: '1010234567',
    responsable: 'Valentina Ruiz',
    ciudad: 'Cali',
    tipoObra: 'Vivienda',
    area: '6',
    requerida: '2026-11-30',
    tecnica: { superficie: 'Metal', ambiente: 'Exterior', condicion: 'Con pintura deteriorada', colorAcabado: 'Brillante' },
    zona: 'Metal o reja',
    descripcion: 'La reja del balcón tiene óxido y la pintura se está levantando en varias partes.',
    fotos: [
      { id: '1583147247199-0bb8ce3d7f2f', nombre: 'reja-balcon-1.jpg', medidas: { oxido: 0.216, moho: 0.033, descascarado: 0.59, rugosidad: 0.83 } },
      { id: '1612058237353-6213b412a1c4', nombre: 'reja-balcon-2.jpg', medidas: { oxido: 0.152, descascarado: 0.195, rugosidad: 0.36, juntas: 12 } },
    ],
  }),
  crear({
    id: 'CL-1003',
    propietario: 'carlos@colorlink.com',
    fecha: '2026-10-12',
    estado: 'En abastecimiento',
    cliente: 'Carlos Restrepo',
    nit: '71234567-8',
    responsable: 'Carlos Restrepo',
    canal: 'WhatsApp',
    ciudad: 'Medellín',
    tipoObra: 'Vivienda',
    area: '45',
    requerida: '2026-11-25',
    tecnica: { superficie: 'Fachada', ambiente: 'Exterior', condicion: 'Con grietas', colorAcabado: 'Satinado' },
    zona: 'Fachada',
    descripcion: 'Una grieta vertical sube por la fachada y la pintura se está cayendo alrededor de la grieta.',
    fotos: [{ id: '1546816077-623b4eaab352', nombre: 'fachada-grieta.jpg', medidas: { humedad: 0.096, grietas: 0.93, oxido: 0.017, descascarado: 0.013, rugosidad: 0.08, brillo: 150 } }],
    asignadoA: 'Andrés Moreno',
    notas: [
      { autor: 'Andrés Moreno', texto: 'La grieta es fina, no hay desnivel. Se aprueba masilla elastomérica + Koraza. Pedido en camino.', fecha: '2026-10-16T10:05:00Z' },
    ],
  }),
  crear({
    id: 'CL-1002',
    propietario: 'laura@colorlink.com',
    fecha: '2026-10-02',
    estado: 'Solución propuesta',
    cliente: 'Laura Polo',
    nit: '1020345678',
    responsable: 'Laura Polo',
    ciudad: 'Bogotá',
    tipoObra: 'Vivienda',
    area: '18',
    requerida: '2026-11-10',
    tecnica: { superficie: 'Interior', ambiente: 'Interior húmedo', condicion: 'Con humedad', colorAcabado: 'Mate' },
    zona: 'Techo',
    descripcion: 'Mancha de humedad en la esquina del techo del baño; la pintura se levanta y gotea cuando llueve fuerte.',
    fotos: [{ id: '1637847522219-ef24dd4445fe', nombre: 'techo-bano.jpg', medidas: { moho: 0.117, oxido: 0.041, descascarado: 0.222, grietas: 1.8, rugosidad: 0.5, brillo: 110 } }],
    asignadoA: 'Camila Vargas',
    notas: [
      { autor: 'Camila Vargas', texto: 'Hay que revisar la terraza del piso de arriba antes de pintar: probablemente la filtración viene de ahí.', fecha: '2026-10-05T16:40:00Z' },
      { autor: 'Camila Vargas', texto: 'La administración confirmó que repararán la impermeabilización la próxima semana.', fecha: '2026-10-14T09:15:00Z' },
    ],
  }),
  original,
]
