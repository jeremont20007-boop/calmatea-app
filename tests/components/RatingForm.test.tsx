import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { from, insert, resetMocks, router, updateEq } from '../mocks'
import { RatingForm } from '@/app/(protected)/calificar/[userId]/RatingForm'

const props = { fromUserId: 'p1', toUserId: 'p2', toUserName: 'Carlos', vehicleId: 'v1' }

describe('RatingForm (calificación 1 a 7)', () => {
  beforeEach(resetMocks)

  it('el botón está deshabilitado hasta elegir estrellas', () => {
    render(<RatingForm {...props} />)
    expect(screen.getByRole('button', { name: 'Enviar calificación' })).toBeDisabled()
  })

  it('muestra la etiqueta correspondiente a la nota', async () => {
    render(<RatingForm {...props} />)
    await userEvent.click(screen.getByRole('button', { name: '7 estrellas' }))
    expect(screen.getByText('Sobresaliente ⭐')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '1 estrella' }))
    expect(screen.getByText('Muy malo')).toBeInTheDocument()
  })

  it('guarda una calificación nueva y vuelve a solicitudes', async () => {
    insert.mockResolvedValue({ error: null })
    render(<RatingForm {...props} />)
    await userEvent.click(screen.getByRole('button', { name: '5 estrellas' }))
    await userEvent.type(screen.getByPlaceholderText(/Contanos/), '  Muy puntual  ')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar calificación' }))

    await waitFor(() => expect(from).toHaveBeenCalledWith('ratings'))
    await waitFor(() => expect(insert).toHaveBeenCalledWith({
      from_user_id: 'p1',
      to_user_id: 'p2',
      vehicle_id: 'v1',
      rating: 5,
      comment: 'Muy puntual',
    }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/solicitudes'))
  })

  it('muestra error si falla el guardado', async () => {
    insert.mockResolvedValue({ error: { message: 'rls' } })
    render(<RatingForm {...props} />)
    await userEvent.click(screen.getByRole('button', { name: '3 estrellas' }))
    await userEvent.click(screen.getByRole('button', { name: 'Enviar calificación' }))
    expect(await screen.findByText('Error al guardar la calificación.')).toBeInTheDocument()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('actualiza una calificación existente', async () => {
    updateEq.mockResolvedValue({ error: null })
    render(<RatingForm {...props} existingRating={4} existingComment="ok" existingRatingId="r1" />)
    await userEvent.click(screen.getByRole('button', { name: '6 estrellas' }))
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar calificación' }))
    await waitFor(() => expect(updateEq).toHaveBeenCalledWith('id', 'r1'))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/solicitudes'))
  })
})
