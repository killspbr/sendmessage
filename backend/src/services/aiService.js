import { query } from '../db.js';

/**
 * Serviço para gerenciar múltiplas chaves do Gemini com rotação automática e limites.
 */
export async function getActiveGeminiKey() {
  // Busca todas as chaves ativas que ainda não atingiram o limite de 20 usos
  const result = await query(
    'SELECT * FROM gemini_api_keys WHERE status = $1 AND requests_count < 20 ORDER BY requests_count ASC, ultimo_uso ASC LIMIT 1',
    ['ativa']
  );

  if (result.rows.length === 0) {
    // Se não houver chaves com menos de 20 usos, tenta rotacionar ou alerta
    console.warn('[GeminiService] Nenhuma chave disponível com cota restante.');
    return null;
  }

  return result.rows[0];
}

export async function logGeminiUsage({
  keyId = null,
  userId = null,
  module = null,
  resultText = '',
  error = null,
  source = 'global-pool',
  keyLabel = null,
}) {
  await query(
    'INSERT INTO gemini_api_usage_logs (key_id, user_id, module, resultado, erro, source, key_label) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [
      keyId,
      userId,
      module,
      String(resultText || '').substring(0, 100),
      error ? String(error) : null,
      source,
      keyLabel,
    ]
  );
}

export async function incrementKeyUsage(keyId, module, resultText, error, userId = null, source = 'global-pool', keyLabel = null) {
  try {
    // Incrementa contador
    await query(
      'UPDATE gemini_api_keys SET requests_count = requests_count + 1, ultimo_uso = NOW() WHERE id = $1',
      [keyId]
    );

    // Se atingiu o limite, marca como limite_atingido
    const keyCheck = await query('SELECT requests_count FROM gemini_api_keys WHERE id = $1', [keyId]);
    if (keyCheck.rows[0] && keyCheck.rows[0].requests_count >= 20) {
      await query('UPDATE gemini_api_keys SET status = $1 WHERE id = $2', ['limite_atingido', keyId]);
    }

    await logGeminiUsage({ keyId, userId, module, resultText, error, source, keyLabel });
  } catch (e) {
    console.error('[GeminiService] Erro ao incrementar uso da chave:', e);
  }
}
