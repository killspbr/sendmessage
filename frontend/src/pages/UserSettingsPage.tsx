import React from 'react'
import { apiFetch, apiUpload, API_URL } from '../api'
import type { UploadedUserFile, UserLimitSnapshot } from '../types'
import { normalizeDisplayText } from '../utils/textEncoding'

type UserSettingsPageProps = {
  effectiveUserId: string | null
  userDisplayName: string
  userPhone: string
  useGlobalAi: boolean
  userAiKey: string
  userCompanyInfo: string | null
  onChangeUserDisplayName: (val: string) => void
  onChangeUserPhone: (val: string) => void
  onChangeUseGlobalAi: (val: boolean) => void
  onChangeUserAiKey: (val: string) => void
  onChangeUserCompanyInfo: (val: string) => void
  userEvolutionUrl: string
  userEvolutionApiKey: string
  userEvolutionInstance: string
  onChangeUserEvolutionUrl: (val: string) => void
  onChangeUserEvolutionApiKey: (val: string) => void
  onChangeUserEvolutionInstance: (val: string) => void
  onSave: (overrides: {
    displayName?: string | null
    phone?: string | null
    aiApiKey?: string | null
    companyInfo?: string | null
    evolutionUrl?: string | null
    evolutionApiKey?: string | null
    evolutionInstance?: string | null
  }) => Promise<void>
}

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return 'Ilimitado'
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getMetricTone(used: number, limit: number | null) {
  if (limit == null || limit <= 0) return 'text-emerald-700 border-emerald-200 bg-emerald-50'
  const ratio = used / limit
  if (ratio >= 1) return 'text-rose-700 border-rose-200 bg-rose-50'
  if (ratio >= 0.8) return 'text-amber-700 border-amber-200 bg-amber-50'
  return 'text-emerald-700 border-emerald-200 bg-emerald-50'
}

