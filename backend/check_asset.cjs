const { Client } = require('pg');
const sql = "SELECT id, stored_name, public_token, storage_path FROM user_uploaded_files WHERE public_token = '7d07824a31c89387b10344eb49e0953626dc' LIMIT 1";
const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';

async function run() {
  const c = new Client({ connectionString });
  await c.connect();
  const r = await c.query(sql);
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
}
run();
