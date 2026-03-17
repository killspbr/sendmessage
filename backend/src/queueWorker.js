import 'dotenv/config'
import { query } from './db.js'
import { toEvolutionNumber, resolveTemplate, htmlToWhatsapp, extractImages } from './utils/messageUtils.js'

/**
 * SCHEDULER: Transforma agendamentos em fila de mensagens.
 * Roda periodicamente para verificar o que precisa entrar na fila.
 */
async function runScheduler() {
  try {
    // Busca agendamentos pendentes (status 'agendado' e data/hora <= agora)
    const result = await query(
      `SELECT * FROM campaign_schedule 
       WHERE status = 'agendado' 
       AND (data_inicio < CURRENT_DATE OR (data_inicio = CURRENT_DATE AND hora_inicio <= CURRENT_TIME))`
    );

    for (const schedule of result.rows) {
      console.log(`[Scheduler] Processando agendamento ${schedule.id} para campanha ${schedule.campaign_id}`);
      
      // Marca como 'em_execucao' para evitar processamento duplicado
      await query('UPDATE campaign_schedule SET status = $1 WHERE id = $2', ['em_execucao', schedule.id]);

      // Busca dados da campanha
      const campResult = await query('SELECT * FROM campaigns WHERE id = $1', [schedule.campaign_id]);
      const campaign = campResult.rows[0];
      if (!campaign) {
        await query('UPDATE campaign_schedule SET status = $1 WHERE id = $2', ['erro', schedule.id]);
        continue;
      }

      // Prepara variações de mensagens
      const variations = Array.isArray(campaign.variations) ? campaign.variations : [];
      let variationsList = [campaign.message, ...variations].filter(t => t && t.length > 5);

      // Busca contatos da lista da campanha
      const contactsResult = await query(
        'SELECT * FROM contacts WHERE status = $1 AND list_name = $2 AND user_id = $3',
        ['ativo', campaign.list_name, schedule.user_id]
      );
      const contacts = contactsResult.rows;

      if (contacts.length === 0) {
        console.log(`[Scheduler] Nenhum contato ativo encontrado para a lista ${campaign.list_name}.`);
        await query('UPDATE campaign_schedule SET status = $1 WHERE id = $2', ['concluido', schedule.id]);
        continue;
      }

      console.log(`[Scheduler] Gerando fila para ${contacts.length} contatos.`);

      for (const contact of contacts) {
        // Seleciona uma variação aleatória para cada contato
        const baseMessage = variationsList[Math.floor(Math.random() * variationsList.length)];
        
        // Verifica se já existe na fila (prevenção básica)
        const exists = await query(
          'SELECT 1 FROM message_queue WHERE campaign_id = $1 AND contact_id = $2 AND status = $3',
          [schedule.campaign_id, contact.id, 'pendente']
        );

        if (exists.rows.length === 0) {
          await query(
            'INSERT INTO message_queue (campaign_id, user_id, contact_id, telefone, nome, mensagem) VALUES ($1, $2, $3, $4, $5, $6)',
            [schedule.campaign_id, schedule.user_id, contact.id, contact.phone, contact.name, baseMessage]
          );
        }
      }
    }
  } catch (error) {
    console.error('[Scheduler] Erro no processamento:', error);
  }
}

/**
 * WORKER: Processa a fila de mensagens enviando-as uma a uma.
 * Implementa delays, pausas por lote e limites operacionais.
 */
let isWorkerRunning = false;

