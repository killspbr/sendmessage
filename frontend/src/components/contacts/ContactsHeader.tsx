
type ContactsHeaderList = {
  id: string
  name: string
}

export type ContactsHeaderProps = {
  sortedLists: ContactsHeaderList[]
  currentListId: string
  onSelectList: (id: string) => void
  onClearFilters: () => void
  onResetSelection: () => void
  onCreateList?: () => void
  onCreateContact?: () => void
}

export function ContactsHeader({
  sortedLists,
  currentListId,
  onSelectList,
  onClearFilters,
  onResetSelection,
  onCreateList,
  onCreateContact,
}: ContactsHeaderProps) {
  return (
    <div>
      {/* Seleção de listas (dropdown no mobile, pills no desktop) */}
      <div className="flex items-center justify-between mb-1 gap-2">
        {/* Mobile: dropdown */}
        <div className="flex items-center gap-1 text-xs w-full md:hidden">
          <select
            value={currentListId}
            onChange={(e) => {
              onClearFilters()
              onResetSelection()
              onSelectList(e.target.value)
            }}
            className="h-8 flex-1 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
          >
            {sortedLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
          {onCreateList && (
            <button
              className="h-8 px-2 rounded-md border border-dashed border-slate-300 text-[16px] leading-none text-slate-500 hover:bg-slate-50"
              onClick={onCreateList}
              title="Nova lista"
            >
              +
            </button>
          )}
        </div>

        {/* Desktop: pills */}
        <div className="hidden md:flex items-center gap-2 text-xs flex-wrap">
          {sortedLists.map((list) => (
            <button
              key={list.id}
              onClick={() => {
                onClearFilters()
                onResetSelection()
                onSelectList(list.id)
              }}
              className={`px-3 py-1.5 rounded-full border text-xs transition 
                ${
                  list.id === currentListId
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }
              `}
            >
              {list.name}
            </button>
          ))}
          {onCreateList && (
            <button
              className="px-2.5 py-1.5 rounded-full border border-dashed border-slate-300 text-xs text-slate-500 hover:bg-slate-50"
              onClick={onCreateList}
            >
              + Nova lista
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {onCreateContact && (
            <button
              type="button"
              className="px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={onCreateContact}
            >
              Novo contato
            </button>
          )}
          {/* Os botões de IA de imagem e backfill de CEP continuam no App por enquanto */}
        </div>
      </div>
    </div>
  )
}
