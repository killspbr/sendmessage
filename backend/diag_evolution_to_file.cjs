const fs = require('fs');
const { Client } = require('pg');
const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';

async function checkConfig() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const userRes = await client.query("SELECT id FROM users WHERE email = 'claudiosorriso7@gmail.com'");
    const userId = userRes.rows[0]?.id;
    
    const { rows: profiles } = await client.query('SELECT evolution_url, evolution_apikey, evolution_instance FROM user_profiles WHERE id = $1', [userId]);
    const { rows: globals } = await client.query('SELECT evolution_api_url, evolution_api_key, evolution_shared_instance FROM app_settings ORDER BY id DESC LIMIT 1');

    const result = JSON.stringify({ profile: profiles[0] || null, global: globals[0] || null }, null, 2);
    fs.writeFileSync('config_result.json', result);
  } catch (err) {
    fs.writeFileSync('config_result.json', String(err));
  } finally {
    await client.end();
  }
}
checkConfig();
