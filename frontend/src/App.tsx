import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { apiFetch } from './api'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ContactForm } from './components/contacts/ContactForm'
import { ContactsHeader } from './components/contacts/ContactsHeader'
import {
  DashboardPage,
  SettingsPage,
  CampaignsPage,
  ContactsPage,
  AuthPage,
  AdminUsersPage,
  UserSettingsPage,
  ReportsPage,
  SchedulesPage,
  ExtractPage,
} from './pages'
import { usePermissions } from './hooks/usePermissions'
import { useAuth } from './hooks/useAuth'
import { useLists } from './hooks/useLists'
import { useCampaigns } from './hooks/useCampaigns'
import { useSendHistory } from './hooks/useSendHistory'
import { useContacts } from './hooks/useContacts'
import type {
  Contact,
  ContactList,
  Campaign,
  CampaignChannel,
  SendHistoryItem,
  ContactSendHistoryItem,
  ImportConflict,
  CampaignSendLog,
} from './types'
import { BACKEND_URL, normalizePhone, formatRating, logError } from './utils'

const _defaultContacts: Contact[] = [
  {
    id: 1,
    name: 'Pizzaria Tostao & Filhos',
    phone: '(11) 94873-9532',
    category: 'Restaurante',
    cep: '09831-425',
    rating: '4.8',
    email: '',
  },
  {
    id: 2,
    name: 'Restaurante e Pizzaria Sharlon',
    phone: '(11) 4354-8844',
    category: 'Pizzaria',
    cep: '09837-312',
    rating: '4.2',
    email: '',
  },
  {
    id: 3,
    name: 'Fabuloso Dogão',
    phone: '(11) 95834-6544',
    category: 'Lanchonete',
    cep: '09831-505',
    rating: '4.6',
    email: '',
  },
  {
    id: 4,
    name: 'Viena Cantinho Da Pizza',
    phone: '(11) 4101-8560',
    category: 'Pizzaria',
    cep: '09830-100',
    rating: '4.5',
    email: '',
  },
  {
    id: 5,
    name: 'Casa do norte 2 irmãs',
    phone: '(11) 4397-5815',
    category: 'Restaurante',
    cep: '09837-312',
    rating: '4.5',
    email: '',
  },
  {
    id: 6,
    name: 'BIGLOW EXPRESS',
    phone: '(11) 96443-8602',
    category: 'Hamburgueria',
    cep: '09831-191',
    rating: '5.0',
    email: '',
  },
]

const _initialLists: ContactList[] = [
  { id: 'default', name: 'Lista padrão' },
  { id: 'pizzarias', name: 'Pizzarias' },
  { id: 'hamburguerias', name: 'Hamburguerias' },
]