function SectionCard({
  title,
  description,
  accent,
  children,
}: {
  title: string
  description: string
  accent: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className={`mt-1 h-3 w-3 rounded-full ${accent}`} />
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function UserSettingsPage({
  effectiveUserId,
  userDisplayName,
  userPhone,
  useGlobalAi,
  userAiKey,
  userCompanyInfo,
  onChangeUserDisplayName,
  onChangeUserPhone,
  onChangeUseGlobalAi,
  onChangeUserAiKey,
  onChangeUserCompanyInfo,
  userEvolutionUrl,
  userEvolutionApiKey,
  userEvolutionInstance,
  onChangeUserEvolutionUrl,
  onChangeUserEvolutionApiKey,
  onChangeUserEvolutionInstance,
  onSave,
}: UserSettingsPageProps) {
  const [tokenCopied, setTokenCopied] = React.useState(false)
  const [limits, setLimits] = React.useState<UserLimitSnapshot | null>(null)
  const [files, setFiles] = React.useState<UploadedUserFile[]>([])
  const [filesLoading, setFilesLoading] = React.useState(false)
  const [limitsLoading, setLimitsLoading] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadMessage, setUploadMessage] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const loadLimits = React.useCallback(async () => {
    if (!effectiveUserId) {
      setLimits(null)
      return
    }

    setLimitsLoading(true)
    try {
      const data = await apiFetch('/api/profile/limits')
      setLimits(data)
    } catch (error) {
      setUploadMessage('Não foi possível carregar os limites do perfil.')
    } finally {
      setLimitsLoading(false)
    }
  }, [effectiveUserId])

  const loadFiles = React.useCallback(async () => {
    if (!effectiveUserId) {
      setFiles([])
      return
    }

    setFilesLoading(true)
    try {
      const data = await apiFetch('/api/files')
      setFiles(Array.isArray(data) ? data : [])
    } catch (error) {
      setUploadMessage('Não foi possível carregar os arquivos do servidor.')
    } finally {
      setFilesLoading(false)
    }
  }, [effectiveUserId])

  React.useEffect(() => {
    void loadLimits()
    void loadFiles()
  }, [loadFiles, loadLimits])

  const copyToken = () => {
    const token = localStorage.getItem('auth_token') || ''
    if (!token) return

    navigator.clipboard.writeText(token).then(() => {
      setTokenCopied(true)
      window.setTimeout(() => setTokenCopied(false), 2500)
    })
  }

  const handleSave = async () => {
    await onSave({
      displayName: userDisplayName.trim() || null,
      phone: userPhone.trim() || null,
      aiApiKey: useGlobalAi ? null : userAiKey.trim() || null,
      companyInfo: userCompanyInfo?.trim() || null,
      evolutionUrl: userEvolutionUrl.trim() || null,
      evolutionApiKey: userEvolutionApiKey.trim() || null,
      evolutionInstance: userEvolutionInstance.trim() || null,
    })
  }

  const handleUploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    if (selectedFiles.length === 0) return

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_UPLOAD_SIZE_BYTES)
    if (oversizedFile) {
      setUploadMessage(`O arquivo "${oversizedFile.name}" excede o limite de 50 MB e nao foi enviado.`)
      event.target.value = ''
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadMessage(null)

    try {
      const form = new FormData()
      selectedFiles.forEach((file) => form.append('files', file))

      const response = await apiUpload('/api/files/upload', form, {
        onProgress: ({ percent }) => setUploadProgress(percent),
      })

      setUploadProgress(100)

      // Atualiza a lista local com os novos arquivos sem depender apenas do reload total
      const newFiles = Array.isArray(response) ? response : [response]
      setFiles(prev => [...newFiles, ...prev])

      await Promise.all([loadFiles(), loadLimits()])
      setUploadMessage(`${selectedFiles.length} arquivo(s) enviado(s) com sucesso.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error: any) {
      setUploadMessage(error?.message || 'Falha ao enviar arquivos.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este arquivo permanentemente?')) return
    
    setDeletingId(fileId)
    try {
      await apiFetch(`/api/files/${fileId}`, { method: 'DELETE' })
      setUploadMessage('Arquivo excluído com sucesso.')
      setTimeout(() => setUploadMessage(null), 3000)
      
      // Remove do estado local imediatamente para UX instantanea
      setFiles(prev => prev.filter(f => f.id !== fileId))
      
      await Promise.all([loadFiles(), loadLimits()])
    } catch (error: any) {
      setUploadMessage(error?.message || 'Falha ao remover o arquivo.')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredFiles = React.useMemo(() => {
    if (!searchTerm.trim()) return files
    const lowSearch = searchTerm.toLowerCase()
    return files.filter(f => 
      f.originalName.toLowerCase().includes(lowSearch) || 
      f.extension.toLowerCase().includes(lowSearch)
    )
  }, [files, searchTerm])

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl shadow-slate-300/40">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">Meu perfil</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Configurações pessoais e extensão</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Gerencie seus dados, sua integração própria com Evolution e IA, e o acesso da extensão do Google Maps.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/75">Usuário ativo</div>
            <div className="mt-1 text-sm font-medium text-white">{userDisplayName || 'Perfil sem nome exibido'}</div>
            <div className="text-xs text-slate-300">{effectiveUserId || 'Sem sessão ativa'}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <SectionCard
            title="Meus limites"
            description="Acompanhe o consumo da conta em mensagens, Gemini global e espaço ocupado com uploads."
            accent="bg-violet-500"
          >
            {limitsLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Carregando limites...
              </div>
            ) : limits ? (
              <div className="grid gap-3">
                <div className={`rounded-2xl border px-4 py-3 ${getMetricTone(limits.dailyMessages.used, limits.dailyMessages.limit)}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Mensagens diárias</div>
                  <div className="mt-1 text-sm font-medium">{limits.dailyMessages.used} / {limits.dailyMessages.limit ?? 'Ilimitado'}</div>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${getMetricTone(limits.monthlyMessages.used, limits.monthlyMessages.limit)}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Mensagens mensais</div>
                  <div className="mt-1 text-sm font-medium">{limits.monthlyMessages.used} / {limits.monthlyMessages.limit ?? 'Ilimitado'}</div>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${getMetricTone(limits.geminiGlobal.usedToday, limits.geminiGlobal.limit)}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Gemini global</div>
                  <div className="mt-1 text-sm font-medium">{limits.geminiGlobal.usedToday} / {limits.geminiGlobal.limit ?? 'Pool compartilhado'}</div>
                  <p className="mt-1 text-xs opacity-80">
                    {limits.geminiGlobal.usingGlobalPool ? 'Sua conta está usando o pool global do sistema.' : 'Sua conta usa chave própria; o pool global segue visível para referência.'}
                  </p>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${getMetricTone(limits.uploads.usedBytes, limits.uploads.limitBytes)}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Espaço de upload</div>
                  <div className="mt-1 text-sm font-medium">
                    {formatBytes(limits.uploads.usedBytes)} / {limits.uploads.unlimited ? 'Ilimitado' : formatBytes(limits.uploads.limitBytes)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Nenhum limite disponível no momento.
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Meus ativos na nuvem"
            description="Gerencie imagens, vídeos, áudios e documentos para suas campanhas. Limite de 50MB por arquivo."
            accent="bg-fuchsia-500"
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-11 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {uploading ? 'Enviando...' : 'Enviar arquivos'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void loadFiles()
                      void loadLimits()
                    }}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Atualizar lista
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.ppt,.pptx,.wav,.mp3,.mp4"
                    className="hidden"
                    onChange={handleUploadFiles}
                  />
                </div>
                
                <div className="relative flex-1 max-w-xs">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar arquivos..."
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              {limits && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>Espaço Ocupado</span>
                    <span>{formatBytes(limits.uploads.usedBytes)} / {limits.uploads.unlimited ? 'Ilimitado' : formatBytes(limits.uploads.limitBytes)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        (limits.uploads.usedBytes / (limits.uploads.limitBytes || 1)) > 0.9 ? 'bg-rose-500' : 'bg-fuchsia-500'
                      }`}
                      style={{ width: `${Math.min(100, (limits.uploads.usedBytes / (limits.uploads.limitBytes || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadMessage ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {uploadMessage}
                </div>
              ) : null}

              {uploading ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    <span>Enviando arquivos</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {filesLoading ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50/50 py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Sincronizando arquivos...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                  <div className="text-3xl mb-3 opacity-30">☁️</div>
                  <p className="text-sm font-medium text-slate-500">
                    {searchTerm ? 'Nenhum arquivo encontrado para sua busca.' : 'Sua biblioteca está vazia.'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Comece enviando mídias para usar em disparos.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredFiles.map((file) => {
                    const isImage = file.mimeType.startsWith('image/')
                    const isVideo = file.mimeType.startsWith('video/')
                    const isAudio = file.mimeType.startsWith('audio/')
                    const isPdf = file.mimeType.includes('pdf')
                    
                    const icon = isImage ? '🖼️' : isVideo ? '🎥' : isAudio ? '🎵' : isPdf ? '📄' : '📝'
                    const publicUrl = file.publicUrl.startsWith('http') ? file.publicUrl : `${API_URL}${file.publicUrl}`

                    return (
                      <div key={file.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-fuchsia-300 hover:shadow-md">
                        {isImage ? (
                          <div className="aspect-video w-full overflow-hidden bg-slate-100">
                             <img src={publicUrl} alt={file.originalName} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          </div>
                        ) : isAudio ? (
                          <div className="flex aspect-video w-full flex-col items-center justify-center bg-slate-900 p-4 text-white">
                            <div className="text-3xl mb-2">🔊</div>
                            <audio controls src={publicUrl} className="h-8 w-full scale-90 opacity-80" />
                          </div>
                        ) : (
                          <div className="flex aspect-video w-full items-center justify-center bg-slate-100 text-4xl">
                            {icon}
                          </div>
                        )}
                        
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 title={file.originalName} className="truncate text-sm font-bold text-slate-800">
                                {normalizeDisplayText(file.originalName)}
                              </h3>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {formatBytes(file.sizeBytes)} • {file.extension.toUpperCase()}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(publicUrl)
                                  setUploadMessage('Link copiado!')
                                  setTimeout(() => setUploadMessage(null), 2000)
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-700"
                                title="Copiar URL pública"
                              >
                                🔗
                              </button>
                              <button
                                type="button"
                                disabled={deletingId === file.id}
                                onClick={() => handleDeleteFile(file.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-white transition hover:bg-rose-600 disabled:bg-slate-300"
                                title="Excluir arquivo"
                              >
                                {deletingId === file.id ? '...' : '🗑️'}
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex gap-2">
                            <a
                              href={`${publicUrl}&download=1`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 rounded-xl bg-slate-100 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600 transition hover:bg-slate-200"
                            >
                              {file.canInline ? 'Abrir' : 'Baixar'}
                            </a>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Meus dados"
            description="Esses dados podem ser usados no sistema e pelos administradores para suporte operacional."
            accent="bg-emerald-500"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Nome exibido</label>
                <input
                  type="text"
                  value={userDisplayName}
                  onChange={(e) => onChangeUserDisplayName(e.target.value)}
                  placeholder="Como você quer aparecer no sistema"
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Telefone</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => onChangeUserPhone(e.target.value.replace(/[^\d()+\s-]/g, ''))}
                  placeholder="(11) 99999-9999"
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Evolution por usuário"
            description="Se quiser isolar seus envios, configure sua própria instância em vez de depender do ambiente global."
            accent="bg-sky-500"
          >
            <div className="grid gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">URL da Evolution</label>
                <input
                  type="text"
                  value={userEvolutionUrl}
                  onChange={(e) => onChangeUserEvolutionUrl(e.target.value)}
                  placeholder="https://sua-evolution.exemplo.com"
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">API Key</label>
                  <input
                    type="password"
                    value={userEvolutionApiKey}
                    onChange={(e) => onChangeUserEvolutionApiKey(e.target.value)}
                    placeholder="Chave da sua instância"
                    className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Instância</label>
                  <input
                    type="text"
                    value={userEvolutionInstance}
                    onChange={(e) => onChangeUserEvolutionInstance(e.target.value)}
                    placeholder="Nome da instância"
                    className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Inteligência artificial"
            description="Você pode usar o pool global administrado em APIs Gemini ou sua própria Gemini API Key. Administradores também podem definir uma chave exclusiva aqui para a própria conta."
            accent="bg-amber-500"
          >
            <div className="flex flex-col gap-4">
              <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={useGlobalAi}
                  onChange={(e) => onChangeUseGlobalAi(e.target.checked)}
                  className="h-4 w-4 accent-amber-500"
                />
                <span>Usar a chave global do sistema</span>
              </label>

              {!useGlobalAi && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Minha Gemini API Key</label>
                  <input
                    type="password"
                    value={userAiKey}
                    onChange={(e) => onChangeUserAiKey(e.target.value)}
                    placeholder="AIza..."
                    className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Sobre sua empresa ou perfil</label>
                <textarea
                  value={userCompanyInfo || ''}
                  onChange={(e) => onChangeUserCompanyInfo(e.target.value)}
                  rows={5}
                  placeholder="Descreva sua empresa, seus diferenciais, linguagem, público e contexto comercial."
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white"
                />
                <p className="text-xs text-slate-500">
                  Esse contexto ajuda a IA a gerar campanhas e reescritas mais alinhadas com seu negócio.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard
            title="Extensão do Google Maps"
            description="Use o token abaixo para conectar a extensão ao seu login atual."
            accent="bg-emerald-500"
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Token da extensão</div>
                <div className="mt-2 truncate font-mono text-xs text-slate-700">
                  {localStorage.getItem('auth_token')
                    ? `${(localStorage.getItem('auth_token') || '').slice(0, 42)}...`
                    : 'Faça login novamente para gerar um token válido.'}
                </div>
              </div>

              <button
                onClick={copyToken}
                disabled={!localStorage.getItem('auth_token')}
                className={`h-11 w-full rounded-2xl text-sm font-semibold transition ${
                  tokenCopied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300'
                }`}
              >
                {tokenCopied ? 'Token copiado' : 'Copiar token'}
              </button>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="font-semibold">Fluxo recomendado</div>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-emerald-900/90">
                  <li>Instale ou atualize a extensão.</li>
                  <li>Cole o token e salve.</li>
                  <li>No Google Maps, clique em “Abrir painel lateral”.</li>
                  <li>Extraia os contatos e depois clique em “Importar Extraídos”.</li>
                </ol>
              </div>

              <a
                href="/extension.zip"
                download="SM_Extractor.zip"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">Baixar extensão atualizada</div>
                  <div className="text-xs text-slate-500">Versão 1.0.9 • Atualizado em 19/03/2026 às 23:59</div>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">ZIP</span>
              </a>
            </div>
          </SectionCard>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Salvar alterações</div>
            <p className="mt-1 text-sm text-slate-500">
              Os dados pessoais, a configuração da IA e a integração própria da Evolution são gravados juntos.
            </p>
            <button
              onClick={handleSave}
              className="mt-4 h-12 w-full rounded-2xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Salvar perfil
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