async function runWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    // Busca a próxima mensagem pendente de uma campanha ativa
    const msgResult = await query(
      `SELECT mq.*, 
              cs.intervalo_minimo, cs.intervalo_maximo, cs.limite_diario, 
              cs.mensagens_por_lote, cs.tempo_pausa_lote,
              up.evolution_url, up.evolution_apikey, up.evolution_instance
       FROM message_queue mq
       JOIN campaign_schedule cs ON cs.id = (
         SELECT id FROM campaign_schedule 
         WHERE campaign_id = mq.campaign_id AND status = 'em_execucao' 
         ORDER BY data_criacao DESC LIMIT 1
       )
       JOIN user_profiles up ON up.id = mq.user_id
       WHERE mq.status = 'pendente'
       ORDER BY mq.data_criacao ASC
       LIMIT 1`
    );

    if (msgResult.rows.length === 0) {
       // Verifica se há campanhas 'em_execucao' que não tem mais mensagens pendentes -> Marca como concluído
       const finishedSchedules = await query(
         `SELECT cs.id FROM campaign_schedule cs
          WHERE cs.status = 'em_execucao'
          AND NOT EXISTS (SELECT 1 FROM message_queue mq WHERE mq.campaign_id = cs.campaign_id AND mq.status = 'pendente')`
       );
       for (const sch of finishedSchedules.rows) {
         await query('UPDATE campaign_schedule SET status = $1 WHERE id = $2', ['concluido', sch.id]);
         await query('UPDATE campaigns SET status = $1 WHERE id = (SELECT campaign_id FROM campaign_schedule WHERE id = $2)', ['concluido', sch.id]);
       }
       isWorkerRunning = false;
       return;
    }

    const msg = msgResult.rows[0];

    // 1. Verifica Limite Diário
    const sentCountRes = await query(
      "SELECT count(*) FROM message_queue WHERE campaign_id = $1 AND status = 'enviado' AND data_envio >= CURRENT_DATE",
      [msg.campaign_id]
    );
    const sentToday = parseInt(sentCountRes.rows[0].count);

    if (sentToday >= msg.limite_diario) {
      console.log(`[Worker] Limite diário (${msg.limite_diario}) atingido para campanha ${msg.campaign_id}. Pausando.`);
      await query('UPDATE campaign_schedule SET status = $1 WHERE campaign_id = $2 AND status = $3', ['pausado', msg.campaign_id, 'em_execucao']);
      isWorkerRunning = false;
      return;
    }

    // 2. Lógica de Pausa por Lote
    if (sentToday > 0 && sentToday % msg.mensagens_por_lote === 0) {
       console.log(`[Worker] Lote de ${msg.mensagens_por_lote} atingido. Pausando por ${msg.tempo_pausa_lote} minutos.`);
       await query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', ['pausa_lote', `Campanha ${msg.campaign_id} pausada por lote.`]);
       await new Promise(r => setTimeout(r, msg.tempo_pausa_lote * 60 * 1000));
    }

    // 3. Processamento do Envio
    await query('UPDATE message_queue SET status = $1 WHERE id = $2', ['processando', msg.id]);

    const { evolution_url, evolution_apikey, evolution_instance } = msg;

    if (evolution_url && evolution_instance && evolution_apikey) {
      try {
        const evolutionNumber = toEvolutionNumber(msg.telefone);
        if (!evolutionNumber) throw new Error('Número de telefone inválido no formato Evolution.');

        const resolvedHtml = resolveTemplate(msg.mensagem, { name: msg.nome, phone: msg.telefone });
        const messageTextProcessed = htmlToWhatsapp(resolvedHtml);
        const imageUrls = extractImages(resolvedHtml);

        console.log(`[Worker] Enviando para ${evolutionNumber}...`);

        // Envio de Texto
        if (messageTextProcessed) {
          const textResp = await fetch(`${evolution_url}/message/sendText/${evolution_instance}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': evolution_apikey },
            body: JSON.stringify({ number: evolutionNumber, text: messageTextProcessed, linkPreview: true }),
          });
          if (!textResp.ok) {
            const errBody = await textResp.text();
            throw new Error(`Evolution Erro (Texto): ${errBody}`);
          }
        }

        // Envio de Mídias
        for (const imageUrl of imageUrls) {
          const mediaResp = await fetch(`${evolution_url}/message/sendMedia/${evolution_instance}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': evolution_apikey },
            body: JSON.stringify({ number: evolutionNumber, media: imageUrl, mediatype: 'image', caption: '' }),
          });
          if (!mediaResp.ok) console.error('[Worker] Falha ao enviar imagem do lote:', await mediaResp.text());
        }

        // Sucesso
        await query('UPDATE message_queue SET status = $1, data_envio = NOW() WHERE id = $2', ['enviado', msg.id]);
        
      } catch (err) {
        console.error(`[Worker] Erro no envio (${msg.telefone}):`, err.message);
        await query(
          'UPDATE message_queue SET status = $1, erro = $2, tentativas = tentativas + 1 WHERE id = $3', 
          ['falhou', err.message, msg.id]
        );
      }
    } else {
      await query('UPDATE message_queue SET status = $1, erro = $2 WHERE id = $3', ['falhou', 'Evolution API não configurada para este perfil.', msg.id]);
    }

    // 4. Delay Aleatório Pós-Envio (Proteção Anti-Bloqueio)
    const delay = Math.floor(Math.random() * (msg.intervalo_maximo - msg.intervalo_minimo + 1)) + msg.intervalo_minimo;
    console.log(`[Worker] Sucesso. Aguardando ${delay} segundos para a próxima...`);
    
    // Pequeno registro de log operacional
    await query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', ['envio_sucesso', `Mensagem enviada para ${msg.telefone} com delay de ${delay}s`]);

    setTimeout(() => {
      isWorkerRunning = false;
    }, delay * 1000);

  } catch (error) {
    console.error('[Worker] Erro crítico no worker:', error);
    isWorkerRunning = false;
  }
}

// Inicialização dos Loops
// O Scheduler roda a cada 1 minuto para não sobrecarregar o DB e pegar novos agendamentos
setInterval(runScheduler, 60_000);

// O Worker roda continuamente tentando pegar a próxima tarefa
setInterval(runWorker, 2000);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 MOTOR DE ENVIO (QUEUER + WORKER) ATIVO');
console.log('🛡️  Proteção Anti-Bloqueio: Habilitada');
console.log('🤖 Gestão de Filas: Habilitada');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
