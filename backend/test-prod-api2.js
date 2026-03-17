import { query } from './src/db.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

async function testProdApi2() {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-mudar-em-producao';
    
    const userRes = await query('SELECT u.id, u.email FROM users u JOIN user_profiles p ON u.id = p.id JOIN user_groups g ON p.group_id = g.id WHERE g.name = \'Administrador\' LIMIT 1');
    const user = userRes.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    const res = await fetch('https://clrodrigues-sendmessage-backend.rsybpi.easypanel.host/api/admin/gemini-keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nome: 'Teste de Produção API Sem Status',
        api_key: 'test_prod_key_2',
        observacoes: 'Inserção local via Node'
      })
    });

    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
  } catch (err) {
    console.error('Error in Script:', err);
  }
}

testProdApi2();
