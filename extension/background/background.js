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
                        // Resposta nao e JSON (ex: HTML de erro do servidor)
                        console.error('[SM Background] Resposta nao-JSON do servidor:', text.substring(0, 300));
                        data = { _raw: text.substring(0, 200), error: `Resposta inesperada do servidor (status ${status})` };
                    }
                } catch (e) {
                    data = { error: 'Nao foi possivel ler a resposta: ' + e.message };
                }

                sendResponse({ ok, status, data });
            })
            .catch((error) => {
                console.error('[SM Background] Erro de rede:', error.message);
                sendResponse({ ok: false, status: 0, error: error.message });
            });

        return true; 
    }
});
