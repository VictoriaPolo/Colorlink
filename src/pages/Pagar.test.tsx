import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import Pagar from './Pagar'
import { AuthProvider } from '@/features/auth/AuthContext'
import RequireAuth from '@/features/auth/RequireAuth'
import { CartProvider } from '@/features/tienda/CartContext'
import { ToastProvider } from '@/shared/ui/Toaster'
import { tiendaRepositoryLocal as repo } from '@/data/repositories/tiendaRepository.local'

const CORREO = 'laura@colorlink.com'
const CARRITO = [{ productoId: 1, nombre: 'Viniltex · Galón (3.78 L)', precioUnitario: 100_000, cantidad: 2 }]

function sembrar({ carrito = true } = {}) {
  window.localStorage.clear()
  window.localStorage.setItem(
    'colorlink:sesion',
    JSON.stringify({ version: 1, data: { id: 'usr-1', nombre: 'Laura Polo', email: CORREO, rol: 'cliente', proveedor: 'correo', demo: true } }),
  )
  if (carrito) window.localStorage.setItem('colorlink:carrito', JSON.stringify({ version: 1, data: CARRITO }))
}

/** Todo lo que quedó guardado en el navegador, como un solo texto. */
function volcado() {
  const partes: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const clave = window.localStorage.key(i)!
    partes.push(`${clave}=${window.localStorage.getItem(clave)}`)
  }
  return partes.join('\n')
}

const pedidosDeLaura = () => repo.listarPedidosPorEmail(CORREO)

function PedidoCreado() {
  const { id } = useParams()
  return <p>Pedido creado {id}</p>
}

