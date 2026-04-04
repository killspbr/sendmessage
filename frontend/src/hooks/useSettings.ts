import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { logError } from '../utils'

export type UserSettings = {
  display_name: string | null
  phone: string | null
  use_global_ai: boolean
  ai_api_key: string | null
  evolution_url: string | null
  evolution_apikey: string | null
  evolution_instance: string | null
  company_info: string | null
}

export type GlobalSettings = {
  id: string | number | null
  global_ai_api_key: string | null
  evolution_api_url: string | null
  evolution_api_key: string | null
  evolution_shared_instance: string | null
  google_maps_api_key: string | null
  gemini_model: string | null
  gemini_api_version: string | null
  gemini_temperature: number | null
  gemini_max_tokens: number | null
}

type UseSettingsParams = {
  effectiveUserId: string | null
  currentUserId: string | null
}

export function useSettings({ effectiveUserId, currentUserId }: UseSettingsParams) {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null)

  // Global settings form state
  const [geminiApiKey, setGeminiApiKey] = useState<string>('')
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.5-flash')
  const [geminiApiVersion, setGeminiApiVersion] = useState<string>('v1')
  const [geminiTemperature, setGeminiTemperature] = useState<number>(0.7)
  const [geminiMaxTokens, setGeminiMaxTokens] = useState<number>(4096)
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('')
  const [evolutionApiUrl, setEvolutionApiUrl] = useState<string>('')
  const [evolutionApiKey, setEvolutionApiKey] = useState<string>('')
  const [evolutionInstance, setEvolutionInstance] = useState<string>('')
  const [sendIntervalMinSeconds, setSendIntervalMinSeconds] = useState<number>(30)
  const [sendIntervalMaxSeconds, setSendIntervalMaxSeconds] = useState<number>(90)

  // Computed AI values
  const useGlobalAi = userSettings?.use_global_ai ?? true
  const userAiKey = userSettings?.ai_api_key || null
  const effectiveAiKey = useGlobalAi ? '__global_pool__' : userAiKey || ''
  const userHasConfiguredAi = useGlobalAi || (!useGlobalAi && !!userAiKey)

  // Computed Evolution values
  const hasEvolutionConfigured =
    (!!userSettings?.evolution_url || !!globalSettings?.evolution_api_url) &&
    (!!userSettings?.evolution_instance || !!globalSettings?.evolution_shared_instance)

  // Load user settings
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
            display_name: data.display_name ?? null,
            phone: data.phone ?? null,
            use_global_ai: data.use_global_ai ?? true,
            ai_api_key: data.ai_api_key ?? null,
            evolution_url: data.evolution_url ?? null,
            evolution_apikey: data.evolution_apikey ?? null,
            evolution_instance: data.evolution_instance ?? null,
            company_info: data.company_info ?? null,
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

  // Load global settings
  useEffect(() => {
    if (!currentUserId) {
      setGlobalSettings(null)
      return
    }

    const loadGlobalSettings = async () => {
      try {
        const data = await apiFetch('/api/settings')

        if (data) {
          setGlobalSettings({
            id: data.id ?? null,
            global_ai_api_key: data.global_ai_api_key ?? null,
            evolution_api_url: data.evolution_api_url ?? null,
            evolution_api_key: data.evolution_api_key ?? null,
            evolution_shared_instance: data.evolution_shared_instance ?? null,
            google_maps_api_key: data.google_maps_api_key ?? null,
            gemini_model: data.gemini_model ?? null,
            gemini_api_version: data.gemini_api_version ?? null,
            gemini_temperature: data.gemini_temperature ?? null,
            gemini_max_tokens: data.gemini_max_tokens ?? null,
          })

          if (data.global_ai_api_key) setGeminiApiKey(data.global_ai_api_key)
          if (data.evolution_api_url) setEvolutionApiUrl(data.evolution_api_url)
          if (data.evolution_api_key) setEvolutionApiKey(data.evolution_api_key)
          if (data.evolution_shared_instance) setEvolutionInstance(data.evolution_shared_instance)
          if (data.gemini_model) setGeminiModel(data.gemini_model)
          if (data.gemini_api_version) setGeminiApiVersion(data.gemini_api_version)
          if (data.gemini_temperature != null) setGeminiTemperature(Number(data.gemini_temperature))
          if (data.gemini_max_tokens != null) setGeminiMaxTokens(Number(data.gemini_max_tokens))
          if (data.send_interval_min != null) setSendIntervalMinSeconds(Number(data.send_interval_min))
          if (data.send_interval_max != null) setSendIntervalMaxSeconds(Number(data.send_interval_max))
          if (data.google_maps_api_key) setGoogleMapsApiKey(data.google_maps_api_key)
        } else {
          setGlobalSettings(null)
        }
      } catch (e) {
        if (e instanceof Error && e.message === 'AUTH_EXPIRED') return
        logError('globalSettings.load', 'Erro inesperado ao carregar app_settings', e)
      }
    }

    void loadGlobalSettings()
  }, [currentUserId])

  const handleSaveUserOverrides = async (overrides: {
    displayName?: string | null
    phone?: string | null
    aiApiKey?: string | null
    evolutionUrl?: string | null
    evolutionApiKey?: string | null
    evolutionInstance?: string | null
    companyInfo?: string | null
  }) => {
    if (!effectiveUserId) return

    try {
      const nextUseGlobalAi = overrides.aiApiKey == null
      const payload: any = {
        use_global_ai: nextUseGlobalAi,
        ai_api_key: overrides.aiApiKey,
      }

      if (overrides.displayName !== undefined) payload.display_name = overrides.displayName
      if (overrides.phone !== undefined) payload.phone = overrides.phone
      if (overrides.evolutionUrl !== undefined) payload.evolution_url = overrides.evolutionUrl
      if (overrides.evolutionApiKey !== undefined) payload.evolution_apikey = overrides.evolutionApiKey
      if (overrides.evolutionInstance !== undefined) payload.evolution_instance = overrides.evolutionInstance
      if (overrides.companyInfo !== undefined) payload.company_info = overrides.companyInfo

      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      setUserSettings((prev) =>
        prev
          ? {
              ...prev,
              display_name: overrides.displayName !== undefined ? overrides.displayName ?? null : prev.display_name,
              phone: overrides.phone !== undefined ? overrides.phone ?? null : prev.phone,
              use_global_ai: nextUseGlobalAi,
              ai_api_key: overrides.aiApiKey !== undefined ? overrides.aiApiKey ?? null : prev.ai_api_key,
              evolution_url: overrides.evolutionUrl !== undefined ? overrides.evolutionUrl ?? null : prev.evolution_url,
              evolution_apikey: overrides.evolutionApiKey !== undefined ? overrides.evolutionApiKey ?? null : prev.evolution_apikey,
              evolution_instance: overrides.evolutionInstance !== undefined ? overrides.evolutionInstance ?? null : prev.evolution_instance,
              company_info: overrides.companyInfo !== undefined ? overrides.companyInfo ?? null : prev.company_info,
            }
          : prev,
      )
    } catch (e) {
      logError('userSettings.saveOverrides', 'Erro inesperado ao salvar configurações pessoais do usuário:', e)
    }
  }

  const handleSaveGlobalSettings = async (): Promise<string> => {
    try {
      const payload = {
        global_ai_api_key: geminiApiKey.trim() || null,
        evolution_api_url: evolutionApiUrl.trim() || null,
        evolution_api_key: evolutionApiKey.trim() || null,
        evolution_shared_instance: evolutionInstance.trim() || null,
        gemini_model: geminiModel || null,
        gemini_api_version: geminiApiVersion || null,
        gemini_temperature: geminiTemperature,
        gemini_max_tokens: geminiMaxTokens,
        send_interval_min: sendIntervalMinSeconds,
        send_interval_max: sendIntervalMaxSeconds,
        google_maps_api_key: googleMapsApiKey.trim() || null,
      }

      const data = await apiFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setGlobalSettings({
        id: data.id ?? null,
        global_ai_api_key: data.global_ai_api_key ?? null,
        evolution_api_url: data.evolution_api_url ?? null,
        evolution_api_key: data.evolution_api_key ?? null,
        evolution_shared_instance: data.evolution_shared_instance ?? null,
        google_maps_api_key: data.google_maps_api_key ?? null,
        gemini_model: data.gemini_model ?? null,
        gemini_api_version: data.gemini_api_version ?? null,
        gemini_temperature: data.gemini_temperature ?? null,
        gemini_max_tokens: data.gemini_max_tokens ?? null,
      })

      return 'Configurações globais salvas com sucesso.'
    } catch (e) {
      logError('globalSettings.save', 'Erro inesperado ao salvar configurações globais de integração', e)
      return 'Erro inesperado ao salvar as configurações globais.'
    }
  }

  return {
    userSettings,
    setUserSettings,
    globalSettings,
    setGlobalSettings,

    geminiApiKey,
    setGeminiApiKey,
    geminiModel,
    setGeminiModel,
    geminiApiVersion,
    setGeminiApiVersion,
    geminiTemperature,
    setGeminiTemperature,
    geminiMaxTokens,
    setGeminiMaxTokens,
    googleMapsApiKey,
    setGoogleMapsApiKey,
    evolutionApiUrl,
    setEvolutionApiUrl,
    evolutionApiKey,
    setEvolutionApiKey,
    evolutionInstance,
    setEvolutionInstance,
    sendIntervalMinSeconds,
    setSendIntervalMinSeconds,
    sendIntervalMaxSeconds,
    setSendIntervalMaxSeconds,

    effectiveAiKey,
    useGlobalAi,
    userAiKey,
    userHasConfiguredAi,
    hasEvolutionConfigured,

    handleSaveUserOverrides,
    handleSaveGlobalSettings,
  }
}
