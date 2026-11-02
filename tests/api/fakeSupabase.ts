import { vi } from 'vitest'

/**
 * Supabase falso en memoria para tests de rutas de servidor.
 * Soporta: from(t).select().eq().single() y from(t).update(v).eq().
 */
export function createFakeSupabase(tables: Record<string, Record<string, unknown>[]>) {
  const updates: { table: string; values: Record<string, unknown>; column: string; value: unknown }[] = []
  let updateError: unknown = null

  const client = {
    from(table: string) {
      return {
        select() {
          return {
            eq(column: string, value: unknown) {
              return {
                async single() {
                  const row = (tables[table] ?? []).find(r => r[column] === value)
                  return row ? { data: row, error: null } : { data: null, error: { code: 'PGRST116' } }
                },
              }
            },
          }
        },
        update(values: Record<string, unknown>) {
          return {
            async eq(column: string, value: unknown) {
              if (updateError) return { error: updateError }
              updates.push({ table, values, column, value })
              for (const row of tables[table] ?? []) if (row[column] === value) Object.assign(row, values)
              return { error: null }
            },
          }
        },
      }
    },
  }

  return {
    client,
    updates,
    failUpdates(err: unknown = { message: 'db down' }) {
      updateError = err
    },
  }
}

export function mockMercadoPagoPayment(payment: Record<string, unknown> | null, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: payment !== null && status < 400,
    status,
    json: () => Promise.resolve(payment),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function post(url: string, body?: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
