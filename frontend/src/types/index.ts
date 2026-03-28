// Tipos compartilhados do sistema

export type Contact = {
  id: number
  supabaseId?: string
  name: string
  phone: string
  category: string
  cep: string
  rating: string
  email: string
  address?: string
  city?: string
}

export type ContactList = {
  id: string
  name: string
}

export type CampaignChannel = 'whatsapp' | 'email'

export type CampaignStatus = 'rascunho' | 'agendada' | 'enviada' | 'enviada_com_erros'

export type CampaignMediaType = 'image' | 'document'

export type CampaignMediaItem = {
  id: string
  sourceType: 'url'
  mediaType: CampaignMediaType
  url: string
  caption: string
}

export type CampaignSharedContact = {
  fullName: string
  phone: string
  company: string
  email: string
  url: string
}

export type CampaignDeliveryPayload = {
  version: number
  whatsapp?: {
    blocks: Array<
      | { type: 'text'; content: string }
      | { type: 'media'; items: CampaignMediaItem[] }
      | { type: 'contact'; contact: CampaignSharedContact }
    >
  }
}

export type Campaign = {
  id: string
  name: string
  status: CampaignStatus
  channels: CampaignChannel[]
  listName: string
  createdAt: string
  message: string
  intervalMinSeconds?: number
  intervalMaxSeconds?: number
  deliveryPayload?: CampaignDeliveryPayload | null
}

export type SendHistoryItem = {
  id: string
  campaignId: string
  campaignName: string
  status: number
  ok: boolean
  total: number
  errorCount: number
  runAt: string
}

export type ContactSendHistoryItem = {
  id: string
  contactId: number
  contactName: string
  phoneKey: string
  campaignId: string
  campaignName: string
  channel: CampaignChannel
  status: number
  ok: boolean
  runAt: string
  runAtIso?: string
  providerStatus?: string
  errorDetail?: string
  payloadRaw?: string
  deliverySummary?: {
    sentText: boolean
    mediaSent: number
    mediaFailed: number
    contactSent: boolean
    contactFailed: boolean
    errors: string[]
  }
}

export type ImportConflict = {
  id: string
  existing: Contact
  incoming: Contact
  resolution: 'system' | 'file'
}

export type CampaignSendLog = {
  lastStatus: number
  lastOk: boolean
  lastErrorCount: number
  lastTotal: number
  lastRunAt: string
}

export type PageType = 'dashboard' | 'contacts' | 'campaigns' | 'schedules' | 'settings' | 'reports' | 'admin'

// Tipos auxiliares para linhas do Supabase (apenas campos usados no App)

export type SupabaseContactSendHistoryRow = {
  id: string
  user_id: string
  campaign_id: string
  campaign_name: string
  contact_name: string
  phone_key: string
  channel: CampaignChannel
  ok: boolean
  status: number | null
  run_at: string | null
}

export type SupabaseCampaignRow = {
  id: string
  user_id: string
  name: string | null
  status: CampaignStatus | null
  channels: CampaignChannel[] | null
  list_name: string | null
  created_at: string | null
  message: string | null
  interval_min_seconds: number | null
  interval_max_seconds: number | null
  delivery_payload: CampaignDeliveryPayload | null
}

export type SupabaseListRow = {
  id: string
  name: string
}
