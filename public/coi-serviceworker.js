/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener('message', (ev) => {
    if (!ev.data) return;
    if (ev.data.type === 'deregister') {
      self.registration
        .unregister()
        .then(() => self.clients.matchAll())
        .then((clients) => {
          clients.forEach((client) => client.navigate(client.url));
        });
    }
  });

  self.addEventListener('fetch', function (event) {
    const { request } = event;
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 0) {
            return response;
          }

          const newHeaders = new Headers(response.headers);
          newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
          newHeaders.set(
            'Cross-Origin-Embedder-Policy',
            coepCredentialless ? 'credentialless' : 'require-corp'
          );
          newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        })
        .catch((e) => console.error('[COI-SW] Fetch error:', e))
    );
  });
} else {
  (() => {
    const isIsolated = window.crossOriginIsolated;
    if (isIsolated) return;

    // Do not attempt to register if not in a secure context (service workers require HTTPS or localhost)
    if (!window.isSecureContext) {
      console.warn(
        '[CodeSpace] Cross-origin isolation requires a Secure Context (HTTPS or localhost). Current origin:',
        window.location.origin
      );
      return;
    }

    if ('serviceWorker' in navigator) {
      const swUrl = '/coi-serviceworker.js';
      navigator.serviceWorker.register(swUrl).then(
        (registration) => {
          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (installing) {
              installing.addEventListener('statechange', () => {
                if (installing.state === 'activated' && !window.crossOriginIsolated) {
                  window.location.reload();
                }
              });
            }
          });
          if (registration.active && !window.crossOriginIsolated) {
            window.location.reload();
          }
        },
        (err) => {
          console.warn('[CodeSpace] ServiceWorker COI registration skipped or failed:', err);
        }
      );
    }
  })();
}

