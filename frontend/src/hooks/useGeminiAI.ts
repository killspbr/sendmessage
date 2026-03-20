import type { CampaignChannel } from '../types'

export type GeminiAIParams = {
    mode: 'suggest' | 'rewrite'
    currentContent: string
    campaignName: string
    listName: string
    channels: CampaignChannel[]
}

export type UseGeminiAIProps = {
    effectiveAiKey: string | null
    userCompanyInfo?: string | null
    geminiTemperature: number
    geminiMaxTokens: number
    geminiModel?: string
    geminiApiVersion?: string
}

const decodeHtml = (html: string) => {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
}

const cleanHtmlOutput = (html: string) => {
    if (!html) return ''
    let text = html.replace(/```(?:html)?/g, '').replace(/```/g, '')
    text = decodeHtml(text)
    text = text.replace(/[ \t]+\n/g, '\n')
    text = text.replace(/\n{2,}/g, '\n\n')
    return text.trim()
}

export function useGeminiAI({
    effectiveAiKey,
    userCompanyInfo,
    geminiTemperature,
    geminiMaxTokens,
    geminiModel = 'gemini-2.5-flash',
    geminiApiVersion = 'v1',
}: UseGeminiAIProps) {
    const callGeminiForCampaign = async (params: GeminiAIParams): Promise<string | null> => {
        if (!effectiveAiKey) {
            alert(
                'Nenhuma API de IA está configurada. Peça ao administrador para definir uma chave global do Gemini ou informe sua própria chave em "Meu perfil".',
            )
            return null
        }

        const { mode, currentContent, campaignName, listName, channels } = params

        const channelsLabel =
            channels.includes('whatsapp') && channels.includes('email')
                ? 'WhatsApp e Email'
                : channels.includes('whatsapp')
                    ? 'WhatsApp'
                    : channels.includes('email')
                        ? 'Email'
                        : 'mensagens'

        const wantsEmojis = campaignName.toLowerCase().includes('emojis=sim')
        const emojiRule = wantsEmojis
            ? '- Use emojis relevantes ao contexto (sem exagero, 1 a 3 por parágrafo no máximo).'
            : '- Não use emojis.'

        // Tentar extrair o nível de comprimento do nome da campanha
        const lengthMatch = campaignName.match(/comprimento=(\d+)\/10/)
        const level = lengthMatch ? parseInt(lengthMatch[1], 10) : 5

        // Diretivas de comprimento mais agressivas e explícitas
        const lengthDirectives = level <= 2
            ? 'Crie uma mensagem CURTA e DIRETA. Máximo de 50 palavras.'
            : level <= 4
                ? 'Crie uma mensagem de TAMANHO MÉDIO. Mínimo de 100 palavras e 3 parágrafos.'
                : level <= 7
                    ? 'Crie uma mensagem LONGA, DETALHADA e EXPLICATIVA. Mínimo de 300 palavras e pelo menos 5 parágrafos robustos. Desenvolva profundamente os argumentos e use gatilhos de benefício.'
                    : 'Crie uma CARTA DE VENDAS COMPLETA e EXTENSA. Texto muito longo, mínimo de 600 palavras e pelo menos 8 parágrafos, explorando cada dor e solução detalhadamente.'

        const companyContext = userCompanyInfo
            ? `\nContexto sobre a empresa remetente:\n${userCompanyInfo}\n(Use essas informações para alinhar o conteúdo ao perfil do negócio.)\n`
            : ''

        let prompt: string

        if (mode === 'suggest') {
            prompt = `
Você é um copywriter sênior especialista em marketing digital e redação publicitária de ALTO IMPACTO.

Sua missão é criar o conteúdo COMPLETO de uma campanha persuasiva para ${channelsLabel}.

DADOS DA CAMPANHA:
- Nome: "${campaignName || 'Campanha sem nome'}"
- Público/Segmento: "${listName}"
- Idioma: Português (Brasil)${companyContext}

DIRETRIZ DE COMPRIMENTO (OBRIGATÓRIO):
Escala de Comprimento Solicitada: ${level}/10.
INSTRUÇÃO ESPECÍFICA: ${lengthDirectives}
AVISO CRÍTICO: Se o nível for 5 ou superior, você NÃO pode ser breve. O texto deve ser RICO, informativo e ter muita substância. NÃO resuma. Escreva textos longos e envolventes.

REGRAS DE CONTEÚDO:
- Estrutura: Gancho forte -> Problema -> Solução/Benefícios -> Prova Social implícita -> Chamada Para Ação (CTA) clara.
- Formatação: Use parágrafos claros, listas com marcadores (bullets) e destaque termos importantes em negrito (<strong>).
${emojiRule}

FORMATO DE SAÍDA:
- Retorne APENAS o HTML semântico direto (tags <p>, <ul>, <li>, <strong>, <em>, <br>).
- NÃO use blocos de código (\`\`\`html).
- NÃO inclua o Assunto da mensagem.
- NÃO apresente saudações fixas como "[Nome]" ou placeholders genéricos.
      `
        } else {
            prompt = `
Você é um revisor e copywriter sênior de elite. Sua tarefa é REESCREVER e EXPANDIR substancialmente o texto HTML abaixo para torná-lo muito mais persuasivo, profissional e atraente.

TEXTO ORIGINAL (HTML):
${currentContent}

DIRETRIZ DE COMPRIMENTO (OBRIGATÓRIO):
Escala de Comprimento Solicitada: ${level}/10.
INSTRUÇÃO ESPECÍFICA: ${lengthDirectives}
AVISO CRÍTICO: Se o nível for 5 ou superior, você deve ENRIQUECER o texto com novos parágrafos, detalhes adicionais e argumentos de venda que não estavam no original. NÃO encurte o texto se o nível for alto. Se o conteúdo original for curto, seu dever é dobrar ou triplicar o tamanho com copy de qualidade.

CONTEÚDO DA CAMPANHA:
"${campaignName || 'Campanha sem nome'}"
${companyContext}
REGRAS:
- Melhore a fluidez e a persuasão.
- Adicione gatilhos mentais fortes.
${emojiRule}

FORMATO DE SAÍDA:
- Retorne APENAS o HTML reescrito (tags <p>, <ul>, <li>, <strong>, <em>, <br>).
- NÃO use blocos de código markdown nem explicações.
      `
        }

        try {
            const token = localStorage.getItem('auth_token')
            const baseUrl = (import.meta as any).env.VITE_API_URL || 'https://clrodrigues-sendmessage-backend.rsybpi.easypanel.host'
            const apiUrl = `${baseUrl}/api/ai/proxy`

            if (!token) {
                alert('Sua sessão expirou. Faça login novamente para usar a IA.')
                return null
            }

            const tempAdjust = mode === 'suggest' ? 0.1 : -0.1
            const finalTemp = Math.max(0, Math.min(1, geminiTemperature + tempAdjust))

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: geminiModel,
                    apiVersion: geminiApiVersion,
                    temperature: finalTemp,
                    maxTokens: geminiMaxTokens
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('auth_token')
                    localStorage.removeItem('auth_user')
                    throw new Error('Token inválido ou expirado. Faça login novamente.')
                }
                const errorMessage =
                    data?.error?.message ||
                    data?.error ||
                    data?.message ||
                    `Erro ${response.status}`
                throw new Error(String(errorMessage))
            }

            const data = await response.json()
            const parts = data?.candidates?.[0]?.content?.parts || []
            const generatedText = parts.map((p: any) => p.text).join('')

            return cleanHtmlOutput(generatedText)
        } catch (error: any) {
            console.error('Gemini API Error (Proxy):', error)
            alert(error.message || 'Erro ao se comunicar com a inteligência artificial. Verifique se há chaves Gemini ativas no painel administrativo.')
            return null
        }
    }

    return { callGeminiForCampaign }
}
