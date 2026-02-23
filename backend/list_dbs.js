import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;

async function listDatabases() {
    // Usando a URL completa do seu .env
    const connectionString = process.env.DATABASE_URL;

    console.log('--- Tentando conectar ao Postgres... ---');
    console.log('URL sendo usada:', connectionString.replace(/:[^:@]+@/, ':****@')); // Mascarando a senha

    const client = new Client({
        connectionString: connectionString,
        // Forçando o timeout para não ficar esperando muito tempo
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log('✅ Conectado com sucesso!');

        const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');

        console.log('\nLista de Bancos de Dados encontrados:');
        res.rows.forEach(row => {
            console.log(`- ${row.datname}`);
        });

    } catch (err) {
        console.error('❌ Erro completo:', err);
    } finally {
        await client.end();
    }
}

listDatabases();
