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
  const q = async (sql) => {
    const res = await client.query(sql);
    return res.rows;
  };
  
  console.log('--- TABLES ---');
  const tables = await q("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log(tables.map(t => t.table_name).join(', '));
  
  console.log('\n--- CAMPAIGNS COLUMNS ---');
  const campaigns = await q("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='campaigns'");
  campaigns.forEach(c => console.log(` - ${c.column_name}: ${c.data_type}`));
  
  await client.end();
}

run().catch(console.error);
