import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Configuração do pool de conexões com PostgreSQL
// No Easypanel, você usará a variável DATABASE_URL fornecida por eles
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('[Postgres] Erro inesperado no cliente ocioso', err);
});

export const query = (text, params) => pool.query(text, params);

// Helper para transações simples
export const getClient = () => pool.connect();
