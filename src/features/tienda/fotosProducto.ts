/** Foto real por producto (Unsplash, licencia gratuita de uso comercial, sin
 * atribución requerida), elegida según el uso de cada línea. */
const FOTO_POR_PRODUCTO: Record<number, string> = {
  1: 'photo-1693985120993-e9b203ce7631', // Viniltex — rodillo sobre muro blanco
  2: 'photo-1647579350449-37960d792a05', // Koraza — fachada de casa
  3: 'photo-1635424709845-3a85ad5e1f5e', // Aquablock — impermeabilización de cubierta
  4: 'photo-1583147247730-0ffa2ee86d72', // Pintulux — metal oxidado
  5: 'photo-1669027108349-a9bea2bec1d5', // Masilla Elastomérica — muro fisurado
  6: 'photo-1599651993975-30a482e26467', // Madetec — barnizado de madera
  7: 'photo-1584184200374-73d7f6c6a175', // Vinilico Concreto — muro de concreto
  8: 'photo-1585676737728-432f58d5fdba', // Viniltex Multiuso — rodillo y galón
}

export function fotoProducto(id: number, ancho: number, alto: number): string {
  const foto = FOTO_POR_PRODUCTO[id] ?? FOTO_POR_PRODUCTO[8]
  return `https://images.unsplash.com/${foto}?auto=format&fit=crop&w=${ancho}&h=${alto}&q=80`
}
