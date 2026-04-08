import { useEffect, useState, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Campaign, CampaignChannel, CampaignDeliveryPayload, PaginationMeta } from '../types'
import { apiFetch } from '../api'
import { logError } from '../utils'
import { DEFAULT_LIMITS } from '../config/pagination'

export type UseCampaignsOptions = {
    effectiveUserId: string | null
    page?: number
    limit?: number
}

export type UseCampaignsResult = {
    campaigns: Campaign[]
    setCampaigns: Dispatch<SetStateAction<Campaign[]>>
    pagination: PaginationMeta | null
    reloadCampaigns: (p?: number, l?: number) => Promise<void>
}

export function useCampaigns({ 
  effectiveUserId,
  page: initialPage = 1,
  limit: initialLimit = DEFAULT_LIMITS.campaigns
}: UseCampaignsOptions): UseCampaignsResult {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [pagination, setPagination] = useState<PaginationMeta | null>(null)
    const [currentPage, setCurrentPage] = useState(initialPage)
    const [currentLimit, setCurrentLimit] = useState(initialLimit)

    const loadCampaigns = useCallback(async (p?: number, l?: number) => {
        if (!effectiveUserId) {
            setCampaigns([])
            setPagination(null)
            return
        }

        const pageToLoad = p ?? currentPage
        const limitToLoad = l ?? currentLimit

        try {
            const response = await apiFetch(`/api/campaigns?page=${pageToLoad}&limit=${limitToLoad}`)
            
            // Backend retorna { rows: [], meta: {} }
            const rows = response.rows || []
            const meta = response.meta || null

            const next: Campaign[] = rows.map((row: any) => {
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
                    deliveryPayload: (row.delivery_payload as CampaignDeliveryPayload | null) ?? null,
                    intervalMinSeconds: typeof row.interval_min_seconds === 'number' ? row.interval_min_seconds : 30,
                    intervalMaxSeconds: typeof row.interval_max_seconds === 'number' ? row.interval_max_seconds : 90,
                }
            })

            setCampaigns(next)
            if (meta) {
              setPagination(meta)
              setCurrentPage(meta.page)
              setCurrentLimit(meta.limit)
            }
        } catch (e) {
            logError('campaigns.load', 'Erro ao carregar campanhas do backend', e)
        }
    }, [effectiveUserId, currentPage, currentLimit])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadCampaigns(initialPage, initialLimit)
        }, 700)

        return () => {
            window.clearTimeout(timer)
        }
    }, [effectiveUserId, initialPage, initialLimit])

    return {
        campaigns,
        setCampaigns,
        pagination,
        reloadCampaigns: loadCampaigns,
    }
}
