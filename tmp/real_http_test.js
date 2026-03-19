
import { query } from '../backend/src/db.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BACKEND_URL = 'http://localhost:3000'; // Assumindo porta 3000 local para teste

async function runRealHttpTest() {
    console.log('--- INICIANDO TESTE HTTP REAL DA ROTA /api/contacts ---');

    // 1. Gerar Token Real para o teste
    const userResult = await query('SELECT id, email FROM users LIMIT 1');
    const user = userResult.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

    const listResult = await query('SELECT id FROM lists WHERE user_id = $1 LIMIT 1', [user.id]);
    const listId = listResult.rows[0].id;

    const authHeaders = { 'Authorization': `Bearer ${token}` };

    console.log(`\n--- TESTE 1: Contato Válido ---`);
    const validPayload = {
        list_id: listId,
        name: "TESTE HTTP REAL " + Date.now(),
        phone: "11999999999"
    };
    
    try {
        const resp = await axios.post(`${BACKEND_URL}/api/contacts`, validPayload, { headers: authHeaders });
        console.log('Status HTTP:', resp.status);
        console.log('Body Real:', JSON.stringify(resp.data, null, 2));
    } catch (e) {
        console.error('Falha Teste 1:', e.response?.data || e.message);
    }

    console.log(`\n--- TESTE 2: Forçando Erro (list_id inválido) ---`);
    const invalidPayload = {
        list_id: 'invalid-id-for-testing',
        name: "NEGOCIO FALHO",
    };
    
    try {
        const resp = await axios.post(`${BACKEND_URL}/api/contacts`, invalidPayload, { headers: authHeaders });
    } catch (e) {
        console.log('Status HTTP:', e.response?.status);
        console.log('JSON de Erro Real (Sem HTML):', JSON.stringify(e.response?.data, null, 2));
    }

    console.log(`\n--- TESTE 3: Forçando Duplicidade (409) ---`);
    try {
        const resp = await axios.post(`${BACKEND_URL}/api/contacts`, validPayload, { headers: authHeaders });
    } catch (e) {
        console.log('Status HTTP:', e.response?.status);
        console.log('JSON de Erro Real (Sem HTML):', JSON.stringify(e.response?.data, null, 2));
    }

    process.exit(0);
}

runRealHttpTest();
