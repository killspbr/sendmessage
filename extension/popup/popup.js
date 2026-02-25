// ─── State ────────────────────────────────────────────────────────────────────
let extractedContacts = []
let mode = 'quick' // 'quick' | 'full'
let isExtracting = false

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig()
    await checkCurrentTab()
})

// ─── Config ───────────────────────────────────────────────────────────────────
async function loadConfig() {
    const data = await chrome.storage.local.get(['backendUrl', 'authToken', 'targetListId'])
    if (data.backendUrl) document.getElementById('backendUrl').value = data.backendUrl
    if (data.authToken) document.getElementById('authToken').value = data.authToken
    if (data.targetListId) document.getElementById('targetListId').value = data.targetListId

    // Auto-expand config if not configured
    if (!data.backendUrl || !data.authToken) {
        document.getElementById('configBody').classList.add('open')
        document.getElementById('configArrow').textContent = '▲'
    }

    // Load lists from backend if configured
    if (data.backendUrl && data.authToken) {
        await loadLists(data.backendUrl, data.authToken, data.targetListId)
    }
}

async function loadLists(backendUrl, authToken, currentListId) {
    try {
        const resp = await fetch(`${backendUrl}/api/extension/info`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
        if (!resp.ok) return

        const info = await resp.json()
        if (!info.lists?.length) return

        const listInput = document.getElementById('targetListId')
        listInput.parentElement.innerHTML = `
      <label style="font-size:10px;font-weight:500;color:#64748b;">Lista de destino</label>
      <select id="targetListId" style="height:32px;padding:0 8px;border:1px solid #e2e8f0;border-radius:8px;font-size:11px;color:#1e293b;outline:none;width:100%;">
        ${info.lists.map(l => `<option value="${l.id}" ${l.id == currentListId ? 'selected' : ''}>${l.name}</option>`).join('')}
      </select>
    `
    } catch { /* silently fail */ }
}

async function saveConfig() {
    const backendUrl = document.getElementById('backendUrl').value.trim()
    const authToken = document.getElementById('authToken').value.trim()
    const targetListId = document.getElementById('targetListId').value.trim()
    await chrome.storage.local.set({ backendUrl, authToken, targetListId })
    showToast('✅ Configurações salvas!')
}

function toggleConfig() {
    const body = document.getElementById('configBody')
    const arrow = document.getElementById('configArrow')
    body.classList.toggle('open')
    arrow.textContent = body.classList.contains('open') ? '▲' : '▼'
}

// ─── Tab Check ────────────────────────────────────────────────────────────────
async function checkCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    const isGoogleMaps = tab?.url?.includes('google.com/maps') || tab?.url?.includes('maps.google.com')

    const statusDot = document.getElementById('statusDot')
    const statusText = document.getElementById('statusText')
    const notMaps = document.getElementById('notMapsSection')
    const extractSection = document.getElementById('extractSection')

    if (isGoogleMaps) {
        statusDot.className = 'status-dot ok'
        statusText.textContent = 'Google Maps detectado ✓'
        notMaps.classList.add('hidden')
        extractSection.classList.remove('hidden')
    } else {
        statusDot.className = 'status-dot warn'
        statusText.textContent = 'Abra o Google Maps para extrair'
        notMaps.classList.remove('hidden')
        extractSection.classList.add('hidden')
        document.getElementById('footerActions').style.display = 'none'
    }
}

// ─── Mode ─────────────────────────────────────────────────────────────────────
function setMode(m) {
    mode = m
    document.getElementById('modeQuick').classList.toggle('active', m === 'quick')
    document.getElementById('modeFull').classList.toggle('active', m === 'full')
}

// ─── Auto-scroll to load more results ─────────────────────────────────────────
async function autoScroll() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const feed = document.querySelector('[role="feed"]')
            if (feed) {
                feed.scrollTop = feed.scrollHeight
                return true
            }
            // fallback: scroll the results panel
            const panel = document.querySelector('.m6QErb.DxyBCb') || document.querySelector('.m6QErb')
            if (panel) { panel.scrollTop = panel.scrollHeight; return true }
            return false
        }
    })
    showToast('🔄 Rolando para carregar mais resultados...')
    // Wait a bit and re-check
    setTimeout(() => {
        showToast('✅ Role mais vezes se necessário')
    }, 2000)
}

