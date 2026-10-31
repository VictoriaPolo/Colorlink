import { describe, it, expect } from 'vitest'
import { generarRespuestaChat } from './asistenteVirtual'
import type { Pedido, Producto } from '@/domain/tienda/types'
import type { Solicitud } from '@/domain/solicitud/types'

const pedidoDemo: Pedido = {
  id: 'PED-1001',
  clienteNombre: 'Laura Polo',
  clienteEmail: 'laura@colorlink.com',
  items: [{ productoId: 1, nombre: 'Viniltex', precioUnitario: 145900, cantidad: 1 }],
  total: 145900,
  estado: 'Recibido',
  fecha: '2026-01-10',
}

const producto = (id: number, nombre: string, precio: number, rendimientoM2PorGalon: number, descripcion: string): Producto => ({
  id,
  nombre,
  categoria: 'Interiores',
  descripcion,
  precio,
  unidadMedida: 'Galón',
  destacado: false,
  badge: null,
  rendimientoM2PorGalon,
})

const productos: Producto[] = [
  producto(1, 'Viniltex', 145900, 30, 'Pintura vinílica de interior.'),
  producto(2, 'Koraza 5 Años Protección Total', 142900, 22, 'Pintura elastomérica exterior.'),
  producto(4, 'Pintulux 3 en 1 Anticorrosivo + Esmalte', 124900, 28, 'Para metal oxidado.'),
  producto(8, 'Viniltex Multiuso', 79900, 30, 'Pintura multipropósito.'),
]

const solicitudDemo = {
  id: 'CL-1001',
  estado: 'En análisis',
  data: { proyecto: { tipoObra: 'Edificio', ciudad: 'Bogotá' } },
  recomendacion: { producto: 'Koraza 5 Años Protección Total' },
} as unknown as Solicitud

describe('generarRespuestaChat', () => {
  it('saluda con el nombre cuando se provee', () => {
    expect(generarRespuestaChat('hola', { nombreUsuario: 'Laura Polo' }).texto).toContain('LAURA')
  })

  it('reporta el estado del pedido más reciente', () => {
    expect(generarRespuestaChat('¿dónde va mi pedido?', { pedidos: [pedidoDemo] }).texto).toContain('PED-1001')
  })

  it('cuenta los productos del pedido en singular o plural', () => {
    const dos = { ...pedidoDemo, items: [...pedidoDemo.items, { productoId: 2, nombre: 'Koraza', precioUnitario: 142900, cantidad: 1 }] }
    expect(generarRespuestaChat('¿dónde va mi pedido?', { pedidos: [pedidoDemo] }).texto).toContain('1 producto por')
    expect(generarRespuestaChat('¿dónde va mi pedido?', { pedidos: [dos] }).texto).toContain('2 productos por')
  })

  it('avisa cuando no hay pedidos asociados', () => {
    expect(generarRespuestaChat('dónde va mi pedido').ruta).toBe('/catalogo')
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

  it('orienta cuando preguntan qué pintura usar', () => {
    const respuesta = generarRespuestaChat('¿Qué pintura uso?')
    expect(respuesta.fueraDeAlcance).toBeUndefined()
    expect(respuesta.texto).toContain('fachada')
  })
})

describe('generarRespuestaChat — responde con los datos reales', () => {
  it('da el precio y el rendimiento del producto que se nombra', () => {
    const respuesta = generarRespuestaChat('¿Cuánto cuesta el Koraza?', { productos })
    expect(respuesta.texto).toContain('142.900')
    expect(respuesta.ruta).toBe('/catalogo?q=Koraza%205%20A%C3%B1os%20Protecci%C3%B3n%20Total')
    expect(generarRespuestaChat('¿Cuánto rinde un galón de Viniltex?', { productos }).texto).toContain('30 m²')
  })

  it('distingue Viniltex de Viniltex Multiuso', () => {
    expect(generarRespuestaChat('¿qué es el viniltex multiuso?', { productos }).texto).toMatch(/^Viniltex Multiuso:/)
  })

  it('compara dos productos y corrige la superficie equivocada', () => {
    expect(generarRespuestaChat('¿Diferencia entre Viniltex y Koraza?', { productos }).texto).toMatch(/Viniltex:.*Koraza/)
    expect(generarRespuestaChat('¿El Pintulux sirve para madera?', { productos }).texto).toContain('Para madera te recomiendo Madetec')
  })

  it('cuenta cómo va la solicitud del cliente', () => {
    const respuesta = generarRespuestaChat('¿Cómo va mi solicitud?', { solicitudes: [solicitudDemo] })
    expect(respuesta.texto).toContain('CL-1001')
    expect(respuesta.texto).toContain('paso 2 de 6')
    expect(respuesta.ruta).toBe('/mis-solicitudes/CL-1001')
  })

  it('responde las preguntas de la tienda que antes rechazaba', () => {
    const casos: [string, string][] = [
      ['¿Cómo va mi proyecto?', '/solicitar'],
      ['Quiero hablar con un asesor', '/solicitar'],
      ['Quiero una cotización', '/solicitar'],
      ['¿Cómo compro?', '/catalogo'],
      ['¿Cómo puedo pagar?', '/catalogo'],
      ['¿A qué hora abren?', '/puntos-de-retiro'],
      ['¿Hacen envíos a domicilio?', '/puntos-de-retiro'],
      ['Mi pared tiene grietas, ¿qué hago?', '/?kit=Fachada exterior'],
    ]
    for (const [pregunta, ruta] of casos) {
      const respuesta = generarRespuestaChat(pregunta)
      expect(respuesta.fueraDeAlcance, pregunta).toBeUndefined()
      expect(respuesta.ruta, pregunta).toBe(ruta)
    }
    expect(generarRespuestaChat('¿Tienen descuentos?').texto).toContain('15%')
    expect(generarRespuestaChat('¿Qué garantía tienen las pinturas?').texto).toContain('garantía')
  })
})

describe('generarRespuestaChat — solo temas de COLORLINK', () => {
  it('rechaza preguntas de fútbol', () => {
    expect(generarRespuestaChat('¿Quién ganó el partido de fútbol ayer?').fueraDeAlcance).toBe(true)
    expect(generarRespuestaChat('¿A qué hora juega Colombia?').fueraDeAlcance).toBe(true)
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
