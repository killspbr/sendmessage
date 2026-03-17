import { query } from './src/db.js';

async function testInsert() {
  try {
    const userRes = await query('SELECT id FROM users LIMIT 1');
    const userId = userRes.rows[0].id;
    console.log('Inserting for user_id:', userId);
    
    const insertRes = await query(
      'INSERT INTO gemini_api_keys (user_id, nome, api_key, status, observacoes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, 'Teste', '12345', 'ativa', 'obs']
    );
    
    console.log('Insert succesful:', insertRes.rows[0]);
  } catch (err) {
    console.error('Insert failed:', err);
  }
}

testInsert();
