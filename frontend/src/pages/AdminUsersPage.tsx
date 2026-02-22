import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

type AdminUsersPageProps = {
  can?: (code: string) => boolean
  debugEnabled?: boolean
  currentUserGroupName?: string | null
  impersonatedUserId?: string | null
  onImpersonateUser?: (userId: string | null) => void
}

type AdminUserProfile = {
  id: string
  displayName: string | null
  groupId: string | null
  groupName: string | null
  useGlobalAi: boolean
  useGlobalWebhooks: boolean
  webhookWhatsappUrl: string | null
  webhookEmailUrl: string | null
}

type AdminGroup = {
  id: string
  name: string
}

type AdminPermission = {
  id: string
  code: string
  name: string | null
  description: string | null
}

export function AdminUsersPage({
  can,
  debugEnabled,
  currentUserGroupName,
  impersonatedUserId,
  onImpersonateUser,
}: AdminUsersPageProps) {
  const canManageUsers = !can || can('admin.users')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [users, setUsers] = useState<AdminUserProfile[]>([])
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [permissions, setPermissions] = useState<AdminPermission[]>([])
  const [groupPermissions, setGroupPermissions] = useState<Record<string, Set<string>>>({})
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [savingPermission, setSavingPermission] = useState<boolean>(false)
  const [savingUserGroupId, setSavingUserGroupId] = useState<string | null>(null)
  const [savingUserSettingsId, setSavingUserSettingsId] = useState<string | null>(null)
  const [editingWebhookUserId, setEditingWebhookUserId] = useState<string | null>(null)
  const [webhookWhatsappInput, setWebhookWhatsappInput] = useState('')
  const [webhookEmailInput, setWebhookEmailInput] = useState('')

  const handleToggleUserSetting = async (
    userId: string,
    field: 'use_global_ai' | 'use_global_webhooks',
    nextValue: boolean,
  ) => {
    if (savingUserSettingsId) return

    setSavingUserSettingsId(userId)
    setError(null)

    try {
      await apiFetch(`/api/admin/users/${userId}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: nextValue })
      })

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
              ...u,
              useGlobalAi: field === 'use_global_ai' ? nextValue : u.useGlobalAi,
              useGlobalWebhooks:
                field === 'use_global_webhooks' ? nextValue : u.useGlobalWebhooks,
            }
            : u,
        ),
      )
    } catch (e) {
      console.error('Erro ao atualizar configurações do usuário:', e)
      setError('Erro ao atualizar configurações do usuário.')
    } finally {
      setSavingUserSettingsId(null)
    }
  }

  const loadAdminData = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1) Carrega grupos
      const groupsData = await apiFetch('/api/admin/groups')
      const mappedGroups: AdminGroup[] = (groupsData ?? []).map((g: any) => ({
        id: g.id,
        name: g.name ?? '(sem nome)',
      }))
      setGroups(mappedGroups)

      if (!selectedGroupId && mappedGroups.length > 0) {
        setSelectedGroupId(mappedGroups[0].id)
      }

      // 2) Carrega permissões
      const permsData = await apiFetch('/api/admin/permissions')
      const mappedPerms: AdminPermission[] = (permsData ?? []).map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name ?? null,
        description: null,
      }))
      setPermissions(mappedPerms)

      // 3) Carrega relação grupo-permissão
      const groupPermsData = await apiFetch('/api/admin/group-permissions')
      const gpMap: Record<string, Set<string>> = {}
      for (const row of groupPermsData ?? []) {
        const gid = row.group_id as string
        const pid = row.permission_id as string
        if (!gid || !pid) continue
        if (!gpMap[gid]) gpMap[gid] = new Set<string>()
        gpMap[gid].add(pid)
      }
      setGroupPermissions(gpMap)

      // 4) Carrega perfis de usuário
      const profilesData = await apiFetch('/api/admin/users')
      const mappedUsers: AdminUserProfile[] = (profilesData ?? []).map((u: any) => ({
        id: u.id,
        displayName: u.display_name ?? null,
        groupId: u.group_id ?? null,
        groupName: u.group_name ?? null,
        useGlobalAi: u.use_global_ai ?? true,
        useGlobalWebhooks: u.use_global_webhooks ?? true,
        webhookWhatsappUrl: u.webhook_whatsapp_url ?? null,
        webhookEmailUrl: u.webhook_email_url ?? null,
      }))
      setUsers(mappedUsers)
    } catch (e) {
      console.error('Erro ao carregar dados de administração:', e)
      setError('Erro ao carregar dados de administração.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canManageUsers) return
    void loadAdminData()
  }, [canManageUsers])

  if (!canManageUsers) {
    return (
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 md:p-5 max-w-xl">
        <p className="text-[12px] md:text-[13px] text-slate-500">
          Você não tem permissão para acessar a gestão de usuários e grupos.
        </p>
      </section>
    )
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null
  const selectedGroupPerms = selectedGroupId ? groupPermissions[selectedGroupId] ?? new Set<string>() : new Set<string>()

  // Hierarquia simples baseada no nome dos grupos
  const ROLE_ORDER = ['Administrador', 'Gerente', 'Operador', 'Visualizador'] as const
  const currentRoleIndex = currentUserGroupName ? ROLE_ORDER.indexOf(currentUserGroupName as any) : -1

  const handleTogglePermission = async (groupId: string | null, permissionId: string, nextEnabled: boolean) => {
    if (!groupId || savingPermission) return

    setSavingPermission(true)
    setError(null)

    try {
      if (nextEnabled) {
        await apiFetch('/api/admin/group-permissions', {
          method: 'POST',
          body: JSON.stringify({ group_id: groupId, permission_id: permissionId })
        })

        setGroupPermissions((prev) => {
          const next: Record<string, Set<string>> = { ...prev }
          const current = new Set(next[groupId] ?? [])
          current.add(permissionId)
          next[groupId] = current
          return next
        })
      } else {
        await apiFetch('/api/admin/group-permissions', {
          method: 'DELETE',
          body: JSON.stringify({ group_id: groupId, permission_id: permissionId })
        })

        setGroupPermissions((prev) => {
          const next: Record<string, Set<string>> = { ...prev }
          const current = new Set(next[groupId] ?? [])
          current.delete(permissionId)
          next[groupId] = current
          return next
        })
      }
    } catch (e) {
      console.error('Erro ao atualizar permissão do grupo:', e)
      setError('Erro ao atualizar permissão do grupo.')
    } finally {
      setSavingPermission(false)
    }
  }

  const handleToggleAllPermissionsForSelectedGroup = async (nextEnabled: boolean) => {
    if (!selectedGroupId || savingPermission || permissions.length === 0) return
    setError(null)
    for (const perm of permissions) {
      const isCurrentlyEnabled = selectedGroupPerms.has(perm.id)
      if (nextEnabled === isCurrentlyEnabled) continue
      await handleTogglePermission(selectedGroupId, perm.id, nextEnabled)
    }
  }

  const handleChangeUserGroup = async (userId: string, newGroupId: string | '') => {
    const groupIdOrNull = newGroupId === '' ? null : newGroupId

    setSavingUserGroupId(userId)
    setError(null)

    try {
      await apiFetch(`/api/admin/users/${userId}/group`, {
        method: 'PUT',
        body: JSON.stringify({ group_id: groupIdOrNull })
      })

      const group = groupIdOrNull ? groups.find((g) => g.id === groupIdOrNull) ?? null : null

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
              ...u,
              groupId: groupIdOrNull,
              groupName: group?.name ?? null,
            }
            : u,
        ),
      )
    } catch (e) {
      console.error('Erro ao atualizar grupo do usuário:', e)
      setError('Erro ao atualizar grupo do usuário.')
    } finally {
      setSavingUserGroupId(null)
    }
  }

  const handleSaveWebhooks = async (userId: string) => {
    if (!userId) return

    setSavingUserSettingsId(userId)
    setError(null)

    try {
      await apiFetch(`/api/admin/users/${userId}/settings`, {
        method: 'PUT',
        body: JSON.stringify({
          webhook_whatsapp_url: webhookWhatsappInput.trim() || null,
          webhook_email_url: webhookEmailInput.trim() || null,
        })
      })

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
              ...u,
              webhookWhatsappUrl: webhookWhatsappInput.trim() || null,
              webhookEmailUrl: webhookEmailInput.trim() || null,
            }
            : u,
        ),
      )

      setEditingWebhookUserId(null)
      setWebhookWhatsappInput('')
      setWebhookEmailInput('')
    } catch (e) {
      console.error('Erro ao atualizar webhooks do usuário:', e)
      setError('Erro ao atualizar webhooks do usuário.')
    } finally {
      setSavingUserSettingsId(null)
    }
  }

  const handleStartEditWebhooks = (user: AdminUserProfile) => {
    setEditingWebhookUserId(user.id)
    setWebhookWhatsappInput(user.webhookWhatsappUrl || '')
    setWebhookEmailInput(user.webhookEmailUrl || '')
  }

  const handleCancelEditWebhooks = () => {
    setEditingWebhookUserId(null)
    setWebhookWhatsappInput('')
    setWebhookEmailInput('')
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 md:p-5 flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Usuários e grupos</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Visualize quais usuários estão associados a cada grupo e quais permissões cada grupo possui.
          </p>
        </div>
        {(loading || savingPermission) && (
          <span className="text-[10px] text-slate-500">
            {loading ? 'Carregando…' : 'Salvando alterações…'}
          </span>
        )}
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Usuários */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-slate-800">Usuários</h3>
          <p className="text-[11px] text-slate-500">
            Lista de perfis cadastrados e seus grupos atuais.
          </p>
          <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50/80 max-h-80 overflow-auto">
            {users.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-slate-500">Nenhum usuário encontrado.</div>
            ) : (
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium text-slate-600">Nome</th>
                    {debugEnabled && (
                      <th className="px-2 py-1 text-left font-medium text-slate-600">UID interno</th>
                    )}
                    <th className="px-2 py-1 text-left font-medium text-slate-600">Grupo</th>
                    <th className="px-2 py-1 text-left font-medium text-slate-600">IA global</th>
                    <th className="px-2 py-1 text-left font-medium text-slate-600">Webhooks</th>
                    <th className="px-2 py-1 text-left font-medium text-slate-600">Ver como</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-100/60">
                      <td className="px-2 py-1 align-top text-slate-700">
                        {u.displayName || <span className="text-slate-400">(sem nome)</span>}
                      </td>
                      {debugEnabled && (
                        <td className="px-2 py-1 align-top font-mono text-[10px] text-slate-500 break-all">
                          {u.id}
                        </td>
                      )}
                      <td className="px-2 py-1 align-top text-slate-700">
                        <select
                          className="w-full h-7 px-1.5 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80 disabled:opacity-50 disabled:cursor-not-allowed"
                          value={u.groupId ?? ''}
                          onChange={(e) => handleChangeUserGroup(u.id, e.target.value)}
                          disabled={savingUserGroupId === u.id}
                        >
                          <option value="">(sem grupo)</option>
                          {groups
                            .filter((g) => {
                              if (currentRoleIndex < 0) return true
                              const targetIndex = ROLE_ORDER.indexOf(g.name as any)
                              if (targetIndex < 0) return true
                              return targetIndex >= currentRoleIndex
                            })
                            .map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="px-2 py-1 align-top text-slate-700">
                        <label className="inline-flex items-center gap-1 text-[10px] text-slate-600">
                          <input
                            type="checkbox"
                            className="h-3 w-3 accent-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
                            checked={u.useGlobalAi}
                            disabled={savingUserSettingsId === u.id}
                            onChange={(e) =>
                              void handleToggleUserSetting(u.id, 'use_global_ai', e.target.checked)
                            }
                          />
                          <span>Usar global</span>
                        </label>
                      </td>
                      <td className="px-2 py-1 align-top text-slate-700">
                        {editingWebhookUserId === u.id ? (
                          <div className="flex flex-col gap-1.5 min-w-[200px]">
                            <input
                              type="text"
                              placeholder="Webhook WhatsApp"
                              value={webhookWhatsappInput}
                              onChange={(e) => setWebhookWhatsappInput(e.target.value)}
                              className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                            />
                            <input
                              type="text"
                              placeholder="Webhook Email"
                              value={webhookEmailInput}
                              onChange={(e) => setWebhookEmailInput(e.target.value)}
                              className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                            />
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleSaveWebhooks(u.id)}
                                disabled={savingUserSettingsId === u.id}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditWebhooks}
                                disabled={savingUserSettingsId === u.id}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[10px] text-slate-600">
                              <span className="font-medium">WhatsApp:</span>{' '}
                              {u.webhookWhatsappUrl ? (
                                <span className="text-slate-700 break-all">{u.webhookWhatsappUrl}</span>
                              ) : (
                                <span className="text-slate-400 italic">não configurado</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-600">
                              <span className="font-medium">Email:</span>{' '}
                              {u.webhookEmailUrl ? (
                                <span className="text-slate-700 break-all">{u.webhookEmailUrl}</span>
                              ) : (
                                <span className="text-slate-400 italic">não configurado</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartEditWebhooks(u)}
                              className="mt-1 px-2 py-0.5 rounded-md text-[10px] bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 self-start"
                            >
                              Editar webhooks
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1 align-top text-slate-700">
                        {onImpersonateUser && (
                          <button
                            type="button"
                            className={`px-2 py-0.5 rounded-md text-[10px] border ${impersonatedUserId === u.id
                                ? 'bg-violet-600 text-white border-violet-700'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            onClick={() =>
                              onImpersonateUser(impersonatedUserId === u.id ? null : u.id)
                            }
                          >
                            {impersonatedUserId === u.id ? 'Sair do modo ver como' : 'Ver como'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Grupos */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-slate-800">Grupos</h3>
          <p className="text-[11px] text-slate-500">
            Cada grupo representa um perfil de acesso (ex: Admin, Operador, Somente leitura).
          </p>
          <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50/80 max-h-80 overflow-auto px-2 py-2 flex flex-col gap-1.5">
            {groups.length === 0 ? (
              <div className="px-1 py-0.5 text-[11px] text-slate-500">Nenhum grupo encontrado.</div>
            ) : (
              groups.map((g) => {
                const isSelected = g.id === selectedGroupId
                const userCount = users.filter((u) => u.groupId === g.id).length
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-[11px] border transition ${isSelected
                        ? 'bg-violet-50 border-violet-300 text-violet-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    onClick={() => setSelectedGroupId(g.id)}
                  >
                    <span className="truncate">{g.name}</span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{userCount} usuário(s)</span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Permissões do grupo selecionado */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-800">Permissões do grupo selecionado</h3>
              <p className="text-[11px] text-slate-500">
                Marque ou desmarque as permissões que este grupo deve possuir.
              </p>
            </div>
            {selectedGroup && permissions.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-[11px] hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Marcar todas"
                  disabled={savingPermission}
                  onClick={() => void handleToggleAllPermissionsForSelectedGroup(true)}
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-300 bg-red-50 text-[11px] text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Desmarcar todas"
                  disabled={savingPermission}
                  onClick={() => void handleToggleAllPermissionsForSelectedGroup(false)}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50/80 max-h-80 overflow-auto">
            {!selectedGroup ? (
              <div className="px-3 py-2 text-[11px] text-slate-500">Selecione um grupo para ver suas permissões.</div>
            ) : permissions.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-slate-500">Nenhuma permissão cadastrada.</div>
            ) : (
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium text-slate-600 w-7">&nbsp;</th>
                    <th className="px-2 py-1 text-left font-medium text-slate-600">Código</th>
                    <th className="px-2 py-1 text-left font-medium text-slate-600">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((p) => {
                    const enabled = selectedGroupPerms.has(p.id)
                    return (
                      <tr key={p.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-100/60">
                        <td className="px-2 py-1 align-top">
                          <input
                            type="checkbox"
                            className="h-3 w-3 accent-emerald-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            checked={enabled}
                            disabled={savingPermission}
                            onChange={() => handleTogglePermission(selectedGroupId, p.id, !enabled)}
                          />
                        </td>
                        <td className="px-2 py-1 align-top font-mono text-[10px] text-slate-800">{p.code}</td>
                        <td className="px-2 py-1 align-top text-slate-700">
                          {p.name || <span className="text-slate-400">(sem descrição)</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
