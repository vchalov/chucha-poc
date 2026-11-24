/**
 * Adds the cross-origin isolation headers a static host will not send.
 *
 * WHY THIS EXISTS. Multi-threaded WebAssembly needs `SharedArrayBuffer`, which
 * needs `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` on the
 * *response*. GitHub Pages serves the PoC and cannot be told to send headers.
 * Without threads the phrase route spends 613 ms per utterance instead of 187
 * (docs/detection.md, 2026-08-12), which is the difference between plausible and
 * hopeless.
 *
 * A service worker sits between the page and the network, so it can add what the
 * host omits: the browser sees the headers, the page becomes isolated, and the
 * host never knew. This is a well-worn pattern for exactly this problem.
 *
 * WHAT IT DOES NOT DO. It does not cache anything. A caching worker in front of
 * a build that is force-pushed on every deploy would serve the specialist a
 * stale app with no way to tell — see scripts/deploy-poc.sh. Every request goes
 * to the network exactly as it would have.
 *
 * Plain JavaScript in `public/` rather than TypeScript in `src/`: it must be
 * served verbatim at a fixed path, because a service worker's scope is its own
 * directory and a hashed bundle filename would move it.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Same-origin only. Every cross-origin request this app makes is a CORS
  // request and therefore already satisfies COEP on its own, so rewriting one
  // would buy nothing — and for the model it would drag 225 MB through this
  // worker on the way past.
  //
  // There are two of them. On the device route the phrase model is the only
  // one. On a build given an inference gateway, the experimental server route
  // adds a second: the warm and recognise calls to that gateway
  // (docs/architecture.md, "Phase-0 experiment"). Neither is touched here.
  if (new URL(request.url).origin !== self.location.origin) return;

  // Range requests are served from OPFS rather than the network here, but a
  // reconstructed Response drops `status: 206` semantics if anything ever does
  // range same-origin. Pass those through untouched rather than being clever.
  if (request.headers.has('range')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Opaque responses have no readable body and no headers to copy.
        if (response.status === 0 || response.type === 'opaque') return response;
        const headers = new Headers(response.headers);
        headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
        headers.set('Cross-Origin-Opener-Policy', 'same-origin');
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      })
      // A network failure must look like a network failure, not like a worker
      // bug: hand the original rejection back untouched.
      .catch((error) => {
        throw error;
      }),
  );
});
