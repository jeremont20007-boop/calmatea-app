import { expect, test } from '@playwright/test'

// Datos inventados que acepta el Supabase falso (e2e/mock-supabase.mjs).
const TEST_USER = { email: 'conductor@example.test', password: 'clave-de-prueba-123' }

test.describe('Documentos personales (bucket privado)', () => {
  test('la conductora sube su DNI y lo ve con un link temporal, también al volver a entrar', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Correo electrónico').fill(TEST_USER.email)
    await page.getByLabel('Contraseña').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)

    await page.goto('/perfil/documentos')
    await expect(page.getByText('DNI (frente)')).toBeVisible()

    // Subir el archivo al DNI (frente)
    const card = page.locator('[data-doc-type="dni_frente"]')
    await card.locator('input[type=file]').setInputFiles({
      name: 'dni.png',
      mimeType: 'image/png',
      buffer: Buffer.from('imagen-de-prueba'),
    })
    await expect(card.getByText('En revisión')).toBeVisible()

    // El link para verlo es temporal y firmado, no público
    const link = card.getByTitle('Ver documento')
    const href = await link.getAttribute('href')
    expect(href).toContain('/storage/v1/object/sign/documents/')
    expect(href).not.toContain('/object/public/')
    const file = await page.request.get(href!)
    expect(file.status()).toBe(200)
    // (el Supabase falso guarda el archivo tal como lo manda el navegador, dentro de un formulario)
    expect(await file.text()).toContain('imagen-de-prueba')

    // Al recargar, el servidor genera un link temporal nuevo
    await page.reload()
    const cardAfter = page.locator('[data-doc-type="dni_frente"]')
    await expect(cardAfter.getByText('En revisión')).toBeVisible()
    await expect(cardAfter.getByTitle('Ver documento')).toHaveAttribute('href', /\/object\/sign\/documents\//)
  })
})
