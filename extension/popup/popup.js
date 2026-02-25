// URL do backend — fixo, não configurável pelo usuário
const BACKEND_URL = 'https://clrodrigues-sendmessage-backend.rsybpi.easypanel.host'

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnSave').addEventListener('click', saveConfig)
    document.getElementById('btnOpenPanel').addEventListener('click', openPanel)
    loadConfig()
    checkCurrentTab()
})

// ─── Storage (localStorage — persiste no popup mesmo fechando) ─────────────────
function loadConfig() {
    const token = localStorage.getItem('sm_authToken') || ''
    if (token) {
        document.getElementById('authToken').value = token
        document.getElementById('btnSave').textContent = '✅ Token salvo'
    }
}

function saveConfig() {
    const token = document.getElementById('authToken').value.trim()
    if (!token) { showToast('⚠️ Cole o token do seu perfil no SendMessage'); return }

    localStorage.setItem('sm_authToken', token)
    // Backup em chrome.storage também
    try { chrome.storage.local.set({ sm_authToken: token }) } catch (_) { }

    const btn = document.getElementById('btnSave')
    btn.textContent = '✅ Salvo!'
    showToast('✅ Token salvo com sucesso!')
    setTimeout(() => { btn.textContent = '💾 Salvar' }, 2000)
}

// ─── Tab check ────────────────────────────────────────────────────────────────
function checkCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        const isMaps = tab?.url?.includes('google.com/maps') || tab?.url?.includes('maps.google.com')
        document.getElementById('statusDot').className = isMaps ? 'dot ok' : 'dot warn'
        document.getElementById('statusText').textContent = isMaps ? '✓ Google Maps detectado' : 'Abra o Google Maps primeiro'
        document.getElementById('onMapsArea').style.display = isMaps ? 'block' : 'none'
        document.getElementById('notMapsArea').style.display = isMaps ? 'none' : 'block'
    })
}

// ─── Open sidebar ─────────────────────────────────────────────────────────────
function openPanel() {
    const token = localStorage.getItem('sm_authToken') || ''
    if (!token) { showToast('⚠️ Configure e salve o token primeiro!'); return }

    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
        try {
            await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/content.js'] })
        } catch (_) { /* já carregado */ }

        chrome.tabs.sendMessage(tab.id, {
            action: 'openSidebar',
            config: { backendUrl: BACKEND_URL, authToken: token }
        }, () => {
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