// ─── Extraction ───────────────────────────────────────────────────────────────
async function startExtraction() {
    if (isExtracting) return
    isExtracting = true

    const btnExtract = document.getElementById('btnExtract')
    btnExtract.disabled = true
    btnExtract.innerHTML = '⟳ Extraindo...'

    showProgress(0, 'Iniciando extração...')

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

        // Step 1: Extract list items
        const listResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractListItems
        })

        const items = listResults[0]?.result || []

        if (!items.length) {
            showToast('⚠️ Nenhum resultado encontrado. Certifique-se de ter feito uma busca no Maps.')
            hideProgress()
            btnExtract.disabled = false
            btnExtract.innerHTML = '⬇️ Extrair resultados'
            isExtracting = false
            return
        }

        showProgress(10, `Encontrados ${items.length} estabelecimento(s)...`)

        let contacts = []

        if (mode === 'quick') {
            // Quick mode: just use the list data
            contacts = items.map(normalizeContact)
            showProgress(100, 'Extração concluída!')
        } else {
            // Full mode: click each item and extract phone
            contacts = await extractWithDetails(tab.id, items)
        }

        // Merge with existing (avoid full duplicates by name+address)
        const existing = new Set(extractedContacts.map(c => c.name + c.address))
        const newOnes = contacts.filter(c => !existing.has(c.name + c.address))
        extractedContacts = [...extractedContacts, ...newOnes]

        showResults()
        showToast(`✅ ${newOnes.length} novo(s) contato(s) extraído(s)!`)
    } catch (err) {
        console.error('[SM Extractor] Erro:', err)
        showToast('❌ Erro na extração. Tente novamente.')
        addLog(`Erro: ${err.message}`, 'err')
    } finally {
        hideProgress()
        btnExtract.disabled = false
        btnExtract.innerHTML = '⬇️ Extrair resultados'
        isExtracting = false
    }
}

// ─── Extract with phone details ───────────────────────────────────────────────
async function extractWithDetails(tabId, items) {
    const contacts = []

    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const pct = Math.round(10 + (i / items.length) * 85)
        showProgress(pct, `Buscando telefone (${i + 1}/${items.length}): ${item.name}`)

        try {
            // Click on the result card
            const detailResult = await chrome.scripting.executeScript({
                target: { tabId },
                func: clickAndExtractDetail,
                args: [i]
            })

            const detail = detailResult[0]?.result
            const contact = normalizeContact(item)

            if (detail?.phone) contact.phone = detail.phone
            if (detail?.website) contact.website = detail.website

            contacts.push(contact)
        } catch {
            contacts.push(normalizeContact(item))
        }

        // Small delay between clicks to avoid being rate-limited
        await new Promise(r => setTimeout(r, 1200))
    }

    return contacts
}

// ─── Helper: normalize raw extracted data ─────────────────────────────────────
function normalizeContact(raw) {
    return {
        name: raw.name || '',
        address: raw.address || '',
        phone: raw.phone || '',
        website: raw.website || '',
        rating: raw.rating || '',
        category: raw.category || 'Estabelecimento',
    }
}

// ─── Results UI ───────────────────────────────────────────────────────────────
function showResults() {
    const section = document.getElementById('resultsSection')
    const list = document.getElementById('contactList')
    const count = document.getElementById('resultCount')
    const footer = document.getElementById('footerActions')
    const summary = document.getElementById('importSummary')
    const dupInfo = document.getElementById('importDupInfo')

    section.classList.remove('hidden')
    count.textContent = extractedContacts.length

    list.innerHTML = extractedContacts.map((c, i) => `
    <div class="contact-item">
      <div class="contact-avatar">${(c.name[0] || '?').toUpperCase()}</div>
      <div class="contact-info">
        <div class="contact-name">${escHtml(c.name)}</div>
        <div class="contact-meta">${escHtml(c.category)} · ${escHtml(c.address.split(',')[0] || '')}</div>
        ${c.phone ? `<div class="contact-phone">📞 ${escHtml(c.phone)}</div>` : ''}
        ${c.rating ? `<div class="contact-meta">★ ${c.rating}</div>` : ''}
      </div>
    </div>
  `).join('')

    summary.textContent = `${extractedContacts.length} contato(s) prontos para importar`
    dupInfo.textContent = 'Duplicatas serão ignoradas automaticamente no SendMessage'
    footer.style.display = 'flex'
}

function clearResults() {
    extractedContacts = []
    document.getElementById('resultsSection').classList.add('hidden')
    document.getElementById('footerActions').style.display = 'none'
}

function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(extractedContacts, null, 2))
    showToast('📋 JSON copiado para a área de transferência!')
}

// ─── Import to SendMessage ────────────────────────────────────────────────────
async function importContacts() {
    const config = await chrome.storage.local.get(['backendUrl', 'authToken', 'targetListId'])

    if (!config.backendUrl || !config.authToken) {
        showToast('⚠️ Configure o backend e o token primeiro!')
        document.getElementById('configBody').classList.add('open')
        return
    }

    if (!config.targetListId) {
        showToast('⚠️ Configure o ID da lista de destino!')
        document.getElementById('configBody').classList.add('open')
        return
    }

    const btn = document.getElementById('btnImport')
    btn.disabled = true
    btn.innerHTML = '⟳ Importando...'

    let success = 0
    let errors = 0

    for (const contact of extractedContacts) {
        try {
            const resp = await fetch(`${config.backendUrl}/api/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.authToken}`,
                },
                body: JSON.stringify({
                    list_id: config.targetListId,
                    name: contact.name,
                    phone: contact.phone?.replace(/\D/g, '') || '',
                    email: '',
                    category: contact.category || 'Maps',
                    cep: '',
                    rating: contact.rating ? String(contact.rating) : '',
                })
            })

            if (resp.ok || resp.status === 409) success++ // 409 = already exists
            else errors++
        } catch {
            errors++
        }
    }

    btn.disabled = false
    btn.innerHTML = '⬆️ Importar para SendMessage'

    if (errors === 0) {
        showToast(`✅ ${success} contato(s) importados com sucesso!`)
        addLog(`${success} importados para a lista ${config.targetListId}`, 'ok')
    } else {
        showToast(`⚠️ ${success} importados, ${errors} erro(s)`)
    }
}

