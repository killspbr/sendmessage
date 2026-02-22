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
      const data = await apiFetch('/api/profile/full')

      setPermissions({
        groupId: data.group_id ?? null,
        groupName: data.group_name ?? null,
        displayName: data.display_name ?? null,
        permissionCodes: data.permission_codes ?? [],
      })
    } catch (e: any) {
      console.error('Erro ao carregar permissões:', e)
      setError('Falha ao carregar permissões.')
      setPermissions({ groupId: null, groupName: null, displayName: null, permissionCodes: [] })
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
