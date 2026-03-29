const { Client } = require('pg');
const sql = "SELECT id, storage_path, created_at FROM user_uploaded_files WHERE created_at > '2026-03-29' ORDER BY created_at DESC LIMIT 5";
const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';

async function run() {
  const c = new Client({ connectionString });
  await c.connect();
  const r = await c.query(sql);
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
}
run();
