# Calmatea (app VehiLink)

> **Nota sobre el nombre.** El repositorio se llama `calmatea-app` y nació como
> una app de calma para niños con autismo ("CalmaTEA"). Hoy el código contiene
> otra aplicación: **VehiLink**, una plataforma que conecta **conductores** con
> **propietarios de vehículos** (remis, taxi y autos de Uber, Cabify, DiDi, etc.).
> Todavía quedan restos de CalmaTEA (por ejemplo `SETUP.md`, `public/sw.js` y el
> dominio por defecto del sitemap). Esta documentación describe lo que hace el
> código **hoy**.

## ¿Qué es?

VehiLink es una aplicación web (que también se puede "instalar" en el celular
como si fuera una app) donde:

- **Propietarios** publican sus vehículos y eligen a qué conductor alquilárselos.
- **Conductores** buscan vehículos disponibles y se postulan, ofreciendo un
  porcentaje de lo que van a recaudar.
- **Anunciantes (publicitarios)** pagan para mostrar banners dentro de la app.
- **Administradores** revisan documentos, responden consultas de soporte y
  aprueban anuncios.

Está pensada para Argentina (precios en pesos, Mercado Pago, foco en Neuquén).

## Funciones principales

| Función | Quién la usa |
|---|---|
| Registro e inicio de sesión con email/contraseña o con Google | Todos |
| Publicar, editar, pausar y borrar vehículos | Propietarios |
| Buscar vehículos y enviar solicitudes (con oferta de porcentaje, días y horario, y aceptación de una cláusula legal) | Conductores |
| Aceptar o rechazar solicitudes; el conductor puede retirarlas | Ambos |
| Subir documentos (licencia, DNI, antecedentes, seguro, cédula verde, etc.) | Ambos |
| Calificar a la otra parte (escala de 1 a 7) | Ambos |
| Tickets de soporte | Todos |
| Plan **Premium** pago (Mercado Pago o PayWay) que quita límites | Ambos |
| Portal de anunciantes: crear anuncio, subir imágenes, pagar, pedir diseño ("creatividad") | Anunciantes |
| Panel de administración | Administradores |

Límites del plan gratuito: un conductor puede tener hasta **3 solicitudes
activas**; un propietario puede publicar **1 vehículo**.

## Tecnologías

