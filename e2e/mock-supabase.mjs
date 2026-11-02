/**
 * Servidor Supabase FALSO para los tests end-to-end.
 *
 * Imita las rutas mínimas de la API de Supabase (auth + REST) que usa la app,
 * para que los tests de Playwright no necesiten credenciales reales ni toquen
 * la base de producción. Los datos son inventados y viven sólo en memoria.
 *
 * Uso: node e2e/mock-supabase.mjs   (puerto por defecto 54321, o MOCK_SUPABASE_PORT)
 */
import http from 'node:http'

const PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54321)

export const TEST_USER = {
  email: 'conductor@example.test',
  password: 'clave-de-prueba-123',
}
// Mismas credenciales de prueba (inventadas) para todos los usuarios.
const ADMIN_EMAIL = 'admin@example.test'
const ADVERTISER_EMAIL = 'publicidad@example.test'

const USER_ID = '00000000-0000-4000-8000-000000000001'
const PROFILE_ID = '00000000-0000-4000-8000-0000000000a1'
const ADVERTISER = {
  id: '00000000-0000-4000-8000-0000000000b1',
  user_id: USER_ID,
  company_name: 'Publicidad de Prueba SRL',
  contact_email: ADVERTISER_EMAIL,
  status: 'active',
}

function base64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url')
}

// JWT con formato válido pero firma falsa (el mock no verifica firmas).
function fakeJwt(email) {
  const now = Math.floor(Date.now() / 1000)
  return [
    base64url({ alg: 'HS256', typ: 'JWT' }),
    base64url({ sub: USER_ID, email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600 }),
    'firma-falsa',
  ].join('.')
}

function fakeUser(email, metadata = {}) {
  return {
    id: USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: metadata,
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function session(user) {
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: fakeJwt(user.email),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: 'refresh-token-falso',
    user,
  }
}

// Usuario "logueado" actual (estado en memoria)
let currentUser = fakeUser(TEST_USER.email, { full_name: 'Juana Prueba' })
const defaultProfile = () => ({
  id: PROFILE_ID,
  user_id: USER_ID,
  full_name: 'Juana Prueba',
  role: 'conductor',
  city: 'Neuquén',
  plan: 'free',
  created_at: new Date().toISOString(),
})
let profile = defaultProfile()
// Si el usuario actual es un publicitario, no tiene perfil: tiene registro en "advertisers".
let advertiser = null
// Documentos (tabla driver_documents) y archivos del bucket privado "documents"
let driverDocuments = []
const storedFiles = new Map()

function send(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD',
    'Access-Control-Expose-Headers': 'Content-Range',
    ...extraHeaders,
  })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

