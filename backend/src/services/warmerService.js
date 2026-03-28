import { query } from '../db.js'
import { getActiveGeminiKey, incrementKeyUsage } from './aiService.js'

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

async function fetchRecentLogs(warmerId) {
  const result = await query(`
    SELECT from_phone, content_summary 
    FROM warmer_logs 
    WHERE warmer_id = $1 
    ORDER BY sent_at DESC 
    LIMIT 5
  `, [warmerId]);
  
  const historyLines = result.rows.reverse().map(row => {
    return `[${row.from_phone}]: ${row.content_summary}`;
  });
  
  if (historyLines.length === 0) {
    return "Nenhum histórico anterior.";
  }
  return historyLines.join('\n');
}

async function generateDynamicMessage(history, myPhone, toPhone) {
  // Vamos usar a chave do banco da nossa engine do backend
  const keyObj = await getActiveGeminiKey();
  if (!keyObj || !keyObj.api_key) {
    throw new Error('Sem chave Gemini disponível');
  }

  const systemInstruction = `Aja e comunique-se como um brasileiro comum usando o WhatsApp.
Você é a pessoa do número de telefone [${myPhone}] conversando com [${toPhone}].
Regras obrigatórias:
1. Responda em até 140 caracteres no máximo. Seja MUITO curto (uma ou duas frases curtas).
2. É um chat orgânico: use gírias, contrações e abreviações comuns do brasil (vc, tbm, suave, po, mano, etc).
3. Ocasionalmente (uns 20% das vezes) erre alguma digitação ou falte pontuação, mantendo total informalidade.
4. Use no máximo um emoji por vez.
5. Baseie-se no 'Histórico da conversa' (fornecido no prompt) para continuar o contexto ou emendar um novo assunto caso as mensagens anteriores já tenham esgotado o assunto. Nunca reproduza as tags [Numero], apenas o texto.`;

  const prompt = `Histórico da conversa:\n${history}\n\nEscreva sua próxima mensagem sendo [${myPhone}]:`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyObj.api_key}`;
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 60,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText.substring(0, 100));
  }

  const data = await response.json();
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  await incrementKeyUsage(keyObj.id, 'warmer', 'Generated Warmer Msg', null, null, 'global-pool', keyObj.nome);

  if (!generatedText) {
    throw new Error('Falha ao processar resposta da Inteligência Artificial');
  }

  // Remove marcações caso o gemini ache que ele deva responder prefixado com "[numero]:"
  let cleanText = generatedText.replace(new RegExp(`^\\[?${myPhone}\\]?:\\s*`, 'i'), '');
  cleanText = cleanText.replace(/^[\"\'\*]+|[\"\'\*]+$/g, ''); // limpa aspas vazias nas bordas
  return cleanText.trim();
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
      const fromPhone = directionAtoB ? warmer.phone_a : warmer.phone_b;
      const toPhone = directionAtoB ? warmer.phone_b : warmer.phone_a;
      
      let messageContent = '';

      try {
        const historyText = await fetchRecentLogs(warmer.id);
        messageContent = await generateDynamicMessage(historyText, fromPhone, toPhone);
        const countMsgs = historyText === 'Nenhum histórico anterior.' ? 0 : historyText.split('\n').length;
        console.log(`[Warmer] AI Generated: "${messageContent}" (based on ${countMsgs} logs)`);
      } catch (aiError) {
        console.warn(`[Warmer] Fallback activado (Erro Gemini):`, aiError.message);
        messageContent = getRandomMessage();
      }

      try {
        console.log(`[Warmer] Iniciando warming de ${fromInstance} para ${toPhone}`);
        // Log "Sending presence..."
        await sendPresence(evoUrl, evoKey, fromInstance, toPhone, 'composing');
        
        // Wait human delay (2 to 5 seconds base + 30ms per generated character)
        const delayBase = Math.floor(Math.random() * 3000) + 2000;
        const typingDelay = Math.min(8000, delayBase + (messageContent.length * 30));
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
