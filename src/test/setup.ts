import '@testing-library/jest-dom/vitest'

/**
 * Node 22+ expone un `localStorage` nativo experimental que puede pisar el
 * de jsdom en el entorno de pruebas (y no implementa `.clear()` de forma
 * fiable aquí). Se reemplaza por un mock simple en memoria para que el
 * repositorio (que usa localStorage real) sea testeable de forma determinista.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new MemoryStorage(),
  writable: true,
})
