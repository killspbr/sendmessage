import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { getDb } from '../lib/db'

export const webhookRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

function authenticateWebhookSecret(c: any) {
  const querySecret = c.req.query('secret') || c.req.query('apikey')
  const env: Bindings = c.env
  const expected = String(env.WEBHOOK_SECRET || '').trim()

  // Se WEBHOOK_SECRET nao estiver configurado, permitimos (modo permissivo)
  if (!expected) return null

  if (querySecret !== expected) {
    return c.json({ error: 'Webhook secret invalid ou ausente.' }, 401)
  }
  return null
}

// Webhook para integração com a Evolution API v2
// Este endpoint recebe eventos de mensagens, status e enquetes
// Protegido por query param ?secret (configurado na URL do webhook na Evolution)
// Exemplo: https://seu-worker/api/webhooks/evolution?secret=SEU_SECRET
webhookRoutes.post('/evolution', async (c) => {
  const authError = authenticateWebhookSecret(c)
  if (authError) return authError
  const body = await c.req.json().catch(() => ({}))
  const db = getDb(c.env)

  // Extrair metadados básicos
  const event = body.event || body.type 
  const instance = body.instance
  const data = body.data || {}
  const remoteJid = data.key?.remoteJid
  const fromMe = data.key?.fromMe
  const isGroup = remoteJid?.includes('@g.us')

  console.log(`[Webhook] Evento: ${event} | Instance: ${instance} | RemoteJid: ${remoteJid}`)

  // 1. Lógica de Chatbot IA (Gemini)
  // Respondemos apenas se: for mensagem recebida, em chat privado, e evento de mensagem nova
  if (event === 'messages.upsert' && !fromMe && !isGroup && data.message) {
    const text = data.message.conversation || data.message.extendedTextMessage?.text
    if (text && text.length > 0) {
      console.log(`[Webhook] Mensagem de texto recebida: ${text}`)
      
      // Tenta responder via IA se houver chave configurada
      await handleAiResponse(c, db, instance, remoteJid, text)
    }
  }

  // 1. Lógica de Enquetes (Poll Votes)
  // O evento na Evolution API v2 para votos costuma ser 'poll.vote' ou dentro de 'messages.upsert'
  if (event === 'messages.upsert' && data.message?.pollUpdateMessage) {
    const pollVote = data.message.pollUpdateMessage
    const remoteJid = data.key?.remoteJid
    const sender = tokensToNumber(remoteJid)

    if (sender) {
      console.log(`[Webhook] Voto em enquete detectado de ${sender}`)
      
      // Aqui poderíamos processar o voto e atualizar o status do lead
      // v2 Evolution envia o hash do voto. Precisamos do mapeamento
    }
  }

  // 2. Lógica de Resposta Interativa (Buttons/List)
  if (event === 'messages.upsert' && (data.message?.buttonsResponseMessage || data.message?.listResponseMessage)) {
    const response = data.message?.buttonsResponseMessage || data.message?.listResponseMessage
    const remoteJid = data.key?.remoteJid
    const sender = tokensToNumber(remoteJid)

    if (sender) {
        const selectedId = response.selectedButtonId || response.singleSelectReply?.selectedRowId
        console.log(`[Webhook] Resposta interativa de ${sender}: ${selectedId}`)

        // Se o lead clicou em um botão de "Tenho Interesse", marcamos no CRM
        if (selectedId?.toLowerCase().includes('interesse')) {
            await markLeadAsHot(db, sender)
        }
    }
  }

  return c.json({ ok: true })
})

function tokensToNumber(jid: string): string | null {
    if (!jid) return null
    return jid.split('@')[0]
}

async function markLeadAsHot(db: any, phone: string) {
    try {
        const searchPhone = `%${phone}`
        
        await db.query(`
            UPDATE public.contacts 
            SET labels = COALESCE(labels, '[]'::jsonb) || '["HOT_LEAD"]'::jsonb
            WHERE phone LIKE $1
        `, [searchPhone])
        
        console.log(`[CRM] Lead ${phone} marcado como HOT_LEAD via Automação de Feedback.`)
    } catch (err) {
        console.error(`[CRM] Erro ao marcar lead ${phone}:`, err)
    }
}

async function handleAiResponse(c: any, db: any, instance: string, remoteJid: string, userText: string) {
    try {
        // 1. Busca configurações de IA no banco
        const settings = await db.query('SELECT evolution_url, evolution_key, gemini_api_key, gemini_prompt FROM public.settings LIMIT 1')
        if (settings.rows.length === 0) return

        const { evolution_url, evolution_key, gemini_api_key, gemini_prompt } = settings.rows[0]
        if (!gemini_api_key) return

        const evolutionUrl = evolution_url.replace(/\/$/, '')
        
        // 2. Chama Gemini (API key no header, nao na URL)
        const aiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': gemini_api_key,
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userText }] }],
                systemInstruction: gemini_prompt ? { parts: [{ text: gemini_prompt }] } : undefined,
                generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
            })
        })

        if (!aiRes.ok) {
            console.error('[IA] Falha ao chamar Gemini no Webhook')
            return
        }

        const aiData = await aiRes.json() as any
        const aiText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text

        if (aiText) {
            console.log(`[IA] Gerada resposta: ${aiText.slice(0, 50)}...`)
            
            // 3. Envia resposta via Evolution
            await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
                method: 'POST',
                headers: { 
                    'apikey': evolution_key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    number: remoteJid,
                    text: aiText,
                    delay: 1200 // Simula digitação curta
                })
            })
        }
    } catch (err) {
        console.error('[IA] Erro no processamento do Chatbot:', err)
    }
}
