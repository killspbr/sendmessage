/**
 * SendMessage - Extension Background Service Worker (Manifest V3)
 * Centraliza as chamadas de rede para evitar problemas de CORS no Content Script.
 */

// Ao instalar ou atualizar, limpa o estado e desativa o preload de navegação
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            if (self.registration.navigationPreload) {
                await self.registration.navigationPreload.disable();
            }
            await clients.claim();
        })()
    );
});

// Listener de fetch obrigatório para evitar o erro de "preloadResponse"
// Respondemos com a requisição original para não interferir na navegação
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        return; 
    }
});

// ─── Message Listener (API Gateway) ─────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'apiFetch') {
        const { url, options } = request.params;

        fetch(url, options)
            .then(async (response) => {
                const status = response.status;
                const ok = response.ok;
                let data = null;
                
                try {
                    const text = await response.text();
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        data = { _raw: text, error: 'JSON malformado' };
                    }
                } catch (e) {
                    data = { error: 'Não foi possível ler a resposta' };
                }

                sendResponse({ ok, status, data });
            })
            .catch((error) => {
                sendResponse({ ok: false, error: error.message });
            });

        return true; 
    }
});
