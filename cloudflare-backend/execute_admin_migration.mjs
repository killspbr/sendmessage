import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const { Client } = pg;

const password = '>:0fm3jcT77ZZjYMqqwb'; // Provided by user

const config = {
  user: 'clrodriguesuser',
  host: 'easypanel.soepinaobasta.com',
  database: 'sendmessage',
  password: password,
  port: 5433,
  ssl: { rejectUnauthorized: false }
};

async function run() {
  const client = new Client(config);
  try {
    console.log('--- Connecting as Admin ---');
    await client.connect();
    console.log('Connected!');

    const sqlPath = path.join(process.cwd(), 'FINAL_PRODUCTION_MIGRATION.sql');
    if (!fs.existsSync(sqlPath)) {
       // Try parent dir if running from subfolder
       const parentPath = path.join(process.cwd(), '..', 'FINAL_PRODUCTION_MIGRATION.sql');
       if (fs.existsSync(parentPath)) {
         var content = fs.readFileSync(parentPath, 'utf8');
       } else {
         throw new Error('FINAL_PRODUCTION_MIGRATION.sql not found');
       }
    } else {
       var content = fs.readFileSync(sqlPath, 'utf8');
    }

    console.log('Executing full migration SQL...');
    await client.query(content);
    console.log(' - OK');

    console.log('--- Migration Finished ---');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
