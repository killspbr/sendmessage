import React, { useState, useCallback } from 'react'
import { apiFetch } from '../api'

// ─── Types ────────────────────────────────────────────────────────────────────

type PlaceResult = {
    place_id: string
    name: string
    address: string
    rating: number | null
    total_ratings: number
    category: string
    location: { lat: number; lng: number } | null
    phone: string | null
    website: string | null
    loadingDetails?: boolean
    detailsLoaded?: boolean
}

type ExtractPageProps = {
    onAiExtractContact: (file: File) => Promise<void>
    isExtracting: boolean
    lastMessage: string | null
    lists: { id: string; name: string }[]
    existingPhones: Set<string>
    googleMapsApiKey?: string
    onImportContacts: (contacts: {
        name: string
        phone: string
        email: string
        category: string
        cep: string
        rating: string
    }[], listId: string) => Promise<void>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizePhoneForCompare(phone: string): string {
    return phone.replace(/\D/g, '').replace(/^(\d{2})55/, '$1').replace(/^55/, '')
}

function categoryLabel(raw: string): string {
    const map: Record<string, string> = {
        restaurant: 'Restaurante',
        food: 'Alimentação',
        store: 'Loja',
        lodging: 'Hospedagem',
        health: 'Saúde',
        beauty_salon: 'Salão de Beleza',
        gym: 'Academia',
        car_repair: 'Oficina',
        grocery_or_supermarket: 'Supermercado',
        pharmacy: 'Farmácia',
        bank: 'Banco',
        school: 'Escola',
        lawyer: 'Advocacia',
        accounting: 'Contabilidade',
        dentist: 'Dentista',
    }
    return map[raw] || raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExtractPage({
    onAiExtractContact,
    isExtracting,
    lastMessage,
    lists,
    existingPhones,
    googleMapsApiKey,
    onImportContacts,
}: ExtractPageProps) {
    // Tabs
    const [activeTab, setActiveTab] = useState<'image' | 'maps'>('maps')

    // Image extraction
    const [dragActive, setDragActive] = useState(false)

    // Maps search
    const [searchQuery, setSearchQuery] = useState('')
    const [searchLocation, setSearchLocation] = useState('')
    const [places, setPlaces] = useState<PlaceResult[]>([])
    const [nextPageToken, setNextPageToken] = useState<string | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)
    const [mapEmbedQuery, setMapEmbedQuery] = useState<string | null>(null)
    const [mapEmbedApiKey, setMapEmbedApiKey] = useState<string>('')

    // Selection & import
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [targetListId, setTargetListId] = useState<string>(lists[0]?.id ?? '')
    const [isImporting, setIsImporting] = useState(false)
    const [importMessage, setImportMessage] = useState<string | null>(null)
    const [loadingDetailsFor, setLoadingDetailsFor] = useState<Set<string>>(new Set())

    // ── Image handlers ──────────────────────────────────────────────────────────

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
        else if (e.type === 'dragleave') setDragActive(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files?.[0]) onAiExtractContact(e.dataTransfer.files[0])
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files?.[0]) onAiExtractContact(e.target.files[0])
    }

    // ── Maps search ─────────────────────────────────────────────────────────────

    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!searchQuery.trim() || !searchLocation.trim()) return

        setIsSearching(true)
        setSearchError(null)
        setPlaces([])
        setNextPageToken(null)
        setSelected(new Set())
        setImportMessage(null)

        const embedQ = encodeURIComponent(`${searchQuery} em ${searchLocation}`)
        setMapEmbedQuery(embedQ)
        setMapEmbedApiKey(googleMapsApiKey || '')

        try {
            const data = await apiFetch('/api/extract/maps/search', {
                method: 'POST',
                body: JSON.stringify({ query: searchQuery, location: searchLocation }),
            })
            setPlaces(data.places || [])
            setNextPageToken(data.nextPageToken || null)

            if (!data.places?.length) {
                setSearchError('Nenhum resultado encontrado. Tente termos mais específicos.')
            }
        } catch (err: any) {
            setSearchError(err?.message || 'Erro ao buscar. Verifique a chave da API do Google Maps em Configurações.')
        } finally {
            setIsSearching(false)
        }
    }, [searchQuery, searchLocation, googleMapsApiKey])

    const handleLoadMore = async () => {
        if (!nextPageToken || isSearching) return
        setIsSearching(true)
        try {
            const data = await apiFetch('/api/extract/maps/next-page', {
                method: 'POST',
                body: JSON.stringify({ pageToken: nextPageToken }),
            })
            setPlaces(prev => [...prev, ...(data.places || [])])
            setNextPageToken(data.nextPageToken || null)
        } catch (err: any) {
            setSearchError(err?.message || 'Erro ao carregar mais resultados.')
        } finally {
            setIsSearching(false)
        }
    }

    // Load phone + website for a specific place
    const handleLoadDetails = async (placeId: string) => {
        if (loadingDetailsFor.has(placeId)) return
        setLoadingDetailsFor(prev => new Set([...prev, placeId]))
        try {
            const detail = await apiFetch(`/api/extract/maps/details/${placeId}`)
            setPlaces(prev => prev.map(p =>
                p.place_id === placeId
                    ? { ...p, phone: detail.phone, website: detail.website, detailsLoaded: true }
                    : p
            ))
        } catch { /* silently fail */ }
        setLoadingDetailsFor(prev => { const s = new Set(prev); s.delete(placeId); return s })
    }

    // Load details for all selected
    const handleLoadAllDetails = async () => {
        const toLoad = places.filter(p => selected.has(p.place_id) && !p.detailsLoaded)
        for (const place of toLoad) {
            await handleLoadDetails(place.place_id)
        }
    }

    // ── Selection ───────────────────────────────────────────────────────────────

    const toggleSelect = (placeId: string) => {
        setSelected(prev => {
            const s = new Set(prev)
            if (s.has(placeId)) s.delete(placeId)
            else s.add(placeId)
            return s
        })
    }

    const toggleSelectAll = () => {
        if (selected.size === places.length) setSelected(new Set())
        else setSelected(new Set(places.map(p => p.place_id)))
    }

    // ── Deduplication ───────────────────────────────────────────────────────────

    const isDuplicate = (place: PlaceResult): boolean => {
        if (!place.phone) return false
        const norm = normalizePhoneForCompare(place.phone)
        return existingPhones.has(norm)
    }

    // ── Import ──────────────────────────────────────────────────────────────────

    const handleImport = async () => {
        const toImport = places.filter(p => selected.has(p.place_id))
        if (!toImport.length) return
        if (!targetListId) { setImportMessage('Selecione uma lista de destino.'); return }

        setIsImporting(true)
        setImportMessage(null)

        // Load details for places that don't have them yet
        const withoutDetails = toImport.filter(p => !p.detailsLoaded)
        for (const place of withoutDetails) {
            await handleLoadDetails(place.place_id)
        }

        // Re-read places after detail load
        const fresh = places.filter(p => selected.has(p.place_id))
        const duplicates = fresh.filter(isDuplicate)
        const unique = fresh.filter(p => !isDuplicate(p))

        if (!unique.length) {
            setImportMessage(`Todos os ${duplicates.length} contato(s) selecionado(s) já existem no sistema.`)
            setIsImporting(false)
            return
        }

        const contacts = unique.map(p => ({
            name: p.name,
            phone: p.phone || '',
            email: '',
            category: categoryLabel(p.category),
            cep: '',
            rating: p.rating ? String(p.rating) : '',
        }))

        try {
            await onImportContacts(contacts, targetListId)
            const msg = unique.length === fresh.length
                ? `✅ ${unique.length} contato(s) importado(s) com sucesso!`
                : `✅ ${unique.length} importado(s). ${duplicates.length} duplicata(s) ignorada(s).`
            setImportMessage(msg)
            setSelected(new Set())
        } catch (err: any) {
            setImportMessage(`Erro ao importar: ${err?.message}`)
        } finally {
            setIsImporting(false)
        }
    }

    // ── Render ──────────────────────────────────────────────────────────────────

    const selectedPlaces = places.filter(p => selected.has(p.place_id))
    const duplicateCount = selectedPlaces.filter(isDuplicate).length
    const newCount = selectedPlaces.length - duplicateCount

    return (
        <div className="flex flex-col gap-0 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header com tabs */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Extração Inteligente</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Importe contatos de cartões de visita ou do Google Maps</p>
                </div>
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('maps')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${activeTab === 'maps'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🗺️ Google Maps
                    </button>
                    <button
                        onClick={() => setActiveTab('image')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${activeTab === 'image'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        📸 Cartão de Visita
                    </button>
                </div>
            </div>

            {/* ── TAB: GOOGLE MAPS ── */}
            {activeTab === 'maps' && (
                <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 200px)' }}>
                    {/* Painel esquerdo */}
                    <div className="flex flex-col gap-3 w-[380px] min-w-[340px] overflow-y-auto">
                        {/* Formulário de busca */}
                        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">🗺️</span>
                                <span className="text-sm font-semibold text-slate-800">Buscar no Google Maps</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Tipo de negócio</label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Ex: Pizzarias, Salões de beleza, Academias..."
                                    className="h-9 px-3 rounded-lg border border-slate-200 text-[12px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Localidade</label>
                                <input
                                    type="text"
                                    value={searchLocation}
                                    onChange={e => setSearchLocation(e.target.value)}
                                    placeholder="Ex: Santo André, SP · São Paulo, SP"
                                    className="h-9 px-3 rounded-lg border border-slate-200 text-[12px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSearching || !searchQuery.trim() || !searchLocation.trim()}
                                className="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                {isSearching ? (
                                    <><span className="animate-spin text-base">⟳</span> Buscando...</>
                                ) : (
                                    <><span>🔍</span> Pesquisar</>
                                )}
                            </button>
                        </form>

                        {/* Erro */}
                        {searchError && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-[11px] text-red-600">
                                ⚠️ {searchError}
                            </div>
                        )}

                        {/* Lista de resultados */}
                        {places.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                {/* Header lista */}
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                                    <button onClick={toggleSelectAll} className="text-[11px] font-semibold text-emerald-700 hover:underline">
                                        {selected.size === places.length ? 'Desmarcar todos' : `Marcar todos (${places.length})`}
                                    </button>
                                    {selected.size > 0 && (
                                        <span className="text-[10px] text-slate-500">
                                            {selected.size} selecionado{selected.size > 1 ? 's' : ''}
                                            {duplicateCount > 0 && <span className="text-amber-500"> · {duplicateCount} duplicata{duplicateCount > 1 ? 's' : ''}</span>}
                                        </span>
                                    )}
                                </div>

                                {/* Itens */}
                                <div className="overflow-y-auto max-h-[420px] divide-y divide-slate-100">
                                    {places.map((place) => {
                                        const dup = isDuplicate(place)
                                        const isSelected = selected.has(place.place_id)
                                        const loadingThis = loadingDetailsFor.has(place.place_id)

                                        return (
                                            <div
                                                key={place.place_id}
                                                onClick={() => toggleSelect(place.place_id)}
                                                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected
                                                    ? dup ? 'bg-amber-50' : 'bg-emerald-50'
                                                    : 'hover:bg-slate-50'}`}
                                            >
                                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                    ? dup ? 'bg-amber-400 border-amber-400' : 'bg-emerald-500 border-emerald-500'
                                                    : 'border-slate-300'}`}>
                                                    {isSelected && <span className="text-white text-[9px] font-bold">✓</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[12px] font-semibold text-slate-800 truncate">{place.name}</span>
                                                        {dup && <span className="text-[9px] bg-amber-100 text-amber-600 font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">Duplicata</span>}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{place.address}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {place.rating && (
                                                            <span className="text-[10px] text-amber-500 font-medium">★ {place.rating}</span>
                                                        )}
                                                        <span className="text-[10px] text-slate-400">{categoryLabel(place.category)}</span>
                                                    </div>
                                                    {/* Phone */}
                                                    {place.detailsLoaded ? (
                                                        <div className="mt-1 flex items-center gap-2">
                                                            {place.phone ? (
                                                                <span className="text-[10px] text-emerald-600 font-medium">📞 {place.phone}</span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 italic">Sem telefone cadastrado</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleLoadDetails(place.place_id) }}
                                                            disabled={loadingThis}
                                                            className="mt-1 text-[10px] text-emerald-600 hover:text-emerald-700 font-medium underline disabled:opacity-50"
                                                        >
                                                            {loadingThis ? '⟳ Carregando...' : '+ Ver telefone'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Load more */}
                                {nextPageToken && (
                                    <div className="p-3 border-t border-slate-100">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={isSearching}
                                            className="w-full h-8 rounded-lg border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-50 font-medium transition-colors"
                                        >
                                            {isSearching ? '⟳ Carregando...' : 'Carregar mais resultados'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Painel de importação */}
                        {selected.size > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 sticky bottom-0">
                                <div className="text-[11px] font-semibold text-slate-700">
                                    Importar {selected.size} contato{selected.size > 1 ? 's' : ''}
                                    {newCount < selected.size && (
                                        <span className="text-slate-400 font-normal"> ({newCount} novo{newCount !== 1 ? 's' : ''}, {duplicateCount} já existente{duplicateCount !== 1 ? 's' : ''})</span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-medium text-slate-500">Lista de destino</label>
                                    <select
                                        value={targetListId}
                                        onChange={e => setTargetListId(e.target.value)}
                                        className="h-8 px-2 rounded-lg border border-slate-200 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                    >
                                        {lists.map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleLoadAllDetails}
                                        disabled={isImporting}
                                        className="flex-1 h-8 rounded-lg border border-emerald-200 text-emerald-700 text-[11px] font-medium hover:bg-emerald-50 transition-colors disabled:opacity-50"
                                    >
                                        📞 Carregar telefones
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={isImporting || newCount === 0}
                                        className="flex-1 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isImporting ? '⟳ Importando...' : `⬇️ Importar (${newCount})`}
                                    </button>
                                </div>
                                {importMessage && (
                                    <div className={`text-[10px] font-medium rounded-lg p-2 text-center ${importMessage.startsWith('✅')
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-amber-50 text-amber-700'}`}>
                                        {importMessage}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Painel direito — Mapa */}
                    <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 flex flex-col">
                        {mapEmbedQuery ? (
                            googleMapsApiKey ? (
                                <iframe
                                    title="Google Maps"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, minHeight: 500 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://www.google.com/maps/embed/v1/search?key=${googleMapsApiKey}&q=${mapEmbedQuery}&language=pt-BR`}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                                    <span className="text-5xl">🗺️</span>
                                    <p className="text-sm font-semibold text-slate-700">Configure a Google Maps API Key</p>
                                    <p className="text-xs text-slate-500 max-w-xs">
                                        Para visualizar o mapa, adicione sua chave da API em <strong>Configurações</strong>{' '}
                                        (é necessário habilitar Maps Embed API + Places API no Google Cloud).
                                    </p>
                                    <a
                                        href="https://console.cloud.google.com/apis/library"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-emerald-600 underline"
                                    >
                                        Abrir Google Cloud Console →
                                    </a>
                                    <div className="mt-4 bg-slate-800 rounded-xl p-4 text-left w-full max-w-sm">
                                        <p className="text-[10px] text-slate-400 font-mono">Resultados: {places.length} estabelecimento(s) encontrado(s)</p>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                    <span className="text-4xl">🗺️</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">Busque estabelecimentos</p>
                                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                                        Digite o tipo de negócio e a localidade ao lado para visualizar os resultados no mapa e extrair os dados de contato.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 w-full max-w-xs text-left">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Exemplos</p>
                                    {[
                                        { q: 'Pizzarias', l: 'Santo André, SP' },
                                        { q: 'Salões de beleza', l: 'São Paulo, SP' },
                                        { q: 'Academias', l: 'Campinas, SP' },
                                        { q: 'Clínicas odontológicas', l: 'Belo Horizonte, MG' },
                                    ].map(ex => (
                                        <button
                                            key={ex.q}
                                            onClick={() => { setSearchQuery(ex.q); setSearchLocation(ex.l) }}
                                            className="text-[11px] text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all"
                                        >
                                            <strong>{ex.q}</strong> em {ex.l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: IMAGEM ── */}
            {activeTab === 'image' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div
                            className={`relative group h-80 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 text-center ${dragActive
                                ? 'border-slate-500 bg-slate-50/50 shadow-2xl shadow-slate-200/50'
                                : 'border-slate-200 bg-white hover:border-slate-400/50 hover:bg-slate-50/50'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="input-file-upload"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform duration-500 ${isExtracting ? 'animate-bounce bg-slate-100' : 'bg-slate-100 group-hover:scale-110'}`}>
                                {isExtracting ? (
                                    <span className="text-3xl animate-pulse">✨</span>
                                ) : (
                                    <span className="text-3xl">📸</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <p className="text-base font-semibold text-slate-800">
                                    {isExtracting ? 'Analisando imagem...' : 'Arraste uma imagem aqui'}
                                </p>
                                <p className="text-xs text-slate-500 max-w-[200px]">
                                    ou clique para selecionar um arquivo (PNG, JPG)
                                </p>
                            </div>
                            {isExtracting && (
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-slate-400 to-slate-600 animate-pulse" style={{ width: '100%' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        {lastMessage && (
                            <div className={`p-4 rounded-2xl text-xs font-medium border ${lastMessage.includes('sucesso') || lastMessage.includes('extraídos')
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                {lastMessage}
                            </div>
                        )}
                    </div>
                    <div className="space-y-4">
                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-slate-400" />
                                Como funciona?
                            </h3>
                            <ul className="space-y-4 text-xs text-slate-300">
                                {[
                                    'Tire uma foto nítida de um cartão de visita ou faça um print de um perfil comercial.',
                                    'Nossa IA processará a imagem e tentará identificar: Nome, WhatsApp, E-mail e Categoria.',
                                    'Os dados aparecerão no formulário para sua revisão. Ao salvar, o contato irá para a lista "IA".',
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-3">
                                        <span className="shrink-0 h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">{i + 1}</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-slate-700 rounded-3xl p-6 text-white shadow-xl">
                            <h3 className="text-sm font-semibold mb-2 italic">Dica Pro:</h3>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                                Certifique-se de que o CEP esteja visível na imagem para maior precisão no endereço!
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
