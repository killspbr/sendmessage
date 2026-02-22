type SettingsPageProps = {
  // Webhooks
  webhookUrlWhatsApp: string
  webhookUrlEmail: string
  onChangeWebhookWhatsApp: (value: string) => void
  onChangeWebhookEmail: (value: string) => void
  
  // Gemini
  geminiApiKey: string
  onChangeGeminiApiKey: (value: string) => void
  geminiModel: string
  onChangeGeminiModel: (value: string) => void
  geminiApiVersion: string
  onChangeGeminiApiVersion: (value: string) => void
  geminiTemperature: number
  onChangeGeminiTemperature: (value: number) => void
  geminiMaxTokens: number
  onChangeGeminiMaxTokens: (value: number) => void

  // Debug
  debugEnabled: boolean
  onChangeDebugEnabled: (value: boolean) => void
  
  // Backup
  importPreview: any | null
  onExportData: () => void
  onImportFile: (file: File) => void
  onCancelImport: () => void
  onConfirmImport: () => void
  
  // Feedback
  onSave: () => void
  // Permissões (opcional)
  can?: (code: string) => boolean
}

export function SettingsPage({
  webhookUrlWhatsApp,
  webhookUrlEmail,
  onChangeWebhookWhatsApp,
  onChangeWebhookEmail,
  geminiApiKey,
  onChangeGeminiApiKey,
  geminiModel,
  onChangeGeminiModel,
  geminiApiVersion,
  onChangeGeminiApiVersion,
  geminiTemperature,
  onChangeGeminiTemperature,
  geminiMaxTokens,
  onChangeGeminiMaxTokens,
  debugEnabled,
  onChangeDebugEnabled,
  importPreview,
  onExportData,
  onImportFile,
  onCancelImport,
  onConfirmImport,
  onSave,
  can,
}: SettingsPageProps) {
  const canViewSettings = !can || can('settings.view')

  if (!canViewSettings) {
    return (
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 md:p-5 max-w-xl">
        <p className="text-[12px] md:text-[13px] text-slate-500">
          Você não tem permissão para visualizar as configurações.
        </p>
      </section>
    )
  }
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 md:p-5 flex flex-col gap-4 max-w-xl">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Configurações de integração</h2>
        <p className="text-[11px] text-slate-500">
          Defina abaixo os endereços de webhook do n8n para cada canal de envio.
        </p>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-medium text-slate-600">Webhook WhatsApp</label>
        <input
          type="text"
          value={webhookUrlWhatsApp}
          onChange={(e) => onChangeWebhookWhatsApp(e.target.value)}
          placeholder="https://seu-n8n.com/webhook/disparo-whatsapp"
          className="h-9 w-full px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
        />
        <p className="text-[10px] text-slate-400">
          Usado para campanhas com canal WhatsApp marcado.
        </p>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-medium text-slate-600">Webhook Email</label>
        <input
          type="text"
          value={webhookUrlEmail}
          onChange={(e) => onChangeWebhookEmail(e.target.value)}
          placeholder="https://seu-n8n.com/webhook/disparo-email"
          className="h-9 w-full px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
        />
        <p className="text-[10px] text-slate-400">
          Usado para campanhas com canal Email marcado.
        </p>
      </div>
      
      <div className="border-t border-dashed border-slate-200 pt-3 mt-1 space-y-2">
        <div>
          <h3 className="text-xs font-semibold text-slate-800">Modo debug</h3>
          <p className="text-[10px] text-slate-500">
            Quando ativado, o sistema exibe informações extras para diagnóstico (como permissões carregadas, IDs e mensagens internas).
          </p>
        </div>
        <label className="flex items-center justify-between gap-3 text-[11px] text-slate-700">
          <span>Ativar modo debug</span>
          <button
            type="button"
            onClick={() => onChangeDebugEnabled(!debugEnabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
              debugEnabled
                ? 'bg-emerald-500 border-emerald-600'
                : 'bg-slate-200 border-slate-300'
            }`}
            aria-pressed={debugEnabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                debugEnabled ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>

      <div className="border-t border-dashed border-slate-200 pt-3 mt-1 space-y-2">
        <div>
          <h3 className="text-xs font-semibold text-slate-800">Integração com IA (Gemini)</h3>
          <p className="text-[10px] text-slate-500">
            Informe abaixo a chave de API global do Google Gemini que será usada por todos os clientes deste sistema.
            Recomendamos usar, no mínimo, o plano gratuito oficial do Gemini (cerca de 20 requisições por dia),
            lembrando que esse limite diário é compartilhado entre todos os clientes.
            Para cargas maiores, considere habilitar billing no projeto e ajustar os limites conforme necessário.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-slate-600">Gemini API Key</label>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => onChangeGeminiApiKey(e.target.value.trim())}
            placeholder="ex: AIza..."
            className="h-9 w-full px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
          />
          <p className="text-[10px] text-amber-600">
            Esta chave é sensível. Não compartilhe telas ou exports contendo a API Key.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-600">Modelo</label>
            <select
              value={geminiModel}
              onChange={(e) => onChangeGeminiModel(e.target.value)}
              className="h-9 w-full px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash (mais recente)</option>
              <option value="gemini-1.5-flash-latest">gemini-1.5-flash-latest (rápido)</option>
              <option value="gemini-1.5-pro-latest">gemini-1.5-pro-latest (avançado)</option>
              <option value="gemini-1.0-pro">gemini-1.0-pro (legado)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-600">Versão da API</label>
            <select
              value={geminiApiVersion}
              onChange={(e) => onChangeGeminiApiVersion(e.target.value)}
              className="h-9 w-full px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
            >
              <option value="v1">v1 (estável)</option>
              <option value="v1beta">v1beta (experimental)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-600">
              Criatividade (temperatura): {geminiTemperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={geminiTemperature}
              onChange={(e) => onChangeGeminiTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
            <p className="text-[9px] text-slate-400">0 = previsível, 1 = criativo</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-600">Tamanho máximo</label>
            <select
              value={geminiMaxTokens}
              onChange={(e) => onChangeGeminiMaxTokens(parseInt(e.target.value, 10))}
              className="h-9 w-full px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
            >
              <option value="512">512 tokens (curto)</option>
              <option value="1024">1024 tokens (médio)</option>
              <option value="2048">2048 tokens (longo)</option>
              <option value="4096">4096 tokens (muito longo)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div>
        <button
          type="button"
          className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-400"
          onClick={onSave}
        >
          Salvar
        </button>
      </div>

      {/* Backup e restauração */}
      <div className="border-t border-slate-100 pt-4 mt-2">
        <h3 className="text-xs font-semibold text-slate-800">Backup e restauração</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Exporte ou importe todos os dados do sistema (campanhas, contatos, listas, históricos, webhooks).
        </p>
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            className="px-3 py-1.5 rounded-md text-[11px] font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={onExportData}
          >
            Exportar dados
          </button>
          <label className="px-3 py-1.5 rounded-md text-[11px] font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">
            Importar dados
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onImportFile(file)
                }
                e.target.value = ''
              }}
            />
          </label>
        </div>

        {importPreview && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-900">
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Confirmar importação?</span>
              <span className="text-[10px] text-amber-800">
                Este backup contém:
                <strong> {importPreview.data?.lists?.length ?? 0}</strong> listas,
                <strong> {Object.values(importPreview.data?.contactsByList ?? {}).flat().length}</strong> contatos,
                <strong> {importPreview.data?.campaigns?.length ?? 0}</strong> campanhas.
                <br />
                Exportado em: {importPreview.exportedAt ? new Date(importPreview.exportedAt).toLocaleString('pt-BR') : '—'}.
              </span>
              <span className="text-[10px] text-amber-700 mt-1">
                ⚠️ Isso vai <strong>substituir</strong> todos os dados atuais.
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-2">
              <button
                type="button"
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 hover:bg-slate-50"
                onClick={onCancelImport}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md bg-amber-600 text-[11px] text-white hover:bg-amber-500"
                onClick={onConfirmImport}
              >
                Confirmar importação
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
