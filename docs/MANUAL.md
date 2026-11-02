# Manual de Calmatea / VehiLink

Este manual está escrito para el dueño del proyecto, sin necesidad de saber
programar. Las palabras técnicas que aparecen están explicadas en el
[glosario](GLOSARIO.md). Las partes marcadas con 🛠️ son más técnicas y sirven
sobre todo a un desarrollador.

---

## 1. ¿Qué hace la app, en pocas palabras?

VehiLink pone en contacto a dos tipos de personas:

- **Propietarios**: tienen un auto (remis, taxi o de aplicaciones como Uber)
  pero no lo manejan, y quieren alquilarlo.
- **Conductores**: quieren trabajar manejando pero no tienen auto.

El propietario publica su auto con condiciones (porcentaje, días, horarios).
El conductor lo encuentra, manda una solicitud y, si el propietario la acepta,
quedan conectados. Además hay **anunciantes** que pagan por mostrar
publicidad en la app y **administradores** que supervisan todo.

---

## 2. Cómo está organizado el sitio

### Páginas públicas (sin iniciar sesión)

| Dirección | Qué hay |
|---|---|
| `/` | Página de presentación: qué es VehiLink, cómo funciona, botones "Soy conductor" y "Tengo un vehículo". |
| `/auth/login` | Iniciar sesión (email y contraseña, o Google). |
| `/auth/register` | Crear cuenta eligiendo rol: conductor o propietario. |
| `/auth/publicitario` | Registro e ingreso de anunciantes (empresas). |

### Páginas para conductores y propietarios (con sesión iniciada)

En el celular aparece una barra abajo con: Inicio, Buscar / Mis Autos,
Solicitudes, Soporte y Perfil.

| Dirección | Qué hay |
|---|---|
| `/dashboard` | Inicio. Muestra un resumen distinto según seas conductor o propietario. |
| `/vehiculos` | (Conductor) Lista de vehículos disponibles. Puede mostrar un anuncio. |
| `/vehiculos/[id]` | Detalle de un vehículo y botón para postularse. El conductor elige qué porcentaje ofrece, qué días y horario, y debe aceptar la cláusula legal de "no relación laboral". |
| `/vehiculos/nuevo` | (Propietario) Publicar un vehículo. Con plan gratuito, solo 1. |
| `/vehiculos/[id]/editar` | (Propietario) Editar un vehículo. |
| `/mis-vehiculos` | (Propietario) Mis autos, con botón para ponerlos "Disponible / Ocupado / Pausado". |
| `/mis-vehiculos/documentos/[id]` | (Propietario) Subir los papeles del auto: título, cédula verde, seguro, habilitaciones. |
| `/solicitudes` | Conductor: las solicitudes que envió (puede retirarlas). Propietario: las que recibió (puede aceptar o rechazar con un mensaje). |
| `/calificar/[usuario]` | Calificar a la otra persona del 1 al 7, después de un acuerdo. |
| `/perfil` | Datos personales; el conductor además carga licencia, experiencia, días disponibles, etc. |
| `/perfil/documentos` | (Conductor) Subir licencia, DNI, antecedentes penales, seguro, credencial de remis. |
| `/soporte` | Mandar una consulta (ticket) a los administradores y ver las respuestas. |
| `/subscription` | Plan Premium: comparación gratis vs. Premium y botones para pagar con Mercado Pago o PayWay. Precio: $2.990/mes conductor, $3.990/mes propietario. |

### Portal de anunciantes

| Dirección | Qué hay |
|---|---|
| `/ad-dashboard` | Panel del anunciante: resumen de sus anuncios. |
| `/anuncios` | Lista de sus anuncios y su estado (borrador, en revisión, activo…). |
| `/anuncios/nuevo` | Crear un anuncio: imágenes (celular 750×300 y computadora 1200×400), título, texto, enlace, duración (7 a 90 días, $500/día con descuentos) y pago con Mercado Pago. |
| `/anuncios/[id]` | Ver o editar un anuncio y pagarlo si falta. |
| `/anuncios/[id]/creatividad` | Pedir que el equipo le diseñe el anuncio. Hay 7 planes ("estrellas") desde $5.000 hasta $110.000. |

