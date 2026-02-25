// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig()
    await checkCurrentTab()
})

// ─── Config ───────────────────────────────────────────────────────────────────
async function loadConfig() {
    const data = await chrome.storage.local.get(['backendUrl', 'authToken'])
    if (data.backendUrl) document.getElementById('backendUrl').value = data.backendUrl
    if (data.authToken) document.getElementById('authToken').value = data.authToken
}

async function saveConfig() {
    const backendUrl = document.getElementById('backendUrl').value.trim()
    const authToken = document.getElementById('authToken').value.trim()

    if (!backendUrl) { showToast('⚠️ Informe a URL do backend'); return }
    if (!authToken) { showToast('⚠️ Informe o token'); return }

    await chrome.storage.local.set({ backendUrl, authToken })
    showToast('✅ Configurações salvas!')
}

// ─── Tab check ────────────────────────────────────────────────────────────────
async function checkCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
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
}

// ─── Open sidebar panel ───────────────────────────────────────────────────────
async function openPanel() {
    const data = await chrome.storage.local.get(['backendUrl', 'authToken'])

    if (!data.backendUrl || !data.authToken) {
        showToast('⚠️ Salve a URL e o token antes de abrir o painel!')
        return
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    // Inject content script if not yet loaded
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/content.js']
        })
    } catch { /* already loaded */ }

    // Send open command with config
    await chrome.tabs.sendMessage(tab.id, {
        action: 'openSidebar',
        config: {
            backendUrl: data.backendUrl,
            authToken: data.authToken,
        }
    })

    // Close popup so user can see the sidebar
    window.close()
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg) {
    const t = document.getElementById('toast')
    t.textContent = msg
    t.classList.add('show')
    setTimeout(() => t.classList.remove('show'), 2500)
}
