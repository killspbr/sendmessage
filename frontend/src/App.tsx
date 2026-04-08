import { useState, useMemo, lazy, Suspense } from 'react'

// Layout & Components
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { VersionUpdater } from './components/common/VersionUpdater'

// Lazy loaded pages for performance
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const CampaignsPage = lazy(() => import('./pages/CampaignsPage').then(m => ({ default: m.CampaignsPage })))
const ContactsPage = lazy(() => import('./pages/ContactsPage').then(m => ({ default: m.ContactsPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })))
const AdminWarmerPage = lazy(() => import('./pages/AdminWarmerPage').then(m => ({ default: m.AdminWarmerPage })))
const UserSettingsPage = lazy(() => import('./pages/UserSettingsPage').then(m => ({ default: m.UserSettingsPage })))
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })))
const SchedulesPage = lazy(() => import('./pages/SchedulesPage').then(m => ({ default: m.SchedulesPage })))
const GeminiKeysPage = lazy(() => import('./pages/GeminiKeysPage'))
const SecurityDashboardPage = lazy(() => import('./pages/SecurityDashboardPage'))

// Custom Hooks
import { useAuth } from './hooks/useAuth'
import { usePermissions } from './hooks/usePermissions'
import { useSettings } from './hooks/useSettings'
import { usePresence } from './hooks/usePresence'
import { useAppVersion } from './hooks/useAppVersion'
import { useContacts } from './hooks/useContacts'
import { useLists } from './hooks/useLists'
import { useCampaigns } from './hooks/useCampaigns'
import { useSendHistory } from './hooks/useSendHistory'
import { useCampaignComposer } from './hooks/useCampaignComposer'
import { useCampaignExecution } from './hooks/useCampaignExecution'
import { useContactFilters } from './hooks/useContactFilters'
import { useContactsManager } from './hooks/useContactsManager'
import { useGeminiAI } from './hooks/useGeminiAI'
import { useToast } from './hooks/useToast'
import { useUI } from './hooks/useUI'
import { useChat } from './hooks/useChat'

// Utilities & Types
import type { Campaign, Contact, ContactList } from './types'
import { apiFetch } from './api'

