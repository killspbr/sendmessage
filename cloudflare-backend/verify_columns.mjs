import pg from 'pg';
const { Client } = pg;

const config = {
  user: 'cf_hyperdrive',
  host: 'easypanel.soepinaobasta.com',
  database: 'sendmessage',
  password: 'CfHyper2026Safe',
  port: 5433,
  ssl: { rejectUnauthorized: false }
};

async function test() {
  const client = new Client(config);
  await client.connect();
  const res = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name IN ('campaigns', 'user_profiles')
      AND column_name = 'updated_at'
  `);
  console.log('Results:', res.rows);
  await client.end();
}

test();
