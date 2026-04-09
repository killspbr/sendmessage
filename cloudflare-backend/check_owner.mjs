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
  const res = await client.query("SELECT tableowner FROM pg_tables WHERE tablename='campaigns'");
  console.log('Campaigns Owner:', res.rows[0]?.tableowner);
  
  const currentUser = await client.query("SELECT current_user");
  console.log('Current User:', currentUser.rows[0]?.current_user);

  const schemas = await client.query("SELECT schema_name FROM information_schema.schemata");
  console.log('Schemas:', schemas.rows.map(s => s.schema_name).join(', '));

  await client.end();
}

run().catch(console.error);
