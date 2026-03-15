/**
 * SendMessage - Extension Background Service Worker (Manifest V3)
 * Centraliza as chamadas de rede para evitar problemas de CORS no Content Script.
 */

// ─── Preload Navigation Fix ──────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
    // Tenta desativar se não for necessário, ou apenas lidar no fetch
    if (self.registration.navigationPreload) {
        self.registration.navigationPreload.disable().catch(() => { });
    }
});

self.addEventListener('activate', (event) => {
    // Garante que o service worker assuma o controle imediatamente
    event.waitUntil(clients.claim());
});

// ─── Message Listener ──────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'apiFetch') {
        const { url, options } = request.params;

        fetch(url, options)
            .then(async (response) => {
                const status = response.status;
                const ok = response.ok;
                let data = null;
                
                try {
                    data = await response.json();
                } catch (e) {
                    data = { error: 'Invalid JSON' };
                }

                sendResponse({ ok, status, data });
            })
            .catch((error) => {
                sendResponse({ ok: false, error: error.message });
            });

        return true; // Mantém o canal aberto para resposta assíncrona
    }
});
