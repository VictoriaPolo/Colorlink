import { esc, plantillaPedido, plantillaSolicitud } from '../../supabase/functions/enviar-correo/plantillas.ts'

describe('plantillas del correo de confirmación', () => {
  it('el pedido muestra el precio de cada producto y el total, nunca NaN', () => {
    const { html, asunto } = plantillaPedido({
      id: 'PED-1008',
      items: [{ nombre: 'Vinilo Viniltex', cantidad: 2, precioUnitario: 50000 }],
      total: 100000,
      codigoRetiro: 'ABC234',
    })
    expect(asunto).toContain('PED-1008')
    expect(html).toContain('x2')
    expect(html).toContain('$100.000')
    expect(html).toContain('ABC234')
    expect(html).not.toContain('NaN')
  })

  it('un precio, cantidad o total que no sea número cuenta como 0', () => {
    const { html } = plantillaPedido({ id: 'PED-1', items: [{ nombre: 'Vinilo', cantidad: 'mucho', precio_unitario: 5 }], total: 'x' })
    expect(html).not.toContain('NaN')
    expect(html).toContain('$0')
  })

  it('escapa el HTML que viene del navegador, en el pedido y en la solicitud', () => {
    const malo = '<a href="https://malo.example">pulsa</a><script>x()</script>'
    const correos = [
      plantillaSolicitud({ id: 'CL-1', cliente: malo, tipoObra: malo, ciudad: malo }),
      plantillaPedido({ id: 'PED-1', items: [{ nombre: malo, cantidad: 1, precioUnitario: 1 }], total: 1, puntoRetiro: malo, codigoRetiro: malo }),
    ]
    for (const { html } of correos) {
      expect(html).not.toContain('<a href')
      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;a href=&quot;https://malo.example&quot;&gt;')
    }
  })

  it('acota los textos largos y tolera datos ausentes', () => {
    expect(esc('a'.repeat(500))).toHaveLength(120)
    expect(esc(undefined)).toBe('')
    expect(() => plantillaPedido({ items: [null, 'x'] })).not.toThrow()
    expect(() => plantillaSolicitud({})).not.toThrow()
  })
})
