import { describe, it, expect } from 'vitest'
import { generarRespuestaChat } from './asistenteVirtual'
import type { Pedido } from '@/domain/tienda/types'

const pedidoDemo: Pedido = {
  id: 'PED-1001',
  clienteNombre: 'Laura Polo',
  clienteEmail: 'laura@colorlink.com',
  items: [{ productoId: 1, nombre: 'Viniltex', precioUnitario: 145900, cantidad: 1 }],
  total: 145900,
  estado: 'Recibido',
  fecha: '2026-01-10',
}

describe('generarRespuestaChat', () => {
  it('saluda con el nombre cuando se provee', () => {
    expect(generarRespuestaChat('hola', [], 'Laura Polo').texto).toContain('LAURA')
  })

  it('reporta el estado del pedido más reciente', () => {
    expect(generarRespuestaChat('¿dónde va mi pedido?', [pedidoDemo]).texto).toContain('PED-1001')
  })

  it('avisa cuando no hay pedidos asociados', () => {
    expect(generarRespuestaChat('dónde va mi pedido', []).ruta).toBe('/catalogo')
  })

  it('reconoce fachada exterior y sugiere Koraza', () => {
    expect(generarRespuestaChat('tengo una fachada exterior con fisuras').texto).toContain('Koraza')
  })

  it('reconoce humedad y sugiere Aquablock', () => {
    expect(generarRespuestaChat('hay humedad y moho en el muro').texto).toContain('Aquablock')
  })

  it('reconoce óxido y sugiere Pintulux', () => {
    expect(generarRespuestaChat('las rejas están oxidadas').texto).toContain('Pintulux')
  })

  it('reconoce preguntas de precio y enruta al catálogo', () => {
    expect(generarRespuestaChat('cuánto cuesta').ruta).toBe('/catalogo')
  })

  it('responde con un mensaje genérico ante un mensaje sin palabras clave', () => {
    expect(generarRespuestaChat('xyz123').texto.length).toBeGreaterThan(0)
  })
})
