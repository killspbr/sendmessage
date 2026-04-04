import { useState, useCallback } from 'react'
import { apiFetch } from '../api'

export interface WhatsAppLabel {
  id: string
  name: string
  color?: string
}

export interface WhatsAppGroup {
  id: string
  subject: string
}

export function useChat() {
  const [labels, setLabels] = useState<WhatsAppLabel[]>([])
  const [groups, setGroups] = useState<WhatsAppGroup[]>([])
  const [loadingChat, setLoadingChat] = useState(false)

  const fetchLabels = useCallback(async (instance: string) => {
    if (!instance) return
    setLoadingChat(true)
    try {
      const data = await apiFetch<WhatsAppLabel[]>(`/chat/labels/${instance}`)
      // Evolution v2 pode retornar os dados em um field específico ou como array direto
      const list = Array.isArray(data) ? data : (data as any)?.labels || []
      setLabels(list)
    } catch (err) {
      console.warn('[useChat] Erro ao buscar labels:', err)
      setLabels([])
    } finally {
      setLoadingChat(false)
    }
  }, [])

  const fetchGroups = useCallback(async (instance: string) => {
    if (!instance) return
    setLoadingChat(true)
    try {
      const data = await apiFetch<WhatsAppGroup[]>(`/chat/groups/${instance}`)
      const list = Array.isArray(data) ? data : (data as any)?.groups || []
      setGroups(list)
    } catch (err) {
      console.warn('[useChat] Erro ao buscar grupos:', err)
      setGroups([])
    } finally {
      setLoadingChat(false)
    }
  }, [])

  const setupWebhook = useCallback(async (instance: string) => {
    if (!instance) return
    setLoadingChat(true)
    try {
      await apiFetch(`/chat/webhook-setup/${instance}`, { method: 'POST' })
      return true
    } catch (err) {
      console.warn('[useChat] Erro ao configurar webhook:', err)
      return false
    } finally {
      setLoadingChat(false)
    }
  }, [])

  const sendWhatsAppStatus = useCallback(async (instance: string, data: { text?: string, mediaUrl?: string, mediaType?: 'image' | 'video' }) => {
    if (!instance) return
    setLoadingChat(true)
    try {
      const res = await apiFetch<any>(`/chat/status-send/${instance}`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return !!res.ok
    } catch (err) {
      console.warn('[useChat] Erro ao enviar status:', err)
      return false
    } finally {
      setLoadingChat(false)
    }
  }, [])

  return { 
    labels, 
    groups, 
    loadingChat, 
    fetchLabels, 
    fetchGroups,
    setupWebhook,
    sendWhatsAppStatus,
    setLabels,
    setGroups
  }
}
