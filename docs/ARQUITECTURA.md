# Arquitectura de Colorlink (frontend)

Este documento explica cómo está organizado el código y por qué, para poder presentarlo o retomarlo fácilmente.

## Alcance funcional

La aplicación cubre tres cosas:

1. La etapa **"Necesidad del cliente"** del flujo completo de Colorlink (asistente de
   solicitud con foto → diagnóstico y recomendación → seguimiento por el cliente y gestión
   por el equipo):

   ```
   Necesidad del cliente → Solución técnica → Abastecimiento → Servicio → Calidad
           ↑
      (esto es lo que existe en este frontend)
   ```

   Las otras 4 etapas están modeladas en el diagrama relacional (`docs/DIAGRAMA.md` /
   `colorlink-modelo-completo.drawio`) pero **no** tienen pantallas propias: el equipo hace
   avanzar el estado de la solicitud a través de ellas.

2. Una **tienda** (`domain/tienda/`, ver más abajo) donde COLORLINK opera como
   distribuidor digital oficial de Pintuco: catálogo, kits de solución por patología,
   calculadora de pintura, simulador de color y carrito de compra — con la identidad de
   Pintuco (azul `#004f9f`, azul marino `#0a2540` y amarillo `#ffd100`).

3. **Cuentas**: registro e inicio de sesión con correo, Google o Facebook, y dos roles
   (cliente y equipo) con vistas separadas.

## Capas

```
src/
  app/            Composición: providers globales, rutas, layout raíz (App.tsx)
  pages/          Componentes de ruta — delgados, solo orquestan features
    admin/        Consola del equipo: AdminLayout (barra lateral) + resumen, solicitudes,
                  detalle, pedidos y clientes
  features/
    solicitudes/  Todo lo específico del dominio "solicitud": asistente de 5 pasos, contexto
                  de estado, bloques compartidos del detalle (cliente y equipo)
    diagnostico/  Diagnóstico por imagen en pantalla: compresión y lectura de la foto, hook
                  de análisis en vivo, foto con zonas resaltadas e informe del diagnóstico
    admin/        Piezas de la consola: tarjetas de indicadores, chips de prioridad y problema
    tienda/       Carrito (CartContext), tarjeta de producto, ventana de compra, selector de
                  kits, buscador con sugerencias
    chat/         Widget del asistente virtual "Coli" (solo clientes): dictado por voz,
                  respuestas leídas en voz alta y llamada de voz manos libres con avatar
                  animado (Web Speech API, sin librerías ni proveedor externo)
    auth/         Inicio de sesión y registro (una sola pantalla), botones de Google y
                  Facebook, sesión, ruta protegida
  domain/
    solicitud/    Reglas de negocio puras: tipos, motor de recomendación, máquina de estados,
                  validaciones (zod), visibilidad por dueño, prioridad y filtros del panel,
                  resumen del equipo — sin dependencias de React
    diagnostico/  El diagnóstico: análisis de píxeles (visión por computador clásica) y
                  reglas que lo combinan con lo que cuenta el cliente
    tienda/       Tipos de la tienda (Producto, Kit, Pedido), calculadora de pintura,
                  precios por presentación y búsqueda en el catálogo
    chat/         Respuestas del asistente con los datos del cliente (pedidos, solicitudes,
                  catálogo) por palabras clave; solo atiende temas de la
                  tienda y rechaza lo demás (fútbol, política, etc.)
  data/
    solicitudesSemilla.ts Solicitudes de ejemplo (con fotos, diagnóstico y notas del equipo)
    paletaColores.ts      Paleta de marca fija para el simulador de color
    puntosDeRetiro.ts     Puntos de retiro físicos (contenido estático)
    supabaseClient.ts     Cliente de Supabase, o null si no hay credenciales (.env.local)
    repositories/        Acceso a datos detrás de una interfaz estable
                         (SolicitudesRepository, TiendaRepository, AuthRepository)
  shared/
    ui/           Componentes de interfaz reutilizables (Button, Card, Badge, Toaster...)
    brand/        Logo, franja de colores y abanico de muestras: la firma visual del proyecto
    layout/       Header y Footer de la tienda
    lib/          Utilidades transversales (toasts, formato de pesos y fechas)
```