function readRaw(req) {
  return new Promise(resolve => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

function readBody(req) {
  return new Promise(resolve => {
    let data = ''
    req.on('data', c => (data += c))
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function isAuthorized(req) {
  const auth = req.headers.authorization ?? ''
  const token = auth.replace(/^Bearer\s+/i, '')
  // El anon key falso no es un JWT de usuario; sólo aceptamos tokens emitidos por este mock.
  return token.split('.').length === 3 && token.endsWith('.firma-falsa')
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const path = url.pathname

  if (req.method === 'OPTIONS') return send(res, 204)

  // ── Auth ──────────────────────────────────────────────────────────────
  if (path === '/auth/v1/token' && req.method === 'POST') {
    const body = await readBody(req)
    if (url.searchParams.get('grant_type') === 'password') {
      const knownEmails = [TEST_USER.email, ADMIN_EMAIL, ADVERTISER_EMAIL]
      if (knownEmails.includes(body.email) && body.password === TEST_USER.password) {
        // Cada login reinicia los datos del usuario de prueba correspondiente
        profile = defaultProfile()
        advertiser = null
        driverDocuments = []
        storedFiles.clear()
        if (body.email === ADMIN_EMAIL) profile = { ...profile, full_name: 'Ana Admin', role: 'admin' }
        if (body.email === ADVERTISER_EMAIL) {
          profile = null
          advertiser = { ...ADVERTISER }
        }
        currentUser = fakeUser(body.email, { full_name: profile?.full_name ?? ADVERTISER.company_name })
        return send(res, 200, session(currentUser))
      }
      return send(res, 400, {
        code: 400,
        error_code: 'invalid_credentials',
        msg: 'Invalid login credentials',
      })
    }
    if (url.searchParams.get('grant_type') === 'refresh_token') {
      return send(res, 200, session(currentUser))
    }
    return send(res, 400, { code: 400, error_code: 'unsupported_grant_type', msg: 'unsupported' })
  }

  if (path === '/auth/v1/signup' && req.method === 'POST') {
    const body = await readBody(req)
    if (!body.email || !body.password) {
      return send(res, 422, { code: 422, error_code: 'validation_failed', msg: 'Missing email or password' })
    }
    if (body.email === TEST_USER.email) {
      return send(res, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' })
    }
    const meta = body.data ?? {}
    currentUser = fakeUser(body.email, meta)
    advertiser = null
    profile = {
      ...defaultProfile(),
      full_name: meta.full_name ?? 'Nuevo Usuario',
      role: meta.role ?? 'conductor',
      city: meta.city ?? null,
    }
    return send(res, 200, session(currentUser))
  }

  if (path === '/auth/v1/user') {
    if (!isAuthorized(req)) {
      return send(res, 401, { code: 401, error_code: 'no_authorization', msg: 'invalid JWT' })
    }
    return send(res, 200, currentUser)
  }

  if (path === '/auth/v1/logout') return send(res, 204)

  // ── REST (PostgREST) ──────────────────────────────────────────────────
  if (path.startsWith('/rest/v1/')) {
    const table = path.slice('/rest/v1/'.length)
    const wantsSingle = (req.headers.accept ?? '').includes('application/vnd.pgrst.object+json')

    if (req.method === 'HEAD') {
      return send(res, 200, undefined, { 'Content-Range': '*/0' })
    }

    if (req.method === 'GET') {
      if (table === 'driver_documents') {
        return send(res, 200, isAuthorized(req) ? driverDocuments : [])
      }
      const row = !isAuthorized(req) ? null : table === 'profiles' ? profile : table === 'advertisers' ? advertiser : null
      if (row) {
        return wantsSingle ? send(res, 200, row) : send(res, 200, [row])
      }
      if (wantsSingle) {
        return send(res, 406, {
          code: 'PGRST116',
          message: 'JSON object requested, multiple (or no) rows returned',
          details: 'The result contains 0 rows',
          hint: null,
        })
      }
      return send(res, 200, [], { 'Content-Range': '*/0' })
    }

    if (table === 'driver_documents' && req.method === 'POST' && isAuthorized(req)) {
      const body = await readBody(req)
      for (const row of Array.isArray(body) ? body : [body]) {
        driverDocuments = driverDocuments.filter(d => d.doc_type !== row.doc_type).concat([row])
      }
      return send(res, 201, [])
    }

    // Otras inserciones/actualizaciones: se aceptan sin guardar nada.
    await readBody(req)
    return send(res, 201, [])
  }

  // ── Storage (bucket privado "documents") ─────────────────────────────
  if (path.startsWith('/storage/v1/object/')) {
    const rest = decodeURIComponent(path.slice('/storage/v1/object/'.length))

    // Ver un archivo con link firmado
    if (req.method === 'GET' && rest.startsWith('sign/documents/')) {
      const filePath = rest.slice('sign/documents/'.length)
      const file = storedFiles.get(filePath)
      if (!file || url.searchParams.get('token') !== 'token-falso') return send(res, 400, { message: 'Invalid signature' })
      res.writeHead(200, { 'Content-Type': file.type })
      return res.end(file.body)
    }

    if (req.method === 'POST' && !isAuthorized(req)) return send(res, 403, { message: 'Unauthorized' })

    // Firmar varios: POST /object/sign/documents  { expiresIn, paths }
    if (req.method === 'POST' && rest === 'sign/documents') {
      const body = await readBody(req)
      return send(res, 200, (body.paths ?? []).map(p => storedFiles.has(p)
        ? { path: p, signedURL: `/object/sign/documents/${p}?token=token-falso`, error: null }
        : { path: p, signedURL: null, error: 'Object not found' }))
    }

    // Firmar uno: POST /object/sign/documents/<ruta>
    if (req.method === 'POST' && rest.startsWith('sign/documents/')) {
      const filePath = rest.slice('sign/documents/'.length)
      await readBody(req)
      if (!storedFiles.has(filePath)) return send(res, 400, { message: 'Object not found' })
      return send(res, 200, { signedURL: `/object/sign/documents/${filePath}?token=token-falso` })
    }

    // Subir: POST/PUT /object/documents/<ruta>
    if ((req.method === 'POST' || req.method === 'PUT') && rest.startsWith('documents/')) {
      const filePath = rest.slice('documents/'.length)
      const body = await readRaw(req)
      storedFiles.set(filePath, { body, type: req.headers['content-type'] ?? 'application/octet-stream' })
      return send(res, 200, { Id: filePath, Key: `documents/${filePath}` })
    }

    // El bucket es privado: los links públicos no funcionan
    if (rest.startsWith('public/documents/')) return send(res, 400, { message: 'Bucket not found' })
  }

  if (path === '/__health') return send(res, 200, { ok: true })

  send(res, 404, { message: `mock-supabase: ruta no simulada ${req.method} ${path}` })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`mock-supabase escuchando en http://127.0.0.1:${PORT}`)
})
