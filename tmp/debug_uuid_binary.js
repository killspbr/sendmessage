
import { query } from '../backend/src/db.js';

async function analyzeValue(label, value) {
    if (value === undefined || value === null) {
        console.log(`[${label}] Valor Nulo ou Indefinido`);
        return;
    }

    const str = String(value);
    console.log(`\n--- ANÁLISE DE ${label} ---`);
    console.log(`Valor Bruto: "${str}"`);
    console.log(`Comprimento Real: ${str.length}`);
    console.log(`UUID Esperado (36 chars) | Diferença: ${str.length - 36}`);
    
    console.log('--- Detalhe de Caracteres (Últimos 10) ---');
    for (let i = Math.max(0, str.length - 10); i < str.length; i++) {
        console.log(`Posição ${i}: Char='${str[i]}' | Code=${str.charCodeAt(i)}`);
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    console.log(`Válido via Regex UUID? ${uuidRegex.test(str) ? 'SIM' : 'NÃO'}`);
}

async function debugRootCause() {
    console.log('================================================');
    console.log('   DIAGNÓSTICO TÉCNICO DE CORRUPÇÃO DE UUID     ');
    console.log('================================================');

    // 1. Pegar User ID Real do banco
    const userResult = await query('SELECT id, email FROM users LIMIT 1');
    const dbUserId = userResult.rows[0].id;
    await analyzeValue('USER_ID DO BANCO', dbUserId);

    // 2. Pegar List ID Real que falhou no log recentemente
    const logResult = await query('SELECT info FROM sys_logs WHERE info LIKE \'%invalid input syntax%\' ORDER BY created_at DESC LIMIT 1');
    if (logResult.rows.length > 0) {
        const info = logResult.rows[0].info;
        // Tentar extrair o UUID do log (ex: "e3b52f78-...")
        const match = info.match(/"([^"]+)"/);
        if (match) {
            await analyzeValue('UUID FALHO NO LOG', match[1]);
        } else {
            console.log('Não foi possível extrair UUID do log: ' + info);
        }
    }

    // 3. Verificar o middleware de auth para ver se há concatenação no encode/decode
    console.log('\n--- VERIFICANDO INTEGRIDADE DO JWT NO AMBIENTE ---');
    // Como não tenho o req.user aqui, verificamos a tabela de contatos para ver se já existem IDs corrompidos gravados
    const corruptCheck = await query('SELECT user_id, list_id FROM contacts WHERE length(user_id::text) != 36 OR length(list_id::text) != 36 LIMIT 1');
    if (corruptCheck.rows.length > 0) {
        console.log('FOI DETECTADO VALOR CORROMPIDO JÁ GRAVADO NO BANCO!');
        await analyzeValue('USER_ID GRAVADO', corruptCheck.rows[0].user_id);
    } else {
        console.log('Todos os IDs persistidos na tabela "contacts" estão com 36 caracteres.');
    }

    process.exit(0);
}

debugRootCause();
