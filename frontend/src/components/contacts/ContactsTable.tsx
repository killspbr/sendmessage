type Contact = {
  id: number
  name: string
  phone: string
  category: string
  email: string
  city?: string
  rating: string
}

export type ContactsTableProps = {
  contacts: Contact[]
  filteredContacts: Contact[]
  selectedIds: number[]
  moveTargetListId: string
  lists: { id: string; name: string }[]
  currentListId: string
  searchName: string
  searchPhone: string
  filterCategory: string
  searchEmail: string
  filterCity: string
  onChangeSearchName: (value: string) => void
  onChangeSearchPhone: (value: string) => void
  onChangeFilterCategory: (value: string) => void
  onChangeSearchEmail: (value: string) => void
  onChangeFilterCity: (value: string) => void
  onClearFilters: () => void
  onChangeMoveTargetListId: (id: string) => void
  onMoveSelected: () => void
  onToggleSelectAll: (checked: boolean) => void
  onToggleSelectOne: (id: number, checked: boolean) => void
  onEditContact: (contact: Contact) => void
  onDeleteContact: (id: number) => void
}

export function ContactsTable({
  contacts,
  filteredContacts,
  selectedIds,
  moveTargetListId,
  lists,
  currentListId,
  searchName,
  searchPhone,
  filterCategory,
  searchEmail,
  filterCity,
  onChangeSearchName,
  onChangeSearchPhone,
  onChangeFilterCategory,
  onChangeSearchEmail,
  onChangeFilterCity,
  onClearFilters,
  onChangeMoveTargetListId,
  onMoveSelected,
  onToggleSelectAll,
  onToggleSelectOne,
  onEditContact,
  onDeleteContact,
}: ContactsTableProps) {
  return (
    <>
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
            onChange={(e) => onChangeMoveTargetListId(e.target.value)}
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
            onClick={onMoveSelected}
            disabled={selectedIds.length === 0}
          >
            Mover
          </button>
        </div>
      </div>

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
                  onChange={(e) => onChangeSearchName(e.target.value)}
                  className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="text"
                  placeholder="Buscar telefone"
                  value={searchPhone}
                  onChange={(e) => onChangeSearchPhone(e.target.value)}
                  className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                />
              </td>
              <td className="px-2 py-1">
                <select
                  value={filterCategory}
                  onChange={(e) => onChangeFilterCategory(e.target.value)}
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
                  onChange={(e) => onChangeSearchEmail(e.target.value)}
                  className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                />
              </td>
              <td className="px-2 py-1 min-w-[160px]">
                <input
                  type="text"
                  placeholder="Cidade contém"
                  value={filterCity}
                  onChange={(e) => onChangeFilterCity(e.target.value)}
                  className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                />
              </td>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
              <tr
                key={contact.id}
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
                  {/* Placeholder para "Último envio"; lógica permanece no App por enquanto */}
                </td>
                <td className="px-2 py-2">{contact.rating}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="text-[10px] px-2 py-0.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
                      onClick={() => onEditContact(contact)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-[10px] px-2 py-0.5 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      onClick={() => onDeleteContact(contact.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
