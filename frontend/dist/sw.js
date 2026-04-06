// Service Worker desativado temporariamente.
// Este arquivo existe apenas para que qualquer SW antigo seja desinstalado ao atualizar.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.matchAll().then(clients => {
  // Força todos os clientes a recarregarem a página com SW desabilitado
  clients.forEach(client => client.navigate(client.url));
}));
// Não intercepta mais fetch — tudo vai direto ao network.
self.addEventListener('fetch', () => {});
