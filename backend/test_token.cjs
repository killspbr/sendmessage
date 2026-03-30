require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const client = new Client({ connectionString: process.env.VITE_DATABASE_URL || process.env.DATABASE_URL, ssl: true });
  await client.connect();
  try {
    const res = await client.query("SELECT * FROM user_uploaded_files WHERE public_token = 'b77a364fe8099f8d4a767cb76d33d2945f9c'");
    console.log(JSON.stringify(res.rows, null, 2));
    fs.writeFileSync('db_out_token.json', JSON.stringify(res.rows, null, 2));
  } finally {
    await client.end();
  }
}
main().catch(console.error);
