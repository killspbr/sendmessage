import pg from 'pg';
const { Client } = pg;

const sql = `
GRANT USAGE ON SCHEMA public TO cf_hyperdrive;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cf_hyperdrive;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cf_hyperdrive;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO cf_hyperdrive;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO cf_hyperdrive;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO cf_hyperdrive;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO cf_hyperdrive;
GRANT CREATE ON SCHEMA public TO cf_hyperdrive;
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
        console.log('Conectado ao Postgres...');
        await client.query(sql);
        console.log('Permissoes concedidas com sucesso!');
    } catch (err) {
        console.error('Erro ao conceder permissoes:', err.message);
    } finally {
        await client.end();
    }
}

run();
