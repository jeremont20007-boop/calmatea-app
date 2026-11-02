import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetMocks, supabaseAuth } from '../mocks'
import { GoogleButton } from '@/components/ui/GoogleButton'

describe('GoogleButton', () => {
  beforeEach(() => {
    resetMocks()
    supabaseAuth.signInWithOAuth.mockResolvedValue({ error: null })
  })

  it('inicia el login con Google volviendo a /auth/callback', async () => {
    render(<GoogleButton />)
    await userEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    await waitFor(() => expect(supabaseAuth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({ redirectTo: `${location.origin}/auth/callback` }),
      })
    ))
    expect(screen.getByRole('button', { name: 'Redirigiendo...' })).toBeDisabled()
  })

  it('pasa el rol y la marca de usuario nuevo al callback', async () => {
    render(<GoogleButton label="Registrarme" role="propietario" isNew />)
    await userEvent.click(screen.getByRole('button', { name: 'Registrarme' }))

    const { options } = supabaseAuth.signInWithOAuth.mock.calls[0][0]
    expect(options.redirectTo).toBe(`${location.origin}/auth/callback?role=propietario&new=1`)
  })
})