**Regla de dependencia:** `domain/` no importa de `features/` ni de `pages/` — es lógica
de negocio aislada y testeable sin React. `data/repositories/` depende de `domain/` (para
tipos y reglas), no al revés. `features/` orquesta `domain/` + `data/` + `shared/ui/` para
construir pantallas. `pages/` solo renderiza una `feature`.

Todos los imports usan el alias `@/` (configurado en `vite.config.ts` y `tsconfig.app.json`)
en vez de rutas relativas largas (`../../../`).

## Piezas y qué reemplazan

| Pieza | Reemplaza | Por qué |
|---|---|---|
| `data/repositories/*Repository.ts` (+ `.local.ts` / `.supabase.ts`) | Lógica de guardado inline en el Context | Persiste en Supabase si hay credenciales (`docs/SUPABASE.md`), o en `localStorage` si no — mismo contrato async para el resto de la app |
| `domain/solicitud/estadoMachine.ts` | Mapeo fijo estado→etapa repetido en 2 pantallas | Única fuente de verdad para las transiciones válidas y el historial de fechas |
| `domain/solicitud/schemas.ts` (zod) | Funciones `validateStep` con `if` sueltos | Reglas de validación centralizadas y reusables |
| `domain/solicitud/visibilidad.ts` | Todas las solicitudes visibles para cualquier cliente | Cada cliente ve solo las suyas; el equipo ve todas |
| `features/auth/` + `authRepository` | Cuentas fijas y nombre de cliente quemado | Registro real, Google y Facebook, y sesión que se restaura al recargar |
| `pages/admin/` | Una sola tabla de solicitudes | Consola con resumen, tablero por etapa, detalle con gestión, pedidos y clientes |
| `shared/ui/Toaster.tsx` + `shared/lib/toast.ts` | Sin feedback visual tras crear/avanzar una solicitud | Confirma acciones al usuario |
| `shared/ui/ErrorBoundary.tsx`, `pages/NotFound.tsx` | Nada — la app no manejaba errores ni rutas inválidas | Evita pantallas en blanco |

## Cuentas, registro y roles

Hay una sola pantalla de acceso (`features/auth/AuthPage.tsx`) con dos pestañas: iniciar
sesión y crear cuenta. Los dos roles viven en `features/auth/types.ts`: **cliente** (pide
diagnósticos, ve sus solicitudes, compra) y **admin** (la consola del equipo en `/admin`).
`RequireAuth` acepta un prop `rol` para restringir una ruta, y las rutas de cliente van
envueltas en `SoloCliente` en `App.tsx`: el equipo que entra a una ruta de cliente vuelve
a su consola, y un cliente que escribe `/admin` vuelve al inicio.

`authRepository` elige, como los demás, entre dos implementaciones:

- **Local** (sin Supabase): las cuentas se guardan en el navegador con la contraseña
  derivada con PBKDF2-SHA256 (100 000 iteraciones y sal propia), nunca en texto plano. Las
  cuentas de demostración (`mockUsuarios.ts`) siempre existen. Google y Facebook abren un
  diálogo marcado como **modo demostración** que simula la identidad: sin Supabase no hay
  forma de hablar con esos proveedores.
- **Supabase Auth**: correo y contraseña, y Google/Facebook reales (`signInWithOAuth`). El
  rol sale de la tabla `perfiles`. Configurar los proveedores se explica en
  `docs/SUPABASE.md`.

**Quién ve qué.** `Solicitud.propietario` guarda el correo de quien la creó.
`SolicitudesContext` filtra con `puedeVerSolicitud`: el equipo ve todas, un cliente solo las
suyas, y las solicitudes de ejemplo sin dueño solo las ven las cuentas de demostración.
Abrir por URL la solicitud de otro cliente muestra "No encontramos la solicitud". Los
clientes tampoco pueden avanzar el estado: eso es del equipo.

## Diagnóstico por imagen

El cliente elige la zona (pared, techo, piso, fachada, metal o reja), describe el problema y
sube hasta 4 fotos. Mientras lo hace, el paso 4 muestra un **diagnóstico en vivo**: qué
problema parece ser (moho, humedad, fisuras, óxido, pintura descascarada o salitre), qué tan
grave es, con qué confianza, la causa probable, el paso a paso de la reparación y los
productos del catálogo que se sugieren. Las fotos se ven con las zonas detectadas resaltadas.

