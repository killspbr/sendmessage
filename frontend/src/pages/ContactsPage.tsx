import { ContactsHeader } from '../components/contacts/ContactsHeader'
import { ContactForm } from '../components/contacts/ContactForm'
import type { Contact, ContactList, ContactSendHistoryItem, ImportConflict } from '../types'
import { normalizePhone, formatRating, BACKEND_URL } from '../utils'

type ContactsPageProps = {
  // Dados
  contacts: Contact[]
  filteredContacts: Contact[]
  lists: ContactList[]
  sortedLists: ContactList[]
  currentListId: string
  contactSendHistory: ContactSendHistoryItem[]

  // Estado de seleção
  selectedIds: number[]
  moveTargetListId: string

  // Estado do formulário
  showContactForm: boolean
  editingContactId: number | null
  contactFormName: string
  contactFormPhone: string
  contactFormCategory: string
  contactFormEmail: string
  contactFormCep: string
  contactFormAddress: string
  contactFormCity: string
  contactFormRating: string

  // Estado de filtros
  searchName: string
  searchPhone: string
  searchEmail: string
  filterCategory: string
  filterCity: string

  // Estado de importação
  importNewContacts: Contact[] | null
  importConflicts: ImportConflict[] | null

  // Estado de IA
  geminiApiKey: string
  isBackfillingAddress: boolean

  // Estado de preview
  payloadPreview: string | null

  // Handlers de lista
  onSelectList: (id: string) => void
  onCreateList: () => void
  onRenameCurrentList: () => void
  onDeleteCurrentList: () => void

  // Handlers de contato
  onCreateContact: () => void
  onEditContact: (contact: Contact) => void
  onDeleteContact: (id: number) => void
  onSaveContactForm: () => void
  onCancelContactForm: () => void

  // Handlers de formulário
  onChangeContactFormName: (value: string) => void
  onChangeContactFormPhone: (value: string) => void
  onChangeContactFormCategory: (value: string) => void
  onChangeContactFormEmail: (value: string) => void
  onChangeContactFormCep: (value: string) => void
  onChangeContactFormAddress: (value: string) => void
  onChangeContactFormCity: (value: string) => void
  onChangeContactFormRating: (value: string) => void

  // Handlers de seleção
  onToggleSelectAll: (checked: boolean) => void
  onToggleSelectOne: (id: number, checked: boolean) => void
  onResetSelection: () => void
  onSetMoveTargetListId: (id: string) => void
  onMoveSelectedToList: () => void

  // Handlers de filtros
  onSetSearchName: (value: string) => void
  onSetSearchPhone: (value: string) => void
  onSetSearchEmail: (value: string) => void
  onSetFilterCategory: (value: string) => void
  onSetFilterCity: (value: string) => void
  onClearFilters: () => void

  // Handlers de importação
  onCancelImport: () => void
  onApplyImport: () => void
  onSetImportConflicts: (conflicts: ImportConflict[] | null) => void

  // Handlers de IA
  onBackfillAddressFromCep: () => void
  onAiExtractContact: (file: File) => void

  // Handlers de estado
  onSetLists: (fn: (prev: ContactList[]) => ContactList[]) => void
  onSetContactsByList: (fn: (prev: Record<string, Contact[]>) => Record<string, Contact[]>) => void
  onSetCurrentListId: (id: string) => void
  onSetEditingContactId: (id: number | null) => void
  onSetContactFormName: (value: string) => void
  onSetContactFormPhone: (value: string) => void
  onSetContactFormEmail: (value: string) => void
  onSetContactFormCategory: (value: string) => void
  onSetContactFormCep: (value: string) => void
  onSetContactFormAddress: (value: string) => void
  onSetContactFormCity: (value: string) => void
  onSetContactFormRating: (value: string) => void
  onSetLastMoveMessage: (message: string) => void
  // Permissões (opcional)
  can?: (code: string) => boolean
}

