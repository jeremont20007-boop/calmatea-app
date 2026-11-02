import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)
const MOCK_SUPABASE_PORT = 54321
const baseURL = `http://localhost:${PORT}`

/**
 * Tests end-to-end. Levantan dos servidores:
 *  1. Un Supabase FALSO (e2e/mock-supabase.mjs) con datos inventados.
 *  2. La app Next.js apuntando a ese Supabase falso.
 * Así nunca se usan claves reales ni se toca la base de producción.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // el Supabase falso guarda estado en memoria
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    locale: 'es-AR',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'node e2e/mock-supabase.mjs',
      url: `http://127.0.0.1:${MOCK_SUPABASE_PORT}/__health`,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_SUPABASE_PORT: String(MOCK_SUPABASE_PORT) },
    },
    {
      command: `npx next dev --port ${PORT}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        // Valores falsos: tienen prioridad sobre cualquier .env.local real.
        NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${MOCK_SUPABASE_PORT}`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-falso-para-tests',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-falso-para-tests',
        STRIPE_SECRET_KEY: 'sk_test_falso',
        NEXT_PUBLIC_APP_URL: baseURL,
        NEXT_TELEMETRY_DISABLED: '1',
      },
    },
  ],
})
