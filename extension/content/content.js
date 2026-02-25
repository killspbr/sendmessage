/**
 * SendMessage Maps Extractor — Content Script
 *
 * Injeta um painel lateral (sidebar) no Google Maps via Shadow DOM.
 * Toda a lógica de extração e importação roda aqui.
 * O popup apenas abre/fecha o painel e salva configurações.
 */
; (function () {
    if (window.__smExtractorLoaded) return
    window.__smExtractorLoaded = true

    // ─── State ─────────────────────────────────────────────────────────────────
    let sidebarHost = null
    let shadow = null
    let extractedContacts = []
    let isExtracting = false
    let mode = 'quick'
    let config = { backendUrl: '', authToken: '', targetListId: '' }

    // ─── Message listener (from popup) ─────────────────────────────────────────
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg.action === 'ping') {
            sendResponse({ ok: true })
        }
        if (msg.action === 'openSidebar') {
            config = msg.config || config
            openSidebar()
            sendResponse({ ok: true })
        }
        if (msg.action === 'closeSidebar') {
            closeSidebar()
            sendResponse({ ok: true })
        }
        if (msg.action === 'updateConfig') {
            config = msg.config
            sendResponse({ ok: true })
        }
        return true
    })

    // ─── Sidebar lifecycle ──────────────────────────────────────────────────────
    function openSidebar() {
        if (sidebarHost) {
            sidebarHost.style.display = 'flex'
            return
        }

        // Host element + Shadow DOM for CSS isolation
        sidebarHost = document.createElement('div')
        sidebarHost.id = 'sm-extractor-host'
        sidebarHost.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      width: 360px !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      box-shadow: -4px 0 24px rgba(0,0,0,0.15) !important;
      pointer-events: all !important;
    `
        shadow = sidebarHost.attachShadow({ mode: 'open' })
        shadow.innerHTML = getSidebarHTML()
        document.body.appendChild(sidebarHost)

        // Wire up events inside shadow DOM
        bindSidebarEvents()
        loadLists()
        addLog('🟢 Painel aberto. Faça uma pesquisa no Maps e clique em Extrair.', 'info')
    }

    function closeSidebar() {
        if (sidebarHost) sidebarHost.style.display = 'none'
    }

    // ─── Sidebar HTML ───────────────────────────────────────────────────────────
    function getSidebarHTML() {
        return `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :host { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        .sidebar {
          display: flex; flex-direction: column; height: 100vh;
          background: #f8fafc; color: #1e293b; font-size: 13px;
          overflow: hidden;
        }

        /* Header */
        .header {
          background: linear-gradient(135deg, #059669, #10b981);
          padding: 12px 14px; display: flex; align-items: center; gap: 10px;
          flex-shrink: 0;
        }
        .header-logo { font-size: 20px; }
        .header-info { flex:1; }
        .header-title { color: white; font-weight: 700; font-size: 14px; }
        .header-sub { color: rgba(255,255,255,.7); font-size: 10px; margin-top: 1px; }
        .btn-close {
          background: rgba(255,255,255,.2); border: none; color: white;
          width: 28px; height: 28px; border-radius: 8px; cursor: pointer;
          font-size: 14px; display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .btn-close:hover { background: rgba(255,255,255,.35); }

        /* Mode selector */
        .mode-bar {
          padding: 10px 12px; background: white; border-bottom: 1px solid #e2e8f0;
          display: flex; gap: 6px; flex-shrink: 0;
        }
        .mode-btn {
          flex: 1; height: 32px; border-radius: 8px; border: 1.5px solid #e2e8f0;
          font-size: 11px; font-weight: 600; cursor: pointer; transition: all .15s;
          background: white; color: #475569;
        }
        .mode-btn.active { border-color: #059669; background: #ecfdf5; color: #059669; }
        .mode-btn:hover:not(.active) { border-color: #10b981; }

        /* Controls */
        .controls {
          padding: 10px 12px; background: white; border-bottom: 1px solid #e2e8f0;
          display: flex; gap: 8px; align-items: center; flex-shrink: 0;
        }
        .btn-extract {
          flex: 1; height: 34px; border-radius: 9px; border: none;
          background: #059669; color: white; font-size: 12px; font-weight: 700;
          cursor: pointer; transition: background .15s; display: flex;
          align-items: center; justify-content: center; gap: 6px;
        }
        .btn-extract:hover { background: #047857; }
        .btn-extract:disabled { opacity:.5; cursor:not-allowed; }
        .btn-scroll {
          height: 34px; padding: 0 10px; border-radius: 9px;
          border: 1.5px solid #e2e8f0; background: white;
          font-size: 11px; font-weight: 600; color: #475569;
          cursor: pointer; transition: all .15s; white-space: nowrap;
        }
        .btn-scroll:hover { border-color: #10b981; color: #059669; }

        /* Progress */
        .progress-wrap { padding: 0 12px 8px; background: white; flex-shrink: 0; }
        .progress-bar { height: 5px; background: #e2e8f0; border-radius: 99px; overflow:hidden; }
        .progress-fill { height:100%; background: linear-gradient(90deg,#059669,#34d399); border-radius:99px; transition: width .3s; }
        .progress-text { font-size: 10px; color: #64748b; margin-top: 4px; text-align: center; }

        /* Body split: log + contacts */
        .body { flex:1; display:flex; flex-direction:column; overflow:hidden; }

        /* Live log */
        .log-panel {
          border-bottom: 1px solid #e2e8f0; background: #0f172a;
          flex-shrink: 0; max-height: 140px; overflow-y: auto;
          padding: 8px 10px; display: flex; flex-direction: column;
        }
        .log-entry {
          font-size: 10px; font-family: monospace; padding: 2px 0; border-bottom: 1px solid #1e293b;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .log-entry.info { color: #94a3b8; }
        .log-entry.ok { color: #34d399; }
        .log-entry.err { color: #f87171; }
        .log-entry.warn { color: #fbbf24; }

        /* Contacts list */
        .contacts-header {
          padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }
        .contacts-count { font-weight: 700; color: #059669; font-size: 12px; }
        .btn-clear { background:none; border:none; color:#94a3b8; font-size:11px; cursor:pointer; padding:2px 6px; border-radius:4px; }
        .btn-clear:hover { color: #ef4444; background: #fef2f2; }

        .contacts-list { flex:1; overflow-y:auto; }

        .contact-card {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 8px 12px; border-bottom: 1px solid #f1f5f9; background: white;
          animation: slideIn .2s ease;
        }
        @keyframes slideIn { from { opacity:0; transform: translateX(10px); } to { opacity:1; transform:none; } }

        .avatar {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #059669, #34d399);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: white; font-weight: 700;
        }
        .contact-info { flex:1; min-width:0; }
        .contact-name { font-weight: 600; font-size: 11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .contact-meta { font-size: 10px; color: #64748b; margin-top: 1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .contact-phone { font-size: 10px; color: #059669; font-weight: 500; margin-top: 1px; }
        .tag-dup { font-size: 9px; background:#fef3c7; color:#92400e; padding:1px 5px; border-radius:4px; margin-left:4px; }

        /* Footer */
        .footer {
          padding: 10px 12px; background: white; border-top: 2px solid #e2e8f0;
          flex-shrink: 0; display: flex; flex-direction: column; gap: 6px;
        }
        .list-select {
          height: 30px; width: 100%; padding: 0 8px; border-radius: 8px;
          border: 1px solid #e2e8f0; font-size: 11px; color: #1e293b; outline: none;
        }
        .btn-import {
          height: 36px; border-radius: 9px; border:none; background: #059669;
          color: white; font-size: 12px; font-weight: 700; cursor: pointer;
          transition: background .15s; display:flex; align-items:center;
          justify-content:center; gap:6px;
        }
        .btn-import:hover { background: #047857; }
        .btn-import:disabled { opacity:.5; cursor:not-allowed; }
        .import-result {
          font-size: 10px; font-weight: 500; text-align: center; padding: 4px 8px;
          border-radius: 6px;
        }
        .import-result.ok { background: #ecfdf5; color: #059669; }
        .import-result.err { background: #fef2f2; color: #ef4444; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      </style>

      <div class="sidebar">
        <!-- Header -->
        <div class="header">
          <div class="header-logo">🗺️</div>
          <div class="header-info">
            <div class="header-title">SendMessage Extractor</div>
            <div class="header-sub" id="hSub">Pronto para extrair contatos</div>
          </div>
          <button class="btn-close" id="btnClose" title="Fechar">✕</button>
        </div>

        <!-- Mode -->
        <div class="mode-bar">
          <button class="mode-btn active" id="modeQuick">⚡ Rápido (sem tel.)</button>
          <button class="mode-btn" id="modeFull">📞 Completo (com tel.)</button>
        </div>

        <!-- Controls -->
        <div class="controls">
          <button class="btn-extract" id="btnExtract">⬇️ Extrair resultados</button>
          <button class="btn-scroll" id="btnScroll">🔄 Rolar mais</button>
        </div>

        <!-- Progress (hidden by default) -->
        <div class="progress-wrap" id="progressWrap" style="display:none;">
          <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
          <div class="progress-text" id="progressText">Extraindo...</div>
        </div>

        <!-- Body -->
        <div class="body">
          <!-- Live log -->
          <div class="log-panel" id="logPanel"></div>

          <!-- Contacts -->
          <div class="contacts-header">
            <div class="contacts-count"><span id="countNum">0</span> contatos extraídos</div>
            <button class="btn-clear" id="btnClear">🗑️ Limpar</button>
          </div>
          <div class="contacts-list" id="contactsList"></div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <select class="list-select" id="listSelect">
            <option value="">Carregando listas...</option>
          </select>
          <button class="btn-import" id="btnImport" disabled>⬆️ Importar para SendMessage</button>
          <div class="import-result" id="importResult" style="display:none;"></div>
        </div>
      </div>
    `
    }

    // ─── Bind events ────────────────────────────────────────────────────────────
    function bindSidebarEvents() {
        const $ = (id) => shadow.getElementById(id)

        $('btnClose').addEventListener('click', closeSidebar)

        $('modeQuick').addEventListener('click', () => {
            mode = 'quick'
            $('modeQuick').classList.add('active')
            $('modeFull').classList.remove('active')
        })

        $('modeFull').addEventListener('click', () => {
            mode = 'full'
            $('modeFull').classList.add('active')
            $('modeQuick').classList.remove('active')
        })

        $('btnExtract').addEventListener('click', startExtraction)
        $('btnScroll').addEventListener('click', autoScrollFeed)
        $('btnClear').addEventListener('click', clearContacts)
        $('btnImport').addEventListener('click', importContacts)
    }

    // ─── Load lists from backend ─────────────────────────────────────────────────
    async function loadLists() {
        if (!config.backendUrl || !config.authToken) return
        try {
            const resp = await fetch(`${config.backendUrl}/api/extension/info`, {
                headers: { 'Authorization': `Bearer ${config.authToken}` }
            })
            if (!resp.ok) {
                addLog('⚠️ Token inválido. Reconfigure na extensão.', 'warn')
                return
            }
            const info = await resp.json()
            const select = shadow.getElementById('listSelect')
            if (info.lists?.length) {
                select.innerHTML = info.lists.map(l =>
                    `<option value="${l.id}" ${l.id == config.targetListId ? 'selected' : ''}>${l.name}</option>`
                ).join('')
                shadow.getElementById('btnImport').disabled = false
                addLog(`✅ ${info.lists.length} lista(s) carregada(s).`, 'ok')
            } else {
                select.innerHTML = '<option value="">Nenhuma lista encontrada</option>'
                addLog('⚠️ Crie uma lista no SendMessage primeiro.', 'warn')
            }
        } catch (e) {
            addLog(`❌ Erro ao conectar ao backend: ${e.message}`, 'err')
        }
    }

    // ─── Auto-scroll feed ────────────────────────────────────────────────────────
    function autoScrollFeed() {
        const feed = document.querySelector('[role="feed"]')
        const panel = document.querySelector('.m6QErb.DxyBCb') || document.querySelector('.m6QErb')
        if (feed) { feed.scrollTop += 800; addLog('🔄 Rolando resultados...', 'info') }
        else if (panel) { panel.scrollTop += 800; addLog('🔄 Rolando painel...', 'info') }
        else { addLog('⚠️ Não encontrou painel de resultados para rolar.', 'warn') }
    }

    // ─── Extraction ────────────────────────────────────────────────────────────
    async function startExtraction() {
        if (isExtracting) return
        isExtracting = true

        const btnExtract = shadow.getElementById('btnExtract')
        btnExtract.disabled = true
        btnExtract.innerHTML = '<span style="animation:spin 1s linear infinite;display:inline-block">⟳</span> Extraindo...'

        setProgress(5, 'Localizando resultados no Maps...')
        addLog('🔍 Iniciando extração...', 'info')

        try {
            const items = extractFromPage()

            if (!items.length) {
                addLog('⚠️ Nenhum resultado encontrado. Pesquise algo no Maps primeiro.', 'warn')
                setProgress(0)
                clearProgressBar()
                btnExtract.disabled = false
                btnExtract.innerHTML = '⬇️ Extrair resultados'
                isExtracting = false
                return
            }

            addLog(`📋 ${items.length} estabelecimento(s) encontrado(s).`, 'ok')
            setProgress(15, `Processando ${items.length} resultados...`)

            if (mode === 'quick') {
                items.forEach((item, i) => {
                    const contact = normalizeContact(item)
                    if (!isDuplicate(contact)) {
                        extractedContacts.push(contact)
                        appendContactCard(contact)
                    } else {
                        addLog(`⏭️ Duplicata ignorada: ${contact.name}`, 'warn')
                    }
                    setProgress(15 + Math.round((i / items.length) * 80))
                })
            } else {
                // Full mode: click each card and extract phone
                await extractFullMode(items)
            }

            setProgress(100, '✅ Extração concluída!')
            addLog(`✅ Extração finalizada. ${extractedContacts.length} contato(s) coletado(s).`, 'ok')
            updateSubtitle(`${extractedContacts.length} contatos extraídos`)
        } catch (err) {
            addLog(`❌ Erro: ${err.message}`, 'err')
            console.error('[SM Extractor]', err)
        } finally {
            setTimeout(clearProgressBar, 2000)
            btnExtract.disabled = false
            btnExtract.innerHTML = '⬇️ Extrair resultados'
            isExtracting = false
        }
    }

    async function extractFullMode(items) {
        const cards = getResultCards()

        for (let i = 0; i < Math.min(items.length, cards.length); i++) {
            const item = items[i]
            const card = cards[i]

            addLog(`📞 Buscando tel. (${i + 1}/${items.length}): ${item.name}`, 'info')
            setProgress(15 + Math.round((i / items.length) * 80), `${i + 1}/${items.length}: ${item.name}`)

            try {
                // Programmatically click the card
                card.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
                await sleep(1800)

                // Extract phone from detail panel
                const phone = extractPhoneFromDetail()
                const website = extractWebsiteFromDetail()
                item.phone = phone || ''
                item.website = website || ''

                if (phone) addLog(`   📞 ${phone}`, 'ok')
                else addLog(`   — sem telefone`, 'warn')

                // Go back to list
                const backBtn = document.querySelector('button[aria-label*="Voltar"]') ||
                    document.querySelector('button[aria-label*="Back"]')
                if (backBtn) { backBtn.click(); await sleep(600) }

            } catch (e) {
                addLog(`   ⚠️ Erro ao buscar detalhe: ${e.message}`, 'warn')
            }

            const contact = normalizeContact(item)
            if (!isDuplicate(contact)) {
                extractedContacts.push(contact)
                appendContactCard(contact)
            }

            await sleep(400)
        }
    }

    // ─── Page scraping ──────────────────────────────────────────────────────────
    function extractFromPage() {
        const results = []
        const feed = document.querySelector('[role="feed"]')
        if (!feed) return results

        const cards = getResultCards()
        for (const card of cards) {
            try {
                const nameEl = card.querySelector('.fontHeadlineSmall') ||
                    card.querySelector('.qBF1Pd') ||
                    card.querySelector('[class*="fontHeadline"]')
                const name = nameEl?.textContent?.trim()
                if (!name || name.length < 2) continue

                const ratingEl = card.querySelector('.MW4etd')
                const rating = ratingEl?.textContent?.trim() || ''

                const metaEls = Array.from(card.querySelectorAll('.W4Efsd span'))
                    .map(el => el.textContent?.trim())
                    .filter(t => t && t.length > 1)

                const category = metaEls[0] || ''
                const address = metaEls.slice(1).join(' ') || ''

                results.push({ name, rating, category, address, phone: '', website: '' })
            } catch { /* skip */ }
        }
        return results
    }

    function getResultCards() {
        const feed = document.querySelector('[role="feed"]')
        if (!feed) return []
        const cards = feed.querySelectorAll('div.Nv2PK, [role="article"]')
        return cards.length > 0 ? Array.from(cards) : Array.from(feed.children)
    }

    function extractPhoneFromDetail() {
        const phoneBtn = document.querySelector('[data-item-id*="phone"]') ||
            document.querySelector('button[aria-label*="Telefone"]') ||
            document.querySelector('button[aria-label*="Phone"]')
        if (!phoneBtn) return null
        const text = phoneBtn.querySelector('.Io6YTe')?.textContent?.trim() ||
            phoneBtn.querySelector('span')?.textContent?.trim()
        return text && /\d/.test(text) ? text : null
    }

    function extractWebsiteFromDetail() {
        const a = document.querySelector('a[data-item-id="authority"]') ||
            document.querySelector('a[aria-label*="Website"]')
        return a?.href || null
    }

    // ─── Contact helpers ────────────────────────────────────────────────────────
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

    function isDuplicate(contact) {
        return extractedContacts.some(c => c.name === contact.name && c.address === contact.address)
    }

    function clearContacts() {
        extractedContacts = []
        shadow.getElementById('contactsList').innerHTML = ''
        shadow.getElementById('countNum').textContent = '0'
        addLog('🗑️ Lista limpa.', 'info')
    }

    function appendContactCard(contact) {
        const list = shadow.getElementById('contactsList')
        const div = document.createElement('div')
        div.className = 'contact-card'
        div.innerHTML = `
      <div class="avatar">${(contact.name[0] || '?').toUpperCase()}</div>
      <div class="contact-info">
        <div class="contact-name">${esc(contact.name)}</div>
        <div class="contact-meta">${esc(contact.category)} · ${esc(contact.address.split(',')[0] || '')}</div>
        ${contact.phone ? `<div class="contact-phone">📞 ${esc(contact.phone)}</div>` : ''}
        ${contact.rating ? `<div class="contact-meta">★ ${contact.rating}</div>` : ''}
      </div>
    `
        list.appendChild(div)
        // Auto-scroll to bottom
        list.scrollTop = list.scrollHeight
        // Update count
        shadow.getElementById('countNum').textContent = extractedContacts.length
    }

    // ─── Import ─────────────────────────────────────────────────────────────────
    async function importContacts() {
        if (!extractedContacts.length) return
        if (!config.backendUrl || !config.authToken) {
            addLog('❌ Backend não configurado. Abra o popup da extensão.', 'err')
            return
        }

        const listId = shadow.getElementById('listSelect').value
        if (!listId) { addLog('⚠️ Selecione uma lista de destino.', 'warn'); return }

        const btn = shadow.getElementById('btnImport')
        btn.disabled = true
        btn.innerHTML = '⟳ Importando...'

        let success = 0
        let skipped = 0
        let errors = 0

        addLog(`📤 Iniciando importação de ${extractedContacts.length} contato(s)...`, 'info')

        for (const c of extractedContacts) {
            try {
                const resp = await fetch(`${config.backendUrl}/api/contacts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.authToken}`,
                    },
                    body: JSON.stringify({
                        list_id: listId,
                        name: c.name,
                        phone: c.phone?.replace(/\D/g, '') || '',
                        email: '',
                        category: c.category || 'Maps',
                        cep: '',
                        rating: c.rating ? String(c.rating) : '',
                    })
                })

                if (resp.ok) { success++; addLog(`   ✅ ${c.name}`, 'ok') }
                else if (resp.status === 409) { skipped++; addLog(`   ⏭️ Já existe: ${c.name}`, 'warn') }
                else { errors++; addLog(`   ❌ Falha: ${c.name}`, 'err') }
            } catch { errors++ }
        }

        const resultEl = shadow.getElementById('importResult')
        const msg = `✅ ${success} importado(s)${skipped ? `, ${skipped} já existia(m)` : ''}${errors ? `, ${errors} erro(s)` : ''}`
        resultEl.textContent = msg
        resultEl.className = errors && !success ? 'import-result err' : 'import-result ok'
        resultEl.style.display = 'block'

        addLog(`📩 Importação concluída: ${msg}`, success ? 'ok' : 'err')

        btn.disabled = false
        btn.innerHTML = '⬆️ Importar para SendMessage'
    }

    // ─── UI helpers ─────────────────────────────────────────────────────────────
    function addLog(msg, type = 'info') {
        const panel = shadow?.getElementById('logPanel')
        if (!panel) return
        const entry = document.createElement('div')
        entry.className = `log-entry ${type}`
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        entry.textContent = `[${time}] ${msg}`
        panel.appendChild(entry)
        panel.scrollTop = panel.scrollHeight // auto-scroll
        // Keep only last 80 entries
        while (panel.children.length > 80) panel.removeChild(panel.firstChild)
    }

    function setProgress(pct, text) {
        const wrap = shadow?.getElementById('progressWrap')
        const fill = shadow?.getElementById('progressFill')
        const label = shadow?.getElementById('progressText')
        if (!wrap) return
        wrap.style.display = 'block'
        if (fill) fill.style.width = `${pct}%`
        if (label && text) label.textContent = text
    }

    function clearProgressBar() {
        const wrap = shadow?.getElementById('progressWrap')
        if (wrap) wrap.style.display = 'none'
    }

    function updateSubtitle(text) {
        const el = shadow?.getElementById('hSub')
        if (el) el.textContent = text
    }

    function esc(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms))
    }

    console.log('[SendMessage Extractor] Content script pronto em:', window.location.href)
})()
