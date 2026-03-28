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
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (fetchErr) {
    throw new Error(`Falha de conexão com a Evolution API: ${fetchErr.message}`);
  }

  if (!response) {
    throw new Error('Nenhuma resposta retornada da Evolution API.');
  }

  if (!response.ok) {
    let errorText = await response.text();
    try {
       const json = JSON.parse(errorText);
       if (json.response && json.response.message) {
         errorText = Array.isArray(json.response.message) ? json.response.message[0] : typeof json.response.message === 'string' ? json.response.message : JSON.stringify(json.response.message);
       } else if (json.error) {
         errorText = json.error;
       }
    } catch(e) {}
    throw new Error(errorText || `Erro HTTP ${response.status} da Evolution API`)
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

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (fetchErr) {
    throw new Error(`Falha de conexão com o Gemini API: ${fetchErr.message}`);
  }

  if (!response) {
    throw new Error('Nenhuma resposta retornada do Gemini API.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro Gemini [${response.status}]: ${errorText.substring(0, 100)}`);
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

    // Buscar configs ativas (sem limitar por horario, pois trataremos no JS para AFK/Sleep)
    const result = await query(`
      SELECT 
        id, instance_a_id, instance_b_id, phone_a, phone_b, 
        base_daily_limit, increment_per_day, start_date,
        business_hours_start, business_hours_end, current_mode, mode_until
      FROM warmer_configs 
      WHERE status = 'active'
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

      // --- CAMADA DE SEGURANÇA COMPORTAMENTAL (SONO / AFK) ---
      const now = new Date();
      if (warmer.mode_until && new Date(warmer.mode_until) > now) {
        // Ainda está no modo afk ou sleeping, ignora a iteracao
        continue;
      }

      // Se venceu o modo (acabou de acordar ou voltar do café) e estava em sleep/afk, voltou para active
      if (warmer.current_mode !== 'active' && warmer.mode_until && new Date(warmer.mode_until) <= now) {
         await query(`UPDATE warmer_configs SET current_mode = 'active', mode_until = NULL WHERE id = $1`, [warmer.id]);
         console.log(`[Warmer] Maturação ${warmer.id} retornou ao estado ACTIVE.`);
      }

      const parseTime = (timeStr) => {
        const d = new Date();
        const [h,m,s] = timeStr.split(':');
        d.setHours(parseInt(h||0), parseInt(m||0), parseInt(s||0), 0);
        return d;
      };

      const startBusiness = parseTime(warmer.business_hours_start || '08:00:00');
      const endBusiness = parseTime(warmer.business_hours_end || '20:00:00');

      let isOutsideBusinessHours = false;
      let wakeUpDate = new Date(startBusiness);

      if (now < startBusiness) {
         isOutsideBusinessHours = true;
      } else if (now > endBusiness) {
         isOutsideBusinessHours = true;
         wakeUpDate.setDate(wakeUpDate.getDate() + 1); // amanhã
      } else if (now <= endBusiness && now >= new Date(endBusiness.getTime() - 30 * 60 * 1000)) {
         // Antes de encerrar o expediente (janela de 30 min), tem 4% chance por minuto de dormir "mais cedo"
         if (Math.random() < 0.04) {
             isOutsideBusinessHours = true;
             wakeUpDate.setDate(wakeUpDate.getDate() + 1); // acorda só amanhã
         }
      }

      if (isOutsideBusinessHours) {
         // Variação de +- 30 mins no relógio de acordar
         const offsetMs = (Math.floor(Math.random() * 61) - 30) * 60 * 1000;
         wakeUpDate = new Date(wakeUpDate.getTime() + offsetMs);

         if (wakeUpDate > now) {
            await query(`UPDATE warmer_configs SET current_mode = 'sleeping', mode_until = $1 WHERE id = $2`, [wakeUpDate, warmer.id]);
            console.log(`[Warmer] Chip ${warmer.instance_a_id} ↔️ ${warmer.instance_b_id} entrou em MODO SONO até ${wakeUpDate.toLocaleString()}`);
            continue;
         }
      }

      // Soneca Diurna (AFK) 
      // Em média, num ciclo de 60 mins a chance por tick é menor p/ simular ~1 a 2 pausas de 15~45min no dia
      // Como tem jitter base embaixo de 30% pra rodar a iteração, 2% de AFK é um bom equilíbrio
      if (Math.random() < 0.02) {
         const afkMinutes = Math.floor(Math.random() * 31) + 15;
         const afkUntil = new Date(now.getTime() + afkMinutes * 60 * 1000);
         await query(`UPDATE warmer_configs SET current_mode = 'afk', mode_until = $1 WHERE id = $2`, [afkUntil, warmer.id]);
         console.log(`[Warmer] Chip ${warmer.instance_a_id} ↔️ ${warmer.instance_b_id} entrou em PAUSA AFK até ${afkUntil.toLocaleString()}`);
         continue;
      }

      // Jitter (delay aleatório p/ não enviar cravado cronometricamente)
      // 30% de chance de rodar neste pulso pra dar mais aleatoriedade
      if (Math.random() > 0.3) {
        continue;
      }

      // Definir direção (A -> B ou B -> A)
      await executeWarmerInteraction(warmer, evoUrl, evoKey, sentToday, limiteHoje);
    }
  } catch (error) {
    console.error('[Warmer] Falha crítica na rotina do Worker:', error);
  }
}

export async function executeWarmerInteraction(warmer, evoUrl, evoKey, sentToday = 0, limiteHoje = 0, isForced = false) {
  const directionAtoB = Math.random() > 0.5;
  const fromInstance = directionAtoB ? warmer.instance_a_id : warmer.instance_b_id;
  const fromPhone = directionAtoB ? warmer.phone_a : warmer.phone_b;
  const toPhone = directionAtoB ? warmer.phone_b : warmer.phone_a;
  
  let messageContent = '';

  try {
    const historyText = await fetchRecentLogs(warmer.id);
    messageContent = await generateDynamicMessage(historyText, fromPhone, toPhone);
    const countMsgs = historyText === 'Nenhum histórico anterior.' ? 0 : historyText.split('\n').length;
    console.log(`[Warmer${isForced ? ' FOREGROUND' : ''}] AI Generated: "${messageContent}" (based on ${countMsgs} logs)`);
  } catch (aiError) {
    console.warn(`[Warmer${isForced ? ' FOREGROUND' : ''}] Fallback activado (Erro Gemini):`, aiError.message);
    messageContent = getRandomMessage();
  }

  try {
    console.log(`[Warmer${isForced ? ' FOREGROUND' : ''}] Iniciando warming de ${fromInstance} para ${toPhone}`);
    await sendPresence(evoUrl, evoKey, fromInstance, toPhone, 'composing');
    
    // Wait human delay
    const delayBase = Math.floor(Math.random() * 3000) + 2000;
    const typingDelay = Math.min(8000, delayBase + (messageContent.length * 30));
    // Se for um trigger forçado do front, diminuir o delay de digitação p/ dar a sensação tátil mais rápida p/ admin
    await wait(isForced ? Math.min(1500, typingDelay) : typingDelay);

    // Send Text
    await sendText(evoUrl, evoKey, fromInstance, toPhone, messageContent);

    // Record Log
    if (!warmer.id) {
       console.warn('[Warmer Interaction] Não foi possível salvar log: warmer.id ausente.');
    } else {
       await query(`
         INSERT INTO warmer_logs (warmer_id, from_phone, to_phone, message_type, content_summary)
         VALUES ($1, $2, $3, $4, $5)
       `, [warmer.id, fromInstance, toPhone, 'text', messageContent]);
    }

    console.log(`[Warmer${isForced ? ' FOREGROUND' : ''}] Sucesso ${isForced ? '(Disparo Manual)' : `(${sentToday + 1}/${limiteHoje} hoje)`}`);
    return { success: true, message: messageContent, from: fromInstance, to: toPhone };
  } catch (err) {
    console.error(`[Warmer${isForced ? ' FOREGROUND' : ''}] Erro ao enviar maturação para Warmer ID ${warmer.id}:`, err.message);
    throw err;
  }
}

export async function forceRunWarmer(warmerId) {
  const { url: evoUrl, apiKey: evoKey } = await getGlobalEvolutionConfig();
  if (!evoUrl || !evoKey) {
    throw new Error('Evolution API não configurada globalmente.');
  }

  const result = await query(`
    SELECT id, instance_a_id, instance_b_id, phone_a, phone_b 
    FROM warmer_configs 
    WHERE id = $1
  `, [warmerId]);

  if (result.rows.length === 0) {
    throw new Error('Maturação não encontrada');
  }

  const warmer = result.rows[0];
  return await executeWarmerInteraction(warmer, evoUrl, evoKey, 0, 0, true);
}
