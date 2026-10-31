const KEY = 'colorlink:identidad-equipo'

/**
 * Con qué nombre quedan firmadas las notas y asignaciones de quien está
 * usando la cuenta compartida del equipo (ver el selector "Actuando como"
 * en AdminLayout) — sin esto, toda acción queda firmada con el nombre de la
 * cuenta demo, sin importar quién la esté usando de verdad.
 */
export function leerIdentidad(porDefecto: string): string {
  try {
    return localStorage.getItem(KEY) || porDefecto
  } catch {
    return porDefecto
  }
}

export function guardarIdentidad(nombre: string): void {
  try {
    localStorage.setItem(KEY, nombre)
  } catch {
    // localStorage puede fallar en modo privado; la identidad sigue
    // funcionando solo en memoria para esa sesión.
  }
}
