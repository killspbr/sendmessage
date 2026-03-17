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
            'INSERT INTO message_queue (schedule_id, campaign_id, user_id, contact_id, telefone, nome, mensagem) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [schedule.id, schedule.campaign_id, schedule.user_id, contact.id, contact.phone, contact.name, baseMessage]
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
    // Busca e marca ATOMICAMENTE a próxima mensagem pendente usando SKIP LOCKED
    // Isso garante que múltiplos workers não peguem a mesma mensagem
    const msgResult = await query(
      `UPDATE message_queue 
       SET status = 'processando', processing_started_at = NOW()
       WHERE id = (
         SELECT id FROM message_queue 
         WHERE status = 'pendente'
         ORDER BY data_criacao ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`
    );

    if (msgResult.rows.length === 0) {
       // Se não há mensagens pendentes, verifica se há campanhas que terminaram
       const finishedSchedules = await query(
         `UPDATE campaign_schedule 
          SET status = 'concluido'
          WHERE status = 'em_execucao'
          AND NOT EXISTS (SELECT 1 FROM message_queue WHERE schedule_id = campaign_schedule.id AND status = 'pendente')
          RETURNING campaign_id`
       );
       for (const sch of finishedSchedules.rows) {
         await query('UPDATE campaigns SET status = $1 WHERE id = $2', ['concluido', sch.campaign_id]);
       }
       isWorkerRunning = false;
       return;
    }

    const msg = msgResult.rows[0];

    // Busca configurações do agendamento vinculado à mensagem
    const configResult = await query(
      `SELECT cs.*, up.evolution_url, up.evolution_apikey, up.evolution_instance
       FROM campaign_schedule cs
       JOIN user_profiles up ON up.id = cs.user_id
       WHERE cs.id = $1`,
      [msg.schedule_id]
    );
    const config = configResult.rows[0];

    if (!config) {
        await query('UPDATE message_queue SET status = $1, erro = $2 WHERE id = $3', ['falhou', 'Agendamento não encontrado.', msg.id]);
        isWorkerRunning = false;
        return;
    }

    // 0. Verifica Reputação do Número
    const repRes = await query('SELECT * FROM whatsapp_reputation WHERE user_id = $1', [msg.user_id]);
    let reputation = repRes.rows[0];

    // Se não existir, cria um perfil 'NOVO'
    if (!reputation) {
      const newRep = await query(
        'INSERT INTO whatsapp_reputation (user_id) VALUES ($1) RETURNING *',
        [msg.user_id]
      );
      reputation = newRep.rows[0];
    }

    // Bloqueia se estiver CRÍTICO
    if (reputation.level === 'CRÍTICO') {
      console.log(`[Worker] Reputação CRÍTICA para usuário ${msg.user_id}. Bloqueando envios por segurança.`);
      await query('UPDATE campaign_schedule SET status = $1 WHERE user_id = $2 AND status = $3', ['pausado', msg.user_id, 'em_execucao']);
      isWorkerRunning = false;
      return;
    }

    // 1. Verifica Limite Diário (Combinado com Reputação)
    const sentCountRes = await query(
      "SELECT count(*) FROM message_queue WHERE user_id = $1 AND status = 'enviado' AND data_envio >= CURRENT_DATE",
      [msg.user_id]
    );
    const sentTodayOverall = parseInt(sentCountRes.rows[0].count);

    let effectiveLimit = config.limite_diario;
    if (reputation.level === 'NOVO') effectiveLimit = Math.min(effectiveLimit, 40);
    if (reputation.level === 'AQUECENDO') effectiveLimit = Math.min(effectiveLimit, 100);
    if (reputation.level === 'ALERTA') effectiveLimit = Math.min(effectiveLimit, 20);

    if (sentTodayOverall >= effectiveLimit) {
      console.log(`[Worker] Limite operacional (${effectiveLimit}) atingido (Reputação: ${reputation.level}). Pausando.`);
      await query('UPDATE campaign_schedule SET status = $1 WHERE user_id = $2 AND status = $3', ['pausado', msg.user_id, 'em_execucao']);
      // Retorna mensagem para pendente pois não foi processada por causa do limite
      await query('UPDATE message_queue SET status = $1 WHERE id = $2', ['pendente', msg.id]);
      isWorkerRunning = false;
      return;
    }

    // 2. Lógica de Pausa por Lote
    if (sentTodayOverall > 0 && sentTodayOverall % config.mensagens_por_lote === 0) {
       console.log(`[Worker] Lote de ${config.mensagens_por_lote} atingido. Pausando por ${config.tempo_pausa_lote} minutos.`);
       await query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', ['pausa_lote', `Usuário ${msg.user_id} pausado por lote.`]);
       await new Promise(r => setTimeout(r, config.tempo_pausa_lote * 60 * 1000));
    }

    // 3. Processamento do Envio
    const { evolution_url, evolution_apikey, evolution_instance } = config;

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
    let minDelay = config.intervalo_minimo;
    let maxDelay = config.intervalo_maximo;

    // Adaptação por Reputação
    if (reputation.level === 'NOVO') { minDelay *= 1.5; maxDelay *= 1.5; }
    if (reputation.level === 'ALERTA') { minDelay *= 3; maxDelay *= 3; }

    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    console.log(`[Worker] Sucesso. Aguardando ${delay} segundos para a próxima (Nível: ${reputation.level})...`);
    
    // Pequeno registro de log operacional
    await query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', ['envio_sucesso', `Mensagem enviada para ${msg.telefone} com delay de ${delay}s (Rep: ${reputation.level})`]);

    setTimeout(() => {
      isWorkerRunning = false;
    }, delay * 1000);

  } catch (error) {
    console.error('[Worker] Erro crítico no worker:', error);
    isWorkerRunning = false;
  }
}

