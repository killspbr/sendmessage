import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:claud123@clrodrigues-sendmessage-db.rsybpi.easypanel.host:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query('SELECT evolution_api_url, evolution_api_key FROM app_settings ORDER BY id DESC LIMIT 1');
    const db = res.rows[0];

    const targetUrl = 'https://automacao-evolution-api.rsybpi.easypanel.host';
    const targetKey = 'D4C6A8129EF5432CA71B0D583F2E9C15';

    console.log(`DB URL: ${db.evolution_api_url}`);
    
    if (db.evolution_api_url !== targetUrl || db.evolution_api_key !== targetKey) {
        console.log('--- ATUALIZANDO ---');
        await client.query('UPDATE app_settings SET evolution_api_url=$1, evolution_api_key=$2 WHERE id=(SELECT id FROM app_settings ORDER BY id DESC LIMIT 1)', [targetUrl, targetKey]);
        console.log('Settings atualizadas.');
    } else {
        console.log('Settings já conferem.');
    }
  } finally {
    await client.end();
  }
}

run();
