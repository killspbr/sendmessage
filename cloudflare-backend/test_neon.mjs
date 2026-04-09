import pg from 'pg';
const { Client } = pg;

async function testConnection() {
    const client = new Client({
        user: 'clrodriguesuser',
        host: 'ep-green-wind-a5ovkqqo.us-east-2.aws.neon.tech',
        database: 'sendmessage',
        password: 'Smile123!',
        port: 5432,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('CONECTADO AO NEON COM SUCESSO!');
        const res = await client.query('SELECT version()');
        console.log('Versao:', res.rows[0].version);
    } catch (err) {
        console.error('Falha na conexao com Neon:', err.message);
    } finally {
        await client.end();
    }
}

testConnection();
