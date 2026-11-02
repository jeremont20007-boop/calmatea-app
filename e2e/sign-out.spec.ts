import { expect, test, type Page } from '@playwright/test'

// Usuarios inventados que acepta el Supabase falso (e2e/mock-supabase.mjs).
const PASSWORD = 'clave-de-prueba-123'

async function login(page: Page, email: string) {
  await page.goto('/auth/login')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test.describe('Cerrar sesión', () => {
  test('el admin entra a su panel y "Cerrar sesión" lo saca de verdad', async ({ page }) => {
    await login(page, 'admin@example.test')
    await expect(page).toHaveURL(/\/admin\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible()

    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(page).toHaveURL(/\/auth\/login$/)
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()

    // Ya sin sesión: el panel de admin vuelve a pedir login
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/auth\/login$/)
  })

  test('el publicitario sale y la sesión queda cerrada', async ({ page }) => {
    await page.goto('/auth/publicitario')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await page.getByLabel('Email').fill('publicidad@example.test')
    await page.getByLabel('Contraseña').fill(PASSWORD)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/ad-dashboard$/)
    await expect(page.getByRole('banner').getByText('Publicidad de Prueba SRL')).toBeVisible()

    await page.getByRole('button', { name: 'Salir' }).click()
    await expect(page).toHaveURL(/\/auth\/login$/)

    await page.goto('/ad-dashboard')
    await expect(page).toHaveURL(/\/auth\/login$/)
  })
})
