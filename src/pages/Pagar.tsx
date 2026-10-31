import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, FlaskConical, Lock } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import Stepper from '@/shared/ui/Stepper'
import { useToast } from '@/shared/lib/toast'
import { useTitulo } from '@/shared/lib/useTitulo'
import { formatoCOP } from '@/shared/lib/formato'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/tienda/CartContext'
import { METODOS } from '@/features/pagos/metodos'
import TarjetaVisual from '@/features/pagos/TarjetaVisual'
import FormularioTarjeta from '@/features/pagos/FormularioTarjeta'
import { FormularioPse, PantallaBanco, type TipoPersona } from '@/features/pagos/PagoPse'
import { EsperandoNequi, FormularioNequi } from '@/features/pagos/PagoNequi'
import ProcesandoPago from '@/features/pagos/ProcesandoPago'
import ResumenPedido from '@/features/pagos/ResumenPedido'
import {
  DETALLE_EFECTIVO,
  DURACION_PAGO_MS,
  celularValido,
  construirPago,
  detalleNequi,
  detallePse,
  detalleTarjeta,
  esperar,
  pagarConNequi,
  pagarConPse,
  pagarConTarjeta,
  referenciaPago,
  type SalidaPasarela,
} from '@/domain/pagos/pasarela'
import { validarTarjeta, type DatosTarjeta, type ErroresTarjeta } from '@/domain/pagos/tarjeta'
import type { MetodoPago } from '@/domain/pagos/tipos'

type Fase = { tipo: 'formulario' } | { tipo: 'procesando'; titulo: string } | { tipo: 'banco' } | { tipo: 'nequi' }

const TARJETA_VACIA: DatosTarjeta = { numero: '', titular: '', vencimiento: '', cvv: '' }
const PASOS = [{ label: 'Carrito' }, { label: 'Pago' }, { label: 'Confirmación' }]

/**
 * El pago de un pedido, con una pasarela de práctica: tarjeta, PSE, Nequi o al retirar. Solo cuando el pago se
 * aprueba (o queda pendiente, si es al retirar) se crea el pedido; si se rechaza, se puede intentar de nuevo.
 */
