// ─── Dual-layer storage (localStorage + chrome.storage.local) ────────────────
// localStorage funciona SEMPRE em contexto de extensão Chrome.
// chrome.storage.local é usado como backup extra.

function storageSave(key, value) {
    try { localStorage.setItem(key, value) } catch (_) { }
    try { chrome.storage.local.set({ [key]: value }) } catch (_) { }
}

function storageGet(key) {
    // Primeiro tenta localStorage (mais confiável no popup)
    const local = localStorage.getItem(key)
    if (local) return Promise.resolve(local)
    // Fallback para chrome.storage.local
    return new Promise((resolve) => {
        try {
            chrome.storage.local.get([key], (data) => {
                resolve(data[key] || '')
            })
        } catch (_) {
            resolve('')
        }
    })
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig()
    checkCurrentTab()
})

// ─── Config ───────────────────────────────────────────────────────────────────
async function loadConfig() {
    const backendUrl = await storageGet('sm_backendUrl')
    const authToken = await storageGet('sm_authToken')

    if (backendUrl) document.getElementById('backendUrl').value = backendUrl
    if (authToken) document.getElementById('authToken').value = authToken

    if (backendUrl && authToken) {
        const btn = document.getElementById('btnSave')
        btn.textContent = '✅ Configurado'
        btn.style.background = '#059669'
    }
}

function saveConfig() {
    const backendUrl = document.getElementById('backendUrl').value.trim()
    const authToken = document.getElementById('authToken').value.trim()

    if (!backendUrl) { showToast('⚠️ Informe a URL do backend'); return }
    if (!authToken) { showToast('⚠️ Informe o token'); return }

    // Salva em ambas as camadas
    storageSave('sm_backendUrl', backendUrl)
    storageSave('sm_authToken', authToken)

    // Verifica se realmente salvou no localStorage
    const check = localStorage.getItem('sm_backendUrl')
    if (check === backendUrl) {
        showToast('✅ Configurações salvas com sucesso!')
        const btn = document.getElementById('btnSave')
        const original = btn.textContent
        btn.textContent = '✅ Salvo!'
        btn.style.background = '#059669'
        setTimeout(() => { btn.textContent = original }, 2000)
    } else {
        showToast('❌ Falha ao salvar. Recarregue a extensão em chrome://extensions/')
    }
}

// ─── Tab check ────────────────────────────────────────────────────────────────
function checkCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        const isGoogleMaps = tab?.url?.includes('google.com/maps') || tab?.url?.includes('maps.google.com')
        const dot = document.getElementById('statusDot')
        const text = document.getElementById('statusText')
        const onMaps = document.getElementById('onMapsArea')
        const notMaps = document.getElementById('notMapsArea')

        if (isGoogleMaps) {
            dot.className = 'dot ok'
            text.textContent = '✓ Google Maps detectado'
            onMaps.style.display = 'block'
            notMaps.style.display = 'none'
        } else {
            dot.className = 'dot warn'
            text.textContent = 'Abra o Google Maps primeiro'
            onMaps.style.display = 'none'
            notMaps.style.display = 'block'
        }
    })
}

// ─── Open sidebar ─────────────────────────────────────────────────────────────
async function openPanel() {
    const backendUrl = localStorage.getItem('sm_backendUrl') || await storageGet('sm_backendUrl')
    const authToken = localStorage.getItem('sm_authToken') || await storageGet('sm_authToken')

    if (!backendUrl || !authToken) {
        showToast('⚠️ Salve a URL e o token primeiro!')
        return
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
        // Injeta o content script se ainda não estiver rodando
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content/content.js']
            })
        } catch (_) { /* já carregado */ }

        // Abre o painel com a config
        chrome.tabs.sendMessage(tab.id, {
            action: 'openSidebar',
            config: { backendUrl, authToken }
        }, (response) => {
            if (chrome.runtime.lastError) {
                showToast('❌ Recarregue a página do Maps (F5) e tente novamente.')
                return
            }
            window.close()
        })
    })
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg) {
    const t = document.getElementById('toast')
    t.textContent = msg
    t.classList.add('show')
    setTimeout(() => t.classList.remove('show'), 3000)
}