Cómo funciona (`domain/diagnostico/`, todo puro y probado sin navegador):

1. `analizarPixeles` recibe los píxeles de una foto reducida a 320 px y mide qué fracción
   ocupan las manchas oscuras, el color de agua, el óxido y la textura fuerte, y qué tanto
   mide el trazo de las grietas. Usa HSV y luma, imágenes integrales para la textura local y
   un detector de crestas a varias escalas para las líneas finas, con reglas que descartan lo
   que no es una grieta (juntas de baldosa o ladrillo, textura de piedra, vetas de metal).
2. `diagnosticar` combina esas medidas con lo que dice el cliente (palabras, zona y
   condición elegida): la foto dice qué se ve y cuánto, y el texto confirma o corrige lo que
   una foto sola no distingue (un ladrillo o una teja pueden parecer daño). Lo que el cliente
   nombra pesa más que una mancha dudosa, salvo que la foto lo contradiga con fuerza.
3. El resultado (`DiagnosticoImagen`) se guarda con la solicitud y manda sobre la
   recomendación de producto: primero se trata el problema y luego se pinta.

**Qué tan bien funciona.** Se calibró con unas 45 fotos reales (moho, humedad, grietas,
óxido, paredes limpias y superficies rugosas). Sin descripción, las paredes limpias o
rugosas no dan falsos positivos (10 de 10), el moho se reconoce en 7 de 7 y el óxido en una
reja en 7 de 7; las grietas finas se detectan en 4 de 9 solo con la foto y en 7 de 9 con
una frase del cliente. No es una evaluación rigurosa, y los límites son reales:

- Es visión por computador clásica, **no un modelo entrenado**. Una mancha oscura sobre piedra
  o concreto rugoso puede ser moho, humedad o simple suciedad, y la foto sola no lo resuelve:
  el informe lo avisa y baja la confianza.
- Sin foto la confianza nunca pasa de 55 %; con foto, nunca de 92 %.
- Es una orientación preliminar: el informe dice que un asesor la revisa antes de cotizar.
- Cambiar este motor por un modelo de visión real (o por una API) solo exige mantener el
  contrato `píxeles → métricas` o `entrada → DiagnosticoImagen`; nada más de la app cambia.

Las fotos se comprimen en el navegador (lado mayor 960 px, JPEG al 72 %) y se guardan como
data URL, así que sobreviven a recargar y las ve el equipo. En `localStorage` hay un tope
(~5 MB): si no cabe todo, se aligeran primero las fotos de las solicitudes más viejas.

## Consola del equipo

`/admin` es otra aplicación dentro de la app, con su propia barra lateral (`AdminLayout`; en
móvil, una barra superior con la navegación deslizable):

- **Resumen**: indicadores (activas, sin asignar, prioridad alta, pedidos por atender,
  clientes, ventas del mes), la lista "requieren atención" con acción de tomar la
  solicitud, el embudo por etapa, los problemas más frecuentes, solicitudes nuevas por
  semana y la actividad reciente.
- **Solicitudes**: tablero por etapa o tabla, con búsqueda y filtros por estado, problema,
  prioridad y quién la atiende. Los filtros viven en la URL, así que los indicadores del
  resumen llevan directo a la lista filtrada.
- **Detalle**: diagnóstico y fotos, datos del cliente y del proyecto, recomendación, quién
  atiende (con "tomar esta solicitud"), las etapas con sus fechas, el avance de estado y
  las notas internas (solo el equipo las ve).
- **Pedidos**: los pedidos de la tienda, con filtro por estado y cambio de estado.
- **Clientes**: quién pidió y quién compró, juntos por correo.

La **prioridad** (`domain/solicitud/panel.ts`) sale de lo que muestra la foto (daño severo o
moderado) y de la fecha en que el cliente necesita la obra (vencida, a 7 días o a 21), y
explica sus motivos. Esa lógica, los filtros, el resumen y la agregación de clientes son
puros y están probados.

## Base de datos real (Supabase)

