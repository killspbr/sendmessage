import { query } from './db.js';
try {
  console.log('Adding user_id to scheduled_jobs if missing...');
  await query("ALTER TABLE scheduled_jobs ADD COLUMN IF NOT EXISTS user_id INTEGER");
  console.log('Updating user_id context...');
  await query("UPDATE scheduled_jobs sj SET user_id = c.user_id FROM campaigns c WHERE sj.campaign_id = c.id AND sj.user_id IS NULL");
  console.log('Success!');
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
