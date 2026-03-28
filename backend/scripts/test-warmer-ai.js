import { query } from '../src/db.js';
import { getActiveGeminiKey } from '../src/services/aiService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testGenerateDynamicMessage() {
  console.log('--- TESTE: INTEGRAÇÃO DO MATURADOR COM GEMINI ---');
  try {
    const keyObj = await getActiveGeminiKey();
    if (!keyObj || !keyObj.api_key) {
      console.error('ERRO: Nenhuma chave Gemini disponível ativa com limite de quota no banco.');
      process.exit(1);
    }
    console.log(`✓ Chave do Gemini Obtida. ID: ${keyObj.id}`);

    const myPhone = '551199999999';
    const toPhone = '551188888888';
    
    // Histórico Mocado com 4 mensagens
    const historyLines = [
      `[${toPhone}]: Eae mano, bão?`,
      `[${myPhone}]: Opa, tranquilo... tudo na mesma, mano!`,
      `[${toPhone}]: E o job lá rendeu?`,
      `[${toPhone}]: Aquela fita q te falei ontem`
    ].join('\n');

    console.log('\n--- HISTÓRICO FORNECIDO AO GEMINI ---');
    console.log(historyLines);
    console.log('-------------------------------------\n');

    const systemInstruction = `Aja e comunique-se como um brasileiro comum usando o WhatsApp.
Você é a pessoa do número de telefone [${myPhone}] conversando com [${toPhone}].
Regras obrigatórias:
1. Responda em até 140 caracteres no máximo. Seja MUITO curto (uma ou duas frases curtas).
2. É um chat orgânico: use gírias, contrações e abreviações comuns do brasil (vc, tbm, suave, po, mano, etc).
3. Ocasionalmente (uns 20% das vezes) erre alguma digitação ou falte pontuação, mantendo total informalidade.
4. Use no máximo um emoji por vez.
5. Baseie-se no 'Histórico da conversa' (fornecido no prompt) para continuar o contexto ou emendar um novo assunto caso as mensagens anteriores já tenham esgotado o assunto. Nunca reproduza as tags [Numero], apenas o texto.`;

    const prompt = `Histórico da conversa:\n${historyLines}\n\nEscreva sua próxima mensagem sendo [${myPhone}]:`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyObj.api_key}`;
    
    console.log('⏳ Disparando requisição ao Gemini...');
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 60, // Limite forçado em tokens caso a IA ignore as system instructions de tamanhos minúsculos
        }
      })
    });

    const msElapsed = Date.now() - startTime;

    if (!response.ok) {
      console.error('❌ Falha na requisição Gemini HTTP ' + response.status + ' :');
      console.error(await response.text());
      process.exit(1);
    }

    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error('❌ Resposta malformada ou bloqueio de filtro.');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log(`\n✓ Resposta Gerada (em ${msElapsed}ms):`);
    let cleanText = generatedText.replace(new RegExp(`^\\[?${myPhone}\\]?:\\s*`, 'i'), '');
    cleanText = cleanText.replace(/^[\"\'\*]+|[\"\'\*]+$/g, ''); 
    console.log(`>>  ${cleanText.trim()}`);
    console.log('\n✅ Validação Finalizada com Sucesso!');

    process.exit(0);

  } catch (error) {
    console.error('❌ ERRO CATASTRÓFICO DURANTE O TESTE: ', error.message);
    process.exit(1);
  }
}

testGenerateDynamicMessage();
