import pg from 'pg';
const { Client } = pg;

// CONFIGURACOES DE CONEXAO
const OLD_DB_CONFIG = {
    host: 'easypanel.soepinaobasta.com',
    port: 5433,
    user: 'clrodriguesuser',
    password: '>:0fm3jcT77ZZjYMqqwb',
    database: 'sendmessage',
    ssl: { rejectUnauthorized: false }
};

// A SER PREENCHIDO COM A CREDENCIAL QUE VOCE FORNECER
const NEW_DB_CONFIG = {
    connectionString: 'PROVISIONAL_URL_REPLACE_ME',
    ssl: { rejectUnauthorized: false }
};

const TABLES_TO_MIGRATE = [
    'users', 'user_groups', 'permissions', 'group_permissions',
    'app_settings', 'user_profiles', 'lists', 'contacts',
    'campaigns', 'campaign_history', 'contact_send_history',
    'warmer_configs', 'warmer_runs', 'warmer_logs',
    'active_user_sessions', 'gemini_api_keys', 'whatsapp_reputation'
];

async function migrate() {
    if (NEW_DB_CONFIG.connectionString === 'PROVISIONAL_URL_REPLACE_ME') {
        console.error('ERRO: Connection String do Neon nao configurada no script.');
        return;
    }

    const oldClient = new Client(OLD_DB_CONFIG);
    const newClient = new Client(NEW_DB_CONFIG);

    try {
        await oldClient.connect();
        await newClient.connect();
        console.log('--- INICIANDO MIGRACAO DE DADOS ---');

        for (const table of TABLES_TO_MIGRATE) {
            console.log(`\nMigrando tabela: ${table}...`);
            
            // Buscar dados
            const res = await oldClient.query(`SELECT * FROM public.${table}`);
            const rows = res.rows;
            
            if (rows.length === 0) {
                console.log(`  - Tabela vazia. Pulando.`);
                continue;
            }

            // Preparar insert em lote
            const columns = Object.keys(rows[0]);
            const columnList = columns.join(', ');
            
            // Chunks de 500 para evitar limites do driver
            const chunkSize = 500;
            for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize);
                
                for (const row of chunk) {
                    const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
                    const values = columns.map(col => row[col]);
                    
                    await newClient.query(
                        `INSERT INTO public.${table} (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                        values
                    );
                }
                console.log(`  - Processados ${Math.min(i + chunkSize, rows.length)} de ${rows.length} registros...`);
            }
            console.log(`  - Sucesso: ${table} migrada.`);
        }

        console.log('\n--- MIGRACAO CONCLUIDA COM SUCESSO! ---');

    } catch (err) {
        console.error('ERRO DURANTE MIGRACAO:', err.stack);
    } finally {
        await oldClient.end();
        await newClient.end();
    }
}

migrate();
