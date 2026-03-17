import { query } from './src/db.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import fs from 'fs';

async function testApi() {
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-mudar-em-producao';
  
  const userRes = await query('SELECT id, email FROM users LIMIT 1');
  const user = userRes.rows[0];
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  
  console.log('Got token for user:', user.email);

  const res = await fetch('http://localhost:4000/api/admin/gemini-keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      nome: 'Teste de API',
      api_key: 'test_key',
      status: 'ativa',
      observacoes: 'Teste via Node'
    })
  });

  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text}`);
}

testApi();
