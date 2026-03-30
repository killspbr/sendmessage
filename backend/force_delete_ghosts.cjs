require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.VITE_DATABASE_URL || process.env.DATABASE_URL, ssl: true });
  await client.connect();
  try {
    const res = await client.query('UPDATE user_uploaded_files SET deleted_at = CURRENT_TIMESTAMP WHERE deleted_at IS NULL RETURNING id, original_name;');
    console.log("Deleted the following active items:");
    console.log(res.rows);
  } finally {
    await client.end();
  }
}
main().catch(console.error);
