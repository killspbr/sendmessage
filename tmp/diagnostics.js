const { Client } = require('pg');
const fetch = require('node-fetch');

const connectionString = 'postgresql://postgres:claud123@clrodrigues-sendmessage-db.rsybpi.easypanel.host:5432/postgres';

async function diagnose() {
  console.log('--- DIAGNÓSTICO DO MATURADOR ---');
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    // 1. Settings DB
    const settings = await client.query('SELECT evolution_api_url, evolution_api_key FROM app_settings ORDER BY id DESC LIMIT 1');
    const dbConf = settings.rows[0] || {};
    console.log(`\n1. Banco de Dados:`);
    console.log(`   URL: ${dbConf.evolution_api_url}`);
    console.log(`   Key: ${dbConf.evolution_api_key?.substring(0,8)}...`);

    // 2. Evolution Connection
    const url = 'https://automacao-evolution-api.rsybpi.easypanel.host/instance/fetchInstances';
    const apiKey = 'D4C6A8129EF5432CA71B0D583F2E9C15';
    
    console.log(`\n2. Testando Evolution API (Fetch Instances):`);
    const response = await fetch(url, {
      method: 'GET',
      headers: { apikey: apiKey }
    });
    
    if (response.ok) {
       const instances = await response.json();
       console.log(`   ✅ Conexão OK (Status ${response.status})`);
       console.log(`   Instâncias encontradas: ${instances.length}`);
       instances.forEach(inst => {
          console.log(`   - Instance: ${inst.name} | Status: ${inst.connectionStatus} | Phone: ${inst.ownerJid}`);
       });
    } else {
       console.log(`   ❌ Erro de Conexão na Evolution (Status ${response.status})`);
       console.log(`   Response: ${await response.text()}`);
    }

  } catch (err) {
    console.error(`\n❌ ERRO FATAL: ${err.message}`);
  } finally {
    await client.end();
  }
}

diagnose();
