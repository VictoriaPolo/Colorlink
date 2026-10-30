import { describe, expect, it } from 'vitest'
import { zonaSugerida } from './zona'

describe('zonaSugerida', () => {
  it('propone la zona según la superficie', () => {
    expect(zonaSugerida({ superficie: 'Metal' })).toBe('Metal o reja')
    expect(zonaSugerida({ superficie: 'Exterior' })).toBe('Fachada')
    expect(zonaSugerida({ superficie: 'Fachada' })).toBe('Fachada')
    expect(zonaSugerida({ superficie: 'Interior' })).toBe('Pared')
    expect(zonaSugerida({ superficie: 'Concreto' })).toBe('Pared')
    expect(zonaSugerida({ superficie: '' })).toBe('Pared')
  })
})
