import fs from 'fs';
import fg from 'fast-glob';

const timestamp = Date.now();

const entries = fg.sync(['**/*.js', '**/*.png', '**/*.css'], {cwd: 'web', ignore: ['sw.js']});

console.log(entries);

const swTemplate = `
const ASSETS = "cache${timestamp}";
const OFFLINES = "offline${timestamp}";


const to_cache = [${entries.map(e =>`"/${e}"`).join(',')}]

const cached = new Set(to_cache);


self.addEventListener('install', function(event){
  event.waitUntil(
    caches
    .open(ASSETS)
    .then(cache => cache.addAll(to_cache))
    .then(() => self.skipWaiting())
  );
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      for (const key of keys) {
				if (key !== ASSETS) await caches.delete(key);
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

  if (url.host === self.location.host && cached.has(url.pathname)) {
		event.respondWith(caches.match(event.request));
		return;
	}

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
`

fs.writeFileSync('./web/sw.js', swTemplate, { encoding: 'utf-8' });