/* Service worker — offline app shell + background reminders. Bump CACHE to update. */
const CACHE = 'anbu-tracker-v6';
const ASSETS = [
  './', './index.html', './styles.css', './data.js', './foods-db.js', './app.js',
  './manifest.json', './icon.svg',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // never cache supabase API/realtime calls
  if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in')) return;

  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin) {
    // App's own files: NETWORK-FIRST so updates always land; fall back to cache offline.
    e.respondWith(
      fetch(request).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(request, copy)).catch(()=>{}); }
        return res;
      }).catch(() => caches.match(request).then(hit => hit || caches.match('./index.html')))
    );
  } else {
    // Cross-origin (CDN libs): cache-first for speed/offline.
    e.respondWith(
      caches.match(request).then(hit => hit || fetch(request).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(request, copy)).catch(()=>{}); }
        return res;
      }))
    );
  }
});

/* ---- Background daily reminder (Chrome/Android Periodic Background Sync) ---- */
function swIdbGet(key){
  return new Promise(res => {
    try{
      const r = indexedDB.open('anbu', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => { try{ const tx = r.result.transaction('kv','readonly'); const rq = tx.objectStore('kv').get(key); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); }catch(e){ res(null); } };
      r.onerror = () => res(null);
    }catch(e){ res(null); }
  });
}
async function maybeNotify(){
  const cfg = await swIdbGet('reminders');
  if (!cfg || !cfg.enabled) return;
  const last = await swIdbGet('lastOpen');
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  if (last === today) return;                 // already opened/logged today — no nag
  await self.registration.showNotification('🔥 Don’t break your streak', {
    body: 'You haven’t logged today. Tap to keep your streak alive.',
    icon: 'icon.svg', badge: 'icon.svg', tag: 'anbu-daily', data: { url: './' },
  });
}
self.addEventListener('periodicsync', e => { if (e.tag === 'daily-reminder') e.waitUntil(maybeNotify()); });
self.addEventListener('sync', e => { if (e.tag === 'daily-reminder') e.waitUntil(maybeNotify()); });

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) { try { c.navigate && c.navigate('./'); } catch(_){} return c.focus(); } }
    if (clients.openWindow) return clients.openWindow('./');
  })());
});
