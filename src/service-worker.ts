/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { self } from '$app/service-worker';
import { assets, immutable } from '$app/manifest';
import { version } from '$app/env';

/**
 * Offline support. The app code, fonts, icons and every sound clip are
 * cached on install (about 3 MB), so practice works with no connection.
 * Every route is the same app shell, so any page loads offline from "/".
 */
const CACHE = `sound-garden-${version}`;
const PRECACHE = ['/', ...immutable.map((f) => f.path), ...assets.map((f) => f.path)];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	if (url.origin !== self.location.origin) return;

	// Pages: network first so updates arrive, then the cached shell.
	if (req.mode === 'navigate') {
		event.respondWith(
			fetch(req).catch(async () => (await caches.match(req)) ?? (await caches.match('/'))!)
		);
		return;
	}

	// Everything else: cache first; files are versioned or never change.
	event.respondWith(
		caches.match(req).then(
			(hit) =>
				hit ??
				fetch(req).then((res) => {
					if (res.ok && res.type === 'basic') {
						const copy = res.clone();
						caches.open(CACHE).then((c) => c.put(req, copy));
					}
					return res;
				})
		)
	);
});
