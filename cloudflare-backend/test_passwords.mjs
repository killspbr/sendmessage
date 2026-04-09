import pg from 'pg';
const { Client } = pg;

const variations = [
  'SendMessage2026Safe',
  'SendMessageSafe2026',
  'SendMessage2026!',
  'SendMessage2026',
  'SendMessage!2026',
  'Smile123!'
];

async function run() {
  for (const p of variations) {
    const client = new Client({ 
      user: 'clrodriguesuser',
      host: 'easypanel.soepinaobasta.com',
      database: 'sendmessage',
      password: p,
      port: 5433,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log(`PASS FOUND: ${p}`);
      await client.end();
      return;
    } catch (e) {
      console.log(`Fail: ${p} - ${e.message}`);
    }
  }
}

run();
