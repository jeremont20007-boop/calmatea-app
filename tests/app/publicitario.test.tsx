import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { from, insert, maybeSingle, resetMocks, router, supabaseAuth } from '../mocks'
import PublicitarioAuthPage from '@/app/auth/publicitario/page'

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Empresa / Marca'), '  Remis Neuquén SRL ')
  await userEvent.type(screen.getByLabelText('Email de contacto'), 'remis@example.test')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-segura-123')
  await userEvent.type(screen.getByLabelText('Teléfono (opcional)'), '+54 299 000 0000')
  await userEvent.type(screen.getByLabelText('Sitio web (opcional)'), 'https://remis.example.test')
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
}

describe('Registro de anunciantes', () => {
  beforeEach(resetMocks)

  it('se registra como anunciante: la base crea su cuenta, sin perfil de conductor', async () => {
    supabaseAuth.signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: { access_token: 't' } }, error: null })
    maybeSingle.mockResolvedValue({ data: { id: 'adv-1' }, error: null })
    render(<PublicitarioAuthPage />)
    await fillAndSubmit()

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/ad-dashboard'))
    expect(supabaseAuth.signUp).toHaveBeenCalledWith({
      email: 'remis@example.test',
      password: 'clave-segura-123',
      options: {
        data: {
          account_type: 'advertiser',
          company_name: 'Remis Neuquén SRL',
          phone: '+54 299 000 0000',
          website: 'https://remis.example.test',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    // La fila ya la creó la base: el navegador no la vuelve a insertar
    expect(from).toHaveBeenCalledWith('advertisers')
    expect(insert).not.toHaveBeenCalled()
  })

  it('si Supabase pide confirmar el email, avisa y no intenta crear nada desde el navegador', async () => {
    supabaseAuth.signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: null }, error: null })
    render(<PublicitarioAuthPage />)
    await fillAndSubmit()

    expect(await screen.findByText('Revisá tu email para confirmar tu cuenta, luego iniciá sesión.')).toBeInTheDocument()
    expect(insert).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('compatibilidad: si la base todavía no creó la fila, la crea el navegador como antes', async () => {
    supabaseAuth.signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: { access_token: 't' } }, error: null })
    maybeSingle.mockResolvedValue({ data: null, error: null })
    insert.mockResolvedValue({ error: null })
    render(<PublicitarioAuthPage />)
    await fillAndSubmit()

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/ad-dashboard'))
    expect(insert).toHaveBeenCalledWith({
      user_id: 'u1',
      company_name: 'Remis Neuquén SRL',
      contact_email: 'remis@example.test',
      phone: '+54 299 000 0000',
      website: 'https://remis.example.test',
    })
  })

  it('muestra el error de Supabase (por ejemplo, email ya registrado)', async () => {
    supabaseAuth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'User already registered' } })
    render(<PublicitarioAuthPage />)
    await fillAndSubmit()
    expect(await screen.findByText('User already registered')).toBeInTheDocument()
  })
})
