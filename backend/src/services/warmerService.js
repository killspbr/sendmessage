import { query } from '../db.js'

const WARMER_MESSAGES = [
  "Bom dia! Tudo bem?",
  "Opa, tranquilo?",
  "Como estão as coisas por aí?",
  "Vi aquela notícia hoje, muito louco né?",
  "E aí, novidades?",
  "Tudo certo para mais tarde?",
  "Cara, você não vai acreditar...",
  "Boa tarde! Como foi o almoço?",
  "Tranquilidade?",
  "Passando para dar um alô!",
  "Me tira uma dúvida rápida depois?",
  "Nossa as coisas estão corridas hoje",
  "Alô? Tá por aí?",
  "Tudo caminhando por aqui, e contigo?",
  "Bom começo de semana!",
  "Sextou? hehe"
];

function getRandomMessage() {
  return WARMER_MESSAGES[Math.floor(Math.random() * WARMER_MESSAGES.length)];
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retorna as configs globais da Evolution (usaremos a global pois os chips são do admin)
async function getGlobalEvolutionConfig() {
  const result = await query(
    'SELECT evolution_api_url, evolution_api_key FROM app_settings ORDER BY id DESC LIMIT 1'
  )
  const settings = result.rows[0] || {}
  return {
    url: String(settings.evolution_api_url || '').trim(),
    apiKey: String(settings.evolution_api_key || '').trim(),
  }
}

// Disparo assíncrono genérico
async function postEvolution(url, apiKey, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

// Envio de presença (composing/recording)
async function sendPresence(evolutionUrl, apiKey, instanceName, toPhone, type = 'composing') {
  await postEvolution(
    `${evolutionUrl}/chat/sendPresence/${instanceName}`,
    apiKey,
    {
      number: toPhone,
      presence: type,
      delay: 0
    }
  );
}

// Envio de texto
async function sendText(evolutionUrl, apiKey, instanceName, toPhone, text) {
  await postEvolution(
    `${evolutionUrl}/message/sendText/${instanceName}`,
    apiKey,
    {
      number: toPhone,
      text: text,
      linkPreview: true,
      delay: 0
    }
  );
}

export async function runWarmer() {
  try {
    const { url: evoUrl, apiKey: evoKey } = await getGlobalEvolutionConfig();
    if (!evoUrl || !evoKey) {
      console.log('[Warmer] Evolution API não configurada globalmente.');
      return;
    }

    // Buscar configs ativas dentro do horário comercial (business_hours_start e end)
    const result = await query(`
      SELECT 
        id, instance_a_id, instance_b_id, phone_a, phone_b, 
        base_daily_limit, increment_per_day, start_date 
      FROM warmer_configs 
      WHERE status = 'active'
        AND CURRENT_TIME >= business_hours_start
        AND CURRENT_TIME <= business_hours_end
    `);

    const activeWarmers = result.rows;

    for (const warmer of activeWarmers) {
      // 1. Calcular dias corridos
      const startDate = new Date(warmer.start_date);
      const today = new Date();
      // zerar horas p/ diferença exata de dias
      startDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const diffTime = Math.abs(today - startDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // 2. Limite hoje
      const limiteHoje = Number(warmer.base_daily_limit) + (diffDays * Number(warmer.increment_per_day));

      // 3. Contagem de hoje
      const logsResult = await query(`
        SELECT count(*)::int as total 
        FROM warmer_logs 
        WHERE warmer_id = $1 AND sent_at >= CURRENT_DATE
      `, [warmer.id]);
      const sentToday = logsResult.rows[0].total;

      if (sentToday >= limiteHoje) {
        // Limite diário atingido, ignora iteracao
        continue;
      }

      // Jitter (delay aleatório p/ não enviar cravado no minuto cron)
      // Math.random() < 0.3 = 30% de chance de rodar neste pulso do worker pra dar mais aleatoriedade
      if (Math.random() > 0.3) {
        continue;
      }

      // Definir direção (A -> B ou B -> A)
      const directionAtoB = Math.random() > 0.5;
      const fromInstance = directionAtoB ? warmer.instance_a_id : warmer.instance_b_id;
      const toPhone = directionAtoB ? warmer.phone_b : warmer.phone_a;
      
      const messageContent = getRandomMessage();

      try {
        console.log(`[Warmer] Iniciando warming de ${fromInstance} para ${toPhone}`);
        // Log "Sending presence..."
        await sendPresence(evoUrl, evoKey, fromInstance, toPhone, 'composing');
        
        // Wait human delay (2 to 6 seconds)
        const typingDelay = Math.floor(Math.random() * 4000) + 2000;
        await wait(typingDelay);

        // Send Text
        await sendText(evoUrl, evoKey, fromInstance, toPhone, messageContent);

        // Record Log
        await query(`
          INSERT INTO warmer_logs (warmer_id, from_phone, to_phone, message_type, content_summary)
          VALUES ($1, $2, $3, $4, $5)
        `, [warmer.id, fromInstance, toPhone, 'text', messageContent]);

        console.log(`[Warmer] Sucesso (${sentToday + 1}/${limiteHoje} hoje)`);
      } catch (err) {
        console.error(`[Warmer] Erro ao enviar maturação para Warmer ID ${warmer.id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[Warmer] Falha crítica na rotina do Worker:', error);
  }
}
