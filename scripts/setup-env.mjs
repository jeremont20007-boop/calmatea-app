/**
 * Script interactivo para configurar .env.local
 * Ejecutar: npm run setup
 * Lista completa de variables: docs/VARIABLES.md
 */

import { createInterface } from 'readline'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { randomBytes } from 'crypto'

const rl = createInterface({ input: process.stdin, output: process.stdout })
const q = (question) => new Promise(resolve => rl.question(question, resolve))

console.log('\n🚗 VehiLink — Configuración de entorno\n')
console.log('Pulsá Enter para saltar un campo y completarlo después.\n')

const values = {}

console.log('— Supabase —')
values.NEXT_PUBLIC_SUPABASE_URL = await q('Supabase URL (https://xxx.supabase.co): ')
values.NEXT_PUBLIC_SUPABASE_ANON_KEY = await q('Supabase Anon Key: ')
values.SUPABASE_SERVICE_ROLE_KEY = await q('Supabase Service Role Key: ')
values.NEXT_PUBLIC_APP_URL = (await q('App URL [http://localhost:3000]: ')) || 'http://localhost:3000'

console.log('\n— Mercado Pago —')
values.MP_ACCESS_TOKEN = await q('Mercado Pago Access Token: ')

console.log('\n— PayWay (opcional) —')
values.PAYWAY_API_KEY = await q('PayWay API Key: ')
values.PAYWAY_SITE_ID = await q('PayWay Site ID: ')
values.PAYWAY_TEMPLATE_ID = await q('PayWay Template ID: ')
values.PAYWAY_WEBHOOK_SECRET = randomBytes(24).toString('hex')
console.log('PAYWAY_WEBHOOK_SECRET generado automáticamente.')

rl.close()

const content = Object.entries(values)
  .map(([k, v]) => `${k}=${v}`)
  .join('\n')

if (existsSync('.env.local')) {
  const backup = `.env.local.backup.${Date.now()}`
  console.log(`\n⚠️  Ya existe .env.local — haciendo backup como ${backup}`)
  writeFileSync(backup, readFileSync('.env.local'))
}

writeFileSync('.env.local', content + '\n')
console.log('\n✅ .env.local creado correctamente')
console.log('   Ejecutá: npm run dev\n')
