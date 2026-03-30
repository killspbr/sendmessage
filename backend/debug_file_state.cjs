const { Client } = require('pg');

async function check() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT id, original_name, storage_path, deleted_at 
      FROM user_uploaded_files 
      ORDER BY created_at DESC 
      LIMIT 30
    `);
    console.log('--- DATABASE SNAPSHOT (user_uploaded_files) ---');
    console.table(res.rows);
  } finally {
    await client.end();
  }
}

check().catch(console.error);
