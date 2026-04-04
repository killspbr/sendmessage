
export type ContactFormProps = {
  show: boolean
  editingContactId: number | null
  name: string
  phone: string
  category: string
  email: string
  cep: string
  address: string
  city: string
  rating: string
  onChangeName: (value: string) => void
  onChangePhone: (value: string) => void
  onChangeCategory: (value: string) => void
  onChangeEmail: (value: string) => void
  onChangeCep: (value: string) => void
  onChangeAddress: (value: string) => void
  onChangeCity: (value: string) => void
   onChangeRating: (value: string) => void
  onSave: () => void
  onClear: () => void
  onClose: () => void
  labels: string[]
  onChangeLabels: (value: string[]) => void
  availableLabels: string[]
}

export function ContactForm({
  show,
  editingContactId,
  name,
  phone,
  category,
  email,
  cep,
  address,
  city,
  rating,
  onChangeName,
  onChangePhone,
  onChangeCategory,
  onChangeEmail,
  onChangeCep,
  onChangeAddress,
  onChangeCity,
  onChangeRating,
  onSave,
  onClear,
  onClose,
  labels,
  onChangeLabels,
  availableLabels
}: ContactFormProps) {
  return (
    <div
      className={`mb-4 rounded-3xl border border-emerald-100 bg-emerald-50/30 p-4 flex flex-col gap-4 overflow-hidden transition-all duration-300 ease-out transform origin-top shadow-sm ${
        show ? 'max-h-[600px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm ${editingContactId != null ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {editingContactId != null ? '✎' : '+'}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">
              {editingContactId != null ? 'Editar Contato' : 'Novo Contato'}
            </span>
            <span className="text-[10px] text-slate-500">
              {editingContactId != null ? 'Atualize as informações do contato selecionado.' : 'Adicione um novo contato à sua lista.'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 px-4 rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-950/20 active:scale-95 transition-all"
            onClick={onSave}
          >
            Salvar Contato
          </button>
          <button
            type="button"
            className="h-8 px-3 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-white transition-colors"
            onClick={onClear}
          >
            Limpar
          </button>
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/50 p-4 rounded-2xl border border-emerald-100/50">
        {/* Seção Dados Básicos */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider px-1">Dados Principais</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 px-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => onChangeName(e.target.value)}
                className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 px-1">Telefone (WhatsApp)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => onChangePhone(e.target.value)}
                className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="11999999999"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 px-1">Categoria</label>
              <input
                type="text"
                value={category}
                onChange={(e) => onChangeCategory(e.target.value)}
                className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="Ex: Cliente Premium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 px-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => onChangeEmail(e.target.value)}
                className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="exemplo@gmail.com"
              />
            </div>
          </div>
        </div>

        {/* Seção Localização e Extra */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider px-1">Localização e Outros</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 px-1">CEP</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => onChangeCep(e.target.value)}
                className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="00000-000"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 px-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => onChangeCity(e.target.value)}
                className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="Cidade - UF"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-semibold text-slate-500 px-1">Endereço Completo</label>
              <input
                type="text"
                value={address}
                onChange={(e) => onChangeAddress(e.target.value)}
                className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="Rua, número, bairro..."
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-semibold text-slate-500 px-1">Etiquetas de CRM (WhatsApp Labels)</label>
              <div className="min-h-[40px] p-2 rounded-xl border border-slate-200 bg-white flex flex-wrap gap-1.5 transition-all focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                {availableLabels.length === 0 ? (
                  <span className="text-[10px] text-slate-400 italic px-1">Sincronize as etiquetas no topo da página para ver as opções aqui.</span>
                ) : (
                  availableLabels.map((label) => {
                    const isSelected = labels.includes(label)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            onChangeLabels(labels.filter(l => l !== label))
                          } else {
                            onChangeLabels([...labels, label])
                          }
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all uppercase tracking-tighter ${
                          isSelected 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })
                )}
              </div>
              <p className="text-[9px] text-slate-400 px-1 mt-0.5">As etiquetas selecionadas ajudam na segmentação e filtros das suas campanhas.</p>
            </div>
            <div className="hidden">
              <input type="hidden" value={rating} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
