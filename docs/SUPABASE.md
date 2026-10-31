# Conectar Colorlink a Supabase

Este documento es para la jornada de integración: pasar de "todo en localStorage" a
"cuentas, solicitudes y pedidos en una base de datos Postgres real". El código ya está
listo del lado del frontend (ver "Cómo funciona" abajo) — lo que falta es crear el
proyecto de Supabase y darle sus credenciales a la app.

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) e inicia sesión (con GitHub o correo).
2. **New project** → nombre `colorlink` → elige una contraseña para la base de
   datos (guárdala, no se puede ver después) → región cercana → plan **Free**.
3. Espera 1-2 minutos mientras se aprovisiona.

## 2. Crear las tablas

1. En el panel del proyecto, ve a **SQL Editor → New query**.
2. Abre [`supabase/schema.sql`](../supabase/schema.sql) de este repo, copia
   todo su contenido y pégalo en el editor.
3. **Run**. Esto crea las 8 tablas (7 del modelo "Necesidad del cliente" +
   `historial_estados`), sus relaciones, las políticas de acceso, y siembra
   `CL-1001` (la misma solicitud de ejemplo que existe en
   `src/data/solicitudesSemilla.ts`) para poder probar una lectura de inmediato.
4. Verifica en **Table Editor** que las 8 tablas aparecen y que `solicitudes`
   tiene una fila.
5. Opcional: pega también [`supabase/seed_demo.sql`](../supabase/seed_demo.sql)
   y corrélo — agrega 5 solicitudes más en distintas ciudades y en cada estado
   del ciclo de vida, para que la consola del equipo y las consultas de
   prueba se vean con datos variados en vez de una sola fila.
6. Para la tienda (catálogo, kits, carrito): pega y corre
   [`supabase/schema_tienda.sql`](../supabase/schema_tienda.sql) y luego
   [`supabase/seed_tienda.sql`](../supabase/seed_tienda.sql) — crean `productos`,
   `kits` y `pedidos`, y siembran los 8 productos + 4 kits que se ven en
   `/catalogo` y en el selector de kits del Home.
7. **Cuentas y consola del equipo** (obligatorio para usar la app con Supabase):
   pega y corre [`supabase/schema_cuentas_y_panel.sql`](../supabase/schema_cuentas_y_panel.sql).
   Crea `perfiles` (el rol de cada cuenta), `extras_solicitud` (quién creó cada
   solicitud, su diagnóstico por imagen, quién la atiende y las notas internas) y
   las políticas para cuentas con sesión. Se puede correr más de una vez.

## 3. Obtener la URL y la API key

En **Project Settings → API**:
- **Project URL** (algo como `https://xxxxxxxxxxxx.supabase.co`)
- **anon public** key (una cadena larga que empieza con `eyJ...`)

Nunca uses la **service_role** key en el frontend — esa sí puede saltarse
todas las reglas de seguridad y no debe salir del backend.

## 4. Configurar el proyecto

Crea `.env.local` en la raíz (mismo nivel que `package.json`), copiando
[`.env.example`](../.env.example):

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

`.env.local` ya está en `.gitignore` (vía el patrón `*.local`) — no se sube al
repo. Reinicia `npm run dev` después de crear el archivo (Vite solo lee
variables de entorno al arrancar).

Si todo quedó bien configurado, la consola del navegador **no** debe mostrar
el mensaje `[colorlink] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY no
configuradas...` al cargar la app.

## 5. Cuentas: correo, Google y Facebook

Con Supabase configurado, el inicio de sesión y el registro usan **Supabase Auth**
(sin Supabase, la app usa cuentas guardadas en el navegador, ver
`docs/ARQUITECTURA.md`).

> Sin Supabase, los botones de Google y Facebook también abren la ventana real de cada uno
> (las cuentas quedan en el navegador): ver [`CUENTAS_SOCIALES.md`](CUENTAS_SOCIALES.md). Esta
> sección es para cuando quieras cuentas compartidas entre dispositivos.

**Correo y contraseña** funcionan sin más pasos. En **Authentication → Providers →
Email** decide si exiges confirmar el correo: si lo exiges, después de registrarse
la persona ve un aviso para revisar su bandeja y entra al confirmar.

**URLs permitidas.** En **Authentication → URL Configuration** pon:
- *Site URL*: la dirección de la app publicada.
- *Redirect URLs*: `http://localhost:5173/**` y la dirección publicada (`https://tu-dominio/**`).