function App() {
  // 1. UI & Orchestration States
  const {
    currentPage, setCurrentPage,
    isMobileMenuOpen, setIsMobileMenuOpen,
    debugEnabled, setDebugEnabled,
    impersonatedUserId, setImpersonatedUserId,
  } = useUI()

  const { toastMessage, showToast } = useToast()
  const chat = useChat()
  
  // 1.1 Auth states
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login')
  const [rememberMe, setRememberMe] = useState(true)
  const [localAuthError, setLocalAuthError] = useState<string|null>(null)
  const [showResetPrompt, setShowResetPrompt] = useState(false)

  // 2. Authentication & Guard
  const { currentUser, authLoading, authError, requiresPasswordReset, login, logout } = useAuth()

  // 3. Configuration & Guard
  const effectiveUserId = impersonatedUserId || currentUser?.id || null
  const {
    userSettings, globalSettings, setUserSettings,
    handleSaveUserOverrides, handleSaveGlobalSettings,
    geminiApiKey, setGeminiApiKey,
    evolutionApiUrl, setEvolutionApiUrl,
    evolutionApiKey, setEvolutionApiKey,
    evolutionInstance, setEvolutionInstance,
    geminiModel, setGeminiModel,
    geminiApiVersion, setGeminiApiVersion,
    geminiTemperature, setGeminiTemperature,
    geminiMaxTokens, setGeminiMaxTokens,
    googleMapsApiKey, setGoogleMapsApiKey,
    sendIntervalMinSeconds, setSendIntervalMinSeconds,
    sendIntervalMaxSeconds, setSendIntervalMaxSeconds,
  } = useSettings({ effectiveUserId, currentUserId: currentUser?.id || null })

  // 4. RBAC
  const { permissions, can } = usePermissions(effectiveUserId ? { id: effectiveUserId } : null)

  // 5. App versioning
  const { updateAvailable, forceUpdate, handleForceUpdate, APP_VERSION } = useAppVersion()

  // 6. Monitoring & Presence
  const { activeUserPresence, warmerPairs } = usePresence({
    currentUserId: currentUser?.id || null,
    currentPage,
    canAdminUsers: can('admin.users')
  })

  // 7. Base Entities
  const {
    lists, currentListId, setCurrentListId,
    createList, renameList, deleteList, reloadLists, setLists
  } = useLists({ effectiveUserId })

  const {
    contactsByList, reloadContacts, setContactsByList,
    deleteContact, saveContact
  } = useContacts({ effectiveUserId, currentListId })

  const currentContacts = useMemo(() => contactsByList[currentListId] || [], [contactsByList, currentListId])

  const { campaigns, reloadCampaigns, setCampaigns } = useCampaigns({ effectiveUserId })

  const {
    contactSendHistory, campaignSendLog, sendHistory,
    reloadContactSendHistory, setContactSendHistory, pagination
  } = useSendHistory({ effectiveUserId })

  // 8. Specialized Business Logic
  const {
    searchName, setSearchName, searchPhone, setSearchPhone,
    searchEmail, setSearchEmail, filterCategory, setFilterCategory,
    filterCity, setFilterCity, filterContacts, selectedIds, setSelectedIds,
    moveTargetListId, setMoveTargetListId, handleToggleSelectAll,
    handleToggleSelectOne, handleClearFilters
  } = useContactFilters()

  const filteredContacts = useMemo(() => filterContacts(currentContacts), [filterContacts, currentContacts])

  const contactsManager = useContactsManager(effectiveUserId, currentListId)
  const composer = useCampaignComposer()
  const execution = useCampaignExecution({
    effectiveUserId,
    lists,
    contactsByList,
    contactSendHistory,
    userSettings,
    globalSettings,
    onSetCampaigns: setCampaigns,
    onShowToast: showToast,
    onReloadContactSendHistory: reloadContactSendHistory,
    onSetContactsByList: setContactsByList as any,
    onSetContactSendHistory: setContactSendHistory as any
  })

  // AI helper hook
  const useGlobalAi = userSettings?.use_global_ai ?? true
  const userAiKey = userSettings?.ai_api_key || null
  const effectiveAiKey = useGlobalAi ? '__global_pool__' : userAiKey || ''
  const userHasConfiguredAi = useGlobalAi || (!useGlobalAi && !!userAiKey)

  // 8.1 Reporting & Specialized States
  const [reportCampaignId, setReportCampaignId] = useState<string | null>(null)
  const [reportViewMode, setReportViewMode] = useState<'all'|'last'>('all')

  const htmlToWhatsapp = (html: string) => html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]*>/g, '')
  const htmlToText = (html: string) => html.replace(/<[^>]*>/g, '')
  const onScheduleCampaign = async (id: string, config: any) => { 
    try {
      await apiFetch(`/api/campaigns/${id}/schedule`, { method: 'POST', body: JSON.stringify(config) })
      reloadCampaigns()
      showToast('Campanha agendada')
    } catch { showToast('Erro ao agendar') }
  }

  const { callGeminiForCampaign } = useGeminiAI({
    effectiveAiKey,
    userCompanyInfo: userSettings?.company_info,
    geminiTemperature: Number(globalSettings?.gemini_temperature ?? 0.7),
    geminiMaxTokens: Number(globalSettings?.gemini_max_tokens ?? 4096),
    geminiModel: globalSettings?.gemini_model ?? 'gemini-2.0-flash',
    geminiApiVersion: globalSettings?.gemini_api_version ?? 'v1',
  })

  // 9. Modals & Local Handlers
  const [listModalMode, setListModalMode] = useState<'create'|'rename'|null>(null)
  const [listModalName, setListModalName] = useState('')
  const [confirmDeleteListOpen, setConfirmDeleteListOpen] = useState(false)

  const handleConfirmListModal = async () => {
    if (!listModalName.trim()) return
    try {
      if (listModalMode === 'create') {
        const newList = await createList(listModalName)
        setCurrentListId(newList.id)
        showToast('Lista criada')
      } else {
        await renameList(currentListId, listModalName)
        showToast('Lista renomeada')
      }
      setListModalMode(null); setListModalName('')
    } catch { showToast('Erro na operação de lista') }
  }

  const handleConfirmDeleteList = async () => {
    try {
      await deleteList(currentListId)
      showToast('Lista excluída')
      setConfirmDeleteListOpen(false)
    } catch { showToast('Erro ao excluir lista') }
  }

  // Views logic
  if (authLoading) return <div className="h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500" /></div>
  if (!currentUser) return (
    <AuthPage
      authMode={authMode as any}
      authEmail={authEmail}
      authPassword={authPassword}
      authName={authName}
      authError={authError || localAuthError}
      rememberMe={rememberMe}
      showResetPrompt={showResetPrompt}
      onSetAuthMode={setAuthMode as any}
      onSetAuthEmail={setAuthEmail}
      onSetAuthPassword={setAuthPassword}
      onSetAuthName={setAuthName}
      onToggleRememberMe={() => setRememberMe(!rememberMe)}
      onSetAuthError={setLocalAuthError}
      onSubmit={async () => {
        setShowResetPrompt(false)
        try {
          if (authMode === 'login') await login({ email: authEmail, password: authPassword })
          else await login({ email: authEmail, password: authPassword, name: authName })
        } catch {
          if (requiresPasswordReset) {
            setShowResetPrompt(true)
          }
        }
      }}
    />
  )
  
  if (forceUpdate) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-2">Atualização Disponível</h2>
          <p className="text-sm text-slate-600 mb-4">Atualize para continuar usando a plataforma.</p>
          <button onClick={handleForceUpdate} className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold">Atualizar Agora</button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row overflow-hidden relative">
      <Sidebar currentPage={currentPage} onChangePage={setCurrentPage} can={can} userEmail={currentUser.email} userName={permissions?.displayName || currentUser.name} onSignOut={logout} impersonatedUserId={impersonatedUserId} onClearImpersonation={() => setImpersonatedUserId(null)} isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={() => setIsMobileMenuOpen(false)} />

      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/40 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {updateAvailable && <div className="shrink-0 bg-emerald-600 text-white text-xs py-2 px-4 text-center">Nova versão! <button onClick={() => window.location.reload()} className="underline font-bold">Atualizar</button></div>}
        
        <Header currentPage={currentPage} onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        {impersonatedUserId && <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 flex justify-between"><span>Ver como usuário: {impersonatedUserId}</span><button onClick={() => setImpersonatedUserId(null)} className="underline">Sair</button></div>}

        {execution.sendingCampaignId && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-800">
            <span>Enviando... ({execution.sendingCurrentIndex}/{execution.sendingTotal}) {execution.sendingNextDelaySeconds ? `· Próximo em ${execution.sendingNextDelaySeconds}s` : ''}</span>
            <button onClick={() => execution.setSendingCampaignId(null)} className="text-red-600 font-bold px-2 py-0.5 border border-red-300 rounded">Pausar</button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <Suspense fallback={
                <div className="h-48 flex items-center justify-center">
                    <div className="h-8 w-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                </div>
            }>
            {currentPage === 'dashboard' && (
              <DashboardPage
                contactsByList={contactsByList} contacts={currentContacts} lists={lists} currentListId={currentListId}
                campaigns={campaigns} sendHistory={sendHistory} campaignSendLog={campaignSendLog}
                sendingCampaignId={execution.sendingCampaignId} sendingCurrentIndex={execution.sendingCurrentIndex}
                sendingTotal={execution.sendingTotal} sendingErrors={execution.sendingErrors}
                hasEvolutionConfigured={!!(globalSettings?.evolution_api_url || userSettings?.evolution_url)}
                activeUserPresence={activeUserPresence} warmerPairs={warmerPairs} onNavigate={setCurrentPage}
                onNavigateToWarmer={() => setCurrentPage('warmer')} can={can} showAdminPresenceCard={can('admin.users')}
                onCreateCampaign={() => { setCurrentPage('campaigns'); composer.setCampaignEditorOpen(true) }}
                onEditCampaign={(c) => { setCurrentPage('campaigns'); composer.startEditCampaign(c, lists) }}
              />
            )}

            {currentPage === 'contacts' && (
              <ContactsPage
                contacts={currentContacts} filteredContacts={filteredContacts} lists={lists} sortedLists={lists}
                currentListId={currentListId} contactSendHistory={contactSendHistory} selectedIds={selectedIds}
                moveTargetListId={moveTargetListId} showContactForm={contactsManager.showContactForm}
                editingContactId={contactsManager.editingContactId} contactFormName={contactsManager.contactFormName}
                contactFormPhone={contactsManager.contactFormPhone} contactFormCategory={contactsManager.contactFormCategory}
                contactFormEmail={contactsManager.contactFormEmail} contactFormCep={contactsManager.contactFormCep}
                contactFormAddress={contactsManager.contactFormAddress} contactFormCity={contactsManager.contactFormCity}
                contactFormRating={contactsManager.contactFormRating}
                contactFormLabels={contactsManager.contactFormLabels}
                searchName={searchName} searchPhone={searchPhone}
                searchEmail={searchEmail} filterCategory={filterCategory} filterCity={filterCity}
                importNewContacts={contactsManager.importNewContacts} importConflicts={contactsManager.importConflicts}
                geminiApiKey={effectiveAiKey} isBackfillingAddress={contactsManager.isBackfillingAddress}
                payloadPreview={contactsManager.payloadPreview} onSelectList={setCurrentListId}
                onCreateList={() => { setListModalMode('create'); setListModalName('') }}
                onRenameCurrentList={() => { setListModalMode('rename'); setListModalName(lists.find(l => l.id === currentListId)?.name || '') }}
                onDeleteCurrentList={() => setConfirmDeleteListOpen(true)}
                onCreateContact={() => { contactsManager.resetContactForm(); contactsManager.setShowContactForm(true) }}
                onEditContact={contactsManager.startEditContact}
                onDeleteContact={async (id) => { if (confirm('Excluir contato?')) { await deleteContact(String(id)); reloadContacts() } }}
                onSaveContactForm={async () => { await saveContact({ id: contactsManager.editingContactId ?? undefined, name: contactsManager.contactFormName, phone: contactsManager.contactFormPhone, category: contactsManager.contactFormCategory, email: contactsManager.contactFormEmail, cep: contactsManager.contactFormCep, address: contactsManager.contactFormAddress, city: contactsManager.contactFormCity, rating: String(contactsManager.contactFormRating), labels: contactsManager.contactFormLabels }); contactsManager.resetContactForm(); reloadContacts() }}
                onCancelContactForm={contactsManager.resetContactForm}
                chat={chat}
                instanceName={evolutionInstance}
                onChangeContactFormName={contactsManager.setContactFormName} onChangeContactFormPhone={contactsManager.setContactFormPhone}
                onChangeContactFormCategory={contactsManager.setContactFormCategory} onChangeContactFormEmail={contactsManager.setContactFormEmail}
                onChangeContactFormCep={contactsManager.setContactFormCep} onChangeContactFormAddress={contactsManager.setContactFormAddress}
                onChangeContactFormCity={contactsManager.setContactFormCity} onChangeContactFormRating={contactsManager.setContactFormRating}
                onChangeContactFormLabels={contactsManager.setContactFormLabels}
                onToggleSelectAll={(c) => handleToggleSelectAll(c, filteredContacts)} onToggleSelectOne={handleToggleSelectOne}
                onResetSelection={() => setSelectedIds([])} onSetMoveTargetListId={setMoveTargetListId}
                onMoveSelectedToList={async () => { showToast('Funcionalidade sendo migrada..') }}
                onSetSearchName={setSearchName} onSetSearchPhone={setSearchPhone} onSetSearchEmail={setSearchEmail}
                onSetFilterCategory={setFilterCategory} onSetFilterCity={setFilterCity} onClearFilters={handleClearFilters}
                onCancelImport={() => { contactsManager.setImportNewContacts(null); contactsManager.setImportConflicts(null) }}
                onApplyImport={() => { }} onSetImportConflicts={contactsManager.setImportConflicts}
                onBackfillAddressFromCep={() => contactsManager.handleBackfillAddressFromCep(currentContacts, () => reloadContacts())}
                onAiExtractContact={(f) => { }} can={can} onSetLists={setLists as any} onSetContactsByList={setContactsByList as any}
                onSetCurrentListId={setCurrentListId} onSetEditingContactId={contactsManager.setEditingContactId}
                onSetContactFormName={contactsManager.setContactFormName} onSetContactFormPhone={contactsManager.setContactFormPhone}
                onSetContactFormEmail={contactsManager.setContactFormEmail} onSetContactFormCategory={contactsManager.setContactFormCategory}
                onSetContactFormCep={contactsManager.setContactFormCep} onSetContactFormAddress={contactsManager.setContactFormAddress}
                onSetContactFormCity={contactsManager.setContactFormCity} onSetContactFormRating={contactsManager.setContactFormRating}
                onSetLastMoveMessage={showToast}
              />
            )}

            {currentPage === 'campaigns' && (
              <CampaignsPage
                campaigns={campaigns} lists={lists} contactsByList={contactsByList} sendHistory={sendHistory} contactSendHistory={contactSendHistory}
                campaignSendLog={campaignSendLog} campaignEditorOpen={composer.campaignEditorOpen} editingCampaignId={composer.editingCampaignId}
                newCampaignName={composer.newCampaignName} newCampaignListId={composer.newCampaignListId} newCampaignChannels={composer.newCampaignChannels}
                newCampaignMessage={composer.newCampaignMessage} newCampaignMediaItems={composer.newCampaignMediaItems}
                newCampaignSharedContact={composer.newCampaignSharedContact} sendingCampaignId={execution.sendingCampaignId}
                sendingCurrentIndex={execution.sendingCurrentIndex} sendingTotal={execution.sendingTotal} sendingErrors={execution.sendingErrors}
                sendingNextDelaySeconds={execution.sendingNextDelaySeconds} sendConfirmCampaignId={execution.sendConfirmCampaignId}
                hasEvolutionConfigured={!!(globalSettings?.evolution_api_url || userSettings?.evolution_url)}
                onSetCampaignEditorOpen={composer.setCampaignEditorOpen} onSetNewCampaignName={composer.setNewCampaignName}
                onSetNewCampaignListId={composer.setNewCampaignListId} onSetNewCampaignChannels={composer.setNewCampaignChannels}
                onSetNewCampaignMessage={composer.setNewCampaignMessage} onSetNewCampaignMediaItems={composer.setNewCampaignMediaItems}
                onSetNewCampaignSharedContact={composer.setNewCampaignSharedContact}
                onCreateCampaign={() => composer.saveCampaign({ lists, onSuccess: () => { reloadCampaigns(); showToast('Salvo') }, onError: showToast })}
                onCancelEditCampaign={composer.resetComposer} onStartEditCampaign={(c) => composer.startEditCampaign(c, lists)}
                onDuplicateCampaign={(c) => composer.duplicateCampaign(c, lists)}
                onDeleteCampaign={async id => { if (confirm('Excluir?')) { await apiFetch(`/api/campaigns/${id}`, { method: 'DELETE' }); reloadCampaigns() } }}
                onContinueCampaign={execution.continueCampaign} onSendCampaign={execution.sendCampaign}
                onRequestSendCampaign={c => execution.setSendConfirmCampaignId(c.id)} onSetSendConfirmCampaignId={execution.setSendConfirmCampaignId}
                getPendingContacts={execution.getPendingContacts} can={can} geminiApiKey={effectiveAiKey}
                userHasConfiguredAi={userHasConfiguredAi} onGenerateCampaignContentWithAI={callGeminiForCampaign}
                sortedLists={lists}
                sendIntervalMinSeconds={sendIntervalMinSeconds}
                sendIntervalMaxSeconds={sendIntervalMaxSeconds}
                onChangeSendIntervalMinSeconds={setSendIntervalMinSeconds}
                onChangeSendIntervalMaxSeconds={setSendIntervalMaxSeconds}
                reportCampaignId={reportCampaignId}
                reportViewMode={reportViewMode}
                onSetReportCampaignId={setReportCampaignId}
                onSetReportViewMode={setReportViewMode}
                onSetEditingCampaignId={composer.setEditingCampaignId}
                onScheduleCampaign={onScheduleCampaign}
                htmlToWhatsapp={htmlToWhatsapp}
                htmlToText={htmlToText}
                currentUserGroupName={permissions?.groupName}
                chat={chat}
                instanceName={evolutionInstance}
              />
            )}

            {currentPage === 'schedules' && <SchedulesPage campaigns={campaigns} effectiveUserId={effectiveUserId} />}
            {currentPage === 'reports' && (
              <ReportsPage 
                campaigns={campaigns} 
                contactSendHistory={contactSendHistory} 
                pagination={pagination}
                onLoadPage={(p) => reloadContactSendHistory(p, 50)}
              />
            )}
            {currentPage === 'profile' && (
              <UserSettingsPage 
                effectiveUserId={effectiveUserId} 
                userDisplayName={userSettings?.display_name || ''} 
                userPhone={userSettings?.phone || ''} 
                useGlobalAi={userSettings?.use_global_ai ?? true} 
                userAiKey={userSettings?.ai_api_key || ''} 
                userCompanyInfo={userSettings?.company_info || null} 
                onChangeUserDisplayName={(v) => setUserSettings(prev => prev ? {...prev, display_name: v} : prev)} 
                onChangeUserPhone={(v) => setUserSettings(prev => prev ? {...prev, phone: v} : prev)} 
                onChangeUseGlobalAi={(v) => setUserSettings(prev => prev ? {...prev, use_global_ai: v} : prev)} 
                onChangeUserAiKey={(v) => setUserSettings(prev => prev ? {...prev, ai_api_key: v} : prev)} 
                onChangeUserCompanyInfo={(v) => setUserSettings(prev => prev ? {...prev, company_info: v} : prev)} 
                userEvolutionUrl={userSettings?.evolution_url || ''} 
                userEvolutionApiKey={userSettings?.evolution_apikey || ''} 
                userEvolutionInstance={userSettings?.evolution_instance || ''} 
                onChangeUserEvolutionUrl={(v) => setUserSettings(prev => prev ? {...prev, evolution_url: v} : prev)} 
                onChangeUserEvolutionApiKey={(v) => setUserSettings(prev => prev ? {...prev, evolution_apikey: v} : prev)} 
                onChangeUserEvolutionInstance={(v) => setUserSettings(prev => prev ? {...prev, evolution_instance: v} : prev)} 
                onSave={handleSaveUserOverrides} 
              />
            )}
            
            {currentPage === 'settings' && (
              <SettingsPage
                evolutionApiUrl={evolutionApiUrl} evolutionApiKey={evolutionApiKey} evolutionInstance={evolutionInstance}
                onChangeEvolutionApiUrl={setEvolutionApiUrl} onChangeEvolutionApiKey={setEvolutionApiKey} onChangeEvolutionInstance={setEvolutionInstance}
                geminiApiKey={geminiApiKey} onChangeGeminiApiKey={setGeminiApiKey} geminiModel={geminiModel} onChangeGeminiModel={setGeminiModel}
                geminiApiVersion={geminiApiVersion} onChangeGeminiApiVersion={setGeminiApiVersion} geminiTemperature={geminiTemperature}
                onChangeGeminiTemperature={setGeminiTemperature} geminiMaxTokens={geminiMaxTokens} onChangeGeminiMaxTokens={setGeminiMaxTokens}
                debugEnabled={debugEnabled} onChangeDebugEnabled={setDebugEnabled} googleMapsApiKey={googleMapsApiKey}
                onChangeGoogleMapsApiKey={setGoogleMapsApiKey} onSave={handleSaveGlobalSettings} can={can}
                importPreview={null}
                onExportData={async () => {}}
                onSaveCampaign={async () => { }}
                onCancelCampaign={() => { }}
                onImportFile={async () => {}}
                onCancelImport={() => {}}
                onConfirmImport={async () => {}}
                chat={chat}
                instanceName={evolutionInstance}
              />
            )}

            {currentPage === 'admin' && <AdminUsersPage can={can} onImpersonateUser={setImpersonatedUserId} />}
            {currentPage === 'warmer' && <AdminWarmerPage can={can} />}
            {currentPage === 'gemini-keys' && <GeminiKeysPage />}
            {currentPage === 'security' && <SecurityDashboardPage />}
            </Suspense>
          </div>
        </main>

        {listModalMode && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-xl p-4 w-full max-w-sm space-y-3">
              <h3 className="font-semibold">{listModalMode === 'create' ? 'Nova lista' : 'Renomear'}</h3>
              <input value={listModalName} onChange={e => setListModalName(e.target.value)} className="w-full border p-2 rounded" />
              <div className="flex justify-end gap-2"><button onClick={() => setListModalMode(null)}>Sair</button><button onClick={handleConfirmListModal} className="bg-emerald-600 text-white px-3 py-1 rounded">OK</button></div>
            </div>
          </div>
        )}

        {confirmDeleteListOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-xl p-4 w-full max-w-sm space-y-3">
              <h3 className="font-semibold text-red-600">Excluir lista?</h3>
              <p className="text-sm">Isso remove contatos vinculados.</p>
              <div className="flex justify-end gap-2"><button onClick={() => setConfirmDeleteListOpen(false)}>Sair</button><button onClick={handleConfirmDeleteList} className="bg-red-600 text-white px-3 py-1 rounded">Excluir</button></div>
            </div>
          </div>
        )}

        {toastMessage && (
          <div className="fixed bottom-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">{toastMessage}</div>
        )}

        <VersionUpdater />
      </div>
    </div>
  )
}

export default App
