import { query } from './db.js';
try {
  const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'user_id'");
  console.log(res.rows[0]);
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
