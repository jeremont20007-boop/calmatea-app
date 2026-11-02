import { describe, expect, it } from 'vitest'
import { cn, formatDate, formatDuration } from '@/lib/utils'

describe('cn', () => {
  it('une clases y descarta valores vacíos', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c')
  })

  it('acepta objetos condicionales', () => {
    expect(cn({ activo: true, inactivo: false })).toBe('activo')
  })

  it('resuelve conflictos de Tailwind quedándose con la última clase', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    expect(cn('bg-red-500', 'bg-calm-500')).toBe('bg-calm-500')
  })
})

describe('formatDuration', () => {
  it('muestra sólo segundos si es menos de un minuto', () => {
    expect(formatDuration(0)).toBe('0s')
    expect(formatDuration(45)).toBe('45s')
  })

  it('muestra minutos y segundos', () => {
    expect(formatDuration(60)).toBe('1m 0s')
    expect(formatDuration(125)).toBe('2m 5s')
  })
})

describe('formatDate', () => {
  it('formatea en español con día, mes, año y hora', () => {
    const result = formatDate('2026-03-15T14:30:00')
    expect(result).toMatch(/15/)
    expect(result).toMatch(/mar/i)
    expect(result).toMatch(/2026/)
    expect(result).toMatch(/14:30/)
  })
})
