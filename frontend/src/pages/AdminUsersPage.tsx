import { useEffect, useMemo, useState } from 'react'
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
  userName: string | null
  email: string | null
  phone: string | null
  groupId: string | null
  groupName: string | null
  useGlobalAi: boolean
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

const ROLE_ORDER = ['Administrador', 'Gerente', 'Operador', 'Visualizador'] as const

export function AdminUsersPage({
  can,
  debugEnabled,
  currentUserGroupName,
  impersonatedUserId,
  onImpersonateUser,
}: AdminUsersPageProps) {
  const canManageUsers = !can || can('admin.users')
  const currentRoleIndex = currentUserGroupName ? ROLE_ORDER.indexOf(currentUserGroupName as any) : -1

  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUserProfile[]>([])
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [permissions, setPermissions] = useState<AdminPermission[]>([])
  const [groupPermissions, setGroupPermissions] = useState<Record<string, Set<string>>>({})
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [userDraft, setUserDraft] = useState({ displayName: '', email: '', phone: '' })
  const [notifyMessage, setNotifyMessage] = useState('')
  const [savingPermission, setSavingPermission] = useState(false)
  const [savingUserGroupId, setSavingUserGroupId] = useState<string | null>(null)
  const [savingUserSettingsId, setSavingUserSettingsId] = useState<string | null>(null)
  const [savingUserProfileId, setSavingUserProfileId] = useState<string | null>(null)
  const [resetingPasswordId, setResetingPasswordId] = useState<string | null>(null)
  const [invalidatingSessionId, setInvalidatingSessionId] = useState<string | null>(null)
  const [invalidatingAll, setInvalidatingAll] = useState(false)
  const [sendingNotificationId, setSendingNotificationId] = useState<string | null>(null)

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) ?? null, [users, selectedUserId])
  const selectedGroup = useMemo(() => groups.find((g) => g.id === selectedGroupId) ?? null, [groups, selectedGroupId])
  const selectedGroupPerms = selectedGroupId ? groupPermissions[selectedGroupId] ?? new Set<string>() : new Set<string>()

  const resetFeedback = () => {
    setError(null)
    setSuccessMessage(null)
  }

  const loadAdminData = async () => {
    setLoading(true)
    resetFeedback()
    try {
      const [groupsData, permsData, groupPermsData, profilesData] = await Promise.all([
        apiFetch('/api/admin/groups'),
        apiFetch('/api/admin/permissions'),
        apiFetch('/api/admin/group-permissions'),
        apiFetch('/api/admin/users'),
      ])

      const mappedGroups: AdminGroup[] = (groupsData ?? []).map((g: any) => ({ id: g.id, name: g.name ?? '(sem nome)' }))
      const mappedPerms: AdminPermission[] = (permsData ?? []).map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name ?? null,
        description: p.description ?? null,
      }))
      const mappedUsers: AdminUserProfile[] = (profilesData ?? []).map((u: any) => ({
        id: u.id,
        displayName: u.display_name ?? null,
        userName: u.user_name ?? null,
        email: u.email ?? null,
        phone: u.phone ?? null,
        groupId: u.group_id ?? null,
        groupName: u.group_name ?? null,
        useGlobalAi: u.use_global_ai ?? true,
      }))
      const gpMap: Record<string, Set<string>> = {}
      for (const row of groupPermsData ?? []) {
        if (!gpMap[row.group_id]) gpMap[row.group_id] = new Set<string>()
        gpMap[row.group_id].add(row.permission_id)
      }

      setGroups(mappedGroups)
      setPermissions(mappedPerms)
      setUsers(mappedUsers)
      setGroupPermissions(gpMap)
      if (!selectedUserId && mappedUsers.length > 0) setSelectedUserId(mappedUsers[0].id)
      if (!selectedGroupId && mappedGroups.length > 0) setSelectedGroupId(mappedGroups[0].id)
    } catch (e) {
      console.error('Erro ao carregar dados administrativos:', e)
      setError('Não foi possível carregar os dados de usuários e grupos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canManageUsers) return
    void loadAdminData()
  }, [canManageUsers])

  useEffect(() => {
    if (!selectedUser) return
    setUserDraft({
      displayName: selectedUser.displayName || selectedUser.userName || '',
      email: selectedUser.email || '',
      phone: selectedUser.phone || '',
    })
    setNotifyMessage('')
  }, [selectedUser])

  const handleTogglePermission = async (groupId: string | null, permissionId: string, nextEnabled: boolean) => {
    if (!groupId || savingPermission) return
    setSavingPermission(true)
    resetFeedback()
    try {
      await apiFetch('/api/admin/group-permissions', {
        method: nextEnabled ? 'POST' : 'DELETE',
        body: JSON.stringify({ group_id: groupId, permission_id: permissionId }),
      })
      setGroupPermissions((prev) => {
        const next = { ...prev }
        const current = new Set(next[groupId] ?? [])
        if (nextEnabled) current.add(permissionId)
        else current.delete(permissionId)
        next[groupId] = current
        return next
      })
      setSuccessMessage('Permissões do grupo atualizadas com sucesso.')
    } catch (e) {
      console.error('Erro ao atualizar permissão:', e)
      setError('Falha ao atualizar as permissões do grupo.')
    } finally {
      setSavingPermission(false)
    }
  }

  const handleToggleAllPermissionsForSelectedGroup = async (nextEnabled: boolean) => {
    if (!selectedGroupId || permissions.length === 0 || savingPermission) return
    for (const permission of permissions) {
      const enabled = selectedGroupPerms.has(permission.id)
      if (enabled === nextEnabled) continue
      await handleTogglePermission(selectedGroupId, permission.id, nextEnabled)
    }
  }

  const handleChangeUserGroup = async (userId: string, newGroupId: string | '') => {
    const groupIdOrNull = newGroupId || null
    setSavingUserGroupId(userId)
    resetFeedback()
    try {
      await apiFetch(`/api/admin/users/${userId}/group`, {
        method: 'PUT',
        body: JSON.stringify({ group_id: groupIdOrNull }),
      })
      const group = groupIdOrNull ? groups.find((item) => item.id === groupIdOrNull) ?? null : null
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, groupId: groupIdOrNull, groupName: group?.name ?? null } : user,
        ),
      )
      setSuccessMessage('Grupo do usuário atualizado com sucesso.')
    } catch (e) {
      console.error('Erro ao alterar grupo do usuário:', e)
      setError('Falha ao alterar o grupo do usuário.')
    } finally {
      setSavingUserGroupId(null)
    }
  }

  const handleToggleUserSetting = async (userId: string, nextValue: boolean) => {
    if (savingUserSettingsId) return
    setSavingUserSettingsId(userId)
    resetFeedback()
    try {
      await apiFetch(`/api/admin/users/${userId}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ use_global_ai: nextValue }),
      })
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, useGlobalAi: nextValue } : user)))
      setSuccessMessage('Preferência de IA do usuário atualizada.')
    } catch (e) {
      console.error('Erro ao atualizar configuração do usuário:', e)
      setError('Falha ao atualizar a configuração de IA do usuário.')
    } finally {
      setSavingUserSettingsId(null)
    }
  }

  const handleSaveUserProfile = async () => {
    if (!selectedUser) return
    setSavingUserProfileId(selectedUser.id)
    resetFeedback()
    try {
      const updated = await apiFetch(`/api/admin/users/${selectedUser.id}/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          display_name: userDraft.displayName.trim() || null,
          email: userDraft.email.trim() || null,
          phone: userDraft.phone.trim() || null,
        }),
      })
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id
            ? {
              ...user,
              displayName: updated.display_name ?? null,
              userName: updated.user_name ?? null,
              email: updated.email ?? null,
              phone: updated.phone ?? null,
            }
            : user,
        ),
      )
      setSuccessMessage('Cadastro do usuário salvo com sucesso.')
    } catch (e) {
      console.error('Erro ao salvar cadastro do usuário:', e)
      setError('Falha ao salvar os dados do usuário.')
    } finally {
      setSavingUserProfileId(null)
    }
  }

  const handleSendNotification = async () => {
    if (!selectedUser || !notifyMessage.trim()) return
    setSendingNotificationId(selectedUser.id)
    resetFeedback()
    try {
      await apiFetch(`/api/admin/users/${selectedUser.id}/notify`, {
        method: 'POST',
        body: JSON.stringify({ message: notifyMessage.trim() }),
      })
      setNotifyMessage('')
      setSuccessMessage('Notificação enviada com sucesso.')
    } catch (e) {
      console.error('Erro ao enviar notificação ao usuário:', e)
      setError('Falha ao enviar a notificação ao usuário.')
    } finally {
      setSendingNotificationId(null)
    }
  }

  const handleResetPassword = async (userId: string, label: string) => {
    if (!window.confirm(`Resetar a senha de "${label}" para "123456" e invalidar as sessões?`)) return
    setResetingPasswordId(userId)
    resetFeedback()
    try {
      await apiFetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
      setSuccessMessage(`Senha de "${label}" resetada com sucesso.`)
    } catch (e) {
      console.error('Erro ao resetar senha:', e)
      setError('Falha ao resetar a senha do usuário.')
    } finally {
      setResetingPasswordId(null)
    }
  }

  const handleInvalidateUserSessions = async (userId: string, label: string) => {
    if (!window.confirm(`Deslogar "${label}" de todos os dispositivos?`)) return
    setInvalidatingSessionId(userId)
    resetFeedback()
    try {
      await apiFetch(`/api/admin/users/${userId}/invalidate-sessions`, { method: 'POST' })
      setSuccessMessage(`Sessões de "${label}" invalidadas.`)
    } catch (e) {
      console.error('Erro ao invalidar sessões do usuário:', e)
      setError('Falha ao invalidar as sessões do usuário.')
    } finally {
      setInvalidatingSessionId(null)
    }
  }

  const handleInvalidateAllSessions = async () => {
    if (!window.confirm('Deslogar todos os usuários do sistema?')) return
    setInvalidatingAll(true)
    resetFeedback()
    try {
      await apiFetch('/api/admin/invalidate-all-sessions', { method: 'POST' })
      setSuccessMessage('Todas as sessões foram invalidadas com sucesso.')
    } catch (e) {
      console.error('Erro ao invalidar todas as sessões:', e)
      setError('Falha ao invalidar todas as sessões.')
    } finally {
      setInvalidatingAll(false)
    }
  }

  if (!canManageUsers) {
    return <section className="max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Você não tem permissão para acessar esta área.</p></section>
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl shadow-slate-300/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">Administração</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Gestão de usuários e grupos</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Separei cadastro operacional de usuários e gestão de permissões em áreas diferentes para reduzir ruído.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${activeTab === 'users' ? 'bg-white text-slate-900' : 'text-slate-300'}`}
            >
              Usuários
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${activeTab === 'groups' ? 'bg-white text-slate-900' : 'text-slate-300'}`}
            >
              Grupos e permissões
            </button>
          </div>
        </div>
      </div>

      {(loading || error || successMessage) && (
        <div className="space-y-3">
          {loading && <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">Carregando dados administrativos...</div>}
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">{error}</div>}
          {successMessage && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">{successMessage}</div>}
        </div>
      )}

      {activeTab === 'users' ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Base de usuários</h2>
                <p className="text-sm text-slate-500">Selecione um usuário para editar cadastro, acesso e ações administrativas.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{users.length} usuário(s)</span>
            </div>
            <div className="mt-5 flex max-h-[640px] flex-col gap-2 overflow-y-auto pr-1">
              {users.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Nenhum usuário encontrado.</div>
              ) : (
                users.map((user) => {
                  const label = user.displayName || user.userName || user.email || 'Sem nome'
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${selectedUserId === user.id ? 'border-emerald-300 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">{label}</div>
                          <div className="truncate text-xs text-slate-500">{user.email || 'Sem e-mail cadastrado'}</div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                            <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{user.groupName || 'Sem grupo'}</span>
                            <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{user.phone || 'Sem telefone'}</span>
                          </div>
                        </div>
                        {debugEnabled && <span className="max-w-[120px] truncate font-mono text-[10px] text-slate-400">{user.id}</span>}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            {!selectedUser ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Selecione um usuário para editar os dados.</div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Cadastro do usuário</h2>
                    <p className="text-sm text-slate-500">Atualize dados do perfil, grupo, preferência de IA e ações operacionais.</p>
                  </div>
                  {onImpersonateUser && (
                    <button
                      type="button"
                      onClick={() => onImpersonateUser(impersonatedUserId === selectedUser.id ? null : selectedUser.id)}
                      className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${impersonatedUserId === selectedUser.id ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      {impersonatedUserId === selectedUser.id ? 'Sair do modo ver como' : 'Entrar no modo ver como'}
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Nome exibido</label>
                    <input type="text" value={userDraft.displayName} onChange={(e) => setUserDraft((prev) => ({ ...prev, displayName: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">E-mail</label>
                    <input type="email" value={userDraft.email} onChange={(e) => setUserDraft((prev) => ({ ...prev, email: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Telefone</label>
                    <input type="text" value={userDraft.phone} onChange={(e) => setUserDraft((prev) => ({ ...prev, phone: e.target.value.replace(/[^\d()+\s-]/g, '') }))} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Grupo</label>
                    <select value={selectedUser.groupId ?? ''} onChange={(e) => void handleChangeUserGroup(selectedUser.id, e.target.value)} disabled={savingUserGroupId === selectedUser.id} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70">
                      <option value="">Sem grupo</option>
                      {groups.filter((group) => {
                        if (currentRoleIndex < 0) return true
                        const targetIndex = ROLE_ORDER.indexOf(group.name as any)
                        if (targetIndex < 0) return true
                        return targetIndex >= currentRoleIndex
                      }).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Preferência de IA</div>
                        <div className="text-xs text-slate-500">Defina se esse usuário usa a chave global do sistema.</div>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={selectedUser.useGlobalAi} disabled={savingUserSettingsId === selectedUser.id} onChange={(e) => void handleToggleUserSetting(selectedUser.id, e.target.checked)} className="h-4 w-4 accent-emerald-500" />
                        <span>Usar IA global</span>
                      </label>
                    </div>
                  </div>
                  <button type="button" onClick={() => void handleSaveUserProfile()} disabled={savingUserProfileId === selectedUser.id} className="h-full min-h-[88px] rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70">
                    {savingUserProfileId === selectedUser.id ? 'Salvando...' : 'Salvar cadastro'}
                  </button>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 text-sm font-semibold text-slate-900">Notificação específica</div>
                    <p className="mb-3 text-xs text-slate-500">Disponível apenas para administradores. O envio usa a configuração Evolution do sistema.</p>
                    <textarea rows={5} value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} placeholder="Escreva a mensagem que deve ser enviada a esse usuário." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">{selectedUser.displayName || selectedUser.userName || selectedUser.email}</div>
                    <div className="mt-1 text-xs text-slate-500">{selectedUser.phone || 'Sem telefone cadastrado'}</div>
                    <div className="mt-1 text-xs text-slate-500">{selectedUser.groupName || 'Sem grupo'}</div>
                    <button type="button" onClick={() => void handleSendNotification()} disabled={sendingNotificationId === selectedUser.id || !notifyMessage.trim() || !selectedUser.phone} className="mt-4 h-11 w-full rounded-2xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                      {sendingNotificationId === selectedUser.id ? 'Enviando...' : 'Enviar notificação'}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button type="button" onClick={() => void handleResetPassword(selectedUser.id, selectedUser.displayName || selectedUser.userName || selectedUser.email || 'usuário')} disabled={resetingPasswordId === selectedUser.id} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70">
                    {resetingPasswordId === selectedUser.id ? 'Resetando senha...' : 'Resetar senha para 123456'}
                  </button>
                  <button type="button" onClick={() => void handleInvalidateUserSessions(selectedUser.id, selectedUser.displayName || selectedUser.userName || selectedUser.email || 'usuário')} disabled={invalidatingSessionId === selectedUser.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70">
                    {invalidatingSessionId === selectedUser.id ? 'Invalidando sessões...' : 'Deslogar usuário de todos os dispositivos'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Grupos</h2>
                <p className="text-sm text-slate-500">Selecione um grupo para revisar e ajustar permissões.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{groups.length} grupo(s)</span>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              {groups.map((group) => {
                const count = users.filter((user) => user.groupId === group.id).length
                return (
                  <button key={group.id} type="button" onClick={() => setSelectedGroupId(group.id)} className={`rounded-2xl border px-4 py-4 text-left transition ${selectedGroupId === group.id ? 'border-emerald-300 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{group.name}</div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{count} usuário(s)</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selectedGroup ? `Permissões de ${selectedGroup.name}` : 'Permissões do grupo'}</h2>
                <p className="text-sm text-slate-500">Marque apenas o que esse grupo realmente precisa acessar.</p>
              </div>
              {selectedGroup && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => void handleToggleAllPermissionsForSelectedGroup(true)} disabled={savingPermission} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70">Marcar todas</button>
                  <button type="button" onClick={() => void handleToggleAllPermissionsForSelectedGroup(false)} disabled={savingPermission} className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70">Limpar todas</button>
                </div>
              )}
            </div>
            {!selectedGroup ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Selecione um grupo para ver as permissões.</div>
            ) : (
              <div className="mt-5 grid gap-3">
                {permissions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Nenhuma permissão cadastrada.</div>
                ) : (
                  permissions.map((permission) => {
                    const enabled = selectedGroupPerms.has(permission.id)
                    return (
                      <label key={permission.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${enabled ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                        <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-500" checked={enabled} disabled={savingPermission} onChange={() => void handleTogglePermission(selectedGroupId, permission.id, !enabled)} />
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-semibold text-slate-800">{permission.code}</div>
                          <div className="mt-1 text-sm text-slate-700">{permission.name || 'Permissão sem nome amigável'}</div>
                          {permission.description && <div className="mt-1 text-xs text-slate-500">{permission.description}</div>}
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-amber-900">Ações globais de segurança</h2>
            <p className="text-sm text-amber-800/80">Esta ação força todos os usuários a fazer login novamente.</p>
          </div>
          <button type="button" onClick={() => void handleInvalidateAllSessions()} disabled={invalidatingAll} className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70">
            {invalidatingAll ? 'Invalidando...' : 'Invalidar sessões de todos'}
          </button>
        </div>
      </div>
    </section>
  )
}
