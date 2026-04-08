import type { PaginationMeta } from '../../types'

type PaginationControlsProps = {
  meta: PaginationMeta | null
  onPageChange: (page: number) => void
  loading?: boolean
}

export function PaginationControls({ meta, onPageChange, loading }: PaginationControlsProps) {
  if (!meta || meta.pages <= 1) return null

  const { page, pages, total } = meta

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mt-6 px-2 py-4 border-t border-slate-100">
      <div className="text-[11px] text-slate-500 font-medium">
        Mostrando página <span className="text-slate-900 font-bold">{page}</span> de <span className="text-slate-900 font-bold">{pages}</span>
        <span className="mx-2">·</span>
        Total de <span className="text-slate-900 font-bold">{total}</span> registros
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="h-8 px-3 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Anterior
        </button>

        <div className="flex items-center gap-1 mx-2">
          {Array.from({ length: Math.min(5, pages) }, (_, i) => {
            let pageNum = page
            if (pages <= 5) {
              pageNum = i + 1
            } else if (page <= 3) {
              pageNum = i + 1
            } else if (page >= pages - 2) {
              pageNum = pages - 4 + i
            } else {
              pageNum = page - 2 + i
            }

            return (
              <button
                key={pageNum}
                type="button"
                disabled={loading}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-xl text-[11px] font-black transition-all ${
                  page === pageNum
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                    : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={page >= pages || loading}
          onClick={() => onPageChange(page + 1)}
          className="h-8 px-3 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