- **[Next.js](https://nextjs.org) 16** (React 19, App Router, Turbopack). Ojo:
  esta versión cambia cosas respecto a versiones anteriores (por ejemplo, el
  "middleware" ahora se llama `proxy.ts`). Ver `AGENTS.md`.
- **TypeScript**
- **Tailwind CSS 4** para los estilos.
- **[Supabase](https://supabase.com)**: base de datos (PostgreSQL), login y
  almacenamiento de archivos.
- **Mercado Pago** y **PayWay (Prisma)** para cobros. Hay código de **Stripe**
  heredado que hoy no se usa desde la interfaz.
- **[Vercel](https://vercel.com)** para publicar el sitio.
- **PWA** (manifest + service worker) para instalarla en el celular.

## Cómo correrla en tu computadora (paso a paso)

1. **Instalá Node.js** versión 20 o superior desde <https://nodejs.org>
   (elegí la versión "LTS").
2. **Descargá el código.** Con Git:
   ```bash
   git clone https://github.com/jeremont20007-boop/calmatea-app.git
   cd calmatea-app
   ```
3. **Instalá las dependencias** (las librerías que usa el proyecto):
   ```bash
   npm install
   ```
4. **Creá el archivo de configuración** copiando la plantilla:
   ```bash
   cp .env.example .env.local
   ```
   Abrí `.env.local` y completá los valores. Qué es cada uno y de dónde
   sacarlo está en [`docs/VARIABLES.md`](docs/VARIABLES.md). Como mínimo
   necesitás las tres de Supabase y `NEXT_PUBLIC_APP_URL`.
   (También existe un asistente, `npm run setup`, pero está desactualizado y no
   pide las claves de Mercado Pago ni de PayWay.)
5. **Prepará la base de datos** (solo la primera vez): en Supabase → *SQL
   Editor*, pegá el contenido de `supabase/schema.sql` y ejecutalo. Después
   ejecutá también `supabase/propuestas/2026-11-02_endurecer_rls.sql`, que
   corrige reglas de seguridad (sin él, los usuarios logueados reciben
   errores), y después, en este orden, los archivos de `supabase/migrations/`:
   `20261102_protect_ad_prices.sql` (precios y estados de anuncios) y
   `20261102_ad_impressions.sql` (contador de impresiones; sin él no se
   muestran anuncios). Además creá dos "buckets" en *Storage*: `documents` y
   `ads-media` (este último público). Detalles en
   [`docs/MANUAL.md`](docs/MANUAL.md).
6. **Arrancá la app:**
   ```bash
   npm run dev
   ```
7. Abrí <http://localhost:3000> en el navegador.

Otros comandos útiles:

| Comando | Para qué sirve |
|---|---|
| `npm run build` | Arma la versión de producción (lo mismo que hace Vercel). |
| `npm run start` | Ejecuta la versión ya armada. |
| `npm run lint` | Revisa el estilo del código. |
| `npm run typecheck` | Revisa errores de tipos de TypeScript. |
| `npm run icons` | Regenera los íconos de `public/icons/`. |
| `npm test` | Corre los tests automáticos rápidos (ver abajo). |
| `npm run test:e2e` | Corre los tests en un navegador de verdad (ver abajo). |

## Tests automáticos

| Comando | Qué hace |
|---|---|
| `npm test` | Tests unitarios (Vitest + Testing Library): utilidades, sesión, componentes, formularios, webhooks de pago y reglas de la base de datos. |
| `npm run test:watch` | Lo mismo, pero se re-ejecutan al guardar cambios. |
| `npm run test:e2e` | Tests end-to-end (Playwright) en un navegador real, escritorio y móvil. |

Los tests **no usan claves reales ni tocan la base de producción**: los unitarios simulan Supabase
(y prueban las reglas de la base en un Postgres en memoria), y los end-to-end levantan un Supabase
falso (`e2e/mock-supabase.mjs`) con datos inventados.

La primera vez que se corren los end-to-end hay que instalar el navegador: `npx playwright install chromium`.

En cada Pull Request, GitHub Actions (`.github/workflows/ci.yml`) corre lint, chequeo de tipos,
tests unitarios, build y tests end-to-end.


## Documentación

- [`docs/MANUAL.md`](docs/MANUAL.md): manual en lenguaje simple (páginas,
  cómo cambiar textos, login, datos, publicación, qué hacer si algo se rompe).
- [`docs/VARIABLES.md`](docs/VARIABLES.md): variables de entorno.
- [`docs/GLOSARIO.md`](docs/GLOSARIO.md): glosario de términos técnicos.
- `SETUP.md`: guía vieja de la época CalmaTEA (parcialmente desactualizada).

## Estructura de carpetas

```
app/                  Páginas y rutas del sitio
  page.tsx            Página de inicio (landing)
  auth/               Login, registro, registro de anunciantes y callback
  (protected)/        Páginas para conductores y propietarios logueados
  admin/              Panel de administración (direcciones /admin/...)
  (advertiser)/       Portal de anunciantes
  api/                Rutas internas: pagos, webhooks y anuncios
components/           Piezas visuales reutilizables (botones, barra inferior…)
lib/                  Conexión con Supabase y Stripe, precios de Premium
                      (payments.ts), utilidades
types/index.ts        Tipos de datos, textos de etiquetas, precios y cláusula legal
supabase/schema.sql   Definición de la base de datos
supabase/propuestas/  Correcciones de seguridad para aplicar a mano
public/               Imágenes, íconos, manifest y service worker
proxy.ts              Controla quién puede entrar a cada página (antes "middleware")
```