**Google.**
1. En [Google Cloud Console](https://console.cloud.google.com) → *APIs y servicios →
   Credenciales → Crear credenciales → ID de cliente de OAuth* (tipo *Aplicación web*).
2. En *URI de redireccionamiento autorizados* pega
   `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
3. Copia el *ID de cliente* y el *Secreto* en Supabase → **Authentication → Providers →
   Google** y actívalo.

**Facebook.**
1. En [Meta for Developers](https://developers.facebook.com) crea una app de tipo
   *Consumidor* y agrega el producto *Inicio de sesión con Facebook*.
2. En *URI de redireccionamiento de OAuth válidos* pega la misma dirección
   `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
3. Copia el *ID de la app* y la *Clave secreta* en Supabase → **Authentication →
   Providers → Facebook** y actívalo. Mientras la app de Meta esté en modo
   *Desarrollo*, solo pueden entrar las cuentas con rol en esa app.

Sin configurar un proveedor, el botón correspondiente muestra el error de Supabase
("provider is not enabled"); no rompe nada.

**Hacer administrador (equipo) a una cuenta.** Todas las cuentas nuevas son clientes.
Después de que la persona se registre, corre en el SQL Editor:

```sql
update perfiles set rol = 'admin'
where id = (select id from auth.users where email = 'equipo@tu-correo.com');
```

## Cómo funciona (para quien siga el código)

- `src/data/supabaseClient.ts` crea el cliente si las dos variables de entorno
  existen; si no, exporta `null`.
- Tres repositorios siguen el mismo patrón (`.types.ts` / `.local.ts` / `.supabase.ts`
  y un archivo que elige): `solicitudesRepository`, `tiendaRepository` y
  `authRepository`. El resto de la app llama siempre al mismo repositorio sin
  saber cuál de los dos está activo.
- Dueño, diagnóstico por imagen, asignación y notas internas de cada solicitud viven
  en `extras_solicitud`, no en las tablas originales. Si falta esa tabla, leer
  solicitudes sigue funcionando (sin dueño ni gestión) y crear una avisa qué SQL
  correr antes de insertar nada a medias.
- El rol de cada cuenta sale de `perfiles`; sin esa tabla, todos entran como clientes.

## Checklist de pruebas funcionales (lo que pide la guía de la jornada)

Con `.env.local` configurado, el SQL del paso 2.7 corrido y `npm run dev` corriendo:

1. **Registro**: en `/registro` crea una cuenta con correo. Debe aparecer en
   Authentication → Users y tener una fila en `perfiles` con rol `cliente`.
2. **Lectura**: entra como cliente — "Mis solicitudes" debe mostrar solo las suyas.
   Entra como administrador (después del `update perfiles` de arriba) — la consola
   debe mostrar todas, con sus fotos y diagnósticos.
3. **Escritura/INSERT desde el formulario**: como cliente, completa "Diagnóstico de
   superficie" (los 4 pasos, con una foto). Al terminar, revisa en Table Editor que
   apareció una fila nueva en `solicitudes`, que `especificaciones_tecnicas`,
   `evidencias` (+ `imagenes_evidencia`) y `recomendaciones` tienen su fila con el
   mismo `solicitud_id`, y que `extras_solicitud` guardó tu correo y el diagnóstico.
4. **Gestión del equipo**: en la consola, abre la solicitud nueva, asígnala y deja
   una nota. Confirma en `extras_solicitud` que cambiaron `asignado_a` y `notas`.
5. **Avanzar/Resolver**: usa "Avanzar" (o "Resolver" en el último paso) y confirma que
   `solicitudes.estado` cambió y que se insertó una fila en `historial_estados`.
6. **Pedidos**: compra algo desde el catálogo y, como equipo, cambia su estado en
   `/admin/pedidos`; confirma el cambio en `pedidos.estado`.

Anota en tu bitácora de la jornada cualquier error que aparezca en cada paso
(por ejemplo, un `403` suele ser una política RLS mal aplicada; un `23503` es
una foreign key sin la fila padre) — es justo el proceso de iteración que pide
la guía.

## Límites conocidos

- **Fotos de evidencia**: se reducen a 960 px y se comprimen en el navegador, y se
  guardan como texto (data URL) en `imagenes_evidencia.url` (cerca de 100 KB cada una,
  máximo 4 por solicitud). Así sobreviven a recargar y las ve el equipo, pero para
  mucho volumen lo correcto es **Supabase Storage** (subir el archivo y guardar su URL).
- **Políticas RLS abiertas**: siguen siendo las del prototipo (`using (true)`), ahora
  también para el rol `authenticated`. Quién ve qué solicitud se filtra en la
  aplicación (`domain/solicitud/visibilidad.ts`); alguien que llame a la API con su
  propia sesión podría leer filas ajenas, **incluidas las notas internas** de
  `extras_solicitud`. Para producción: agregar `usuario_email` a `solicitudes`, escribir
  políticas por dueño (`auth.jwt() ->> 'email'`) y por rol (`perfiles.rol = 'admin'`) y
  mover las notas a una tabla que solo lea el equipo.
- **Diagnóstico**: se calcula en el navegador (visión por computador clásica, no un
  modelo entrenado) y se guarda ya calculado. Ver la sección de diagnóstico por imagen
  en `docs/ARQUITECTURA.md` para sus límites.
