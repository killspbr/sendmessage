// Tipos compartilhados do sistema

export type Contact = {
  id: number
  databaseId?: string
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

export type CampaignStatus = 'rascunho' | 'agendada' | 'enviando' | 'enviada' | 'enviada_com_erros'

export type CampaignMediaType = 'image' | 'document' | 'audio' | 'video'

export type CampaignMediaItem = {
  id: string
  sourceType: 'url' | 'asset'
  mediaType: CampaignMediaType
  url: string
  caption: string
  assetId?: string
  assetName?: string
  mimeType?: string
  sizeBytes?: number
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
  mediaItems?: CampaignMediaItem[]
  sharedContact?: CampaignSharedContact | null
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
    mediaDetails?: Array<{ id: string; type: string; status: 'sent' | 'failed' | 'skipped'; error?: string }>
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

// Tipos auxiliares para linhas do banco (apenas campos usados no App)

export type DatabaseContactSendHistoryRow = {
  id: string
  user_id: string
  campaign_id: string
  campaign_name: string
  contact_name: string
  phone_key: string
  channel: string
  ok: boolean
  status: number
  webhook_ok: boolean
  provider_status: string
  error_detail: string
  payload_raw: any
  delivery_summary: any
  run_at: string
  created_at: string
}

export type DatabaseCampaignRow = {
  id: string
  user_id: string
  name: string
  status: string
  channels: any
  list_name: string
  message: string
  variations: any
  interval_min_seconds: number
  interval_max_seconds: number
  delivery_payload: any
  created_at: string
  updated_at: string
}

export type UploadedUserFile = {
  id: string
  originalName: string
  storedName: string
  mimeType: string
  extension: string
  sizeBytes: number
  mediaType: CampaignMediaType
  createdAt: string
  canInline: boolean
  publicUrl: string
  isAvailable: boolean
  availabilityReason?: string | null
}

export type UserLimitMetric = {
  used: number
  limit: number | null
}

export type UserLimitSnapshot = {
  isAdmin: boolean
  dailyMessages: UserLimitMetric
  monthlyMessages: UserLimitMetric
  geminiGlobal: {
    usingGlobalPool: boolean
    usedToday: number
    limit: number | null
  }
  uploads: {
    usedBytes: number
    limitBytes: number | null
    unlimited: boolean
  }
}

export type ActiveUserPresenceItem = {
  userId: string
  sessionId: string
  name: string
  email: string
  currentPage: string | null
  lastSeenAt: string
}

export type ActiveUserPresenceSnapshot = {
  totalUsers: number
  totalSessions: number
  windowSeconds: number
  generatedAt: string
  users: ActiveUserPresenceItem[]
}

export type SupabaseListRow = {
  id: string
  name: string
}
