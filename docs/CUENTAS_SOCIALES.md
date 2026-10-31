# Acceso con Google y Facebook

**Continuar con Google** abre la ventana de Google donde se elige la cuenta (la misma lista de
cuentas que aparece al entrar a cualquier sitio con Google) y vuelve con el nombre, el correo y la
foto de perfil. **Continuar con Facebook** hace lo mismo con la ventana de Facebook. Funciona con
las librerías oficiales de cada uno, sin servidor propio.

Cada botón se activa con un **identificador público** (no es una contraseña ni un secreto):

| Variable | Activa | Se crea en |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google | [Google Cloud Console](https://console.cloud.google.com) |
| `VITE_FACEBOOK_APP_ID` | Facebook | [Meta for Developers](https://developers.facebook.com) |

Sin la variable, el botón abre un diálogo marcado como **modo demostración**. Si la app usa
Supabase Auth ([`SUPABASE.md`](SUPABASE.md)), los botones entran por Supabase y no por esta vía.

## Poner el identificador: tu computador y Vercel

1. En tu computador: pégalo en `.env.local` (copia de `.env.example`) y reinicia `npm run dev`.
2. En Vercel: tu proyecto → **Settings → Environment Variables** → agrega la variable para
   *Production* → **Redeploy**. Vite escribe las variables dentro del código al compilar: sin volver
   a desplegar, el sitio no se entera.

## Google (unos 5 minutos)

1. En Google Cloud Console crea un proyecto (por ejemplo, `colorlink`).
2. En **Google Auth Platform** (antes "Pantalla de consentimiento de OAuth") pulsa *Comenzar*: nombre
   de la app **COLORLINK**, tu correo de asistencia y público **Externo**.
3. En **Clientes → Crear cliente**, tipo **Aplicación web**. En **Orígenes autorizados de
   JavaScript** agrega `http://localhost:5173` y la dirección del sitio publicado (hoy
   `https://colorlink-seven.vercel.app`). No hace falta ninguna URI de redireccionamiento.
4. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`) en `VITE_GOOGLE_CLIENT_ID`.
5. En **Público**, pulsa *Publicar la aplicación*. Con los permisos básicos (correo y perfil) no
   pide verificación. Si la dejas en *Prueba*, solo entran las cuentas que agregues como usuarios
   de prueba.

Los cambios de Google pueden tardar de unos minutos a un par de horas en aplicarse. Si la ventana
muestra **Error 400: origin_mismatch**, la dirección desde la que abres la página no está en la
lista del paso 3. Google no admite comodines: las direcciones temporales de cada despliegue de
Vercel no sirven, usa la dirección principal.

## Facebook

1. En Meta for Developers: *Mis apps → Crear app* → caso de uso **Autenticar y solicitar datos de
   usuarios con Facebook Login**. Ponle de nombre COLORLINK.
2. En **Configuración de la app → Básica** copia el **Identificador de la app** en
   `VITE_FACEBOOK_APP_ID` y agrega el dominio del sitio (`colorlink-seven.vercel.app`).
3. En **Inicio de sesión con Facebook → Configuración** activa **Iniciar sesión con el SDK de
   JavaScript** y, en **Dominios permitidos para el SDK de JavaScript**, pon la dirección publicada
   con `https://`.
4. Mientras la app esté en modo **Desarrollo**, solo entran quienes tengan un rol en la app. Para
   abrirla a todos, completa la URL de la política de privacidad y pasa la app a modo **Activo**.

Facebook exige `https`: en `http://localhost` puede no abrir, así que pruébalo en el sitio
publicado. Además, solo entrega el correo si la cuenta lo tiene; si no lo comparte, COLORLINK lo
avisa y propone otro acceso.

## Cómo se guardan las cuentas

Sin Supabase, la cuenta vive en el navegador de quien la usa (igual que las solicitudes y los
pedidos): entrar con Google crea una cuenta de cliente con su nombre, correo y foto, y la próxima vez
entra a la misma. Los datos salen de la API de Google con el permiso de esa persona, pero **ningún
servidor verifica la sesión**. Para una versión en producción con datos compartidos entre
dispositivos, usa Supabase Auth ([`SUPABASE.md`](SUPABASE.md)).
