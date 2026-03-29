const { Client } = require('pg');
const sql = "SELECT id, name, delivery_payload FROM campaigns WHERE user_id = 'f06eed91-f41e-49b4-8586-222783c4e461' ORDER BY created_at DESC LIMIT 5";
const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';

async function run() {
  const c = new Client({ connectionString });
  await c.connect();
  const r = await c.query(sql);
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
}
run();
