import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

export type PermissionCode =
  | 'dashboard.view'
  | 'contacts.view'
  | 'contacts.create'
  | 'contacts.edit'
  | 'contacts.delete'
  | 'contacts.import'
  | 'contacts.export'
  | 'campaigns.view'
  | 'campaigns.create'
  | 'campaigns.edit'
  | 'campaigns.delete'
  | 'campaigns.send'
  | 'settings.view'
  | 'settings.edit'
  | 'admin.users'
  | 'admin.groups'
  | 'admin.audit'
  | 'backup.export'
  | 'backup.import'

export type UserPermissions = {
  groupId: string | null
  groupName: string | null
  displayName: string | null
  permissionCodes: string[]
}

export type UsePermissionsResult = {
  loading: boolean
  error: string | null
  permissions: UserPermissions | null
  can: (code: string) => boolean
  canAny: (codes: string[]) => boolean
  canAll: (codes: string[]) => boolean
  reload: () => Promise<void>
}

const PERMISSIONS_CACHE_KEY = 'auth_permissions_cache'

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readCachedPermissions(): UserPermissions | null {
  try {
    const raw = localStorage.getItem(PERMISSIONS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.permissionCodes)) return null
    return {
      groupId: parsed.groupId ?? null,
      groupName: parsed.groupName ?? null,
      displayName: parsed.displayName ?? null,
      permissionCodes: parsed.permissionCodes.map((item: unknown) => String(item)),
    }
  } catch {
    return null
  }
}

function writeCachedPermissions(value: UserPermissions) {
  try {
    localStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function usePermissions(currentUser: { id: string } | null | undefined): UsePermissionsResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)

  const load = async () => {
    if (!currentUser) {
      setPermissions(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const delays = [0, 300, 900]
      let data: any = null
      let lastError: unknown = null

      for (let attempt = 0; attempt < delays.length; attempt += 1) {
        if (delays[attempt] > 0) await wait(delays[attempt])
        try {
          data = await apiFetch('/api/profile/full')
          break
        } catch (error) {
          lastError = error
          if (String((error as any)?.message || '') === 'AUTH_EXPIRED') {
            throw error
          }
        }
      }

      if (!data) {
        throw lastError || new Error('Falha ao carregar permissoes')
      }

      const normalized: UserPermissions = {
        groupId: data.group_id ?? null,
        groupName: data.group_name ?? null,
        displayName: data.display_name ?? null,
        permissionCodes: data.permission_codes ?? [],
      }

      setPermissions(normalized)
      writeCachedPermissions(normalized)
    } catch (error) {
      console.error('Erro ao carregar permissoes:', error)
      setError('Falha ao carregar permissoes. Tentando novamente em segundo plano.')
      const cached = readCachedPermissions()
      if (cached) {
        setPermissions(cached)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [currentUser?.id])

  const { can, canAny, canAll } = useMemo(() => {
    const codes = permissions?.permissionCodes ?? []

    const can = (code: string): boolean => {
      if (codes.includes('admin.*')) return true
      return codes.includes(code)
    }

    const canAny = (list: string[]): boolean => list.some((c) => can(c))
    const canAll = (list: string[]): boolean => list.every((c) => can(c))

    return { can, canAny, canAll }
  }, [permissions])

  return {
    loading,
    error,
    permissions,
    can,
    canAny,
    canAll,
    reload: load,
  }
}
