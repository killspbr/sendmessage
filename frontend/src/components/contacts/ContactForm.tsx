
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
}: ContactFormProps) {
  return (
    <div
      className={`mb-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-out transform origin-top ${
        show ? 'max-h-[520px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-slate-800">
            {editingContactId != null ? 'Editar contato' : 'Novo contato'}
          </span>
          <span className="text-[10px] text-slate-500">
            Preencha os dados do contato e clique em Salvar.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1 md:gap-1.5">
          <button
            type="button"
            className="h-7 px-2 md:px-3 rounded-md text-[10px] md:text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-400 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            onClick={onSave}
          >
            Salvar
          </button>
          <button
            type="button"
            className="h-7 px-2 md:px-3 rounded-md text-[10px] md:text-[11px] font-medium border border-slate-300 text-slate-600 hover:bg-slate-100 whitespace-nowrap"
            onClick={onClear}
          >
            Limpar
          </button>
          <button
            type="button"
            className="h-7 px-2 md:px-3 rounded-md text-[10px] md:text-[11px] font-medium border border-slate-300 text-slate-500 hover:bg-slate-100 whitespace-nowrap"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-slate-600">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
            placeholder="Nome do contato"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-slate-600">Telefone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => onChangePhone(e.target.value)}
            className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
            placeholder="1199999999 ou 11999999999"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-slate-600">Categoria</label>
          <input
            type="text"
            value={category}
            onChange={(e) => onChangeCategory(e.target.value)}
            className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
            placeholder="Ex: Pizzaria"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-slate-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => onChangeEmail(e.target.value)}
            className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
            placeholder="email@exemplo.com"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-slate-600">CEP</label>
          <input
            type="text"
            value={cep}
            onChange={(e) => onChangeCep(e.target.value)}
            className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
            placeholder="Ex: 01001-000"
          />
        </div>
        <div className="flex flex-col gap-0.5 lg:col-span-2">
          <label className="text-[10px] font-medium text-slate-600">Endereço</label>
          <input
            type="text"
            value={address}
            onChange={(e) => onChangeAddress(e.target.value)}
            className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
            placeholder="Rua, número, bairro"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-slate-600">Cidade</label>
          <input
            type="text"
            value={city}
            onChange={(e) => onChangeCity(e.target.value)}
            className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
            placeholder="Ex: São Paulo - SP"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-slate-600">Avaliação</label>
          <input
            type="text"
            value={rating}
            onChange={(e) => onChangeRating(e.target.value)}
            className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
            placeholder="Ex: 4.5"
          />
        </div>
      </div>
    </div>
  )
}
