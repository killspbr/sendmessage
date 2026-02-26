// URL do backend — fixo
const BACKEND_URL = 'https://clrodrigues-sendmessage-backend.rsybpi.easypanel.host'
// URL do sistema — inferida pelo padrão ou definida fixa
const SYSTEM_URL = 'https://clrodrigues-sendmessage.rsybpi.easypanel.host'

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnSave').addEventListener('click', saveConfig)
    document.getElementById('btnOpenPanel').addEventListener('click', openPanel)
    document.getElementById('btnGetToken').addEventListener('click', goToProfile)

    loadConfig()
    checkCurrentTab()
})

// ─── Navegação ────────────────────────────────────────────────────────────────
function goToProfile(e) {
    if (e) e.preventDefault()
    // Abre a tela de perfil onde está o botão de copiar token
    chrome.tabs.create({ url: `${SYSTEM_URL}/settings` })
}

// ─── Storage ──────────────────────────────────────────────────────────────────
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
    // Backup em chrome.storage
    try { chrome.storage.local.set({ sm_authToken: token }) } catch (_) { }

    const btn = document.getElementById('btnSave')
    btn.textContent = '✅ Salvo!'
    showToast('✅ Token configurado com sucesso!')
    setTimeout(() => { btn.textContent = '💾 Salvar Token' }, 2000)
}

// ─── Tab check ────────────────────────────────────────────────────────────────
function checkCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        const isMaps = tab?.url?.includes('google.com/maps') || tab?.url?.includes('maps.google.com')
        const dot = document.getElementById('statusDot')
        const txt = document.getElementById('statusText')

        if (isMaps) {
            dot.className = 'dot ok'
            txt.textContent = '✓ Google Maps detectado'
            document.getElementById('onMapsArea').style.display = 'block'
            document.getElementById('notMapsArea').style.display = 'none'
        } else {
            dot.className = 'dot warn'
            txt.textContent = 'Abra o Google Maps primeiro'
            document.getElementById('onMapsArea').style.display = 'none'
            document.getElementById('notMapsArea').style.display = 'block'
        }
    })
}

// ─── Open sidebar ─────────────────────────────────────────────────────────────
function openPanel() {
    const token = localStorage.getItem('sm_authToken') || ''
    if (!token) { showToast('⚠️ Configure o token primeiro!'); return }

    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
        try {
            await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/content.js'] })
        } catch (_) { /* já carregado */ }

        chrome.tabs.sendMessage(tab.id, {
            action: 'openSidebar',
            config: { backendUrl: BACKEND_URL, authToken: token }
        }, () => {
            if (chrome.runtime.lastError) {
                showToast('❌ Recarregue o Maps (F5) e tente novamente.')
                return
            }
            window.close()
        })
    })
}

function showToast(msg) {
    const t = document.getElementById('toast')
    t.textContent = msg
    t.classList.add('show')
    setTimeout(() => t.classList.remove('show'), 3000)
}
