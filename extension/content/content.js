/**
 * SendMessage Maps Extractor — Content Script
 * Injeta painel lateral no Google Maps via Shadow DOM.
 * Loop automático: rola → extrai → importa, até esgotar resultados ou o usuário parar.
 */
; (function () {
    if (window.__smExtractorLoaded) return
    window.__smExtractorLoaded = true

    // ─── State ─────────────────────────────────────────────────────────────────
    let sidebarHost = null
    let shadow = null
    let extractedContacts = []
    let isRunning = false
    let isStopRequested = false
    let processedNames = new Set()
    let importedCount = 0
    let mode = 'quick'         // 'quick' | 'full'
    let autoImport = true
    let config = { backendUrl: '', authToken: '' }

    // ─── Message listener ──────────────────────────────────────────────────────
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg.action === 'ping') {
            sendResponse({ ok: true })
        }
        if (msg.action === 'openSidebar') {
            if (msg.config?.backendUrl) {
                config = msg.config
                openSidebar()
            } else {
                const fromLocal = {
                    backendUrl: localStorage.getItem('sm_backendUrl') || '',
                    authToken: localStorage.getItem('sm_authToken') || '',
                }
                config = fromLocal.backendUrl ? fromLocal : config
                openSidebar()
            }
            sendResponse({ ok: true })
        }
        if (msg.action === 'closeSidebar') {
            closeSidebar()
            sendResponse({ ok: true })
        }
        return true
    })

    // ─── Sidebar lifecycle ──────────────────────────────────────────────────────
    function openSidebar() {
        if (sidebarHost) { sidebarHost.style.display = 'flex'; return }

        sidebarHost = document.createElement('div')
        sidebarHost.id = 'sm-extractor-host'
        sidebarHost.style.cssText = `
            position: fixed !important; top: 0 !important; right: 0 !important;
            width: 360px !important; height: 100vh !important;
            z-index: 2147483647 !important; display: flex !important;
            flex-direction: column !important;
            box-shadow: -6px 0 32px rgba(0,0,0,0.18) !important;
            pointer-events: all !important;
        `
        shadow = sidebarHost.attachShadow({ mode: 'open' })
        shadow.innerHTML = getSidebarHTML()
        document.body.appendChild(sidebarHost)
        bindEvents()
        loadLists()
        addLog('🟢 Painel aberto. Pesquise no Maps e clique em Iniciar.', 'info')
    }

    function closeSidebar() {
        if (sidebarHost) sidebarHost.style.display = 'none'
    }

    // ─── HTML ───────────────────────────────────────────────────────────────────
    function getSidebarHTML() {
        return `
        <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            :host { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

            .sidebar { display:flex; flex-direction:column; height:100vh; background:#f8fafc; color:#1e293b; font-size:13px; overflow:hidden; }

            .header { background:linear-gradient(135deg,#059669,#10b981); padding:11px 14px; display:flex; align-items:center; gap:10px; flex-shrink:0; }
            .header-info { flex:1; }
            .header-title { color:white; font-weight:700; font-size:14px; }
            .header-sub { color:rgba(255,255,255,.7); font-size:10px; margin-top:1px; }
            .btn-close { background:rgba(255,255,255,.2); border:none; color:white; width:28px; height:28px; border-radius:8px; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; }
            .btn-close:hover { background:rgba(255,255,255,.35); }

            /* Stats bar */
            .stats-bar { display:flex; gap:0; background:white; border-bottom:2px solid #e2e8f0; flex-shrink:0; }
            .stat { flex:1; padding:7px 0; text-align:center; border-right:1px solid #e2e8f0; }
            .stat:last-child { border-right:none; }
            .stat-val { font-size:16px; font-weight:800; color:#059669; line-height:1; }
            .stat-lbl { font-size:9px; color:#64748b; text-transform:uppercase; letter-spacing:.4px; margin-top:2px; }

            /* Mode */
            .mode-bar { padding:8px 12px; background:white; border-bottom:1px solid #e2e8f0; display:flex; gap:6px; flex-shrink:0; }
            .mode-btn { flex:1; height:30px; border-radius:8px; border:1.5px solid #e2e8f0; font-size:11px; font-weight:600; cursor:pointer; background:white; color:#475569; transition:all .15s; }
            .mode-btn.active { border-color:#059669; background:#ecfdf5; color:#059669; }

            /* Auto-import toggle */
            .toggle-row { display:flex; align-items:center; justify-content:space-between; padding:6px 12px; background:white; border-bottom:1px solid #e2e8f0; flex-shrink:0; }
            .toggle-label { font-size:11px; color:#475569; display:flex; align-items:center; gap:5px; }
            .toggle-switch { position:relative; width:34px; height:18px; }
            .toggle-switch input { opacity:0; width:0; height:0; }
            .toggle-track { position:absolute; inset:0; background:#e2e8f0; border-radius:99px; cursor:pointer; transition:background .2s; }
            .toggle-track::after { content:''; position:absolute; left:2px; top:2px; width:14px; height:14px; background:white; border-radius:50%; transition:transform .2s; box-shadow:0 1px 3px rgba(0,0,0,.2); }
            .toggle-switch input:checked + .toggle-track { background:#059669; }
            .toggle-switch input:checked + .toggle-track::after { transform:translateX(16px); }

            /* Controls */
            .controls { padding:8px 12px; background:white; border-bottom:1px solid #e2e8f0; display:flex; gap:6px; flex-shrink:0; }
            .btn-start { flex:1; height:36px; border-radius:9px; border:none; background:linear-gradient(135deg,#059669,#10b981); color:white; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 2px 8px rgba(5,150,105,.3); }
            .btn-start:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(5,150,105,.4); }
            .btn-start:disabled { opacity:.5; cursor:not-allowed; transform:none; }
            .btn-stop { flex:1; height:36px; border-radius:9px; border:none; background:#ef4444; color:white; font-size:12px; font-weight:700; cursor:pointer; animation:pulse 1.5s infinite; display:none; align-items:center; justify-content:center; gap:6px; }
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
            .btn-clear { height:36px; padding:0 10px; border-radius:9px; border:1.5px solid #e2e8f0; background:white; font-size:11px; font-weight:600; color:#64748b; cursor:pointer; white-space:nowrap; }
            .btn-clear:hover { border-color:#ef4444; color:#ef4444; }

            /* Progress */
            .progress-wrap { padding:0 12px 8px; background:white; flex-shrink:0; display:none; }
            .progress-bar { height:5px; background:#e2e8f0; border-radius:99px; overflow:hidden; }
            .progress-fill { height:100%; background:linear-gradient(90deg,#059669,#34d399); border-radius:99px; transition:width .3s; }
            .progress-text { font-size:10px; color:#64748b; margin-top:4px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

            /* Body */
            .body { flex:1; display:flex; flex-direction:column; overflow:hidden; }

            /* Log */
            .log-panel { background:#0f172a; flex-shrink:0; max-height:130px; overflow-y:auto; padding:6px 10px; }
            .log-entry { font-size:10px; font-family:monospace; padding:2px 0; border-bottom:1px solid #1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .log-entry.info { color:#94a3b8; }
            .log-entry.ok   { color:#34d399; }
            .log-entry.err  { color:#f87171; }
            .log-entry.warn { color:#fbbf24; }

            /* Contacts */
            .contacts-header { padding:7px 12px; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
            .contacts-count { font-weight:700; color:#059669; font-size:11px; }

            .contacts-list { flex:1; overflow-y:auto; }
            .contact-card { display:flex; align-items:flex-start; gap:8px; padding:7px 12px; border-bottom:1px solid #f1f5f9; background:white; animation:slideIn .2s ease; }
            @keyframes slideIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:none} }
            .avatar { width:28px; height:28px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#059669,#34d399); display:flex; align-items:center; justify-content:center; font-size:11px; color:white; font-weight:700; }
            .contact-info { flex:1; min-width:0; }
            .cname { font-weight:600; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .cmeta { font-size:9px; color:#64748b; margin-top:1px; }
            .cphone { font-size:10px; color:#059669; font-weight:500; }
            .tag-imp { font-size:8px; background:#d1fae5; color:#065f46; padding:1px 4px; border-radius:3px; }

            /* Footer */
            .footer { padding:8px 12px; background:white; border-top:2px solid #e2e8f0; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
            .list-select { height:30px; width:100%; padding:0 8px; border-radius:8px; border:1px solid #e2e8f0; font-size:11px; color:#1e293b; outline:none; }
            .btn-import { height:34px; border-radius:9px; border:none; background:#059669; color:white; font-size:11px; font-weight:700; cursor:pointer; transition:background .15s; display:flex; align-items:center; justify-content:center; gap:5px; }
            .btn-import:hover { background:#047857; }
            .btn-import:disabled { opacity:.5; cursor:not-allowed; }

            ::-webkit-scrollbar { width:3px; }
            ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }
        </style>

        <div class="sidebar">
            <!-- Header -->
            <div class="header">
                <div class="header-info">
                    <div class="header-title">🗺️ SM Extractor</div>
                    <div class="header-sub" id="hSub">Pronto para extrair</div>
                </div>
                <button class="btn-close" id="btnClose">✕</button>
            </div>

            <!-- Stats -->
            <div class="stats-bar">
                <div class="stat">
                    <div class="stat-val" id="statExtracted">0</div>
                    <div class="stat-lbl">Extraídos</div>
                </div>
                <div class="stat">
                    <div class="stat-val" id="statImported">0</div>
                    <div class="stat-lbl">Importados</div>
                </div>
                <div class="stat">
                    <div class="stat-val" id="statSkipped">0</div>
                    <div class="stat-lbl">Já existiam</div>
                </div>
            </div>

            <!-- Mode -->
            <div class="mode-bar">
                <button class="mode-btn active" id="modeQuick">⚡ Rápido (sem tel.)</button>
                <button class="mode-btn" id="modeFull">📞 Completo (com tel.)</button>
            </div>

            <!-- Auto-import toggle -->
            <div class="toggle-row">
                <span class="toggle-label">⬆️ Importar automaticamente para lista</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="autoImportChk" checked>
                    <div class="toggle-track"></div>
                </label>
            </div>

            <!-- Controls -->
            <div class="controls">
                <button class="btn-start" id="btnStart">▶️ Iniciar Extração</button>
                <button class="btn-stop"  id="btnStop">⏹️ Parar</button>
                <button class="btn-clear" id="btnClear" title="Limpar resultados">🗑️</button>
            </div>

            <!-- Progress -->
            <div class="progress-wrap" id="progressWrap">
                <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
                <div class="progress-text" id="progressText">Aguarde...</div>
            </div>

            <!-- Body -->
            <div class="body">
                <div class="log-panel" id="logPanel"></div>

                <div class="contacts-header">
                    <span class="contacts-count" id="contactsCount">0 contatos</span>
                </div>
                <div class="contacts-list" id="contactsList"></div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <select class="list-select" id="listSelect">
                    <option value="">Carregando listas...</option>
                </select>
                <button class="btn-import" id="btnImport" disabled>⬆️ Importar tudo agora</button>
            </div>
        </div>
        `
    }

    // ─── Events ─────────────────────────────────────────────────────────────────
    function bindEvents() {
        const $ = id => shadow.getElementById(id)

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

        $('autoImportChk').addEventListener('change', e => {
            autoImport = e.target.checked
        })

        $('btnStart').addEventListener('click', startAutoExtraction)
        $('btnStop').addEventListener('click', () => {
            isStopRequested = true
            addLog('⏹️ Parando após a empresa atual...', 'warn')
        })
        $('btnClear').addEventListener('click', clearAll)
        $('btnImport').addEventListener('click', importAll)
    }

    // ─── Load lists ──────────────────────────────────────────────────────────────
    async function loadLists() {
        if (!config.backendUrl || !config.authToken) {
            addLog('⚠️ Configure URL e token na extensão.', 'warn')
            return
        }
        try {
            const resp = await fetch(`${config.backendUrl}/api/extension/info`, {
                headers: { 'Authorization': `Bearer ${config.authToken}` }
            })
            if (resp.status === 401 || resp.status === 403) {
                addLog('❌ Token inválido. Reconfigure na extensão.', 'err'); return
            }
            if (!resp.ok) {
                const e = await resp.json().catch(() => ({}))
                addLog(`❌ Servidor (${resp.status}): ${e.error || 'erro desconhecido'}`, 'err'); return
            }
            const info = await resp.json()
            const sel = shadow.getElementById('listSelect')
            if (info.lists?.length) {
                sel.innerHTML = info.lists.map(l => `<option value="${l.id}">${l.name}</option>`).join('')
                shadow.getElementById('btnImport').disabled = false
                addLog(`✅ ${info.lists.length} lista(s) disponível(is). Pronto!`, 'ok')
            } else {
                sel.innerHTML = '<option value="">Nenhuma lista encontrada</option>'
                addLog('⚠️ Crie uma lista no SendMessage primeiro.', 'warn')
            }
        } catch (e) {
            addLog(`❌ Falha ao conectar: ${e.message}`, 'err')
        }
    }

    // ─── MAIN: Automated extraction loop ────────────────────────────────────────
    async function startAutoExtraction() {
        if (isRunning) return
        isRunning = true
        isStopRequested = false

        const listId = shadow.getElementById('listSelect').value
        if (autoImport && !listId) {
            addLog('⚠️ Selecione uma lista de destino antes de iniciar.', 'warn')
            isRunning = false
            return
        }

        // UI: show stop button
        shadow.getElementById('btnStart').style.display = 'none'
        shadow.getElementById('btnStop').style.display = 'flex'
        shadow.getElementById('btnClear').disabled = true
        setProgress(5, 'Iniciando...')

        addLog('🤖 Extração automática iniciada!', 'ok')

        const MAX_DRY_SCROLLS = 3
        let dryScrolls = 0

        try {
            while (!isStopRequested) {
                // Step 1: find new unprocessed cards
                const cards = getResultCards()
                const newCards = cards.filter(card => {
                    const name = getCardName(card)
                    return name && !processedNames.has(name)
                })

                if (newCards.length === 0) {
                    dryScrolls++
                    if (dryScrolls > MAX_DRY_SCROLLS) {
                        addLog('✅ Todos os resultados processados!', 'ok')
                        break
                    }
                    addLog(`🔄 Rolando para carregar mais... (${dryScrolls}/${MAX_DRY_SCROLLS})`, 'info')
                    scrollFeed()
                    await sleep(2500)
                    continue
                }

                dryScrolls = 0
                setProgress(
                    Math.min(90, (processedNames.size / (processedNames.size + newCards.length + 1)) * 100),
                    `Processando ${newCards.length} nova(s) empresa(s)...`
                )

                // Step 2: process each new card
                for (const card of newCards) {
                    if (isStopRequested) break

                    const name = getCardName(card)
                    processedNames.add(name)

                    addLog(`🔍 (${processedNames.size}) ${name}`, 'info')
                    updateStats()

                    let contact = extractCardData(card)

                    // Full mode: click to get phone
                    if (mode === 'full') {
                        try {
                            // Snapshot do título atual do painel de detalhes
                            // para detectar quando o painel muda de empresa
                            const prevTitle = getDetailPanelTitle()

                            const clickTarget =
                                card.querySelector('a[href*="/maps/place"]') ||
                                card.querySelector('a.hfpxzc') ||
                                card.querySelector('[role="link"]') ||
                                card
                            clickTarget.click()

                            // Aguarda o painel MUDAR para a empresa nova (até 6s)
                            const panelChanged = await waitForPanelChange(prevTitle, name, 6000)
                            if (!panelChanged) {
                                addLog(`  ⚠️ Painel não mudou a tempo — pulando telefone`, 'warn')
                            } else {
                                // Painel updated — agora lê o telefone com segurança
                                const phone = await waitForPhone(3000)
                                const website = extractWebsiteFromDetail()
                                contact.phone = phone || ''
                                contact.website = website || ''

                                if (phone) addLog(`  ✅ ${phone}`, 'ok')
                                else addLog(`  — sem telefone`, 'warn')
                            }

                            await goBackToList()
                            await sleep(500)
                        } catch (e) {
                            addLog(`  ⚠️ ${e.message}`, 'warn')
                        }
                    }

                    // Add contact (deduplication by name+address)
                    if (!isDuplicate(contact)) {
                        extractedContacts.push(contact)
                        contact._imported = false

                        // Auto-import to SendMessage
                        if (autoImport && listId) {
                            const result = await importSingle(contact, listId)
                            if (result === 'ok') { importedCount++; contact._imported = true; contact._dup = false }
                            else if (result === 'dup') { contact._dup = true }
                        }

                        appendCard(contact)
                        updateStats()
                    }

                    await sleep(mode === 'full' ? 300 : 80)
                }

                // Step 3: scroll to load more after each batch
                if (!isStopRequested) {
                    scrollFeed()
                    await sleep(2000)
                }
            }
        } catch (err) {
            addLog(`❌ Erro inesperado: ${err.message}`, 'err')
        } finally {
            shadow.getElementById('btnStart').style.display = 'flex'
            shadow.getElementById('btnStop').style.display = 'none'
            shadow.getElementById('btnClear').disabled = false
            setProgress(100, '✅ Concluído!')
            setTimeout(clearProgressBar, 2000)
            isRunning = false

            const imported = autoImport ? `, ${importedCount} importados` : ''
            addLog(`🏁 Finalizado! ${extractedContacts.length} extraídos${imported}.`, 'ok')
            shadow.getElementById('hSub').textContent = `${extractedContacts.length} extraídos, ${importedCount} importados`

            if (!autoImport && extractedContacts.length > 0) {
                shadow.getElementById('btnImport').disabled = false
            }
        }
    }

    // ─── Import single contact ───────────────────────────────────────────────────
    async function importSingle(contact, listId) {
        try {
            const resp = await fetch(`${config.backendUrl}/api/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.authToken}`,
                },
                body: JSON.stringify({
                    list_id: listId,
                    name: contact.name,
                    phone: (contact.phone || '').replace(/\D/g, ''),
                    email: '',
                    category: contact.category || 'Maps',
                    cep: '',
                    rating: contact.rating ? String(contact.rating) : '',
                })
            })
            if (resp.ok) return 'ok'
            if (resp.status === 409) return 'dup'
            return 'err'
        } catch { return 'err' }
    }

    // ─── Import all (manual button) ──────────────────────────────────────────────
    async function importAll() {
        const listId = shadow.getElementById('listSelect').value
        if (!listId) { addLog('⚠️ Selecione uma lista.', 'warn'); return }
        if (!extractedContacts.length) { addLog('⚠️ Nenhum contato para importar.', 'warn'); return }

        const btn = shadow.getElementById('btnImport')
        btn.disabled = true
        btn.textContent = '⟳ Importando...'
        addLog(`📤 Importando ${extractedContacts.length} contato(s)...`, 'info')

        let ok = 0, dup = 0, err = 0
        for (const c of extractedContacts) {
            const r = await importSingle(c, listId)
            if (r === 'ok') ok++
            if (r === 'dup') dup++
            if (r === 'err') err++
        }

        importedCount += ok
        updateStats()
        addLog(`✅ ${ok} importados, ${dup} já existiam, ${err} erros.`, ok > 0 ? 'ok' : 'warn')
        btn.textContent = '⬆️ Importar tudo agora'
        btn.disabled = false
    }

    // ─── DOM helpers ────────────────────────────────────────────────────────────
    function getResultCards() {
        const feed = document.querySelector('[role="feed"]')
        if (!feed) return []
        const cards = feed.querySelectorAll('div.Nv2PK, [role="article"]')
        return cards.length > 0 ? Array.from(cards) : Array.from(feed.children)
    }

    function getCardName(card) {
        return (
            card.querySelector('.fontHeadlineSmall') ||
            card.querySelector('.qBF1Pd') ||
            card.querySelector('[class*="fontHeadline"]')
        )?.textContent?.trim() || ''
    }

    function extractCardData(card) {
        const name = getCardName(card)
        const rating = card.querySelector('.MW4etd')?.textContent?.trim() || ''
        const metaEls = Array.from(card.querySelectorAll('.W4Efsd span'))
            .map(el => el.textContent?.trim())
            .filter(t => t && t.length > 1)
        const category = metaEls[0] || ''
        const address = metaEls.slice(1).join(' ') || ''
        return { name, rating, category, address, phone: '', website: '' }
    }

    function extractPhoneFromDetail() {
        const btn =
            document.querySelector('[data-item-id*="phone"]') ||
            document.querySelector('button[aria-label*="Telefone"]') ||
            document.querySelector('button[aria-label*="Phone"]')
        if (!btn) return null
        const text = btn.querySelector('.Io6YTe')?.textContent?.trim() ||
            btn.querySelector('span')?.textContent?.trim()
        return text && /\d/.test(text) ? text : null
    }

    function extractWebsiteFromDetail() {
        return document.querySelector('a[data-item-id="authority"]')?.href || null
    }

    async function waitForPhone(ms) {
        const end = Date.now() + ms
        while (Date.now() < end) {
            const p = extractPhoneFromDetail()
            if (p) return p
            await sleep(200)
        }
        return null
    }

    /**
     * Retorna o título atual exibido no painel de detalhes do Maps.
     * Usamos isso como "impressão digital" do painel antes de clicar.
     */
    function getDetailPanelTitle() {
        return (
            document.querySelector('.DUwDvf')?.textContent?.trim() ||
            document.querySelector('[data-attrid="title"]')?.textContent?.trim() ||
            document.querySelector('.fontHeadlineLarge')?.textContent?.trim() ||
            document.querySelector('h1')?.textContent?.trim() ||
            ''
        )
    }

    /**
     * Espera o painel de detalhes mudar de empresa.
     * Só retorna true quando o título muda E corresponde (ou muda) do prevTitle.
     */
    async function waitForPanelChange(prevTitle, expectedName, timeoutMs) {
        const end = Date.now() + timeoutMs
        while (Date.now() < end) {
            const current = getDetailPanelTitle()
            // Consideramos que mudou se:
            // 1. O título é diferente do anterior e não está vazio, OU
            // 2. O título contém parte do nome esperado
            if (current && current !== prevTitle) return true
            if (current && expectedName && current.toLowerCase().includes(expectedName.toLowerCase().substring(0, 8))) return true
            await sleep(150)
        }
        return false
    }

    async function goBackToList() {
        const btn =
            document.querySelector('button[aria-label="Voltar"]') ||
            document.querySelector('button[aria-label="Back"]') ||
            document.querySelector('button[jsaction*="back"]') ||
            document.querySelector('[data-tooltip="Voltar"]')
        if (btn) { btn.click(); await sleep(700); return }

        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape', code: 'Escape', bubbles: true, cancelable: true
        }))
        await sleep(600)
    }

    function scrollFeed() {
        const feed = document.querySelector('[role="feed"]')
        const panel = document.querySelector('.m6QErb.DxyBCb') || document.querySelector('.m6QErb')
        if (feed) feed.scrollTop += 900
        else if (panel) panel.scrollTop += 900
    }

    // ─── Contact helpers ─────────────────────────────────────────────────────────
    function isDuplicate(c) {
        return extractedContacts.some(x => x.name === c.name && x.address === c.address)
    }

    function appendCard(c) {
        const list = shadow.getElementById('contactsList')
        const div = document.createElement('div')
        div.className = 'contact-card'
        div.innerHTML = `
            <div class="avatar">${(c.name[0] || '?').toUpperCase()}</div>
            <div class="contact-info">
                <div class="cname">${esc(c.name)}${c._dup ? ' <span class="tag-imp" style="background:#fef3c7;color:#92400e;">já existia</span>' : c._imported ? ' <span class="tag-imp">✓ importado</span>' : ''}</div>
                <div class="cmeta">${esc(c.category)} · ${esc(c.address.split(',')[0] || '')}</div>
                ${c.phone ? `<div class="cphone">📞 ${esc(c.phone)}</div>` : ''}
            </div>
        `
        list.appendChild(div)
        list.scrollTop = list.scrollHeight
        shadow.getElementById('contactsCount').textContent = `${extractedContacts.length} contatos`
    }

    function clearAll() {
        extractedContacts = []
        processedNames.clear()
        importedCount = 0
        shadow.getElementById('contactsList').innerHTML = ''
        shadow.getElementById('contactsCount').textContent = '0 contatos'
        updateStats()
        addLog('🗑️ Resultados limpos.', 'info')
    }

    // ─── UI helpers ──────────────────────────────────────────────────────────────
    function updateStats() {
        shadow.getElementById('statExtracted').textContent = extractedContacts.length
        shadow.getElementById('statImported').textContent = importedCount
        const dups = extractedContacts.filter(c => c._dup).length
        shadow.getElementById('statSkipped').textContent = dups
    }

    function addLog(msg, type = 'info') {
        const panel = shadow?.getElementById('logPanel')
        if (!panel) return
        const el = document.createElement('div')
        el.className = `log-entry ${type}`
        const t = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        el.textContent = `[${t}] ${msg}`
        panel.appendChild(el)
        panel.scrollTop = panel.scrollHeight
        while (panel.children.length > 100) panel.removeChild(panel.firstChild)
    }

    function setProgress(pct, text) {
        const w = shadow?.getElementById('progressWrap')
        if (!w) return
        w.style.display = 'block'
        shadow.getElementById('progressFill').style.width = `${pct}%`
        if (text) shadow.getElementById('progressText').textContent = text
    }

    function clearProgressBar() {
        const w = shadow?.getElementById('progressWrap')
        if (w) w.style.display = 'none'
    }

    function esc(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

})()
