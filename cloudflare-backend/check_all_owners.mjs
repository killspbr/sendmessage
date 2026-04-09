import pg from 'pg';
const { Client } = pg;

const client = new Client({ 
  user: 'cf_hyperdrive',
  host: 'easypanel.soepinaobasta.com',
  database: 'sendmessage',
  password: 'CfHyper2026Safe',
  port: 5433,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT tablename, tableowner FROM pg_tables WHERE schemaname='public'");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run().catch(console.error);
