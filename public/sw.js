// VehiLink service worker
//
// - Static build files (/_next/static/*, which have a unique hash in their
//   name) and app icons are served from cache after the first visit, so
//   repeat visits on mobile load almost instantly.
// - Pages (HTML) and API calls always go to the network, so users never see
//   stale or someone else's data. If the phone is offline, a simple
//   "Sin conexión" page is shown instead of the browser error.
const CACHE = 'vehilink-v2'
const PRECACHE_URLS = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']

const OFFLINE_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión – VehiLink</title>
<style>body{font-family:system-ui,sans-serif;background:#F0F3FF;color:#192685;display:flex;min-height:100vh;
align-items:center;justify-content:center;margin:0;padding:24px;text-align:center}
button{margin-top:16px;background:#4455E0;color:#fff;border:0;border-radius:12px;padding:12px 24px;font-weight:700;font-size:16px}</style>
</head><body><div><div style="font-size:48px">📡</div><h1 style="font-size:20px">Sin conexión</h1>
<p>Revisá tu conexión a internet e intentá de nuevo.</p>
<button onclick="location.reload()">Reintentar</button></div></body></html>`

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE_URLS)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Hashed static files: cache first, then network.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
      })
    )
    return
  }

  // Page navigations: always network; offline fallback page if it fails.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(
        () => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      )
    )
  }
  // Everything else (API, RSC data, Supabase…) goes straight to the network.
})