Un anuncio pagado queda **"En revisión"** hasta que un administrador lo
aprueba. Recién ahí se muestra en la app.

### Panel de administración

| Pantalla | Qué hace |
|---|---|
| Panel | Números generales: tickets abiertos, documentos pendientes, usuarios, vehículos. |
| Tickets | Ver consultas de soporte, responderlas y cambiar su estado. |
| Docs | Aprobar o rechazar documentos que subieron conductores y propietarios. |
| Usuarios | Lista de usuarios por rol y si son Premium. |
| Anuncios | Aprobar, rechazar o pausar anuncios. |
| Creatividad | Pedidos de diseño de anuncios y su estado (pendiente, en producción, entregado). |

> ⚠️ Hoy el panel de administración **no funciona** por un error en cómo
> están armadas las carpetas. Ver [Problemas conocidos](#8-problemas-conocidos).

**Cómo hacer administrador a alguien:** en Supabase → *Table Editor* → tabla
`profiles`, buscá a la persona y cambiá la columna `role` a `admin`. Antes,
una sola vez, hay que permitir ese valor ejecutando en el *SQL Editor* las
líneas que están comentadas en `supabase/schema.sql` bajo el título
"ADMIN ROLE".

---

## 3. Cómo cambiar textos e imágenes habituales

La forma más simple, sin instalar nada:

1. Entrá al repositorio en GitHub.
2. Abrí el archivo que quieras cambiar (ver tabla abajo).
3. Tocá el ícono del **lápiz** ("Edit this file").
4. Cambiá **solo el texto entre comillas o entre etiquetas**, sin tocar
   símbolos como `<`, `>`, `{`, `}`, `'`, `"`.
5. Abajo, en "Commit changes", elegí **"Create a new branch… and start a pull
   request"**. Así el cambio no se publica de inmediato y podés revisarlo.
6. Vercel genera una **vista previa** del cambio (un enlace en el pull request).
   Si se ve bien, hacé **merge** y se publica.

### Dónde está cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| Textos de la página de inicio (títulos, "Cómo funciona", beneficios, pie de página) | `app/page.tsx` |
| Los números de la portada ("2,400+ vehículos", etc.). **Atención:** son números de ejemplo, no se calculan de datos reales. | `app/page.tsx` |
| Nombre y descripción del sitio que aparecen en Google y en la pestaña del navegador | `app/layout.tsx` (`title` y `description`) |
| Nombre y color de la app instalada en el celular | `public/manifest.json` |
| Íconos de la app | `public/icons/icon-192.png` e `icon-512.png` (reemplazar por imágenes del mismo tamaño) |
| Ícono de la pestaña del navegador | `app/favicon.ico` |
| Colores generales (la familia de azules "calm", verde, amarillo) | `app/globals.css`, al principio |
| Precio del plan Premium | Está repetido en **cuatro** lugares; hay que cambiarlo en todos: `app/(protected)/subscription/page.tsx`, `app/(protected)/subscription/CheckoutButton.tsx`, `app/api/mercadopago/checkout/route.ts`, `app/api/payway/checkout/route.ts` |
| Beneficios del plan gratis y Premium | `app/(protected)/subscription/page.tsx` |
| Precio por día de los anuncios y descuentos por duración | `types/index.ts` (`AD_PRICE_PER_DAY_ARS`, `AD_DURATION_OPTIONS`) |
| Planes de "creatividad" (precios y entregables) | `types/index.ts` (`CREATIVE_TIERS`, `CREATIVE_DELIVERABLES`) |
| Texto legal que acepta el conductor | `types/index.ts` (`LEGAL_DISCLAIMER`) |
| Nombres de documentos que se piden y si son obligatorios | `types/index.ts` (`DRIVER_DOC_LABELS`, `VEHICLE_DOC_LABELS`) |
| Plataformas (Uber, Cabify…) y horarios | `types/index.ts` (`PLATFORM_LABELS`, `SCHEDULE_LABELS`) |
| Límite de 3 solicitudes del plan gratis | `app/(protected)/vehiculos/[id]/page.tsx` y textos en `subscription/page.tsx` |
| Límite de 1 vehículo del plan gratis | `app/(protected)/vehiculos/nuevo/page.tsx` |
| Página "no encontrada" (error 404) | `app/not-found.tsx` |

Las imágenes de los anuncios **no** están en el código: las suben los
anunciantes y se guardan en Supabase.

---

## 4. Cómo funciona el login

El login lo maneja **Supabase Auth**. La app nunca ve ni guarda contraseñas.

- **Con email y contraseña:** en `/auth/register` la persona pone nombre,
  email, teléfono, ciudad, contraseña y elige si es conductor o propietario.
  Supabase crea el usuario y, automáticamente, la base de datos le crea una
  fila en la tabla `profiles` con esos datos. Según la configuración de
  Supabase, puede tener que confirmar el email con un enlace.
- **Con Google:** el botón "Continuar con Google" lleva a Google y vuelve a
  `/auth/callback`, que guarda la sesión y, si es una cuenta nueva, asigna el
  rol elegido. Para que funcione, Google tiene que estar activado en Supabase →
  *Authentication* → *Providers*.
- **Anunciantes:** se registran aparte en `/auth/publicitario`. Se guarda la
  empresa en la tabla `advertisers` con estado "pendiente" hasta que un
  administrador aprueba su primer anuncio.
- **Quién puede ver qué:** el archivo `proxy.ts` revisa en cada visita si hay
  sesión. Si no la hay y la página no es pública, manda al login. Si ya hay
  sesión y se entra al login, manda al inicio. Además cada sección revisa el
  rol (por ejemplo, solo propietarios pueden publicar autos).
- **Olvidé mi contraseña:** hoy la app no tiene esa pantalla. Se puede
  restablecer desde Supabase → *Authentication* → *Users* → enviar enlace
  de recuperación.

En Supabase → *Authentication* → *URL Configuration* hay que tener:
- **Site URL:** la dirección pública del sitio (la de Vercel o el dominio propio).
- **Redirect URLs:** esa misma dirección + `/auth/callback`.

---

## 5. Qué se guarda en Supabase

### Tablas (como hojas de cálculo)

| Tabla | Qué guarda |
|---|---|
| `profiles` | Una fila por usuario: nombre, rol (conductor/propietario/admin), plan (free/premium), ciudad, teléfono, datos de conductor y de suscripción. |
| `vehicles` | Autos publicados: marca, modelo, año, patente, ciudad, plataformas, porcentaje para el conductor (40–90 %), tipo (remis/taxi/plataforma), días y horario, estado. |
| `applications` | Solicitudes de conductores a autos: mensaje, porcentaje ofrecido, días, si aceptó la cláusula legal, estado y respuesta del propietario. |
| `driver_documents` | Documentos de conductores y si están pendientes, aprobados o rechazados. |
| `vehicle_documents` | Documentos de los autos, con el mismo sistema de estados. |
| `ratings` | Calificaciones de 1 a 7 entre usuarios. |
| `support_tickets` | Consultas de soporte y la respuesta del administrador. |
| `advertisers` | Empresas anunciantes. |
| `ads` | Anuncios: textos, imágenes, enlace, duración, precio, si está pagado, fechas, cantidad de veces mostrado. |
| `creative_requests` | Pedidos de diseño de anuncios. |

La estructura completa está en `supabase/schema.sql`.

### Archivos (Storage)

| Bucket | Qué guarda | Tipo |
|---|---|---|
| `documents` | Fotos/PDF de documentos de conductores y autos. Son datos personales sensibles. | Privado |
| `ads-media` | Imágenes de los anuncios. | Público |

Estos buckets **no** se crean con el archivo SQL: hay que crearlos a mano en
Supabase → *Storage* (ver comentarios al final de `supabase/schema.sql`).

### Seguridad de los datos

Supabase tiene "reglas de acceso por fila" (RLS): cada usuario solo puede ver
y cambiar lo suyo. Por ejemplo, un propietario solo ve los documentos de un
conductor cuando aceptó su solicitud. Estas reglas están en
`supabase/schema.sql`.

**Copias de seguridad:** revisá en Supabase → *Database* → *Backups* qué
incluye tu plan. Antes de cambios grandes, conviene exportar las tablas.

---

## 6. Cómo se publica en Vercel

Vercel está conectado al repositorio de GitHub y publica solo:

- **Cuando se hace merge (se une) a la rama principal**, Vercel descarga el
  código, ejecuta `npm run build` y, si sale bien, reemplaza el sitio en
  producción en uno o dos minutos. Si el build falla, **el sitio anterior
  sigue funcionando** y la versión nueva no se publica.
- **Cuando se abre o actualiza un pull request**, Vercel arma una **vista
  previa** con una dirección propia, para probar sin afectar el sitio real.
- La rama principal hoy se llama `claude/determined-bohr-l0lwue` (es la
  rama por defecto del repositorio). Se puede verificar en Vercel →
  *Settings* → *Git* → *Production Branch*.

Para ver qué pasó: Vercel → proyecto → *Deployments*. Cada publicación muestra
su estado (Ready = bien, Error = falló) y el registro ("Build Logs").

Las claves y contraseñas **no están en el código**: se cargan en Vercel →
*Settings* → *Environment Variables*. Ver [VARIABLES.md](VARIABLES.md). Si
cambiás una variable, tenés que volver a publicar (*Deployments* → ⋯ →
*Redeploy*) para que se aplique.

---

## 7. Qué hacer si algo se rompe

1. **No entres en pánico ni borres nada.** Casi todo se puede deshacer.
2. **¿El sitio no carga o se ve roto después de un cambio?** En Vercel →
   *Deployments*, buscá la última publicación que funcionaba, tocá ⋯ y elegí
   **"Promote to Production"** (o "Instant Rollback"). En segundos vuelve la
   versión anterior.
3. **¿Un cambio nuevo no aparece?** Mirá en *Deployments* si la última
   publicación dice *Error*. Abrí los *Build Logs* y copiá el mensaje en rojo
   para pasárselo a un desarrollador.
4. **¿Nadie puede iniciar sesión o no aparecen datos?** Revisá en
   <https://status.supabase.com> si Supabase tiene problemas, y en Supabase que
   el proyecto no esté **pausado** (los proyectos gratis se pausan tras días
   sin uso; se reactivan con un botón).
5. **¿Los pagos no activan el Premium?** Revisá en Mercado Pago que el pago
   esté aprobado. Mientras tanto se puede activar a mano: en Supabase →
   `profiles`, cambiar `plan` a `premium` para esa persona.
6. **¿Errores raros en una pantalla?** En Vercel → *Logs* aparecen los errores
   del servidor en tiempo real.
7. **¿Cambié una variable de entorno y se rompió?** Volvé al valor anterior
   y hacé *Redeploy*.
8. **Para pedir ayuda**, pasale al desarrollador: qué estabas haciendo, en qué
   página, captura de pantalla, hora aproximada, y el enlace del deployment.

---

## 8. Problemas conocidos

🛠️ Detectados al revisar el código de la rama principal (noviembre 2026). Hay
un pull request abierto (#2, "Seguridad: auth, RLS, pagos y webhooks +
build/lint sin errores") que dice resolver varios; conviene revisarlo.

1. **El build falla, así que Vercel no puede publicar cambios.** El panel de
   administración está en `app/(admin)/` y la carpeta entre paréntesis no
   forma parte de la dirección: `app/(admin)/dashboard` y
   `app/(protected)/dashboard` quedan las dos en `/dashboard`. Next.js lo
   rechaza con *"You cannot have two parallel pages that resolve to the same
   path"*. Además, todos los enlaces del panel apuntan a `/admin/...`, que no
   existe. Solución probable: renombrar `app/(admin)` a `app/admin`.
2. **Rutas que deberían ser públicas exigen sesión.** `lib/supabase/middleware.ts`
   solo deja pasar `/`, `/auth/login` y `/auth/register`. Eso bloquea
   `/auth/callback` (login con Google y confirmación de email),
   `/auth/publicitario` y los avisos automáticos de pago (`/api/*/webhook`)
   que mandan Mercado Pago y PayWay.
3. **Los webhooks de Mercado Pago y PayWay no pueden escribir en la base.**
   Usan el cliente normal de Supabase sin sesión, y las reglas RLS bloquean la
   actualización. El Premium/anuncio no se activa solo tras pagar. Además el
   webhook de PayWay no verifica que el aviso venga realmente de PayWay.
4. **El precio de Premium con Mercado Pago lo puede mandar el navegador**
   (`body.price` en `app/api/mercadopago/checkout/route.ts`), por lo que
   alguien podría pagar menos.
5. **`/api/stripe-portal` no verifica quién llama.** Recibe cualquier
   `customerId`. Stripe no se usa desde la interfaz; conviene borrarlo o
   protegerlo.
6. **El rol `admin` no está permitido por defecto** en la tabla `profiles`;
   hay que ejecutar el SQL comentado en `schema.sql` (sección "ADMIN ROLE").
7. **Los anunciantes también reciben una fila en `profiles`** como
   "conductor", porque el disparador `handle_new_user` se ejecuta con todo
   registro nuevo.
8. **Documentos:** el bucket `documents` debería ser privado, pero el código
   usa `getPublicUrl`, que solo funciona con buckets públicos. Si es privado,
   los enlaces a los documentos no abren; si es público, cualquiera con el
   enlace ve DNI y antecedentes.
9. **Restos de CalmaTEA:** `public/sw.js` intenta guardar páginas que no
   existen (`/sounds`, `/emergency`, `/routines`), lo que puede impedir que se
   instale el modo sin conexión; `SETUP.md`, `scripts/setup-env.mjs` y el
   dominio por defecto de `app/sitemap.xml/route.ts` siguen hablando de
   CalmaTEA.
10. **`vercel.json` usa referencias `@nombre`** (los viejos "Vercel Secrets",
    ya discontinuados). Lo recomendable es cargar las variables en el panel de
    Vercel y quitar ese bloque `env`.
11. **Los números de la portada son inventados** (2.400 vehículos, 8.900
    conductores, 95 %). Conviene cambiarlos o quitarlos antes de lanzar.

---

## 9. 🛠️ Notas para un desarrollador

- Next.js 16: leer `node_modules/next/dist/docs/` antes de tocar código
  (lo pide `AGENTS.md`). `proxy.ts` reemplaza a `middleware.ts`.
- Clientes de Supabase: `lib/supabase/client.ts` (navegador),
  `lib/supabase/server.ts` (componentes de servidor y rutas API) y
  `lib/supabase/middleware.ts` (sesión y redirecciones desde `proxy.ts`).
- Los tipos y constantes de negocio viven en `types/index.ts`.
- Grupos de rutas: `(protected)` usa `BottomNav` según rol; `(advertiser)`
  requiere fila en `advertisers`; `(admin)` requiere `role = 'admin'`.
- Pagos: `app/api/mercadopago/*`, `app/api/payway/*`, `app/api/ads/*`
  (Mercado Pago para anuncios), `app/api/stripe/*` (heredado).
- Anuncios: `GET /api/ads/random` elige un anuncio activo al azar y suma una
  impresión; `components/ui/AdBanner.tsx` lo muestra (a usuarios Premium como
  máximo una vez cada 6 horas).
- No hay tests automatizados. Antes de publicar: `npm run lint`,
  `npm run typecheck`, `npm run build`.
- Cambios en la base: agregarlos a `supabase/schema.sql` y ejecutarlos a mano
  en el SQL Editor (no hay sistema de migraciones).
