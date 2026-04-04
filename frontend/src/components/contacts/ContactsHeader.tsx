
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
  onSyncLabels?: () => void
  isSyncing?: boolean
}

export function ContactsHeader({
  sortedLists,
  currentListId,
  onSelectList,
  onClearFilters,
  onResetSelection,
  onCreateList,
  onCreateContact,
  onSyncLabels,
  isSyncing = false
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
        <div className="hidden md:flex items-center gap-1.5 text-xs flex-wrap">
          {sortedLists.map((list) => (
            <button
              key={list.id}
              onClick={() => {
                onClearFilters()
                onResetSelection()
                onSelectList(list.id)
              }}
              className={`px-4 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-200 shadow-sm
                ${
                  list.id === currentListId
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                }
              `}
            >
              {list.name}
            </button>
          ))}
          {onCreateList && (
            <button
              className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-[11px] font-medium text-slate-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all shadow-sm"
              onClick={onCreateList}
            >
              + Criar Lista
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {onSyncLabels && (
            <button
              type="button"
              disabled={isSyncing}
              className={`h-8 px-4 rounded-xl border font-bold shadow-sm transition-all flex items-center gap-2 ${
                isSyncing 
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700 active:scale-95'
              }`}
              onClick={onSyncLabels}
            >
              {isSyncing ? (
                <>
                  <span className="w-3 h-3 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                  </svg>
                  Sincronizar CRM
                </>
              )}
            </button>
          )}

          {onCreateContact && (
            <button
              type="button"
              className="h-8 px-4 rounded-xl bg-emerald-600 text-white text-[11px] font-bold shadow-sm shadow-emerald-950/20 hover:bg-emerald-500 active:scale-95 transition-all"
              onClick={onCreateContact}
            >
              + Novo Contato
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
