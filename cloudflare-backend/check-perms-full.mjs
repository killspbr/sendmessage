import pg from 'pg'
const { Client } = pg

const config = { 
  host: 'easypanel.soepinaobasta.com', 
  port: 5433, 
  user: 'clrodriguesuser', 
  password: '>:0fm3jcT77ZZjYMqqwb', 
  database: 'clrodrigues-db', 
  ssl: false 
}

const client = new Client(config)

async function run() {
  await client.connect()
  console.log('✅ Connected.')

  const perms = await client.query(`
    SELECT table_name, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE grantee = 'cf_hyperdrive' 
    AND table_schema = 'public'
    ORDER BY table_name, privilege_type
  `)
  
  console.log('--- PERMISSIONS FOR cf_hyperdrive ---')
  perms.rows.forEach(r => console.log(`${r.table_name}: ${r.privilege_type}`))
  
  const pg_crypto = await client.query(`SELECT extname FROM pg_extension WHERE extname = 'pgcrypto'`)
  console.log('pgcrypto extension:', pg_crypto.rows.length > 0 ? 'INSTALLED' : 'NOT INSTALLED')

  await client.end()
}

run().catch(err => { console.error('ERROR:', err.message); process.exit(1) })
