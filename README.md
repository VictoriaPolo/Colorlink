# COLORLINK

Distribuidor digital oficial de Pintuco: **diagnostica el problema de una pared, techo o piso a
partir de una foto**, recomienda la solución con productos del catálogo, vende en línea con retiro
en tienda y le da al equipo una consola para atender cada solicitud.

## Qué incluye

- **Diagnóstico por imagen**: el cliente elige la zona, describe el problema y sube fotos; la app
  detecta moho, humedad, fisuras, óxido o pintura descascarada, estima la gravedad y la confianza,
  resalta las zonas en la foto y propone el paso a paso con productos del catálogo.
- **Tienda**: catálogo, kits por patología, calculadora de pintura, simulador de color y carrito
  con retiro en tienda.
- **Cuentas**: registro e inicio de sesión con correo, Google o Facebook.
- **Consola del equipo** (`/admin`): resumen con indicadores, tablero de solicitudes por etapa,
  detalle con fotos y diagnóstico, asignación, notas internas, pedidos y clientes.
- **Coli**, un asistente de voz y texto que responde con los pedidos y solicitudes del cliente.

## Empezar

```bash
npm install
npm run dev
```

Sin configurar nada, la app guarda todo en el navegador (`localStorage`) y trae datos de ejemplo.
Cuentas de demostración, para probar sin registrarte:

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | `laura@colorlink.com` | `colorlink123` |
| Cliente | `carlos@colorlink.com` | `colorlink123` |
| Equipo | `admin@colorlink.com` | `admin123` |

En la pantalla de acceso también hay botones "Entrar como cliente" y "Entrar como equipo". Los
botones de Google y Facebook funcionan de verdad solo con Supabase; sin él abren un diálogo marcado
como modo demostración.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Revisa los tipos y genera la versión de producción |
| `npm run test` | Pruebas (Vitest) |
| `npm run lint` | Revisión de código (Oxlint) |

## Con una base de datos real

Copia `.env.example` a `.env.local` y pon la URL y la clave pública de tu proyecto de Supabase.
La guía paso a paso (tablas, cuentas, Google, Facebook y cómo hacer administrador a una cuenta)
está en [`docs/SUPABASE.md`](docs/SUPABASE.md).

## Documentación

- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md): cómo está organizado el código, cómo funciona el
  diagnóstico y qué se dejó fuera a propósito.
- [`docs/SUPABASE.md`](docs/SUPABASE.md): conectar la base de datos y los proveedores de acceso.
- [`docs/DIAGRAMA.md`](docs/DIAGRAMA.md): el modelo relacional completo.

## Sobre el diagnóstico

Es **visión por computador clásica** (color, textura y líneas), no un modelo entrenado: orienta, no
reemplaza a un asesor. Funciona bien con daños claros y fotos nítidas, y avisa cuando duda (por
ejemplo, una mancha oscura sobre piedra rugosa puede ser suciedad). Los detalles y los números de
la prueba con fotos reales están en `docs/ARQUITECTURA.md`.
