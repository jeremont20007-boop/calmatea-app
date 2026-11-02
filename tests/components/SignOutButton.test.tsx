import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetMocks, router, supabaseAuth } from '../mocks'
import { SignOutButton } from '@/components/ui/SignOutButton'

describe('SignOutButton', () => {
  beforeEach(() => {
    resetMocks()
    supabaseAuth.signOut.mockResolvedValue({ error: null })
  })

  it('cierra la sesión y lleva al login', async () => {
    render(<SignOutButton label="Cerrar sesión" />)
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(supabaseAuth.signOut).toHaveBeenCalledOnce()
    expect(router.push).toHaveBeenCalledWith('/auth/login')
    expect(router.refresh).toHaveBeenCalled()
  })

  it('cierra la sesión ANTES de navegar (si no, el sistema lo devuelve a su panel)', async () => {
    const order: string[] = []
    supabaseAuth.signOut.mockImplementation(async () => {
      order.push('signOut')
      return { error: null }
    })
    router.push.mockImplementation(() => order.push('push'))
    render(<SignOutButton />)
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    expect(order).toEqual(['signOut', 'push'])
  })

  it('puede llevar a otra página (por ejemplo, la de publicitarios)', async () => {
    render(<SignOutButton redirectTo="/auth/publicitario" />)
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    expect(router.push).toHaveBeenCalledWith('/auth/publicitario')
  })
})
