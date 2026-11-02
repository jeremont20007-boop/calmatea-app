import { vi } from 'vitest'

/**
 * Mocks compartidos: cliente de Supabase del navegador y router de Next.
 * Ningún test habla con un Supabase real.
 */
export const router = { push: vi.fn(), refresh: vi.fn(), replace: vi.fn(), back: vi.fn() }
export let searchParams = new URLSearchParams()
export function setSearchParams(qs: string) {
  searchParams = new URLSearchParams(qs)
}

export const supabaseAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
}

export const insert = vi.fn()
export const updateEq = vi.fn()
export const from = vi.fn(() => ({
  insert,
  update: () => ({ eq: updateEq }),
}))

export function resetMocks() {
  Object.values(router).forEach(fn => fn.mockReset())
  Object.values(supabaseAuth).forEach(fn => fn.mockReset())
  insert.mockReset()
  updateEq.mockReset()
  from.mockClear()
  setSearchParams('')
}

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
  usePathname: () => '/',
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: supabaseAuth, from }),
}))
