# CalmaTEA — Guía de configuración

## 1. Supabase

### Crear proyecto
1. Ve a [supabase.com](https://supabase.com) → New Project
2. Pon nombre: `calmatea`, elige región (Europe West)
3. Genera una contraseña segura para la DB y guárdala

### Ejecutar el schema SQL
1. En tu proyecto Supabase → **SQL Editor** → New Query
2. Pega el contenido de `supabase/schema.sql` y ejecuta
3. Verifica que se crearon las tablas: `profiles`, `emotion_logs`, `sound_sessions`, `routine_progress`

### Obtener las credenciales
1. **Settings** → **API**
2. Copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### Configurar Auth
1. **Authentication** → **Providers** → activa **Email**
2. Desactiva "Confirm email" para desarrollo (Settings → Auth → desactiva "Enable email confirmations")
3. En producción, configura el **Site URL**: `https://tu-dominio.vercel.app`
4. Añade en **Redirect URLs**: `https://tu-dominio.vercel.app/auth/callback`

---

## 2. Stripe

### Crear cuenta y producto
1. Ve a [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Products** → **Add Product**
   - Nombre: `CalmaTEA Premium`
   - Precio: `4.99 EUR` / mes (recurring)
3. Copia el **Price ID** (empieza con `price_...`) → `STRIPE_PREMIUM_PRICE_ID`

### Obtener claves API
1. **Developers** → **API Keys**
2. Copia:
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`

### Configurar Webhook
1. **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://tu-dominio.vercel.app/api/stripe/webhook`
3. Selecciona eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copia el **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Probar en local con Stripe CLI
```bash
# Instalar Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# En otra terminal:
npm run dev
```

### Configurar Portal de Cliente (para cancelaciones)
1. **Settings** → **Billing** → **Customer portal** → activar

---

## 3. Vercel

### Desplegar
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Variables de entorno en Vercel
En **Project Settings** → **Environment Variables**, añade:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo servidor) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key de Stripe |
| `STRIPE_SECRET_KEY` | Secret key de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Signing secret del webhook |
| `STRIPE_PREMIUM_PRICE_ID` | Price ID del plan Premium |
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.vercel.app` |

### Después del deploy
1. Actualiza en Supabase → Auth → Site URL con tu dominio Vercel
2. Actualiza la URL del webhook en Stripe
3. Añade el dominio a los Redirect URLs de Supabase

---

## 4. Desarrollo local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales reales

# Iniciar servidor de desarrollo
npm run dev

# Visita http://localhost:3000
```

## 5. Sonidos

Los sonidos se generan proceduralmente con Web Audio API — **no necesitas archivos MP3**.
Funciona 100% en el navegador sin conexión.

Si en el futuro prefieres archivos MP3 reales, colócalos en `public/sounds/`:
- `rain.mp3`
- `ocean.mp3`
- `white-noise.mp3`
- `brown-noise.mp3`
- `forest.mp3`

Y actualiza `lib/sounds.ts` para que apunten a esos archivos.
