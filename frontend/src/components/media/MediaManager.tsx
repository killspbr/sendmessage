import React from 'react'
import { apiFetch, API_URL } from '../../api'
import type { UploadedUserFile } from '../../types'
import { normalizeDisplayText } from '../../utils/textEncoding'

interface MediaManagerProps {
  onSelect?: (files: UploadedUserFile[]) => void
  allowMultiple?: boolean
  initialSelected?: string[]
  externalFiles?: UploadedUserFile[]
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  onSelect,
  allowMultiple = false,
  initialSelected = [],
  externalFiles = [],
}) => {
  const [files, setFiles] = React.useState<UploadedUserFile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filterType, setFilterType] = React.useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(initialSelected))
  const [renamingId, setRenamingId] = React.useState<string | null>(null)
  const [tempName, setTempName] = React.useState('')
  const [previewFile, setPreviewFile] = React.useState<UploadedUserFile | null>(null)
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set())

  const loadFiles = async () => {
    setLoading(true)
    try {
      // Cache-buster para garantir dados frescos do servidor
      const data = await apiFetch(`/api/files?_t=${Date.now()}`)
      setFiles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Falha ao carregar arquivos:', err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    void loadFiles()
  }, [])

  // Mescla arquivos do servidor com arquivos injetados otimisticamente (sem duplicatas)
  const mergedFiles = React.useMemo(() => {
    if (externalFiles.length === 0) return files
    const existingIds = new Set(files.map(f => f.id))
    const newExternals = externalFiles.filter(f => !existingIds.has(f.id))
    return [...newExternals, ...files]
  }, [files, externalFiles])

  const filteredFiles = React.useMemo(() => {
    return mergedFiles.filter(f => {
      const matchSearch = f.originalName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchFilter = filterType === 'all' || f.mediaType === filterType || (filterType === 'document' && !['image','video','audio'].includes(f.mediaType))
      return matchSearch && matchFilter
    })
  }, [mergedFiles, searchTerm, filterType])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      if (!allowMultiple) next.clear()
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    if (!window.confirm(`Excluir ${ids.length} arquivo(s) permanentemente?`)) return

    setDeletingIds(new Set(ids))
    try {
      await apiFetch('/api/files/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids })
      })
      setFiles(prev => prev.filter(f => !selectedIds.has(f.id)))
      setSelectedIds(new Set())
    } catch (err) {
      alert('Erro ao excluir arquivos.')
    } finally {
      setDeletingIds(new Set())
    }
  }

  const handleRename = async (file: UploadedUserFile) => {
    if (!tempName.trim() || tempName === file.originalName) {
      setRenamingId(null)
      return
    }

    try {
      const updated = await apiFetch(`/api/files/${file.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: tempName.trim() })
      })
      setFiles(prev => prev.map(f => f.id === file.id ? updated : f))
    } catch (err) {
      alert('Erro ao renomear arquivo.')
    } finally {
      setRenamingId(null)
    }
  }

  const handleConfirmSelection = () => {
    if (!onSelect) return
    const selectedFiles = files.filter(f => selectedIds.has(f.id))
    onSelect(selectedFiles)
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="flex h-full flex-col bg-white overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* Header / Toolbar */}
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar mídias..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">Todos</option>
            <option value="image">Imagens</option>
            <option value="video">Vídeos</option>
            <option value="audio">Áudios</option>
            <option value="document">Documentos</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex h-10 items-center gap-2 rounded-xl bg-rose-50 px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
            >
              🗑️ Excluir ({selectedIds.size})
            </button>
          )}
          {onSelect && (
            <button 
              onClick={handleConfirmSelection}
              disabled={selectedIds.size === 0}
              className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
            >
              Selecionar ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center opacity-50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Carregando Biblioteca...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="text-4xl mb-4 opacity-20">📂</div>
            <p className="text-sm font-medium text-slate-500">Nenhum arquivo encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredFiles.map(file => {
              const isSelected = selectedIds.has(file.id)
              const isDeleting = deletingIds.has(file.id)
              const publicUrl = file.publicUrl.startsWith('http') ? file.publicUrl : `${API_URL}${file.publicUrl}`
              
              return (
                <div 
                  key={file.id} 
                  className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                  } ${isDeleting ? 'opacity-50 grayscale' : ''}`}
                >
                  {/* Preview Area */}
                  <div 
                    className="aspect-square w-full cursor-pointer overflow-hidden bg-slate-50"
                    onClick={() => toggleSelect(file.id)}
                  >
                    {file.mediaType === 'image' ? (
                      <img src={publicUrl} className="h-full w-full object-cover" alt="" />
                    ) : file.mediaType === 'video' ? (
                      <div className="flex h-full w-full items-center justify-center text-2xl bg-slate-100">🎥</div>
                    ) : file.mediaType === 'audio' ? (
                      <div className="flex h-full w-full items-center justify-center text-2xl bg-blue-50">🎵</div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl bg-slate-50">📄</div>
                    )}
                    
                    {/* Checkbox Overlay */}
                    <div className={`absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-md border text-[10px] shadow-sm transition-all ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/80 border-slate-300 opacity-0 group-hover:opacity-100'
                    }`}>
                      {isSelected ? '✓' : ''}
                    </div>

                    {/* Quick Preview Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                      className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-black/50 text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100"
                    >
                      👁️
                    </button>
                  </div>

                  {/* Info Area */}
                  <div className="p-2">
                    {renamingId === file.id ? (
                      <input 
                        autoFocus
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        onBlur={() => handleRename(file)}
                        onKeyDown={e => e.key === 'Enter' && handleRename(file)}
                        className="w-full rounded border border-blue-400 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <div className="flex items-start justify-between gap-1">
                        <div 
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => { setRenamingId(file.id); setTempName(file.originalName); }}
                        >
                          <p title={file.originalName} className="truncate text-[11px] font-bold text-slate-800 hover:text-blue-600 transition-colors">
                            {normalizeDisplayText(file.originalName)}
                          </p>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {formatSize(file.sizeBytes)} • {file.extension}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
          <div className="relative max-h-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewFile(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/50"
            >
              ✕
            </button>
            
            <div className="flex flex-col">
              <div className="max-h-[80vh] overflow-hidden bg-slate-900">
                {previewFile.mediaType === 'image' ? (
                  <img 
                    src={previewFile.publicUrl.startsWith('http') ? previewFile.publicUrl : `${API_URL}${previewFile.publicUrl}`} 
                    className="h-full w-full object-contain" 
                    alt="" 
                  />
                ) : previewFile.mediaType === 'audio' ? (
                  <div className="flex h-48 w-96 flex-col items-center justify-center p-8 bg-blue-900">
                    <div className="text-5xl mb-4">🔊</div>
                    <audio controls autoPlay src={previewFile.publicUrl.startsWith('http') ? previewFile.publicUrl : `${API_URL}${previewFile.publicUrl}`} className="w-full" />
                  </div>
                ) : previewFile.mediaType === 'video' ? (
                   <video controls autoPlay className="max-h-[70vh] w-full" src={previewFile.publicUrl.startsWith('http') ? previewFile.publicUrl : `${API_URL}${previewFile.publicUrl}`} />
                ) : (
                  <div className="flex h-64 w-96 flex-col items-center justify-center text-white">
                    <div className="text-6xl mb-4">📄</div>
                    <p className="text-lg font-bold">{previewFile.originalName}</p>
                    <a 
                      href={previewFile.publicUrl.startsWith('http') ? previewFile.publicUrl : `${API_URL}${previewFile.publicUrl}`} 
                      target="_blank" rel="noreferrer"
                      className="mt-4 rounded-xl bg-white/20 px-6 py-2 font-bold hover:bg-white/30"
                    >
                      Abrir original
                    </a>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">{previewFile.originalName}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{formatSize(previewFile.sizeBytes)} • {previewFile.mimeType}</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(previewFile.publicUrl.startsWith('http') ? previewFile.publicUrl : `${API_URL}${previewFile.publicUrl}`)
                    alert('Link copiado!')
                  }}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
                >
                  🔗 Copiar Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