Ver [`docs/SUPABASE.md`](./SUPABASE.md) para la guía completa (crear el proyecto, aplicar los
SQL, configurar `.env.local`, activar Google y Facebook). En resumen: los tres repositorios
son async y eligen su implementación según si `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
están configuradas. El dueño, el diagnóstico, la asignación y las notas de cada solicitud
van en una tabla propia (`extras_solicitud`) para no tocar el esquema original.

## Tienda COLORLINK (distribuidor Pintuco)

`tiendaRepository` sigue exactamente el mismo patrón que `solicitudesRepository`
(`.types.ts` / `.local.ts` / `.supabase.ts`, elegido según haya o no credenciales de
Supabase) para `productos`, `kits` (`supabase/schema_tienda.sql`) y `pedidos` (captura de
pedido, sin pasarela de pagos real — `CartContext` guarda el carrito en localStorage y al
confirmar llama a `crearPedido`). El equipo además lista todos los pedidos y cambia su
estado. Los 8 productos y las 4 patologías de kit reusan exactamente los mismos nombres de
producto que devuelven el motor de recomendación y el diagnóstico (ej. "Koraza 5 Años" para
exteriores, "Aquablock Fibratado" para humedad) — el asistente, el diagnóstico y el
catálogo hablan siempre del mismo producto.

Cada producto se vende en galón o en cuñete de 5 galones (`precioPresentacion` en
`domain/tienda/calculadora.ts`: el cuñete lleva 12% de descuento). La línea del carrito
guarda presentación y color en su nombre (ej. "Koraza 5 Años Protección Total · Cuñete 5
galones (18.9 L) · Verde Salvia (PNT-401)"), así el pedido dice exactamente qué preparar
sin cambiar el esquema de `pedidos`. El punto de retiro elegido también vive en
`CartContext` (localStorage) y se muestra en el encabezado, el panel y el carrito.

## Qué se dejó fuera a propósito

- **Recuperación de contraseña**: el registro y el inicio de sesión existen; recuperar la
  contraseña no (con Supabase se puede activar desde su panel).
- **Seguridad real por usuario en el servidor**: la separación entre clientes y equipo se
  hace en la aplicación. Con Supabase las políticas siguen abiertas (prototipo) y las
  notas internas están en la misma fila que el diagnóstico; `docs/SUPABASE.md` explica
  cómo endurecerlo para producción.
- **Un modelo de visión entrenado**: ver los límites del diagnóstico arriba.
- **Subir las fotos a un almacenamiento de archivos** (Supabase Storage): hoy van
  comprimidas dentro del registro.
- **Pasarela de pagos**: el carrito captura el pedido, no cobra.

## Pruebas

`npm run test` corre Vitest sobre:
- `domain/diagnostico/diagnosticar.test.ts` — el diagnóstico: severidad, confianza, texto contra foto, zona, advertencias
- `domain/diagnostico/zona.test.ts` — zona sugerida según la superficie
- `features/diagnostico/imagen.test.ts` — qué zonas de la foto se muestran según el diagnóstico
- `domain/solicitud/recommendationEngine.test.ts` y `recommendationEngine.diagnostico.test.ts` — reglas de recomendación, con y sin diagnóstico
- `domain/solicitud/estadoMachine.test.ts` — transiciones de estado e historial
- `domain/solicitud/schemas.test.ts` — validación de cada paso del asistente
- `domain/solicitud/visibilidad.test.ts` — quién ve qué solicitud
- `domain/solicitud/panel.test.ts` — prioridad, filtros, resumen, actividad y clientes de la consola
- `data/repositories/solicitudesRepository.test.ts` y `.gestion.test.ts` — persistencia, dueño, diagnóstico, asignación, notas y almacenamiento lleno
- `data/repositories/authRepository.local.test.ts` y `features/auth/schemas.test.ts` — cuentas, contraseñas y validación del registro
- `features/auth/mockUsuarios.test.ts` — validación de credenciales y asignación de rol
- `features/solicitudes/wizard/WizardPage.test.tsx` — recorrido completo del asistente (integración)
- `domain/tienda/calculadora.test.ts` — redondeo de galones de la calculadora de pintura
- `domain/chat/asistenteVirtual.test.ts` — respuestas del asistente según la pregunta y los pedidos, y rechazo de temas ajenos
- `features/chat/llamada.test.ts` — turnos de la llamada de voz (escuchar, responder, silencio, silenciar)
- `shared/lib/formato.test.ts` — pesos y fechas
