import React, { useState } from 'react'

type ExtractPageProps = {
    onAiExtractContact: (file: File) => Promise<void>
    isExtracting: boolean
    lastMessage: string | null
}

export function ExtractPage({ onAiExtractContact, isExtracting, lastMessage }: ExtractPageProps) {
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onAiExtractContact(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            onAiExtractContact(e.target.files[0])
        }
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Extração Inteligente</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Utilize nossa IA para extrair dados de contatos a partir de fotos de cartões de visita ou prints.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div
                        className={`relative group h-80 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 text-center ${dragActive
                                ? 'border-violet-500 bg-violet-50/50 shadow-2xl shadow-violet-200/50'
                                : 'border-slate-200 bg-white hover:border-violet-400/50 hover:bg-slate-50/50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            id="input-file-upload"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleChange}
                            accept="image/*"
                        />

                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform duration-500 ${isExtracting ? 'animate-bounce bg-violet-100' : 'bg-slate-100 group-hover:scale-110 group-hover:bg-violet-100'}`}>
                            {isExtracting ? (
                                <span className="text-3xl animate-pulse">✨</span>
                            ) : (
                                <span className="text-3xl">📸</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <p className="text-base font-semibold text-slate-800">
                                {isExtracting ? 'Analisando imagem...' : 'Arraste uma imagem aqui'}
                            </p>
                            <p className="text-xs text-slate-500 max-w-[200px]">
                                ou clique para selecionar um arquivo (PNG, JPG)
                            </p>
                        </div>

                        {isExtracting && (
                            <div className="absolute inset-x-0 bottom-0 p-4">
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-progress" style={{ width: '100%' }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {lastMessage && (
                        <div className={`p-4 rounded-2xl text-xs font-medium border ${lastMessage.includes('sucesso') || lastMessage.includes('extraídos')
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                : 'bg-amber-50 border-amber-100 text-amber-700'
                            }`}>
                            {lastMessage}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-violet-400"></span>
                            Como funciona?
                        </h3>
                        <ul className="space-y-4 text-xs text-slate-300">
                            <li className="flex gap-3">
                                <span className="shrink-0 h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">1</span>
                                <span>Tire uma foto nítida de um cartão de visita ou faça um print de um perfil comercial.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="shrink-0 h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">2</span>
                                <span>Nossa IA processará a imagem e tentará identificar: Nome, WhatsApp, E-mail e Categoria.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="shrink-0 h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">3</span>
                                <span>Os dados aparecerão no formulário para sua revisão. Ao salvar, o contato irá para a lista "IA".</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-violet-500 rounded-3xl p-6 text-white shadow-xl shadow-violet-200">
                        <h3 className="text-sm font-semibold mb-2 italic">Dica Pro:</h3>
                        <p className="text-[11px] text-violet-100 leading-relaxed">
                            Você também pode usar essa ferramenta para extrair endereços completos. Certifique-se de que o CEP esteja visível na imagem para maior precisão!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
