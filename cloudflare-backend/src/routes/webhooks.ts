import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { getDb } from '../lib/db'
import { toEvolutionNumber } from '../lib/messageUtils'

export const webhookRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

// Webhook para integração com a Evolution API v2
// Este endpoint recebe eventos de mensagens, status e enquetes
webhookRoutes.post('/evolution', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const db = getDb(c.env)

  // Extrair metadados básicos
  const event = body.event || body.type // Depende da config da Evolution
  const instance = body.instance
  const data = body.data || {}

  console.log(`[Webhook] Evento: ${event} | Instance: ${instance}`)

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
        // Encontra o contato pelo telefone
        // Note: phone aqui é apenas os digitos. O banco pode ter formatado. 
        // Vamos usar um LIKE ou normalização
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
