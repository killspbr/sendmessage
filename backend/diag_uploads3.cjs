require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const client = new Client({ connectionString: process.env.VITE_DATABASE_URL || process.env.DATABASE_URL, ssl: true });
  await client.connect();
  try {
    const ids = ['903d6c73-96dc-4542-b9ad-4553e5e5bd24'];
    const userId = "f06eed91-f41e-49b4-8586-222783c4e461";

    const res = await client.query(
      `SELECT id, storage_path FROM user_uploaded_files WHERE user_id = $1 AND id = ANY($2::uuid[]) AND deleted_at IS NULL`,
      [userId, ids]
    );
    console.log("SELECT RESULT:");
    console.log(res.rows);

    const checkDelete = await client.query(
        `UPDATE user_uploaded_files
            SET deleted_at = CURRENT_TIMESTAMP
          WHERE user_id = $1 AND id = ANY($2::uuid[]) RETURNING *`,
        [userId, ids]
      )
    console.log("UPDATE RESULT:", checkDelete.rows.length);

  } finally {
    await client.end();
  }
}
main().catch(console.error);
