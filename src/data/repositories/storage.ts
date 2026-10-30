/**
 * Wrapper mínimo sobre localStorage con versión de esquema.
 * Si el formato guardado no coincide con la versión esperada (por un cambio
 * de forma en los datos durante el desarrollo), se descarta en vez de romper
 * la app — mantiene el localStorage como una caché, no como fuente de verdad
 * permanente.
 */
interface Envelope<T> {
  version: number
  data: T
}

export function readStorage<T>(key: string, version: number): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Envelope<T>
    if (parsed.version !== version) return null
    return parsed.data
  } catch {
    return null
  }
}

/** Devuelve false si no se pudo guardar (almacenamiento lleno o bloqueado). */
export function writeStorage<T>(key: string, version: number, data: T): boolean {
  try {
    const envelope: Envelope<T> = { version, data }
    window.localStorage.setItem(key, JSON.stringify(envelope))
    return true
  } catch {
    // localStorage puede fallar en modo privado o si está lleno; la app
    // sigue funcionando en memoria para esa sesión.
    return false
  }
}

export function clearStorage(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // no-op
  }
}
