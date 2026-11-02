import { expect, test } from '@playwright/test'

test.describe('Navegación', () => {
  test('de inicio a login y de login a registro', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/auth\/login$/)
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()

    await page.getByRole('link', { name: 'Regístrate gratis' }).click()
    await expect(page).toHaveURL(/\/auth\/register$/)
    await expect(page.getByRole('button', { name: 'Crear cuenta como conductor' })).toBeVisible()
  })

  test('"Tengo un vehículo" abre el registro como propietario', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Tengo un vehículo/ }).click()
    await expect(page).toHaveURL(/role=propietario/)
    await expect(page.getByRole('button', { name: 'Crear cuenta como propietario' })).toBeVisible()
  })

  test('el enlace "Publicita aquí" abre la página de publicitarios', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('link', { name: 'Publicita aquí' }).click()
    await expect(page).toHaveURL(/\/auth\/publicitario$/)
    await expect(page.getByRole('heading', { name: 'VehiLink Publicidad' })).toBeVisible()
  })

  test('las páginas privadas mandan al login si no hay sesión', async ({ page }) => {
    for (const path of ['/dashboard', '/perfil', '/vehiculos', '/solicitudes', '/admin/dashboard', '/ad-dashboard']) {
      await page.goto(path)
      await expect(page, path).toHaveURL(/\/auth\/login$/)
    }
  })

  test('una ruta inexistente muestra la página 404', async ({ page }) => {
    const res = await page.goto('/auth/esta-pagina-no-existe')
    expect(res?.status()).toBe(404)
  })
})
