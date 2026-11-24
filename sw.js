const CACHE = 'gimnasio-v1';
const ARCHIVOS = ['./', 'index.html', 'app.css', 'gym.css', 'd3.min.js', 'shim.js', 'catalogo.js', 'gym-base.js', 'gym-calc.js', 'gym-rpg.js', 'gym-ui.js', 'gym-cuerpo.js', 'gym-log.js', 'gym-app.js', 'manifest.webmanifest', 'icono-192.png', 'icono-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});
