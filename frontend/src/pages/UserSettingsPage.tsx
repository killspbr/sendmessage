import React from 'react'
import { apiUpload, API_URL, apiFetch } from '../api'
import type { UserLimitSnapshot } from '../types'
import { MediaManager } from '../components/media/MediaManager'

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
  if (limit === null) return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  const ratio = used / limit
  if (ratio >= 1.0) return 'border-rose-200 bg-rose-50 text-rose-800'
  if (ratio >= 0.8) return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-emerald-200 bg-emerald-50 text-emerald-800'
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
    <div className="flex flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
      <div className="flex flex-col gap-1 border-b border-slate-100 bg-slate-50/50 p-6">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${accent}`} />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">{title}</h2>
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className="p-6">{children}</div>
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
  const [limitsLoading, setLimitsLoading] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadMessage, setUploadMessage] = React.useState<string | null>(null)
  const [mediaKey, setMediaKey] = React.useState(0) // Usado para forçar reload do MediaManager
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

  React.useEffect(() => {
    void loadLimits()
  }, [loadLimits])

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
       setUploadMessage(`O arquivo "${oversizedFile.name}" excede o limite de 50 MB.`)
       event.target.value = ''
       return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadMessage(null)

    try {
      const form = new FormData()
      selectedFiles.forEach((file) => form.append('files', file))

      await apiUpload('/api/files/upload', form, {
        onProgress: ({ percent }) => setUploadProgress(percent),
      })

      setUploadProgress(100)
      await loadLimits()
      setUploadMessage(`${selectedFiles.length} arquivo(s) enviados com sucesso.`)
      setMediaKey(prev => prev + 1) // Recarrega a lista
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error: any) {
      setUploadMessage(error?.message || 'Falha ao enviar arquivos.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl shadow-slate-300/40">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">Meu perfil</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Configurações pessoais e ativos</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
               Gerencie seus dados e sua biblioteca de ativos digitais para campanhas.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/75">Usuário ativo</div>
            <div className="mt-1 text-sm font-medium text-white">{userDisplayName || 'Perfil sem nome'}</div>
            <div className="text-xs text-slate-300">{effectiveUserId}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <SectionCard
            title="Meus limites"
            description="Acompanhe o consumo da conta em mensagens e espaço ocupado."
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
                <div className={`rounded-2xl border px-4 py-3 ${getMetricTone(limits.uploads.usedBytes, limits.uploads.limitBytes)}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Espaço de upload</div>
                  <div className="mt-1 text-sm font-medium">
                    {formatBytes(limits.uploads.usedBytes)} / {limits.uploads.unlimited ? 'Ilimitado' : formatBytes(limits.uploads.limitBytes)}
                  </div>
                </div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Meus ativos na nuvem"
            description="Gerencie mídias para suas campanhas. Limite de 50MB por arquivo."
            accent="bg-fuchsia-500"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-11 rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                >
                  {uploading ? `Enviando ${uploadProgress}%...` : 'Fazer Upload'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleUploadFiles}
                />
                {uploadMessage && <span className="text-xs text-slate-600 font-medium">{uploadMessage}</span>}
              </div>

              <div className="h-[600px]">
                <MediaManager key={mediaKey} />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard
            title="Dados básicos"
            description="Informações usadas para identificação e pela IA em respostas automáticas."
            accent="bg-orange-500"
          >
             <div className="space-y-4">
               <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Nome de exibição</label>
                  <input
                    type="text"
                    value={userDisplayName}
                    onChange={(e) => onChangeUserDisplayName(e.target.value)}
                    placeholder="Seu nome ou nome da empresa"
                    className="mt-1 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500"
                  />
               </div>
               <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">WhatsApp de contato</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => onChangeUserPhone(e.target.value)}
                    placeholder="55119..."
                    className="mt-1 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500"
                  />
               </div>
               <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Info da empresa (para IA)</label>
                  <textarea
                    value={userCompanyInfo || ''}
                    onChange={(e) => onChangeUserCompanyInfo(e.target.value)}
                    rows={4}
                    placeholder="Resumo sobre sua empresa, serviços e produtos..."
                    className="mt-1 flex w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-blue-500"
                  />
               </div>
               <button
                  onClick={handleSave}
                  className="h-11 w-full rounded-2xl bg-blue-600 font-bold text-white transition hover:bg-blue-700 shadow-lg shadow-blue-200"
               >
                  Salvar alterações
               </button>
             </div>
          </SectionCard>

          <SectionCard
            title="Configurações Evolution"
            description="Integração de instância própria do Evolution API."
            accent="bg-blue-400"
          >
            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-600">Evolution URL</span>
                <input
                  type="url"
                  value={userEvolutionUrl}
                  onChange={(e) => onChangeUserEvolutionUrl(e.target.value)}
                  placeholder="https://api.evolution.suaempresa.com"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-600">Evolution API Key</span>
                <input
                  type="password"
                  value={userEvolutionApiKey}
                  onChange={(e) => onChangeUserEvolutionApiKey(e.target.value)}
                  placeholder="Chave Global do Evolution"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-600">Nome da Instância</span>
                <input
                  type="text"
                  value={userEvolutionInstance}
                  onChange={(e) => onChangeUserEvolutionInstance(e.target.value)}
                  placeholder="MinhaInstancia"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
            </div>
          </SectionCard>

          <SectionCard
            title="Token de acesso"
            description="Use este token para autenticar requisições na API oficial do sistema."
            accent="bg-slate-400"
          >
             <div className="flex items-center gap-2">
                <div className="flex-1 truncate rounded-xl bg-slate-100 px-4 py-2.5 font-mono text-xs text-slate-600">
                   ••••••••••••••••••••••••••••••••
                </div>
                <button
                  onClick={copyToken}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 transition hover:bg-slate-300"
                >
                   {tokenCopied ? '✅' : '📋'}
                </button>
             </div>
          </SectionCard>
        </div>
      </div>
    </section>
  )
}
