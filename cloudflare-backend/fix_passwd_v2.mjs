import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgres://cf_hyperdrive:CfHyper2026Safe@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=require';

async function run() {
  const client = new Client({ 
    user: 'cf_hyperdrive',
    host: 'easypanel.soepinaobasta.com',
    database: 'sendmessage',
    password: 'CfHyper2026Safe',
    port: 5433,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    const email = 'claudiosorriso7@gmail.com';
    const correctHash = 'sha256:3a8777fd57255fa2a196706115cea9a1:7c0c01763321d8d3fc16969420526bc0d299d3413ab0317a3122a6dc2abdfc17';

    const res = await client.query(
      'UPDATE public.users SET password_hash = $1, token_version = token_version + 1 WHERE email = $2 RETURNING id',
      [correctHash, email]
    );

    console.log('Update result:', res.rows[0]);
  } catch (err) {
    console.error('Update error:', err);
  } finally {
    await client.end();
  }
}

run();
