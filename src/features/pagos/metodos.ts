import { Banknote, CreditCard, Landmark, Smartphone, type LucideIcon } from 'lucide-react'
import type { MetodoPago } from '@/domain/pagos/tipos'

export const METODOS: { id: MetodoPago; nombre: string; descripcion: string; Icono: LucideIcon }[] = [
  { id: 'tarjeta', nombre: 'Tarjeta crédito o débito', descripcion: 'Visa, Mastercard y American Express', Icono: CreditCard },
  { id: 'pse', nombre: 'PSE', descripcion: 'Débito desde tu cuenta bancaria', Icono: Landmark },
  { id: 'nequi', nombre: 'Nequi', descripcion: 'Aprueba el pago desde tu celular', Icono: Smartphone },
  { id: 'efectivo', nombre: 'Pagar al retirar', descripcion: 'Efectivo o datáfono en la tienda', Icono: Banknote },
]
