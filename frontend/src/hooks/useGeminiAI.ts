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

        const companyContext = userCompanyInfo
            ? `\nContexto sobre a empresa remetente:\n${userCompanyInfo}\n(Use essas informações para alinhar o conteúdo ao perfil do negócio.)\n`
            : ''

        let prompt: string

        if (mode === 'suggest') {
            prompt = `
Você é um copywriter sênior e redator especializado em campanhas.

Crie um texto EXTENSO, COMPLETO e DETALHADO para uma campanha de ${channelsLabel},
comunicando-se de forma persuasiva, engajadora e focada em conversão. NÃO restrinja o tamanho do texto a poucas linhas, a menos que seja explicitamente solicitado.

Detalhes:
- Nome da campanha: "${campaignName || 'Campanha sem nome'}"
- Lista: "${listName}"
- Idioma: Português (Brasil)
- Público: pequenas e médias empresas.${companyContext}

Regras:
- Desenvolva bem os argumentos de venda, introdução (gancho forte) e uma clara chamada para ação (CTA).
- Crie um texto rico, com múltiplos parágrafos bem estruturados.
- Pode usar listas com marcadores quando fizer sentido.
${emojiRule}
- Respeite as instruções entre colchetes no nome da campanha (tom, objetivo, tipo, segmento, comprimento e emojis).

Retorne APENAS o texto em HTML simples (tags <p>, <ul>, <li>, <strong>, <em>, <br>), sem marcações markdown como \`\`\`html e sem explicações extras.
      `
        } else {
            prompt = `
Você é um copywriter sênior e redator especializado em campanhas de marketing.

Reescreva o texto abaixo para ficar mais CLARO, PERSUASIVO, ORGANIZADO e ENGAJADOR,
mantendo o sentido central, mas melhorando muito as taxas de conversão. 
Não encurte o tamanho original do texto indiscriminadamente; você pode expandir e adicionar gatilhos mentais para enriquecê-lo!

Nome da campanha (inclui instruções entre colchetes para o tom, objetivo, tipo, segmento, comprimento e uso de emojis):
"${campaignName || 'Campanha sem nome'}"

Texto original (HTML):
${currentContent}
${companyContext}
Regras:
- Respeite o idioma do texto original (português).
- Adicione um gancho (hook) forte no início e uma chamada para ação (CTA) clara no final.
- Pode usar listas com marcadores quando fizer sentido.
${emojiRule}
- Não invente ofertas nem preços que não existiam no original.
- Respeite as instruções entre colchetes no nome da campanha (tom, objetivo, tipo, segmento, comprimento e emojis).
- Retorne APENAS o texto reescrito em HTML simples (tags <p>, <ul>, <li>, <strong>, <em>, <br>), sem marcações markdown como \`\`\`html e sem explicações extras.
      `
        }

        try {
            const forcedGeminiApiVersion = 'v1'
            const forcedGeminiModel = 'gemini-2.5-flash'
            const apiUrl = `https://generativelanguage.googleapis.com/${forcedGeminiApiVersion}/models/${forcedGeminiModel}:generateContent?key=${effectiveAiKey}`

            const tempAdjust = mode === 'suggest' ? 0.1 : -0.1
            const finalTemp = Math.max(0, Math.min(1, geminiTemperature + tempAdjust))

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: finalTemp,
                        maxOutputTokens: geminiMaxTokens,
                    },
                }),
            })

            if (!response.ok) {
                const rawErrorText = await response.text()
                console.error('Erro HTTP ao chamar Gemini:', response.status, rawErrorText)
                throw new Error(`Erro ${response.status}`)
            }

            const data = await response.json()
            const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
            return cleanHtmlOutput(generatedText)
        } catch (error) {
            console.error('Gemini API Error:', error)
            alert('Erro ao se comunicar com a inteligência artificial. Verifique sua chave de API ou tente novamente.')
            return null
        }
    }

    return { callGeminiForCampaign }
}
