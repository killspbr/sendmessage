const { Client } = require('pg');
const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';

async function checkConfig() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const userRes = await client.query("SELECT id FROM users WHERE email = 'claudiosorriso7@gmail.com'");
    const userId = userRes.rows[0]?.id;
    console.log(`User ID: ${userId}`);

    const [profileResult, globalSettingsResult] = await Promise.all([
      client.query(
        'SELECT evolution_url, evolution_apikey, evolution_instance FROM user_profiles WHERE id = $1 LIMIT 1',
        [userId]
      ),
      client.query(
        'SELECT evolution_api_url, evolution_api_key, evolution_shared_instance FROM app_settings ORDER BY id DESC LIMIT 1'
      ),
    ]);

    console.log('Profile Config:', JSON.stringify(profileResult.rows[0], null, 2));
    console.log('Global Settings:', JSON.stringify(globalSettingsResult.rows[0], null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
checkConfig();
