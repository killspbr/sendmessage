/**
 * SendMessage - Extension Background Service Worker (Manifest V3)
 * Centraliza as chamadas de rede para evitar problemas de CORS no Content Script.
 */

// Ao instalar ou atualizar, limpa o estado e desativa o preload de navegação
chrome.runtime.onInstalled.addListener(async () => {
    const registrations = await self.registration.getNavigationPreload?.();
    if (registrations) {
        await self.registration.navigationPreload.disable();
    }
    console.log('SM Extractor: Service Worker Instalado e Preload Desativado.');
});

// Garante que o SW assuma controle imediato sem interceptar fetch desnecessário
self.addEventListener('activate', (event) => {
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
