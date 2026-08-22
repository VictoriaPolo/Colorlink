import { describe, it, expect } from 'vitest'
import { identificacionSchema, proyectoSchema, tecnicaSchema, evidenciaSchema } from './schemas'

describe('identificacionSchema', () => {
  it('rechaza campos vacíos', () => {
    const resultado = identificacionSchema.safeParse({ cliente: '', nit: '', responsable: '', canal: '' })
    expect(resultado.success).toBe(false)
  })

  it('acepta datos completos y válidos', () => {
    const resultado = identificacionSchema.safeParse({
      cliente: 'Constructora X',
      nit: '900123456-7',
      responsable: 'Laura',
      canal: 'WhatsApp',
    })
    expect(resultado.success).toBe(true)
  })
})

describe('proyectoSchema', () => {
  it('rechaza un área menor o igual a cero', () => {
    const resultado = proyectoSchema.safeParse({
      ciudad: 'Bogotá',
      tipoObra: 'Vivienda',
      areaAprox: '0',
      fechaRequerida: '2099-01-01',
    })
    expect(resultado.success).toBe(false)
  })

  it('rechaza una fecha requerida en el pasado', () => {
    const resultado = proyectoSchema.safeParse({
      ciudad: 'Bogotá',
      tipoObra: 'Vivienda',
      areaAprox: '50',
      fechaRequerida: '2000-01-01',
    })
    expect(resultado.success).toBe(false)
  })

  it('acepta un proyecto válido', () => {
    const resultado = proyectoSchema.safeParse({
      ciudad: 'Medellín',
      tipoObra: 'Edificio',
      areaAprox: '85',
      fechaRequerida: '2099-01-01',
    })
    expect(resultado.success).toBe(true)
  })
})

describe('tecnicaSchema', () => {
  it('rechaza valores fuera del enum permitido', () => {
    const resultado = tecnicaSchema.safeParse({
      superficie: 'Cualquiera',
      ambiente: 'Interior seco',
      condicion: 'Nueva',
      colorAcabado: 'Mate',
    })
    expect(resultado.success).toBe(false)
  })
})

describe('evidenciaSchema', () => {
  it('requiere el consentimiento explícito (true)', () => {
    const resultado = evidenciaSchema.safeParse({
      descripcion: 'Necesito pintar mi fachada',
      observaciones: '',
      imagenes: [],
      consentimiento: false,
    })
    expect(resultado.success).toBe(false)
  })

  it('acepta evidencia válida con consentimiento aceptado', () => {
    const resultado = evidenciaSchema.safeParse({
      descripcion: 'Necesito pintar mi fachada',
      observaciones: '',
      imagenes: [],
      consentimiento: true,
    })
    expect(resultado.success).toBe(true)
  })
})