function App() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')

  const { authLoading, currentUser, login: authLogin, signup: authSignup, logout: authLogout } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)

  const [rememberMe, setRememberMe] = useState(() => {
    try {
      const stored = localStorage.getItem('sendmessage_authRemember')
      return stored === 'true'
    } catch {
      return false
    }
  })
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null)
  const effectiveUserId = impersonatedUserId ?? currentUser?.id ?? null

  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const APP_VERSION = '1.0.1'

  // Verificar versão e forçar atualização se necessário
  useEffect(() => {
    const checkVersion = () => {
      try {
        const storedVersion = localStorage.getItem('app_version')
        if (storedVersion && storedVersion !== APP_VERSION) {
          setForceUpdate(true)
        } else {
          localStorage.setItem('app_version', APP_VERSION)
        }
      } catch (e) {
        console.error('Erro ao verificar versão:', e)
      }
    }

    checkVersion()

    // Verificar periodicamente se há nova versão (a cada 5 minutos)
    const interval = setInterval(() => {
      fetch('/index.html', { cache: 'no-store' })
        .then(() => {
          const currentStoredVersion = localStorage.getItem('app_version')
          if (currentStoredVersion !== APP_VERSION) {
            setForceUpdate(true)
          }
        })
        .catch(() => { })
    }, 300000) // 5 minutos

    return () => clearInterval(interval)
  }, [])

  type UserSettings = {
    use_global_ai: boolean
    ai_api_key: string | null
    webhook_whatsapp_url: string | null
    webhook_email_url: string | null
    evolution_url: string | null
    evolution_apikey: string | null
    evolution_instance: string | null
  }

  type GlobalSettings = {
    id: string | number | null
    global_ai_api_key: string | null
    global_webhook_whatsapp_url: string | null
    global_webhook_email_url: string | null
    evolution_api_url: string | null
    evolution_api_key: string | null
    evolution_shared_instance: string | null
  }

  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null)

  const handleSaveUserOverrides = async (overrides: {
    aiApiKey: string | null
    webhookWhatsappUrl?: string | null
    webhookEmailUrl?: string | null
    evolutionUrl?: string | null
    evolutionApiKey?: string | null
    evolutionInstance?: string | null
  }) => {
    if (!effectiveUserId) return

    try {
      const nextUseGlobalAi = overrides.aiApiKey == null
      const nextUseGlobalWebhooks = overrides.webhookWhatsappUrl === undefined && overrides.webhookEmailUrl === undefined

      const payload: any = {
        use_global_ai: nextUseGlobalAi,
        ai_api_key: overrides.aiApiKey,
      }

      if (overrides.webhookWhatsappUrl !== undefined) payload.webhook_whatsapp_url = overrides.webhookWhatsappUrl
      if (overrides.webhookEmailUrl !== undefined) payload.webhook_email_url = overrides.webhookEmailUrl
      if (overrides.evolutionUrl !== undefined) payload.evolution_url = overrides.evolutionUrl
      if (overrides.evolutionApiKey !== undefined) payload.evolution_apikey = overrides.evolutionApiKey
      if (overrides.evolutionInstance !== undefined) payload.evolution_instance = overrides.evolutionInstance
      if (!nextUseGlobalWebhooks) payload.use_global_webhooks = false

      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      })

      setUserSettings((prev) =>
        prev
          ? {
            ...prev,
            use_global_ai: nextUseGlobalAi,
            ai_api_key: overrides.aiApiKey,
            webhook_whatsapp_url: overrides.webhookWhatsappUrl !== undefined ? overrides.webhookWhatsappUrl : prev.webhook_whatsapp_url,
            webhook_email_url: overrides.webhookEmailUrl !== undefined ? overrides.webhookEmailUrl : prev.webhook_email_url,
            evolution_url: overrides.evolutionUrl !== undefined ? overrides.evolutionUrl : prev.evolution_url,
            evolution_apikey: overrides.evolutionApiKey !== undefined ? overrides.evolutionApiKey : prev.evolution_apikey,
            evolution_instance: overrides.evolutionInstance !== undefined ? overrides.evolutionInstance : prev.evolution_instance,
          }
          : prev,
      )
    } catch (e) {
      logError('userSettings.saveOverrides', 'Erro inesperado ao salvar configurações pessoais do usuário:', e)
    }
  }

  const handleSaveGlobalSettings = async () => {
    try {
      const payload = {
        global_ai_api_key: geminiApiKey.trim() || null,
        global_webhook_whatsapp_url: webhookUrlWhatsApp.trim() || null,
        global_webhook_email_url: webhookUrlEmail.trim() || null,
        evolution_api_url: evolutionApiUrl.trim() || null,
        evolution_api_key: evolutionApiKey.trim() || null,
        evolution_shared_instance: evolutionInstance.trim() || null,
      }

      const data = await apiFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      setGlobalSettings({
        id: data.id ?? null,
        global_ai_api_key: data.global_ai_api_key ?? null,
        global_webhook_whatsapp_url: data.global_webhook_whatsapp_url ?? null,
        global_webhook_email_url: data.global_webhook_email_url ?? null,
        evolution_api_url: data.evolution_api_url ?? null,
        evolution_api_key: data.evolution_api_key ?? null,
        evolution_shared_instance: data.evolution_shared_instance ?? null,
      })

      setLastMoveMessage('Configurações globais salvas com sucesso.')
    } catch (e) {
      logError('globalSettings.save', 'Erro inesperado ao salvar configurações globais de integração', e)
      setLastMoveMessage('Erro inesperado ao salvar as configurações globais.')
    }
  }

  // Carrega email/nome lembrados apenas na primeira inicialização do App
  useEffect(() => {
    try {
      const remembered = localStorage.getItem('sendmessage_authRemember') === 'true'
      if (remembered) {
        const storedEmail = localStorage.getItem('sendmessage_authEmail') || ''
        const storedName = localStorage.getItem('sendmessage_authName') || ''
        setRememberMe(true)
        if (!authEmail) setAuthEmail(storedEmail)
        if (!authName) setAuthName(storedName)
      }
    } catch (e) {
      logError('auth.loadRememberedLogin', 'Erro ao carregar dados de login lembrados', e)
    }
    // Executa apenas uma vez na inicialização
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escuta evento global disparado pelo Service Worker indicando nova versão disponível
  useEffect(() => {
    const handler = () => {
      setUpdateAvailable(true)
    }

    window.addEventListener('app:new-version-available', handler as EventListener)
    return () => {
      window.removeEventListener('app:new-version-available', handler as EventListener)
    }
  }, [])

  // Carrega configurações específicas do usuário (webhooks / IA) de user_profiles
  useEffect(() => {
    if (!effectiveUserId) {
      setUserSettings(null)
      return
    }

    let isMounted = true

    const loadUserSettings = async () => {
      try {
        const data = await apiFetch('/api/profile')

        if (!isMounted) return

        if (data) {
          setUserSettings({
            use_global_ai: data.use_global_ai ?? true,
            ai_api_key: data.ai_api_key ?? null,
            webhook_whatsapp_url: data.webhook_whatsapp_url ?? null,
            webhook_email_url: data.webhook_email_url ?? null,
            evolution_url: data.evolution_url ?? null,
            evolution_apikey: data.evolution_apikey ?? null,
            evolution_instance: data.evolution_instance ?? null,
          })
        } else {
          setUserSettings(null)
        }
      } catch (e) {
        logError('userSettings.load', 'Erro inesperado ao carregar configurações do usuário', e)
      }
    }

    void loadUserSettings()

    return () => {
      isMounted = false
    }
  }, [effectiveUserId])

  // Carrega configurações globais de integração (webhooks / IA) de app_settings
  useEffect(() => {
    const loadGlobalSettings = async () => {
      try {
        const data = await apiFetch('/api/settings')

        if (data) {
          setGlobalSettings({
            id: data.id ?? null,
            global_ai_api_key: data.global_ai_api_key ?? null,
            global_webhook_whatsapp_url: data.global_webhook_whatsapp_url ?? null,
            global_webhook_email_url: data.global_webhook_email_url ?? null,
            evolution_api_url: data.evolution_api_url ?? null,
            evolution_api_key: data.evolution_api_key ?? null,
            evolution_shared_instance: data.evolution_shared_instance ?? null,
          })

          // Sincroniza estados locais se estiverem vazios
          if (data.global_webhook_whatsapp_url) setWebhookUrlWhatsApp(data.global_webhook_whatsapp_url)
          if (data.global_webhook_email_url) setWebhookUrlEmail(data.global_webhook_email_url)
          if (data.global_ai_api_key) setGeminiApiKey(data.global_ai_api_key)
          if (data.evolution_api_url) setEvolutionApiUrl(data.evolution_api_url)
          if (data.evolution_api_key) setEvolutionApiKey(data.evolution_api_key)
          if (data.evolution_shared_instance) setEvolutionInstance(data.evolution_shared_instance)
        } else {
          setGlobalSettings(null)
        }
      } catch (e) {
        logError('globalSettings.load', 'Erro inesperado ao carregar app_settings', e)
      }
    }

    void loadGlobalSettings()
  }, [])

  const {
    loading: permissionsLoading,
    error: permissionsError,
    permissions,
    can,
    canAny,
    canAll,
  } = usePermissions(effectiveUserId ? { id: effectiveUserId } : null)

  const { lists, currentListId, setCurrentListId, reloadLists, setLists } = useLists({ effectiveUserId })

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_geminiApiKey') || ''
    } catch (e) {
      logError('gemini.loadApiKey', 'Erro ao ler Gemini API Key do localStorage', e)
      return ''
    }
  })

  const [geminiModel, setGeminiModel] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_geminiModel') || 'gemini-1.5-flash-latest'
    } catch {
      return 'gemini-1.5-flash-latest'
    }
  })

  const [geminiApiVersion, setGeminiApiVersion] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_geminiApiVersion') || 'v1'
    } catch {
      return 'v1'
    }
  })

  const [geminiTemperature, setGeminiTemperature] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('sendmessage_geminiTemperature')
      if (stored) {
        const val = parseFloat(stored)
        if (!isNaN(val) && val >= 0 && val <= 1) return val
      }
    } catch { }
    return 0.7
  })

  const [geminiMaxTokens, setGeminiMaxTokens] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('sendmessage_geminiMaxTokens')
      if (stored) {
        const val = parseInt(stored, 10)
        if (!isNaN(val) && val > 0) return val
      }
    } catch { }
    return 1024
  })

  // IA efetiva considerando configurações globais x por usuário
  const globalAiKey = globalSettings?.global_ai_api_key || geminiApiKey || ''
  const useGlobalAi = userSettings?.use_global_ai ?? true
  const userAiKey = userSettings?.ai_api_key || null

  const effectiveAiKey = useGlobalAi ? globalAiKey : userAiKey || ''

  const userHasConfiguredAi =
    (useGlobalAi && !!globalAiKey) || (!useGlobalAi && !!userAiKey)

  const [webhookUrlWhatsApp, setWebhookUrlWhatsApp] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_webhookUrl_whatsapp') ?? ''
    } catch {
      return ''
    }
  })

  const [webhookUrlEmail, setWebhookUrlEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_webhookUrl_email') ?? ''
    } catch {
      return ''
    }
  })

  const [evolutionApiUrl, setEvolutionApiUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_evolution_api_url') ?? ''
    } catch {
      return ''
    }
  })

  const [evolutionApiKey, setEvolutionApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_evolution_api_key') ?? ''
    } catch {
      return ''
    }
  })

  const [evolutionInstance, setEvolutionInstance] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_evolution_instance') ?? ''
    } catch {
      return ''
    }
  })

  // Webhooks efetivos considerando configurações globais x por usuário
  const globalWebhookWhatsapp = globalSettings?.global_webhook_whatsapp_url || ''
  const globalWebhookEmail = globalSettings?.global_webhook_email_url || ''

  // Prioridade: webhooks do perfil do usuário (configurados pelo admin) > webhooks globais > webhooks locais
  const userWebhookWhatsapp = userSettings?.webhook_whatsapp_url || null
  const userWebhookEmail = userSettings?.webhook_email_url || null

  const effectiveWebhookWhatsapp = userWebhookWhatsapp || globalWebhookWhatsapp || webhookUrlWhatsApp
  const effectiveWebhookEmail = userWebhookEmail || globalWebhookEmail || webhookUrlEmail

  // Persistir configurações da Evolution no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sendmessage_evolution_api_url', evolutionApiUrl)
      localStorage.setItem('sendmessage_evolution_api_key', evolutionApiKey)
      localStorage.setItem('sendmessage_evolution_instance', evolutionInstance)
    } catch { }
  }, [evolutionApiUrl, evolutionApiKey, evolutionInstance])

  // Persistir configuraÃ§Ãµes do Gemini no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sendmessage_geminiModel', geminiModel)
      localStorage.setItem('sendmessage_geminiApiVersion', geminiApiVersion)
      localStorage.setItem('sendmessage_geminiTemperature', String(geminiTemperature))
      localStorage.setItem('sendmessage_geminiMaxTokens', String(geminiMaxTokens))
    } catch { }
  }, [geminiModel, geminiApiVersion, geminiTemperature, geminiMaxTokens])
  const [debugEnabled, setDebugEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sendmessage_debugEnabled') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('sendmessage_debugEnabled', debugEnabled ? 'true' : 'false')
    } catch { }
  }, [debugEnabled])

  // currentListId agora vem do hook useListsWithSupabase; mantemos apenas a persistência
  const [currentPage, setCurrentPage] = useState<
    'dashboard' | 'contacts' | 'campaigns' | 'schedules' | 'settings' | 'reports' | 'admin' | 'profile' | 'extract'
  >(() => {
    try {
      const stored = localStorage.getItem('sendmessage_currentPage') as
        | 'dashboard'
        | 'contacts'
        | 'campaigns'
        | 'schedules'
        | 'settings'
        | 'reports'
        | 'admin'
        | 'profile'
        | null
      if (
        stored === 'dashboard' ||
        stored === 'contacts' ||
        stored === 'campaigns' ||
        stored === 'schedules' ||
        stored === 'settings' ||
        stored === 'reports' ||
        stored === 'admin' ||
        stored === 'profile'
      ) {
        return stored
      }
    } catch (e) {
      logError('ui.loadCurrentPage', 'Erro ao ler página atual do localStorage', e)
    }
    return 'contacts'
  })

  useEffect(() => {
    try {
      localStorage.setItem('sendmessage_currentPage', currentPage)
    } catch {
      // ignore
    }
  }, [currentPage])


  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null)
  const [sendingCurrentIndex, setSendingCurrentIndex] = useState<number>(0)
  const [sendingTotal, setSendingTotal] = useState<number>(0)
  const [sendingErrors, setSendingErrors] = useState<number>(0)
  const [sendingNextDelaySeconds, setSendingNextDelaySeconds] = useState<number | null>(null)

  const [sendIntervalMinSeconds, setSendIntervalMinSeconds] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('sendmessage_sendIntervalMin')
      if (stored != null) {
        const value = Number(stored)
        if (!Number.isNaN(value) && value >= 0) return value
      }
    } catch (e) {
      logError('sendInterval.loadMin', 'Erro ao ler intervalo mínimo do localStorage', e)
    }
    // Padrão global: 30 segundos
    return 30
  })

  const [sendIntervalMaxSeconds, setSendIntervalMaxSeconds] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('sendmessage_sendIntervalMax')
      if (stored != null) {
        const value = Number(stored)
        if (!Number.isNaN(value) && value >= 0) return value
      }
    } catch (e) {
      logError('sendInterval.loadMax', 'Erro ao ler intervalo máximo do localStorage', e)
    }
    // Padrão global: 90 segundos
    return 90
  })

  const {
    sendHistory,
    setSendHistory,
    contactSendHistory,
    setContactSendHistory,
    campaignSendLog,
    setCampaignSendLog,
    reloadContactSendHistory,
  } = useSendHistory({ effectiveUserId })

  useEffect(() => {
    try {
      localStorage.setItem('sendmessage_sendIntervalMin', String(sendIntervalMinSeconds))
      localStorage.setItem('sendmessage_sendIntervalMax', String(sendIntervalMaxSeconds))
    } catch (e) {
      logError('sendInterval.save', 'Erro ao salvar intervalos de envio no localStorage', e)
    }
  }, [sendIntervalMinSeconds, sendIntervalMaxSeconds])

  useEffect(() => {
    try {
      localStorage.setItem('sendmessage_currentPage', currentPage)
    } catch (e) {
      logError('ui.saveCurrentPage', 'Erro ao salvar página atual no localStorage', e)
    }
  }, [currentPage])

  // Carregamento de campanhas agora é feito pelo hook useCampaignsWithSupabase

  useEffect(() => {
    try {
      if (geminiApiKey) {
        localStorage.setItem('sendmessage_geminiApiKey', geminiApiKey)
      } else {
        localStorage.removeItem('sendmessage_geminiApiKey')
      }
    } catch (e) {
      logError('gemini.saveApiKey', 'Erro ao salvar Gemini API Key no localStorage', e)
    }
  }, [geminiApiKey])

  useEffect(() => {
    if (!sendingCampaignId || sendingNextDelaySeconds == null || sendingNextDelaySeconds <= 0) return

    const timer = setInterval(() => {
      setSendingNextDelaySeconds((prev) => {
        if (prev == null || prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sendingCampaignId, sendingNextDelaySeconds])

  const [idsNormalized, setIdsNormalized] = useState(false)

  // Filtros de contatos: inicialização preguiçosa lendo do localStorage
  const [searchName, setSearchName] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_searchName') || ''
    } catch {
      return ''
    }
  })
  const [searchPhone, setSearchPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_searchPhone') || ''
    } catch {
      return ''
    }
  })
  const [filterCategory, setFilterCategory] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_filterCategory') || 'Todas'
    } catch {
      return 'Todas'
    }
  })
  const [searchEmail, setSearchEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_searchEmail') || ''
    } catch {
      return ''
    }
  })
  const [filterCity, setFilterCity] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_filterCity') || ''
    } catch {
      return ''
    }
  })
  const [filterRating, setFilterRating] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_filterRating') || ''
    } catch {
      return ''
    }
  })

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [payloadPreview, setPayloadPreview] = useState<string>('')

  const [moveTargetListId, setMoveTargetListId] = useState<string>('')
  const [lastMoveMessage, setLastMoveMessage] = useState<string>('')
  const [sendConfirmCampaignId, setSendConfirmCampaignId] = useState<string | null>(null)
  const [_deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null)
  const [_deleteListId, _setDeleteListId] = useState<string | null>(null)
  const [importPreview, setImportPreview] = useState<any | null>(null)
  const [reportCampaignId, setReportCampaignId] = useState<string | null>(null)
  const [reportViewMode, setReportViewMode] = useState<'all' | 'last'>('all')

  const [isBackfillingAddress, setIsBackfillingAddress] = useState(false)
  const [_backfillProcessed, setBackfillProcessed] = useState(0)
  const [_backfillTotal, setBackfillTotal] = useState(0)

  // Persiste lista atual e filtros de contatos no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sendmessage_currentListId', currentListId)
      localStorage.setItem('sendmessage_contacts_searchName', searchName)
      localStorage.setItem('sendmessage_contacts_searchPhone', searchPhone)
      localStorage.setItem('sendmessage_contacts_filterCategory', filterCategory)
      localStorage.setItem('sendmessage_contacts_searchEmail', searchEmail)
      localStorage.setItem('sendmessage_contacts_filterCity', filterCity)
      localStorage.setItem('sendmessage_contacts_filterRating', filterRating)
    } catch {
      // Ignora erros de acesso ao localStorage (ex: modo privado)
    }
  }, [currentListId, searchName, searchPhone, filterCategory, searchEmail, filterCity, filterRating])

  // Modais de UI (substituem prompts/confirms nativos)
  const [listModalMode, setListModalMode] = useState<'create' | 'rename' | null>(null)
  const [listModalName, setListModalName] = useState('')
  const [confirmDeleteListOpen, setConfirmDeleteListOpen] = useState(false)
  const [_confirmCancelSendOpen, _setConfirmCancelSendOpen] = useState(false)

  // FormulÃ¡rio integrado para criaÃ§Ã£o/ediÃ§Ã£o de contato
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactFormName, setContactFormName] = useState('')
  const [contactFormPhone, setContactFormPhone] = useState('')
  const [contactFormCategory, setContactFormCategory] = useState('')
  const [contactFormEmail, setContactFormEmail] = useState('')
  const [contactFormCep, setContactFormCep] = useState('')
  const [contactFormAddress, setContactFormAddress] = useState('')
  const [contactFormCity, setContactFormCity] = useState('')
  const [contactFormRating, setContactFormRating] = useState('')

  const { campaigns, setCampaigns, reloadCampaigns } = useCampaigns({ effectiveUserId })
  const { contactsByList, setContactsByList, reloadContacts } = useContacts({ effectiveUserId, currentListId })

  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignListId, setNewCampaignListId] = useState<string>('default')
  const [newCampaignChannels, setNewCampaignChannels] = useState<CampaignChannel[]>(['whatsapp'])
  const [newCampaignMessage, setNewCampaignMessage] = useState('')
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [campaignEditorOpen, setCampaignEditorOpen] = useState(false)

  const [importNewContacts, setImportNewContacts] = useState<Contact[] | null>(null)
  const [importConflicts, setImportConflicts] = useState<ImportConflict[] | null>(null)



  // normalizePhone e formatRating agora importados de ./utils

  const decodeHtml = (html: string): string => {
    if (typeof document === 'undefined') return html
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }

  const htmlToText = (html: string): string => {
    if (!html) return ''
    const decoded = decodeHtml(html)
    return decoded
      .replace(/<br\s*\/?>(?=\s*<)/gi, '<br />')
      .replace(/<br\s*\/?>(?!\s*<)/gi, '\n')
      .replace(/<\/(p|div)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const htmlToWhatsapp = (html: string): string => {
    if (!html) return ''

    // Trabalha sobre o HTML bruto para preservar tags de parÃ¡grafo e listas
    let text = html

    // negrito
    text = text.replace(/<(b|strong)>([\s\S]*?)<\/(b|strong)>/gi, '*$2*')
    // itÃ¡lico
    text = text.replace(/<(i|em)>([\s\S]*?)<\/(i|em)>/gi, '_$2_')
    // rasurado
    text = text.replace(/<(s|del)>([\s\S]*?)<\/(s|del)>/gi, '~$2~')
    // cÃ³digo em bloco
    text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '``$1``')
    // cÃ³digo inline
    text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '$1')

    // listas com marcas (simples)
    text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '* $1\n')

    // citaÃ§Ã£o
    text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n')

    // separadores de blocos: tÃ­tulos e listas
    text = text
      .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
      .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '*$1*\n')

    // quebras de linha e parÃ¡grafos
    // <br> vira uma quebra simples
    text = text.replace(/<br\s*\/?>/gi, '\n')
    // Fim de parÃ¡grafo/div vira uma quebra simples (igual ao visual do HTML)
    text = text.replace(/<\/(p|div)>/gi, '\n')

    // remover demais tags
    text = text.replace(/<[^>]+>/g, '')

    // decodificar entidades HTML
    text = decodeHtml(text)

    // NormalizaÃ§Ã£o:
    // 1. Remove espaÃ§os e tabs no final das linhas
    text = text.replace(/[ \t]+\n/g, '\n')
    // 2. Remove linhas em branco extras (mantÃ©m no mÃ¡ximo 2 quebras seguidas)
    text = text.replace(/\n{2,}/g, '\n\n')

    return text.trim()
  }

  const callGeminiForCampaign = async (params: {
    mode: 'suggest' | 'rewrite'
    currentContent: string
    campaignName: string
    listName: string
    channels: CampaignChannel[]
  }): Promise<string | null> => {
    if (!effectiveAiKey) {
      alert(
        'Nenhuma API de IA está configurada. PeÃ§a ao administrador para definir uma chave global do Gemini ou informe sua prÃ³pria chave em "Meu perfil".',
      )
      return null
    }

    const { mode, currentContent, campaignName, listName, channels } = params

    const channelsLabel =
      channels.includes('whatsapp') && channels.includes('email')
        ? 'WhatsApp e Email'
        : channels.includes('whatsapp')
          ? 'WhatsApp'
          : channels.includes('email')
            ? 'Email'
            : 'mensagens'

    const wantsEmojis = campaignName.toLowerCase().includes('emojis=sim')
    const emojiRule = wantsEmojis
      ? '- Use emojis relevantes ao contexto (sem exagero, 1 a 3 por parÃ¡grafo no mÃ¡ximo).'
      : '- NÃ£o use emojis.'

    let prompt: string

    if (mode === 'suggest') {
      prompt = `
Você é um redator especializado em campanhas de marketing.

Crie um texto COMPLETO para uma campanha de ${channelsLabel},
comunicando-se de forma clara, amigável e objetiva.

Detalhes:
- Nome da campanha: "${campaignName || 'Campanha sem nome'}"
- Lista: "${listName}"
- Idioma: Português (Brasil)
- Público: pequenas e médias empresas.

Regras:
- Use parágrafos curtos.
- Pode usar listas com marcadores quando fizer sentido.
${emojiRule}
- Não use linguagem muito formal.
- Respeite as instruções entre colchetes no nome da campanha (tom, objetivo, tipo, segmento, comprimento e emojis).

Retorne APENAS o texto em HTML simples (tags <p>, <ul>, <li>, <strong>, <em>), sem explicações extras.
      `
    } else {
      prompt = `
Você é um redator especializado em campanhas de marketing.

Reescreva o texto abaixo para ficar mais CLARO, PERSUASIVO e ORGANIZADO,
mantendo o mesmo sentido geral.

Nome da campanha (inclui instruções entre colchetes para o tom, objetivo, tipo, segmento, comprimento e uso de emojis):
"${campaignName || 'Campanha sem nome'}"

Texto original (HTML):
${currentContent}

Regras:
- Respeite o idioma do texto original (português).
- Use parágrafos curtos.
- Pode usar listas com marcadores quando fizer sentido.
${emojiRule}
- Não invente ofertas nem preços que não existiam.
- Respeite as instruções entre colchetes no nome da campanha (tom, objetivo, tipo, segmento, comprimento e emojis).
- Retorne APENAS o texto reescrito em HTML simples (tags <p>, <ul>, <li>, <strong>, <em>), sem explicações extras.
      `
    }

    try {
      const forcedGeminiApiVersion = 'v1'
      const forcedGeminiModel = 'gemini-2.5-flash'
      const apiUrl = `https://generativelanguage.googleapis.com/${forcedGeminiApiVersion}/models/${forcedGeminiModel}:generateContent?key=${effectiveAiKey}`

      const tempAdjust = mode === 'suggest' ? 0.1 : -0.1
      const finalTemp = Math.max(0, Math.min(1, geminiTemperature + tempAdjust))

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: finalTemp,
            maxOutputTokens: geminiMaxTokens,
          },
        }),
      })

      if (!response.ok) {
        const rawErrorText = await response.text()
        console.error('Erro HTTP ao chamar Gemini:', response.status, rawErrorText)

        // Tenta detectar erro de quota/429 para mostrar mensagem mais clara
        try {
          const parsed = JSON.parse(rawErrorText)
          const status = parsed?.error?.status as string | undefined
          const message = parsed?.error?.message as string | undefined

          if (response.status === 429 || status === 'RESOURCE_EXHAUSTED') {
            const quotaMsg =
              'A cota gratuita do Gemini para esta chave/modelo foi atingida hoje (erro 429 / quota). ' +
              'Lembre-se de que o limite diário (~20 requisições) é compartilhado entre todos os clientes. ' +
              'Considere configurar uma API própria em “Meu perfil” ou ajustar o projeto com billing ativo em Configurações.'
            alert(quotaMsg)
            setLastMoveMessage(quotaMsg)
            return null
          }

          if (message) {
            const msg = `Erro ao chamar a IA (Gemini): ${message}`
            alert(msg)
            setLastMoveMessage(msg)
            return null
          }
        } catch {
          // Ignora erros de parse e cai no alerta genÃ©rico
        }

        const genericMsg = 'Erro ao chamar a IA (Gemini). Verifique a chave, o modelo e tente novamente.'
        alert(genericMsg)
        setLastMoveMessage(genericMsg)
        return null
      }

      const data = await response.json()
      console.log('Resposta bruta do Gemini:', data)
        ; (window as any).__lastGeminiResponse = data

      const candidates = Array.isArray(data?.candidates) ? data.candidates : []

      let fullText = ''
      if (candidates.length > 0) {
        const firstCandidate = candidates[0]

        // Em algumas versÃµes da API do Gemini, content vem como objeto;
        // em outras, como array de conteÃºdos. Aqui tratamos os dois casos.
        const rawContent = (firstCandidate as any)?.content
        const content = Array.isArray(rawContent) ? rawContent[0] : rawContent

        if (content?.parts) {
          const parts = (content.parts as Array<{ text?: string }> | undefined) ?? []
          fullText = parts
            .map((p) => (typeof p.text === 'string' ? p.text : ''))
            .join('\n')
            .trim()
        } else if (typeof content?.text === 'string') {
          fullText = content.text.trim()
        }
      }

      if (!fullText) {
        alert('A IA nÃ£o retornou conteÃºdo vÃ¡lido. Veja o console (Resposta bruta do Gemini) para detalhes.')
        return null
      }

      return fullText
    } catch (e) {
      console.error('Erro inesperado ao chamar Gemini:', e)
      alert('Erro inesperado ao usar a IA. Tente novamente mais tarde.')
      return null
    }
  }

  const handleGenerateCampaignContentWithAI = async (options: {
    mode: 'suggest' | 'rewrite'
    currentContent: string
    campaignName: string
    listName: string
    channels: CampaignChannel[]
  }): Promise<string | null> => {
    const result = await callGeminiForCampaign(options)
    if (!result) return null

    setNewCampaignMessage(result)
    return result
  }

  const parseBackendResult = (result: any, response: Response) => {
    let backendOk: boolean
    let backendStatus: number
    // webhookOk: sucesso da chamada HTTP + wrapper (sem olhar o status interno da mensagem)
    let webhookOk: boolean = response.ok

    if (Array.isArray(result) && result.length > 0) {
      const item = result[0] as any
      const statusText = String(item.status ?? '').toLowerCase()

      const erroFlag = item.erro
      const hasExplicitError = erroFlag === true || erroFlag === 'true'
      const successFlag = item.resultado?.success

      const payloadOk =
        statusText === 'ok' &&
        !hasExplicitError &&
        (typeof successFlag === 'boolean' ? successFlag === true : true)

      // Webhook considerado ok se HTTP foi bem-sucedido
      webhookOk = response.ok
      // Sucesso real da mensagem sÃ³ quando o HTTP deu certo E o payload indica sucesso
      backendOk = response.ok && payloadOk
      backendStatus = backendOk ? 200 : 500
    } else if (result && typeof result.ok === 'boolean') {
      // Formato { ok: boolean, status?: number, data?: any }
      // Webhook considerado ok se HTTP foi bem-sucedido e wrapper ok === true
      webhookOk = response.ok && Boolean(result.ok)

      let payloadOk = Boolean(result.ok)

      // Se houver campo data com itens de webhook, inspeciona cada um
      const data = result.data
      if (Array.isArray(data) && data.length > 0) {
        for (const rawItem of data) {
          const item = rawItem as any
          const statusText = String(item.status ?? '').toLowerCase()
          const erroFlag = item.erro
          const hasExplicitError = erroFlag === true || erroFlag === 'true'
          const successFlag = item.resultado?.success

          const itemOk =
            statusText === 'ok' &&
            !hasExplicitError &&
            (typeof successFlag === 'boolean' ? successFlag === true : true)

          if (!itemOk) {
            payloadOk = false
            break
          }
        }
      }

      backendOk = response.ok && payloadOk
      backendStatus = backendOk
        ? typeof result.status === 'number'
          ? (result.status as number)
          : 200
        : 500
    } else {
      webhookOk = response.ok
      backendOk = response.ok
      backendStatus = response.status || 0
    }

    return { backendOk, backendStatus, webhookOk }
  }

  // FunÃ§Ã£o para salvar histÃ³rico de envio no backend
  const saveSendHistory = async (entry: {
    campaignId: string
    contactName: string
    phoneKey: string
    channel: 'whatsapp' | 'email'
    ok: boolean
    status?: number
    webhookOk?: boolean
  }) => {
    if (!currentUser) return

    try {
      await apiFetch('/api/history', {
        method: 'POST',
        body: JSON.stringify({
          campaign_id: entry.campaignId,
          contact_name: entry.contactName,
          phone_key: entry.phoneKey,
          channel: entry.channel,
          ok: entry.ok,
          status: entry.status,
          webhook_ok: entry.webhookOk,
          run_at: new Date().toISOString(),
        })
      })
    } catch (e) {
      console.error('Erro ao salvar histÃ³rico no backend:', e)
    }
  }

  const handleCreateCampaign = async () => {
    if (!effectiveUserId) {
      setLastMoveMessage('Ã‰ necessÃ¡rio estar logado para criar campanhas.')
      return
    }
    const name = newCampaignName.trim()
    const message = newCampaignMessage.trim()
    if (!name) {
      setLastMoveMessage('DÃª um nome para a campanha.')
      return
    }

    if (!message) {
      setLastMoveMessage('Digite o conteÃºdo da mensagem da campanha.')
      return
    }

    if (newCampaignChannels.length === 0) {
      setLastMoveMessage('Selecione pelo menos um canal (WhatsApp ou Email).')
      return
    }

    const list = lists.find((l) => l.id === newCampaignListId) ?? lists[0]
    const listName = list?.name ?? newCampaignListId

    try {
      if (editingCampaignId) {
        // Atualiza campanha existente no backend
        const data = await apiFetch(`/api/campaigns/${editingCampaignId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            status: 'rascunho',
            channels: newCampaignChannels,
            list_name: listName,
            message,
            interval_min_seconds: sendIntervalMinSeconds,
            interval_max_seconds: sendIntervalMaxSeconds,
          })
        })

        const createdAtStr = data.created_at
          ? new Date(data.created_at).toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
          : ''

        const updated: Campaign = {
          id: data.id,
          name: data.name ?? '',
          status: (data.status as Campaign['status']) ?? 'rascunho',
          channels: Array.isArray(data.channels)
            ? (data.channels as CampaignChannel[])
            : [...newCampaignChannels],
          listName: data.list_name ?? listName,
          createdAt: createdAtStr,
          message: data.message ?? '',
          intervalMinSeconds: typeof data.interval_min_seconds === 'number' ? data.interval_min_seconds : sendIntervalMinSeconds,
          intervalMaxSeconds: typeof data.interval_max_seconds === 'number' ? data.interval_max_seconds : sendIntervalMaxSeconds,
        }

        setCampaigns((prev) => prev.map((c) => (c.id === editingCampaignId ? updated : c)))
        setEditingCampaignId(null)
        setLastMoveMessage('Campanha atualizada com sucesso.')
      } else {
        // Cria nova campanha no backend
        const data = await apiFetch('/api/campaigns', {
          method: 'POST',
          body: JSON.stringify({
            name,
            status: 'rascunho',
            channels: newCampaignChannels,
            list_name: listName,
            message,
            interval_min_seconds: sendIntervalMinSeconds,
            interval_max_seconds: sendIntervalMaxSeconds,
          })
        })

        const createdAtStr = data.created_at
          ? new Date(data.created_at).toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
          : ''

        const campaign: Campaign = {
          id: data.id,
          name: data.name ?? '',
          status: (data.status as Campaign['status']) ?? 'rascunho',
          channels: Array.isArray(data.channels)
            ? (data.channels as CampaignChannel[])
            : [...newCampaignChannels],
          listName: data.list_name ?? listName,
          createdAt: createdAtStr,
          message: data.message ?? '',
          intervalMinSeconds: typeof data.interval_min_seconds === 'number' ? data.interval_min_seconds : sendIntervalMinSeconds,
          intervalMaxSeconds: typeof data.interval_max_seconds === 'number' ? data.interval_max_seconds : sendIntervalMaxSeconds,
        }

        setCampaigns((prev) => [campaign, ...prev])
        setLastMoveMessage('Campanha criada com sucesso.')
      }

      setNewCampaignName('')
      setNewCampaignMessage('')
      setNewCampaignChannels(['whatsapp'])
      setCampaignEditorOpen(false)
    } catch (e) {
      console.error('Erro inesperado ao salvar campanha no Supabase', e)
      setLastMoveMessage('Erro inesperado ao salvar a campanha no banco.')
    }
  }

  const handleStartEditCampaign = (camp: Campaign) => {
    setEditingCampaignId(camp.id)
    setNewCampaignName(camp.name)
    // tenta achar o id da lista pelo nome; se nÃ£o achar, mantÃ©m o atual
    const listByName = lists.find((l) => l.name === camp.listName)
    setNewCampaignListId(listByName?.id ?? newCampaignListId)
    setNewCampaignChannels(camp.channels)
    setNewCampaignMessage(camp.message)
    // Intervalo especÃ­fico da campanha (fallback 30/90)
    setSendIntervalMinSeconds(camp.intervalMinSeconds ?? 30)
    setSendIntervalMaxSeconds(camp.intervalMaxSeconds ?? 90)
    const input = document.getElementById('new-campaign-name') as HTMLInputElement | null
    input?.focus()
    setCampaignEditorOpen(true)
  }

  const handleDuplicateCampaign = (camp: Campaign) => {
    const copyName = `${camp.name} (cópia)`
    setEditingCampaignId(null)
    setNewCampaignName(copyName)
    const listByName = lists.find((l) => l.name === camp.listName)
    setNewCampaignListId(listByName?.id ?? newCampaignListId)
    setNewCampaignChannels(camp.channels)
    setNewCampaignMessage(camp.message)
    const input = document.getElementById('new-campaign-name') as HTMLInputElement | null
    input?.focus()
    setCampaignEditorOpen(true)
  }

  const handleCancelEditCampaign = () => {
    setEditingCampaignId(null)
    setNewCampaignName('')
    setNewCampaignMessage('')
    setNewCampaignChannels(['whatsapp'])
    setCampaignEditorOpen(false)
  }

  const handleDeleteCampaign = (id: string) => {
    setDeleteCampaignId(id)
  }

  const _handleConfirmDeleteCampaign = async (id: string) => {
    if (!effectiveUserId) {
      setLastMoveMessage('Ã‰ necessÃ¡rio estar logado para excluir campanhas.')
      return
    }

    try {
      await apiFetch(`/api/campaigns/${id}`, {
        method: 'DELETE'
      })

      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      if (editingCampaignId === id) {
        setEditingCampaignId(null)
        setLastMoveMessage('')
        setNewCampaignName('')
        setNewCampaignMessage('')
      }
      setDeleteCampaignId(null)
      setLastMoveMessage('Campanha excluÃ­da com sucesso.')
    } catch (e) {
      console.error('Erro inesperado ao excluir campanha:', e)
      setLastMoveMessage('Erro inesperado ao excluir a campanha.')
    }
  }

  const handleRequestSendCampaignToN8n = async (camp: Campaign) => {
    if (!currentUser) {
      setLastMoveMessage('Ã‰ necessÃ¡rio estar logado para enviar campanhas.')
      return
    }

    const campListNameLower = camp.listName.toLowerCase()
    const list =
      lists.find((l) => l.name === camp.listName) ||
      lists.find((l) => l.name.toLowerCase() === campListNameLower) ||
      lists[0]
    const listId = list?.id ?? 'default'

    let contactsForList = contactsByList[listId] ?? []

    if (contactsForList.length === 0) {
      try {
        const data = await apiFetch(`/api/contacts?listId=${listId}`)

        const mapped: Contact[] = (data ?? []).map((row: any, index: number) => ({
          id: index + 1,
          supabaseId: row.id.toString(),
          name: row.name ?? '',
          phone: row.phone ?? '',
          category: row.category ?? '',
          cep: row.cep ?? '',
          rating: row.rating ?? '',
          email: row.email ?? '',
          address: row.address ?? undefined,
          city: row.city ?? undefined,
        }))

        contactsForList = mapped
        setContactsByList((prev) => ({
          ...prev,
          [listId]: mapped,
        }))
      } catch (e) {
        console.error('Erro inesperado ao carregar contatos ao preparar disparo da campanha', e)
      }
    }

    setSendConfirmCampaignId(camp.id)
  }

  // Calcula quantos contatos ainda nÃ£o receberam a campanha
  const getPendingContacts = (camp: Campaign) => {
    const campListNameLower = camp.listName.toLowerCase()
    const list =
      lists.find((l) => l.name === camp.listName) ||
      lists.find((l) => l.name.toLowerCase() === campListNameLower) ||
      lists[0]
    const listId = list?.id ?? 'default'

    const contactsForList = contactsByList[listId] ?? []

    const effectiveChannels: CampaignChannel[] = camp.channels.filter((ch) =>
      ch === 'whatsapp' ? !!effectiveWebhookWhatsapp.trim() : !!effectiveWebhookEmail.trim(),
    )

    // Filtra contatos que ainda nÃ£o receberam em TODOS os canais configurados
    const pendingContacts = contactsForList.filter((contact) => {
      const phoneKey = normalizePhone(contact.phone)

      for (const channel of effectiveChannels) {
        // Verifica se o contato tem o dado necessÃ¡rio para o canal
        if (channel === 'whatsapp' && !phoneKey) continue
        if (channel === 'email' && !(contact.email ?? '').trim()) continue

        // Verifica se jÃ¡ foi enviado para este contato/canal/campanha
        const alreadySent = contactSendHistory.some(
          (h) => h.campaignId === camp.id && h.phoneKey === phoneKey && h.channel === channel && h.ok
        )

        if (!alreadySent) return true // Ainda tem canal pendente
      }
      return false // Todos os canais jÃ¡ foram enviados com sucesso
    })

    return { pendingContacts, contactsForList, effectiveChannels, list, listId }
  }

  const handleContinueCampaign = async (camp: Campaign) => {
    const { pendingContacts, effectiveChannels, list, listId } = getPendingContacts(camp)

    if (pendingContacts.length === 0) {
      setLastMoveMessage('Todos os contatos já receberam esta campanha para os canais configurados.')
      return
    }

    if (sendingCampaignId && sendingCampaignId !== camp.id) {
      setLastMoveMessage('JÃ¡ existe uma campanha sendo enviada. Aguarde finalizar para iniciar outra.')
      return
    }

    if (effectiveChannels.length === 0) {
      setLastMoveMessage(
        'Nenhum webhook (global ou pessoal) está configurado para os canais desta campanha. Ajuste em Configurações ou em Meu perfil.',
      )
      return
    }

    setSendingCampaignId(camp.id)
    setSendingCurrentIndex(0)
    setSendingTotal(pendingContacts.length)
    setSendingErrors(0)

    let errorCount = 0
    let _lastBackendStatus = 0
    let _lastBackendOk: boolean | null = null

    for (let i = 0; i < pendingContacts.length; i++) {
      const contact = pendingContacts[i]
      const contactIndex = i + 1
      setSendingCurrentIndex(contactIndex)

      const messageHtmlRaw = camp.message || ''
      const messageHtml = messageHtmlRaw.trim().startsWith('<')
        ? messageHtmlRaw
        : `<p style="margin:0; font-size:14px; line-height:1.5; color:#111827;">${messageHtmlRaw
          .split('\n')
          .map((line) => (line.trim().length === 0 ? '&nbsp;' : line))
          .join('<br />')}</p>`

      const messageText = htmlToText(messageHtml)
      const phoneKey = normalizePhone(contact.phone)

      const sendPromises = effectiveChannels.map(async (channel) => {
        // Verifica se jÃ¡ foi enviado com sucesso para este canal
        const alreadySent = contactSendHistory.some(
          (h) => h.campaignId === camp.id && h.phoneKey === phoneKey && h.channel === channel && h.ok
        )
        if (alreadySent) return // Pula se jÃ¡ enviou

        if (channel === 'whatsapp' && !phoneKey) return
        if (channel === 'email' && !(contact.email ?? '').trim()) return

        const targetWebhookUrl =
          channel === 'whatsapp' ? effectiveWebhookWhatsapp.trim() : effectiveWebhookEmail.trim()
        const isEmailChannel = channel === 'email'

        const payload = {
          meta: {
            source: 'sendmessage',
            trigger: 'campaign_continue',
            campaignId: camp.id,
            campaignName: camp.name,
            listId,
            listName: list.name,
            channels: [channel],
            createdAt: camp.createdAt,
            contactIndex,
            totalContacts: pendingContacts.length,
          },
          message: isEmailChannel ? messageHtml : htmlToWhatsapp(messageHtml),
          messageText,
          messageHtml,
          contacts: [
            {
              id: contact.id,
              name: contact.name,
              phone: normalizePhone(contact.phone),
              email: contact.email,
              category: contact.category,
              rating: Number(formatRating(contact.rating) || 0),
              cep: contact.cep,
            },
          ],
        }

        try {
          const response = await fetch(`${BACKEND_URL}/api/n8n/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ webhookUrl: targetWebhookUrl, ...payload }),
          })

          const result = await response.json().catch(() => null as any)
          const { backendOk, backendStatus, webhookOk } = parseBackendResult(result, response)

          _lastBackendOk = backendOk
          _lastBackendStatus = backendStatus

          setContactSendHistory((prev) => {
            if (!phoneKey) return prev

            let providerStatus: string | undefined
            let errorDetail: string | undefined
            let payloadRaw: string | undefined

            try {
              payloadRaw = JSON.stringify(result, null, 2)
            } catch { }

            if (Array.isArray(result) && result.length > 0) {
              const item = result[0] as any
              const dataStatus = item.resultado?.data?.status
              if (typeof dataStatus === 'string') {
                providerStatus = dataStatus
              }

              if (!backendOk) {
                if (typeof item.detalhes === 'string') {
                  errorDetail = item.detalhes
                } else if (item.detalhes != null) {
                  try {
                    errorDetail = JSON.stringify(item.detalhes)
                  } catch { }
                }
              }
            }

            const entry: ContactSendHistoryItem = {
              id: `${camp.id}-${contact.id}-${Date.now()}-${channel}`,
              contactId: contact.id,
              contactName: contact.name,
              phoneKey,
              campaignId: camp.id,
              campaignName: camp.name,
              channel,
              status: backendStatus,
              ok: backendOk,
              runAt: new Date().toLocaleString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }),
              webhookOk,
              providerStatus,
              errorDetail,
              payloadRaw,
            }
            const next = [entry, ...prev]
            return next.slice(0, 1000)
          })

          // Salva no backend
          saveSendHistory({
            campaignId: camp.id,
            contactName: contact.name,
            phoneKey: phoneKey,
            channel,
            ok: backendOk,
            status: backendStatus,
            webhookOk,
          })

          if (!backendOk) {
            errorCount++
            setSendingErrors((prev) => prev + 1)
          }
        } catch (err) {
          errorCount++
          setSendingErrors((prev) => prev + 1)
        }
      })

      await Promise.all(sendPromises)

      if (i < pendingContacts.length - 1) {
        const minSeconds = Math.max(0, camp.intervalMinSeconds ?? 30)
        const maxSeconds = Math.max(minSeconds, camp.intervalMaxSeconds ?? 90)
        const delaySeconds = minSeconds + Math.random() * (maxSeconds - minSeconds)
        const rounded = Math.max(1, Math.round(delaySeconds))
        setSendingNextDelaySeconds(rounded)
        await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
        setSendingNextDelaySeconds(0)
      }
    }

    const _finishedAt = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

    if (errorCount === 0) {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === camp.id ? { ...c, status: 'enviada' } : c)),
      )
      setLastMoveMessage(
        `Continuação da campanha "${camp.name}" finalizada com sucesso para ${pendingContacts.length} contato(s).`,
      )
    } else {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === camp.id ? { ...c, status: 'enviada_com_erros' } : c)),
      )
      setLastMoveMessage(
        `Continuação da campanha "${camp.name}" finalizada com ${errorCount} erro(s) em ${pendingContacts.length} contato(s).`,
      )
    }

    setSendingNextDelaySeconds(null)
    setSendingCampaignId(null)

    // Recarrega histÃ³rico do Supabase para refletir exatamente os envios persistidos
    await reloadContactSendHistory()
  }

  const handleSendCampaignToN8n = async (camp: Campaign) => {
    if (!currentUser) {
      setLastMoveMessage('Ã‰ necessÃ¡rio estar logado para enviar campanhas.')
      return
    }

    if (sendingCampaignId && sendingCampaignId !== camp.id) {
      setLastMoveMessage('JÃ¡ existe uma campanha sendo enviada. Aguarde finalizar para iniciar outra.')
      return
    }

    const campListNameLower = camp.listName.toLowerCase()
    const list =
      lists.find((l) => l.name === camp.listName) ||
      lists.find((l) => l.name.toLowerCase() === campListNameLower) ||
      lists[0]
    const listId = list?.id ?? 'default'
    const contactsForList = contactsByList[listId] ?? []

    if (contactsForList.length === 0) {
      setLastMoveMessage('Esta lista nÃ£o possui contatos para enviar.')
      return
    }

    const effectiveChannels: CampaignChannel[] = camp.channels.filter((ch) =>
      ch === 'whatsapp' ? !!effectiveWebhookWhatsapp.trim() : !!effectiveWebhookEmail.trim(),
    )

    if (effectiveChannels.length === 0) {
      setLastMoveMessage(
        'Nenhum webhook (global ou pessoal) está configurado para os canais desta campanha. Ajuste em Configurações ou em Meu perfil.',
      )
      return
    }

    setSendingCampaignId(camp.id)
    setSendingCurrentIndex(0)
    setSendingTotal(contactsForList.length)
    setSendingErrors(0)

    console.log('[DEBUG] Iniciando disparo de campanha:', {
      campaignName: camp.name,
      listName: list.name,
      totalContacts: contactsForList.length,
      effectiveChannels,
      effectiveWebhookWhatsapp,
      effectiveWebhookEmail,
      userWebhookWhatsapp,
      userWebhookEmail,
      globalWebhookWhatsapp,
      globalWebhookEmail,
    })

    let errorCount = 0
    let _lastBackendStatus2 = 0
    let _lastBackendOk2: boolean | null = null

    for (let i = 0; i < contactsForList.length; i++) {
      const contact = contactsForList[i]
      const contactIndex = i + 1
      setSendingCurrentIndex(contactIndex)

      const messageHtmlRaw = camp.message || ''
      const messageHtml = messageHtmlRaw.trim().startsWith('<')
        ? messageHtmlRaw
        : `<p style="margin:0; font-size:14px; line-height:1.5; color:#111827;">${messageHtmlRaw
          .split('\n')
          .map((line) => (line.trim().length === 0 ? '&nbsp;' : line))
          .join('<br />')}</p>`

      const messageText = htmlToText(messageHtml)

      const sendPromises = effectiveChannels.map(async (channel) => {
        // sÃ³ envia para canais que o contato realmente possui dado
        if (channel === 'whatsapp') {
          const phone = normalizePhone(contact.phone)
          if (!phone) return
        }

        if (channel === 'email') {
          const email = (contact.email ?? '').trim()
          if (!email) return
        }

        const targetWebhookUrl =
          channel === 'whatsapp' ? effectiveWebhookWhatsapp.trim() : effectiveWebhookEmail.trim()
        const isEmailChannel = channel === 'email'

        const payload = {
          meta: {
            source: 'sendmessage',
            trigger: 'campaign',
            campaignId: camp.id,
            campaignName: camp.name,
            listId,
            listName: list.name,
            channels: [channel],
            createdAt: camp.createdAt,
            contactIndex,
            totalContacts: contactsForList.length,
          },
          // Para email, message vai em HTML; para WhatsApp, em formato compatÃ­vel com o WhatsApp
          message: isEmailChannel ? messageHtml : htmlToWhatsapp(messageHtml),
          messageText,
          messageHtml,
          contacts: [
            {
              id: contact.id,
              name: contact.name,
              phone: normalizePhone(contact.phone),
              email: contact.email,
              category: contact.category,
              rating: Number(formatRating(contact.rating) || 0),
              cep: contact.cep,
            },
          ],
        }

        try {
          console.log('[DEBUG] Enviando para backend:', {
            backendUrl: BACKEND_URL,
            endpoint: '/api/n8n/trigger',
            fullUrl: `${BACKEND_URL}/api/n8n/trigger`,
            targetWebhookUrl,
            channel,
            contactName: contact.name,
            contactPhone: contact.phone,
          })

          const response = await fetch(`${BACKEND_URL}/api/n8n/trigger`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ webhookUrl: targetWebhookUrl, ...payload }),
          })

          console.log('[DEBUG] Resposta do backend:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
          })

          const result = await response.json().catch(() => null as any)

          console.log('[DEBUG] Resultado parseado:', result)

          const { backendOk, backendStatus, webhookOk } = parseBackendResult(result, response)

          _lastBackendOk2 = backendOk
          _lastBackendStatus2 = backendStatus

          // Extrai informaÃ§Ãµes detalhadas do resultado
          let providerStatus: string | undefined
          let errorDetail: string | undefined
          let payloadRaw: string | undefined

          try {
            payloadRaw = JSON.stringify(result, null, 2)
          } catch { }

          if (Array.isArray(result) && result.length > 0) {
            const item = result[0] as any
            const dataStatus = item.resultado?.data?.status
            if (typeof dataStatus === 'string') {
              providerStatus = dataStatus
            }

            if (!backendOk) {
              if (typeof item.detalhes === 'string') {
                errorDetail = item.detalhes
              } else if (item.detalhes != null) {
                try {
                  errorDetail = JSON.stringify(item.detalhes)
                } catch { }
              }
            }
          }

          // registra histórico por contato/canal
          setContactSendHistory((prev) => {
            const phoneKey = normalizePhone(contact.phone)
            if (!phoneKey) return prev

            const entry: ContactSendHistoryItem = {
              id: `${camp.id}-${contact.id}-${Date.now()}-${channel}`,
              contactId: contact.id,
              contactName: contact.name,
              phoneKey,
              campaignId: camp.id,
              campaignName: camp.name,
              channel,
              status: backendStatus,
              ok: backendOk,
              runAt: new Date().toLocaleString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }),
              webhookOk,
              providerStatus,
              errorDetail,
              payloadRaw,
            }
            const next = [entry, ...prev]
            return next.slice(0, 1000)
          })

          // Salva no backend
          const phoneKeyForDb = normalizePhone(contact.phone)
          if (phoneKeyForDb) {
            saveSendHistory({
              campaignId: camp.id,
              contactName: contact.name,
              phoneKey: phoneKeyForDb,
              channel,
              ok: backendOk,
              status: backendStatus,
              webhookOk,
            })
          }

          if (!backendOk) {
            console.error(
              'Erro ao enviar contato da campanha para n8n:',
              { status: backendStatus, result },
            )
            errorCount += 1
            setSendingErrors((prev) => prev + 1)
          }
        } catch (error) {
          console.error('Erro de rede ao enviar contato da campanha para n8n:', error)
          errorCount += 1
          setSendingErrors((prev) => prev + 1)
        }
      })

      // envia canais em paralelo para este contato
      await Promise.all(sendPromises)

      // intervalo entre contatos (independente da quantidade de canais), especÃ­fico por campanha
      if (i < contactsForList.length - 1) {
        const minSeconds = Math.max(0, camp.intervalMinSeconds ?? 30)
        const maxSeconds = Math.max(minSeconds, camp.intervalMaxSeconds ?? 90)
        const delaySeconds = minSeconds + Math.random() * (maxSeconds - minSeconds)
        const rounded = Math.max(1, Math.round(delaySeconds))
        setSendingNextDelaySeconds(rounded)
        const delayMs = delaySeconds * 1000
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        setSendingNextDelaySeconds(0)
      }
    }

    const finishedAt = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

    setCampaignSendLog((prev) => ({
      ...prev,
      [camp.id]: {
        lastStatus: _lastBackendStatus2,
        lastOk: _lastBackendOk2 ?? errorCount === 0,
        lastErrorCount: errorCount,
        lastTotal: contactsForList.length,
        lastRunAt: finishedAt,
      },
    }))

    setSendHistory((prev) => {
      const entry: SendHistoryItem = {
        id: `${camp.id}-${Date.now()}`,
        campaignId: camp.id,
        campaignName: camp.name,
        status: _lastBackendStatus2,
        ok: (_lastBackendOk2 ?? errorCount === 0) === true,
        total: contactsForList.length,
        errorCount,
        runAt: finishedAt,
      }
      const next = [entry, ...prev]
      return next.slice(0, 50)
    })

    // Grava histÃ³rico agregado do disparo no backend
    try {
      await apiFetch('/api/campaigns/history', {
        method: 'POST',
        body: JSON.stringify({
          campaign_id: camp.id,
          status: _lastBackendStatus2,
          ok: (_lastBackendOk2 ?? errorCount === 0) === true,
          total: contactsForList.length,
          error_count: errorCount,
          run_at: new Date().toISOString(),
        })
      })
    } catch (e) {
      console.error('Erro ao gravar histÃ³rico agregado no backend', e)
    }

    // Envia notificaÃ§Ã£o de conclusÃ£o da lista
    const notificationWebhook = webhookUrlWhatsApp.trim()
    if (notificationWebhook) {
      const notificationMessage = `Claudio, Campanha "${camp.name}" para a lista "${list.name}" concluída com sucesso. Total: ${contactsForList.length} contato(s), Erros: ${errorCount}.`
      const notificationPayload = {
        webhookUrl: notificationWebhook,
        meta: {
          source: 'sendmessage',
          trigger: 'campaign_completed',
          campaignId: camp.id,
          campaignName: camp.name,
          listId,
          listName: list.name,
          channels: effectiveChannels,
          createdAt: camp.createdAt,
          totalContacts: contactsForList.length,
          errorCount,
          finishedAt,
        },
        message: notificationMessage,
        messageText: notificationMessage,
        messageHtml: (
          <>
            <p>
              <strong>Olá Claudio!</strong>
            </p>
            <p>
              Campanha "{camp.name}" para a lista "{list.name}" concluída!
            </p>
            <p>
              Total: {contactsForList.length} contato(s), Erros: {errorCount}.
            </p>
          </>
        ),
        contacts: [
          {
            id: 1,
            name: 'Claudio',
            phone: '11944639704',
            email: 'claudiosorriso7@gmail.com',
            category: 'NotificaÃ§Ã£o',
            rating: 5,
            cep: '',
          },
        ],
      }
      try {
        await fetch(`${BACKEND_URL}/api/n8n/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationPayload),
        })
      } catch (e) {
        console.error('Erro ao enviar notificaÃ§Ã£o de conclusÃ£o:', e)
      }
    }

    if (errorCount === 0) {
      // Marca a campanha como "enviada" em caso de sucesso total
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === camp.id
            ? {
              ...c,
              status: 'enviada',
            }
            : c,
        ),
      )
      setLastMoveMessage(
        `Campanha "${camp.name}" disparada com sucesso para ${contactsForList.length} contato(s).`,
      )
    } else if (errorCount < contactsForList.length) {
      // Sucesso parcial: alguns contatos com erro
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === camp.id
            ? {
              ...c,
              status: 'enviada_com_erros',
            }
            : c,
        ),
      )
      setLastMoveMessage(
        `Campanha "${camp.name}" disparada com falhas em ${errorCount} de ${contactsForList.length} contato(s).`,
      )
    } else {
      setLastMoveMessage(
        `Não foi possível disparar a campanha. Todos os ${contactsForList.length} disparos retornaram erro.`,
      )
    }

    setSendingNextDelaySeconds(null)
    setSendingCampaignId(null)
  }

  const contacts = contactsByList[currentListId] ?? []

  // Listas ordenadas alfabeticamente para exibiÃ§Ã£o
  const sortedLists = [...lists].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))

  const filteredContacts = contacts.filter((contact) => {
    const name = (contact.name ?? '').toString()
    const phone = (contact.phone ?? '').toString()
    const category = (contact.category ?? '').toString()
    const email = (contact.email ?? '').toString()
    const city = (contact.city ?? '').toString()
    const ratingRaw = (contact.rating ?? '').toString()

    const matchesName = name.toLowerCase().includes(searchName.toLowerCase())

    const normalizedPhone = phone.toLowerCase()
    const matchesPhone = normalizedPhone.includes(searchPhone.toLowerCase())

    const matchesCategory =
      filterCategory === 'Todas' || category.toLowerCase() === filterCategory.toLowerCase()

    const matchesEmail = email.toLowerCase().includes(searchEmail.toLowerCase())

    const matchesCity = filterCity
      ? city.toLowerCase().includes(filterCity.toLowerCase())
      : true

    const ratingValue = formatRating(ratingRaw)
    const matchesRating = filterRating ? ratingValue.startsWith(filterRating) : true

    return (
      matchesName &&
      matchesPhone &&
      matchesCategory &&
      matchesEmail &&
      matchesCity &&
      matchesRating
    )
  })

  useEffect(() => {
    try {
      localStorage.setItem('sendmessage_campaigns', JSON.stringify(campaigns))
    } catch {
      // ignore
    }
  }, [campaigns])

  useEffect(() => {
    try {
      localStorage.setItem('sendmessage_webhookUrl_whatsapp', webhookUrlWhatsApp)
    } catch {
      // ignore
    }
  }, [webhookUrlWhatsApp])

  useEffect(() => {
    try {
      localStorage.setItem('sendmessage_webhookUrl_email', webhookUrlEmail)
    } catch {
      // ignore
    }
  }, [webhookUrlEmail])

  // Normaliza contatos existentes na inicializaÃ§Ã£o:
  // - Remove duplicados por telefone normalizado em cada lista (mantÃ©m o primeiro)
  // - Move contatos sem telefone e sem email para a lista especial 'sem-contatos'
  // - Renumera IDs sequencialmente por lista
  useEffect(() => {
    if (idsNormalized) return

    setContactsByList((prev) => {
      const next: Record<string, Contact[]> = {}

      const semContatosId = 'sem-contatos'
      const existingSemContatos = prev[semContatosId] ?? []
      const collectedSemContatos: Contact[] = [...existingSemContatos]

      Object.entries(prev).forEach(([listId, listContacts]) => {
        if (listId === semContatosId) {
          // vai ser tratado via collectedSemContatos
          return
        }

        const seenByPhone = new Map<string, boolean>()
        const keptInList: Contact[] = []

        listContacts.forEach((c) => {
          const hasPhone = normalizePhone(c.phone).length > 0
          const emailValue = (c.email ?? '').toString()
          const hasEmail = emailValue.trim().length > 0

          if (!hasPhone && !hasEmail) {
            collectedSemContatos.push(c)
            return
          }

          const key = normalizePhone(c.phone)
          if (key && seenByPhone.has(key)) {
            return
          }
          if (key) {
            seenByPhone.set(key, true)
          }
          keptInList.push(c)
        })

        let counter = 1
        const renumbered = keptInList.map((c) => ({
          ...c,
          id: counter++,
        }))

        next[listId] = renumbered
      })

      // Renumera tambÃ©m a lista 'sem-contatos'
      if (collectedSemContatos.length > 0) {
        let counter = 1
        next[semContatosId] = collectedSemContatos.map((c) => ({
          ...c,
          id: counter++,
        }))
      }

      return next
    })

    setIdsNormalized(true)
  }, [idsNormalized])

  // Esconde automaticamente o toast de movimentaÃ§Ã£o apÃ³s alguns segundos
  useEffect(() => {
    if (!lastMoveMessage) return
    const timeout = setTimeout(() => {
      setLastMoveMessage('')
    }, 3500)
    return () => clearTimeout(timeout)
  }, [lastMoveMessage])

  const handleClearFilters = () => {
    setSearchName('')
    setSearchPhone('')
    setFilterCategory('Todas')
    setSearchEmail('')
    setFilterCity('')
    setFilterRating('')
  }

  const handleCsvUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text !== 'string') return

      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
      if (lines.length <= 1) return

      const [, ...rows] = lines

      // Garante IDs Ãºnicos por lista: comeÃ§a apÃ³s o maior ID existente na lista atual
      const existing = contactsByList[currentListId] ?? []
      const maxExistingId = existing.reduce((max, c) => (c.id > max ? c.id : max), 0)
      const baseId = maxExistingId + 1

      const parsed: Contact[] = rows
        .map((line, index) => {
          const cols = line.split(';')
          if (cols.length === 0) return null

          const name = cols[0]?.trim() ?? ''
          const phoneRaw = cols[1]?.trim() ?? ''
          const category = cols[4]?.trim() ?? ''
          const cep = cols[11]?.trim() ?? ''
          const rating = cols[3]?.trim() ?? ''
          const email = cols[7]?.trim() ?? ''

          if (!name && !phoneRaw) return null

          return {
            id: baseId + index,
            name,
            phone: phoneRaw,
            category,
            cep,
            rating,
            email,
          }
        })
        .filter((c): c is Contact => c !== null)

      const existingByPhone = new Map(existing.map((c) => [normalizePhone(c.phone), c]))

      const newContacts: Contact[] = []
      const conflicts: ImportConflict[] = []

      parsed.forEach((incoming, idx) => {
        const key = normalizePhone(incoming.phone)
        if (!key) {
          newContacts.push(incoming)
          return
        }

        const already = existingByPhone.get(key)
        if (!already) {
          newContacts.push(incoming)
          return
        }

        const sameName = already.name === incoming.name
        const sameCategory = already.category === incoming.category
        const sameCep = already.cep === incoming.cep
        const sameRating = formatRating(already.rating) === formatRating(incoming.rating)

        // Se todas as informaÃ§Ãµes relevantes forem idÃªnticas, ignorar esse registro
        if (sameName && sameCategory && sameCep && sameRating) {
          return
        }

        conflicts.push({
          id: `${key}-${idx}`,
          existing: already,
          incoming,
          resolution: 'file',
        })
      })

      setImportNewContacts(newContacts)
      setImportConflicts(conflicts)
    }

    reader.readAsText(file, 'utf-8')
  }

  const handleDeleteContact = async (id: number) => {
    if (!effectiveUserId || !currentListId) {
      setLastMoveMessage('Ã‰ necessÃ¡rio estar logado e com uma lista selecionada para excluir contatos.')
      return
    }

    const current = contactsByList[currentListId] ?? []
    const existing = current.find((c) => c.id === id)
    const supabaseId = existing?.supabaseId // No backend esse é o ID (uuid ou serial)

    if (!supabaseId) {
      setLastMoveMessage('NÃ£o foi possÃ­vel identificar o contato no banco para exclusÃ£o.')
      return
    }

    try {
      await apiFetch(`/api/contacts/${supabaseId}`, {
        method: 'DELETE'
      })

      setContactsByList((prev) => ({
        ...prev,
        [currentListId]: current.filter((c) => c.id !== id),
      }))
      setLastMoveMessage('Contato excluÃ­do com sucesso.')
    } catch (e) {
      console.error('Erro inesperado ao excluir contato:', e)
      setLastMoveMessage('Erro inesperado ao excluir o contato.')
    }
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContactId(contact.id)
    setContactFormName(contact.name ?? '')
    setContactFormPhone(normalizePhone(contact.phone ?? ''))
    setContactFormCategory(contact.category ?? '')
    setContactFormEmail(contact.email ?? '')
    setContactFormCep(contact.cep ?? '')
    setContactFormAddress(contact.address ?? '')
    setContactFormCity(contact.city ?? '')
    setContactFormRating(contact.rating != null ? String(contact.rating) : '')
    setShowContactForm(true)
  }

  const handleCreateContactManual = () => {
    // Limpa o formulÃ¡rio para criaÃ§Ã£o de um novo contato
    setEditingContactId(null)
    setContactFormName('')
    setContactFormPhone('')
    setContactFormCategory('')
    setContactFormEmail('')
    setContactFormCep('')
    setContactFormAddress('')
    setContactFormCity('')
    setContactFormRating('')
    setShowContactForm(true)
  }

  const handleBackfillAddressFromCep = async () => {
    if (isBackfillingAddress) return

    // Monta lista de contatos com CEP preenchido e endereÃ§o vazio
    const tasks: { listId: string; contactId: number; cep: string }[] = []
    Object.entries(contactsByList).forEach(([listId, contacts]) => {
      contacts.forEach((c) => {
        const hasCep = (c.cep ?? '').trim().length > 0
        const hasAddress = (c.address ?? '').trim().length > 0
        if (hasCep && !hasAddress) {
          tasks.push({ listId, contactId: c.id, cep: c.cep })
        }
      })
    })

    if (tasks.length === 0) {
      setLastMoveMessage('Nenhum contato com CEP preenchido e endereÃ§o vazio foi encontrado.')
      return
    }

    setIsBackfillingAddress(true)
    setBackfillProcessed(0)
    setBackfillTotal(tasks.length)
    setLastMoveMessage(`IA completando endereços por CEP... 0/${tasks.length}`)

    let updatedCount = 0
    let errorCount = 0

    try {
      for (let i = 0; i < tasks.length; i++) {
        const { listId, contactId, cep } = tasks[i]

        try {
          const resp = await fetch(`${BACKEND_URL}/api/ai/address-from-cep`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cep }),
          })

          const data = await resp.json().catch(() => null as any)

          if (resp.ok && data && data.ok) {
            const address = (data.address ?? '').trim()
            const city = (data.city ?? '').trim()

            if (address || city) {
              updatedCount++
              setContactsByList((prev) => {
                const listContacts = prev[listId] ?? []
                const nextContacts = listContacts.map((c) =>
                  c.id === contactId
                    ? {
                      ...c,
                      address: address || c.address || '',
                      city: city || c.city || '',
                    }
                    : c,
                )
                return { ...prev, [listId]: nextContacts }
              })
            }
          } else {
            errorCount++
          }
        } catch (err) {
          errorCount++
        }

        const processed = i + 1
        setBackfillProcessed(processed)
        setLastMoveMessage(`IA completando endereços por CEP... ${processed}/${tasks.length}`)
      }

      if (updatedCount === 0) {
        setLastMoveMessage(
          `IA concluiu a análise de ${tasks.length} contato(s) com CEP, mas não conseguiu completar nenhum endereço.`,
        )
      } else {
        const msgErrors = errorCount > 0 ? ` com ${errorCount} erro(s)` : ''
        setLastMoveMessage(
          `IA completou endereços para ${updatedCount} de ${tasks.length} contato(s)${msgErrors}. Revise os dados antes de enviar campanhas.`,
        )
      }
    } finally {
      setIsBackfillingAddress(false)
      setBackfillTotal(0)
      setBackfillProcessed(0)
    }
  }

  // Handler para extrair contato de imagem usando IA
  const handleAiExtractContact = async (file: File) => {
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target?.result
        if (!base64 || typeof base64 !== 'string') return

        if (!geminiApiKey) {
          setLastMoveMessage('Informe a Gemini API Key na tela de ConfiguraÃ§Ãµes antes de usar a IA.')
          return
        }

        setIsExtracting(true)
        try {
          const resp = await fetch(`${BACKEND_URL}/api/ai/extract-contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, geminiApiKey: effectiveAiKey }),
          })
          const data = await resp.json()
          if (!resp.ok || !data?.ok) {
            console.error('Falha IA:', data)
            setLastMoveMessage('Falha ao extrair dados com IA. Verifique a chave e tente novamente.')
            return
          }

          const c = data.contact || {}

          // Garante existência da lista "IA"
          setLists((prev) => {
            const exists = prev.some((l) => l.id === 'ia')
            if (exists) return prev
            return [...prev, { id: 'ia', name: 'IA' }]
          })
          setContactsByList((prev) => {
            const currentIa = prev['ia'] ?? []
            return {
              ...prev,
              ia: currentIa,
            }
          })
          setCurrentListId('ia')

          setEditingContactId(null)
          setContactFormName(c.name || '')
          setContactFormPhone(c.phone || '')
          setContactFormEmail(c.email || '')
          setContactFormCategory(c.category || 'IA')
          setContactFormCep('')
          setContactFormAddress(c.address || '')
          setContactFormCity(c.city || '')
          setContactFormRating('')
          setShowContactForm(true)

          // Se estiver na página de extração, muda para contatos para ver o resultado
          if (currentPage === 'extract') {
            setCurrentPage('contacts')
          }

          const el = document.getElementById('contact-form-section')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }

          setLastMoveMessage('Dados extraídos pela IA. Revise e salve o contato na lista "IA".')
        } catch (err) {
          console.error('Erro ao chamar IA:', err)
          setLastMoveMessage('Erro inesperado ao chamar IA. Tente novamente.')
        } finally {
          setIsExtracting(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Erro ao ler arquivo:', err)
      setLastMoveMessage('Erro ao ler arquivo de imagem.')
    }
  }

  const handleCancelContactForm = () => {
    setEditingContactId(null)
    setContactFormName('')
    setContactFormPhone('')
    setContactFormCategory('')
    setContactFormEmail('')
    setContactFormCep('')
    setContactFormAddress('')
    setContactFormCity('')
    setContactFormRating('')
    setShowContactForm(false)
  }

  const handleSaveContactForm = async () => {
    if (!effectiveUserId || !currentListId) {
      setLastMoveMessage('Ã‰ necessÃ¡rio estar logado e com uma lista selecionada para salvar contatos.')
      return
    }

    const name = contactFormName.trim()
    if (!name) {
      setLastMoveMessage('Informe o nome do contato.')
      return
    }

    const phoneDigits = normalizePhone(contactFormPhone)
    if (phoneDigits && phoneDigits.length !== 10 && phoneDigits.length !== 11) {
      setLastMoveMessage('Telefone invÃ¡lido. Use apenas dÃ­gitos no formato 1199999999 ou 11999999999.')
      return
    }
    const current = contactsByList[currentListId] ?? []

    try {
      if (editingContactId != null) {
        // EdiÃ§Ã£o de contato existente
        const existing = current.find((c) => c.id === editingContactId)
        const supabaseId = existing?.supabaseId
        if (!supabaseId) {
          setLastMoveMessage('Não foi possível identificar o contato no banco para edição.')
          return
        }

        const data = await apiFetch(`/api/contacts/${supabaseId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            phone: phoneDigits,
            category: contactFormCategory,
            email: contactFormEmail,
            cep: contactFormCep,
            address: contactFormAddress,
            city: contactFormCity,
            rating: contactFormRating,
          })
        })

        const updatedContact: Contact = {
          id: existing.id,
          supabaseId: data.id.toString(),
          name: data.name ?? '',
          phone: data.phone ?? '',
          category: data.category ?? '',
          email: data.email ?? '',
          cep: data.cep ?? '',
          address: data.address ?? undefined,
          city: data.city ?? undefined,
          rating: data.rating ?? '',
        }

        setContactsByList((prev) => ({
          ...prev,
          [currentListId]: current.map((c) => (c.id === editingContactId ? updatedContact : c)),
        }))
      } else {
        // Criação de novo contato
        const data = await apiFetch('/api/contacts', {
          method: 'POST',
          body: JSON.stringify({
            list_id: currentListId,
            name,
            phone: phoneDigits,
            category: contactFormCategory,
            email: contactFormEmail,
            cep: contactFormCep,
            address: contactFormAddress,
            city: contactFormCity,
            rating: contactFormRating,
          })
        })

        const maxId = current.reduce((max, c) => (c.id > max ? c.id : max), 0)
        const next: Contact = {
          id: maxId + 1,
          supabaseId: data.id.toString(),
          name: data.name ?? '',
          phone: data.phone ?? '',
          category: data.category ?? '',
          email: data.email ?? '',
          cep: data.cep ?? '',
          address: data.address ?? undefined,
          city: data.city ?? undefined,
          rating: data.rating ?? '',
        }
        setContactsByList((prev) => ({
          ...prev,
          [currentListId]: [next, ...current],
        }))
      }

      setLastMoveMessage('Contato salvo com sucesso.')
      setShowContactForm(false)
      setEditingContactId(null)
    } catch (e) {
      console.error('Erro inesperado ao salvar contato:', e)
      setLastMoveMessage('Erro inesperado ao salvar o contato no banco.')
    }
  }

  const handleApplyImport = async () => {
    if (!importNewContacts && !importConflicts) return

    if (!effectiveUserId || !currentListId) {
      setLastMoveMessage('Ã‰ necessÃ¡rio estar logado e com uma lista selecionada para aplicar a importaÃ§Ã£o.')
      return
    }

    const current = contactsByList[currentListId] ?? []
    const byPhone = new Map(current.map((c) => [normalizePhone(c.phone), c]))

    const toInsert: Contact[] = []
    const toUpdate: { supabaseId: string; data: Contact }[] = []

    // Processa conflitos: quando o usuÃ¡rio escolhe "arquivo", atualizamos o contato existente
    if (importConflicts) {
      importConflicts.forEach((conflict) => {
        const key = normalizePhone(conflict.existing.phone || conflict.incoming.phone)
        if (!key) return

        const existing = byPhone.get(key)
        if (!existing || !existing.supabaseId) return

        if (conflict.resolution === 'file') {
          toUpdate.push({ supabaseId: existing.supabaseId, data: conflict.incoming })
        }
        // se resoluÃ§Ã£o for "existing", nÃ£o fazemos nada no banco
      })
    }

    // Novos contatos vindos do arquivo, que nÃ£o colidem com telefones existentes
    if (importNewContacts) {
      importNewContacts.forEach((c) => {
        const key = normalizePhone(c.phone)
        const hasPhone = key.length > 0
        const hasEmail = c.email.trim().length > 0

        // ignorar contatos completamente vazios
        if (!hasPhone && !hasEmail) return

        if (hasPhone && byPhone.has(key)) {
          // jÃ¡ foi tratado como conflito; nÃ£o inserir como novo
          return
        }

        toInsert.push(c)
      })
    }

    try {
      // 1) Atualiza contatos existentes
      for (const item of toUpdate) {
        const { supabaseId, data } = item
        const phoneDigits = normalizePhone(data.phone)
        const ratingNumber = Number(formatRating(data.rating) || 0)

        try {
          await apiFetch(`/api/contacts/${supabaseId}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: data.name ?? '',
              phone: phoneDigits,
              email: (data.email ?? '').trim(),
              category: data.category ?? '',
              cep: data.cep ?? '',
              rating: ratingNumber,
            })
          })
        } catch (e) {
          console.error('Erro ao atualizar contato durante importaÃ§Ã£o', e)
        }
      }

      // 2) Insere novos contatos
      if (toInsert.length > 0) {
        for (const c of toInsert) {
          const phoneDigits = normalizePhone(c.phone)
          const ratingNumber = Number(formatRating(c.rating) || 0)

          try {
            await apiFetch('/api/contacts', {
              method: 'POST',
              body: JSON.stringify({
                list_id: currentListId,
                name: c.name ?? '',
                phone: phoneDigits,
                email: (c.email ?? '').trim(),
                category: c.category ?? '',
                cep: c.cep ?? '',
                rating: ratingNumber,
              })
            })
          } catch (e) {
            console.error('Erro ao inserir contato durante importaÃ§Ã£o', e)
          }
        }
      }

      // 3) Recarrega contatos da lista atual a partir do backend para garantir consistÃªncia
      try {
        const data = await apiFetch(`/api/contacts?listId=${currentListId}`)

        const mapped: Contact[] = (data ?? []).map((row: any, index: number) => ({
          id: index + 1,
          supabaseId: row.id,
          name: row.name ?? '',
          phone: row.phone ?? '',
          category: row.category ?? '',
          email: row.email ?? '',
          cep: row.cep ?? '',
          address: row.address ?? undefined,
          city: row.city ?? undefined,
          rating: row.rating ?? '',
        }))

        setContactsByList((prev) => ({
          ...prev,
          [currentListId]: mapped,
        }))
      } catch (e) {
        console.error('Erro inesperado ao recarregar contatos apÃ³s importaÃ§Ã£o', e)
      }

      setLastMoveMessage('ImportaÃ§Ã£o aplicada e contatos salvos no backend.')
    } catch (e) {
      console.error('Erro inesperado ao aplicar importaÃ§Ã£o de contatos', e)
      setLastMoveMessage('Erro inesperado ao aplicar a importaÃ§Ã£o de contatos.')
    }

    setImportNewContacts(null)
    setImportConflicts(null)
  }

  const handleCancelImport = () => {
    setImportNewContacts(null)
    setImportConflicts(null)
  }

  const handleExportCsv = () => {
    const listContacts = contactsByList[currentListId] ?? []
    if (listContacts.length === 0) return

    const header = 'Nome;NÃºmero de celular;AvaliaÃ§Ã£o;Categoria;Email;CEP'
    const rows = listContacts.map((c) => {
      const safe = (value: string) => value.replace(/;/g, ',')
      return [
        safe(c.name),
        safe(c.phone),
        safe(c.rating),
        safe(c.category),
        safe(c.email),
        safe(c.cep),
      ].join(';')
    })

    const csvContent = [header, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const currentList = lists.find((l) => l.id === currentListId)
    const fileName = `contatos-${currentList?.name || currentListId}.csv`.replace(/\s+/g, '-')

    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredContacts.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)))
  }

  const _handlePreviewPayload = () => {
    const list = lists.find((l) => l.id === currentListId)
    const selected = contacts.filter((c) => selectedIds.includes(c.id))

    if (selected.length === 0) {
      setLastMoveMessage('Selecione ao menos um contato para gerar o payload.')
      return
    }

    const payload = {
      meta: {
        source: 'sendmessage',
        trigger: 'manual',
        listId: currentListId,
        listName: list?.name ?? currentListId,
        total: selected.length,
      },
      contacts: selected.map((c) => ({
        id: c.id,
        name: c.name,
        phone: normalizePhone(c.phone),
        email: c.email,
        category: c.category,
        rating: Number(formatRating(c.rating) || 0),
        cep: c.cep,
      })),
    }

    setPayloadPreview(JSON.stringify(payload, null, 2))
  }

  const handleMoveSelectedToList = () => {
    if (selectedIds.length === 0) {
      setLastMoveMessage('Selecione ao menos um contato para mover.')
      return
    }

    if (!moveTargetListId) {
      setLastMoveMessage('Escolha uma lista de destino para mover os contatos.')
      return
    }

    if (moveTargetListId === currentListId) {
      setLastMoveMessage('A lista de destino Ã© a mesma lista atual.')
      return
    }

    const targetList = lists.find((l) => l.id === moveTargetListId)
    if (!targetList) {
      setLastMoveMessage('Lista de destino invÃ¡lida.')
      return
    }

    let movedCount = 0

    setContactsByList((prev) => {
      const currentContacts = prev[currentListId] ?? []
      const targetContacts = prev[moveTargetListId] ?? []

      const toMove = currentContacts.filter((c) => selectedIds.includes(c.id))
      const remaining = currentContacts.filter((c) => !selectedIds.includes(c.id))

      // Evita duplicados na lista destino comparando por telefone normalizado
      const targetByPhone = new Map(
        targetContacts.map((c) => [normalizePhone(c.phone), c]),
      )

      const dedupedToMove: Contact[] = []
      toMove.forEach((c) => {
        const key = normalizePhone(c.phone)
        if (!key || !targetByPhone.has(key)) {
          dedupedToMove.push(c)
          if (key) targetByPhone.set(key, c)
        }
      })

      movedCount = dedupedToMove.length

      return {
        ...prev,
        [currentListId]: remaining,
        [moveTargetListId]: [...targetContacts, ...dedupedToMove],
      }
    })

    handleClearFilters()
    setSelectedIds([])
    setMoveTargetListId('')

    if (movedCount > 0) {
      setLastMoveMessage(
        `${movedCount} contato${movedCount > 1 ? 's' : ''} movido${movedCount > 1 ? 's' : ''
        } para "${targetList.name}",`,
      )
    }
  }

  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result
        if (typeof text !== 'string') return
        const parsed = JSON.parse(text)
        if (!parsed || typeof parsed !== 'object') {
          setLastMoveMessage('Arquivo de backup invÃ¡lido.')
          return
        }
        setImportPreview(parsed)
        setLastMoveMessage('Backup carregado. Confirme abaixo para importar.')
      } catch (err) {
        console.error('Erro ao ler arquivo de backup', err)
        setLastMoveMessage('Erro ao ler arquivo de backup.')
      }
    }
    reader.readAsText(file)
  }

  // Handler para confirmar importaÃ§Ã£o de backup
  const handleConfirmImportBackup = async () => {
    if (!effectiveUserId || !importPreview?.data) {
      setLastMoveMessage('Ã‰ necessÃ¡rio estar logado para importar os dados.')
      return
    }

    const d = importPreview.data

    try {
      setLastMoveMessage('Importando dados para o servidor...')

      // 1) Apaga listas, contatos e campanhas atuais do usuÃ¡rio (substituir tudo)
      await apiFetch('/api/contacts', { method: 'DELETE' })
      await apiFetch('/api/campaigns', { method: 'DELETE' })
      await apiFetch('/api/lists', { method: 'DELETE' })

      // 2) Recria listas do backup no Supabase
      const listIdMap = new Map<string, string>() // oldId -> newSupabaseId

      if (Array.isArray(d.lists)) {
        for (const old of d.lists as any[]) {
          const name = typeof old.name === 'string' ? old.name : 'Lista sem nome'
          try {
            const inserted = await apiFetch('/api/lists', {
              method: 'POST',
              body: JSON.stringify({ name })
            })

            if (inserted?.id) {
              listIdMap.set(String(old.id ?? old.name), inserted.id)
            }
          } catch (e) {
            console.error('Erro ao criar lista durante importaÃ§Ã£o', e, old)
          }
        }
      }

      // 3) Recria contatos do backup no Supabase
      const contactsByListFromBackup = (d.contactsByList ?? {}) as Record<string, any[]>

      for (const [oldListId, contactsFromBackup] of Object.entries(contactsByListFromBackup)) {
        const newListId = listIdMap.get(oldListId)
        if (!newListId) continue

        for (const c of contactsFromBackup ?? []) {
          try {
            const phoneDigits = typeof c.phone === 'string' ? normalizePhone(c.phone) : ''

            await apiFetch('/api/contacts', {
              method: 'POST',
              body: JSON.stringify({
                list_id: newListId,
                name: c.name ?? '',
                phone: phoneDigits,
                category: c.category ?? '',
                email: c.email ?? '',
                cep: c.cep ?? '',
                address: c.address ?? '',
                city: c.city ?? '',
                rating: c.rating ?? '',
              })
            })
          } catch (e) {
            console.error('Erro ao importar contato do backup', c, e)
          }
        }
      }

      // 4) Recria campanhas do backup no Supabase
      if (Array.isArray(d.campaigns)) {
        for (const camp of d.campaigns as any[]) {
          try {
            const channels: CampaignChannel[] = Array.isArray(camp.channels)
              ? (camp.channels as CampaignChannel[])
              : camp.channel
                ? [camp.channel as CampaignChannel]
                : ['whatsapp']

            const listName: string = typeof camp.listName === 'string'
              ? camp.listName
              : 'Lista padrão'

            await apiFetch('/api/campaigns', {
              method: 'POST',
              body: JSON.stringify({
                name: camp.name ?? '',
                status: camp.status ?? 'rascunho',
                channels,
                list_name: listName,
                message: camp.message ?? '',
              })
            })
          } catch (e) {
            console.error('Erro ao recriar campanha durante importaÃ§Ã£o', e, camp)
          }
        }
      }

      // 5, 6, 7) Recarrega dados do backend para o estado local
      await reloadLists()
      await reloadCampaigns()

      if (Array.isArray(d.contactSendHistory) && d.contactSendHistory.length > 0) {
        // Primeiro apaga histÃ³rico existente
        await apiFetch('/api/history', { method: 'DELETE' })

        // Insere histÃ³rico do backup em lotes de 10
        const historyItems = d.contactSendHistory as any[]
        const batchSize = 10
        for (let i = 0; i < historyItems.length; i += batchSize) {
          const batch = historyItems.slice(i, i + batchSize)
          for (const item of batch) {
            try {
              await apiFetch('/api/history', {
                method: 'POST',
                body: JSON.stringify({
                  campaign_id: item.campaignId ?? '',
                  campaign_name: item.campaignName ?? '',
                  contact_name: item.contactName ?? '',
                  phone_key: item.phoneKey ?? '',
                  channel: item.channel ?? 'whatsapp',
                  ok: item.ok ?? false,
                  status: item.status ?? 0,
                  webhook_ok: item.webhookOk ?? true,
                  run_at: item.runAt ? new Date(item.runAt).toISOString() : new Date().toISOString(),
                })
              })
            } catch (e) {
              console.error('Erro ao importar item de histórico:', e)
            }
          }
        }

        await reloadContactSendHistory()
      }

      // 8) Demais dados (webhooks, intervalos) continuam locais
      if (d.webhookUrlWhatsApp != null) setWebhookUrlWhatsApp(d.webhookUrlWhatsApp)
      if (d.webhookUrlEmail != null) setWebhookUrlEmail(d.webhookUrlEmail)
      if (d.sendIntervalMinSeconds != null) setSendIntervalMinSeconds(d.sendIntervalMinSeconds)
      if (d.sendIntervalMaxSeconds != null) setSendIntervalMaxSeconds(d.sendIntervalMaxSeconds)

      // Limpa contatos em memÃ³ria; serÃ£o recarregados do Supabase ao trocar de lista
      setContactsByList({})

      setImportPreview(null)
      setLastMoveMessage('Dados importados com sucesso para o Supabase.')
    } catch (e) {
      console.error('Erro inesperado ao importar dados para o Supabase', e)
      setLastMoveMessage('Erro inesperado ao importar dados para o Supabase.')
    }
  }

  const handleCreateList = () => {
    if (!effectiveUserId) return
    setListModalMode('create')
    setListModalName('')
  }

  const handleRenameCurrentList = () => {
    if (!currentUser) return
    if (currentListId === 'sem-contatos') {
      setLastMoveMessage('Esta lista nÃ£o pode ser renomeada.')
      return
    }

    const currentList = lists.find((l) => l.id === currentListId)
    setListModalMode('rename')
    setListModalName(currentList?.name || '')
  }

  const handleDeleteCurrentList = () => {
    if (!currentUser) return
    if (currentListId === 'sem-contatos') {
      setLastMoveMessage('Esta lista não pode ser excluída.')
      return
    }

    setConfirmDeleteListOpen(true)
  }

  const handleCancelListModal = () => {
    setListModalMode(null)
    setListModalName('')
  }

  const handleConfirmListModal = async () => {
    if (!effectiveUserId) return

    const trimmed = listModalName.trim()
    if (!trimmed) {
      return
    }

    if (listModalMode === 'create') {
      try {
        const data = await apiFetch('/api/lists', {
          method: 'POST',
          body: JSON.stringify({ name: trimmed })
        })

        setLists((prev) => [...prev, { id: data.id, name: data.name }])
        setContactsByList((prev) => ({ ...prev, [data.id]: [] }))
        handleClearFilters()
        setSelectedIds([])
        setCurrentListId(data.id)
        setLastMoveMessage('Lista criada com sucesso.')
        handleCancelListModal()
      } catch (e) {
        console.error('Erro ao criar lista:', e)
        setLastMoveMessage('Falha ao criar a lista.')
      }
    } else if (listModalMode === 'rename') {
      try {
        await apiFetch(`/api/lists/${currentListId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: trimmed })
        })

        setLists((prev) => prev.map((l) => (l.id === currentListId ? { ...l, name: trimmed } : l)))
        setLastMoveMessage('Lista renomeada com sucesso.')
        handleCancelListModal()
      } catch (e) {
        console.error('Erro ao renomear lista:', e)
        setLastMoveMessage('Falha ao renomear a lista.')
      }
    }
  }

  const handleCancelDeleteList = () => {
    setConfirmDeleteListOpen(false)
  }

  const handleConfirmDeleteList = async () => {
    if (!currentUser) return
    if (currentListId === 'sem-contatos') {
      setLastMoveMessage('Esta lista não pode ser excluída.')
      setConfirmDeleteListOpen(false)
      return
    }

    try {
      await apiFetch(`/api/lists/${currentListId}`, {
        method: 'DELETE'
      })

      setContactsByList((prev) => {
        const { [currentListId]: _, ...rest } = prev
        return rest
      })

      const remaining = lists.filter((l) => l.id !== currentListId)
      setLists(remaining)

      if (remaining.length > 0) {
        setCurrentListId(remaining[0].id)
      } else {
        setCurrentListId('')
      }

      setLastMoveMessage('Lista excluída com sucesso.')
      setConfirmDeleteListOpen(false)
    } catch (e) {
      console.error('Erro ao excluir lista:', e)
      setLastMoveMessage('Falha ao excluir a lista.')
      setConfirmDeleteListOpen(false)
    }
  }

  const handleAuthSubmit = async () => {
    setAuthError(null)
    const email = authEmail.trim()
    const password = authPassword.trim()
    const name = authName.trim()

    if (!email || !password || (authMode === 'signup' && !name)) {
      setAuthError(authMode === 'signup' ? 'Informe nome, email e senha.' : 'Informe email e senha.')
      return
    }

    try {
      if (authMode === 'signup') {
        await authSignup({ email, password, name })
        setAuthError(
          'Cadastro realizado com sucesso. Você já pode fazer login.',
        )
        setAuthMode('login')
        setAuthPassword('')
        setAuthName('')
      } else {
        await authLogin({ email, password })
      }

      // Persistência de email/nome conforme "Lembrar de mim"
      try {
        if (rememberMe) {
          localStorage.setItem('sendmessage_authRemember', 'true')
          localStorage.setItem('sendmessage_authEmail', email)
          if (name) {
            localStorage.setItem('sendmessage_authName', name)
          }
        } else {
          localStorage.removeItem('sendmessage_authRemember')
          localStorage.removeItem('sendmessage_authEmail')
          localStorage.removeItem('sendmessage_authName')
        }
      } catch (e) {
        console.error('Erro ao persistir dados de login (remember me)', e)
      }
    } catch (e: any) {
      console.error('Erro ao autenticar:', e)
      setAuthError(e.message || 'Erro inesperado ao autenticar. Tente novamente.')
    }
  }

  const _handleSignOut = async () => {
    try {
      authLogout()
    } catch (e) {
      console.error('Erro ao sair:', e)
    }
  }

  const handleExportData = () => {
    try {
      const data = {
        lists,
        contactsByList,
        campaigns,
        sendHistory,
        contactSendHistory,
        webhookUrlWhatsApp,
        webhookUrlEmail,
        sendIntervalMinSeconds,
        sendIntervalMaxSeconds,
      }

      const payload = {
        exportedAt: new Date().toISOString(),
        data,
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().slice(0, 10)
      a.download = `cl-marketing-backup-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
      setLastMoveMessage('Backup exportado com sucesso.')
    } catch (e) {
      console.error('Erro ao exportar dados', e)
      setLastMoveMessage('Erro ao exportar dados.')
    }
  }

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-700 text-sm">
        Carregando autenticação...
      </div>
    )
  }

  if (!currentUser) {
    return (
      <AuthPage
        authMode={authMode}
        authEmail={authEmail}
        authPassword={authPassword}
        authName={authName}
        rememberMe={rememberMe}
        authError={authError}
        onSetAuthMode={setAuthMode}
        onSetAuthEmail={setAuthEmail}
        onSetAuthPassword={setAuthPassword}
        onSetAuthName={setAuthName}
        onToggleRememberMe={() => setRememberMe((prev) => !prev)}
        onSetAuthError={setAuthError}
        onSubmit={handleAuthSubmit}
      />
    )
  }

  // Modal de atualização forçada
  if (forceUpdate) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Atualização Disponível
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Uma nova versão do sistema está disponível. Por favor, atualize para continuar usando.
            </p>
            <p className="text-xs text-slate-500">
              Versão atual: {localStorage.getItem('app_version') || 'desconhecida'}<br />
              Nova versão: {APP_VERSION}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('app_version', APP_VERSION)
              window.location.reload()
            }}
            className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            Atualizar Agora
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onChangePage={(page) => {
          setCurrentPage(page)
        }}
        can={can}
        userEmail={currentUser?.email ?? null}
        userName={permissions?.displayName ?? null}
        onSignOut={_handleSignOut}
        impersonatedUserId={impersonatedUserId}
        onClearImpersonation={() => setImpersonatedUserId(null)}
      />

      {/* Área de conteúdo */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {updateAvailable && (
          <div className="shrink-0 bg-emerald-600 text-white text-[11px] md:text-xs px-3 md:px-6 py-2 flex items-center justify-center z-40">
            <div className="max-w-6xl w-full flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <span className="font-medium text-center md:text-left">
                Nova versão do sistema disponível. Atualize para usar a versão mais recente.
              </span>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-semibold border border-white/40 transition-colors"
                  onClick={() => window.location.reload()}
                >
                  Atualizar agora
                </button>
                <button
                  type="button"
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  onClick={() => setUpdateAvailable(false)}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        <Header
          currentPage={currentPage}
          onImportCsv={currentPage === 'contacts' && can('contacts.import') ? handleCsvUpload : undefined}
          onExportCsv={currentPage === 'contacts' && can('contacts.export') ? handleExportCsv : undefined}
        />

        {impersonatedUserId && (
          <div className="shrink-0 bg-amber-100 border-b border-amber-300 px-3 md:px-6 py-2">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="text-[11px] md:text-xs text-amber-900 leading-snug">
                <div className="font-semibold uppercase tracking-wide text-[10px] mb-0.5">
                  Modo ver como ativo
                </div>
                <div>
                  VocÃª estÃ¡ vendo o sistema como <span className="font-semibold">outro usuÃ¡rio</span>.
                  {' '}Qualquer campanha, contato ou lista criada/alterada agora serÃ¡ salva na conta desse usuÃ¡rio.
                </div>
                <div className="mt-0.5 text-[10px] text-amber-900/80">
                  ID do usuÃ¡rio impersonado: <span className="font-mono break-all">{impersonatedUserId}</span>
                </div>
              </div>
              <div className="flex md:flex-col items-stretch justify-end gap-1 md:gap-1 min-w-[160px] md:min-w-[180px]">
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-3 py-1 rounded-md border border-amber-500 bg-amber-600 text-white text-[11px] font-semibold shadow-sm hover:bg-amber-700 transition-colors"
                  onClick={() => setImpersonatedUserId(null)}
                >
                  <span className="leading-tight text-center">
                    Sair do modo
                    <br />
                    ver como
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Indicador global de envio em andamento */}
        {sendingCampaignId && (
          <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-3 md:px-6 py-2">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div className="animate-pulse h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[10px] md:text-[11px] text-amber-800 truncate">
                  <strong className="hidden md:inline">Envio em andamento:</strong>{' '}
                  <strong className="md:hidden">Enviando:</strong>{' '}
                  <span className="hidden md:inline">{campaigns.find((c) => c.id === sendingCampaignId)?.name || 'Campanha'}</span>{' '}
                  ({sendingCurrentIndex}/{sendingTotal})
                  {sendingNextDelaySeconds != null && sendingNextDelaySeconds > 0 && (
                    <span className="ml-1 md:ml-2">â€¢ {sendingNextDelaySeconds}s</span>
                  )}
                </span>
              </div>
              <button
                type="button"
                className="shrink-0 text-[10px] px-2 py-0.5 rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja cancelar o envio? O progresso atual serÃ¡ perdido.')) {
                    setSendingCampaignId(null)
                    setSendingCurrentIndex(0)
                    setSendingTotal(0)
                    setSendingErrors(0)
                    setSendingNextDelaySeconds(null)
                    setLastMoveMessage('Envio cancelado pelo usuÃ¡rio.')
                  }
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-6 space-y-3 md:space-y-4">
            {currentPage === 'dashboard' ? (
              <DashboardPage
                contactsByList={contactsByList}
                contacts={contacts}
                lists={lists}
                currentListId={currentListId}
                campaigns={campaigns}
                sendHistory={sendHistory}
                campaignSendLog={campaignSendLog}
                sendingCampaignId={sendingCampaignId}
                sendingCurrentIndex={sendingCurrentIndex}
                sendingTotal={sendingTotal}
                sendingErrors={sendingErrors}
                webhookUrlWhatsApp={effectiveWebhookWhatsapp}
                webhookUrlEmail={effectiveWebhookEmail}
                onNavigate={setCurrentPage}
                onCreateCampaign={() => {
                  setCurrentPage('campaigns')
                  setEditingCampaignId(null)
                  setNewCampaignName('')
                  setNewCampaignListId(lists[0]?.id || '')
                  setNewCampaignChannels(['whatsapp'])
                  setNewCampaignMessage('')
                  setCampaignEditorOpen(true)
                }}
                onEditCampaign={(camp) => {
                  setCurrentPage('campaigns')
                  handleStartEditCampaign(camp)
                }}
                can={can}
              />
            ) : currentPage === 'contacts' ? (
              <ContactsPage
                contacts={contacts}
                filteredContacts={filteredContacts}
                lists={lists}
                sortedLists={sortedLists}
                currentListId={currentListId}
                contactSendHistory={contactSendHistory}
                selectedIds={selectedIds}
                moveTargetListId={moveTargetListId}
                showContactForm={showContactForm}
                editingContactId={editingContactId}
                contactFormName={contactFormName}
                contactFormPhone={contactFormPhone}
                contactFormCategory={contactFormCategory}
                contactFormEmail={contactFormEmail}
                contactFormCep={contactFormCep}
                contactFormAddress={contactFormAddress}
                contactFormCity={contactFormCity}
                contactFormRating={contactFormRating}
                searchName={searchName}
                searchPhone={searchPhone}
                searchEmail={searchEmail}
                filterCategory={filterCategory}
                filterCity={filterCity}
                importNewContacts={importNewContacts}
                importConflicts={importConflicts}
                geminiApiKey={geminiApiKey}
                isBackfillingAddress={isBackfillingAddress}
                payloadPreview={payloadPreview}
                onSelectList={(id) => setCurrentListId(id)}
                onCreateList={handleCreateList}
                onRenameCurrentList={handleRenameCurrentList}
                onDeleteCurrentList={handleDeleteCurrentList}
                onCreateContact={handleCreateContactManual}
                onEditContact={handleEditContact}
                onDeleteContact={handleDeleteContact}
                onSaveContactForm={handleSaveContactForm}
                onCancelContactForm={handleCancelContactForm}
                onChangeContactFormName={setContactFormName}
                onChangeContactFormPhone={setContactFormPhone}
                onChangeContactFormCategory={setContactFormCategory}
                onChangeContactFormEmail={setContactFormEmail}
                onChangeContactFormCep={setContactFormCep}
                onChangeContactFormAddress={setContactFormAddress}
                onChangeContactFormCity={setContactFormCity}
                onChangeContactFormRating={setContactFormRating}
                onToggleSelectAll={handleToggleSelectAll}
                onToggleSelectOne={handleToggleSelectOne}
                onResetSelection={() => setSelectedIds([])}
                onSetMoveTargetListId={setMoveTargetListId}
                onMoveSelectedToList={handleMoveSelectedToList}
                onSetSearchName={setSearchName}
                onSetSearchPhone={setSearchPhone}
                onSetSearchEmail={setSearchEmail}
                onSetFilterCategory={setFilterCategory}
                onSetFilterCity={setFilterCity}
                onClearFilters={handleClearFilters}
                onCancelImport={handleCancelImport}
                onApplyImport={handleApplyImport}
                onSetImportConflicts={setImportConflicts}
                onBackfillAddressFromCep={handleBackfillAddressFromCep}
                onAiExtractContact={handleAiExtractContact}
                onSetLists={setLists}
                onSetContactsByList={setContactsByList}
                onSetCurrentListId={setCurrentListId}
                onSetEditingContactId={setEditingContactId}
                onSetContactFormName={setContactFormName}
                onSetContactFormPhone={setContactFormPhone}
                onSetContactFormEmail={setContactFormEmail}
                onSetContactFormCategory={setContactFormCategory}
                onSetContactFormCep={setContactFormCep}
                onSetContactFormAddress={setContactFormAddress}
                onSetContactFormCity={setContactFormCity}
                onSetContactFormRating={setContactFormRating}
                onSetLastMoveMessage={setLastMoveMessage}
                can={can}
              />
            ) : currentPage === 'campaigns' ? (
              <CampaignsPage
                campaigns={campaigns}
                lists={lists}
                sortedLists={sortedLists}
                contactsByList={contactsByList}
                sendHistory={sendHistory}
                contactSendHistory={contactSendHistory}
                campaignSendLog={campaignSendLog}
                campaignEditorOpen={campaignEditorOpen}
                editingCampaignId={editingCampaignId}
                newCampaignName={newCampaignName}
                newCampaignListId={newCampaignListId}
                newCampaignChannels={newCampaignChannels}
                newCampaignMessage={newCampaignMessage}
                sendingCampaignId={sendingCampaignId}
                sendingCurrentIndex={sendingCurrentIndex}
                sendingTotal={sendingTotal}
                sendingErrors={sendingErrors}
                sendingNextDelaySeconds={sendingNextDelaySeconds}
                sendConfirmCampaignId={sendConfirmCampaignId}
                webhookUrlWhatsApp={effectiveWebhookWhatsapp}
                webhookUrlEmail={effectiveWebhookEmail}
                sendIntervalMinSeconds={sendIntervalMinSeconds}
                sendIntervalMaxSeconds={sendIntervalMaxSeconds}
                onChangeSendIntervalMinSeconds={setSendIntervalMinSeconds}
                onChangeSendIntervalMaxSeconds={setSendIntervalMaxSeconds}
                reportCampaignId={reportCampaignId}
                reportViewMode={reportViewMode}
                onSetCampaignEditorOpen={setCampaignEditorOpen}
                onSetEditingCampaignId={setEditingCampaignId}
                onSetNewCampaignName={setNewCampaignName}
                onSetNewCampaignListId={setNewCampaignListId}
                onSetNewCampaignChannels={setNewCampaignChannels}
                onSetNewCampaignMessage={setNewCampaignMessage}
                onCreateCampaign={handleCreateCampaign}
                onCancelEditCampaign={handleCancelEditCampaign}
                onStartEditCampaign={handleStartEditCampaign}
                onDuplicateCampaign={handleDuplicateCampaign}
                onDeleteCampaign={handleDeleteCampaign}
                onRequestSendCampaign={handleRequestSendCampaignToN8n}
                onSendCampaign={handleSendCampaignToN8n}
                onContinueCampaign={handleContinueCampaign}
                onSetSendConfirmCampaignId={setSendConfirmCampaignId}
                onSetReportCampaignId={setReportCampaignId}
                onSetReportViewMode={setReportViewMode}
                htmlToWhatsapp={htmlToWhatsapp}
                htmlToText={htmlToText}
                getPendingContacts={getPendingContacts}
                can={can}
                currentUserGroupName={permissions?.groupName ?? null}
                geminiApiKey={effectiveAiKey}
                userHasConfiguredAi={userHasConfiguredAi}
                onGenerateCampaignContentWithAI={handleGenerateCampaignContentWithAI}
              />
            ) : currentPage === 'schedules' ? (
              <SchedulesPage
                campaigns={campaigns}
                effectiveUserId={effectiveUserId}
              />
            ) : currentPage === 'reports' ? (
              <ReportsPage
                campaigns={campaigns}
                contactSendHistory={contactSendHistory}
              />
            ) : currentPage === 'profile' ? (
              <UserSettingsPage
                userSettings={userSettings}
                onSaveOverrides={handleSaveUserOverrides}
              />
            ) : currentPage === 'settings' ? (
              <SettingsPage
                webhookUrlWhatsApp={webhookUrlWhatsApp}
                webhookUrlEmail={webhookUrlEmail}
                onChangeWebhookWhatsApp={setWebhookUrlWhatsApp}
                onChangeWebhookEmail={setWebhookUrlEmail}
                evolutionApiUrl={evolutionApiUrl}
                evolutionApiKey={evolutionApiKey}
                evolutionInstance={evolutionInstance}
                onChangeEvolutionApiUrl={setEvolutionApiUrl}
                onChangeEvolutionApiKey={setEvolutionApiKey}
                onChangeEvolutionInstance={setEvolutionInstance}
                geminiApiKey={geminiApiKey}
                onChangeGeminiApiKey={setGeminiApiKey}
                geminiModel={geminiModel}
                onChangeGeminiModel={setGeminiModel}
                geminiApiVersion={geminiApiVersion}
                onChangeGeminiApiVersion={setGeminiApiVersion}
                geminiTemperature={geminiTemperature}
                onChangeGeminiTemperature={setGeminiTemperature}
                geminiMaxTokens={geminiMaxTokens}
                onChangeGeminiMaxTokens={setGeminiMaxTokens}
                debugEnabled={debugEnabled}
                onChangeDebugEnabled={setDebugEnabled}
                importPreview={importPreview}
                onExportData={handleExportData}
                onImportFile={handleImportFile}
                onCancelImport={() => setImportPreview(null)}
                onConfirmImport={handleConfirmImportBackup}
                onSave={handleSaveGlobalSettings}
                can={can}
              />
            ) : currentPage === 'admin' ? (
              <AdminUsersPage
                can={can}
                debugEnabled={debugEnabled}
                currentUserGroupName={permissions?.groupName ?? null}
                impersonatedUserId={impersonatedUserId}
                onImpersonateUser={setImpersonatedUserId}
              />
            ) : currentPage === 'extract' ? (
              <ExtractPage
                onAiExtractContact={handleAiExtractContact}
                isExtracting={isExtracting}
                lastMessage={lastMoveMessage}
              />
            ) : null}
          </div>
        </main>

        {/* Modal de criar/renomear lista */}
        {listModalMode && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-4 space-y-3">
              <div className="text-sm font-semibold text-slate-800">
                {listModalMode === 'create' ? 'Nova lista' : 'Renomear lista'}
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Nome da lista
                </label>
                <input
                  type="text"
                  value={listModalName}
                  onChange={(e) => setListModalName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Digite o nome da lista"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50"
                  onClick={handleCancelListModal}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleConfirmListModal}
                  disabled={!listModalName.trim()}
                >
                  {listModalMode === 'create' ? 'Criar lista' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmação para excluir lista */}
        {confirmDeleteListOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-4 space-y-3">
              <div className="text-sm font-semibold text-slate-800">Excluir lista</div>
              <div className="text-[12px] text-slate-700 leading-snug">
                Tem certeza que deseja excluir a lista
                {' '}
                <span className="font-semibold">
                  {lists.find((l) => l.id === currentListId)?.name || 'lista atual'}
                </span>
                {' '}?
                <br />
                Os contatos dessa lista também serão removidos.
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50"
                  onClick={handleCancelDeleteList}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md bg-red-600 text-white text-[11px] font-semibold hover:bg-red-700"
                  onClick={handleConfirmDeleteList}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {lastMoveMessage && (
          <div className="fixed bottom-4 right-4 z-50 max-w-xs text-[11px] bg-emerald-500/95 text-white px-3 py-2 rounded-xl shadow-lg shadow-emerald-900/50 border border-emerald-200/60">
            {lastMoveMessage}
          </div>
        )}

        {debugEnabled && permissions && (
          <div className="fixed bottom-4 left-4 z-40 max-w-sm text-[10px] bg-slate-900/95 text-slate-100 px-3 py-2 rounded-xl shadow-lg shadow-slate-900/70 border border-slate-700/70">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-semibold text-emerald-300">DEBUG</span>
              <span className="text-[9px] text-slate-400">RBAC</span>
            </div>
            <div className="space-y-1">
              <div>
                <span className="text-[9px] text-slate-400">UsuÃ¡rio:</span>{' '}
                <span className="text-[10px] font-medium">
                  {permissions.displayName || currentUser?.email || 'â€”'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400">Grupo:</span>{' '}
                <span className="text-[10px] font-medium">{permissions.groupName || 'â€”'}</span>
              </div>
              <div className="break-all">
                <span className="text-[9px] text-slate-400">groupId:</span>{' '}
                <span className="font-mono text-[9px]">{permissions.groupId || 'null'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400">PermissÃµes ({permissions.permissionCodes.length}):</span>
                <div className="mt-0.5 max-h-24 overflow-auto space-y-0.5">
                  {permissions.permissionCodes.length === 0 ? (
                    <div className="text-[9px] text-slate-500">nenhuma permissÃ£o carregada</div>
                  ) : (
                    permissions.permissionCodes.map((code) => (
                      <div key={code} className="text-[9px] font-mono text-emerald-200">
                        {code}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
