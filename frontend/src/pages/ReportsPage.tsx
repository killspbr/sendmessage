import { useMemo, useState } from 'react'
import type { Campaign, ContactSendHistoryItem } from '../types'

export type ReportsPageProps = {
  campaigns: Campaign[]
  contactSendHistory: ContactSendHistoryItem[]
}

export function ReportsPage({ campaigns, contactSendHistory }: ReportsPageProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | 'all'>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const { filteredEntries, summaryByCampaign, totals } = useMemo(() => {
    const parseDate = (value: string | null | undefined) => {
      if (!value) return null
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? null : d
    }

    const start = startDate ? new Date(startDate + 'T00:00:00') : null
    const end = endDate ? new Date(endDate + 'T23:59:59') : null

    const entries = contactSendHistory.filter((entry) => {
      if (selectedCampaignId !== 'all' && entry.campaignId !== selectedCampaignId) {
        return false
      }

      if (!start && !end) return true

      const d = parseDate(entry.runAt)
      if (!d) return true

      if (start && d < start) return false
      if (end && d > end) return false
      return true
    })

    const byCampaign = new Map<string, {
      campaignName: string
      total: number
      errors: number
      successes: number
    }>()

    let total = 0
    let errors = 0

    for (const e of entries) {
      total += 1
      if (!e.ok) errors += 1

      const resolvedName =
        campaigns.find((c) => c.id === e.campaignId)?.name ||
        e.campaignName ||
        'Campanha'

      const current = byCampaign.get(e.campaignId) ?? {
        campaignName: resolvedName,
        total: 0,
        errors: 0,
        successes: 0,
      }

      current.total += 1
      if (e.ok) current.successes += 1
      else current.errors += 1

      byCampaign.set(e.campaignId, current)
    }

    const items = Array.from(byCampaign.entries()).map(([campaignId, data]) => {
      const successRate = data.total > 0 ? ((data.successes / data.total) * 100) : 0
      return {
        campaignId,
        campaignName: data.campaignName,
        total: data.total,
        errors: data.errors,
        successes: data.successes,
        successRate,
      }
    }).sort((a, b) => b.total - a.total)

    const successCount = total - errors
    const successRate = total > 0 ? ((successCount / total) * 100) : 0

    return {
      filteredEntries: entries,
      summaryByCampaign: items,
      totals: {
        total,
        errors,
        successes: successCount,
        successRate,
      },
    }
  }, [contactSendHistory, campaigns, selectedCampaignId, startDate, endDate])

  const handleExportSummaryCsv = () => {
    if (summaryByCampaign.length === 0) return

    const header = ['campanha', 'total_envios', 'sucessos', 'erros', 'taxa_sucesso']
    const rows = summaryByCampaign.map((item) => [
      item.campaignName,
      String(item.total),
      String(item.successes),
      String(item.errors),
      `${Math.round(item.successRate)}%`,
    ])

    const csvLines = [
      header.join(';'),
      ...rows.map((cols) => cols.map((v) => {
        const safe = (v ?? '').toString().replace(/"/g, '""')
        return safe.includes(';') || safe.includes('"') || safe.includes('\n')
          ? `"${safe}` + '"'
          : safe
      }).join(';')),
    ]

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'relatorio-resumo-campanhas.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportDetailsCsv = () => {
    if (filteredEntries.length === 0) return

    const header = [
      'campanha',
      'contato',
      'telefone',
      'canal',
      'status_http',
      'status_ok',
      'data_hora',
    ]

    const rows = filteredEntries.map((entry) => [
      entry.campaignName,
      entry.contactName,
      entry.phoneKey,
      entry.channel,
      String(entry.status || 0),
      entry.ok ? '1' : '0',
      entry.runAt,
    ])

    const csvLines = [
      header.join(';'),
      ...rows.map((cols) => cols.map((v) => {
        const safe = (v ?? '').toString().replace(/"/g, '""')
        return safe.includes(';') || safe.includes('"') || safe.includes('\n')
          ? `"${safe}` + '"'
          : safe
      }).join(';')),
    ]

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'relatorio-detalhado-envios.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const successRateLabel = totals.successRate
  const successRateColor = totals.total === 0
    ? 'text-slate-500'
    : totals.successRate >= 90
      ? 'text-emerald-600'
      : totals.successRate >= 70
        ? 'text-amber-600'
        : 'text-rose-600'

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 md:p-5 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Relatórios de envios</h2>
          <p className="text-[11px] text-slate-500">
            Analise o desempenho das campanhas em um intervalo de datas, usando apenas os envios realmente registrados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 mb-0.5">Campanha</label>
            <select
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 min-w-[160px]"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value as any)}
              title="Escolha uma campanha específica ou deixe em 'Todas' para ver o consolidado."
            >
              <option value="all">Todas as campanhas</option>
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 mb-0.5">Início</label>
            <input
              type="date"
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Data mínima de envio considerada no relatório."
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 mb-0.5">Fim</label>
            <input
              type="date"
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Data máxima de envio considerada no relatório."
            />
          </div>
          <button
            type="button"
            className="mt-4 md:mt-5 h-8 px-3 rounded-md border border-slate-200 bg-slate-50 text-[11px] text-slate-700 hover:bg-slate-100"
            onClick={() => {
              setStartDate('')
              setEndDate('')
              setSelectedCampaignId('all')
            }}
            title="Limpa as datas e volta a mostrar todas as campanhas no período completo disponível."
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 flex flex-col gap-1" title="Total de registros de envio encontrados com os filtros atuais (inclui sucessos e erros).">
          <span className="text-slate-500">Envios no período</span>
          <span className="text-xl font-semibold text-slate-900">{totals.total}</span>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 flex flex-col gap-1" title="Envios marcados como OK (resposta positiva do canal).">
          <span className="text-slate-500">Sucessos</span>
          <span className="text-xl font-semibold text-emerald-700">{totals.successes}</span>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 flex flex-col gap-1" title="Envios que retornaram erro (por exemplo, falha no webhook ou no canal).">
          <span className="text-slate-500">Erros</span>
          <span className="text-xl font-semibold text-rose-600">{totals.errors}</span>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 flex flex-col gap-1" title="Percentual de sucessos sobre o total de envios no período (sucessos ÷ total).">
          <span className="text-slate-500">Taxa de sucesso</span>
          <span className={`text-xl font-semibold ${successRateColor}`}>
            {totals.total === 0 ? '—' : `${Math.round(successRateLabel)}%`}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-[12px] font-semibold text-slate-800">Resumo por campanha</h3>
            <p className="text-[10px] text-slate-500">
              Somente campanhas com envios no período selecionado. Cada linha traz o total de registros, sucessos, erros e a taxa de sucesso da campanha.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-[10px] text-slate-700 hover:bg-slate-100"
              onClick={handleExportSummaryCsv}
              title="Baixa um CSV com uma linha por campanha, trazendo totais de envios, sucessos, erros e taxa de sucesso."
            >
              Exportar resumo CSV
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-[10px] text-slate-700 hover:bg-slate-100"
              onClick={handleExportDetailsCsv}
              title="Baixa um CSV detalhado com uma linha por envio (inclui contato, telefone, canal, status HTTP e data/hora)."
            >
              Exportar detalhado CSV
            </button>
          </div>
        </div>

        {summaryByCampaign.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-3 md:px-4 md:py-4 flex flex-col gap-2 text-[11px] text-slate-500">
            <div>
              <p className="font-medium text-slate-700 mb-0.5">Nenhum envio encontrado para os filtros selecionados.</p>
              <p className="text-[11px] text-slate-500">
                Assim que você fizer envios reais de campanhas, os resultados aparecerão aqui com totais por campanha, erros e taxa de sucesso.
              </p>
            </div>
            <div className="mt-1 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Próximos passos sugeridos</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-600">
                <li>Cadastre ou importe contatos na tela <span className="font-semibold">Contatos</span>.</li>
                <li>Crie uma campanha na tela <span className="font-semibold">Campanhas</span>, escolhendo a lista de contatos.</li>
                <li>Dispare a campanha e aguarde a conclusão dos envios.</li>
                <li>Volte a esta tela de <span className="font-semibold">Relatórios</span> e escolha o período para acompanhar o desempenho.</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full text-[10px]">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr className="text-left text-slate-500">
                  <th className="py-1.5 px-2" title="Nome da campanha consolidada.">Campanha</th>
                  <th className="py-1.5 px-2 text-right" title="Quantidade total de envios registrados para a campanha no período.">Envios</th>
                  <th className="py-1.5 px-2 text-right" title="Envios com status OK.">Sucessos</th>
                  <th className="py-1.5 px-2 text-right" title="Envios que retornaram erro.">Erros</th>
                  <th className="py-1.5 px-2 text-right" title="Sucessos dividido pelo total de envios da campanha.">Taxa sucesso</th>
                </tr>
              </thead>
              <tbody>
                {summaryByCampaign.map((item) => (
                  <tr key={item.campaignId} className="border-t border-slate-100">
                    <td className="py-1.5 px-2 text-slate-800">{item.campaignName}</td>
                    <td className="py-1.5 px-2 text-right text-slate-700">{item.total}</td>
                    <td className="py-1.5 px-2 text-right text-emerald-700">{item.successes}</td>
                    <td className="py-1.5 px-2 text-right text-rose-600">{item.errors}</td>
                    <td className="py-1.5 px-2 text-right text-slate-700">{Math.round(item.successRate)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
