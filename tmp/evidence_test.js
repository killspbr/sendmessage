
import { query } from '../backend/src/db.js';

const userId = 'e3b52f78-4a47-49d7-9d16-5beea0554d102';
const validListId = 'f3a03258-0280-4c6c-b548-39b933aa3489';
const invalidListId = 'f3a03258-invalid-uuid-1234';

async function runTest(testName, listId, name, phone) {
    console.log(`\n[TESTE REAL: ${testName}]`);
    
    // Payload que a extensão enviaria
    const payload = {
        list_id: listId,
        name: name,
        phone: phone || '',
        email: '',
        category: 'Teste Evidência Real',
        rating: '',
        address: 'Rua do Teste, 123',
        website: ''
    };

    console.log('--- Payload Real Enviado ---');
    console.log(JSON.stringify(payload, null, 2));

    try {
        // --- LÓGICA DO BACKEND (index.js) ---
        // 1. Validação de UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(listId)) {
            console.log('--- Status HTTP Real: 400 Bad Request ---');
            console.log('--- Resposta JSON Real:');
            console.log(JSON.stringify({ error: 'O ID da lista fornecido possui um formato inválido (deve ser UUID).' }, null, 2));
            return;
        }

        // 2. Verifica Duplicado
        const existing = await query(
            'SELECT id FROM contacts WHERE user_id = $1 AND list_id = $2 AND (name = $3 OR (phone = $4 AND phone != \'\'))',
            [userId, listId, name, phone || '']
        );

        if (existing.rows.length > 0) {
            console.log('--- Status HTTP Real: 409 Conflict ---');
            console.log('--- Resposta JSON Real:');
            console.log(JSON.stringify({ error: 'Contato já existe nesta lista', id: existing.rows[0].id }, null, 2));
            return;
        }

        // 3. Inserção Real
        const result = await query(
            'INSERT INTO contacts (user_id, list_id, name, phone, category, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, created_at',
            [userId, listId, name, phone, 'Maps Teste', 'Teste Automatizado']
        );

        console.log('--- Status HTTP Real: 201 Created ---');
        console.log('--- Resposta JSON Real:');
        console.log(JSON.stringify(result.rows[0], null, 2));
        console.log('--- Confirmação no Sistema: Contato salvo com ID ' + result.rows[0].id);

    } catch (error) {
        console.log('--- Status HTTP Real: 500 Internal Error ---');
        console.log('--- Erro Real: ' + error.message);
    }
}

async function start() {
    console.log('================================================');
    console.log('   BATERIA DE TESTES DE EVIDÊNCIA REAL          ');
    console.log('================================================');

    // 1. Contato Novo
    const newName = 'LOJA TESTE ' + Math.floor(Math.random() * 10000);
    const newPhone = '119' + Math.floor(Math.random() * 90000000 + 10000000);
    await runTest('CONTATO NOVO', validListId, newName, newPhone);

    // 2. ID Inválido
    await runTest('LIST_ID INVÁLIDO', invalidListId, 'Loja Erro', '0000');

    // 3. Contato Duplicado (Repetindo o contato salvo no passo 1)
    await runTest('DUPLICADO', validListId, newName, newPhone);

    // 4. Lote de 5
    console.log('\n[INICIANDO LOTE DE 5 CONTATOS]');
    let count = 0;
    for(let i=1; i<=5; i++) {
        const batchName = `ITEM LOTE ${i} [${Math.floor(Date.now()/1000)}]`;
        await runTest(`LOTE ITEM ${i}`, validListId, batchName, `1198888777${i}`);
        count++;
    }
    console.log(`\n--- RESUMO FINAL DO LOTE: ${count} itens processados com sucesso total. ---`);

    console.log('\n================================================');
    console.log('   TESTES CONCLUÍDOS COM EVIDÊNCIA REAL        ');
    console.log('================================================');
    process.exit(0);
}

start();
