# Variables de entorno

Las **variables de entorno** son las claves y datos de configuración que la
app necesita pero que **no se guardan en el código**, porque son secretas o
cambian según dónde corre la app (tu computadora o Vercel).

> 🔒 **Nunca** pegues valores reales en el repositorio, en un pull request, en
> un chat o en un email. Este documento lista solo los **nombres**.

## Dónde se configuran

| Lugar | Cuándo | Cómo |
|---|---|---|
| **Vercel** (sitio publicado) | Siempre, para producción y vistas previas | Proyecto → *Settings* → *Environment Variables*. Después de cambiar algo, hacer *Redeploy*. |
| **Tu computadora** | Solo si corrés la app localmente | Archivo `.env.local` en la raíz del proyecto (copiá `.env.example`). Ese archivo está excluido de Git, así que nunca se sube. |

Regla de nombres: las variables que empiezan con `NEXT_PUBLIC_` **se envían
al navegador** de los usuarios, así que solo pueden contener datos que no sean
secretos. Las demás quedan solo en el servidor.

## Lista de variables

### Supabase (base de datos, login, archivos) — obligatorias

| Nombre | Para qué sirve | De dónde se saca | ¿Secreta? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dirección del proyecto de Supabase. Sin ella no funciona nada. | Supabase → *Project Settings* → *API* → *Project URL* | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave "pública" para que la app hable con Supabase respetando las reglas de seguridad (RLS). | Supabase → *Project Settings* → *API* → clave `anon` / *publishable* | No (pero no la difundas sin necesidad) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave "maestra" que **saltea todas las reglas de seguridad**. La usan los avisos de pago (Mercado Pago, PayWay, anuncios y Stripe) para activar el Premium o el anuncio. Sin ella, los pagos no se acreditan solos. | Supabase → *Project Settings* → *API* → clave `service_role` / *secret* | **Sí, muy sensible.** Solo en Vercel y `.env.local`, nunca con `NEXT_PUBLIC_`. |

### Aplicación — obligatoria

| Nombre | Para qué sirve | Valor típico |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Dirección pública del sitio, sin barra final. Se usa para armar los enlaces de regreso después de pagar, la confirmación de email, el `sitemap.xml` y el `robots.txt`. | Local: `http://localhost:3000`. En Vercel: la dirección de producción o el dominio propio. |

### Mercado Pago — necesaria para cobrar Premium y anuncios

| Nombre | Para qué sirve | De dónde se saca | ¿Secreta? |
|---|---|---|---|
| `MP_ACCESS_TOKEN` | Crear los links de pago y consultar si un pago fue aprobado. | Mercado Pago → *Tus integraciones* → tu aplicación → *Credenciales de producción* → *Access Token*. Para pruebas, usar las credenciales de prueba. | **Sí** |

Además, en Mercado Pago no hace falta cargar la URL de notificaciones: la app
la manda en cada pago (`/api/mercadopago/webhook` y `/api/ads/webhook`).

### PayWay (Prisma) — opcional, segundo medio de pago de Premium

| Nombre | Para qué sirve | De dónde se saca | ¿Secreta? |
|---|---|---|---|
| `PAYWAY_API_KEY` | Clave para crear sesiones de pago. | Panel / contrato de PayWay | **Sí** |
| `PAYWAY_SITE_ID` | Identificador del comercio en PayWay. | Panel de PayWay | No |
| `PAYWAY_TEMPLATE_ID` | Plantilla del formulario de pago. | Panel de PayWay | No |
| `PAYWAY_WEBHOOK_SECRET` | Contraseña que la app agrega a la dirección de aviso de pago, para comprobar que el aviso es legítimo. **Sin ella, el pago con PayWay queda desactivado.** | No viene de PayWay: la inventás vos (un texto largo y al azar, por ejemplo de 40 letras y números). | **Sí** |

Si estas variables no están cargadas, el botón "Pagar con PayWay" va a mostrar un error.

### Stripe — heredado, hoy sin uso desde la interfaz

El código de Stripe viene de la versión anterior (CalmaTEA). Ninguna pantalla
actual lo usa, pero las rutas `app/api/stripe/*` y `app/api/stripe-portal`
siguen existiendo.

| Nombre | Para qué sirve | De dónde se saca | ¿Secreta? |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Clave privada de Stripe. Solo se lee cuando se usa una ruta de Stripe; el build funciona sin ella. | Stripe → *Developers* → *API keys* | **Sí** |
| `STRIPE_WEBHOOK_SECRET` | Verificar que los avisos vienen de Stripe. | Stripe → *Developers* → *Webhooks* → *Signing secret* | **Sí** |
| `STRIPE_PREMIUM_PRICE_ID` | Identificador del precio del plan (`price_...`). | Stripe → *Products* | No |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe. **No se usa en el código actual.** | Stripe → *Developers* → *API keys* | No |

## Configuración que NO son variables pero también hace falta

Estas cosas se configuran dentro de Supabase, no como variables:

- **Authentication → URL Configuration:** *Site URL* = dirección del sitio;
  *Redirect URLs* = dirección del sitio + `/auth/callback`.
- **Authentication → Providers:** activar *Email* y, si se quiere, *Google*
  (con su Client ID y Client Secret, que se obtienen en Google Cloud Console y
  se cargan **en Supabase**, no en Vercel).
- **Storage:** buckets `documents` y `ads-media`.

## Archivo `vercel.json`

🛠️ `vercel.json` tiene un bloque `env` con valores del tipo `@supabase-url`.
Eso es el sistema viejo de "Vercel Secrets", que Vercel ya discontinuó.
Recomendación: cargar todo desde el panel de Vercel y eliminar ese bloque
(además, no incluye las variables de Mercado Pago ni de PayWay).

## Si una clave se filtró

1. Generá una clave nueva en el servicio (Supabase, Mercado Pago, etc.).
2. Reemplazala en Vercel y en tu `.env.local`.
3. Hacé *Redeploy* en Vercel.
4. Revocá/eliminá la clave vieja.
