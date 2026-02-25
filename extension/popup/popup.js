// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadConfig()
    checkCurrentTab()
})

// ─── Config — usa chrome.storage.sync (persiste entre sessões) ─────────────────
function loadConfig() {
    chrome.storage.sync.get(['smBackendUrl', 'smAuthToken'], (data) => {
        if (chrome.runtime.lastError) {
            console.error('[SM] Erro ao carregar config:', chrome.runtime.lastError)
            return
        }
        if (data.smBackendUrl) {
            document.getElementById('backendUrl').value = data.smBackendUrl
        }
        if (data.smAuthToken) {
            document.getElementById('authToken').value = data.smAuthToken
        }
        updateSaveStatus(data.smBackendUrl, data.smAuthToken)
    })
}

function saveConfig() {
    const backendUrl = document.getElementById('backendUrl').value.trim()
    const authToken = document.getElementById('authToken').value.trim()

    if (!backendUrl) { showToast('⚠️ Informe a URL do backend'); return }
    if (!authToken) { showToast('⚠️ Informe o token'); return }

    // Salva com callback explícito para garantir que funcionou
    chrome.storage.sync.set({ smBackendUrl: backendUrl, smAuthToken: authToken }, () => {
        if (chrome.runtime.lastError) {
            console.error('[SM] Erro ao salvar:', chrome.runtime.lastError)
            showToast('❌ Erro ao salvar: ' + chrome.runtime.lastError.message)
            return
        }
        // Verifica que realmente salvou
        chrome.storage.sync.get(['smBackendUrl', 'smAuthToken'], (check) => {
            if (check.smBackendUrl === backendUrl) {
                showToast('✅ Salvo! Pode fechar e reabrir para confirmar.')
                updateSaveStatus(backendUrl, authToken)
            } else {
                showToast('❌ Falha ao persistir. Tente recarregar a extensão.')
            }
        })
    })
}

function updateSaveStatus(url, token) {
    const btn = document.getElementById('btnSave')
    if (url && token) {
        btn.textContent = '✅ Salvo'
        btn.style.background = '#059669'
        setTimeout(() => {
            btn.textContent = '💾 Salvar'
        }, 2000)
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
function openPanel() {
    chrome.storage.sync.get(['smBackendUrl', 'smAuthToken'], async (data) => {
        if (!data.smBackendUrl || !data.smAuthToken) {
            showToast('⚠️ Salve a URL e o token primeiro!')
            return
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

        // Inject content script (safe to call even if already injected)
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content/content.js']
            })
        } catch (_) { /* already loaded */ }

        // Send open command
        chrome.tabs.sendMessage(tab.id, {
            action: 'openSidebar',
            config: {
                backendUrl: data.smBackendUrl,
                authToken: data.smAuthToken,
            }
        }, () => {
            if (chrome.runtime.lastError) {
                showToast('❌ Recarregue a página do Maps e tente novamente.')
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
