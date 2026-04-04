import { query } from './db.js';
try {
  console.log('Fixing scheduled_jobs user_id type...');
  await query("ALTER TABLE scheduled_jobs DROP COLUMN IF EXISTS user_id");
  await query("ALTER TABLE scheduled_jobs ADD COLUMN user_id UUID REFERENCES users(id)");
  console.log('Success!');
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
