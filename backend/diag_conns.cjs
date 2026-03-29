const { Client } = require('pg');
const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';

async function checkConns() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query("SELECT count(*) FROM pg_stat_activity");
    console.log(`Open connections: ${res.rows[0].count}`);
    
    const res2 = await client.query("SELECT wait_event, wait_event_type, state FROM pg_stat_activity WHERE state != 'idle'");
    console.log('Active queries:', JSON.stringify(res2.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
checkConns();
