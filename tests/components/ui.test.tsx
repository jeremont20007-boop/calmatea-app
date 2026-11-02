import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'

describe('Button', () => {
  it('muestra el texto y responde al click', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Guardar</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('no responde si está deshabilitado', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Guardar</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('aplica la variante y tamaño indicados', () => {
    render(<Button variant="danger" size="sm">Borrar</Button>)
    const btn = screen.getByRole('button', { name: 'Borrar' })
    expect(btn).toHaveClass('bg-red-500')
    expect(btn).toHaveClass('text-sm')
  })
})

describe('Input', () => {
  it('asocia la etiqueta con el campo', async () => {
    render(<Input id="email" label="Correo" />)
    const input = screen.getByLabelText('Correo')
    await userEvent.type(input, 'hola@example.test')
    expect(input).toHaveValue('hola@example.test')
  })

  it('muestra el mensaje de error', () => {
    render(<Input id="x" label="Campo" error="Obligatorio" />)
    expect(screen.getByText('Obligatorio')).toBeInTheDocument()
    expect(screen.getByLabelText('Campo')).toHaveClass('border-red-400')
  })
})

describe('Card', () => {
  it('renderiza contenido y es clickeable si tiene onClick', async () => {
    const onClick = vi.fn()
    render(
      <Card onClick={onClick}>
        <CardTitle>Mi auto</CardTitle>
      </Card>
    )
    await userEvent.click(screen.getByText('Mi auto'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
