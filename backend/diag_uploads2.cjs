require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const client = new Client({ connectionString: process.env.VITE_DATABASE_URL || process.env.DATABASE_URL, ssl: true });
  await client.connect();
  try {
    const res = await client.query('SELECT id, user_id, original_name, storage_path, size_bytes, deleted_at FROM user_uploaded_files WHERE deleted_at IS NULL');
    fs.writeFileSync('db_active_uploads.json', JSON.stringify(res.rows, null, 2));
  } finally {
    await client.end();
  }
}
main().catch(console.error);
