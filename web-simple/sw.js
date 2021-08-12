const OFFLINES = "offline1627110916893";



self.addEventListener('install', function(event){
  event.waitUntil(
    caches
    .open(OFFLINES)
    .then(() => self.skipWaiting())
  );
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      for (const key of keys) {
				if (key !== OFFLINES) await caches.delete(key);
			}

      self.clients.claim();
    })
  )
})


self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET' || event.request.headers.has('range')) return;

  const url = new URL(event.request.url);

  if (!url.protocol.startsWith('http')) return;

  if (url.hostname === self.location.hostname && url.port !== self.location.port) return;

  if (event.request.cache === 'only-if-cached') return;

  event.respondWith(
		caches
			.open(OFFLINES)
			.then(async cache => {
				try {
					const response = await fetch(event.request);
					cache.put(event.request, response.clone());
					return response;
				} catch(err) {
					const response = await cache.match(event.request);
					if (response) return response;

					throw err;
				}
			})
	);
});
