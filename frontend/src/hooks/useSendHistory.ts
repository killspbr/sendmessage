import { useCallback, useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { CampaignSendLog, ContactSendHistoryItem, SendHistoryItem } from '../types'
import { apiFetch } from '../api'
import { logError } from '../utils'

export type UseSendHistoryOptions = {
  effectiveUserId: string | null
}

export type UseSendHistoryResult = {
  sendHistory: SendHistoryItem[]
  setSendHistory: Dispatch<SetStateAction<SendHistoryItem[]>>
  contactSendHistory: ContactSendHistoryItem[]
  setContactSendHistory: Dispatch<SetStateAction<ContactSendHistoryItem[]>>
  campaignSendLog: Record<string, CampaignSendLog>
  setCampaignSendLog: Dispatch<SetStateAction<Record<string, CampaignSendLog>>>
  reloadContactSendHistory: (page?: number, limit?: number) => Promise<void>
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export function useSendHistory({ effectiveUserId }: UseSendHistoryOptions): UseSendHistoryResult {
  const [campaignSendLog, setCampaignSendLog] = useState<Record<string, CampaignSendLog>>({})
  const [sendHistory, setSendHistory] = useState<SendHistoryItem[]>([])
  const [contactSendHistory, setContactSendHistory] = useState<ContactSendHistoryItem[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 })

  const reloadContactSendHistory = useCallback(async (page = 1, limit = 50) => {
    if (!effectiveUserId) {
      setCampaignSendLog({})
      setSendHistory([])
      setContactSendHistory([])
      setPagination({ total: 0, page: 1, limit: 50, pages: 1 })
      return
    }

    try {
      const data = await apiFetch(`/api/history?page=${page}&limit=${limit}`)

      if (data && data.rows) {
        // Formato novo { rows, meta }
        const { rows, meta } = data
        setPagination(meta)
        
        const history: ContactSendHistoryItem[] = rows
          .map((row: any) => {
            const runAtIso = row.run_at ? new Date(row.run_at).toISOString() : ''
            const deliverySummaryRaw = row.delivery_summary
            const deliverySummary =
              deliverySummaryRaw && typeof deliverySummaryRaw === 'object'
                ? {
                    sentText: Boolean(deliverySummaryRaw.sentText),
                    mediaSent: Number(deliverySummaryRaw.mediaSent || 0),
                    mediaFailed: Number(deliverySummaryRaw.mediaFailed || 0),
                    contactSent: Boolean(deliverySummaryRaw.contactSent),
                    contactFailed: Boolean(deliverySummaryRaw.contactFailed),
                    errors: Array.isArray(deliverySummaryRaw.errors)
                      ? deliverySummaryRaw.errors.map((item: unknown) => String(item))
                      : [],
                  }
                : undefined

            let payloadRaw: string | undefined
            if (row.payload_raw != null) {
              try {
                payloadRaw = JSON.stringify(row.payload_raw, null, 2)
              } catch {
                payloadRaw = String(row.payload_raw)
              }
            }

            return {
              id: row.id,
              contactId: 0,
              campaignId: row.campaign_id,
              campaignName: row.campaign_name,
              contactName: row.contact_name,
              phoneKey: row.phone_key,
              channel: row.channel as 'whatsapp' | 'email',
              ok: row.ok,
              status: row.status || 0,
              runAt: row.run_at ? new Date(row.run_at).toLocaleString('pt-BR') : '',
              runAtIso,
              providerStatus: row.provider_status || undefined,
              errorDetail: row.error_detail || undefined,
              payloadRaw,
              deliverySummary,
            }
          })
          .sort((a: ContactSendHistoryItem, b: ContactSendHistoryItem) => {
            const dateA = a.runAtIso ? new Date(a.runAtIso).getTime() : 0
            const dateB = b.runAtIso ? new Date(b.runAtIso).getTime() : 0
            return dateB - dateA
          })

        setContactSendHistory(history)

        const logMap: Record<string, CampaignSendLog> = {}
        for (const item of history) {
          if (!logMap[item.campaignId]) {
            logMap[item.campaignId] = {
              lastStatus: item.status || (item.ok ? 200 : 500),
              lastOk: item.ok,
              lastErrorCount: item.ok ? 0 : 1,
              lastTotal: 1,
              lastRunAt: item.runAt,
            }
          }
        }
        setCampaignSendLog(logMap)
      }
    } catch (e) {
      logError('history.load', 'Erro ao carregar historico de envios do backend', e)
    }
  }, [effectiveUserId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reloadContactSendHistory(1, 100)
    }, 1100)

    return () => {
      window.clearTimeout(timer)
    }
  }, [reloadContactSendHistory])

  return {
    sendHistory,
    setSendHistory,
    contactSendHistory,
    setContactSendHistory,
    campaignSendLog,
    setCampaignSendLog,
    reloadContactSendHistory,
    pagination,
  }
}
