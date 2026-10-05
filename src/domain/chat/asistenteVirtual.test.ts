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

  it('ignora tildes y mayúsculas', () => {
    expect(generarRespuestaChat('TENGO HÚMEDAD EN LA PARED').texto).toContain('Aquablock')
  })

  it('pide más detalle cuando la pregunta es de la tienda pero no trae el caso', () => {
    const respuesta = generarRespuestaChat('¿Qué pintura uso?')
    expect(respuesta.fueraDeAlcance).toBeUndefined()
    expect(respuesta.texto).toContain('fachada')
  })
})

describe('generarRespuestaChat — solo temas de COLORLINK', () => {
  it('rechaza preguntas de fútbol', () => {
    expect(generarRespuestaChat('¿Quién ganó el partido de fútbol ayer?').fueraDeAlcance).toBe(true)
  })

  it('no confunde palabras compartidas ("precio", "color") con un tema de la tienda', () => {
    expect(generarRespuestaChat('¿Cuál es el precio del dólar hoy?').fueraDeAlcance).toBe(true)
    expect(generarRespuestaChat('¿De qué color es la camiseta de Messi?').fueraDeAlcance).toBe(true)
  })

  it('atiende la pregunta si habla de pintar, aunque mencione otro tema', () => {
    expect(generarRespuestaChat('Quiero pintar las líneas de una cancha de fútbol').fueraDeAlcance).toBeUndefined()
  })

  it('no responde como saludo si el saludo trae una pregunta ajena', () => {
    expect(generarRespuestaChat('Hola, ¿quién ganó el mundial?').fueraDeAlcance).toBe(true)
  })

  it('rechaza mensajes sin ninguna relación con la tienda', () => {
    expect(generarRespuestaChat('¿Qué es la fotosíntesis?').fueraDeAlcance).toBe(true)
    expect(generarRespuestaChat('xyz123').fueraDeAlcance).toBe(true)
  })
})
