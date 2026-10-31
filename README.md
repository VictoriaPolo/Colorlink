# COLORLINK

Distribuidor digital oficial de Pintuco: **diagnostica el problema de una pared, techo o piso a
partir de una foto**, recomienda la solución con productos del catálogo, vende en línea con retiro
en tienda y le da al equipo una consola para atender cada solicitud.

## Qué incluye

- **Diagnóstico por imagen**: el cliente elige la zona, describe el problema y sube fotos; la app
  detecta moho, humedad, fisuras, óxido o pintura descascarada, estima la gravedad y la confianza,
  resalta las zonas en la foto y propone el paso a paso con productos del catálogo. El resumen se
  descarga en PDF, con las fotos marcadas.
- **Tienda**: catálogo, kits por patología, calculadora de pintura, simulador de color y carrito
  con cupones y retiro en tienda.
- **Pago de práctica**: con tarjeta de prueba, PSE, Nequi o al retirar (no se cobra dinero real ni
  se guarda la tarjeta). El cliente **rastrea su pedido** paso a paso, con su código de retiro y
  comprobante en PDF.
- **Cuentas**: registro e inicio de sesión con correo, Google o Facebook.
- **Consola del equipo** (`/admin`): resumen con indicadores, tablero de solicitudes por etapa,
  detalle con fotos y diagnóstico, asignación, notas internas, pedidos (con su pago: cobrar y
  reembolsar) y clientes.
- **Coli**, un asistente de voz y texto que responde con los pedidos y solicitudes del cliente.
  Habla con la mejor voz que tenga el navegador (con Microsoft Edge, voces naturales como la de
  Gonzalo, de Colombia) y se elige entre el tono natural y el de JARVIS.

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
botones de Google y Facebook abren la ventana real de cada uno (la lista de cuentas) cuando el sitio
tiene su identificador o usa Supabase; sin ninguno abren un diálogo marcado como modo demostración.
Cómo activarlos: [`docs/CUENTAS_SOCIALES.md`](docs/CUENTAS_SOCIALES.md).

### Para probar un pago

Elige "Usar" en la lista de tarjetas de prueba del formulario, o escribe una a mano: `4242 4242 4242
4242` se aprueba (Visa; con Mastercard `5555 5555 5555 4444`), `4000 0000 0000 0002` la rechaza el
banco, `4000 0000 0000 9995` no tiene fondos. Con cualquier fecha futura y cualquier código de 3
números. Cupones: `BIENVENIDA10`, `COLOR5` y `RETIRO20`. Las tarjetas reales se rechazan a propósito.

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
está en [`docs/SUPABASE.md`](docs/SUPABASE.md). Si ya tenías la base creada con una versión anterior,
`supabase/actualizar_base.sql` la deja al día.

Sin base de datos, **cada navegador guarda sus propios datos**: lo que alguien registra o pide desde
otro equipo no aparece en la consola del equipo. Con Supabase sí (y las cuentas de demostración se
apagan, salvo `VITE_MODO_DEMO=true`).

## Documentación

- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md): cómo está organizado el código, cómo funciona el
  diagnóstico y qué se dejó fuera a propósito.
- [`docs/SUPABASE.md`](docs/SUPABASE.md): conectar la base de datos y los proveedores de acceso.
- [`docs/CUENTAS_SOCIALES.md`](docs/CUENTAS_SOCIALES.md): activar los botones de Google y Facebook
  (sin Supabase) y ponerlos en Vercel.
- [`docs/DIAGRAMA.md`](docs/DIAGRAMA.md): el modelo relacional completo.

## Sobre el diagnóstico

Es **visión por computador clásica** (color, textura y líneas), no un modelo entrenado: orienta, no
reemplaza a un asesor. Funciona bien con daños claros y fotos nítidas, y avisa cuando duda (por
ejemplo, una mancha oscura sobre piedra rugosa puede ser suciedad). Los detalles y los números de
la prueba con fotos reales están en `docs/ARQUITECTURA.md`.