// ─── Progress ─────────────────────────────────────────────────────────────────
function showProgress(pct, text) {
    document.getElementById('progressArea').classList.remove('hidden')
    document.getElementById('progressBar').style.width = `${pct}%`
    document.getElementById('progressText').textContent = text
}

function hideProgress() {
    setTimeout(() => {
        document.getElementById('progressArea').classList.add('hidden')
    }, 1000)
}

// ─── Log ──────────────────────────────────────────────────────────────────────
function addLog(msg, type = '') {
    const logArea = document.getElementById('logArea')
    const logList = document.getElementById('logList')
    logArea.classList.remove('hidden')
    const item = document.createElement('div')
    item.className = `log-item ${type}`
    item.textContent = `${new Date().toLocaleTimeString('pt-BR')} — ${msg}`
    logList.prepend(item)
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg) {
    const toast = document.getElementById('toast')
    toast.textContent = msg
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), 2500)
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT SCRIPT FUNCTIONS (executed on the Maps page via scripting API)
// These functions run in the context of maps.google.com
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extracts all visible business cards from the Google Maps results sidebar.
 * Runs inside the Maps page context.
 */
function extractListItems() {
    const results = []

    // Multiple fallback selectors for the results feed
    const feed = document.querySelector('[role="feed"]')
    if (!feed) return results

    // Each result is a child div with role="article" or a link wrapper
    const cards = feed.querySelectorAll('div.Nv2PK, div[jsaction*="mouseover"] a.hfpxzc, [role="article"]')

    // Fallback: get all direct children of the feed
    const items = cards.length > 0 ? Array.from(cards) : Array.from(feed.children)

    for (const item of items) {
        try {
            // Business name — try multiple selectors
            const nameEl = item.querySelector('.fontHeadlineSmall') ||
                item.querySelector('.qBF1Pd') ||
                item.querySelector('[class*="fontHeadline"]') ||
                item.querySelector('span[aria-label]')

            const name = nameEl?.textContent?.trim()
            if (!name || name.length < 2) continue

            // Rating
            const ratingEl = item.querySelector('.MW4etd')
            const rating = ratingEl?.textContent?.trim() || ''

            // Category and address (usually in .W4Efsd spans)
            const metaSpans = Array.from(item.querySelectorAll('.W4Efsd span, .W4Efsd div'))
                .map(el => el.textContent?.trim())
                .filter(t => t && t.length > 1 && !t.includes('·') === false || t.length > 3)

            const category = metaSpans[0] || ''
            const address = metaSpans.slice(1).join(', ') || ''

            results.push({ name, rating, category, address, phone: '', website: '' })
        } catch { /* skip malformed cards */ }
    }

    return results
}

/**
 * Clicks the Nth result card in the feed and extracts phone + website.
 * Runs inside the Maps page context.
 */
async function clickAndExtractDetail(index) {
    const feed = document.querySelector('[role="feed"]')
    if (!feed) return null

    const cards = feed.querySelectorAll('div.Nv2PK, [role="article"]')
    const allItems = cards.length > 0 ? Array.from(cards) : Array.from(feed.children)
    const card = allItems[index]

    if (!card) return null

    // Click the card
    card.click()

    // Wait for detail panel to load
    await new Promise(r => setTimeout(r, 1800))

    const detail = {}

    try {
        // Phone — Google Maps shows phone in a button with data-item-id containing "phone"
        const phoneBtn = document.querySelector('[data-item-id*="phone"]') ||
            document.querySelector('button[aria-label*="Telefone"]') ||
            document.querySelector('button[aria-label*="Phone"]')

        if (phoneBtn) {
            const phoneText = phoneBtn.querySelector('.Io6YTe')?.textContent?.trim() ||
                phoneBtn.querySelector('span')?.textContent?.trim() ||
                phoneBtn.getAttribute('aria-label')?.replace(/[^0-9+\s\-()]/g, '') || ''
            if (phoneText) detail.phone = phoneText.trim()
        }

        // Website
        const websiteLink = document.querySelector('a[data-item-id="authority"]') ||
            document.querySelector('a[aria-label*="Website"]') ||
            document.querySelector('a[aria-label*="website"]')
        if (websiteLink) detail.website = websiteLink.href || ''
    } catch { /* ignore */ }

    // Go back to list
    const backBtn = document.querySelector('button[aria-label*="Voltar"]') ||
        document.querySelector('button[aria-label*="Back"]') ||
        document.querySelector('[jsaction*="back"]')
    if (backBtn) backBtn.click()

    return detail
}
