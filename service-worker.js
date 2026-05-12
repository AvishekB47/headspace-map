const CACHE = 'headspace-v1';
const ASSETS = [
  '.',
  'index.html',
  'styles.css',
  'manifest.json',
  'icon_headspace.png',
  'js/app.js',
  'js/addtask.js',
  'js/config.js',
  'js/data.js',
  'js/editor.js',
  'js/geometry.js',
  'js/interaction.js',
  'js/layout.js',
  'js/physics.js',
  'js/render.js',
  'js/state.js',
  'js/todoist.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network-first for Todoist API and Google Fonts
  if (url.hostname.includes('todoist') || url.hostname.includes('google')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // Cache-first for all local assets
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
