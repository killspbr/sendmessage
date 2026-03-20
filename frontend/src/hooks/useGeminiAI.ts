import type { CampaignChannel } from '../types'

export type GeminiAIParams = {
    mode: 'suggest' | 'rewrite'
    currentContent: string
    campaignName: string
    listName: string
    channels: CampaignChannel[]
    tone?: 'neutral' | 'friendly' | 'sales' | 'educational'
    goal?: 'leads' | 'direct_sale' | 'engagement' | 'reactivation'
    campaignType?: 'first_contact' | 'follow_up' | 'recovery'
    segment?: string
    useEmojis?: boolean
    messageSize?: 'short' | 'medium' | 'long'
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

const toneInstructions = {
    neutral: 'Tom profissional, objetivo e claro.',
    friendly: 'Tom amigável, acolhedor e próximo, sem perder profissionalismo.',
    sales: 'Tom comercial, persuasivo e orientado à conversão, sem parecer agressivo.',
    educational: 'Tom consultivo, didático e confiável.',
} as const

const goalInstructions = {
    leads: 'Objetivo principal: gerar resposta inicial, interesse ou pedido de orçamento.',
    direct_sale: 'Objetivo principal: converter para venda ou avanço comercial imediato.',
    engagement: 'Objetivo principal: incentivar interação, clique ou resposta do contato.',
    reactivation: 'Objetivo principal: reativar contatos frios ou sem resposta recente.',
} as const

const campaignTypeInstructions = {
    first_contact: 'Contexto: primeiro contato com a base.',
    follow_up: 'Contexto: follow-up de uma abordagem anterior.',
    recovery: 'Contexto: recuperação de interesse ou retomada de conversa.',
} as const

const sizeLabelMap = {
    short: 'curta',
    medium: 'média',
    long: 'longa',
} as const

function getChannelStrategy(channels: CampaignChannel[], messageSize: 'short' | 'medium' | 'long') {
    const hasWhatsapp = channels.includes('whatsapp')
    const hasEmail = channels.includes('email')

    if (hasWhatsapp && !hasEmail) {
        if (messageSize === 'short') {
            return {
                label: 'WhatsApp',
                sizeInstruction: 'Escreva uma mensagem curta de WhatsApp com 1 bloco principal e CTA claro. Meta: 40 a 70 palavras.',
                structureInstruction: 'Use frases curtas, leitura rápida em mobile e no máximo 2 parágrafos curtos.',
                tokenFloor: 320,
            }
        }
        if (messageSize === 'medium') {
            return {
                label: 'WhatsApp',
                sizeInstruction: 'Escreva uma mensagem média de WhatsApp. Meta: 80 a 140 palavras.',
                structureInstruction: 'Organize em 2 a 4 parágrafos curtos, com benefício claro e CTA objetivo.',
                tokenFloor: 520,
            }
        }
        return {
            label: 'WhatsApp',
            sizeInstruction: 'Escreva uma mensagem longa de WhatsApp sem virar parede de texto. Meta: 140 a 240 palavras.',
            structureInstruction: 'Use 4 a 6 blocos curtos, listas curtas quando fizer sentido e CTA final explícito.',
            tokenFloor: 800,
        }
    }

    if (!hasWhatsapp && hasEmail) {
        if (messageSize === 'short') {
            return {
                label: 'Email',
                sizeInstruction: 'Escreva um corpo de email curto. Meta: 80 a 140 palavras.',
                structureInstruction: 'Use 2 a 3 parágrafos e fechamento com CTA simples.',
                tokenFloor: 420,
            }
        }
        if (messageSize === 'medium') {
            return {
                label: 'Email',
                sizeInstruction: 'Escreva um corpo de email médio. Meta: 160 a 260 palavras.',
                structureInstruction: 'Use 3 a 5 parágrafos, podendo incluir uma lista curta de benefícios.',
                tokenFloor: 720,
            }
        }
        return {
            label: 'Email',
            sizeInstruction: 'Escreva um corpo de email longo, denso e bem desenvolvido. Meta: 260 a 420 palavras.',
            structureInstruction: 'Use 5 a 7 parágrafos curtos ou blocos com bullets para manter boa leitura.',
            tokenFloor: 1100,
        }
    }

    if (messageSize === 'short') {
        return {
            label: 'WhatsApp e Email',
            sizeInstruction: 'Escreva um texto híbrido curto que funcione bem em WhatsApp e ainda se sustente em email. Meta: 70 a 110 palavras.',
            structureInstruction: 'Use 2 ou 3 blocos curtos, linguagem direta e CTA simples.',
            tokenFloor: 420,
        }
    }
    if (messageSize === 'medium') {
        return {
            label: 'WhatsApp e Email',
            sizeInstruction: 'Escreva um texto híbrido médio. Meta: 120 a 220 palavras.',
            structureInstruction: 'Use 3 a 4 blocos curtos, equilíbrio entre objetividade e contexto.',
            tokenFloor: 760,
        }
    }
    return {
        label: 'WhatsApp e Email',
        sizeInstruction: 'Escreva um texto híbrido longo, mantendo legibilidade em WhatsApp e profundidade suficiente para email. Meta: 220 a 340 palavras.',
        structureInstruction: 'Use blocos curtos, boa progressão de argumento e CTA bem destacado no fechamento.',
        tokenFloor: 1100,
    }
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

        const {
            mode,
            currentContent,
            campaignName,
            listName,
            channels,
            tone = 'friendly',
            goal = 'leads',
            campaignType = 'first_contact',
            segment = 'Genérico',
            useEmojis = true,
            messageSize = 'medium',
        } = params

        const channelsLabel =
            channels.includes('whatsapp') && channels.includes('email')
                ? 'WhatsApp e Email'
                : channels.includes('whatsapp')
                    ? 'WhatsApp'
                    : channels.includes('email')
                        ? 'Email'
                        : 'mensagens'

        const emojiRule = useEmojis
            ? '- Use emojis relevantes ao contexto, sem exagero.'
            : '- Não use emojis.'

        const channelStrategy = getChannelStrategy(channels, messageSize)

        const companyContext = userCompanyInfo
            ? `\nContexto sobre a empresa remetente:\n${userCompanyInfo}\n(Use essas informações para alinhar o conteúdo ao perfil do negócio.)\n`
            : ''

        let prompt: string

        if (mode === 'suggest') {
            prompt = `
Você é um copywriter sênior especialista em marketing digital e redação publicitária de alto impacto.

Sua missão é criar o conteúdo completo de uma campanha persuasiva para ${channelsLabel}.

DADOS DA CAMPANHA:
- Nome: "${campaignName || 'Campanha sem nome'}"
- Público/Segmento da lista: "${listName}"
- Segmento informado: "${segment}"
- Idioma: Português (Brasil)${companyContext}

CONTEXTO ESTRATÉGICO:
- Canal principal de escrita: ${channelStrategy.label}
- Tamanho solicitado: ${sizeLabelMap[messageSize]}
- ${toneInstructions[tone]}
- ${goalInstructions[goal]}
- ${campaignTypeInstructions[campaignType]}

DIRETRIZ DE TAMANHO:
- ${channelStrategy.sizeInstruction}
- ${channelStrategy.structureInstruction}
- Não corte a mensagem antes de concluir a linha de raciocínio.
- Entregue a peça completa com abertura, desenvolvimento e CTA final.

REGRAS DE CONTEÚDO:
- Estrutura: gancho forte -> problema -> solução/benefícios -> prova social implícita -> CTA claro.
- Use parágrafos claros e, quando fizer sentido, listas curtas com marcadores.
- Destaque termos importantes em <strong>.
${emojiRule}

FORMATO DE SAÍDA:
- Retorne apenas HTML semântico direto com tags como <p>, <ul>, <li>, <strong>, <em> e <br>.
- Não use blocos de código.
- Não inclua assunto de email.
- Não use placeholders genéricos como "[Nome]".
`
        } else {
            prompt = `
Você é um revisor e copywriter sênior. Sua tarefa é reescrever e expandir o texto HTML abaixo para deixá-lo mais persuasivo, mais claro e melhor adaptado ao canal.

TEXTO ORIGINAL (HTML):
${currentContent}

DIRETRIZ DE TAMANHO:
- Canal principal de escrita: ${channelStrategy.label}
- Tamanho solicitado: ${sizeLabelMap[messageSize]}
- ${channelStrategy.sizeInstruction}
- ${channelStrategy.structureInstruction}
- Se o texto original estiver menor do que o tamanho pedido, expanda com substância real.
- Não devolva texto pela metade. Sempre finalize o raciocínio e o CTA.

CONTEXTO DA CAMPANHA:
- Nome: "${campaignName || 'Campanha sem nome'}"
- Público/Segmento da lista: "${listName}"
- Segmento informado: "${segment}"${companyContext}

REGRAS:
- ${toneInstructions[tone]}
- ${goalInstructions[goal]}
- ${campaignTypeInstructions[campaignType]}
- Melhore fluidez, clareza e persuasão.
- Adicione argumentos de valor quando necessário.
${emojiRule}

FORMATO DE SAÍDA:
- Retorne apenas o HTML reescrito com tags como <p>, <ul>, <li>, <strong>, <em> e <br>.
- Não use markdown nem explicações fora do HTML.
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
            const requestedMaxTokens = Math.max(geminiMaxTokens, channelStrategy.tokenFloor)

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    prompt,
                    model: geminiModel,
                    apiVersion: geminiApiVersion,
                    temperature: finalTemp,
                    maxTokens: requestedMaxTokens,
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
