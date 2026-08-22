import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import WizardPage from './WizardPage'
import { SolicitudesProvider } from '@/features/solicitudes/context/SolicitudesContext'
import { ToastProvider } from '@/shared/ui/Toaster'

function renderWizard() {
  return render(
    <MemoryRouter>
      <SolicitudesProvider>
        <ToastProvider>
          <WizardPage />
        </ToastProvider>
      </SolicitudesProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('WizardPage — recorrido completo', () => {
  it('valida campos obligatorios antes de avanzar del paso 1', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('button', { name: /continuar/i }))

    expect(await screen.findAllByText('Este campo es obligatorio.')).not.toHaveLength(0)
  })

  it('completa los 4 pasos y llega a la pantalla de resultado con la recomendación', async () => {
    const user = userEvent.setup()
    renderWizard()

    // Paso 1 — Identificación
    await user.type(screen.getByLabelText(/^cliente/i), 'Constructora Prueba S.A.S.')
    await user.type(screen.getByLabelText(/nit/i), '900999888-1')
    await user.type(screen.getByLabelText(/responsable/i), 'Laura Polo')
    await user.selectOptions(screen.getByLabelText(/canal de entrada/i), 'WhatsApp')
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    // Paso 2 — Proyecto
    expect(await screen.findByText('Cuéntanos sobre tu proyecto')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(/ciudad/i), 'Medellín')
    await user.selectOptions(screen.getByLabelText(/tipo de obra/i), 'Vivienda')
    await user.type(screen.getByLabelText(/área aproximada/i), '85')
    fireEvent.change(screen.getByLabelText(/fecha requerida/i), { target: { value: '2099-01-01' } })
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    // Paso 3 — Información técnica
    expect(await screen.findByText('Conozcamos el espacio')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(/^superficie/i), 'Exterior')
    await user.selectOptions(screen.getByLabelText(/^ambiente/i), 'Exterior')
    await user.selectOptions(screen.getByLabelText(/condición actual/i), 'Con grietas')
    await user.selectOptions(screen.getByLabelText(/color \/ acabado/i), 'Satinado')
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    // Paso 4 — Evidencia
    expect(await screen.findByText('Muéstranos el proyecto')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/descripción/i), 'Fachada con grietas visibles.')
    await user.click(screen.getByLabelText(/he leído y acepto/i))
    await user.click(screen.getByRole('button', { name: /analizar mi solicitud/i }))

    // Procesando
    expect(await screen.findByText(/analizando tu solicitud/i)).toBeInTheDocument()

    // Resultado (la animación de "Processing" toma unos segundos reales)
    expect(
      await screen.findByText('¡Hemos analizado tu necesidad!', undefined, { timeout: 6000 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Sistema de recubrimiento para exterior')).toBeInTheDocument()
    expect(
      screen.getByText('Se recomienda validar previamente el estado de la superficie antes de aplicar el recubrimiento.'),
    ).toBeInTheDocument()
  }, 10000)

  it('persiste la nueva solicitud en localStorage tras completar el wizard', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.type(screen.getByLabelText(/^cliente/i), 'Cliente Persistencia')
    await user.type(screen.getByLabelText(/nit/i), '123')
    await user.type(screen.getByLabelText(/responsable/i), 'Alguien')
    await user.selectOptions(screen.getByLabelText(/canal de entrada/i), 'Llamada')
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await user.selectOptions(await screen.findByLabelText(/ciudad/i), 'Bogotá')
    await user.selectOptions(screen.getByLabelText(/tipo de obra/i), 'Bodega')
    await user.type(screen.getByLabelText(/área aproximada/i), '30')
    fireEvent.change(screen.getByLabelText(/fecha requerida/i), { target: { value: '2099-01-01' } })
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await user.selectOptions(await screen.findByLabelText(/^superficie/i), 'Interior')
    await user.selectOptions(screen.getByLabelText(/^ambiente/i), 'Interior seco')
    await user.selectOptions(screen.getByLabelText(/condición actual/i), 'Nueva')
    await user.selectOptions(screen.getByLabelText(/color \/ acabado/i), 'Mate')
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await user.type(await screen.findByLabelText(/descripción/i), 'Bodega nueva.')
    await user.click(screen.getByLabelText(/he leído y acepto/i))
    await user.click(screen.getByRole('button', { name: /analizar mi solicitud/i }))

    await waitFor(
      () => {
        const guardado = window.localStorage.getItem('colorlink:solicitudes')
        expect(guardado).toContain('Cliente Persistencia')
      },
      { timeout: 6000 },
    )
  }, 10000)
})
