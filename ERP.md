# ERP — Traspaso de contexto para Claude Code

> Archivo de handoff. Si sos Claude Code en una sesión nueva: leé este archivo completo
> antes de tocar código. Resume una conversación previa (30/08/2026, sesión web) sobre
> facturación y actualización de datos, y define los próximos pasos.

## 1. Objetivo del usuario

El usuario quiere, trabajando desde Claude Code **instalado en su PC local**:

1. **Sacar reportes de facturación** (suscripciones y pagos de la app, y posiblemente
   datos de un sistema de facturación local en esa PC).
2. **Actualizar la base de productos y demás datos** (parte puede vivir en la base
   Supabase de la app y parte en archivos/sistemas locales de la PC).

Aclaración importante de la sesión anterior: se descartó cualquier "conexión remota a la
PC" desde la nube — no es posible ni necesario. La solución acordada es correr Claude
Code localmente en la PC donde están los datos, con este repo clonado.

## 2. Estado del repositorio

- Rama de trabajo: `claude/billing-remote-systems-lmy02x` (este archivo vive ahí).
- No hay cambios de código pendientes de la sesión anterior; solo se agregó este archivo.
- **Leer `AGENTS.md` antes de escribir código**: este proyecto usa una versión de
  Next.js (16.2.9) con breaking changes; la guía está en `node_modules/next/dist/docs/`.

## 3. Mapa del proyecto (lo relevante para facturación)

Stack: Next.js 16 + React 19 + Supabase (auth + Postgres) + Tailwind 4, deploy en Vercel.
Es una app de conexión conductores/propietarios de vehículos (Calmatea), con
suscripciones premium y publicidad paga.

### Pasarelas de pago (en `app/api/`)

| Pasarela | Endpoints | Variables de entorno |
|---|---|---|
| Stripe (suscripción premium) | `api/stripe/checkout`, `api/stripe/webhook`, `api/stripe-portal` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Mercado Pago | `api/mercadopago/checkout`, `api/mercadopago/webhook` | `MP_ACCESS_TOKEN` |
| Payway | `api/payway/checkout`, `api/payway/webhook` | `PAYWAY_API_KEY`, `PAYWAY_SITE_ID`, `PAYWAY_TEMPLATE_ID` |
| Publicidad (Mercado Pago) | `api/ads/checkout`, `api/ads/webhook` | `MP_ACCESS_TOKEN` |

Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`. Ver `.env.example` y `npm run setup` (`scripts/setup-env.mjs`).

### Dónde viven los datos de facturación en Supabase (`supabase/schema.sql`)

- `profiles`: `plan` (`free`/`premium`), `stripe_customer_id`, `stripe_subscription_id`,
  `subscription_status`. Es la fuente de verdad del estado de suscripción.
- `ads`: `total_price numeric(10,2)`, `payment_status` (`pending`/`paid`/`free`),
  `status` (`draft`/`pending_review`/`active`/`paused`/`finished`/`rejected`).
  Facturación de publicidad.
- `advertisers`, `creative_requests`: datos de anunciantes y creatividades.
- Otras tablas: `vehicles`, `applications`, `driver_documents`, `vehicle_documents`,
  `support_tickets`, `ratings`.

**Ojo:** no existe una tabla `products` en el schema. La "base de productos" que el
usuario menciona probablemente es de su sistema local (ERP/facturación en la PC) o algo
aún por crear — confirmar antes de asumir (ver §5).

## 4. Plan de trabajo propuesto

1. **Configurar credenciales locales**: copiar `.env.example` a `.env.local` y completar
   al menos Supabase (URL + service role key) y Stripe. Nunca commitear secretos.
2. **Reportes de facturación** — construir un script (por ej. `scripts/billing-report.mjs`)
   que genere un Excel/CSV con:
   - Suscripciones activas/canceladas desde `profiles` cruzado con la API de Stripe
     (invoices, MRR, churn del período).
   - Ingresos por publicidad desde `ads` (`payment_status = 'paid'`, sumas por período).
   - Pagos de Mercado Pago/Payway según lo que informen sus APIs/webhooks.
3. **Actualización de datos** — según lo que confirme el usuario en §5: scripts de
   carga/actualización masiva contra Supabase (upserts desde CSV/Excel), o procesamiento
   de archivos exportados del sistema local.
4. Commitear en la rama `claude/billing-remote-systems-lmy02x` y pushear.

## 5. Preguntas abiertas (hacérselas al usuario antes de empezar)

1. ¿Qué es exactamente la "base de productos"? ¿Una tabla nueva en Supabase, un Excel /
   sistema de facturación local en la PC, u otra cosa? ¿Dónde está el archivo/sistema?
2. ¿Qué formato y período quiere para los reportes de facturación (Excel mensual,
   por pasarela, consolidado)?
3. ¿Tiene a mano las claves de Supabase/Stripe/Mercado Pago/Payway para el `.env.local`?
4. ¿Los reportes deben incluir solo la app Calmatea o también el sistema local?

## 6. Cómo retomar

En la PC, dentro de la carpeta del repo:

```bash
git fetch origin claude/billing-remote-systems-lmy02x
git checkout claude/billing-remote-systems-lmy02x
claude
```

Y como primer mensaje: **"Leé ERP.md y continuá desde ahí."**
