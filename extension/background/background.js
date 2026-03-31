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

// Removida escuta inútil de Fetch por causa do Warning de Navigation Preload

// ─── Message Listener (API Gateway) ─────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'apiFetch') {
        const { url, options } = request.params;

        fetch(url, options)
            .then(async (response) => {
                const status = response.status;
                const ok = response.ok;
                const text = await response.text();
                let result = { ok, status, data: null, error: null, rawText: null };

                try {
                    result.data = JSON.parse(text);
                } catch (e) {
                    result.ok = false;
                    result.error = 'Resposta do servidor não está em formato JSON';
                    result.rawText = text;
                }

                sendResponse(result);
            })
            .catch((error) => {
                console.error('[SM Background] Erro critico de rede:', error);
                sendResponse({ ok: false, status: 0, error: 'Falha de rede ou servidor offline: ' + error.message });
            });

        return true; 
    }
});
