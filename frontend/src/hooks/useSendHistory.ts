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
    reloadContactSendHistory: () => Promise<void>
}

export function useSendHistory({ effectiveUserId }: UseSendHistoryOptions): UseSendHistoryResult {
    const [campaignSendLog, setCampaignSendLog] = useState<Record<string, CampaignSendLog>>({})
    const [sendHistory, setSendHistory] = useState<SendHistoryItem[]>([])
    const [contactSendHistory, setContactSendHistory] = useState<ContactSendHistoryItem[]>([])

    const reloadContactSendHistory = useCallback(async () => {
        if (!effectiveUserId) {
            setCampaignSendLog({})
            setSendHistory([])
            setContactSendHistory([])
            return
        }

        try {
            const data = await apiFetch('/api/history')

            if (data) {
                const history: ContactSendHistoryItem[] = data.map((row: any) => ({
                    id: row.id,
                    contactId: 0,
                    campaignId: row.campaign_id,
                    campaignName: row.campaign_name,
                    contactName: row.contact_name,
                    phoneKey: row.phone_key,
                    channel: row.channel as 'whatsapp' | 'email',
                    ok: row.ok,
                    status: row.status || 0,
                    webhookOk: row.webhook_ok ?? true,
                    runAt: row.run_at ? new Date(row.run_at).toLocaleString('pt-BR') : '',
                }))

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
            logError('history.load', 'Erro ao carregar histórico de envios do backend', e)
        }
    }, [effectiveUserId])

    useEffect(() => {
        void reloadContactSendHistory()
    }, [reloadContactSendHistory])

    return {
        sendHistory,
        setSendHistory,
        contactSendHistory,
        setContactSendHistory,
        campaignSendLog,
        setCampaignSendLog,
        reloadContactSendHistory,
    }
}
