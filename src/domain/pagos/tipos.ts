export type MetodoPago = 'tarjeta' | 'pse' | 'nequi' | 'efectivo'

export type EstadoPago = 'Aprobado' | 'Pendiente' | 'Rechazado' | 'Reembolsado'

export const NOMBRE_METODO: Record<MetodoPago, string> = {
  tarjeta: 'Tarjeta',
  pse: 'PSE',
  nequi: 'Nequi',
  efectivo: 'Al retirar en tienda',
}

/** Lo que se guarda de un pago. Nunca el número completo de la tarjeta ni el código de seguridad. */
export interface Pago {
  metodo: MetodoPago
  estado: EstadoPago
  /** Referencia de la transacción, la que se le dicta al equipo: PAY-XXXXXXXX. */
  referencia: string
  monto: number
  /** Fecha y hora ISO del último cambio del pago. */
  fecha: string
  /** Cómo se pagó, listo para mostrar: "Visa ···· 4242", "PSE · Bancolombia", "Nequi ···· 1234". */
  detalle: string
  /** Por qué no se aprobó (solo si fue rechazado). */
  motivo?: string
}
