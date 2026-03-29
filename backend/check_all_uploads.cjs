const { Client } = require('pg');
const sql = "SELECT id, storage_path, created_at FROM user_uploaded_files ORDER BY created_at DESC LIMIT 15";
const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';

async function run() {
  const c = new Client({ connectionString });
  await c.connect();
  const r = await c.query(sql);
  console.log(JSON.stringify(r.rows.map(row => ({ ...row, created_at: row.created_at.toISOString() })), null, 2));
  await c.end();
}
run();