function renderPagar() {
  return render(
    <MemoryRouter initialEntries={['/pagar']}>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              <Route path="/pagar" element={<RequireAuth rol="cliente"><Pagar /></RequireAuth>} />
              <Route path="/carrito" element={<p>Pantalla del carrito</p>} />
              <Route path="/pedidos/:id" element={<PedidoCreado />} />
              <Route path="/login" element={<p>Pantalla de ingreso</p>} />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

// Hasta que se restaura la sesión la página no se dibuja: por eso se espera el botón en vez de buscarlo ya.
const usarTarjeta = async (numero: string) =>
  userEvent.click(await screen.findByRole('button', { name: new RegExp(`usar la tarjeta de prueba ${numero}`, 'i') }))
const pagar = () => userEvent.click(screen.getByRole('button', { name: /^pagar/i }))
// La pasarela de práctica espera de verdad (como una real): hasta ~2,4 s por pago.
const LARGO = { timeout: 7000 }

beforeEach(() => sembrar())

describe('Pagar — la pasarela de práctica', () => {
  it('sin productos en el carrito vuelve al carrito', async () => {
    sembrar({ carrito: false })
    renderPagar()
    expect(await screen.findByText('Pantalla del carrito')).toBeInTheDocument()
  })

  it('con una tarjeta de prueba aprobada crea el pedido pagado, vacía el carrito y no guarda la tarjeta', async () => {
    renderPagar()
    await usarTarjeta('4242 4242 4242 4242')
    await pagar()

    expect(await screen.findByText(/pedido creado PED-/i, undefined, LARGO)).toBeInTheDocument()
    const [pedido] = await pedidosDeLaura()
    expect(pedido).toMatchObject({ total: 200_000, estado: 'Recibido', clienteEmail: CORREO })
    expect(pedido.pago).toMatchObject({ metodo: 'tarjeta', estado: 'Aprobado', monto: 200_000, detalle: 'Visa ···· 4242' })
    expect(pedido.codigoRetiro).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    expect(window.localStorage.getItem('colorlink:carrito')).toBeNull()

    // Del pago solo queda la marca, los últimos 4 dígitos y la referencia: nunca el número completo ni el código.
    const guardado = volcado()
    expect(guardado).not.toContain('4242424242424242')
    expect(guardado).not.toContain('4242 4242 4242 4242')
    expect(guardado.toLowerCase()).not.toContain('cvv')
  }, 15_000)

  it('si el banco rechaza la tarjeta muestra el motivo, no crea el pedido y deja el carrito', async () => {
    const antes = (await repo.listarPedidos()).length
    renderPagar()
    await usarTarjeta('4000 0000 0000 0002')
    await pagar()

    const aviso = await screen.findByRole('alert', undefined, LARGO)
    expect(aviso).toHaveTextContent('No se pudo completar el pago')
    expect(aviso).toHaveTextContent('El banco emisor rechazó la tarjeta')
    expect(screen.queryByText(/pedido creado/i)).not.toBeInTheDocument()
    expect((await repo.listarPedidos()).length).toBe(antes)
    expect(window.localStorage.getItem('colorlink:carrito')).not.toBeNull()
  }, 15_000)

  it('una tarjeta real (válida, pero que no es de prueba) se rechaza', async () => {
    const antes = (await repo.listarPedidos()).length
    const user = userEvent.setup()
    renderPagar()
    await user.type(await screen.findByLabelText(/número de la tarjeta/i), '4111111111111111')
    await user.type(screen.getByLabelText(/nombre del titular/i), 'Laura Polo')
    await user.type(screen.getByLabelText(/vencimiento/i), '1230')
    await user.type(screen.getByLabelText(/código de seguridad/i), '123')
    await user.click(screen.getByRole('button', { name: /^pagar/i }))

    expect(await screen.findByRole('alert', undefined, LARGO)).toHaveTextContent('no acepta tarjetas reales')
    expect((await repo.listarPedidos()).length).toBe(antes)
  }, 15_000)

  it('con el formulario vacío marca los campos y no procesa nada', async () => {
    renderPagar()
    await userEvent.click(await screen.findByRole('button', { name: /^pagar/i }))

    expect(await screen.findByText('Escribe el número de la tarjeta.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el nombre como aparece en la tarjeta.')).toBeInTheDocument()
    expect(screen.queryByText(/procesando tu pago/i)).not.toBeInTheDocument()
  })

  it('pagar al retirar deja el pedido con el pago pendiente', async () => {
    renderPagar()
    await userEvent.click(await screen.findByRole('radio', { name: /pagar al retirar/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(await screen.findByText(/pedido creado PED-/i, undefined, LARGO)).toBeInTheDocument()
    const [pedido] = await pedidosDeLaura()
    expect(pedido.pago).toMatchObject({ metodo: 'efectivo', estado: 'Pendiente', monto: 200_000 })
  }, 15_000)

  it('PSE: pide el banco, y al autorizar en la página del banco crea el pedido pagado', async () => {
    const user = userEvent.setup()
    renderPagar()
    await user.click(await screen.findByRole('radio', { name: /pse/i }))

    await user.click(screen.getByRole('button', { name: /ir a mi banco/i }))
    expect(await screen.findByText('Elige tu banco para continuar.')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/tu banco/i), 'Bancolombia')
    await user.click(screen.getByRole('button', { name: /ir a mi banco/i }))
    await user.click(await screen.findByRole('button', { name: /autorizar pago/i }, LARGO))

    expect(await screen.findByText(/pedido creado PED-/i, undefined, LARGO)).toBeInTheDocument()
    const [pedido] = await pedidosDeLaura()
    expect(pedido.pago).toMatchObject({ metodo: 'pse', estado: 'Aprobado', detalle: 'PSE · Bancolombia' })
  }, 20_000)

  it('PSE: si se cancela en el banco, el pago se rechaza y no hay pedido', async () => {
    const user = userEvent.setup()
    renderPagar()
    await user.click(await screen.findByRole('radio', { name: /pse/i }))
    await user.selectOptions(screen.getByLabelText(/tu banco/i), 'Davivienda')
    await user.click(screen.getByRole('button', { name: /ir a mi banco/i }))
    await user.click(await screen.findByRole('button', { name: /cancelar/i }, LARGO))

    expect(await screen.findByRole('alert')).toHaveTextContent('Cancelaste el pago')
    expect((await pedidosDeLaura()).some((p) => p.pago?.detalle === 'PSE · Davivienda')).toBe(false)
  }, 15_000)

  it('Nequi: valida el celular y, al aprobar en la app, crea el pedido sin guardar el número completo', async () => {
    const user = userEvent.setup()
    renderPagar()
    await user.click(await screen.findByRole('radio', { name: /nequi/i }))

    await user.click(screen.getByRole('button', { name: /pagar con nequi/i }))
    expect(await screen.findByText(/celular colombiano de 10 dígitos/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/celular registrado en nequi/i), '3001234567')
    await user.click(screen.getByRole('button', { name: /pagar con nequi/i }))
    await user.click(await screen.findByRole('button', { name: /aprobar en nequi/i }))

    expect(await screen.findByText(/pedido creado PED-/i, undefined, LARGO)).toBeInTheDocument()
    const [pedido] = await pedidosDeLaura()
    expect(pedido.pago).toMatchObject({ metodo: 'nequi', estado: 'Aprobado', detalle: 'Nequi ···· 4567' })
    expect(volcado()).not.toContain('3001234567')
    expect(volcado()).not.toContain('300 123 4567')
  }, 15_000)

  it('Nequi: si se rechaza el cobro en la app, no hay pedido', async () => {
    const user = userEvent.setup()
    renderPagar()
    await user.click(await screen.findByRole('radio', { name: /nequi/i }))
    await user.type(screen.getByLabelText(/celular registrado en nequi/i), '3109876543')
    await user.click(screen.getByRole('button', { name: /pagar con nequi/i }))
    await user.click(await screen.findByRole('button', { name: /^rechazar$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Cancelaste el pago')
    expect((await pedidosDeLaura()).some((p) => p.pago?.metodo === 'nequi')).toBe(false)
  }, 15_000)
})
