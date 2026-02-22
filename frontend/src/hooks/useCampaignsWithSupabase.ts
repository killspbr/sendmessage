import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Campaign, CampaignChannel, SupabaseCampaignRow } from '../types'
import { supabase } from '../supabaseClient'
import { logError } from '../utils'

export type UseCampaignsOptions = {
  effectiveUserId: string | null
}

export type UseCampaignsResult = {
  campaigns: Campaign[]
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>
  reloadCampaigns: () => Promise<void>
}

export function useCampaignsWithSupabase({ effectiveUserId }: UseCampaignsOptions): UseCampaignsResult {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const loadCampaigns = async () => {
    if (!effectiveUserId) {
      setCampaigns([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(
          'id, user_id, name, status, channels, list_name, created_at, message, interval_min_seconds, interval_max_seconds',
        )
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: true })

      if (error) {
        logError('campaigns.load', 'Erro ao carregar campanhas do Supabase', error)
        return
      }

      const next: Campaign[] = (data ?? []).map((row: SupabaseCampaignRow) => {
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
      logError('campaigns.load', 'Erro inesperado ao carregar campanhas do Supabase', e)
    }
  }

  useEffect(() => {
    void loadCampaigns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId])

  return {
    campaigns,
    setCampaigns,
    reloadCampaigns: loadCampaigns,
  }
}
