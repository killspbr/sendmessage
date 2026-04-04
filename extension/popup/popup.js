const BACKEND_URL = 'https://sendmessage-backend.engclrodrigues.workers.dev'
const SYSTEM_URL = 'https://sendmessage-frontend.pages.dev'

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnSave').addEventListener('click', saveConfig)
  document.getElementById('btnOpenPanel').addEventListener('click', openPanel)
  document.getElementById('btnGetToken').addEventListener('click', goToProfile)

  loadConfig()
  checkCurrentTab()
})

function goToProfile(event) {
  if (event) event.preventDefault()
  chrome.tabs.create({ url: `${SYSTEM_URL}/settings` })
}

function loadConfig() {
  const token = localStorage.getItem('sm_authToken') || ''
  const backendUrl = localStorage.getItem('sm_backendUrl') || BACKEND_URL

  document.getElementById('backendUrl').value = backendUrl

  if (token) {
    document.getElementById('authToken').value = token
    document.getElementById('btnSave').textContent = 'Salvo'
  }
}

function saveConfig() {
  const token = document.getElementById('authToken').value.trim()
  let backendUrl = document.getElementById('backendUrl').value.trim()

  if (backendUrl.endsWith('/')) backendUrl = backendUrl.slice(0, -1)

  if (!token) {
    showToast('Configure o token primeiro.')
    return
  }

  if (!backendUrl) {
    showToast('Informe a URL do backend.')
    return
  }

  localStorage.setItem('sm_authToken', token)
  localStorage.setItem('sm_backendUrl', backendUrl)

  try {
    chrome.storage.local.set({ sm_authToken: token, sm_backendUrl: backendUrl })
  } catch (_) {
    // ignore
  }

  const button = document.getElementById('btnSave')
  button.textContent = 'Salvo!'
  showToast('Configurações salvas.')
  setTimeout(() => {
    button.textContent = 'Salvar Configurações'
  }, 2000)
}

function checkCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const isMaps = tab?.url?.includes('google.com/maps') || tab?.url?.includes('maps.google.com')
    const dot = document.getElementById('statusDot')
    const text = document.getElementById('statusText')

    if (isMaps) {
      dot.className = 'dot ok'
      text.textContent = 'Google Maps detectado'
      document.getElementById('onMapsArea').style.display = 'block'
      document.getElementById('notMapsArea').style.display = 'none'
      return
    }

    dot.className = 'dot warn'
    text.textContent = 'Abra o Google Maps primeiro'
    document.getElementById('onMapsArea').style.display = 'none'
    document.getElementById('notMapsArea').style.display = 'block'
  })
}

function openPanel() {
  const token = localStorage.getItem('sm_authToken') || ''
  const backendUrl = localStorage.getItem('sm_backendUrl') || BACKEND_URL

  if (!token) {
    showToast('Configure o token primeiro.')
    return
  }

  chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    if (!tab?.id) {
      showToast('Nenhuma aba ativa encontrada.')
      return
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js'],
      })
    } catch (_) {
      // content script já carregado
    }

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: 'openSidebar',
        config: { backendUrl, authToken: token },
      },
      () => {
        if (chrome.runtime.lastError) {
          showToast('Recarregue o Maps e tente novamente.')
          return
        }

        window.setTimeout(() => window.close(), 80)
      },
    )
  })
}

function showToast(message) {
  const toast = document.getElementById('toast')
  toast.textContent = message
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 3000)
}
