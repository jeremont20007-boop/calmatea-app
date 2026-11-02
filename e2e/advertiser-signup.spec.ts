import { expect, test } from '@playwright/test'

test.describe('Registro de anunciantes', () => {
  test('un anunciante nuevo entra a su panel y NO a la parte de conductores', async ({ page }) => {
    await page.goto('/auth/publicitario')
    await page.getByLabel('Empresa / Marca').fill('Remis Neuquén SRL')
    await page.getByLabel('Email de contacto').fill(`remis-${Date.now()}@example.test`)
    await page.getByLabel('Contraseña').fill('clave-segura-123')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()

    await expect(page).toHaveURL(/\/ad-dashboard$/)
    await expect(page.getByRole('banner').getByText('Remis Neuquén SRL')).toBeVisible()
    await expect(page.getByRole('banner').getByText('En revisión')).toBeVisible()

    // Sin perfil de conductor: la parte de conductores lo manda a su panel
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/ad-dashboard$/)
    await page.goto('/vehiculos')
    await expect(page).toHaveURL(/\/ad-dashboard$/)
  })
})
