import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { logError } from '../utils'
import type { ActiveUserPresenceSnapshot } from '../types'
import type { SidebarPage } from '../components/layout/Sidebar'

type UsePresenceParams = {
  currentUserId: string | null
  currentPage: SidebarPage
  canAdminUsers: boolean
}

function getPresenceSessionId(): string {
  const storageKey = 'sendmessage_presence_session_id'
  const existing = sessionStorage.getItem(storageKey)
  if (existing) return existing

  const nextId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `presence-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  sessionStorage.setItem(storageKey, nextId)
  return nextId
}

export function usePresence({ currentUserId, currentPage, canAdminUsers }: UsePresenceParams) {
  const [activeUserPresence, setActiveUserPresence] = useState<ActiveUserPresenceSnapshot | null>(null)
  const [warmerPairs, setWarmerPairs] = useState<any[]>([])

  // Heartbeat
  useEffect(() => {
    if (!currentUserId) {
      setActiveUserPresence(null)
      return
    }

    const sendHeartbeat = async () => {
      try {
        await apiFetch('/api/auth/presence', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: getPresenceSessionId(),
            currentPage,
          }),
        })
      } catch (e) {
        logError('presence.heartbeat', 'Erro ao registrar presença da sessão', e)
      }
    }

    // Pooling desativado temporariamente para estabilização do backend
    /*
    const initialTimer = setTimeout(() => {
      void sendHeartbeat()
    }, 2000)
    const interval = setInterval(() => {
      void sendHeartbeat()
    }, 60000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
    */
  }, [currentUserId, currentPage])

  // Admin: active users polling
  useEffect(() => {
    if (!currentUserId || currentPage !== 'dashboard' || !canAdminUsers) {
      setActiveUserPresence(null)
      return
    }

    const loadActiveUserPresence = async () => {
      try {
        const data = await apiFetch('/api/admin/active-users')
        setActiveUserPresence(data)
      } catch (e) {
        logError('presence.admin', 'Erro ao carregar usuários ativos', e)
      }
    }

    void loadActiveUserPresence()
    // Polling desativado temporariamente
    /*
    const interval = setInterval(() => {
      void loadActiveUserPresence()
    }, 30000)

    return () => clearInterval(interval)
    */
  }, [currentUserId, currentPage, canAdminUsers])

  // Admin: warmer status polling
  useEffect(() => {
    if (!currentUserId || currentPage !== 'dashboard' || !canAdminUsers) {
      setWarmerPairs([])
      return
    }

    const loadWarmerStatus = async () => {
      try {
        const data = await apiFetch('/api/admin/warmer')
        setWarmerPairs(data || [])
      } catch (e) {
        logError('warmer.loadStatus', 'Erro ao carregar status do maturador', e)
      }
    }

    void loadWarmerStatus()
    // Polling desativado temporariamente
    /*
    const interval = setInterval(() => {
      void loadWarmerStatus()
    }, 45000)

    return () => clearInterval(interval)
    */
  }, [currentUserId, currentPage, canAdminUsers])

  return {
    activeUserPresence,
    warmerPairs,
    getPresenceSessionId,
  }
}
