/**
 * Script interactivo para configurar .env.local
 * Ejecutar: node scripts/setup-env.mjs
 */

import { createInterface } from 'readline'
import { writeFileSync, existsSync } from 'fs'

const rl = createInterface({ input: process.stdin, output: process.stdout })
const q = (question) => new Promise(resolve => rl.question(question, resolve))

console.log('\n🌊 CalmaTEA — Configuración de entorno\n')
console.log('Necesitas estos datos de Supabase y Stripe.\nPulsa Enter para saltar un campo y rellenarlo después.\n')

const values = {}

values.NEXT_PUBLIC_SUPABASE_URL = await q('Supabase URL (https://xxx.supabase.co): ')
values.NEXT_PUBLIC_SUPABASE_ANON_KEY = await q('Supabase Anon Key: ')
values.SUPABASE_SERVICE_ROLE_KEY = await q('Supabase Service Role Key: ')
values.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = await q('Stripe Publishable Key (pk_...): ')
values.STRIPE_SECRET_KEY = await q('Stripe Secret Key (sk_...): ')
values.STRIPE_WEBHOOK_SECRET = await q('Stripe Webhook Secret (whsec_...): ')
values.STRIPE_PREMIUM_PRICE_ID = await q('Stripe Price ID (price_...): ')
values.NEXT_PUBLIC_APP_URL = await q('App URL [http://localhost:3000]: ') || 'http://localhost:3000'

rl.close()

const content = Object.entries(values)
  .map(([k, v]) => `${k}=${v || 'PENDIENTE'}`)
  .join('\n')

if (existsSync('.env.local')) {
  const backup = `.env.local.backup.${Date.now()}`
  console.log(`\n⚠️  Ya existe .env.local — haciendo backup como ${backup}`)
  const { readFileSync } = await import('fs')
  writeFileSync(backup, readFileSync('.env.local'))
}

writeFileSync('.env.local', content + '\n')
console.log('\n✅ .env.local creado correctamente')
console.log('   Ejecuta: npm run dev\n')
