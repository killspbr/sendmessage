import pg from 'pg';
const { Client } = pg;

const sql = `
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.contact_lists ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
`;

async function run() {
    const client = new Client({
        host: 'easypanel.soepinaobasta.com',
        port: 5433,
        user: 'clrodriguesuser',
        password: '>:0fm3jcT77ZZjYMqqwb',
        database: 'sendmessage',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Conectado para adicionar colunas...');
        await client.query(sql);
        console.log('Colunas updated_at garantidas!');
    } catch (err) {
        console.error('Erro ao adicionar colunas:', err.message);
    } finally {
        await client.end();
    }
}

run();
