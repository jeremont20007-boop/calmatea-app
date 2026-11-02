import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetMocks, router, supabaseAuth } from '../mocks'
import LoginPage from '@/app/auth/login/page'

async function fillAndSubmit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Correo electrónico'), email)
  await userEvent.type(screen.getByLabelText('Contraseña'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('Página de login', () => {
  beforeEach(resetMocks)

  it('inicia sesión y va al dashboard con credenciales correctas', async () => {
    supabaseAuth.signInWithPassword.mockResolvedValue({ error: null })
    render(<LoginPage />)
    await fillAndSubmit('juana@example.test', 'clave-123456')

    await waitFor(() => expect(supabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'juana@example.test',
      password: 'clave-123456',
    }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/dashboard'))
  })

  it('muestra un error con credenciales incorrectas', async () => {
    supabaseAuth.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    render(<LoginPage />)
    await fillAndSubmit('juana@example.test', 'mala')

    expect(await screen.findByText('Email o contraseña incorrectos')).toBeInTheDocument()
    expect(router.push).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
  })

  it('tiene enlaces a registro y a publicitarios', () => {
    render(<LoginPage />)
    expect(screen.getByRole('link', { name: 'Regístrate gratis' })).toHaveAttribute('href', '/auth/register')
    expect(screen.getByRole('link', { name: 'Publicita aquí' })).toHaveAttribute('href', '/auth/publicitario')
  })
})
