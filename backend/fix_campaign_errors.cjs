const { Client } = require('pg');
const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';

const OLD_HOST = 'clrodrigues-sendmessage-backend.rsybpi.easypanel.host';
const NEW_HOST = 'sendmessage-backend.claudio-rodrigues-seconci.workers.dev/api'; // The Cloudflare version already has /api in the base in some contexts or needs it in the URL.

// Wait, let's be precise.
// Old: https://clrodrigues-sendmessage-backend.rsybpi.easypanel.host/api/uploads/public
// New: https://sendmessage-backend.claudio-rodrigues-seconci.workers.dev/api/uploads/public

const OLD_BASE = 'https://clrodrigues-sendmessage-backend.rsybpi.easypanel.host/api/uploads/public';
const NEW_BASE = 'https://sendmessage-backend.claudio-rodrigues-seconci.workers.dev/api/uploads/public';

const MASTER_EVO_KEY = 'D4C6A8129EF5432CA71B0D583F2E9C15';

async function fixAll() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB.');

    // 1. Fix Evolution Config for the user
    console.log('Updating Evolution Config for claudiosorriso7@gmail.com...');
    await client.query(`
      UPDATE user_profiles 
         SET evolution_apikey = $1 
       WHERE id = (SELECT id FROM users WHERE email = 'claudiosorriso7@gmail.com')
    `, [MASTER_EVO_KEY]);

    // 2. Fix Media URLs in Campaign Payloads
    console.log('Updating Campaign Media URLs...');
    // We use REPLACE in SQL to update the JSON content string-wise if supported, or pull and update.
    // Since delivery_payload is JSONB, we can treat it as TEXT for a simple replace.
    const result = await client.query(`
      UPDATE campaigns 
         SET delivery_payload = CAST(REPLACE(CAST(delivery_payload AS TEXT), $1, $2) AS JSONB)
       WHERE delivery_payload IS NOT NULL 
         AND CAST(delivery_payload AS TEXT) LIKE $3
    `, [OLD_BASE, NEW_BASE, `%${OLD_BASE}%`]);

    console.log(`Updated ${result.rowCount} campaigns with new media URLs.`);

    console.log('Fix completed successfully.');
  } catch (err) {
    console.error('Error during fix:', err);
  } finally {
    await client.end();
  }
}

fixAll();
