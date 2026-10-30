/** Minúsculas y sin tildes, para comparar palabras sin importar cómo se escriban. */
export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/²/g, '2')
}
