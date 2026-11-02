import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetMocks, router, setSearchParams, supabaseAuth } from '../mocks'
import RegisterPage from '@/app/auth/register/page'

describe('Página de registro', () => {
  beforeEach(resetMocks)

  it('por defecto registra como conductor', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('button', { name: 'Crear cuenta como conductor' })).toBeInTheDocument()
  })

  it('toma el rol de la URL (?role=propietario)', async () => {
    setSearchParams('role=propietario')
    render(<RegisterPage />)
    expect(await screen.findByRole('button', { name: 'Crear cuenta como propietario' })).toBeInTheDocument()
  })

  it('permite cambiar de rol con los botones', async () => {
    render(<RegisterPage />)
    await userEvent.click(screen.getByRole('button', { name: /Propietario/ }))
    expect(screen.getByRole('button', { name: 'Crear cuenta como propietario' })).toBeInTheDocument()
  })

  it('rechaza contraseñas de menos de 8 caracteres sin llamar a Supabase', async () => {
    const { container } = render(<RegisterPage />)
    // Desactivamos la validación nativa del navegador para probar la de la app
    container.querySelector('form')!.noValidate = true
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'María García')
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'maria@example.test')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'corta')
    await userEvent.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()
    expect(supabaseAuth.signUp).not.toHaveBeenCalled()
  })

  it('crea la cuenta con los datos del formulario y va al dashboard', async () => {
    supabaseAuth.signUp.mockResolvedValue({ error: null })
    render(<RegisterPage />)
    await userEvent.click(screen.getByRole('button', { name: /Propietario/ }))
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'María García')
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'maria@example.test')
    await userEvent.type(screen.getByLabelText('Teléfono'), '+54 299 000 0000')
    await userEvent.type(screen.getByLabelText('Ciudad'), 'Neuquén')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-segura')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta como propietario' }))

    await waitFor(() => expect(supabaseAuth.signUp).toHaveBeenCalledWith({
      email: 'maria@example.test',
      password: 'clave-segura',
      options: {
        data: { full_name: 'María García', role: 'propietario', city: 'Neuquén', phone: '+54 299 000 0000' },
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/dashboard'))
  })

  it('muestra el error que devuelve Supabase', async () => {
    supabaseAuth.signUp.mockResolvedValue({ error: { message: 'User already registered' } })
    render(<RegisterPage />)
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'María')
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'maria@example.test')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-segura')
    await userEvent.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    expect(await screen.findByText('User already registered')).toBeInTheDocument()
    expect(router.push).not.toHaveBeenCalled()
  })
})
