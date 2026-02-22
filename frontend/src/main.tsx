import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Listener para mensagens do Service Worker (nova versão disponível)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
      // Dispara um evento global para que o React exiba um banner de atualização
      window.dispatchEvent(new CustomEvent('app:new-version-available'))
    }
  })
}