export function ContactsPage({
  contacts,
  filteredContacts,
  lists,
  sortedLists,
  currentListId,
  contactSendHistory,
  selectedIds,
  moveTargetListId,
  showContactForm,
  editingContactId,
  contactFormName,
  contactFormPhone,
  contactFormCategory,
  contactFormEmail,
  contactFormCep,
  contactFormAddress,
  contactFormCity,
  contactFormRating,
  searchName,
  searchPhone,
  searchEmail,
  filterCategory,
  filterCity,
  importNewContacts,
  importConflicts,
  geminiApiKey,
  isBackfillingAddress,
  payloadPreview,
  onSelectList,
  onCreateList,
  onRenameCurrentList,
  onDeleteCurrentList,
  onCreateContact,
  onEditContact,
  onDeleteContact,
  onSaveContactForm,
  onCancelContactForm,
  onChangeContactFormName,
  onChangeContactFormPhone,
  onChangeContactFormCategory,
  onChangeContactFormEmail,
  onChangeContactFormCep,
  onChangeContactFormAddress,
  onChangeContactFormCity,
  onChangeContactFormRating,
  onToggleSelectAll,
  onToggleSelectOne,
  onResetSelection,
  onSetMoveTargetListId,
  onMoveSelectedToList,
  onSetSearchName,
  onSetSearchPhone,
  onSetSearchEmail,
  onSetFilterCategory,
  onSetFilterCity,
  onClearFilters,
  onCancelImport,
  onApplyImport,
  onSetImportConflicts,
  onBackfillAddressFromCep,
  onAiExtractContact,
  onSetLists,
  onSetContactsByList,
  onSetCurrentListId,
  onSetEditingContactId,
  onSetContactFormName,
  onSetContactFormPhone,
  onSetContactFormEmail,
  onSetContactFormCategory,
  onSetContactFormCep,
  onSetContactFormAddress,
  onSetContactFormCity,
  onSetContactFormRating,
  onSetLastMoveMessage,
  can,
}: ContactsPageProps) {
  const canViewContacts = !can || can('contacts.view')

  const canCreateContact = !can || can('contacts.create')
  const canEditContact = !can || can('contacts.edit')
  const canDeleteContact = !can || can('contacts.delete')
  const canImportContacts = !can || can('contacts.import')
  const canExportContacts = !can || can('contacts.export')
  const canManageLists = !can || can('contacts.edit')
  const canMoveContacts = !can || can('contacts.edit')

  if (!canViewContacts) {
    return (
      <div className="text-[12px] md:text-[13px] text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        Você não tem permissão para visualizar os contatos.
      </div>
    )
  }
  return (
    <div>
      {/* Cabeçalho de listas e ações principais de contato */}
      <ContactsHeader
        sortedLists={sortedLists}
        currentListId={currentListId}
        onSelectList={onSelectList}
        onClearFilters={onClearFilters}
        onResetSelection={onResetSelection}
        onCreateList={canManageLists ? onCreateList : undefined}
        onCreateContact={canCreateContact ? onCreateContact : undefined}
      />

      <div className="flex items-center gap-2 text-[11px] mt-1">
        <label className="px-2 py-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer flex items-center gap-1">
          <span>IA</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                onAiExtractContact(file)
              }
              e.target.value = ''
            }}
          />
        </label>
        <button
          type="button"
          className="px-2 py-1 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          onClick={onBackfillAddressFromCep}
          disabled={isBackfillingAddress}
        >
          {isBackfillingAddress && (
            <span className="inline-flex w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          )}
          {isBackfillingAddress ? 'IA preenchendo endereços...' : 'IA: Endereços'}
        </button>
        {canManageLists && (
          <button
            type="button"
            className="px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={onRenameCurrentList}
          >
            Renomear lista
          </button>
        )}
        {canManageLists && (
          <button
            type="button"
            className="px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            onClick={onDeleteCurrentList}
          >
            Excluir lista
          </button>
        )}
      </div>

      {/* Card principal com formulário de contato, tabela e filtros */}
      <section
        id="contact-form-section"
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5"
      >
        <ContactForm
          show={showContactForm}
          editingContactId={editingContactId}
          name={contactFormName}
          phone={contactFormPhone}
          category={contactFormCategory}
          email={contactFormEmail}
          cep={contactFormCep}
          address={contactFormAddress}
          city={contactFormCity}
          rating={contactFormRating}
          onChangeName={onChangeContactFormName}
          onChangePhone={(value) => onChangeContactFormPhone(normalizePhone(value))}
          onChangeCategory={onChangeContactFormCategory}
          onChangeEmail={onChangeContactFormEmail}
          onChangeCep={onChangeContactFormCep}
          onChangeAddress={onChangeContactFormAddress}
          onChangeCity={onChangeContactFormCity}
          onChangeRating={onChangeContactFormRating}
          onSave={onSaveContactForm}
          onClear={onCancelContactForm}
          onClose={onCancelContactForm}
        />

        {!showContactForm && (
          <p className="mb-3 text-[11px] text-slate-500">
            Clique em <span className="font-semibold">"Novo contato"</span> para abrir o formulário de cadastro.
          </p>
        )}

        {/* Pré-visualização de importação */}
        {importNewContacts && importConflicts && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium">Pré-visualização da importação</p>
                <p className="text-amber-700 mt-0.5">
                  Novos contatos: <strong>{importNewContacts.length}</strong> · Possíveis duplicados:{' '}
                  <strong>{importConflicts.length}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  onClick={onCancelImport}
                >
                  Cancelar
                </button>
                {canImportContacts && (
                  <button
                    className="px-2.5 py-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={onApplyImport}
                    disabled={!canImportContacts}
                  >
                    Aplicar importação
                  </button>
                )}
              </div>
            </div>

            {importConflicts.length > 0 && (
              <div className="mt-2 max-h-56 overflow-auto border border-amber-100 rounded-md bg-white">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-2 py-1 text-left">Telefone</th>
                      <th className="px-2 py-1 text-left">Campo</th>
                      <th className="px-2 py-1 text-left">Sistema</th>
                      <th className="px-2 py-1 text-left">Arquivo</th>
                      <th className="px-2 py-1 text-left">Usar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importConflicts.map((conflict) => {
                      const fields: (keyof Contact)[] = ['name', 'category', 'cep', 'rating']
                      return fields.map((field, index) => {
                        const existingValue = conflict.existing[field]
                        const incomingValue = conflict.incoming[field]
                        const isDifferent = existingValue !== incomingValue
                        return (
                          <tr
                            key={`${conflict.id}-${field}`}
                            className={`border-b border-slate-100 ${isDifferent ? 'bg-amber-50/80' : 'bg-white'
                              }`}
                          >
                            {index === 0 && (
                              <td className="px-2 py-1 align-top" rowSpan={fields.length}>
                                <span className="font-medium">{conflict.existing.phone}</span>
                              </td>
                            )}
                            <td className="px-2 py-1 capitalize align-top">{field}</td>
                            <td className={`px-2 py-1 align-top ${isDifferent ? 'text-slate-700' : 'text-slate-400'}`}>
                              {existingValue || '—'}
                            </td>
                            <td className={`px-2 py-1 align-top ${isDifferent ? 'font-semibold text-emerald-700' : 'text-slate-400'}`}>
                              {incomingValue || '—'}
                            </td>
                            {index === 0 && (
                              <td className="px-2 py-1 align-top" rowSpan={fields.length}>
                                <div className="flex flex-col gap-1">
                                  <label className="inline-flex items-center gap-1">
                                    <input
                                      type="radio"
                                      name={conflict.id}
                                      className="h-3 w-3"
                                      checked={conflict.resolution === 'system'}
                                      onChange={() =>
                                        onSetImportConflicts(
                                          importConflicts?.map((c) =>
                                            c.id === conflict.id ? { ...c, resolution: 'system' } : c,
                                          ) || null,
                                        )
                                      }
                                    />
                                    <span className="text-[11px] text-slate-600">Sistema</span>
                                  </label>
                                  <label className="inline-flex items-center gap-1">
                                    <input
                                      type="radio"
                                      name={conflict.id}
                                      className="h-3 w-3"
                                      checked={conflict.resolution === 'file'}
                                      onChange={() =>
                                        onSetImportConflicts(
                                          importConflicts?.map((c) =>
                                            c.id === conflict.id ? { ...c, resolution: 'file' } : c,
                                          ) || null,
                                        )
                                      }
                                    />
                                    <span className="text-[11px] text-slate-600">Arquivo</span>
                                  </label>
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Barra de ações */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center min-w-[80px] h-7 px-2 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] text-center">
              {filteredContacts.length} contatos
            </span>
            <button
              type="button"
              className="text-[11px] px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={onClearFilters}
            >
              Limpar filtros
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1 md:gap-1.5">
            <span className="hidden md:inline text-[11px] text-slate-500">Mover selecionados para:</span>
            <span className="md:hidden text-[11px] text-slate-500">Mover para:</span>
            <select
              value={moveTargetListId}
              onChange={(e) => onSetMoveTargetListId(e.target.value)}
              className="h-7 px-2 rounded-md border border-slate-200 text-[11px] bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400/80 min-w-[140px]"
            >
              <option value="">Escolha uma lista</option>
              {lists
                .filter((l) => l.id !== currentListId)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              onClick={onMoveSelectedToList}
              disabled={selectedIds.length === 0 || !canMoveContacts}
            >
              Mover
            </button>
          </div>
        </div>

        {/* Tabela de contatos */}
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] md:max-h-[70vh] lg:max-h-[75vh] rounded-xl border border-slate-100">
          <table className="w-full text-xs border-separate border-spacing-0">
            <thead className="bg-white sticky top-0 z-10">
              <tr className="border-b border-slate-100">
                <th className="w-10 px-3 py-2 text-left align-bottom">
                  <input
                    type="checkbox"
                    className="h-3 w-3"
                    checked={
                      filteredContacts.length > 0 &&
                      selectedIds.length === filteredContacts.length
                    }
                    onChange={(e) => onToggleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-2 pt-1 pb-0.5 text-left font-medium text-slate-600">Nome</th>
                <th className="px-2 pt-1 pb-0.5 text-left font-medium text-slate-600">Telefone</th>
                <th className="px-2 pt-1 pb-0.5 text-left font-medium text-slate-600">Categoria</th>
                <th className="px-2 pt-1 pb-0.5 text-left font-medium text-slate-600 w-[140px]">Email</th>
                <th className="px-2 pt-1 pb-0.5 text-left font-medium text-slate-600 min-w-[160px]">Cidade</th>
                <th className="px-2 pt-1 pb-0.5 text-left font-medium text-slate-600">Último envio</th>
                <th className="px-2 pt-1 pb-0.5 text-left font-medium text-slate-600">Avaliação</th>
                <th className="px-2 pt-1 pb-0.5 text-left font-medium text-slate-600">Ações</th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px]">
                <td className="px-3 py-1" />
                <td className="px-2 py-1">
                  <input
                    type="text"
                    placeholder="Buscar nome"
                    value={searchName}
                    onChange={(e) => onSetSearchName(e.target.value)}
                    className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    placeholder="Buscar telefone"
                    value={searchPhone}
                    onChange={(e) => onSetSearchPhone(e.target.value)}
                    className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                  />
                </td>
                <td className="px-2 py-1">
                  <select
                    value={filterCategory}
                    onChange={(e) => onSetFilterCategory(e.target.value)}
                    className="w-full h-7 px-2 rounded-md border border-slate-200 text-[11px] bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                  >
                    <option value="Todas">Todas</option>
                    {Array.from(new Set(contacts.map((c) => c.category))).map((category) => (
                      <option key={category} value={category}>
                        {category || 'Sem categoria'}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1 w-[140px]">
                  <input
                    type="text"
                    placeholder="Buscar email"
                    value={searchEmail}
                    onChange={(e) => onSetSearchEmail(e.target.value)}
                    className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                  />
                </td>
                <td className="px-2 py-1 min-w-[160px]">
                  <input
                    type="text"
                    placeholder="Cidade contém"
                    value={filterCity}
                    onChange={(e) => onSetFilterCity(e.target.value)}
                    className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                  />
                </td>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr
                  key={`${contact.id}-${normalizePhone(contact.phone)}`}
                  className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/80"
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      checked={selectedIds.includes(contact.id)}
                      onChange={(e) => onToggleSelectOne(contact.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-2 py-2">{contact.name}</td>
                  <td className="px-2 py-2">{contact.phone}</td>
                  <td className="px-2 py-2">{contact.category}</td>
                  <td className="px-2 py-2 max-w-[140px] truncate" title={contact.email}>
                    {contact.email}
                  </td>
                  <td className="px-2 py-2 max-w-[200px] truncate" title={contact.city}>
                    {contact.city}
                  </td>
                  <td className="px-2 py-2 text-[10px] text-slate-500">
                    {(() => {
                      const phoneKey = normalizePhone(contact.phone)
                      if (!phoneKey) return (
                        <span className="text-slate-400">—</span>
                      )

                      const historyForContact = contactSendHistory
                        .filter((h) => normalizePhone(h.phoneKey) === phoneKey)
                        .slice()
                        .sort((a, b) => {
                          const da = new Date(a.runAt).getTime()
                          const db = new Date(b.runAt).getTime()
                          return db - da
                        })

                      const lastWhats = historyForContact.find((h) => h.channel === 'whatsapp')
                      const lastEmail = historyForContact.find((h) => h.channel === 'email')

                      const badgeClass = (item?: ContactSendHistoryItem) => {
                        if (!item) return 'border-slate-200 text-slate-400 bg-slate-50'
                        if (item.ok) return 'border-emerald-400 text-emerald-700 bg-emerald-50'
                        return 'border-red-400 text-red-700 bg-red-50'
                      }

                      const tooltipWhats = lastWhats
                        ? `WhatsApp · ${lastWhats.ok ? 'OK' : 'Erro'} ${lastWhats.status || (lastWhats.ok ? 200 : 500)} · ${lastWhats.campaignName} · ${lastWhats.runAt}`
                        : 'WhatsApp ainda não enviado'
                      const tooltipEmail = lastEmail
                        ? `Email · ${lastEmail.ok ? 'OK' : 'Erro'} ${lastEmail.status || (lastEmail.ok ? 200 : 500)} · ${lastEmail.campaignName} · ${lastEmail.runAt}`
                        : 'Email ainda não enviado'

                      return (
                        <div className="flex items-center gap-1.5">
                          <div className="relative group">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full border cursor-default ${badgeClass(
                                lastWhats,
                              )}`}
                            >
                              <span className="text-[11px]">📱</span>
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-slate-800 text-white text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                              {tooltipWhats}
                            </div>
                          </div>
                          <div className="relative group">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full border cursor-default ${badgeClass(
                                lastEmail,
                              )}`}
                            >
                              <span className="text-[11px]">✉️</span>
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-slate-800 text-white text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                              {tooltipEmail}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-2 py-2">{formatRating(contact.rating)}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      {contact.phone && (
                        <a
                          href={`https://web.whatsapp.com/send/?phone=${normalizePhone(contact.phone).length === 11 ? '55' + normalizePhone(contact.phone) : normalizePhone(contact.phone)}&text&type=phone_number&app_absent=0`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-[11px] text-emerald-600 hover:bg-emerald-100 flex items-center gap-1"
                          title="Chamar no WhatsApp"
                        >
                          <span className="text-[12px]">📱</span>
                          Whats
                        </a>
                      )}
                      {canEditContact && (
                        <button
                          className="px-2 py-1 rounded-md border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => onEditContact(contact)}
                          disabled={!canEditContact}
                        >
                          Editar
                        </button>
                      )}
                      {canDeleteContact && (
                        <button
                          className="px-2 py-1 rounded-md border border-red-100 bg-red-50 text-[11px] text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => onDeleteContact(contact.id)}
                          disabled={!canDeleteContact}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Preview de payload */}
        {
          payloadPreview && (
            <div className="mt-4 border border-slate-200 rounded-lg bg-slate-50 p-3 text-[11px] font-mono text-slate-700 max-h-80 overflow-auto">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-600">Payload n8n (pré-visualização)</span>
                <span className="text-[10px] text-slate-500">Somente leitura · ainda não enviado</span>
              </div>
              <pre className="whitespace-pre-wrap break-all">{payloadPreview}</pre>
            </div>
          )
        }
      </section >
    </div >
  )
}
