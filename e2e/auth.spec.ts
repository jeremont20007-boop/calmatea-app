import { expect, test } from '@playwright/test'

// Datos inventados que el Supabase falso (e2e/mock-supabase.mjs) acepta.
const TEST_USER = { email: 'conductor@example.test', password: 'clave-de-prueba-123' }

test.describe('Login', () => {
  test('con credenciales incorrectas muestra un error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Correo electrónico').fill(TEST_USER.email)
    await page.getByLabel('Contraseña').fill('clave-equivocada')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText('Email o contraseña incorrectos')).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/login$/)
  })

  test('con credenciales correctas entra al dashboard', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Correo electrónico').fill(TEST_USER.email)
    await page.getByLabel('Contraseña').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Hola conductor,')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Juana/ })).toBeVisible()

    // Con sesión iniciada, volver al login redirige al dashboard
    await page.goto('/auth/login')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('los campos son obligatorios', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/auth\/login$/)
    const valid = await page.getByLabel('Correo electrónico').evaluate(el => (el as HTMLInputElement).validity.valid)
    expect(valid).toBe(false)
  })
})

test.describe('Registro', () => {
  test('contraseña corta: el formulario no se envía', async ({ page }) => {
    await page.goto('/auth/register')
    await page.getByLabel('Nombre completo').fill('María García')
    await page.getByLabel('Correo electrónico').fill('maria@example.test')
    await page.getByLabel('Contraseña').fill('corta')
    await page.getByRole('button', { name: /Crear cuenta/ }).click()
    await expect(page).toHaveURL(/\/auth\/register/)
  })

  test('email ya registrado muestra el error', async ({ page }) => {
    await page.goto('/auth/register')
    await page.getByLabel('Nombre completo').fill('Juana Prueba')
    await page.getByLabel('Correo electrónico').fill(TEST_USER.email)
    await page.getByLabel('Contraseña').fill('otra-clave-123')
    await page.getByRole('button', { name: /Crear cuenta/ }).click()
    await expect(page.getByText('User already registered')).toBeVisible()
  })

  test('registro como propietario entra al dashboard de propietario', async ({ page }) => {
    await page.goto('/auth/register?role=propietario')
    await page.getByLabel('Nombre completo').fill('Pedro Dueño')
    await page.getByLabel('Correo electrónico').fill(`pedro-${Date.now()}@example.test`)
    await page.getByLabel('Ciudad').fill('Neuquén')
    await page.getByLabel('Contraseña').fill('clave-segura-123')
    await page.getByRole('button', { name: 'Crear cuenta como propietario' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Hola propietario,')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Pedro/ })).toBeVisible()
  })
})

test.describe('Publicitarios', () => {
  test('se puede alternar entre registro e inicio de sesión', async ({ page }) => {
    await page.goto('/auth/publicitario')
    await expect(page.getByRole('heading', { name: 'Crear cuenta de publicitario' })).toBeVisible()
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page.getByRole('heading', { name: 'Entrar a mi cuenta' })).toBeVisible()
  })

  test('login de publicitario con clave incorrecta muestra error', async ({ page }) => {
    await page.goto('/auth/publicitario')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await page.getByLabel('Email').fill('publicidad@example.test')
    await page.getByLabel('Contraseña').fill('clave-equivocada')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('Email o contraseña incorrectos.')).toBeVisible()
  })
})
