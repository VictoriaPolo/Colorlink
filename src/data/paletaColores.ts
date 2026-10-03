export type CategoriaColor = 'Blancos y Neutros' | 'Cálidos y Tierras' | 'Azules y Frescos' | 'Verdes y Naturales' | 'Tendencias 2026'

export const CATEGORIAS_COLOR: CategoriaColor[] = [
  'Blancos y Neutros',
  'Cálidos y Tierras',
  'Azules y Frescos',
  'Verdes y Naturales',
  'Tendencias 2026',
]

export interface ColorPaleta {
  codigo: string
  nombre: string
  hex: string
  categoria: CategoriaColor
}

/** Carta de color de marca -- no depende del catálogo real de Pintuco, es una
 * muestra representativa del prototipo, organizada en las mismas categorías
 * que la referencia (colorlink-tienda.onrender.com). */
export const paletaColores: ColorPaleta[] = [
  // Blancos y Neutros
  { codigo: 'PNT-100', nombre: 'Blanco Puro', hex: '#FFFFFF', categoria: 'Blancos y Neutros' },
  { codigo: 'PNT-101', nombre: 'Blanco Nieve', hex: '#FEFEFE', categoria: 'Blancos y Neutros' },
  { codigo: 'PNT-102', nombre: 'Blanco Lino', hex: '#F7F4EE', categoria: 'Blancos y Neutros' },
  { codigo: 'PNT-103', nombre: 'Blanco Perla', hex: '#F2F0EC', categoria: 'Blancos y Neutros' },
  { codigo: 'PNT-104', nombre: 'Marfil Suave', hex: '#F1E9D8', categoria: 'Blancos y Neutros' },
  { codigo: 'PNT-105', nombre: 'Hueso Cálido', hex: '#EDE2CC', categoria: 'Blancos y Neutros' },
  { codigo: 'PNT-106', nombre: 'Gris Niebla', hex: '#E4E2DD', categoria: 'Blancos y Neutros' },
  { codigo: 'PNT-107', nombre: 'Gris Perla', hex: '#D1D5DB', categoria: 'Blancos y Neutros' },
  { codigo: 'PNT-108', nombre: 'Gris Cemento', hex: '#B8B7B3', categoria: 'Blancos y Neutros' },
  { codigo: 'PNT-109', nombre: 'Gris Grafito', hex: '#6B6B68', categoria: 'Blancos y Neutros' },

  // Cálidos y Tierras
  { codigo: 'PNT-200', nombre: 'Beige Andino', hex: '#D9C7A8', categoria: 'Cálidos y Tierras' },
  { codigo: 'PNT-201', nombre: 'Arena Clara', hex: '#E3CFAE', categoria: 'Cálidos y Tierras' },
  { codigo: 'PNT-202', nombre: 'Trigo', hex: '#D8B378', categoria: 'Cálidos y Tierras' },
  { codigo: 'PNT-203', nombre: 'Ocre Colonial', hex: '#C68A3D', categoria: 'Cálidos y Tierras' },
  { codigo: 'PNT-204', nombre: 'Terracota Cálido', hex: '#C2703D', categoria: 'Cálidos y Tierras' },
  { codigo: 'PNT-205', nombre: 'Barro Cocido', hex: '#A85B36', categoria: 'Cálidos y Tierras' },
  { codigo: 'PNT-206', nombre: 'Canela', hex: '#9C6644', categoria: 'Cálidos y Tierras' },
  { codigo: 'PNT-207', nombre: 'Chocolate', hex: '#5C3A2E', categoria: 'Cálidos y Tierras' },
  { codigo: 'PNT-208', nombre: 'Durazno Suave', hex: '#E8B499', categoria: 'Cálidos y Tierras' },
  { codigo: 'PNT-209', nombre: 'Miel', hex: '#D9A441', categoria: 'Cálidos y Tierras' },

  // Azules y Frescos
  { codigo: 'PNT-300', nombre: 'Azul Cielo', hex: '#BFDCEA', categoria: 'Azules y Frescos' },
  { codigo: 'PNT-301', nombre: 'Azul Bruma', hex: '#A9C8D6', categoria: 'Azules y Frescos' },
  { codigo: 'PNT-302', nombre: 'Turquesa', hex: '#4FB6AE', categoria: 'Azules y Frescos' },
  { codigo: 'PNT-303', nombre: 'Azul Pintuco', hex: '#2E6F9E', categoria: 'Azules y Frescos' },
  { codigo: 'PNT-304', nombre: 'Azul Índigo', hex: '#2C4870', categoria: 'Azules y Frescos' },
  { codigo: 'PNT-305', nombre: 'Azul Noche', hex: '#1F2E44', categoria: 'Azules y Frescos' },
  { codigo: 'PNT-306', nombre: 'Aguamarina', hex: '#7FCDC4', categoria: 'Azules y Frescos' },
  { codigo: 'PNT-307', nombre: 'Azul Grisáceo', hex: '#94A3B8', categoria: 'Azules y Frescos' },
  { codigo: 'PNT-308', nombre: 'Celeste Pastel', hex: '#CFE6F0', categoria: 'Azules y Frescos' },
  { codigo: 'PNT-309', nombre: 'Azul Acero', hex: '#4A6572', categoria: 'Azules y Frescos' },

  // Verdes y Naturales
  { codigo: 'PNT-400', nombre: 'Verde Menta', hex: '#C3E8D1', categoria: 'Verdes y Naturales' },
  { codigo: 'PNT-401', nombre: 'Verde Salvia', hex: '#A9BFA0', categoria: 'Verdes y Naturales' },
  { codigo: 'PNT-402', nombre: 'Verde Oliva', hex: '#7C7A48', categoria: 'Verdes y Naturales' },
  { codigo: 'PNT-403', nombre: 'Verde Musgo', hex: '#5B6B4D', categoria: 'Verdes y Naturales' },
  { codigo: 'PNT-404', nombre: 'Verde Esmeralda', hex: '#1E7A5F', categoria: 'Verdes y Naturales' },
  { codigo: 'PNT-405', nombre: 'Verde Limón', hex: '#C6D94E', categoria: 'Verdes y Naturales' },
  { codigo: 'PNT-406', nombre: 'Verde Pino', hex: '#2F4B3C', categoria: 'Verdes y Naturales' },
  { codigo: 'PNT-407', nombre: 'Verde Agua', hex: '#8FD6C4', categoria: 'Verdes y Naturales' },
  { codigo: 'PNT-408', nombre: 'Verde Bosque', hex: '#33502E', categoria: 'Verdes y Naturales' },
  { codigo: 'PNT-409', nombre: 'Verde Pistacho', hex: '#B7CF9E', categoria: 'Verdes y Naturales' },

  // Tendencias 2026
  { codigo: 'PNT-500', nombre: 'Rosa Empolvado', hex: '#F4C6D7', categoria: 'Tendencias 2026' },
  { codigo: 'PNT-501', nombre: 'Fucsia Colorlink', hex: '#EC4899', categoria: 'Tendencias 2026' },
  { codigo: 'PNT-502', nombre: 'Lila Suave', hex: '#C4B5FD', categoria: 'Tendencias 2026' },
  { codigo: 'PNT-503', nombre: 'Violeta Profundo', hex: '#7E22CE', categoria: 'Tendencias 2026' },
  { codigo: 'PNT-504', nombre: 'Coral Suave', hex: '#E5876F', categoria: 'Tendencias 2026' },
  { codigo: 'PNT-505', nombre: 'Rosa Palo', hex: '#D4A5A5', categoria: 'Tendencias 2026' },
  { codigo: 'PNT-506', nombre: 'Dorado Amanecer', hex: '#E3B54F', categoria: 'Tendencias 2026' },
  { codigo: 'PNT-507', nombre: 'Gris Lino', hex: '#DCD5C9', categoria: 'Tendencias 2026' },
  { codigo: 'PNT-508', nombre: 'Cobre Volcánico', hex: '#B5651D', categoria: 'Tendencias 2026' },
  { codigo: 'PNT-509', nombre: 'Nube Cálida', hex: '#EDE4DA', categoria: 'Tendencias 2026' },
]
