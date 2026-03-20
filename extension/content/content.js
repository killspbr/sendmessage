/**
 * SendMessage Maps Extractor — Content Script (Refatorado v1.1.0)
 * Sistema Robusto de Extração via Máquina de Estados
 */
; (function () {
    if (window.__smExtractorLoaded) return;
    window.__smExtractorLoaded = true;

    // ==========================================
    // 1. CONTROLE DE ESTADO (MapsState)
    // ==========================================
    const MapsState = {
        sidebarHost: null,
        shadow: null,
        extractedContacts: [],
        isRunning: false,
        isStopRequested: false,
        processedIds: new Set(), // Usando ID único do Maps para não repetir
        attemptCounts: new Map(),
        importedCount: 0,
        currentUrl: window.location.href,
        config: { 
            backendUrl: '', 
            authToken: '' 
        },
        autoImport: true,
        status: 'IDLE',

        applyRuntimeConfig(overrides = {}) {
            const nextBackendUrl = typeof overrides.backendUrl === 'string'
                ? overrides.backendUrl.trim().replace(/\/+$/, '')
                : '';
            const nextAuthToken = typeof overrides.authToken === 'string'
                ? overrides.authToken.trim()
                : '';

            if (nextBackendUrl) this.config.backendUrl = nextBackendUrl;
            if (nextAuthToken) this.config.authToken = nextAuthToken;
        },
        
        async initConfig(overrides = {}) {
            return new Promise((resolve) => {
                chrome.storage.local.get(['sm_backendUrl', 'sm_authToken'], (data) => {
                    this.config.backendUrl = (data.sm_backendUrl || '').trim().replace(/\/+$/, '');
                    this.config.authToken = (data.sm_authToken || '').trim();
                    this.applyRuntimeConfig(overrides);
                    if (this.config.backendUrl && this.config.authToken) {
                        MapsLogger.add("🔑 Configuração carregada com sucesso.", "ok");
                    } else {
                        MapsLogger.add("⚠️ Credenciais não encontradas. Verifique o Painel SendMessage.", "warn");
                    }
                    resolve();
                });
            });
        },
        
        reset() {
            this.extractedContacts = [];
            this.processedIds.clear();
            this.attemptCounts.clear();
            this.importedCount = 0;
            this.isStopRequested = false;
        }
    };

    // ==========================================
    // 2. SISTEMA DE LOGS (MapsLogger)
    // ==========================================
    const MapsLogger = {
        add(msg, type = 'info') {
            const panel = MapsState.shadow?.getElementById('logPanel');
            if (!panel) return;
            
            const entry = document.createElement('div');
            entry.className = `log-entry ${type}`;
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            entry.innerText = `[${time}] ${msg}`;
            
            panel.prepend(entry);
            console.log(`[SM Maps] [${type.toUpperCase()}] ${msg}`);
            
            // Limitar logs para performance
            if (panel.children.length > 50) panel.lastChild.remove();
        }
    };

    // ==========================================
    // 3. NAVEGADOR E SCROLL (MapsNavigator)
    // ==========================================
    const MapsNavigator = {
        getFeed() {
            // Seletor do container da lista de resultados
            return document.querySelector('div[role="feed"]') || 
                   document.querySelector('div[aria-label^="Resultados"]');
        },

        looksLikeResultCard(card) {
            if (!card || !card.isConnected) return false;

            const hasTitle = !!card.querySelector(
                '.qBF1Pd, .fontHeadlineSmall, .NrDZNb, .lS69S, a.hfpxzc, a[href*="/maps/place/"]'
            );
            const text = (card.innerText || '').trim();

            return hasTitle && text.length > 0;
        },

        getVisibleCards() {
            const feed = this.getFeed();
            if (!feed) return [];

            const uniqueCards = new Set();
            const resultCards = [];

            const addCard = (node) => {
                if (!node || uniqueCards.has(node) || !this.looksLikeResultCard(node)) return;
                uniqueCards.add(node);
                resultCards.push(node);
            };

            const anchors = Array.from(feed.querySelectorAll('a.hfpxzc, a[href*="/maps/place/"]'));
            for (const anchor of anchors) {
                addCard(
                    anchor.closest('div.Nv2PK')
                    || anchor.closest('div[role="article"]')
                    || anchor.closest('div.Nv2Y7z')
                    || anchor.parentElement
                );
            }

            if (resultCards.length === 0) {
                const fallbackCards = Array.from(feed.querySelectorAll('div.Nv2PK, div[role="article"], div.Nv2Y7z'));
                for (const card of fallbackCards) addCard(card);
            }

            return resultCards;
        },

        scrollFeed() {
            const feed = this.getFeed();
            if (feed) {
                feed.scrollBy(0, 800);
            }
        },

        async scrollToCard(card) {
            card.scrollIntoView({ behavior: 'instant', block: 'center' });
            await new Promise(r => setTimeout(r, 600));
        }
    };

    // ==========================================
    // 4. INTERAÇÃO E CLIQUES (MapsInteraction)
    // ==========================================
    const MapsInteraction = {
        async safeClick(card, name) {
            const anchor = card.querySelector('a.hfpxzc, a[href*="/maps/place/"]');
            const roleLink = card.querySelector('[role="link"]');
            const clickableTarget = roleLink || card;

            if (!clickableTarget) {
                MapsLogger.add(`⚠️ Nenhum alvo clicável encontrado para: ${name}`, 'warn');
                return false;
            }

            let restoreHref = null;
            if (anchor) {
                const href = anchor.getAttribute('href');
                if (href) {
                    restoreHref = () => anchor.setAttribute('href', href);
                    anchor.removeAttribute('href');
                    anchor.style.cursor = 'pointer';
                }
            }

            const rect = clickableTarget.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            MapsLogger.add(`🖱️ Abrindo detalhe: ${name}`, 'info');

            const options = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
            const clickChain = [
                ['pointerdown', PointerEvent],
                ['mousedown', MouseEvent],
                ['pointerup', PointerEvent],
                ['mouseup', MouseEvent],
                ['click', MouseEvent],
            ];

            clickableTarget.focus?.();
            for (const target of [clickableTarget, roleLink, card, anchor].filter(Boolean)) {
                for (const [eventName, EventCtor] of clickChain) {
                    target.dispatchEvent(new EventCtor(eventName, options));
                }
            }

            clickableTarget.click?.();
            if (clickableTarget !== card) {
                card.click?.();
            }

            if (restoreHref) {
                setTimeout(restoreHref, 1000);
            }

            if (!/^(www\.)?google\.com$/.test(window.location.host) && window.location.host !== 'maps.google.com') {
                MapsLogger.add(`❌ URL mudou indevidamente! Abortando.`, 'err');
                return false;
            }

            return true;
        },

        async closeDetail(panel = null) {
            const root = panel || MapsExtractor.getActiveDetailPanel() || document;
            const closeBtn = root.querySelector('button[aria-label*="Fechar"], button[aria-label*="Close"], [data-value="Fechar"]')
                || document.querySelector('button[aria-label*="Fechar"], button[aria-label*="Close"], [data-value="Fechar"]');
            if (closeBtn) {
                closeBtn.click();
                await new Promise(r => setTimeout(r, 700));
                return;
            }

            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Escape',
                code: 'Escape',
                bubbles: true,
                cancelable: true,
            }));
            await new Promise(r => setTimeout(r, 700));
        }
    };

    // ==========================================
    // 5. EXTRATOR DE DADOS (MapsExtractor)
    // ==========================================
    const MapsExtractor = {
        normalizeText(value) {
            return String(value || '')
                .normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
        },

        isVisible(element) {
            return !!(element && element.isConnected && element.getClientRects().length > 0);
        },

        getVisibleElement(selectors, root = document) {
            for (const selector of selectors) {
                const elements = Array.from(root.querySelectorAll(selector));
                const visible = elements.find((element) => this.isVisible(element));
                if (visible) return visible;
            }
            return null;
        },

        getCandidateDetailPanels() {
            const panels = [];
            const seen = new Set();

            const addPanel = (element) => {
                if (!element || seen.has(element) || !this.isVisible(element)) return;
                seen.add(element);
                panels.push(element);
            };

            const titleElements = Array.from(document.querySelectorAll(
                'h1.DUwDvf, h1.fontHeadlineLarge, .DUwDvf, [role="main"] h1'
            )).filter((element) => this.isVisible(element));

            for (const titleElement of titleElements) {
                addPanel(
                    titleElement.closest('div[role="main"]')
                    || titleElement.closest('.m6QErb')
                    || titleElement.closest('.DUwDbc')
                    || titleElement.parentElement
                );
            }

            const directPanels = Array.from(document.querySelectorAll(
                'div[role="main"], .m6QErb[aria-label], .bJz9P, .DUwDbc'
            ));
            for (const panel of directPanels) addPanel(panel);

            return panels;
        },

        getActiveDetailPanel() {
            const candidates = this.getCandidateDetailPanels();
            return candidates.find((panel) => !!this.getDetailTitle(panel)) || candidates[0] || null;
        },

        getDetailTitle(panel = null) {
            const root = panel || this.getActiveDetailPanel() || document;
            const title = this.getVisibleElement([
                'h1.DUwDvf',
                'h1.fontHeadlineLarge',
                '.DUwDvf',
                'h1',
            ], root);

            return title?.innerText?.trim() || '';
        },

        getPanelSignature(panel = null) {
            const root = panel || this.getActiveDetailPanel();
            if (!root) return '';

            const title = this.getDetailTitle(root);
            const text = root.innerText || '';
            const website = root.querySelector('a[href^="http"]')?.href || '';

            return [
                this.normalizeText(title),
                this.normalizeText(text).slice(0, 240),
                website,
                window.location.href,
            ].join('|');
        },

        getWordTokens(value) {
            return this.normalizeText(value)
                .split(/[^a-z0-9]+/)
                .filter((token) => token.length >= 3);
        },

        hasRelevantTokenOverlap(source, expected, minimumRatio = 0.6) {
            const expectedTokens = this.getWordTokens(expected);
            if (expectedTokens.length === 0) return false;

            const sourceTokens = new Set(this.getWordTokens(source));
            const matchedCount = expectedTokens.filter((token) => sourceTokens.has(token)).length;

            return (matchedCount / expectedTokens.length) >= minimumRatio;
        },

        panelMatchesExpected(panel, expectedContact) {
            if (!panel || !expectedContact) return false;

            const panelTitle = this.normalizeText(this.getDetailTitle(panel));
            const expectedName = this.normalizeText(expectedContact.name);
            const expectedAddress = this.normalizeText(expectedContact.address_short);
            const panelText = this.normalizeText(panel.innerText || '');

            const strongTitleMatch = !!panelTitle && (
                panelTitle.includes(expectedName) || expectedName.includes(panelTitle)
            );
            const fuzzyTitleMatch = !!panelTitle && this.hasRelevantTokenOverlap(panelTitle, expectedName, 0.6);
            const titleMatches = strongTitleMatch || fuzzyTitleMatch;

            if (!titleMatches) return false;

            const addressMatches = !expectedAddress
                || panelText.includes(expectedAddress)
                || this.hasRelevantTokenOverlap(panelText, expectedAddress, 0.5);

            if (strongTitleMatch) return true;

            return addressMatches;
        },

        async waitForDetailPanel(expectedContact, previousPanelSignature = '', timeoutMs = 7000) {
            const startTime = Date.now();
            let lastVisiblePanel = null;

            while (Date.now() - startTime < timeoutMs) {
                const panels = this.getCandidateDetailPanels();
                for (const panel of panels) {
                    lastVisiblePanel = panel;
                    const panelSignature = this.getPanelSignature(panel);

                    if (this.panelMatchesExpected(panel, expectedContact) && panelSignature !== previousPanelSignature) {
                        return panel;
                    }
                }

                await new Promise(r => setTimeout(r, 250));
            }

            if (lastVisiblePanel && this.panelMatchesExpected(lastVisiblePanel, expectedContact)) {
                return lastVisiblePanel;
            }

            return null;
        },

        buildStableId(card, name) {
            const rawId = card.getAttribute('data-result-id');
            if (rawId) return rawId;

            const href = card.querySelector('a.hfpxzc, a[href*="/maps/place/"]')?.getAttribute('href') || '';
            const categoryText = this.extractCardMeta(card).rawMeta || '';
            const seed = [name, href, categoryText]
                .filter(Boolean)
                .join('|')
                .normalize('NFKD')
                .replace(/[^\w|/-]+/g, '_')
                .slice(0, 160);

            return `sm-${seed || `idx-${Date.now()}`}`;
        },

        cleanCardText(value) {
            return String(value || '')
                .replace(/^Ver detalhes de\s+/i, '')
                .replace(/^Results? for\s+/i, '')
                .replace(/\s+/g, ' ')
                .trim();
        },

        getCardName(card) {
            const candidates = [
                card.querySelector('.qBF1Pd'),
                card.querySelector('.fontHeadlineSmall'),
                card.querySelector('.NrDZNb'),
                card.querySelector('.lS69S'),
                card.querySelector('a.hfpxzc'),
                card.querySelector('a[href*="/maps/place/"]'),
                card.querySelector('[role="link"][aria-label]'),
                card.querySelector('div[role="link"] div:first-child'),
            ];

            for (const element of candidates) {
                if (!element) continue;

                const rawValue = [
                    element.innerText,
                    element.textContent,
                    element.getAttribute?.('aria-label'),
                ].find(Boolean);

                const value = this.cleanCardText(rawValue).split('\n')[0].trim();
                if (value && !/^(patrocinado|anuncio)$/i.test(value)) {
                    return value;
                }
            }

            const lines = (card.innerText || '')
                .split('\n')
                .map((line) => this.cleanCardText(line))
                .filter(Boolean)
                .filter((line) => !/^(patrocinado|anuncio|fechado|aberto)$/i.test(line));

            return lines[0] || 'Sem nome';
        },

        extractCardMeta(card) {
            const metaCandidates = Array.from(
                card.querySelectorAll('.W4Efsd, .W4Efsf, .W4Efsd > span, .W4Efsf > span')
            )
                .map((element) => (element.innerText || element.textContent || '').trim())
                .filter(Boolean);

            const rawMeta = metaCandidates.find((value) => /·|Â·/.test(value))
                || metaCandidates.find((value) => value.length > 4)
                || '';

            const parts = rawMeta
                .split(/·|Â·/)
                .map((part) => part.trim())
                .filter(Boolean);

            return {
                rawMeta,
                category: parts[0] || 'Negocio',
                address_short: parts.slice(1).join(' - '),
            };
        },

        // Dados rápidos do card (Nível 1)
        extractFromCard(card) {
            const name = this.getCardName(card);
            const meta = this.extractCardMeta(card);
            
            // Gerar um ID baseado no nome e posição se não houver ID real
            const id = this.buildStableId(card, name);

            return {
                id,
                name,
                rating: card.querySelector('.MW4T7d, .MW4etd, .AJB71c')?.innerText || '',
                category: meta.category,
                address_short: meta.address_short
            };
        },

        extractPhoneFromPanel(panel) {
            const phoneSelectors = [
                'button[data-item-id*="phone"]',
                'button[data-tooltip*="telefone"]',
                'button[data-tooltip*="phone"]',
                'button[aria-label*="Telefone"]',
                'button[aria-label*="Phone"]',
                '[src*="phone_black_24dp"]',
            ];

            for (const selector of phoneSelectors) {
                const elements = Array.from(panel.querySelectorAll(selector));
                for (const element of elements) {
                    const rawText = [
                        element.innerText,
                        element.textContent,
                        element.getAttribute('aria-label'),
                        element.closest('button')?.innerText,
                    ].filter(Boolean).join(' ');

                    const normalizedPhone = rawText.replace(/[^\d+]/g, '');
                    if (normalizedPhone.length >= 8) {
                        return normalizedPhone;
                    }
                }
            }

            const looseMatch = (panel.innerText || '').match(/(?:\+?\d[\d\s().-]{7,}\d)/);
            return looseMatch ? looseMatch[0].replace(/[^\d+]/g, '') : '';
        },

        extractWebsiteFromPanel(panel) {
            const websiteElement = this.getVisibleElement([
                'a[data-item-id="authority"]',
                'a[data-tooltip*="website"]',
                'a[aria-label*="website"]',
                'a[aria-label*="site"]',
                'a[href^="http"]',
            ], panel);

            const href = websiteElement?.href || '';
            return href.startsWith('http') ? href : '';
        },

        // Dados profundos do painel (Nível 2)
        async extractFromDetail(panel) {
            if (!panel) {
                MapsLogger.add("⚠️ Painel de detalhes não carregou", "warn");
                return {};
            }

            const detailScroll = panel.querySelector('.m6766B, .section-layout, .m6QErb') || panel;
            if (detailScroll) detailScroll.scrollBy(0, 400);
            await new Promise(r => setTimeout(r, 800));

            const phone = this.extractPhoneFromPanel(panel);
            const website = this.extractWebsiteFromPanel(panel);

            return { phone, website };
        }
    };

    // ==========================================
    // 6. MOTOR DE MÁQUINA DE ESTADOS (Engine)
    // ==========================================
    const ExtractionEngine = {
        async run() {
            if (MapsState.isRunning) return;
            
            const listId = this.validateList();
            if (!listId) return;

            MapsState.isRunning = true;
            this.updateUI(true);
            MapsLogger.add("🚀 Iniciando Motor de Extração v1.1", "ok");
            let consecutiveEmptyScrolls = 0;

            try {
                while (!MapsState.isStopRequested) {
                    this.setState('SCANNING');
                    const cards = MapsNavigator.getVisibleCards();
                    
                    // Filtrar apenas os não processados
                    const pendingCards = cards.filter(card => {
                        const data = MapsExtractor.extractFromCard(card);
                        return !MapsState.processedIds.has(data.id) && (MapsState.attemptCounts.get(data.id) || 0) < 3;
                    });

                    if (pendingCards.length === 0) {
                        consecutiveEmptyScrolls++;
                        MapsLogger.add("🔄 Rolando feed para buscar novos registros...", "info");
                        MapsNavigator.scrollFeed();
                        await new Promise(r => setTimeout(r, 2000));

                        if (consecutiveEmptyScrolls >= 4) {
                            MapsLogger.add("ℹ️ Nenhum novo resultado foi encontrado após várias rolagens. Encerrando automaticamente.", "warn");
                            break;
                        }

                        continue;
                    }

                    consecutiveEmptyScrolls = 0;

                    for (const card of pendingCards) {
                        if (MapsState.isStopRequested) break;

                        // 1. Identificar e focar
                        const basicData = MapsExtractor.extractFromCard(card);
                        const nextAttemptCount = (MapsState.attemptCounts.get(basicData.id) || 0) + 1;
                        MapsState.attemptCounts.set(basicData.id, nextAttemptCount);
                        await MapsNavigator.scrollToCard(card);
                        
                        // 2. Abrir Detalhe
                        this.setState('OPENING');
                        const previousPanelSignature = MapsExtractor.getPanelSignature();
                        const success = await MapsInteraction.safeClick(card, basicData.name);
                        
                        if (success) {
                            // 3. Extrair dados detalhados
                            this.setState('EXTRACTING');
                            const activePanel = await MapsExtractor.waitForDetailPanel(basicData, previousPanelSignature);

                            if (!activePanel) {
                                MapsLogger.add(`⚠️ Não foi possível confirmar o painel correto para: ${basicData.name}`, 'warn');
                                if (nextAttemptCount >= 3) {
                                    MapsLogger.add(`⚠️ Item ignorado após ${nextAttemptCount} tentativas: ${basicData.name}`, 'warn');
                                    MapsState.processedIds.add(basicData.id);
                                }
                                await MapsInteraction.closeDetail();
                                continue;
                            }

                            const detailData = await MapsExtractor.extractFromDetail(activePanel);
                            
                            const finalContact = { ...basicData, ...detailData };
                            MapsState.extractedContacts.push(finalContact);
                            MapsState.processedIds.add(finalContact.id);
                            MapsState.attemptCounts.delete(finalContact.id);

                            if (finalContact.phone) {
                                MapsLogger.add(`✅ Capturado: ${finalContact.phone}`, 'ok');
                            } else {
                                MapsLogger.add(`⚪ Sem telefone: ${finalContact.name}`, 'warn');
                            }

                            // 4. Importar se necessário
                            if (MapsState.autoImport) {
                                await this.importContact(finalContact, listId);
                            }

                            this.syncStats();
                            await MapsInteraction.closeDetail(activePanel);
                        }

                        if (!success && nextAttemptCount >= 3) {
                            MapsLogger.add(`⚠️ Clique falhou repetidamente. Item ignorado: ${basicData.name}`, 'warn');
                            MapsState.processedIds.add(basicData.id);
                        }

                        this.setState('MOVING');
                        await new Promise(r => setTimeout(r, 500));
                    }
                }
            } catch (err) {
                this.setState('ERROR');
                MapsLogger.add(`❌ Falha Crítica: ${err.message}`, 'err');
                console.error(err);
            } finally {
                this.finish();
            }
        },

        setState(s) {
            MapsState.status = s;
            const sub = MapsState.shadow?.getElementById('hSub');
            if (sub) sub.innerText = `Estado: ${s}`;
        },

        validateList() {
            const listSelect = MapsState.shadow.getElementById('listSelect');
            const val = listSelect.value;
            const match = val.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            if (!match) {
                MapsLogger.add("⚠️ Selecione uma lista válida!", "err");
                return null;
            }
            return match[0];
        },

        async importContact(contact, listId) {
            const payload = {
                list_id: listId,
                name: contact.name,
                phone: contact.phone,
                category: contact.category,
                rating: contact.rating,
                address: contact.address_short,
                website: contact.website
            };

            const resp = await backendFetch(`${MapsState.config.backendUrl}/api/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MapsState.config.authToken}`,
                },
                body: JSON.stringify(payload)
            });

            if (resp?.ok) {
                MapsState.importedCount++;
                return true;
            }

            const detail = resp?.data?.error || resp?.error || `status ${resp?.status ?? 'desconhecido'}`;
            MapsLogger.add(`❌ Falha ao importar "${contact.name}": ${detail}`, 'err');
            return false;
        },

        syncStats() {
            const $ = id => MapsState.shadow.getElementById(id);
            if ($('statExtracted')) $('statExtracted').innerText = MapsState.extractedContacts.length;
            if ($('statImported')) $('statImported').innerText = MapsState.importedCount;
            if ($('contactsCount')) $('contactsCount').innerText = `${MapsState.extractedContacts.length} contatos`;
            
            // Renderizar na lista visual
            this.appendToList(MapsState.extractedContacts[MapsState.extractedContacts.length - 1]);
        },

        appendToList(c) {
            const list = MapsState.shadow.getElementById('contactsList');
            const item = document.createElement('div');
            item.className = 'contact-card';
            item.innerHTML = `
                <div class="avatar">${c.name[0]}</div>
                <div class="contact-info">
                    <div class="cname">${c.name}</div>
                    <div class="cphone">${c.phone || 'Sem Telefone'}</div>
                    <div class="cmeta">${c.category} • ${c.rating || 'N/A'}⭐</div>
                </div>
            `;
            list.prepend(item);
        },

        updateUI(running) {
            const $ = id => MapsState.shadow.getElementById(id);
            $('btnStart').style.display = running ? 'none' : 'flex';
            $('btnStop').style.display = running ? 'flex' : 'none';
        },

        finish() {
            MapsState.isRunning = false;
            this.setState('FINISHED');
            this.updateUI(false);
            MapsLogger.add(`🏁 Ciclo encerrado. Total: ${MapsState.extractedContacts.length}`, 'ok');
        }
    };

    // ==========================================
    // 7. INICIALIZAÇÃO DA SIDEBAR (Legado adaptado)
    // ==========================================
    async function openSidebar(configOverrides = null) {
        if (MapsState.sidebarHost) {
            if (configOverrides) MapsState.applyRuntimeConfig(configOverrides);
            MapsState.sidebarHost.style.display = 'flex';
            await loadLists();
            return;
        }

        MapsState.sidebarHost = document.createElement('div');
        MapsState.sidebarHost.id = 'sm-extractor-host';
        MapsState.sidebarHost.style.cssText = `
            position: fixed !important; top: 0 !important; right: 0 !important;
            width: 360px !important; height: 100vh !important;
            z-index: 2147483647 !important; display: flex !important;
            flex-direction: column !important;
            box-shadow: -6px 0 32px rgba(0,0,0,0.18) !important;
            background: #f8fafc !important;
        `;
        MapsState.shadow = MapsState.sidebarHost.attachShadow({ mode: 'open' });
        MapsState.shadow.innerHTML = getSidebarHTML();
        document.body.appendChild(MapsState.sidebarHost);
        
        // Bind UI Events
        const shadow = MapsState.shadow;
        shadow.getElementById('btnClose').onclick = () => MapsState.sidebarHost.style.display = 'none';
        shadow.getElementById('btnStart').onclick = () => ExtractionEngine.run();
        shadow.getElementById('btnStop').onclick = () => {
            MapsState.isStopRequested = true;
            MapsLogger.add("🛑 Parada solicitada...", "warn");
        };
        shadow.getElementById('btnClear').onclick = () => {
             shadow.getElementById('contactsList').innerHTML = '';
             MapsState.reset();
             ExtractionEngine.syncStats();
        };

        await MapsState.initConfig(configOverrides || {});
        await loadLists();
    }

    // Funções de apoio (Backend Fetch e HTML)
    async function backendFetch(url, options = {}) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'apiFetch', params: { url, options } }, resolve);
        });
    }

    async function loadLists() {
        if (!MapsState.config.backendUrl) {
            await MapsState.initConfig();
        }

        if (!MapsState.config.backendUrl) return;

        MapsLogger.add("📡 Buscando listas no servidor...", "info");
        const endpoint = `${MapsState.config.backendUrl}/api/extension/info`;
        const resp = await backendFetch(endpoint, {
            headers: { 'Authorization': `Bearer ${MapsState.config.authToken}` }
        });
        if (resp?.ok) {
            const sel = MapsState.shadow.getElementById('listSelect');
            sel.innerHTML = '<option value="">Selecione uma lista</option>' + 
                            resp.data.lists.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
            MapsLogger.add(`📋 ${resp.data.lists.length} listas carregadas.`, "ok");
        } else {
            const detail = resp?.data?.error || resp?.error || `status ${resp?.status ?? 'desconhecido'}`;
            MapsLogger.add(`❌ Erro ao carregar listas do servidor: ${detail}`, "err");
        }
    }

    function getSidebarHTML() {
        // Reduzido para brevidade no exemplo, mas manterá o estilo premium completo
        return `
        <style>
            .sidebar { font-family: sans-serif; height: 100vh; display:flex; flex-direction:column; background: #fff; }
            .header { background: #059669; color: #fff; padding: 15px; display:flex; justify-content: space-between; align-items: center; }
            .log-panel { background: #1e293b; color: #cbd5e1; height: 150px; overflow-y: auto; font-family: monospace; font-size: 10px; padding: 10px; }
            .log-entry.ok { color: #4ade80; }
            .log-entry.warn { color: #facc15; }
            .log-entry.err { color: #f87171; }
            .controls { padding: 15px; display: flex; gap: 10px; border-bottom: 1px solid #e2e8f0; }
            .btn-start { background: #059669; color: #fff; border:none; padding: 10px; flex:1; cursor:pointer; border-radius: 5px; }
            .btn-stop { background: #ef4444; color: #fff; border:none; padding: 10px; flex:1; cursor:pointer; display:none; border-radius: 5px; }
            .body { flex:1; overflow-y: auto; padding: 10px; }
            .contact-card { padding: 10px; border-bottom: 1px solid #f1f5f9; display: flex; gap: 10px; align-items: center; }
            .avatar { width: 30px; height: 30px; background: #059669; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; }
            .cname { font-weight: bold; font-size: 12px; }
            .cphone { color: #059669; font-size: 11px; }
            .footer { padding: 15px; border-top: 1px solid #e2e8f0; }
            select { width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #e2e8f0; }
        </style>
        <div class="sidebar">
            <div class="header">
                <div>
                    <strong>SendMessage Maps</strong>
                    <div id="hSub" style="font-size: 9px; opacity: 0.8;">Pronto</div>
                </div>
                <button id="btnClose" style="background:none; border:none; color:#fff; cursor:pointer;">✕</button>
            </div>
            <div class="log-panel" id="logPanel"></div>
            <div class="controls">
                <button id="btnStart" class="btn-start">Iniciar Extração</button>
                <button id="btnStop" class="btn-stop">Parar</button>
                <button id="btnClear">🗑️</button>
            </div>
            <div class="stats" style="display:flex; padding: 10px; text-align:center; font-size: 11px; border-bottom: 1px solid #f1f5f9;">
                <div style="flex:1">Extraídos: <span id="statExtracted">0</span></div>
                <div style="flex:1">Importados: <span id="statImported">0</span></div>
            </div>
            <div class="body">
                <div id="contactsCount" style="font-size: 11px; font-weight: bold; margin-bottom: 5px;">0 contatos</div>
                <div id="contactsList"></div>
            </div>
            <div class="footer">
                <select id="listSelect"><option>Carregando listas...</option></select>
            </div>
        </div>
        `;
    }

    // Ouvinte de mensagens da extensão
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.action === 'openSidebar') openSidebar(msg.config || null);
        return true;
    });

})();
