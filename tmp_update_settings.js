const { Client } = require('pg');

const connectionString = 'postgresql://postgres:claud123@clrodrigues-sendmessage-db.rsybpi.easypanel.host:5432/postgres';

async function checkAndApply() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    const settings = await client.query('SELECT evolution_api_url, evolution_api_key FROM app_settings ORDER BY id DESC LIMIT 1');
    const dbConf = settings.rows[0];

    const targetUrl = 'https://automacao-evolution-api.rsybpi.easypanel.host';
    const targetKey = 'D4C6A8129EF5432CA71B0D583F2E9C15';

    console.log(`Bancodedados: ${dbConf.evolution_api_url} | ${dbConf.evolution_api_key}`);

    if (dbConf.evolution_api_url !== targetUrl || dbConf.evolution_api_key !== targetKey) {
       console.log('Atualizando app_settings com as novas credenciais da Evolution...');
       await client.query('UPDATE app_settings SET evolution_api_url = $1, evolution_api_key = $2 WHERE id = (SELECT id FROM app_settings ORDER BY id DESC LIMIT 1)', [targetUrl, targetKey]);
       console.log('Configurações atualizadas com sucesso!');
    } else {
       console.log('As configurações já estão atualizadas!');
    }

  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await client.end();
  }
}

checkAndApply();
