# Glosario

Términos técnicos que aparecen en la documentación y en GitHub, Vercel y
Supabase, explicados con palabras simples. Están en orden alfabético.

- **API / ruta API**: Una "ventanilla" del servidor a la que otros programas (o la propia app) le piden cosas. En este proyecto están en `app/api/`; por ejemplo, `/api/mercadopago/checkout` crea un link de pago.

- **Bucket**: Una "carpeta" de archivos dentro de Supabase Storage. Acá hay dos: `documents` (documentos personales) y `ads-media` (imágenes de anuncios).

- **Build**: El proceso de "armar" la app para publicarla: convertir el código en archivos listos para servir. Lo hace Vercel con `npm run build`. Si el build falla, no se publica la versión nueva.

- **Commit**: Un "guardado" con nombre en la historia del código. Cada commit tiene un mensaje que explica qué se cambió, y permite volver atrás si hace falta.

- **Deploy (despliegue / publicación)**: Poner una versión del código en internet. En Vercel cada deploy tiene su propio enlace y su registro.

- **Dominio**: La dirección del sitio (por ejemplo `vehilink.com.ar`). Vercel da uno gratis terminado en `.vercel.app`; se puede conectar uno propio.

- **`.env.local` / `.env.example`**: `.env.local` es el archivo con tus claves reales para correr la app en tu computadora (nunca se sube a GitHub). `.env.example` es la plantilla vacía que sí está en el repositorio.

- **Freemium**: Modelo donde la app es gratis con límites y se paga (Premium) para quitarlos.

- **Git**: El programa que lleva la historia de cambios del código.

- **GitHub**: El sitio web donde se guarda el repositorio y se colabora (pull requests, comentarios, revisiones).

- **Login / Autenticación (Auth)**: El sistema que verifica quién es cada usuario (email y contraseña, o Google). Acá lo maneja Supabase Auth.

- **Merge (unir)**: Incorporar los cambios de una rama a otra. Hacer merge de un pull request a la rama principal es lo que dispara la publicación en producción.

- **Next.js**: La herramienta (framework) con la que está hecha la app. Organiza las páginas según las carpetas dentro de `app/`.

- **Node.js / npm**: Node.js permite ejecutar el código en la computadora o el servidor. npm es su "tienda" de librerías: `npm install` descarga todo lo que el proyecto necesita.

- **OAuth**: El mecanismo que permite "Iniciar sesión con Google" sin que la app vea tu contraseña de Google.

- **Producción**: La versión real del sitio, la que usan las personas. Lo opuesto a "local" (tu computadora) o "vista previa".

- **Proxy (`proxy.ts`)**: En esta versión de Next.js, el archivo que se ejecuta antes de cada página para decidir si dejar pasar al usuario o mandarlo al login. Antes se llamaba "middleware".

- **Pull request (PR)**: Un pedido para unir los cambios de una rama a otra. Permite ver qué cambió, comentar, probar la vista previa y recién después aprobar (merge).

- **PWA (Progressive Web App)**: Una página web que se puede "instalar" en el celular y se ve como una app, con su ícono propio.

- **Rama (branch)**: Una copia paralela del código para trabajar sin afectar la versión principal. La **rama principal** (por defecto) es la que se publica en producción; en este repositorio se llama `claude/determined-bohr-l0lwue`.

- **Repositorio (repo)**: La carpeta del proyecto con todo su código y su historia de cambios. Este es `calmatea-app` en GitHub.

- **RLS (Row Level Security, seguridad por fila)**: Reglas de Supabase que deciden qué filas de cada tabla puede ver o cambiar cada usuario. Por ejemplo: "cada uno ve solo su propio perfil".

- **Rol**: El tipo de usuario: conductor, propietario, admin; los anunciantes se manejan aparte.

- **Rollback**: Volver a una versión anterior que funcionaba. En Vercel se hace desde *Deployments* → ⋯ → *Promote to Production* / *Instant Rollback*.

- **Schema (esquema)**: La definición de la base de datos: qué tablas hay, qué columnas tiene cada una y qué reglas aplican. Está en `supabase/schema.sql`.

- **Service role key**: La clave "maestra" de Supabase que saltea las reglas de seguridad. Es la más sensible de todas.

- **Service worker**: Un pequeño programa que el navegador guarda para que la app cargue más rápido o sin conexión (`public/sw.js`).

- **SQL / SQL Editor**: SQL es el lenguaje para consultar y modificar bases de datos. El *SQL Editor* de Supabase es donde se pega y ejecuta ese código.

- **Supabase**: El servicio que guarda los datos de la app (base de datos PostgreSQL), maneja el login y almacena archivos. Se administra desde supabase.com.

- **Tabla**: Como una hoja de cálculo dentro de la base de datos: filas (registros) y columnas (datos). Ej.: `vehicles`, `profiles`.

- **Tailwind CSS**: La herramienta usada para los estilos (colores, tamaños, espacios). Por eso en el código se ven cosas como `text-calm-800` o `rounded-xl`.

- **Ticket**: Una consulta de soporte que un usuario envía desde `/soporte`.

- **TypeScript**: El lenguaje en el que está escrito el código: JavaScript con comprobaciones extra que evitan errores.

- **Variable de entorno**: Un dato de configuración (por ejemplo una clave secreta) que se guarda fuera del código, en Vercel o en el archivo `.env.local`. Ver [VARIABLES.md](VARIABLES.md).

- **Vercel**: El servicio que publica el sitio en internet. Está conectado a GitHub y publica automáticamente cada vez que se hace merge a la rama principal.

- **Vista previa (Preview deployment)**: Una publicación de prueba que Vercel crea para cada pull request, con su propio enlace, sin tocar el sitio real.

- **Webhook**: Un aviso automático que un servicio externo manda a la app. Por ejemplo, Mercado Pago avisa a `/api/mercadopago/webhook` cuando un pago se aprueba, para activar el plan Premium.
