import type { Solicitud } from '@/domain/solicitud/types'

export const solicitudesIniciales: Solicitud[] = [
  {
    id: 'CL-1001',
    fechaSolicitud: '2026-08-15',
    estado: 'En análisis',
    historialEstados: [
      { estado: 'Recibida', fecha: '2026-08-15' },
      { estado: 'En análisis', fecha: '2026-08-16' },
    ],
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
      },
    },
    recomendacion: {
      tipoSolucion: 'Sistema de recubrimiento para exterior',
      producto: 'Recubrimiento acrílico de alta resistencia climática',
      acabado: 'Satinado',
      cantidadEstimada: '8 unidades (aprox. 120 m²)',
      aplicacion: '2 capas',
      tiempoEstimado: '3 a 4 días',
      advertencias: [],
      estadoTexto: 'Recomendación preliminar',
    },
  },
]
