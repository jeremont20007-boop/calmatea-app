import { expect, test } from '@playwright/test'

test.describe('Página de inicio', () => {
  test('carga con el título y las llamadas a la acción', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Conectamos conductores')
    await expect(page.getByRole('link', { name: /Soy conductor/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Tengo un vehículo/ })).toBeVisible()
    await expect(page.getByText('¿Cómo funciona?')).toBeVisible()
  })

  test('no tiene errores en la consola', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])
  })

  test('responde los archivos públicos sin pedir login', async ({ request }) => {
    for (const path of ['/robots.txt', '/sitemap.xml', '/manifest.json']) {
      const res = await request.get(path, { maxRedirects: 0 })
      expect(res.status(), path).toBe(200)
    }
  })
})
