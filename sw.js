/* Only cache a standalone offline explanation. Never store map pages, API data or tiles. */
"use strict";
const CACHE_PREFIX = "air-threat-map-offline-";
const CACHE_NAME = CACHE_PREFIX + "20261028-1";
const SCOPE = new URL(self.registration.scope);
const OFFLINE_URL = new URL("offline.html", SCOPE).href;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.add(new Request(OFFLINE_URL, {cache: "reload"}));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || request.mode !== "navigate" || url.origin !== SCOPE.origin) return;
  // Do not affect other projects on the same github.io domain or non-map URLs.
  if (url.pathname !== SCOPE.pathname && url.pathname !== new URL("index.html", SCOPE).pathname) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request, {cache: "no-store"});
      if (response.ok) return response;
    } catch (_) { /* Fall back to an explanation, never an old map. */ }
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(OFFLINE_URL) || new Response("Map unavailable. An internet connection is required.", {
      status: 503, headers: {"Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store"}
    });
  })());
});
