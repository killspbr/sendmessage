import { query } from './src/db.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

async function testContactImport() {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-mudar-em-producao';
    
    const userRes = await query('SELECT u.id, u.email FROM users u LIMIT 1');
    const user = userRes.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // We need a valid list_id
    const listRes = await query(`SELECT id FROM lists WHERE user_id = $1 LIMIT 1`, [user.id]);
    if (listRes.rows.length === 0) {
       console.log('No lists for user');
       return;
    }
    const listId = listRes.rows[0].id;

    console.log(`Using token for ${user.email}, list_id: ${listId}`);

    const res = await fetch('https://clrodrigues-sendmessage-backend.rsybpi.easypanel.host/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
         list_id: listId,
         name: "AutoCarABC Baterias",
         phone: "11947305961",
         email: "",
         category: "Loja de baterias de carro",
         cep: "",
         rating: "4,9",
         address: "581 Rua Frei Gaspar",
         website: ""
      })
    });

    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
  } catch (err) {
    console.error('Error in Script:', err);
  }
}

testContactImport();
