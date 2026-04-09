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
  const userId = 'f06eed91-f41e-49b4-8586-222783c4e461';
  console.log('Running Count...');
  const countRes = await client.query(
      'SELECT COUNT(*)::int AS total FROM public.campaigns WHERE user_id = $1',
      [userId]
  );
  console.log('Total:', countRes.rows[0]);
  
  console.log('Running Select...');
  const res = await client.query(
    'SELECT id, name, status, list_name, channels, created_at, updated_at FROM public.campaigns WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [userId, 5, 0]
  );
  console.log('Results:', res.rows.length);
  await client.end();
}

test();
