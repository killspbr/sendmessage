const { Client } = require('pg');
const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';

async function measure() {
  const client = new Client({ connectionString });
  try {
    const start = Date.now();
    await client.connect();
    const connTime = Date.now() - start;
    console.log(`Connect time: ${connTime}ms`);
    
    const startQ = Date.now();
    await client.query("SELECT 1");
    const queryTime = Date.now() - startQ;
    console.log(`Query time: ${queryTime}ms`);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
measure();