/**
 * CLEANUP: Recupera mensagens travadas em status 'processando' por mais de 10 minutos.
 */
async function runCleanup() {
  try {
    const TIMEOUT_MINUTES = 10;
    const MAX_TRIES = 3;

    // 1. RECUPERAÇÃO: Volta para pendente se ainda houver saldo de tentativas
    const recoveryRes = await query(
      `UPDATE message_queue
       SET status = 'pendente', 
           tentativas = tentativas + 1, 
           erro = 'Recuperado automaticamente: timeout de processamento',
           recovered_at = NOW(),
           processing_started_at = NULL -- LIMPA para permitir novo ciclo
       WHERE status = 'processando' 
       AND processing_started_at < NOW() - INTERVAL '10 minutes'
       AND tentativas < $1
       RETURNING id, schedule_id, user_id, tentativas`,
      [MAX_TRIES]
    );

    for (const msg of recoveryRes.rows) {
      console.log(`[Cleanup] Mensagem ${msg.id} recuperada para pendente.`);
      await query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', 
        ['zombie_recovered', JSON.stringify({
          message_id: msg.id,
          schedule_id: msg.schedule_id,
          user_id: msg.user_id,
          motivo: 'Timeout de processamento (>10 min)',
          tentativa_final: msg.tentativas,
          timestamp: new Date().toISOString()
        })]);
    }

    // 2. FALHA DEFINITIVA: Se travou 3 vezes seguidas no timeout, descarta
    const failRes = await query(
      `UPDATE message_queue
       SET status = 'falhou', 
           erro = 'Falha definitiva: timeout de processamento excedido',
           data_envio = NOW(),
           processing_started_at = NULL
       WHERE status = 'processando' 
       AND processing_started_at < NOW() - INTERVAL '10 minutes'
       AND tentativas >= $1
       RETURNING id, schedule_id, user_id, tentativas`,
      [MAX_TRIES]
    );

    for (const msg of failRes.rows) {
      console.log(`[Cleanup] Mensagem ${msg.id} marcada como falha definitiva.`);
      await query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', 
        ['zombie_failed', JSON.stringify({
          message_id: msg.id,
          schedule_id: msg.schedule_id,
          user_id: msg.user_id,
          motivo: 'Limite de tentativas excedido por timeout',
          tentativa_final: msg.tentativas,
          timestamp: new Date().toISOString()
        })]);
    }

  } catch (error) {
    console.error('[Cleanup] Erro na rotina de recuperação:', error);
  }
}

// Inicialização dos Loops
// O Scheduler roda a cada 1 minuto para não sobrecarregar o DB e pegar novos agendamentos
setInterval(runScheduler, 60_000);

// O Worker roda continuamente tentando pegar a próxima tarefa
setInterval(runWorker, 2000);

// O Cleanup roda a cada 5 minutos
setInterval(runCleanup, 300_000);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 MOTOR DE ENVIO (QUEUER + WORKER) ATIVO');
console.log('🛡️  Proteção Anti-Bloqueio: Habilitada');
console.log('🤖 Gestão de Filas: Habilitada');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
