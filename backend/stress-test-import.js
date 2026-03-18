import { query } from './src/db.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

async function stressTest() {
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-mudar-em-producao';
  const userRes = await query('SELECT u.id, u.email FROM users u LIMIT 1');
  const user = userRes.rows[0];
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const listRes = await query(`SELECT id FROM lists WHERE user_id = $1 LIMIT 1`, [user.id]);
  const listId = listRes.rows[0].id;

  const promises = Array.from({ length: 10 }).map((_, i) => {
    return fetch('https://clrodrigues-sendmessage-backend.rsybpi.easypanel.host/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        list_id: listId,
        name: `Empresa Tensa ${i}_${Math.random().toString(36).substr(2, 5)}`,
        phone: '11999999999',
        category: 'Teste Estresse'
      })
    }).then(r => r.status);
  });

  const results = await Promise.all(promises);
  console.log('Results:', results);
}

stressTest();