export default function Pagar() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { items, totales, cupon, puntoRetiro, confirmarPedido } = useCart()
  const { mostrarToast } = useToast()
  useTitulo('Pagar tu pedido')

  const [metodo, setMetodo] = useState<MetodoPago>('tarjeta')
  const [tarjeta, setTarjeta] = useState(TARJETA_VACIA)
  const [erroresTarjeta, setErroresTarjeta] = useState<ErroresTarjeta>({})
  const [cvvEnfocado, setCvvEnfocado] = useState(false)
  const [banco, setBanco] = useState('')
  const [persona, setPersona] = useState<TipoPersona>('natural')
  const [errorBanco, setErrorBanco] = useState('')
  const [celular, setCelular] = useState('')
  const [errorCelular, setErrorCelular] = useState('')
  const [fase, setFase] = useState<Fase>({ tipo: 'formulario' })
  const [rechazo, setRechazo] = useState('')
  const [referencia] = useState(() => referenciaPago())

  // Las esperas de la pasarela terminan después de que la persona pudo irse de la página.
  const montado = useRef(true)
  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  // El botón de pagar queda abajo y el aviso arriba: al rechazarse el pago se lleva la vista hasta el motivo.
  const avisoRechazo = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (rechazo) avisoRechazo.current?.scrollIntoView?.({ block: 'center' })
  }, [rechazo])

  // Al crearse el pedido el carrito se vacía: no es un carrito vacío cualquiera, no hay que devolver a la persona.
  const [creandoPedido, setCreandoPedido] = useState(false)
  if (items.length === 0 && !creandoPedido) return <Navigate to="/carrito" replace />

  const monto = totales.total
  const nombre = usuario?.nombre ?? 'Cliente'

  /** Cierra el intento: un rechazo vuelve al formulario con el motivo; lo demás crea el pedido y lleva a su seguimiento. */
  const terminar = async (detalle: string, salida?: SalidaPasarela) => {
    if (!montado.current) return
    const pago = construirPago({ metodo, monto, detalle, salida, referencia })
    if (pago.estado === 'Rechazado') {
      setRechazo(pago.motivo ?? 'No se pudo completar el pago.')
      setFase({ tipo: 'formulario' })
      return
    }
    setCreandoPedido(true)
    try {
      const pedido = await confirmarPedido(nombre, usuario?.email ?? '', pago)
      if (montado.current) navigate(`/pedidos/${pedido.id}?nuevo=1`, { replace: true })
    } catch {
      setCreandoPedido(false)
      mostrarToast(`El pago quedó registrado (${pago.referencia}), pero no pudimos crear el pedido. Inténtalo de nuevo.`, 'error')
      if (montado.current) setFase({ tipo: 'formulario' })
    }
  }

  const pagar = async () => {
    setRechazo('')
    if (metodo === 'tarjeta') {
      const errores = validarTarjeta(tarjeta)
      setErroresTarjeta(errores)
      if (Object.keys(errores).length > 0) return
      setFase({ tipo: 'procesando', titulo: 'Procesando tu pago' })
      await esperar(DURACION_PAGO_MS.tarjeta)
      return terminar(detalleTarjeta(tarjeta.numero), pagarConTarjeta(tarjeta.numero))
    }
    if (metodo === 'pse') {
      if (!banco) return setErrorBanco('Elige tu banco para continuar.')
      setErrorBanco('')
      setFase({ tipo: 'procesando', titulo: 'Conectando con tu banco' })
      await esperar(DURACION_PAGO_MS.pse)
      if (montado.current) setFase({ tipo: 'banco' })
      return
    }
    if (metodo === 'nequi') {
      if (!celularValido(celular)) return setErrorCelular('Escribe un celular colombiano de 10 dígitos que empiece por 3.')
      setErrorCelular('')
      setFase({ tipo: 'nequi' })
      return
    }
    setFase({ tipo: 'procesando', titulo: 'Registrando tu pedido' })
    await esperar(DURACION_PAGO_MS.efectivo)
    return terminar(DETALLE_EFECTIVO)
  }

  const resolverPse = async (autoriza: boolean) => {
    if (!autoriza) return terminar(detallePse(banco), pagarConPse('cancelar'))
    setFase({ tipo: 'procesando', titulo: 'Confirmando con tu banco' })
    await esperar(DURACION_PAGO_MS.pse)
    return terminar(detallePse(banco), pagarConPse('autorizar'))
  }

  const resolverNequi = async (decision: 'aprobar' | 'rechazar' | 'vencer') => {
    if (decision !== 'aprobar') return terminar(detalleNequi(celular), pagarConNequi(decision))
    setFase({ tipo: 'procesando', titulo: 'Confirmando con Nequi' })
    await esperar(DURACION_PAGO_MS.nequi)
    return terminar(detalleNequi(celular), pagarConNequi('aprobar'))
  }

  const textoBoton =
    metodo === 'efectivo' ? 'Confirmar pedido' : metodo === 'pse' ? 'Ir a mi banco' : metodo === 'nequi' ? 'Pagar con Nequi' : `Pagar ${formatoCOP.format(monto)}`

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/carrito" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Volver al carrito
      </Link>
      <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Pagar tu pedido</h1>
      <div className="mx-auto mt-5 max-w-xl">
        <Stepper steps={PASOS} currentStep={2} />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <FlaskConical size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          <strong>Pasarela de práctica.</strong> Esto es una simulación: no se cobra dinero real y no se guardan datos de tarjetas. Usa los datos de prueba que te mostramos.
        </p>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-5">
          {rechazo && (
            <div ref={avisoRechazo} role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold">No se pudo completar el pago</p>
                <p className="mt-0.5">{rechazo} Puedes intentarlo otra vez o elegir otro medio de pago.</p>
              </div>
            </div>
          )}

          {fase.tipo === 'banco' ? (
            <PantallaBanco banco={banco} monto={monto} referencia={referencia} onAutorizar={() => resolverPse(true)} onCancelar={() => resolverPse(false)} />
          ) : fase.tipo === 'nequi' ? (
            <EsperandoNequi
              celular={celular}
              monto={monto}
              onAprobar={() => resolverNequi('aprobar')}
              onRechazar={() => resolverNequi('rechazar')}
              onVencer={() => resolverNequi('vencer')}
            />
          ) : (
            <>
              <fieldset>
                <legend className="mb-2 text-sm font-bold text-navy">Elige cómo pagar</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {METODOS.map(({ id, nombre: etiqueta, descripcion, Icono }) => (
                    <label key={id} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="metodo-de-pago"
                        value={id}
                        checked={metodo === id}
                        onChange={() => {
                          setMetodo(id)
                          setRechazo('')
                        }}
                        className="peer sr-only"
                      />
                      <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-colors peer-checked:border-primary peer-checked:bg-brand-50 peer-checked:ring-4 peer-checked:ring-brand-100 peer-focus-visible:ring-4 peer-focus-visible:ring-primary/40 hover:border-primary/50">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-primary" aria-hidden="true">
                          <Icono size={19} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-navy">{etiqueta}</span>
                          <span className="block text-xs text-slate-500">{descripcion}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Card className="p-5 sm:p-6">
                {metodo === 'tarjeta' && (
                  <div className="flex flex-col gap-6">
                    <TarjetaVisual numero={tarjeta.numero} titular={tarjeta.titular} vencimiento={tarjeta.vencimiento} cvv={tarjeta.cvv} volteada={cvvEnfocado} />
                    <FormularioTarjeta
                      datos={tarjeta}
                      errores={erroresTarjeta}
                      onChange={(cambio) => setTarjeta((t) => ({ ...t, ...cambio }))}
                      onCvv={setCvvEnfocado}
                      titularSugerido={nombre}
                    />
                  </div>
                )}
                {metodo === 'pse' && <FormularioPse banco={banco} onBanco={setBanco} persona={persona} onPersona={setPersona} error={errorBanco} />}
                {metodo === 'nequi' && <FormularioNequi celular={celular} onCelular={setCelular} error={errorCelular} />}
                {metodo === 'efectivo' && (
                  <p className="text-sm leading-relaxed text-body">
                    Reservamos tu pedido y lo pagas cuando lo retires en <strong className="text-navy">{puntoRetiro.nombre}</strong>, con efectivo o datáfono. Queda <strong className="text-navy">pendiente de pago</strong>
                    {' '}hasta ese momento.
                  </p>
                )}

                <Button className="mt-6" size="lg" fullWidth icon={<Lock size={17} />} onClick={pagar}>
                  {textoBoton}
                </Button>
              </Card>
            </>
          )}
        </div>

        <ResumenPedido totales={totales} cupon={cupon?.codigo} puntoRetiro={puntoRetiro} items={items} />
      </div>

      {fase.tipo === 'procesando' && <ProcesandoPago titulo={fase.titulo} />}
    </div>
  )
}
