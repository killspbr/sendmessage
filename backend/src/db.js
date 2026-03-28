import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const SYSTEM_TIMEZONE = process.env.SYSTEM_TIMEZONE || 'America/Sao_Paulo';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c timezone=${SYSTEM_TIMEZONE}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', (client) => {
  client.query(`SET TIME ZONE '${SYSTEM_TIMEZONE}'`).catch((err) => {
    console.error('[Postgres] Falha ao definir timezone da sessao', err);
  });
});

pool.on('error', (err) => {
  console.error('[Postgres] Erro inesperado no cliente ocioso', err);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
