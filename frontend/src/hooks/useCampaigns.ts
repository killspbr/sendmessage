import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Campaign, CampaignChannel } from '../types'
import { apiFetch } from '../api'
import { logError } from '../utils'

export type UseCampaignsOptions = {
    effectiveUserId: string | null
}

export type UseCampaignsResult = {
    campaigns: Campaign[]
    setCampaigns: Dispatch<SetStateAction<Campaign[]>>
    reloadCampaigns: () => Promise<void>
}

export function useCampaigns({ effectiveUserId }: UseCampaignsOptions): UseCampaignsResult {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])

    const loadCampaigns = async () => {
        if (!effectiveUserId) {
            setCampaigns([])
            return
        }

        try {
            const data = await apiFetch('/api/campaigns')

            const next: Campaign[] = (data ?? []).map((row: any) => {
                const channels: CampaignChannel[] = Array.isArray(row.channels)
                    ? (row.channels as CampaignChannel[])
                    : ['whatsapp']

                const createdAtStr = row.created_at
                    ? new Date(row.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                    : ''

                return {
                    id: row.id,
                    name: row.name ?? '',
                    status: (row.status as Campaign['status']) ?? 'rascunho',
                    channels,
                    listName: row.list_name ?? 'Lista padrão',
                    createdAt: createdAtStr,
                    message: row.message ?? '',
                    intervalMinSeconds: typeof row.interval_min_seconds === 'number' ? row.interval_min_seconds : 30,
                    intervalMaxSeconds: typeof row.interval_max_seconds === 'number' ? row.interval_max_seconds : 90,
                }
            })

            setCampaigns(next)
        } catch (e) {
            logError('campaigns.load', 'Erro ao carregar campanhas do backend', e)
        }
    }

    useEffect(() => {
        void loadCampaigns()
    }, [effectiveUserId])

    return {
        campaigns,
        setCampaigns,
        reloadCampaigns: loadCampaigns,
    }
}
