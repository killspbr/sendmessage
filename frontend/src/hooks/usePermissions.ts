import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

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
}

/**
 * Hook centralizado de permissões.
 * Recebe o usuário atual (auth) e carrega grupo + permissões do Supabase.
 */
export function usePermissions(currentUser: { id: string } | null | undefined): UsePermissionsResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)

  useEffect(() => {
    if (!currentUser) {
      setPermissions(null)
      setError(null)
      return
    }

    let isMounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        // 1) Carrega perfil + grupo
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, display_name, group_id, user_groups(name)')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (!isMounted) return

        if (profileError) {
          console.error('Erro ao carregar user_profiles:', profileError)
          setError('Erro ao carregar perfil de usuário.')
          setPermissions({ groupId: null, groupName: null, displayName: null, permissionCodes: [] })
          return
        }

        if (!profile || !profile.group_id) {
          // Usuário sem grupo definido ainda
          const displayName = (profile as any)?.display_name ?? null
          setPermissions({ groupId: null, groupName: null, displayName, permissionCodes: [] })
          setLoading(false)
          return
        }

        const groupId = profile.group_id as string
        const groupName = (profile as any).user_groups?.name ?? null
        const displayName = (profile as any).display_name ?? null

        // 2) Carrega permissões do grupo (permission_id) sem depender de relacionamento configurado
        const { data: groupPermRows, error: groupPermsError } = await supabase
          .from('group_permissions')
          .select('permission_id')
          .eq('group_id', groupId)

        if (!isMounted) return

        if (groupPermsError) {
          console.error('Erro ao carregar group_permissions:', groupPermsError)
          setError('Erro ao carregar permissões do usuário.')
          setPermissions({ groupId, groupName, displayName, permissionCodes: [] })
          return
        }

        const permissionIds: string[] = (groupPermRows ?? [])
          .map((row: any) => row.permission_id)
          .filter((id: any): id is string => typeof id === 'string' && id.length > 0)

        if (permissionIds.length === 0) {
          setPermissions({ groupId, groupName, displayName, permissionCodes: [] })
          return
        }

        const { data: permissionsRows, error: permsError } = await supabase
          .from('permissions')
          .select('code')
          .in('id', permissionIds)

        if (!isMounted) return

        if (permsError) {
          console.error('Erro ao carregar permissions:', permsError)
          setError('Erro ao carregar permissões do usuário.')
          setPermissions({ groupId, groupName, displayName, permissionCodes: [] })
          return
        }

        const codes: string[] = (permissionsRows ?? [])
          .map((row: any) => row.code)
          .filter((c: any): c is string => typeof c === 'string')

        setPermissions({ groupId, groupName, displayName, permissionCodes: codes })
      } catch (e: any) {
        if (!isMounted) return
        console.error('Erro inesperado ao carregar permissões:', e)
        setError('Erro inesperado ao carregar permissões.')
        setPermissions({ groupId: null, groupName: null, displayName: null, permissionCodes: [] })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [currentUser?.id])

  const { can, canAny, canAll } = useMemo(() => {
    const codes = permissions?.permissionCodes ?? []

    const can = (code: string): boolean => {
      // Admin global (se no futuro existir algo como 'admin.*')
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
  }
}
